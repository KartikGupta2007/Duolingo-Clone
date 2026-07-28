"""All game-state logic lives here — XP, hearts, streak, skill unlocking.

Deliberately the *only* place these rules exist (CLAUDE.md §11). Route handlers
call into this module and serialise the result; they never do arithmetic on
user state themselves.
"""

from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

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

# ---------------------------------------------------------------------------
# Tunable game constants. All the "magic numbers" are here on purpose.
# ---------------------------------------------------------------------------
DEFAULT_USER_ID = 1

MAX_HEARTS = 5
# Losing a heart starts a timer; when it expires the *whole* bar comes back, not
# one heart at a time. `hearts_last_refill_at` is therefore the moment the bar
# last became full, i.e. when the current countdown started.
HEART_REFILL_HOURS = 5

XP_PER_LESSON = 10
# Replaying a skill that's already finished pays half. The reference labels the
# two buttons "START +10 XP" and "PRACTICE +5 XP", so the discount is a rule the
# UI reads off the server rather than a number the frontend invents.
XP_PER_PRACTICE = 5
XP_PERFECT_BONUS = 5  # awarded when mistake_count == 0
GEMS_PER_LESSON = 5
# What a unit's treasure chest pays out when it opens. Bigger than a lesson's
# handful, because a chest is the reward for clearing the three nodes before it.
CHEST_GEMS = 15

# --- Legendary -------------------------------------------------------------
# The hard challenge offered on a skill that's already finished. Three things
# make it "tough and long" rather than a relabelled practice run:
#
#   * twice the questions of a normal lesson, drawn from *every* lesson in the
#     skill rather than one, so it's a mixed review instead of a re-run;
#   * weighted to the productive exercise types — typing an answer is harder
#     than picking one, so `LEGENDARY_DIFFICULTY` sorts those to the front and
#     the easiest types fall off the end;
#   * a mistake allowance. Hearts are still spent as usual, but the Legendary
#     *badge* is only awarded if the run stays within the allowance, so a sloppy
#     pass earns the XP and not the status.
LEGENDARY_XP = 40
LEGENDARY_EXERCISES = 16
LEGENDARY_MISTAKE_ALLOWANCE = 3

# Higher is harder. Free typing beats assembling a sentence, which beats picking
# from options; matching pairs is the easiest and is the first to be dropped.
LEGENDARY_DIFFICULTY = {
    ExerciseType.type_answer: 5,
    ExerciseType.translate: 4,
    ExerciseType.fill_blank: 3,
    ExerciseType.multiple_choice: 2,
    ExerciseType.match_pairs: 1,
}

# Lessons the learner must finish before the leaderboard opens up. Enforced here
# and in the leaderboard route, so the gate can't be bypassed from the client.
#
# Counted per section, and this course has exactly one section (§7), so in
# practice that's "2 lessons anywhere in the course". Which unit they come from
# doesn't matter — two lessons in one unit or one each in two units both open it.
LEADERBOARD_UNLOCK_LESSONS = 2

# --- League ----------------------------------------------------------------
# One league, because there's one section of content (§7) — climbing between
# leagues would need a per-week XP table this schema doesn't have.
LEAGUE_NAME = "Bronze"
# Ranks inside the promotion zone. The reference's divider sits under 15th.
LEADERBOARD_PROMOTION_RANK = 15

# The other people on the leaderboard. Static on purpose: there is exactly one
# real user in this app, and the competitors exist only to give the league a
# shape — they never gain XP, so a users table row per bot bought nothing.
# Negative ids keep them from ever colliding with a real row id.
LEADERBOARD_BOTS: list[tuple[str, int]] = [
    ("Mehmet", 1420),
    ("Malena", 1180),
    ("Ana", 980),
    ("Farhod", 860),
    ("Talie", 780),
    ("Nor", 700),
    ("Diego", 640),
    ("Elmar", 560),
    ("Priya", 415),
    ("Asanka", 380),
    ("Udari", 330),
    ("Meilin", 290),
    ("Artem", 250),
    ("Domil", 210),
    ("Marcus", 190),
    ("Vaibhav", 150),
    ("Lova", 120),
    ("Tsitohaina", 96),
    ("Yuki", 75),
    ("Islam", 40),
]


