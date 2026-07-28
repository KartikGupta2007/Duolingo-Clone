"""POST /api/hearts/refill — mocked instant refill (§6)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.deps import current_user
from app.schemas import HeartsOut
from app.services import progress

router = APIRouter(prefix="/api/hearts", tags=["hearts"])


@router.post("/refill", response_model=HeartsOut)
def refill(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Refill to full immediately. Payments are explicitly out of scope (§10)."""
    progress.refill_hearts(db, user)
    return {"hearts": user.hearts, "max_hearts": progress.MAX_HEARTS}
