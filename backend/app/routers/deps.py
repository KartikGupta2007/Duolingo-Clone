"""Shared route dependencies."""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services import progress


def current_user(db: Session = Depends(get_db)) -> User:
    """The single seeded learner. Stands in for auth (§2 — auth is mocked)."""
    user = progress.get_default_user(db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No default user found. Run `python seed.py` first.",
        )
    return user