# ---------------------------------------------------------------------------
# User lookup
# ---------------------------------------------------------------------------
def get_default_user(db: Session) -> Optional[User]:
    """No auth — every request acts as the single seeded learner (id=1)."""
    return db.get(User, DEFAULT_USER_ID)


# ---------------------------------------------------------------------------
# Hearts: lazy regeneration, computed on read. No cron job (§10).
# ---------------------------------------------------------------------------
def regen_hearts(db: Session, user: User) -> None:
    """Refill the bar to full once HEART_REFILL_HOURS have passed.

    Computed lazily on read rather than by a background job (§6), so the only
    state needed is the timestamp the bar was last full. All-or-nothing: the
    learner is either still waiting or back to MAX_HEARTS, with no partial
    credit, which is what "total life resets after 5 hours" means.
    """
    if user.hearts >= MAX_HEARTS:
        # Nothing to do, and deliberately no write: the refill clock is reset at
        # the moment hearts drop from full (complete_lesson / complete_legendary
        # / refill_hearts all set it), so refreshing it here would only turn
        # every GET into a SQLite write.
        return

    if utcnow() - user.hearts_last_refill_at >= timedelta(hours=HEART_REFILL_HOURS):
        user.hearts = MAX_HEARTS
        user.hearts_last_refill_at = utcnow()
        db.commit()


def seconds_until_refill(user: User) -> Optional[int]:
    """None when hearts are full, else whole seconds until the bar refills."""
    if user.hearts >= MAX_HEARTS:
        return None
    full_at = user.hearts_last_refill_at + timedelta(hours=HEART_REFILL_HOURS)
    return max(0, int((full_at - utcnow()).total_seconds()))


def refill_hearts(db: Session, user: User) -> User:
    """Mocked instant refill (§6). No gem cost — payments are out of scope."""
    user.hearts = MAX_HEARTS
    user.hearts_last_refill_at = utcnow()
    db.commit()
    return user


# ---------------------------------------------------------------------------
# Course structure helpers
# ---------------------------------------------------------------------------
def get_course(db: Session) -> Optional[Course]:
    """Single-course app — just return the first one (§10)."""
    return db.query(Course).order_by(Course.id).first()


def ordered_skills(db: Session, course_id: int) -> list[Skill]:
    """Every skill in the course, in the order a learner walks the path.

    Ordering is (unit.order_index, skill.order_index) — this flattened sequence
    is what the unlock rule steps through.
    """
    return (
        db.query(Skill)
        .join(Unit, Skill.unit_id == Unit.id)
        .filter(Unit.course_id == course_id)
        .order_by(Unit.order_index, Skill.order_index)
        .all()
    )


def ensure_progress_rows(db: Session, user: User) -> dict[int, UserSkillProgress]:
    """Guarantee one UserSkillProgress row per skill, keyed by skill_id.

    Makes the API resilient to content added after seeding: the very first
    skill defaults to `available`, everything else to `locked`.
    """
    course = get_course(db)
    if course is None:
        return {}

    skills = ordered_skills(db, course.id)
    existing = {
        p.skill_id: p
        for p in db.query(UserSkillProgress).filter(
            UserSkillProgress.user_id == user.id
        )
    }

    created = False
    for index, skill in enumerate(skills):
        if skill.id in existing:
            continue
        row = UserSkillProgress(
            user_id=user.id,
            skill_id=skill.id,
            status=SkillStatus.available if index == 0 else SkillStatus.locked,
            times_completed=0,
        )
        db.add(row)
        existing[skill.id] = row
        created = True

    if created:
        db.commit()
    return existing


