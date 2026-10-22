"""
UniSIRAJ CIA Helpdesk Agent - WhatsApp Notifications & Webhook Tests
"""

import pytest
from app.models.notification import NotificationStatus


def test_get_eligible_notifications(client, sample_students):
    response = client.get("/api/v1/notifications/eligible")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3  # Expired, 15d, 45d, 75d
    tiers = [item["tier"] for item in data]
    assert "OVERDUE_ALERT" in tiers
    assert "TIER_3_30_DAYS" in tiers


def test_send_whatsapp_notification(client, sample_students, staff_headers):
    student = sample_students[1]  # Critical student (15 days)
    payload = {
        "student_id": student.id,
        "tier": "TIER_3_30_DAYS",
        "customNote": "Please bring your original passport.",
    }
    response = client.post("/api/v1/notifications/send", json=payload, headers=staff_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["providerSid"] is not None
    assert data["status"] in ["DELIVERED", "SENT"]


def test_duplicate_send_prevention(client, sample_students, staff_headers):
    student = sample_students[2]  # Urgent student (45 days)
    payload = {
        "student_id": student.id,
        "tier": "TIER_2_60_DAYS",
    }
    # 1. Send first
    res1 = client.post("/api/v1/notifications/send", json=payload, headers=staff_headers)
    assert res1.status_code == 200

    # 2. Send second: should report already dispatched
    res2 = client.post("/api/v1/notifications/send", json=payload, headers=staff_headers)
    assert res2.status_code == 200
    assert "already dispatched" in res2.json()["message"]


def test_twilio_webhook_status_update(client, sample_students, staff_headers):
    # 1. Send a notification to get a provider SID
    student = sample_students[3]
    send_res = client.post(
        "/api/v1/notifications/send",
        json={"student_id": student.id, "tier": "TIER_1_90_DAYS"},
        headers=staff_headers,
    )
    assert send_res.status_code == 200
    provider_sid = send_res.json()["providerSid"]

    # 2. Trigger webhook delivery status
    webhook_payload = {
        "MessageSid": provider_sid,
        "MessageStatus": "delivered",
        "To": "whatsapp:+60144444444",
        "From": "whatsapp:+14155238886",
    }
    hook_res = client.post(
        "/api/v1/webhooks/twilio/status",
        data=webhook_payload,
        headers={"X-Twilio-Signature": "dummy_test_sig"},
    )
    assert hook_res.status_code == 200
    assert hook_res.json()["status"] == "delivered"


def test_retry_notification(client, sample_students, staff_headers):
    # 1. List notifications
    notifs = client.get("/api/v1/notifications").json()
    if not notifs:
        client.post(
            "/api/v1/notifications/send",
            json={"student_id": sample_students[0].id, "tier": "OVERDUE_ALERT"},
            headers=staff_headers,
        )
        notifs = client.get("/api/v1/notifications").json()

    notif_id = notifs[0]["id"]
    retry_res = client.post(f"/api/v1/notifications/{notif_id}/retry", headers=staff_headers)
    assert retry_res.status_code == 200
    assert retry_res.json()["notification_id"] == notif_id
