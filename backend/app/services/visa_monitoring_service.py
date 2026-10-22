"""
UniSIRAJ CIA Helpdesk Agent - Visa Expiry Monitoring Engine
"""

import uuid
from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.student import Student, StudentStatus
from app.models.notification import NotificationHistory, NotificationStatus
from app.services.student_service import get_current_business_date, calculate_days_remaining, determine_student_status
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService
from app.schemas.monitoring import VisaMonitoringSummary, MilestoneCount, ExpiringStudentItem, MonitoringRunResponse
from app.core.config import settings
from app.core.logging import logger


class VisaMonitoringService:
    @staticmethod
    def get_monitoring_summary(db: Session) -> VisaMonitoringSummary:
        """
        Calculate summary counts across all student visa records.
        """
        today = get_current_business_date()
        students = db.query(Student).all()

        counts = {
            StudentStatus.SAFE: 0,
            StudentStatus.ACTION_NEEDED: 0,
            StudentStatus.URGENT: 0,
            StudentStatus.CRITICAL: 0,
            StudentStatus.EXPIRED: 0,
            StudentStatus.REVIEW_REQUIRED: 0,
        }

        # Milestone eligible counts
        milestones = settings.reminder_milestones_list  # [90, 60, 30]
        milestone_eligible = {m: 0 for m in milestones}

        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            st = determine_student_status(days)
            counts[st] = counts.get(st, 0) + 1

            if days is not None and days >= 0:
                for m in milestones:
                    # Check if student is within window and hasn't received this milestone
                    if days <= m:
                        milestone_eligible[m] += 1

        milestone_counts = [
            MilestoneCount(milestone_days=m, eligible_count=milestone_eligible[m])
            for m in milestones
        ]

        return VisaMonitoringSummary(
            evaluation_date=today.isoformat(),
            total_records=len(students),
            safe_count=counts.get(StudentStatus.SAFE, 0),
            action_needed_count=counts.get(StudentStatus.ACTION_NEEDED, 0),
            urgent_count=counts.get(StudentStatus.URGENT, 0),
            critical_count=counts.get(StudentStatus.CRITICAL, 0),
            expired_count=counts.get(StudentStatus.EXPIRED, 0),
            review_required_count=counts.get(StudentStatus.REVIEW_REQUIRED, 0),
            milestones=milestone_counts,
        )

    @staticmethod
    def get_expiring_students(
        db: Session,
        within_days: Optional[int] = None,
        tier: Optional[str] = None
    ) -> List[ExpiringStudentItem]:
        """
        List students approaching visa expiration or currently expired.
        """
        today = get_current_business_date()
        students = db.query(Student).all()
        results: List[ExpiringStudentItem] = []

        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            if days is None:
                continue

            status = determine_student_status(days)

            # Filter logic
            if within_days is not None and days > within_days:
                continue

            # Determine matching milestone
            matched_milestone = None
            if days <= 0:
                matched_milestone = 0
            elif days <= 30:
                matched_milestone = 30
            elif days <= 60:
                matched_milestone = 60
            elif days <= 90:
                matched_milestone = 90

            # Get notification status for this milestone if exists
            latest_notif = None
            if matched_milestone is not None:
                latest_notif = db.query(NotificationHistory).filter(
                    NotificationHistory.student_id == s.id,
                    NotificationHistory.milestone_days == matched_milestone,
                ).first()

            results.append(
                ExpiringStudentItem(
                    student_id=s.id,
                    matric_id=s.matric_id,
                    student_name=s.student_name,
                    nationality=s.nationality,
                    whatsapp_number=s.whatsapp_number,
                    visa_expiry_date=s.visa_expiry_date,
                    days_remaining=days,
                    status=status,
                    milestone_days=matched_milestone,
                    notification_status=latest_notif.status if latest_notif else "NOT_SENT",
                )
            )

        results.sort(key=lambda x: x.days_remaining)
        return results

    @staticmethod
    def preview_monitoring_run(db: Session) -> Dict[str, Any]:
        """
        Simulate a monitoring run without sending real messages or modifying notification tables.
        """
        today = get_current_business_date()
        students = db.query(Student).all()
        milestones = settings.reminder_milestones_list  # e.g. [90, 60, 30]

        candidates = []
        already_notified = 0

        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            if days is None:
                continue

            # Find applicable milestone
            target_milestone = None
            if days < 0:
                target_milestone = 0
            else:
                for m in sorted(milestones):
                    if days <= m:
                        target_milestone = m
                        break

            if target_milestone is not None:
                # Check if notification already sent
                existing = db.query(NotificationHistory).filter(
                    NotificationHistory.student_id == s.id,
                    NotificationHistory.milestone_days == target_milestone,
                    NotificationHistory.status.in_([NotificationStatus.DELIVERED, NotificationStatus.SENT]),
                ).first()

                if existing:
                    already_notified += 1
                else:
                    candidates.append({
                        "student_id": s.id,
                        "matric_id": s.matric_id,
                        "student_name": s.student_name,
                        "whatsapp_number": s.whatsapp_number,
                        "days_remaining": days,
                        "target_milestone": target_milestone,
                        "has_whatsapp": bool(s.whatsapp_number),
                    })

        return {
            "evaluation_date": today.isoformat(),
            "total_candidates": len(candidates),
            "already_notified_count": already_notified,
            "candidates": candidates,
        }

    @staticmethod
    def execute_monitoring_run(
        db: Session,
        actor_id: Optional[int] = None,
        dry_run: bool = False
    ) -> MonitoringRunResponse:
        """
        Execute scheduled or manual daily visa monitoring:
        1. Evaluates all student records.
        2. Identifies students at or crossing reminder milestones.
        3. Idempotently dispatches notifications.
        4. Logs full audit record.
        """
        today = get_current_business_date()
        run_id = f"RUN_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        students = db.query(Student).all()
        milestones = settings.reminder_milestones_list

        created_count = 0
        skipped_count = 0
        failed_count = 0
        details = []

        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            # Update student status based on current date
            new_status = determine_student_status(days)
            if s.status != new_status:
                s.status = new_status
                s.last_verified_at = datetime.now(timezone.utc)

            if days is None:
                continue

            # Determine milestone
            target_milestone = None
            if days < 0:
                target_milestone = 0
            else:
                for m in sorted(milestones):
                    if days <= m:
                        target_milestone = m
                        break

            if target_milestone is not None:
                if dry_run:
                    created_count += 1
                    details.append({
                        "matric_id": s.matric_id,
                        "milestone": target_milestone,
                        "action": "DRY_RUN_QUEUED",
                    })
                    continue

                success, record, msg = NotificationService.send_student_reminder(
                    db=db,
                    student=s,
                    milestone_days=target_milestone,
                    actor_id=actor_id,
                )

                if "already dispatched" in msg:
                    skipped_count += 1
                elif success:
                    created_count += 1
                else:
                    failed_count += 1

                details.append({
                    "matric_id": s.matric_id,
                    "milestone": target_milestone,
                    "success": success,
                    "message": msg,
                })

        db.commit()

        AuditService.log_event(
            db=db,
            action="VISA_MONITORING_RUN",
            resource_type="SCHEDULER",
            resource_id=run_id,
            user_id=actor_id,
            details={
                "run_id": run_id,
                "total_evaluated": len(students),
                "created": created_count,
                "skipped": skipped_count,
                "failed": failed_count,
            }
        )

        return MonitoringRunResponse(
            run_id=run_id,
            executed_at=datetime.now(timezone.utc).isoformat(),
            total_evaluated=len(students),
            notifications_created=created_count,
            notifications_skipped_already_sent=skipped_count,
            notifications_failed=failed_count,
            details=details,
        )
