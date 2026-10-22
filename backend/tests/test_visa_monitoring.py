"""
UniSIRAJ CIA Helpdesk Agent - Visa Expiry Monitoring & Milestone Calculation Tests
"""

import pytest
from datetime import datetime, date, timedelta, timezone
from app.services.student_service import determine_student_status, calculate_days_remaining
from app.models.student import StudentStatus


def test_status_boundary_classifications():
    assert determine_student_status(120) == StudentStatus.SAFE
    assert determine_student_status(91) == StudentStatus.SAFE
    assert determine_student_status(90) == StudentStatus.ACTION_NEEDED
    assert determine_student_status(61) == StudentStatus.ACTION_NEEDED
    assert determine_student_status(60) == StudentStatus.URGENT
    assert determine_student_status(31) == StudentStatus.URGENT
    assert determine_student_status(30) == StudentStatus.CRITICAL
    assert determine_student_status(1) == StudentStatus.CRITICAL
    assert determine_student_status(0) == StudentStatus.CRITICAL
    assert determine_student_status(-1) == StudentStatus.EXPIRED
    assert determine_student_status(-50) == StudentStatus.EXPIRED
    assert determine_student_status(None) == StudentStatus.REVIEW_REQUIRED


def test_get_monitoring_summary(client, sample_students):
    response = client.get("/api/v1/visa-monitoring/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] == 5
    assert data["expired_count"] == 1
    assert data["critical_count"] == 1
    assert data["urgent_count"] == 1
    assert data["action_needed_count"] == 1
    assert data["safe_count"] == 1


def test_get_expiring_students(client, sample_students):
    response = client.get("/api/v1/visa-monitoring/expiring?within_days=30")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Expired (-10) and Critical (15)


def test_monitoring_preview(client, sample_students):
    response = client.post("/api/v1/visa-monitoring/preview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_candidates"] >= 1
    assert "candidates" in data


def test_monitoring_idempotency_run(client, sample_students, staff_headers):
    # 1. First run: should dispatch notifications
    res1 = client.post("/api/v1/visa-monitoring/run", headers=staff_headers)
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["notifications_created"] >= 1

    # 2. Second run: idempotency must skip already dispatched notifications
    res2 = client.post("/api/v1/visa-monitoring/run", headers=staff_headers)
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["notifications_created"] == 0
    assert d2["notifications_skipped_already_sent"] >= 1
