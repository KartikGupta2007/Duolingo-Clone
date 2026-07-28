"""GET /api/leaderboard — seeded users ranked by XP."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.deps import current_user
from app.schemas import LeaderboardOut
from app.services import progress

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardOut)
def read_leaderboard(
    user: User = Depends(current_user), db: Session = Depends(get_db)
):
    """Gated until the learner has finished LEADERBOARD_UNLOCK_LESSONS lessons.

    Enforced here as well as in the UI — the gate is a business rule, so it
    lives server-side (§6) rather than being a frontend-only condition.
    """
    if not progress.is_leaderboard_unlocked(db, user):
        raise HTTPException(
            status.HTTP_423_LOCKED,
            f"Complete {progress.LEADERBOARD_UNLOCK_LESSONS} lessons to start competing.",
        )

    return progress.build_leaderboard(db, user)
