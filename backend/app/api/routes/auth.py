"""
UniSIRAJ CIA Helpdesk Agent - Authentication API Endpoints
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserResponse, PasswordChangeRequest
from app.core.security import verify_password, hash_password, create_access_token
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate CIA staff and issue a signed JWT access token.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        AuditService.log_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="USER",
            details={"email": payload.email},
            ip_address=request.client.host if request.client else None,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact CIA administrator.",
        )

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email},
        expires_delta=expires_delta,
    )

    AuditService.log_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
    )

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_role=user.role,
        user_name=user.full_name,
        user_email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user.
    """
    return current_user


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refresh active JWT access token.
    """
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": str(current_user.id), "role": current_user.role, "email": current_user.email},
        expires_delta=expires_delta,
    )
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_role=current_user.role,
        user_name=current_user.full_name,
        user_email=current_user.email,
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Client-side token invalidation and audit logout event.
    """
    AuditService.log_event(
        db=db,
        action="LOGOUT",
        resource_type="USER",
        user_id=current_user.id,
    )
    return {"success": True, "message": "Successfully logged out."}
