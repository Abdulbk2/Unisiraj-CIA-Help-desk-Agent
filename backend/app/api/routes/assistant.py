"""
UniSIRAJ CIA Helpdesk Agent - AI Administrative Assistant API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.assistant import AgentQueryRequest, AgentQueryResponse, AssistantHealthResponse
from app.services.ai_agent_service import ai_agent_service
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_current_user

router = APIRouter(tags=["AI Administrative Assistant"])


@router.post("/assistant/chat", response_model=AgentQueryResponse)
@router.post("/agent/query", response_model=AgentQueryResponse)
def query_assistant(
    payload: AgentQueryRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Administrative AI Helpdesk Assistant query endpoint.
    Answers natural language queries strictly grounded in authorized database records.
    """
    question = payload.query or payload.question
    if not question or not question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty.",
        )

    response = ai_agent_service.query(
        db=db,
        question=question.strip(),
        user=current_user,
    )
    return response


@router.get("/assistant/health", response_model=AssistantHealthResponse)
def get_assistant_health(db: Session = Depends(get_db)):
    """
    Health and configuration inspection for AI Agent dependencies (without revealing secrets).
    """
    return ai_agent_service.get_health(db)
