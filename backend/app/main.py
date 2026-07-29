"""FastAPI app entrypoint.

Run with: uvicorn app.main:app --reload --port 8000
Interactive docs: http://localhost:8000/docs
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import course, explain, hearts, leaderboard, lesson, user

load_dotenv()

# Create tables if the DB file is missing, so a fresh clone doesn't 500 before
# seed.py has run. Content still comes from seed.py.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Duolingo Clone API",
    description=(
        "Backend for a Duolingo-style language-learning app. "
        "No auth — every request acts as the default learner (user id 1)."
    ),
    version="1.0.0",
)

# Comma-separated list, e.g. "http://localhost:3000,https://my-app.vercel.app".
# Both dev hostnames are allowed by default because the browser sends whichever
# one you typed as the Origin, and a mismatch fails as an opaque network error.
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(course.router)
app.include_router(lesson.router)
app.include_router(hearts.router)
app.include_router(leaderboard.router)
app.include_router(explain.router)  # optional AI route


# HEAD is included because uptime monitors (e.g. UptimeRobot) probe with HEAD,
# and FastAPI's @app.get registers only GET, so they'd get a 405 and report "down".
@app.api_route("/", methods=["GET", "HEAD"], tags=["health"])
def health():
    return {"status": "ok", "docs": "/docs"}
