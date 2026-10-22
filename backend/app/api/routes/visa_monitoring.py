"""
UniSIRAJ CIA Helpdesk Agent - Visa Expiry Monitoring API Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.monitoring import VisaMonitoringSummary, ExpiringStudentItem, MonitoringRunResponse
from app.services.visa_monitoring_service import VisaMonitoringService
from app.api.dependencies import get_current_user, get_optional_current_user, verify_scheduler_or_admin
from app.models.user import User

router = APIRouter(prefix="/visa-monitoring", tags=["Visa Expiry Monitoring"])


@router.get("/summary", response_model=VisaMonitoringSummary)
def get_monitoring_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get aggregated counts of student records categorized by compliance status and reminder milestone.
    """
    return VisaMonitoringService.get_monitoring_summary(db)


@router.get("/expiring", response_model=List[ExpiringStudentItem])
def get_expiring_students(
    within_days: Optional[int] = Query(None, description="Filter for visas expiring within N calendar days"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List student visa records approaching expiration or already expired.
    """
    return VisaMonitoringService.get_expiring_students(db, within_days=within_days)


@router.post("/preview")
def preview_monitoring_run(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Simulate daily monitoring evaluation and inspect eligible notification candidates without sending real messages.
    """
    return VisaMonitoringService.preview_monitoring_run(db)


@router.post("/run", response_model=MonitoringRunResponse)
def run_monitoring_job(
    dry_run: bool = Query(False, description="Simulate without real dispatch"),
    db: Session = Depends(get_db),
    auth_identity: Optional[User] = Depends(verify_scheduler_or_admin),
):
    """
    Execute daily visa monitoring: identifies milestones (90, 60, 30 days, overstay),
    evaluates idempotency constraints, and dispatches reminders.
    Requires staff role or authenticated Cloud Scheduler identity.
    """
    actor_id = auth_identity.id if auth_identity else None
    return VisaMonitoringService.execute_monitoring_run(
        db=db,
        actor_id=actor_id,
        dry_run=dry_run,
    )


@router.post("/sync")
def trigger_daily_sync(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Manual daily synchronisation trigger for dashboard frontend.
    """
    actor_id = current_user.id if current_user else None
    res = VisaMonitoringService.execute_monitoring_run(db=db, actor_id=actor_id, dry_run=False)
    return {
        "success": True,
        "message": f"Synchronisation completed successfully. Evaluated {res.total_evaluated} student passes.",
        "timestamp": res.executed_at,
        "run_id": res.run_id,
        "notifications_created": res.notifications_created,
    }
