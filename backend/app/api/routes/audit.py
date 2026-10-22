"""
UniSIRAJ CIA Helpdesk Agent - Audit Log API Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.api.dependencies import require_auditor, get_optional_current_user

router = APIRouter(prefix="/audit", tags=["Security Audit Logs"])


@router.get("/logs", response_model=AuditLogListResponse)
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List security and administrative audit event entries.
    """
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    total = query.count()
    records = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    data = []
    for r in records:
        entry = AuditLogResponse(
            id=r.id,
            user_id=r.user_id,
            user_email=r.user.email if r.user else None,
            action=r.action,
            resource_type=r.resource_type,
            resource_id=r.resource_id,
            details=r.details,
            ip_address=r.ip_address,
            timestamp=r.timestamp,
        )
        data.append(entry)

    return AuditLogListResponse(data=data, total=total)
