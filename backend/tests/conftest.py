"""
UniSIRAJ CIA Helpdesk Agent - Test Fixtures & In-Memory Test Database
"""

import pytest
from datetime import datetime, date, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.student import Student, StudentStatus
from app.core.security import hash_password, Role, create_access_token
from app.core.config import settings

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def setup_test_settings():
    settings.TWILIO_PROVIDER = "mock"
    settings.BOOTSTRAP_ADMIN_ENABLED = False


@pytest.fixture
def db_session():
    """Create a fresh database schema for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin_test@unisiraj.edu.my",
        full_name="Admin Test User",
        password_hash=hash_password("AdminSecurePassword123!"),
        role=Role.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def staff_user(db_session):
    user = User(
        email="staff_test@unisiraj.edu.my",
        full_name="Staff Test User",
        password_hash=hash_password("StaffSecurePassword123!"),
        role=Role.STAFF,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auditor_user(db_session):
    user = User(
        email="auditor_test@unisiraj.edu.my",
        full_name="Auditor Test User",
        password_hash=hash_password("AuditorSecurePassword123!"),
        role=Role.AUDITOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(data={"sub": str(admin_user.id), "role": admin_user.role, "email": admin_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers(staff_user):
    token = create_access_token(data={"sub": str(staff_user.id), "role": staff_user.role, "email": staff_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auditor_headers(auditor_user):
    token = create_access_token(data={"sub": str(auditor_user.id), "role": auditor_user.role, "email": auditor_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_students(db_session):
    today = datetime.now(timezone.utc).date()
    students_data = [
        # Expired (-10 days)
        {"matric_id": "TEST-EXP-001", "name": "Expired Student", "days": -10, "phone": "+60111111111"},
        # Critical (15 days)
        {"matric_id": "TEST-CRIT-002", "name": "Critical Student", "days": 15, "phone": "+60122222222"},
        # Urgent (45 days)
        {"matric_id": "TEST-URG-003", "name": "Urgent Student", "days": 45, "phone": "+60133333333"},
        # Action needed (75 days)
        {"matric_id": "TEST-ACT-004", "name": "Action Needed Student", "days": 75, "phone": "+60144444444"},
        # Safe (120 days)
        {"matric_id": "TEST-SAFE-005", "name": "Safe Student", "days": 120, "phone": "+60155555555"},
    ]

    created = []
    for s in students_data:
        exp_date = today + timedelta(days=s["days"])
        st = Student(
            matric_id=s["matric_id"],
            student_name=s["name"],
            email=f"{s['matric_id'].lower()}@student.unisiraj.edu.my",
            whatsapp_number=s["phone"],
            visa_expiry_date=exp_date,
            status=StudentStatus.SAFE if s["days"] > 90 else (StudentStatus.EXPIRED if s["days"] < 0 else StudentStatus.CRITICAL),
            last_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(st)
        created.append(st)

    db_session.commit()
    for st in created:
        db_session.refresh(st)
    return created
