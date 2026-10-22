"""
UniSIRAJ CIA Helpdesk Agent - AI Administrative Assistant Schemas
"""

from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class AgentQueryRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    sessionId: Optional[str] = None
    includeStudentData: bool = True
    filterByFaculty: Optional[str] = None
    filterByTier: Optional[str] = None


class AgentQueryResponse(BaseModel):
    answer: str
    query: Optional[str] = None
    intent: str = "GENERAL_COMPLIANCE"
    confidence: float = 0.95
    dataFreshness: str = "Live authoritative database state"
    matchedStudents: Optional[List[Any]] = []
    suggestedFollowups: Optional[List[str]] = []
    executionTimeMs: Optional[int] = 0
    dataSource: str = "LIVE_FASTAPI"
    conversation_id: Optional[str] = None


class AssistantHealthResponse(BaseModel):
    status: str  # healthy, degraded, unconfigured
    gemini_model: str
    gemini_configured: bool
    database_connected: bool
    tools_registered: List[str]