# ---------------------------------------------------------------------------
# Lesson selection
# ---------------------------------------------------------------------------
def next_lesson_for_skill(
    skill: Skill, progress: UserSkillProgress
) -> tuple[Optional[Lesson], int, bool]:
    """Pick the lesson to serve next for a skill.

    Rule: `lesson_index = times_completed % lesson_count`. Straight through the
    lessons the first time; once the skill is completed it cycles back to
    lesson 0 as practice.

    Returns (lesson, lesson_index, is_practice).
    """
    lessons = skill.lessons  # relationship is ordered by order_index
    if not lessons:
        return None, 0, False

    index = progress.times_completed % len(lessons)
    is_practice = progress.times_completed >= len(lessons)
    return lessons[index], index, is_practice


# ---------------------------------------------------------------------------
# Treasure chest
# ---------------------------------------------------------------------------
def claim_chest(db: Session, user: User, skill: Skill) -> dict:
    """Open a unit's treasure chest and pay out its gems.

    A chest isn't played, it's collected: it becomes `available` under the normal
    unlock rule once the three nodes before it are done, and opening it is what
    marks it complete and reveals the node after.

    `times_completed` is deliberately left alone. It's the count that feeds the
    profile's lesson total and the leaderboard gate, and a chest is not a lesson —
    incrementing it would let a learner open chests to inflate both.

    Idempotent: a chest that's already open pays nothing and reports
    `claimed=False`, so a double-tap or a re-render can't mint gems.
    """
    rows = ensure_progress_rows(db, user)
    row = rows[skill.id]

    if skill.kind != SkillKind.chest or row.status != SkillStatus.available:
        return {"claimed": False, "unlocked_skill_title": None}

    user.gems += CHEST_GEMS
    row.status = SkillStatus.completed
    unlocked = unlock_next_skill(db, user, skill)
    db.commit()

    return {
        "claimed": True,
        "unlocked_skill_title": unlocked.title if unlocked else None,
    }


# ---------------------------------------------------------------------------
# Legendary
# ---------------------------------------------------------------------------
def _harden(exercise: Exercise) -> tuple[ExerciseType, dict]:
    """Strip the options off a recognition question, turning it into a typed one.

    This is where most of Legendary's extra difficulty comes from, and it costs
    no new content: the seeded `multiple_choice` and `fill_blank` payloads
    already carry a single unambiguous `correct` string, so the same question can
    be asked without the answer visible among three options. Picking "cat" from a
    list is recognition; typing it is recall.

    `translate`, `type_answer` and `match_pairs` are returned untouched —
    match_pairs has no single answer to type, and the other two are already
    productive.
    """
    payload = exercise.payload
    correct = payload.get("correct")

    if exercise.type == ExerciseType.multiple_choice and correct:
        return ExerciseType.type_answer, {
            "prompt": payload["question"],
            "correct": correct,
        }

    if exercise.type == ExerciseType.fill_blank and correct:
        return ExerciseType.type_answer, {
            "prompt": f"Type the missing word: {payload['sentence']}",
            "correct": correct,
        }

    return exercise.type, payload


def legendary_exercises(skill: Skill) -> list[dict]:
    """The question set for a skill's Legendary challenge.

    Pools every exercise in the skill — not just the one lesson a normal run
    serves — then sorts hardest-first and takes LEGENDARY_EXERCISES of them, so a
    skill with a surplus loses its easiest questions rather than its hardest.
    Where the skill has fewer than the challenge needs the pool cycles; walking
    forward through it never places the same exercise twice in a row, so the
    repeat isn't apparent while playing.

    Every question then goes through `_harden`, which is what makes it a
    challenge rather than a longer practice run.

    Returns plain dicts, not ORM rows: hardening rewrites `type` and `payload`,
    and doing that to a live `Exercise` would risk persisting the change back
    over the seeded content.

    Deterministic — no shuffling — so a reload serves the same challenge and the
    set can be reasoned about.
    """
    pool = [ex for lesson in skill.lessons for ex in lesson.exercises]
    if not pool:
        return []

    pool.sort(key=lambda ex: (-LEGENDARY_DIFFICULTY.get(ex.type, 0), ex.id))

    out: list[dict] = []
    for position in range(LEGENDARY_EXERCISES):
        exercise = pool[position % len(pool)]
        kind, payload = _harden(exercise)
        out.append({"id": exercise.id, "type": kind, "payload": payload})
    return out


