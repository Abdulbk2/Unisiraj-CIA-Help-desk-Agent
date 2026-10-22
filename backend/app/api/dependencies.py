"""
UniSIRAJ CIA Helpdesk Agent - API Security & Dependency Injection
"""

from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token, Role
from app.core.config import settings
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """Validate bearer token and resolve authenticated user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identification.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact CIA administrator.",
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Soft auth dependency returning None if unauthenticated."""
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except Exception:
        return None


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(self.allowed_roles)}. Your role: {user.role}.",
            )
        return user


require_admin = RoleChecker([Role.ADMIN])
require_staff = RoleChecker([Role.ADMIN, Role.STAFF])
require_auditor = RoleChecker([Role.ADMIN, Role.STAFF, Role.AUDITOR])


def verify_scheduler_or_admin(
    x_scheduler_token: Optional[str] = Header(None, alias="X-Scheduler-Token"),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Allows authentication either via Cloud Scheduler shared secret header OR via admin JWT.
    """
    # Check scheduler token if configured
    if x_scheduler_token and x_scheduler_token == settings.JWT_SECRET_KEY:
        return None  # Authenticated as system scheduler

    # Otherwise authenticate as admin/staff
    if credentials:
        user = get_current_user(credentials, db)
        if user.role in [Role.ADMIN, Role.STAFF]:
            return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized. A valid staff session or scheduler token is required.",
    )
