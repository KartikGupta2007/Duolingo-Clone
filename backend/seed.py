"""Seed the SQLite database with course content and users.

Run from the `backend/` directory:

    python seed.py

Idempotent by construction — it drops and recreates every table, so re-running
never needs a manual DB delete (CLAUDE.md §9).

Content lives in `seed_content.py` as data; this module expands each unit
blueprint into skills, lessons and exercises so the ~220 exercises don't have to
be written out one at a time.
"""

import random
from datetime import timedelta

from app.database import Base, SessionLocal, engine
from app.models import (
    Course,
    Exercise,
    ExerciseType,
    Lesson,
    Skill,
    SkillKind,
    SkillStatus,
    Unit,
    User,
    UserSkillProgress,
)
from app.time_utils import today, utcnow
from seed_content import SKILL_PLAN, SKILLS_PER_UNIT, UNITS

MC = ExerciseType.multiple_choice
TR = ExerciseType.translate
MP = ExerciseType.match_pairs
FB = ExerciseType.fill_blank
TA = ExerciseType.type_answer

COURSE_TITLE = "English"

# Units the default learner starts with already finished. Three of thirteen, so
# the path opens part-way through and the leaderboard gate (2 units) is cleared.
UNITS_COMPLETED_AT_SEED = 3

# Questions per lesson. Deliberately above MAX_HEARTS (5) so a lesson can
# actually be failed — with three questions the heart bar was unloseable.
EXERCISES_PER_LESSON = 8

# Fixed seed so word banks are shuffled the same way on every run — a rebuilt
# database is byte-comparable, which makes debugging content much easier.
SHUFFLE = random.Random(20260728)

REQUIRED_KEYS = {
    MC: {"question", "options", "correct"},
    TR: {"prompt", "word_bank", "correct_sequence"},
    MP: {"pairs"},
    FB: {"sentence", "options", "correct"},
    TA: {"prompt", "correct"},
}


def validate_payload(exercise_type: ExerciseType, payload: dict) -> None:
    """Fail loudly here rather than in the UI if a blueprint has a typo."""
    missing = REQUIRED_KEYS[exercise_type] - payload.keys()
    if missing:
        raise ValueError(f"{exercise_type.value} payload missing keys: {missing}")

    if exercise_type in (MC, FB):
        if payload["correct"] not in payload["options"]:
            raise ValueError(
                f"{exercise_type.value}: correct answer {payload['correct']!r} "
                "is not among its options"
            )
        if len(set(payload["options"])) != len(payload["options"]):
            raise ValueError(f"{exercise_type.value}: duplicate options")
    if exercise_type is TR:
        extra = set(payload["correct_sequence"]) - set(payload["word_bank"])
        if extra:
            raise ValueError(f"translate: {extra} missing from word_bank")
    if exercise_type is MP and len(payload["pairs"]) < 2:
        raise ValueError("match_pairs needs at least two pairs")


def validate_vocab(title: str, vocab: list[tuple[str, str]]) -> None:
    """Guard the one content mistake that makes an exercise unanswerable.

    Vocabulary is asked for by definition, and distractors are drawn from the
    same unit — so two words in a unit sharing a definition would produce a
    question with two right answers. Cheaper to catch here than in the UI.
    """
    for label, values in (("words", [w for w, _ in vocab]), ("definitions", [d for _, d in vocab])):
        duplicates = {v for v in values if values.count(v) > 1}
        if duplicates:
            raise ValueError(f"{title}: duplicate {label} in vocab: {duplicates}")


# ---------------------------------------------------------------------------
# Exercise builders — one per type, each returning (type, payload)
# ---------------------------------------------------------------------------
def multiple_choice(vocab: list[tuple[str, str]], index: int):
    """Ask for a word by its definition, with two distractors from the same unit."""
    word, meaning = vocab[index]
    distractors = [
        other for offset in (1, 2) for other, _ in [vocab[(index + offset) % len(vocab)]]
    ]
    return MC, {
        "question": f"Which word means '{meaning}'?",
        "options": [word, *distractors],
        "correct": word,
    }


def type_answer(vocab: list[tuple[str, str]], index: int):
    word, meaning = vocab[index]
    return TA, {
        "prompt": f"Type the word that means '{meaning}'",
        "correct": word,
    }


def match_pairs(vocab: list[tuple[str, str]], start: int, count: int = 4):
    pairs = [
        {"left": word, "right": meaning}
        for word, meaning in vocab[start : start + count]
    ]
    return MP, {"pairs": pairs}


def word_order(entry: tuple[str, list[str], list[str]]):
    """A word-order exercise.

    Stored as the `translate` type: the payload shape in §5 is exactly what this
    needs (a hint, a word bank and the expected sequence), so repurposing it
    avoids adding an enum value for what is the same interaction.
    """
    hint, sequence, distractors = entry
    bank = [*sequence, *distractors]
    SHUFFLE.shuffle(bank)
    return TR, {
        "prompt": hint,
        "word_bank": bank,
        "correct_sequence": sequence,
    }


def fill_blank(entry: tuple[str, list[str], str]):
    sentence, options, correct = entry
    return FB, {"sentence": sentence, "options": options, "correct": correct}


def skill_title(kind: str, blueprint: dict) -> str:
    """The name shown in a node's popover, following the reference.

    Both lesson nodes take the unit's *topic* — the part of the unit title after
    the colon — so a unit called "Food: Order at a café" has two nodes named
    "Order at a café". Only the story node is named individually; the remaining
    three are fixed roles rather than content.
    """
    topic = blueprint["title"].split(": ", 1)[-1]
    return {
        "lesson": topic,
        "story": blueprint["story"],
        "chest": "Treasure chest",
        "practice": "Practice",
        "review": "Unit review",
    }[kind]


