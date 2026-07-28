"""Pydantic models — these double as the API request/response contract.

Kept in one file so the whole contract is readable at a glance; the frontend's
`lib/types.ts` mirrors these one-for-one.

Every field here is consumed by the frontend. That's not aspiration but the
maintenance rule for this file: the mirror types were stripped field-by-field
and `tsc` re-run to prove which ones the UI actually touches, and the ~30 that
compiled away cleanly were then removed end-to-end (schema, service output,
seed). If you add a field, the frontend should be about to read it.
"""

from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import ExerciseType, SkillKind, SkillStatus


# --------------------------------------------------------------------------
# GET /api/user/me
# --------------------------------------------------------------------------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    xp_total: int
    streak_count: int
    hearts: int
    max_hearts: int
    gems: int
    # Drives the streak calendar and the daily quest ("practised today?").
    last_activity_date: Optional[date]
    # None when hearts are already full. Seconds until the whole bar refills —
    # hearts are all-or-nothing, so there is no "next heart" to count down to.
    hearts_refill_in_seconds: Optional[int]
    # Feeds the daily quest and the leaderboard gate copy.
    lessons_completed: int
    # XP the server awards, so the path's buttons and the daily quest can label
    # themselves without hardcoding numbers that might drift.
    xp_per_lesson: int
    xp_per_practice: int
    legendary_xp: int
    # The leaderboard gate, derived server-side so the rail's card and the
    # route's 423 always agree.
    leaderboard_unlock_lessons: int
    leaderboard_unlocked: bool


# --------------------------------------------------------------------------
# GET /api/course/path
# --------------------------------------------------------------------------
class SkillOut(BaseModel):
    id: int
    title: str
    order_index: int
    status: SkillStatus
    kind: SkillKind
    total_lessons: int
    lessons_completed: int
    # 0.0 -> 1.0, drives the progress ring on the path node.
    progress: float
    # True once the skill's Legendary challenge has been beaten.
    is_legendary: bool


class UnitOut(BaseModel):
    id: int
    title: str
    order_index: int
    skills: list[SkillOut]


class PathOut(BaseModel):
    units: list[UnitOut]
    # The skill the "START" pill floats above — first `available` skill.
    current_skill_id: Optional[int]


# --------------------------------------------------------------------------
# GET /api/lesson/{skill_id}/start
# --------------------------------------------------------------------------
class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: ExerciseType
    # Shape depends on `type` — five variants, documented in lib/types.ts.
    payload: dict[str, Any]


class LessonStartOut(BaseModel):
    lesson_id: int
    skill_title: str
    # True when the skill is already completed and this is a practice replay.
    is_practice: bool
    hearts: int
    exercises: list[ExerciseOut]


# --------------------------------------------------------------------------
# POST /api/lesson/{lesson_id}/complete
# --------------------------------------------------------------------------
class LessonCompleteIn(BaseModel):
    correct_count: int = Field(ge=0)
    mistake_count: int = Field(ge=0)


class LessonCompleteOut(BaseModel):
    xp_earned: int
    xp_total: int
    hearts: int
    hearts_lost: int
    streak_count: int
    accuracy: int  # percent, 0-100
    is_perfect: bool
    skill_completed: bool
    unlocked_skill_title: Optional[str]


# --------------------------------------------------------------------------
# POST /api/course/chest/{skill_id}/open
# --------------------------------------------------------------------------
class ChestOpenOut(BaseModel):
    # False when the chest was already open, or isn't a chest / isn't reachable.
    # The route still answers 200 so a repeat render is harmless.
    claimed: bool
    unlocked_skill_title: Optional[str]


# --------------------------------------------------------------------------
# GET /api/lesson/{skill_id}/legendary
# --------------------------------------------------------------------------
class LegendaryStartOut(BaseModel):
    skill_title: str
    hearts: int
    # How many mistakes may be made and still earn the badge.
    mistake_allowance: int
    exercises: list[ExerciseOut]


# --------------------------------------------------------------------------
# POST /api/lesson/{skill_id}/legendary/complete
# --------------------------------------------------------------------------
class LegendaryCompleteOut(BaseModel):
    xp_earned: int
    xp_total: int
    hearts: int
    hearts_lost: int
    streak_count: int
    accuracy: int  # percent, 0-100
    is_perfect: bool
    # False when the run went over the mistake allowance: the XP is still paid,
    # the badge isn't.
    legendary_earned: bool
    was_already_legendary: bool
    mistake_allowance: int


# --------------------------------------------------------------------------
# POST /api/hearts/refill
# --------------------------------------------------------------------------
class HeartsOut(BaseModel):
    hearts: int
    max_hearts: int


# --------------------------------------------------------------------------
# GET /api/leaderboard
# --------------------------------------------------------------------------
class LeaderboardOut(BaseModel):
    """The league table plus its header."""

    league: str
    # Ranks at or above this advance — the "PROMOTION ZONE" divider sits under it.
    promotion_rank: int
    # Whole days until the league week closes (end of Sunday).
    days_remaining: int
    entries: list["LeaderboardEntry"]


class LeaderboardEntry(BaseModel):
    rank: int
    # Stable row identity for the UI; bots use negative ids so they can never
    # collide with the real user's.
    user_id: int
    name: str
    xp_total: int
    is_current_user: bool


# --------------------------------------------------------------------------
# POST /api/exercise/explain  (optional, AI-backed)
# --------------------------------------------------------------------------
class ExplainIn(BaseModel):
    # Length caps: this route reaches a paid model, and prompts assembled from
    # seeded exercises are all far below these. Anything bigger isn't ours.
    question: str = Field(max_length=500)
    correct_answer: str = Field(max_length=200)
    # Optional: the exercise components only report `isCorrect`, not the text
    # the learner entered, so the frontend usually leaves this empty.
    user_answer: str = Field(default="", max_length=200)


class ExplainOut(BaseModel):
    explanation: str


# --------------------------------------------------------------------------
# GET /api/course/units/{unit_id}/guidebook
# --------------------------------------------------------------------------
class GuidebookOut(BaseModel):
    unit_number: int
    # The unit title without its category prefix, used as the section heading.
    topic: str
    # Derived from the unit's own exercises, so the guidebook always matches
    # what its lessons actually teach — see services/guidebook.py.
    key_phrases: list[str]
