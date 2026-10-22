"""
UniSIRAJ CIA Helpdesk Agent - Authentication & Authorization Tests
"""

import pytest
from app.core.security import verify_password, hash_password


def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_login_success(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "AdminSecurePassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user_role"] == "admin"
    assert data["user_email"] == admin_user.email


def test_login_invalid_password(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "WrongPassword999!"}
    )
    assert response.status_code == 401
    assert "detail" in response.json()


def test_get_current_user_me(client, admin_headers, admin_user):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_user.email
    assert data["role"] == "admin"


def test_unauthenticated_request_rejected(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_token_refresh(client, staff_headers):
    response = client.post("/api/v1/auth/refresh", headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