def complete_legendary(
    db: Session,
    user: User,
    skill: Skill,
    correct_count: int,
    mistake_count: int,
) -> dict:
    """Award a finished Legendary run.

    Differs from `complete_lesson` in three ways, which is why it isn't a flag on
    that function:

      * pays LEGENDARY_XP rather than a lesson's rate;
      * does **not** touch `times_completed`, because a Legendary run isn't a
        lesson — counting it would inflate the profile's lesson total and the
        leaderboard gate;
      * grants the badge only when the run stayed inside the mistake allowance.

    Hearts and the streak behave exactly as they do for a lesson, so the two
    paths can't drift on the rules they do share.
    """
    regen_hearts(db, user)
    progress = ensure_progress_rows(db, user)[skill.id]

    is_perfect = mistake_count == 0
    earned = mistake_count <= LEGENDARY_MISTAKE_ALLOWANCE
    already = progress.is_legendary

    xp_earned = LEGENDARY_XP + (XP_PERFECT_BONUS if is_perfect else 0)
    user.xp_total += xp_earned
    user.gems += GEMS_PER_LESSON

    hearts_before = user.hearts
    user.hearts = max(0, user.hearts - mistake_count)
    hearts_lost = hearts_before - user.hearts
    if hearts_lost > 0 and hearts_before >= MAX_HEARTS:
        user.hearts_last_refill_at = utcnow()

    apply_streak(user)

    if earned:
        progress.is_legendary = True

    db.commit()

    attempted = correct_count + mistake_count
    accuracy = round(correct_count / attempted * 100) if attempted else 0

    return {
        "xp_earned": xp_earned,
        "xp_total": user.xp_total,
        "hearts": user.hearts,
        "hearts_lost": hearts_lost,
        "streak_count": user.streak_count,
        "accuracy": accuracy,
        "is_perfect": is_perfect,
        "legendary_earned": earned,
        "was_already_legendary": already,
        "mistake_allowance": LEGENDARY_MISTAKE_ALLOWANCE,
    }


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------
def apply_streak(user: User) -> bool:
    """Update the streak for activity happening today. Returns True if it grew.

    Same day  -> unchanged (already counted today)
    Yesterday -> +1
    Older/None-> reset to 1
    """
    now = today()
    last = user.last_activity_date

    if last == now:
        extended = False
    elif last == now - timedelta(days=1):
        user.streak_count += 1
        extended = True
    else:
        user.streak_count = 1
        extended = True

    user.last_activity_date = now
    return extended


# ---------------------------------------------------------------------------
# Unlocking
# ---------------------------------------------------------------------------
def jump_to_unit(db: Session, user: User, unit: Unit) -> Optional[Skill]:
    """Skip ahead: unlock a unit's first node without doing what precedes it.

    Deliberately only *unlocks*. It grants no XP and doesn't mark the skipped
    units complete, so a learner who jumps can still come back for them — and a
    jump can never inflate progress or the leaderboard gate.

    Idempotent: jumping to an already-reachable unit changes nothing.
    """
    rows = ensure_progress_rows(db, user)
    skills = sorted(unit.skills, key=lambda s: s.order_index)
    if not skills:
        return None

    first = skills[0]
    row = rows.get(first.id)
    if row is not None and row.status == SkillStatus.locked:
        row.status = SkillStatus.available
        db.commit()
    return first


