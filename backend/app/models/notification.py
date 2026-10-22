"""
UniSIRAJ CIA Helpdesk Agent - Notification History Model
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class NotificationStatus:
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    UNDELIVERED = "undelivered"


class NotificationHistory(Base, TimestampMixin):
    __tablename__ = "notification_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_days: Mapped[int] = mapped_column(Integer, nullable=False)  # 90, 60, 30
    recipient_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    channel: Mapped[str] = mapped_column(String(30), default="whatsapp", nullable=False)
    template_name: Mapped[str] = mapped_column(String(100), nullable=False)
    message_body: Mapped[str] = mapped_column(Text, nullable=False)

    # Provider Delivery Tracking (Twilio)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=NotificationStatus.PENDING, index=True, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    student = relationship("Student", back_populates="notifications")

    # Composite uniqueness constraint: Exactly once per student, per milestone, per channel
    __table_args__ = (
        UniqueConstraint("student_id", "milestone_days", "channel", name="uq_student_milestone_channel"),
        Index("idx_student_milestone", "student_id", "milestone_days"),
    )
