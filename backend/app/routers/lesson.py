"""Lesson player endpoints: start a lesson, and record its result."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lesson, Skill, SkillStatus, User
from app.routers.deps import current_user
from app.schemas import (
    LegendaryCompleteOut,
    LegendaryStartOut,
    LessonCompleteIn,
    LessonCompleteOut,
    LessonStartOut,
)
from app.services import progress

router = APIRouter(prefix="/api/lesson", tags=["lesson"])


@router.get("/{skill_id}/start", response_model=LessonStartOut)
def start_lesson(
    skill_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Ordered exercises for the next (or practice) lesson in this skill."""
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")

    progress.regen_hearts(db, user)
    row = progress.ensure_progress_rows(db, user)[skill.id]

    if row.status == SkillStatus.locked:
        raise HTTPException(
            status.HTTP_423_LOCKED,
            "This skill is locked. Complete the previous skill first.",
        )

    lesson, _, is_practice = progress.next_lesson_for_skill(skill, row)
    if lesson is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "This skill has no lessons yet."
        )

    return {
        "lesson_id": lesson.id,
        "skill_title": skill.title,
        "is_practice": is_practice,
        "hearts": user.hearts,
        "exercises": lesson.exercises,
    }


@router.get("/{skill_id}/legendary", response_model=LegendaryStartOut)
def start_legendary(
    skill_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """The Legendary challenge for a finished skill.

    Only offered once the skill is completed — that's the whole premise, so it's
    a 423 rather than a 403: the challenge exists, it just isn't open yet.
    Replayable after being beaten, which is why an existing badge isn't a block.
    """
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")

    progress.regen_hearts(db, user)
    row = progress.ensure_progress_rows(db, user)[skill.id]

    if row.status != SkillStatus.completed:
        raise HTTPException(
            status.HTTP_423_LOCKED,
            "Legendary opens once you've completed every lesson in this skill.",
        )

    exercises = progress.legendary_exercises(skill)
    if not exercises:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "This skill has no exercises yet."
        )

    return {
        "skill_title": skill.title,
        "hearts": user.hearts,
        "mistake_allowance": progress.LEGENDARY_MISTAKE_ALLOWANCE,
        "exercises": exercises,
    }


@router.post("/{skill_id}/legendary/complete", response_model=LegendaryCompleteOut)
def complete_legendary(
    skill_id: int,
    body: LessonCompleteIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Record a finished Legendary run.

    Keyed on the *skill*, not a lesson: the challenge draws from every lesson in
    the skill, so no single lesson id describes it.
    """
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")

    row = progress.ensure_progress_rows(db, user)[skill.id]
    if row.status != SkillStatus.completed:
        raise HTTPException(
            status.HTTP_423_LOCKED, "This skill's Legendary challenge isn't open."
        )

    # Same guard as a lesson: a client can't claim more answers than it was given.
    limit = progress.LEGENDARY_EXERCISES
    if body.correct_count + body.mistake_count > limit:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Reported {body.correct_count + body.mistake_count} answers but the "
            f"Legendary challenge only has {limit} exercises.",
        )

    return progress.complete_legendary(
        db, user, skill, body.correct_count, body.mistake_count
    )


@router.post("/{lesson_id}/complete", response_model=LessonCompleteOut)
def complete_lesson(
    lesson_id: int,
    body: LessonCompleteIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Apply all game-state changes for a finished lesson.

    The frontend calls this once, after the last exercise. Every rule lives in
    `services/progress.py`; this handler only validates and serialises.
    """
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")

    row = progress.ensure_progress_rows(db, user)[lesson.skill_id]
    if row.status == SkillStatus.locked:
        raise HTTPException(
            status.HTTP_423_LOCKED, "This skill is locked."
        )

    exercise_count = len(lesson.exercises)
    if body.correct_count + body.mistake_count > exercise_count:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Reported {body.correct_count + body.mistake_count} answers but "
            f"this lesson only has {exercise_count} exercises.",
        )

    return progress.complete_lesson(
        db, user, lesson, body.correct_count, body.mistake_count
    )
