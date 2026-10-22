"""
UniSIRAJ CIA Helpdesk Agent - Notification & WhatsApp API Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.notification import NotificationHistory, NotificationStatus
from app.models.student import Student
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationLogItem,
    WhatsAppEligibleItem,
    SendWhatsAppPayload,
    SendWhatsAppResponse,
    SendEmailPayload,
    SendEmailResponse,
    RetryNotificationResponse,
)
from app.services.student_service import StudentService, calculate_days_remaining, determine_student_status
from app.services.notification_service import NotificationService
from app.api.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/notifications", tags=["WhatsApp Notifications"])


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    status_filter: Optional[str] = Query(None, alias="status"),
    channel: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List notification history records with status and delivery details.
    """
    query = db.query(NotificationHistory)
    if status_filter:
        query = query.filter(NotificationHistory.status == status_filter.lower())
    if channel:
        query = query.filter(NotificationHistory.channel == channel.lower())

    records = query.order_by(NotificationHistory.created_at.desc()).limit(limit).all()

    # Populate student name and matric ID for display
    results = []
    for r in records:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        nr = NotificationResponse.model_validate(r)
        if student:
            nr.student_name = student.student_name
            nr.matric_id = student.matric_id
        results.append(nr)
    return results


@router.get("/eligible", response_model=List[WhatsAppEligibleItem])
def get_eligible_students(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieve international students currently eligible for WhatsApp visa notifications based on remaining days.
    """
    students = db.query(Student).all()
    eligible_items = []

    for s in students:
        days = calculate_days_remaining(s.visa_expiry_date)
        if days is None:
            continue

        tier = None
        tier_label = ""
        action = ""

        if days < 0:
            tier = "OVERDUE_ALERT"
            tier_label = "Emergency Overstay Notice"
            action = "Urgent notice: Advise immediate walk-in to prevent compounding penalties."
        elif days <= 30:
            tier = "TIER_3_30_DAYS"
            tier_label = "Tier 3 (30 days reminder)"
            action = "Final reminder highlighting imminent expiry and consequence of overstaying."
        elif days <= 60:
            tier = "TIER_2_60_DAYS"
            tier_label = "Tier 2 (60-Day Renewal Follow-up)"
            action = "Follow-up reminder to complete and submit the renewal application without delay."
        elif days <= 90:
            tier = "TIER_1_90_DAYS"
            tier_label = "Tier 1 (90-Day Early Reminder)"
            action = "Early reminder that renewal window has opened; advise document preparation."

        if tier:
            # Check contact validity and strip any trailing .0
            phone = (s.whatsapp_number or "").replace(".0", "").strip()
            if phone and not phone.startswith("+") and len(phone) >= 10:
                phone = f"+{phone}"
            is_valid_phone = phone.startswith("+") and len(phone) >= 10
            contact_status = "VALID" if is_valid_phone else ("INVALID_FORMAT" if phone else "UNREACHABLE")

            eligible_items.append(
                WhatsAppEligibleItem(
                    student={
                        "id": str(s.id),
                        "matricId": s.matric_id,
                        "fullName": s.student_name,
                        "phoneNumber": phone,
                        "visaExpiryDate": s.visa_expiry_date.isoformat() if s.visa_expiry_date else "",
                        "nationality": s.nationality or "International",
                        "daysRemaining": days,
                        "status": determine_student_status(days),
                    },
                    tier=tier,
                    tierLabel=tier_label,
                    recommendedAction=action,
                    daysRemaining=days,
                    phoneNumber=phone or "Not Provided",
                    canSend=bool(phone),
                    contactValidationStatus=contact_status,
                )
            )

    eligible_items.sort(key=lambda x: x.daysRemaining)
    return eligible_items


@router.get("/history", response_model=List[NotificationLogItem])
def get_notification_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Frontend compatibility endpoint returning structured notification log items (WhatsApp and Email).
    """
    records = db.query(NotificationHistory).order_by(NotificationHistory.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        raw_dest = (r.recipient_phone or "").replace(".0", "").strip()
        
        if "@" in raw_dest:
            parts = raw_dest.split("@")
            user_part = parts[0]
            masked_user = user_part[0] + "***" + (user_part[-1] if len(user_part) > 1 else "")
            phone_masked = f"{masked_user}@{parts[1]}"
        elif len(raw_dest) > 8:
            phone_masked = raw_dest[:4] + "****" + raw_dest[-4:]
        else:
            phone_masked = raw_dest

        if r.channel == "email":
            tier_code = "OFFICIAL_NOTICE_EMAIL"
            tier_label = r.template_name or "Official Notice Email"
        else:
            tier_code = "TIER_1_90_DAYS"
            if r.milestone_days <= 0:
                tier_code = "OVERDUE_ALERT"
            elif r.milestone_days <= 30:
                tier_code = "TIER_3_30_DAYS"
            elif r.milestone_days <= 60:
                tier_code = "TIER_2_60_DAYS"
            tier_label = r.template_name

        results.append(
            NotificationLogItem(
                id=f"notif-{r.id}",
                studentId=str(r.student_id),
                studentName=student.student_name if student else "Unknown Student",
                matricId=student.matric_id if student else "N/A",
                recipientPhoneMasked=phone_masked,
                destinationPhone=raw_dest,
                channel=r.channel or "whatsapp",
                tier=tier_code,
                tierLabel=tier_label,
                messageContent=r.message_body,
                sentAt=r.sent_at.isoformat() if r.sent_at else r.created_at.isoformat(),
                providerSid=r.provider_message_id,
                status=r.status.upper(),
                errorMessage=r.last_error,
                daysBeforeExpiry=r.milestone_days,
                visaExpiryDate=student.visa_expiry_date.isoformat() if student and student.visa_expiry_date else None,
            )
        )
    return results


@router.post("/send", response_model=SendWhatsAppResponse)
def send_whatsapp(
    payload: SendWhatsAppPayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Dispatch a single WhatsApp reminder for a student (supports Twilio Live Gateway or Demo/Simulation Mode).
    """
    student = None
    if payload.student_id:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
    elif payload.studentId:
        # Check by numeric ID or matric ID
        try:
            numeric_id = int(str(payload.studentId).replace("stu-", ""))
            student = db.query(Student).filter(Student.id == numeric_id).first()
        except ValueError:
            pass
        if not student:
            student = db.query(Student).filter(Student.matric_id == str(payload.studentId)).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found.",
        )

    # Map tier string to milestone days
    tier_map = {
        "OVERDUE_ALERT": 0,
        "TIER_3_30_DAYS": 30,
        "TIER_2_60_DAYS": 60,
        "TIER_1_90_DAYS": 90,
    }
    milestone_days = tier_map.get(payload.tier, 30)

    actor_id = current_user.id if current_user else None
    dispatch_mode = payload.dispatchMethod or None

    success, notif, msg = NotificationService.send_student_reminder(
        db=db,
        student=student,
        milestone_days=milestone_days,
        custom_note=payload.customNote or payload.customMessage,
        actor_id=actor_id,
        dispatch_method=dispatch_mode,
    )

    if not notif:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    phone_masked = notif.recipient_phone
    if len(phone_masked) > 8:
        phone_masked = phone_masked[:4] + "****" + phone_masked[-4:]

    return SendWhatsAppResponse(
        success=success,
        messageId=f"msg-{notif.id}",
        notificationId=str(notif.id),
        providerSid=notif.provider_message_id,
        status=notif.status.upper(),
        recipientPhoneMasked=phone_masked,
        sentAt=notif.sent_at.isoformat() if notif.sent_at else None,
        message=msg,
        tier=payload.tier,
        dispatchMethod=dispatch_mode or "twilio",
    )


@router.post("/send-email", response_model=SendEmailResponse)
def send_email(
    payload: SendEmailPayload,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Dispatch an official institutional compliance email to a student via live real-time SMTP.
    """
    student = None
    if payload.student_id:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
    elif payload.studentId:
        try:
            numeric_id = int(str(payload.studentId).replace("stu-", ""))
            student = db.query(Student).filter(Student.id == numeric_id).first()
        except ValueError:
            pass
        if not student:
            student = db.query(Student).filter(Student.matric_id == str(payload.studentId)).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found for email dispatch.",
        )

    actor_id = current_user.id if current_user else None
    dispatch_mode = "smtp"

    success, notif, msg = NotificationService.send_student_email(
        db=db,
        student=student,
        to_email=payload.toEmail,
        subject=payload.subject,
        message_body=payload.messageBody,
        dispatch_method=dispatch_mode,
        actor_id=actor_id,
    )

    if not notif:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    return SendEmailResponse(
        success=success,
        notificationId=str(notif.id),
        providerSid=notif.provider_message_id,
        status=notif.status.upper(),
        recipientEmail=payload.toEmail,
        sentAt=notif.sent_at.isoformat() if notif.sent_at else None,
        message=msg,
        dispatchMethod=dispatch_mode,
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get detailed information for a single notification.
    """
    notif = db.query(NotificationHistory).filter(NotificationHistory.id == notification_id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification record with ID {notification_id} not found.",
        )
    return notif


@router.post("/{notification_id}/retry", response_model=RetryNotificationResponse)
def retry_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retry a failed notification dispatch.
    """
    actor_id = current_user.id if current_user else None
    success, record, msg = NotificationService.retry_notification(
        db=db,
        notification_id=notification_id,
        actor_id=actor_id,
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)

    return RetryNotificationResponse(
        success=success,
        notification_id=notification_id,
        status=record.status,
        attempt_count=record.attempt_count,
        message=msg,
    )


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Permanently delete a notification history record.
    """
    notif = db.query(NotificationHistory).filter(NotificationHistory.id == notification_id).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification record with ID {notification_id} not found.",
        )
    db.delete(notif)
    db.commit()
    return {"success": True, "message": f"Notification {notification_id} permanently erased."}
