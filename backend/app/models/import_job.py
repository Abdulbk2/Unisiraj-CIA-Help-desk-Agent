"""
UniSIRAJ CIA Helpdesk Agent - Spreadsheet Import Job Model
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class ImportStatus:
    PENDING = "pending"
    VALIDATED = "validated"
    COMMITTED = "committed"
    FAILED = "failed"


class ImportJob(Base, TimestampMixin):
    __tablename__ = "import_jobs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # UUID string
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=ImportStatus.PENDING, index=True, nullable=False)

    rows_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accepted_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Stored validation errors & serialized staged records (JSON string)
    validation_errors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    staged_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    user = relationship("User", back_populates="import_jobs")
