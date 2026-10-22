"""
UniSIRAJ CIA Helpdesk Agent - Dashboard & Health Tests
"""

import pytest


def test_dashboard_summary(client, sample_students):
    # Test both /api/v1/dashboard/summary and compatibility /api/dashboard/summary
    for endpoint in ["/api/v1/dashboard/summary", "/api/dashboard/summary"]:
        response = client.get(endpoint)
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        assert data["metrics"]["totalStudents"] == 5
        assert data["metrics"]["expiredVisas"] == 1
        assert "whatsappDeliverySummary" in data
        assert data["dataSource"] == "LIVE_FASTAPI"


def test_system_health(client):
    for endpoint in ["/api/v1/health", "/api/health"]:
        response = client.get(endpoint)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ok", "degraded"]
        assert data["database_connected"] is True


def test_integration_status(client):
    for endpoint in ["/api/v1/integrations/status", "/api/integrations/status"]:
        response = client.get(endpoint)
        assert response.status_code == 200
        data = response.json()
        assert data["backendReachable"] is True
        assert "cloudRunRegion" in data
        assert data["environmentMode"] == "LIVE_FASTAPI"


def test_audit_logs(client, sample_students, auditor_headers):
    response = client.get("/api/v1/audit/logs", headers=auditor_headers)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
