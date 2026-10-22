"""
UniSIRAJ CIA Helpdesk Agent - Dashboard & Analytics Schemas
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class SummaryMetrics(BaseModel):
    totalStudents: int = 0
    totalActiveVisas: int = 0
    expiringIn90Days: int = 0
    urgentCases: int = 0
    criticalCases: int = 0
    expiredVisas: int = 0
    safeVisas: int = 0
    reviewRequired: int = 0

    # Snake_case aliases
    total_students: int = 0
    total_active_visas: int = 0
    expiring_in_90_days: int = 0
    urgent_cases: int = 0
    critical_cases: int = 0
    expired_visas: int = 0
    safe_visas: int = 0
    review_required: int = 0


class WhatsAppDeliverySummary(BaseModel):
    totalDispatched: int = 0
    deliveredCount: int = 0
    pendingCount: int = 0
    failedCount: int = 0
    deliveryRatePercentage: float = 100.0


class RecentActivityItem(BaseModel):
    id: str
    timestamp: str
    type: str  # SYNC, WHATSAPP, IMPORT, AGENT_QUERY, CALENDAR
    description: str
    actor: str
    status: str  # SUCCESS, INFO, WARNING, ERROR


class DashboardSummaryResponse(BaseModel):
    metrics: SummaryMetrics
    lastSyncTimestamp: str
    nextScheduledSync: str
    syncJobStatus: str = "SUCCESS"
    whatsappDeliverySummary: WhatsAppDeliverySummary
    recentActivities: List[RecentActivityItem] = []
    dataSource: str = "LIVE_FASTAPI"

    # Additional top-level fields
    total_students: int = 0
    active_visas: int = 0
    expiring_visas: int = 0
    expired_visas: int = 0
    review_required: int = 0
    reminders_delivered: int = 0
    reminders_pending: int = 0
    reminders_failed: int = 0
