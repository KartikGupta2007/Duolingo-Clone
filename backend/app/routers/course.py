"""GET /api/course/path — the skill tree with per-skill status."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Skill, Unit, User
from app.routers.deps import current_user
from app.schemas import ChestOpenOut, GuidebookOut, PathOut
from app.services import guidebook, progress

router = APIRouter(prefix="/api/course", tags=["course"])


@router.get("/path", response_model=PathOut)
def read_path(user: User = Depends(current_user), db: Session = Depends(get_db)):
    path = progress.build_path(db, user)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No course found. Run `python seed.py` first.",
        )
    return path


@router.get("/units/{unit_id}/guidebook", response_model=GuidebookOut)
def read_guidebook(unit_id: int, db: Session = Depends(get_db)):
    """Key phrases and vocabulary for a unit.

    Static course content, so it takes no user and applies no gate — a learner
    can read any unit's guidebook, including one they haven't unlocked, which is
    how the reference behaves.
    """
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")

    return guidebook.build_guidebook(unit)


@router.post("/chest/{skill_id}/open", response_model=ChestOpenOut)
def open_chest(
    skill_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Open a reached treasure chest and pay out its gems.

    Answers 200 with `claimed=false` rather than an error when there's nothing to
    open — the path calls this as soon as it sees a reachable chest, so a repeat
    render or a second tab must be a no-op, not a failure.
    """
    skill = db.get(Skill, skill_id)
    if skill is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")
    return progress.claim_chest(db, user, skill)


@router.post("/units/{unit_id}/jump", response_model=PathOut)
def jump_to_unit(
    unit_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Skip ahead to a unit ("JUMP HERE?" on the path).

    Returns the refreshed path so the client can swap state in one round trip
    rather than unlocking and then re-fetching.
    """
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unit not found")

    progress.jump_to_unit(db, user, unit)
    return progress.build_path(db, user)
