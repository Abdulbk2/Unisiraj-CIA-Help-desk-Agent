"""
UniSIRAJ CIA Helpdesk Agent - Notification Dispatch & Lifecycle Orchestration
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.notification import NotificationHistory, NotificationStatus
from app.models.student import Student
from app.services.twilio_service import twilio_service, TwilioMessageTemplates
from app.services.smtp_service import smtp_service
from app.services.student_service import calculate_days_remaining
from app.services.audit_service import AuditService
from app.core.logging import logger


class NotificationService:
    @staticmethod
    def send_student_reminder(
        db: Session,
        student: Student,
        milestone_days: int,
        custom_note: Optional[str] = None,
        actor_id: Optional[int] = None,
        dispatch_method: Optional[str] = None,
    ) -> Tuple[bool, Optional[NotificationHistory], str]:
        """
        Idempotently sends a WhatsApp reminder for the student at the specified milestone.
        Returns (success, notification_record, message).
        """
        if not student.whatsapp_number:
            return False, None, f"Student {student.matric_id} has no registered WhatsApp contact number."

        # Check existing notification record for this milestone
        existing = db.query(NotificationHistory).filter(
            NotificationHistory.student_id == student.id,
            NotificationHistory.milestone_days == milestone_days,
            NotificationHistory.channel == "whatsapp",
        ).first()

        if existing:
            if existing.status in [NotificationStatus.DELIVERED, NotificationStatus.SENT]:
                return False, existing, (
                    f"Reminder for milestone {milestone_days} days was already dispatched "
                    f"to {student.student_name} on {existing.created_at.strftime('%Y-%m-%d')}."
                )
            # If previously failed, we will retry this record
            notif_record = existing
            notif_record.attempt_count += 1
        else:
            # Build new template message
            expiry_str = student.visa_expiry_date.strftime("%d %b %Y") if student.visa_expiry_date else "N/A"
            tpl_name, body = TwilioMessageTemplates.get_template(
                milestone_days=milestone_days,
                student_name=student.student_name,
                matric_id=student.matric_id,
                expiry_date_str=expiry_str,
                custom_note=custom_note,
            )

            notif_record = NotificationHistory(
                student_id=student.id,
                milestone_days=milestone_days,
                recipient_phone=student.whatsapp_number,
                channel="whatsapp",
                template_name=tpl_name,
                message_body=body,
                status=NotificationStatus.PENDING,
                attempt_count=1,
            )
            db.add(notif_record)
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                return False, None, "Concurrent duplicate notification prevented by database constraint."

        # Build template dynamic variables for Content API
        expiry_str = student.visa_expiry_date.strftime("%d %b %Y") if student.visa_expiry_date else "N/A"
        content_vars = {
            "1": student.student_name,
            "2": expiry_str,
            "3": str(milestone_days),
        }

        # Dispatch via Twilio adapter (supports Live Twilio or Demo/Mock mode)
        result = twilio_service.send_whatsapp_message(
            to_phone=student.whatsapp_number,
            message_body=notif_record.message_body,
            content_variables=content_vars,
            override_provider=dispatch_method,
        )

        now = datetime.now(timezone.utc)
        if result["success"]:
            notif_record.provider_message_id = result.get("provider_message_id")
            # In mock or demo mode, mark delivered immediately; in live Twilio, mark as sent/queued
            status_returned = result.get("status", "sent").lower()
            if status_returned in ["delivered", "sent", "queued"]:
                notif_record.status = status_returned
            else:
                notif_record.status = NotificationStatus.SENT
            notif_record.sent_at = now
            notif_record.last_error = None
        else:
            notif_record.status = NotificationStatus.FAILED
            notif_record.last_error = result.get("error")

        db.commit()
        db.refresh(notif_record)

        # Audit event
        AuditService.log_event(
            db=db,
            action="SEND_WHATSAPP_REMINDER",
            resource_type="NOTIFICATION",
            resource_id=str(notif_record.id),
            user_id=actor_id,
            details={
                "matric_id": student.matric_id,
                "milestone_days": milestone_days,
                "status": notif_record.status,
                "provider_sid": notif_record.provider_message_id,
                "dispatch_method": dispatch_method,
            }
        )

        success = notif_record.status != NotificationStatus.FAILED
        msg = f"Reminder dispatched with status '{notif_record.status}'." if success else f"Failed: {notif_record.last_error}"
        return success, notif_record, msg

    @staticmethod
    def send_student_email(
        db: Session,
        student: Student,
        to_email: str,
        subject: str,
        message_body: str,
        dispatch_method: Optional[str] = "twilio",
        actor_id: Optional[int] = None,
    ) -> Tuple[bool, Optional[NotificationHistory], str]:
        """
        Dispatches an official institutional compliance email to the student.
        Tracks the dispatch in NotificationHistory with channel="email".
        """
        if not to_email or "@" not in to_email:
            return False, None, f"Student {student.matric_id} has invalid recipient email: '{to_email}'."

        # Compute or assign milestone
        days = calculate_days_remaining(student.visa_expiry_date) or 0
        milestone = days if days > 0 else 0

        # Query existing email notification for this student and milestone
        existing = db.query(NotificationHistory).filter(
            NotificationHistory.student_id == student.id,
            NotificationHistory.milestone_days == milestone,
            NotificationHistory.channel == "email",
        ).first()

        if existing:
            notif_record = existing
            notif_record.attempt_count += 1
            notif_record.recipient_phone = to_email
            notif_record.template_name = subject[:100]
            notif_record.message_body = message_body
        else:
            notif_record = NotificationHistory(
                student_id=student.id,
                milestone_days=milestone,
                recipient_phone=to_email,
                channel="email",
                template_name=subject[:100],
                message_body=message_body,
                status=NotificationStatus.PENDING,
                attempt_count=1,
            )
            db.add(notif_record)
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                # If collision on milestone, find next available offset
                offset = 1
                while offset < 1000:
                    alt_milestone = milestone + offset
                    if not db.query(NotificationHistory).filter(
                        NotificationHistory.student_id == student.id,
                        NotificationHistory.milestone_days == alt_milestone,
                        NotificationHistory.channel == "email",
                    ).first():
                        milestone = alt_milestone
                        break
                    offset += 1
                notif_record.milestone_days = milestone
                db.add(notif_record)
                db.flush()

        # Construct professional institutional HTML template with embedded CIA logo
        from app.services.student_service import determine_student_status
        html_content = smtp_service.generate_html_template(
            student_name=student.student_name,
            matric_id=student.matric_id,
            passport_number=student.passport_number or "N/A",
            nationality=student.nationality or "International",
            expiry_date=str(student.visa_expiry_date) if student.visa_expiry_date else "N/A",
            days_remaining=days,
            status_label=determine_student_status(days),
            emgs_status=getattr(student, "emgs_status", "Verified") or "Verified",
            program=getattr(student, "program", "Academic Program") or "Academic Program",
            faculty=getattr(student, "faculty", "General Studies") or "General Studies",
        )

        # Send via live real-time SMTP service
        result = smtp_service.send_email(
            to_email=to_email,
            subject=subject,
            body=message_body,
            html_body=html_content,
        )

        now = datetime.now(timezone.utc)
        if result["success"]:
            notif_record.provider_message_id = result.get("provider_message_id")
            notif_record.status = NotificationStatus.DELIVERED
            notif_record.sent_at = now
            notif_record.last_error = None
        else:
            notif_record.status = NotificationStatus.FAILED
            notif_record.last_error = result.get("error")

        db.commit()
        db.refresh(notif_record)

        # Audit event
        AuditService.log_event(
            db=db,
            action="SEND_EMAIL_NOTIFICATION",
            resource_type="NOTIFICATION",
            resource_id=str(notif_record.id),
            user_id=actor_id,
            details={
                "matric_id": student.matric_id,
                "to_email": to_email,
                "subject": subject,
                "status": notif_record.status,
                "provider_sid": notif_record.provider_message_id,
                "dispatch_method": "smtp",
            }
        )

        success = notif_record.status != NotificationStatus.FAILED
        msg = f"Email dispatched via live SMTP with status '{notif_record.status}'." if success else f"SMTP Delivery Failed: {notif_record.last_error}"
        return success, notif_record, msg

    @staticmethod
    def retry_notification(
        db: Session,
        notification_id: int,
        actor_id: Optional[int] = None
    ) -> Tuple[bool, Optional[NotificationHistory], str]:
        """
        Manually re-dispatch a failed notification record.
        """
        record = db.query(NotificationHistory).filter(NotificationHistory.id == notification_id).first()
        if not record:
            return False, None, "Notification record not found."

        if record.status == NotificationStatus.DELIVERED:
            return False, record, "Notification is already marked as delivered."

        student = db.query(Student).filter(Student.id == record.student_id).first()
        content_vars = None
        if student:
            expiry_str = student.visa_expiry_date.strftime("%d %b %Y") if student.visa_expiry_date else "N/A"
            content_vars = {
                "1": student.student_name,
                "2": expiry_str,
                "3": str(record.milestone_days),
            }

        record.attempt_count += 1
        if record.channel == "email":
            from app.services.student_service import determine_student_status
            retry_days = calculate_days_remaining(student.visa_expiry_date) or 0
            retry_html = smtp_service.generate_html_template(
                student_name=student.student_name,
                matric_id=student.matric_id,
                passport_number=student.passport_number or "N/A",
                nationality=student.nationality or "International",
                expiry_date=str(student.visa_expiry_date) if student.visa_expiry_date else "N/A",
                days_remaining=retry_days,
                status_label=determine_student_status(retry_days),
                emgs_status=getattr(student, "emgs_status", "Verified") or "Verified",
                program=getattr(student, "program", "Academic Program") or "Academic Program",
                faculty=getattr(student, "faculty", "General Studies") or "General Studies",
            )
            result = smtp_service.send_email(
                to_email=record.recipient_phone,
                subject=record.template_name or "UniSIRAJ Official Visa Compliance Notice",
                body=record.message_body,
                html_body=retry_html,
            )
        else:
            result = twilio_service.send_whatsapp_message(
                to_phone=record.recipient_phone,
                message_body=record.message_body,
                content_variables=content_vars,
            )

        now = datetime.now(timezone.utc)
        if result["success"]:
            record.provider_message_id = result.get("provider_message_id")
            record.status = result.get("status", NotificationStatus.DELIVERED if record.channel == "email" else NotificationStatus.SENT)
            record.sent_at = now
            record.last_error = None
        else:
            record.status = NotificationStatus.FAILED
            record.last_error = result.get("error")

        db.commit()
        db.refresh(record)

        AuditService.log_event(
            db=db,
            action="RETRY_EMAIL_NOTIFICATION" if record.channel == "email" else "RETRY_WHATSAPP_REMINDER",
            resource_type="NOTIFICATION",
            resource_id=str(record.id),
            user_id=actor_id,
            details={
                "notification_id": record.id,
                "status": record.status,
                "channel": record.channel,
                "attempt_count": record.attempt_count,
            }
        )

        return (record.status != NotificationStatus.FAILED), record, f"Retry completed with status: {record.status}"

    @staticmethod
    def update_webhook_status(
        db: Session,
        provider_message_id: str,
        new_status: str,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Handle Twilio delivery callback safely and avoid out-of-order downgrades.
        """
        record = db.query(NotificationHistory).filter(
            NotificationHistory.provider_message_id == provider_message_id
        ).first()

        if not record:
            logger.warning(f"Webhook received for unknown provider SID: {provider_message_id}")
            return False

        status_lower = new_status.lower()

        # State transition hierarchy: Do not downgrade 'delivered' to 'sent' or 'queued'
        hierarchy = {
            NotificationStatus.PENDING: 1,
            NotificationStatus.QUEUED: 2,
            NotificationStatus.SENT: 3,
            NotificationStatus.DELIVERED: 4,
            NotificationStatus.FAILED: 4,
            NotificationStatus.UNDELIVERED: 4,
        }

        current_rank = hierarchy.get(record.status, 0)
        new_rank = hierarchy.get(status_lower, 0)

        if new_rank >= current_rank or record.status in [NotificationStatus.PENDING, NotificationStatus.QUEUED]:
            record.status = status_lower
            if error_code or error_message:
                record.last_error = f"Twilio Error {error_code}: {error_message}"
            db.commit()
            logger.info(f"Updated notification {record.id} status to '{status_lower}' via webhook.")
            return True

        return True
