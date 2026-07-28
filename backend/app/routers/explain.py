"""POST /api/exercise/explain — optional AI hint for a wrong answer.

Not required by the assignment. Kept in its own router so the rest of the app
has zero dependency on it (CLAUDE.md §2).
"""

from fastapi import APIRouter

from app.schemas import ExplainIn, ExplainOut
from app.services.ai import explain_mistake

router = APIRouter(prefix="/api/exercise", tags=["exercise"])


@router.post("/explain", response_model=ExplainOut)
def explain(body: ExplainIn):
    text, _source = explain_mistake(
        body.question, body.correct_answer, body.user_answer
    )
    return {"explanation": text}
