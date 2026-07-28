"""SQLAlchemy engine / session / Base wiring.

SQLite is file-based so there is nothing to run: the DB is just
`backend/duolingo.db`, created on first use.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "duolingo.db"

# On a host like Render the SQLite file must live on the mounted persistent
# disk, so allow overriding the location via env var.
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    # FastAPI serves requests from a threadpool; SQLite needs this to allow a
    # connection created on one thread to be used on another.
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