def unlock_next_skill(
    db: Session, user: User, completed_skill: Skill
) -> Optional[Skill]:
    """Flip the skill after `completed_skill` from locked -> available.

    This is the one rule CLAUDE.md §4 says to enforce in code, not schema.
    """
    course = get_course(db)
    if course is None:
        return None

    skills = ordered_skills(db, course.id)
    ids = [s.id for s in skills]
    if completed_skill.id not in ids:
        return None

    position = ids.index(completed_skill.id)
    if position + 1 >= len(skills):
        return None  # last skill in the course

    next_skill = skills[position + 1]
    row = (
        db.query(UserSkillProgress)
        .filter(
            UserSkillProgress.user_id == user.id,
            UserSkillProgress.skill_id == next_skill.id,
        )
        .first()
    )
    if row is not None and row.status == SkillStatus.locked:
        row.status = SkillStatus.available
        return next_skill
    return None


# ---------------------------------------------------------------------------
# The main write path: everything that happens when a lesson is finished
# ---------------------------------------------------------------------------
def complete_lesson(
    db: Session,
    user: User,
    lesson: Lesson,
    correct_count: int,
    mistake_count: int,
) -> dict:
    """Award XP/gems, deduct hearts, roll the streak, advance skill progress.

    Single source of truth for game state — the frontend only renders what this
    returns.
    """
    # Credit pending regeneration before spending hearts, so a learner who was
    # away for an hour isn't charged against a stale balance.
    regen_hearts(db, user)

    skill = lesson.skill
    progress = ensure_progress_rows(db, user)[skill.id]

    # --- XP + gems -------------------------------------------------------
    # A skill already at `completed` can only be being replayed, which is what
    # the path offers as "PRACTICE" — worth half a first pass.
    is_practice = progress.status == SkillStatus.completed
    is_perfect = mistake_count == 0
    base_xp = XP_PER_PRACTICE if is_practice else XP_PER_LESSON
    xp_earned = base_xp + (XP_PERFECT_BONUS if is_perfect else 0)
    user.xp_total += xp_earned
    user.gems += GEMS_PER_LESSON

    # --- Hearts: one per mistake, floored at zero ------------------------
    hearts_before = user.hearts
    user.hearts = max(0, user.hearts - mistake_count)
    hearts_lost = hearts_before - user.hearts
    if hearts_lost > 0 and hearts_before >= MAX_HEARTS:
        # First loss from a full bar starts the regen clock now.
        user.hearts_last_refill_at = utcnow()

    # --- Streak ----------------------------------------------------------
    apply_streak(user)

    # --- Skill progress + unlock -----------------------------------------
    total_lessons = len(skill.lessons)
    was_completed = progress.status == SkillStatus.completed
    progress.times_completed += 1

    skill_completed_now = False
    unlocked: Optional[Skill] = None
    if not was_completed and progress.times_completed >= total_lessons:
        progress.status = SkillStatus.completed
        skill_completed_now = True
        unlocked = unlock_next_skill(db, user, skill)

    db.commit()

    attempted = correct_count + mistake_count
    accuracy = round(correct_count / attempted * 100) if attempted else 0

    return {
        "xp_earned": xp_earned,
        "xp_total": user.xp_total,
        "hearts": user.hearts,
        "hearts_lost": hearts_lost,
        "streak_count": user.streak_count,
        "accuracy": accuracy,
        "is_perfect": is_perfect,
        "skill_completed": skill_completed_now,
        "unlocked_skill_title": unlocked.title if unlocked else None,
    }


# ---------------------------------------------------------------------------
# Read models
# ---------------------------------------------------------------------------
def count_completed_lessons(rows: dict[int, UserSkillProgress]) -> int:
    """Lessons finished across the section.

    `times_completed` counts lesson completions per skill, so summing it gives
    the section total without needing a lessons-completed column. Practising an
    already-finished skill increments it, which is intended — a repeat is still
    a completed lesson.
    """
    return sum(row.times_completed for row in rows.values())


