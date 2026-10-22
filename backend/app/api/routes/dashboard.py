"""
UniSIRAJ CIA Helpdesk Agent - Dashboard & Analytics API Endpoints
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.student import Student, StudentStatus
from app.models.notification import NotificationHistory, NotificationStatus
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    SummaryMetrics,
    WhatsAppDeliverySummary,
    RecentActivityItem,
)
from app.services.student_service import get_current_business_date, calculate_days_remaining, determine_student_status
from app.api.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get aggregated metrics, compliance status counts, WhatsApp delivery metrics, and recent activity logs.
    """
    today = get_current_business_date()
    students = db.query(Student).all()

    total_students = len(students)
    safe_visas = 0
    expiring_90 = 0
    urgent_cases = 0
    critical_cases = 0
    expired_visas = 0
    review_required = 0

    for s in students:
        days = calculate_days_remaining(s.visa_expiry_date, today)
        if days is None:
            review_required += 1
        elif days < 0:
            expired_visas += 1
            critical_cases += 1
        else:
            if days <= 29:
                critical_cases += 1
            elif days <= 59:
                urgent_cases += 1
            elif days <= 90:
                expiring_90 += 1
            else:
                safe_visas += 1

    total_active = total_students - expired_visas - review_required

    # WhatsApp Metrics
    notifs = db.query(NotificationHistory).all()
    total_dispatched = len(notifs)
    delivered = sum(1 for n in notifs if n.status == NotificationStatus.DELIVERED)
    pending = sum(1 for n in notifs if n.status in [NotificationStatus.PENDING, NotificationStatus.QUEUED, NotificationStatus.SENT])
    failed = sum(1 for n in notifs if n.status in [NotificationStatus.FAILED, NotificationStatus.UNDELIVERED])
    rate = round((delivered / total_dispatched * 100), 1) if total_dispatched > 0 else 100.0

    # Recent activity logs from AuditLog
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()
    activity_items = []

    for log in recent_logs:
        act_type = "SYNC"
        if "WHATSAPP" in log.action or "NOTIFICATION" in log.action:
            act_type = "WHATSAPP"
        elif "IMPORT" in log.action:
            act_type = "IMPORT"
        elif "ASSISTANT" in log.action or "AI" in log.action:
            act_type = "AGENT_QUERY"

        actor_name = "System"
        if log.user:
            actor_name = log.user.full_name
        elif log.user_id:
            actor_name = f"User #{log.user_id}"

        activity_items.append(
            RecentActivityItem(
                id=f"act-{log.id}",
                timestamp=log.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
                type=act_type,
                description=f"{log.action.replace('_', ' ').title()} on {log.resource_type}",
                actor=actor_name,
                status="SUCCESS",
            )
        )

    now_utc = datetime.now(timezone.utc)
    last_sync_str = now_utc.strftime("%Y-%m-%d 06:00:00 MYT (UTC+8)")
    next_sync_str = (now_utc + timedelta(days=1)).strftime("%Y-%m-%d 06:00:00 MYT (UTC+8)")

    metrics = SummaryMetrics(
        totalStudents=total_students,
        totalActiveVisas=total_active,
        expiringIn90Days=expiring_90,
        urgentCases=urgent_cases,
        criticalCases=critical_cases,
        expiredVisas=expired_visas,
        safeVisas=safe_visas,
        reviewRequired=review_required,
        # Snake_case
        total_students=total_students,
        total_active_visas=total_active,
        expiring_in_90_days=expiring_90,
        urgent_cases=urgent_cases,
        critical_cases=critical_cases,
        expired_visas=expired_visas,
        safe_visas=safe_visas,
        review_required=review_required,
    )

    delivery_summary = WhatsAppDeliverySummary(
        totalDispatched=total_dispatched,
        deliveredCount=delivered,
        pendingCount=pending,
        failedCount=failed,
        deliveryRatePercentage=rate,
    )

    return DashboardSummaryResponse(
        metrics=metrics,
        lastSyncTimestamp=last_sync_str,
        nextScheduledSync=next_sync_str,
        syncJobStatus="SUCCESS",
        whatsappDeliverySummary=delivery_summary,
        recentActivities=activity_items,
        dataSource="LIVE_FASTAPI",
        # Top-level fields
        total_students=total_students,
        active_visas=total_active,
        expiring_visas=expiring_90,
        expired_visas=expired_visas,
        review_required=review_required,
        reminders_delivered=delivered,
        reminders_pending=pending,
        reminders_failed=failed,
    )


@router.get("/recent-activity", response_model=List[RecentActivityItem])
def get_recent_activity(
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get raw list of recent administrative activities and audit logs.
    """
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for log in recent_logs:
        act_type = "SYNC"
        if "WHATSAPP" in log.action:
            act_type = "WHATSAPP"
        elif "IMPORT" in log.action:
            act_type = "IMPORT"
        elif "ASSISTANT" in log.action:
            act_type = "AGENT_QUERY"

        actor = log.user.full_name if log.user else ("System" if not log.user_id else f"User #{log.user_id}")
        results.append(
            RecentActivityItem(
                id=f"act-{log.id}",
                timestamp=log.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
                type=act_type,
                description=f"{log.action} ({log.resource_type})",
                actor=actor,
                status="SUCCESS",
            )
        )
    return results
