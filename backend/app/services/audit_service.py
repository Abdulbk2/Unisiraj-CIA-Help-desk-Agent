"""
UniSIRAJ CIA Helpdesk Agent - Audit Logging Service
"""

import json
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.core.logging import logger


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        resource_type: str,
        user_id: Optional[int] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Record a security or administrative audit event.
        Guarantees that sensitive data (passwords, tokens, API keys) are never logged.
        """
        sanitized_details = None
        if details:
            # Strip potential sensitive keys
            clean = {
                k: v for k, v in details.items()
                if k.lower() not in {"password", "token", "secret", "authorization", "api_key", "jwt"}
            }
            try:
                sanitized_details = json.dumps(clean, default=str)
            except Exception:
                sanitized_details = str(clean)

        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=sanitized_details,
            ip_address=ip_address,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(entry)
        try:
            db.commit()
            db.refresh(entry)
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to record audit log: {e}")
        return entry
