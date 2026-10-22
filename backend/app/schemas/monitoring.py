"""
UniSIRAJ CIA Helpdesk Agent - Visa Expiry Monitoring Schemas
"""

from datetime import date
from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class MilestoneCount(BaseModel):
    milestone_days: int
    eligible_count: int


class VisaMonitoringSummary(BaseModel):
    evaluation_date: str
    total_records: int
    safe_count: int
    action_needed_count: int  # 90 days
    urgent_count: int         # 60 days
    critical_count: int       # 30 days
    expired_count: int
    review_required_count: int
    milestones: List[MilestoneCount] = []


class ExpiringStudentItem(BaseModel):
    student_id: int
    matric_id: str
    student_name: str
    nationality: Optional[str] = None
    whatsapp_number: Optional[str] = None
    visa_expiry_date: Optional[date] = None
    days_remaining: int
    status: str
    milestone_days: Optional[int] = None
    notification_status: Optional[str] = None


class MonitoringRunResponse(BaseModel):
    run_id: str
    executed_at: str
    total_evaluated: int
    notifications_created: int
    notifications_skipped_already_sent: int
    notifications_failed: int
    details: List[Dict[str, Any]] = []
