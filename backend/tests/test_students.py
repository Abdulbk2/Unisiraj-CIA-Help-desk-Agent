"""
UniSIRAJ CIA Helpdesk Agent - Student Record Management Tests
"""

import pytest
from datetime import datetime, date, timedelta, timezone


def test_list_students_paginated(client, sample_students):
    response = client.get("/api/v1/students?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["pagination"]["total"] == 5
    assert data["pagination"]["page"] == 1


def test_search_students(client, sample_students):
    response = client.get("/api/v1/students?search=Expired")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["matric_id"] == "TEST-EXP-001"


def test_create_student_success(client, staff_headers):
    exp_date = (datetime.now(timezone.utc).date() + timedelta(days=60)).isoformat()
    payload = {
        "matric_id": "UIS-NEW-999",
        "student_name": "New International Student",
        "email": "new.student@student.unisiraj.edu.my",
        "whatsapp_number": "+60129999999",
        "nationality": "Nigeria",
        "faculty": "Faculty of Computing",
        "visa_expiry_date": exp_date,
    }
    response = client.post("/api/v1/students", json=payload, headers=staff_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["matric_id"] == "UIS-NEW-999"
    assert data["student_name"] == "New International Student"


def test_create_duplicate_student_rejected(client, sample_students, staff_headers):
    payload = {
        "matric_id": "TEST-EXP-001",  # Already exists
        "student_name": "Duplicate Student Attempt",
        "email": "dup@student.unisiraj.edu.my",
    }
    response = client.post("/api/v1/students", json=payload, headers=staff_headers)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_student(client, sample_students, staff_headers):
    student = sample_students[0]
    payload = {"student_name": "Updated Name Tariq"}
    response = client.put(f"/api/v1/students/{student.id}", json=payload, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["student_name"] == "Updated Name Tariq"


def test_delete_student(client, sample_students, admin_headers):
    student = sample_students[-1]
    response = client.delete(f"/api/v1/students/{student.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify deleted
    get_res = client.get(f"/api/v1/students/{student.id}")
    assert get_res.status_code == 404