def exercise_pool(unit: dict) -> list:
    """Every distinct exercise a unit's content can produce, interleaved by type.

    Eight vocabulary words plus two word-order and two fill-blank sentences yield
    23 distinct exercises. They're emitted round-robin across the five types, so
    any run of consecutive items is already mixed — that's what lets a lesson be
    a plain slice of this list and still feel varied.
    """
    vocab = unit["vocab"]
    by_type: list[list] = [
        [multiple_choice(vocab, i) for i in range(len(vocab))],
        [type_answer(vocab, i) for i in range(len(vocab))],
        # Three overlapping windows of four pairs across the eight words.
        [match_pairs(vocab, start) for start in (0, 2, 4)],
        [word_order(entry) for entry in unit["order"]],
        [fill_blank(entry) for entry in unit["fill"]],
    ]

    pool: list = []
    for position in range(max(len(items) for items in by_type)):
        for items in by_type:
            if position < len(items):
                pool.append(items[position])
    return pool


def lesson_ordinal(skill_index: int, lesson_index: int) -> int:
    """This lesson's position among all of its unit's lessons (0-6)."""
    return sum(count for _, count in SKILL_PLAN[:skill_index]) + lesson_index


def build_lessons_for_skill(unit: dict, skill_index: int) -> list[list]:
    """Exercises for one node, grouped into lessons.

    Every lesson is EXERCISES_PER_LESSON long. That number matters to the game
    rules, not just to pacing: hearts cap at 5, so a three-question lesson could
    never be failed and the heart mechanic was decorative. Eight questions means
    running out is reachable.

    Each lesson takes a different slice of its unit's pool, so the seven lessons
    in a unit don't ask the same eight questions. The slices overlap — 23 distinct
    exercises can't fill 7 x 8 uniquely — which is fine, and is roughly how a
    real course revisits vocabulary anyway.
    """
    pool = exercise_pool(unit)
    _, lesson_count = SKILL_PLAN[skill_index]

    lessons: list[list] = []
    for lesson_index in range(lesson_count):
        start = (lesson_ordinal(skill_index, lesson_index) * 3) % len(pool)
        lessons.append(
            [pool[(start + offset) % len(pool)] for offset in range(EXERCISES_PER_LESSON)]
        )
    return lessons


def seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        course = Course(title=COURSE_TITLE)
        db.add(course)
        db.flush()

        ordered_skills: list[Skill] = []
        lesson_count = 0
        exercise_count = 0

        for unit_index, blueprint in enumerate(UNITS):
            validate_vocab(blueprint["title"], blueprint["vocab"])
            unit = Unit(
                course_id=course.id,
                title=blueprint["title"],
                order_index=unit_index,
            )
            db.add(unit)
            db.flush()

            for skill_index, (kind, expected_lessons) in enumerate(SKILL_PLAN):
                skill = Skill(
                    unit_id=unit.id,
                    title=skill_title(kind, blueprint),
                    order_index=skill_index,
                    kind=SkillKind(kind),
                )
                db.add(skill)
                db.flush()
                ordered_skills.append(skill)

                built = build_lessons_for_skill(blueprint, skill_index)
                if len(built) != expected_lessons:
                    raise ValueError(
                        f"{blueprint['title']} · {kind}: SKILL_PLAN expects "
                        f"{expected_lessons} lesson(s) but the builder made {len(built)}"
                    )

                for lesson_index, exercises in enumerate(built):
                    lesson = Lesson(skill_id=skill.id, order_index=lesson_index)
                    db.add(lesson)
                    db.flush()
                    lesson_count += 1

                    for order, (exercise_type, payload) in enumerate(exercises):
                        validate_payload(exercise_type, payload)
                        db.add(
                            Exercise(
                                lesson_id=lesson.id,
                                order_index=order,
                                type=exercise_type,
                                payload=payload,
                            )
                        )
                        exercise_count += 1

        # --- Default learner (id 1) --------------------------------------
        # last_activity_date is yesterday, so the first lesson completed today
        # extends the streak — handy for demoing the streak rule.
        learner = User(
            id=1,
            name="Kartik",
            xp_total=430,
            streak_count=4,
            last_activity_date=today() - timedelta(days=1),
            hearts=5,
            hearts_last_refill_at=utcnow(),
            gems=145,
        )
        db.add(learner)
        db.flush()

        # First N units complete; the next unit's first node becomes available
        # and everything after it stays locked.
        completed_skills = UNITS_COMPLETED_AT_SEED * SKILLS_PER_UNIT
        for position, skill in enumerate(ordered_skills):
            if position < completed_skills:
                status = SkillStatus.completed
                times = len(skill.lessons)
            elif position == completed_skills:
                status, times = SkillStatus.available, 0
            else:
                status, times = SkillStatus.locked, 0

            db.add(
                UserSkillProgress(
                    user_id=learner.id,
                    skill_id=skill.id,
                    status=status,
                    times_completed=times,
                )
            )

        # No bot users: the leaderboard's competitors are static data in
        # services/progress.py (LEADERBOARD_BOTS), because only the one real
        # learner's XP ever changes.
        db.commit()

        print("Seeded database:")
        print(f"  course     : {course.title} (1 section)")
        print(f"  units      : {len(UNITS)}")
        print(f"  skills     : {len(ordered_skills)}")
        print(f"  lessons    : {lesson_count}")
        print(f"  exercises  : {exercise_count}")
        print("  users      : 1 (leaderboard competitors are static)")
        print(
            f"  default learner: {learner.name} — "
            f"{UNITS_COMPLETED_AT_SEED} of {len(UNITS)} units complete, "
            f"{learner.xp_total} XP, {learner.streak_count}-day streak"
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
