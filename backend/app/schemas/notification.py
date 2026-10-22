"""
UniSIRAJ CIA Helpdesk Agent - Notification & WhatsApp Schemas
"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    milestone_days: int
    recipient_phone: str
    channel: str
    template_name: str
    message_body: str
    provider_message_id: Optional[str] = None
    status: str
    attempt_count: int
    last_error: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Student metadata when included
    student_name: Optional[str] = None
    matric_id: Optional[str] = None


class NotificationLogItem(BaseModel):
    id: str
    studentId: str
    studentName: str
    matricId: str
    recipientPhoneMasked: Optional[str] = None
    destinationPhone: Optional[str] = None
    channel: Optional[str] = "whatsapp"
    tier: str  # TIER_1_90_DAYS, TIER_2_60_DAYS, TIER_3_30_DAYS, OVERDUE_ALERT
    tierLabel: str
    messageContent: str
    sentAt: Optional[str] = None
    providerSid: Optional[str] = None
    status: str  # DELIVERED, SENT, QUEUED, FAILED, UNDELIVERED
    errorMessage: Optional[str] = None
    daysBeforeExpiry: Optional[int] = None
    visaExpiryDate: Optional[str] = None
    dispatchMethod: Optional[str] = None


class WhatsAppEligibleItem(BaseModel):
    student: Any
    tier: str
    tierLabel: str
    recommendedAction: str
    daysRemaining: int
    phoneNumber: str
    canSend: bool
    contactValidationStatus: str = "VALID"  # VALID, INVALID_FORMAT, UNREACHABLE


class SendWhatsAppPayload(BaseModel):
    studentId: Optional[str] = None
    student_id: Optional[int] = None
    tier: str = "TIER_3_30_DAYS"
    customNote: Optional[str] = None
    customMessage: Optional[str] = None
    destinationPhone: Optional[str] = None
    dispatchMethod: Optional[str] = None  # "demo" | "twilio"


class SendWhatsAppResponse(BaseModel):
    success: bool
    messageId: Optional[str] = None
    notificationId: Optional[str] = None
    providerSid: Optional[str] = None
    status: str
    recipientPhoneMasked: Optional[str] = None
    sentAt: Optional[str] = None
    message: Optional[str] = None
    tier: Optional[str] = None
    dispatchMethod: Optional[str] = None


class SendEmailPayload(BaseModel):
    studentId: Optional[str] = None
    student_id: Optional[int] = None
    toEmail: str
    subject: str
    messageBody: str
    dispatchMethod: Optional[str] = "smtp"  # "smtp"


class SendEmailResponse(BaseModel):
    success: bool
    notificationId: Optional[str] = None
    providerSid: Optional[str] = None
    status: str
    recipientEmail: str
    sentAt: Optional[str] = None
    message: Optional[str] = None
    dispatchMethod: Optional[str] = None


class RetryNotificationResponse(BaseModel):
    success: bool
    notification_id: int
    status: str
    attempt_count: int
    message: str


class TwilioStatusWebhook(BaseModel):
    MessageSid: str
    MessageStatus: str  # queued, sent, delivered, undelivered, failed
    To: Optional[str] = None
    From: Optional[str] = None
    ErrorCode: Optional[str] = None
    ErrorMessage: Optional[str] = None
