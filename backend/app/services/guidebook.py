"""Builds a unit's guidebook from the exercises already seeded for it.

Kept out of `progress.py` on purpose: that module owns mutable game state (XP,
hearts, streak, unlocking), whereas this is a read-only view over static course
content. Nothing here touches the user.

No new tables or columns — the guidebook is *derived*, so it can never drift out
of sync with what the lessons actually teach:

  translate   -> the assembled sentence is a key phrase
  fill_blank  -> the sentence with its blank filled in is a key phrase

(The guidebook page shows key phrases only, so the other exercise types
contribute nothing here.)
"""

from app.models import ExerciseType, Unit

# A word-order exercise stores the hint the learner sees as its `prompt`, and
# every question-shaped hint in the curriculum starts with "Ask". Using the
# prompt rather than guessing from the sentence itself keeps this reliable —
# "Ask where the station is" is unambiguous, "Where is the station" needs a
# parser. Punctuation is presentation only; it isn't stored.
QUESTION_HINT_PREFIX = "ask"


def _terminal_punctuation(hint: str) -> str:
    return "?" if hint.strip().lower().startswith(QUESTION_HINT_PREFIX) else "."


def build_guidebook(unit: Unit) -> dict:
    """Key phrases for one unit, in curriculum order."""
    phrases: list[str] = []
    seen_phrases: set[str] = set()

    for skill in sorted(unit.skills, key=lambda s: s.order_index):
        for lesson in sorted(skill.lessons, key=lambda item: item.order_index):
            for exercise in sorted(lesson.exercises, key=lambda e: e.order_index):
                payload = exercise.payload

                if exercise.type is ExerciseType.translate:
                    sentence = " ".join(payload["correct_sequence"])
                    sentence += _terminal_punctuation(payload.get("prompt", ""))
                elif exercise.type is ExerciseType.fill_blank:
                    # The seeded sentence already carries its own punctuation.
                    sentence = payload["sentence"].replace("___", payload["correct"])
                else:
                    # The remaining types quiz single words, not sentences.
                    continue

                if sentence not in seen_phrases:
                    seen_phrases.add(sentence)
                    phrases.append(sentence)

    # "Food: Order at a café" -> "Order at a café", the heading the reference
    # puts above the phrase list.
    topic = unit.title.split(": ", 1)[-1]

    return {
        "unit_number": unit.order_index + 1,
        "topic": topic,
        "key_phrases": phrases,
    }
