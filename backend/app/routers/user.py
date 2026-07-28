"""GET /api/user/me — profile + live game state."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.deps import current_user
from app.schemas import UserOut
from app.services import progress

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Profile stats. Hearts are regenerated lazily as part of this read."""
    return progress.user_stats(db, user)
