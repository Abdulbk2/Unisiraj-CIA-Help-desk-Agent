"""
UniSIRAJ CIA Helpdesk Agent - Student Visa Record Model
"""

from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Date, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class StudentStatus:
    SAFE = "SAFE"                    # > 90 days remaining
    ACTION_NEEDED = "ACTION_NEEDED"  # 61 - 90 days remaining
    URGENT = "URGENT"                # 31 - 60 days remaining
    CRITICAL = "CRITICAL"            # 1 - 30 days remaining
    EXPIRED = "EXPIRED"              # <= 0 days remaining
    REVIEW_REQUIRED = "REVIEW_REQUIRED" # missing or malformed date


class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    matric_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    student_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    faculty: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    program: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    # Visa Dates & Status
    visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=StudentStatus.SAFE, index=True, nullable=False)
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    notifications = relationship("NotificationHistory", back_populates="student", cascade="all, delete-orphan")