def league_days_remaining(today_date=None) -> int:
    """Whole days left in the league week, which ends at the close of Sunday.

    Derived from the date rather than stored: a league week is a calendar week,
    so there is nothing to persist. Monday leaves 6, Sunday leaves 0 (the last
    day).
    """
    weekday = (today_date or today()).weekday()  # Monday == 0
    return 6 - weekday


def build_leaderboard(db: Session, user: User) -> dict:
    """The league table, ranked by XP, plus the header the reference shows.

    Ranks on total XP rather than XP earned this week — the schema has no
    per-week counter, and adding one would be a bigger change than the
    leaderboard is worth. Documented in the README as an assumption.

    The competitors come from LEADERBOARD_BOTS rather than the users table:
    only the real user's XP ever changes, so the bots are compile-time data.
    """
    field = [(-(i + 1), name, xp) for i, (name, xp) in enumerate(LEADERBOARD_BOTS)]
    field.append((user.id, user.name, user.xp_total))
    # Sort by XP desc; the id tiebreak keeps equal-XP ordering stable.
    field.sort(key=lambda row: (-row[2], row[0]))
    return {
        "league": LEAGUE_NAME,
        "promotion_rank": LEADERBOARD_PROMOTION_RANK,
        "days_remaining": league_days_remaining(),
        "entries": [
            {
                "rank": index + 1,
                "user_id": row_id,
                "name": name,
                "xp_total": xp,
                "is_current_user": row_id == user.id,
            }
            for index, (row_id, name, xp) in enumerate(field)
        ],
    }


def is_leaderboard_unlocked(db: Session, user: User) -> bool:
    rows = ensure_progress_rows(db, user)
    return count_completed_lessons(rows) >= LEADERBOARD_UNLOCK_LESSONS


def user_stats(db: Session, user: User) -> dict:
    """Everything /api/user/me returns, including derived profile counters."""
    regen_hearts(db, user)
    rows = ensure_progress_rows(db, user)

    lessons_completed = count_completed_lessons(rows)

    return {
        # The path's node popovers label their buttons "+10 XP" / "+5 XP", and
        # the daily quest targets one lesson's worth. All three come from here so
        # the numbers can't drift from the ones the award paths actually pay.
        "xp_per_lesson": XP_PER_LESSON,
        "xp_per_practice": XP_PER_PRACTICE,
        "legendary_xp": LEGENDARY_XP,
        "leaderboard_unlock_lessons": LEADERBOARD_UNLOCK_LESSONS,
        "leaderboard_unlocked": lessons_completed >= LEADERBOARD_UNLOCK_LESSONS,
        "id": user.id,
        "name": user.name,
        "xp_total": user.xp_total,
        "streak_count": user.streak_count,
        "hearts": user.hearts,
        "max_hearts": MAX_HEARTS,
        "gems": user.gems,
        "last_activity_date": user.last_activity_date,
        "hearts_refill_in_seconds": seconds_until_refill(user),
        "lessons_completed": lessons_completed,
    }


def build_path(db: Session, user: User) -> Optional[dict]:
    """The units/skills tree with this user's per-skill status (§6)."""
    course = get_course(db)
    if course is None:
        return None

    rows = ensure_progress_rows(db, user)
    current_skill_id: Optional[int] = None
    units_out = []

    for unit in course.units:
        skills_out = []
        for skill in unit.skills:
            row = rows[skill.id]
            total = len(skill.lessons)
            done = min(row.times_completed, total)
            if current_skill_id is None and row.status == SkillStatus.available:
                current_skill_id = skill.id
            skills_out.append(
                {
                    "id": skill.id,
                    "title": skill.title,
                    "order_index": skill.order_index,
                    "status": row.status,
                    "kind": skill.kind,
                    "total_lessons": total,
                    "lessons_completed": done,
                    "progress": (done / total) if total else 0.0,
                    "is_legendary": row.is_legendary,
                }
            )
        units_out.append(
            {
                "id": unit.id,
                "title": unit.title,
                "order_index": unit.order_index,
                "skills": skills_out,
            }
        )

    return {"units": units_out, "current_skill_id": current_skill_id}
