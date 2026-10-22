"""
UniSIRAJ CIA Helpdesk Agent - Microsoft Excel Integration Tests
"""

import pytest
from app.services.excel_service import ExcelService


@pytest.fixture(autouse=True)
def setup_test_excel(tmp_path, monkeypatch):
    test_file = str(tmp_path / "unisiraj_students_master.xlsx")
    monkeypatch.setattr(ExcelService, "DEFAULT_EXCEL_PATH", test_file)
    ExcelService.ensure_master_excel_file(test_file)
    yield test_file


def test_excel_status(client):
    response = client.get("/api/v1/excel/status")
    assert response.status_code == 200
    data = response.json()
    assert data["is_connected"] is True
    assert "unisiraj_students_master.xlsx" in data["filename"]
    assert data["total_rows"] >= 10
    assert len(data["sheet_names"]) > 0


def test_excel_fetch_records(client):
    response = client.get("/api/v1/excel/records?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 5
    assert data["total_rows"] >= 10
    assert data["data"][0]["matric_id"] != ""
    assert data["data"][0]["student_name"] != ""


def test_excel_search_records(client):
    response = client.get("/api/v1/excel/search?q=Tariq")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] >= 1
    assert any("Tariq" in m["student_name"] for m in data["matches"])


def test_excel_analyze_spreadsheet(client, sample_students):
    response = client.get("/api/v1/excel/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "quality_metrics" in data
    assert "visa_status_distribution" in data
    assert "discrepancies" in data
    assert data["total_records"] >= 10


def test_excel_sync_excel_to_db(client, sample_students):
    response = client.post("/api/v1/excel/sync", json={"direction": "excel_to_db"})
    assert response.status_code == 200
    data = response.json()
    assert data["direction"] == "excel_to_db"
    assert data["status"] == "SUCCESS"
    assert data["total_processed"] > 0


def test_excel_sync_db_to_excel(client, sample_students):
    response = client.post("/api/v1/excel/sync", json={"direction": "db_to_excel"})
    assert response.status_code == 200
    data = response.json()
    assert data["direction"] == "db_to_excel"
    assert data["status"] == "SUCCESS"


def test_excel_download(client):
    response = client.get("/api/v1/excel/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 1000


def test_agent_query_excel_analyze(client):
    response = client.post("/api/v1/assistant/chat", json={"query": "Analyze the Excel spreadsheet for discrepancies"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "EXCEL_ANALYZE"
    assert "Excel" in data["answer"]


def test_agent_query_excel_search(client):
    response = client.post("/api/v1/assistant/chat", json={"query": "Search for Tariq in Excel master file"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "EXCEL_SEARCH"
    assert "Tariq" in data["answer"] or len(data["matchedStudents"]) > 0
