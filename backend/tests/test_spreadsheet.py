"""
UniSIRAJ CIA Helpdesk Agent - Spreadsheet Ingestion & Validation Tests
"""

import io
import pytest
from datetime import datetime, date, timedelta, timezone


def test_preview_spreadsheet_csv(client, staff_headers):
    csv_content = (
        "Matric ID,Student Name,Nationality,Phone Number,Passport No,Visa Expiry Date,Faculty,Program\n"
        "UIS-CSV-001,Ahmad Razak,Malaysia,+60123456789,A1234567,2026-11-20,Faculty of Law,LLB\n"
        "UIS-CSV-002,Fatima Yusuf,Nigeria,+60198765432,B2345678,2026-12-15,Faculty of IT,BSc\n"
    )
    files = {"file": ("test_students.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/imports/preview", files=files, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["totalRows"] == 2
    assert "Matric ID" in data["detectedHeaders"]
    assert len(data["previewRows"]) == 2


def test_validate_spreadsheet_records(client, sample_students, staff_headers):
    rows = [
        # Valid new student
        {
            "Matric ID": "UIS-VAL-001",
            "Student Name": "Valid Student",
            "Visa Expiry Date": "2026-11-30",
            "Phone Number": "+60112345678",
            "Nationality": "Yemen",
        },
        # Duplicate with database (TEST-EXP-001 from sample_students)
        {
            "Matric ID": "TEST-EXP-001",
            "Student Name": "Expired Student Updated",
            "Visa Expiry Date": "2026-12-31",
            "Phone Number": "+60111111111",
            "Nationality": "Nigeria",
        },
        # Missing required Matric ID
        {
            "Matric ID": "",
            "Student Name": "No Matric Student",
            "Visa Expiry Date": "2026-11-30",
            "Phone Number": "+60112345678",
        },
        # Malformed invalid date
        {
            "Matric ID": "UIS-VAL-002",
            "Student Name": "Bad Date Student",
            "Visa Expiry Date": "invalid-date-string",
            "Phone Number": "+60112345678",
        },
    ]

    response = client.post(
        "/api/v1/imports/validate",
        json={"rows": rows},
        headers=staff_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["totalRows"] == 4
    assert data["validRowsCount"] == 2  # 1 addition + 1 update
    assert data["invalidRowsCount"] == 2
    assert data["duplicateRowsCount"] == 1
    assert len(data["proposedAdditions"]) == 1
    assert len(data["proposedUpdates"]) == 1
    assert len(data["errors"]) >= 2


def test_confirm_spreadsheet_import(client, staff_headers):
    valid_addition = {
        "matricId": "UIS-CONFIRM-101",
        "fullName": "Committed Student",
        "visaExpiryDate": "2026-10-31",
        "phoneNumber": "+60119999888",
        "nationality": "Jordan",
    }
    val_response = {
        "totalRows": 1,
        "validRowsCount": 1,
        "invalidRowsCount": 0,
        "duplicateRowsCount": 0,
        "errors": [],
        "proposedAdditions": [valid_addition],
        "proposedUpdates": [],
    }
    response = client.post("/api/v1/imports/confirm", json=val_response, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["recordsCreated"] == 1

    # Verify student now exists in DB
    check = client.get("/api/v1/students?search=UIS-CONFIRM-101")
    assert check.status_code == 200
    assert len(check.json()["data"]) == 1
