"""
UniSIRAJ CIA Helpdesk Agent - AI Administrative Assistant Tests
"""

import pytest


def test_assistant_query_expiring_30_days(client, sample_students, staff_headers):
    payload = {"query": "How many students have visas expiring within 30 days?"}
    response = client.post("/api/v1/assistant/chat", json=payload, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["intent"] == "EXPIRING_CRITICAL"
    assert len(data["matchedStudents"]) >= 1


def test_assistant_query_expired(client, sample_students, staff_headers):
    payload = {"query": "How many expired visas or overstay incidents do we have?"}
    response = client.post("/api/v1/assistant/chat", json=payload, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["intent"] == "EXPIRED_OVERSTAY"


def test_assistant_query_notifications(client, staff_headers):
    payload = {"query": "Summarize WhatsApp notification delivery status"}
    response = client.post("/api/v1/assistant/chat", json=payload, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["intent"] == "NOTIFICATION_METRICS"


def test_assistant_health(client):
    response = client.get("/api/v1/assistant/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database_connected"] is True
    assert len(data["tools_registered"]) >= 4
