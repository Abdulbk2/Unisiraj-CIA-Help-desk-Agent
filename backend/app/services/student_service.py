"""
UniSIRAJ CIA Helpdesk Agent - Student Record Service
"""

from datetime import date, datetime, timezone
from typing import Optional, List, Tuple, Union
from sqlalchemy import or_, and_, asc, desc, func
from sqlalchemy.orm import Session
from app.models.student import Student, StudentStatus
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, PaginationMetadata, PaginatedStudentResponse
from app.core.config import settings
import zoneinfo
import re


def clean_phone_number(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    s = re.sub(r"\.0+$", "", s)
    s = re.sub(r"[\s\-\(\)]", "", s)
    if s.endswith(".0"):
        s = s[:-2]
    return s if s else None


def get_current_business_date() -> date:
    """Return the current calendar date in the configured university timezone."""
    try:
        tz = zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE)
        return datetime.now(tz).date()
    except Exception:
        return datetime.now(timezone.utc).date()


def calculate_days_remaining(expiry_date: Union[date, str, None], current_date: Optional[Union[date, str]] = None) -> Optional[int]:
    """Calculate remaining calendar days until visa expiry."""
    if not expiry_date:
        return None
    if isinstance(expiry_date, str):
        try:
            expiry_date = datetime.strptime(expiry_date.strip()[:10], "%Y-%m-%d").date()
        except Exception:
            return None
    if current_date is None:
        current_date = get_current_business_date()
    elif isinstance(current_date, str):
        try:
            current_date = datetime.strptime(current_date.strip()[:10], "%Y-%m-%d").date()
        except Exception:
            current_date = get_current_business_date()
    return (expiry_date - current_date).days


def determine_student_status(days_remaining: Optional[int]) -> str:
    """
    Classify visa status according to UniSIRAJ compliance rules:
    - SAFE: > 90 days
    - ACTION_NEEDED: 61 - 90 days (Tier 1 reminder milestone)
    - URGENT: 31 - 60 days (Tier 2 reminder milestone)
    - CRITICAL: 0 - 30 days (Tier 3 reminder milestone)
    - EXPIRED: < 0 days (Emergency overstay)
    - REVIEW_REQUIRED: None / missing date
    """
    if days_remaining is None:
        return StudentStatus.REVIEW_REQUIRED
    if days_remaining < 0:
        return StudentStatus.EXPIRED
    if days_remaining <= 30:
        return StudentStatus.CRITICAL
    if days_remaining <= 60:
        return StudentStatus.URGENT
    if days_remaining <= 90:
        return StudentStatus.ACTION_NEEDED
    return StudentStatus.SAFE


class StudentService:
    @staticmethod
    def list_students(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        faculty: Optional[str] = None,
        sort_by: str = "visa_expiry_date",
        sort_order: str = "asc",
    ) -> PaginatedStudentResponse:
        today = get_current_business_date()
        query = db.query(Student)

        # Filters
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Student.matric_id.ilike(search_term),
                    Student.student_name.ilike(search_term),
                    Student.nationality.ilike(search_term),
                    Student.passport_number.ilike(search_term),
                    Student.faculty.ilike(search_term),
                )
            )

        if status:
            status_clean = status.strip().upper()
            query = query.filter(Student.status == status_clean)

        if faculty:
            query = query.filter(Student.faculty.ilike(f"%{faculty.strip()}%"))

        # Sorting
        sort_col = getattr(Student, sort_by, Student.visa_expiry_date)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_col).nulls_last())
        else:
            query = query.order_by(asc(sort_col).nulls_last())

        total = query.count()
        total_pages = max(1, (total + page_size - 1) // page_size) if page_size > 0 else 1

        offset = (page - 1) * page_size
        students = query.offset(offset).limit(page_size).all()

        data: List[StudentResponse] = []
        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            data.append(StudentResponse.from_orm_model(s, days))

        return PaginatedStudentResponse(
            data=data,
            pagination=PaginationMetadata(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            )
        )

    @staticmethod
    def get_student_by_id(db: Session, student_id: int) -> Optional[StudentResponse]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None
        days = calculate_days_remaining(student.visa_expiry_date)
        return StudentResponse.from_orm_model(student, days)

    @staticmethod
    def get_student_by_matric(db: Session, matric_id: str) -> Optional[Student]:
        return db.query(Student).filter(Student.matric_id == matric_id.strip()).first()

    @staticmethod
    def create_student(db: Session, payload: StudentCreate) -> StudentResponse:
        today = get_current_business_date()
        days = calculate_days_remaining(payload.visa_expiry_date, today)
        computed_status = determine_student_status(days)

        student = Student(
            matric_id=payload.matric_id.strip(),
            student_name=payload.student_name.strip(),
            email=payload.email.strip() if payload.email else None,
            whatsapp_number=clean_phone_number(payload.whatsapp_number),
            passport_number=payload.passport_number.strip() if payload.passport_number else None,
            nationality=payload.nationality.strip() if payload.nationality else None,
            faculty=payload.faculty.strip() if payload.faculty else None,
            program=payload.program.strip() if payload.program else None,
            visa_expiry_date=payload.visa_expiry_date,
            status=computed_status,
            last_verified_at=datetime.now(timezone.utc),
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return StudentResponse.from_orm_model(student, days)

    @staticmethod
    def update_student(db: Session, student_id: int, payload: StudentUpdate) -> Optional[StudentResponse]:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        # Map camelCase to snake_case if present
        if update_data.get("matricId"):
            update_data["matric_id"] = update_data.pop("matricId")
        if update_data.get("fullName"):
            update_data["student_name"] = update_data.pop("fullName")
        if update_data.get("phoneNumber"):
            update_data["whatsapp_number"] = clean_phone_number(update_data.pop("phoneNumber"))
        elif update_data.get("whatsapp_number"):
            update_data["whatsapp_number"] = clean_phone_number(update_data.get("whatsapp_number"))
        if update_data.get("passportNumber"):
            update_data["passport_number"] = update_data.pop("passportNumber")
        if update_data.get("visaExpiryDate"):
            update_data["visa_expiry_date"] = update_data.pop("visaExpiryDate")

        for key, value in update_data.items():
            if hasattr(student, key) and value is not None:
                setattr(student, key, value)

        today = get_current_business_date()
        days = calculate_days_remaining(student.visa_expiry_date, today)
        student.status = determine_student_status(days)
        student.last_verified_at = datetime.now(timezone.utc)

        # Propagate contact & pass updates to WhatsApp notification data
        try:
            from app.models.notification import NotificationHistory, NotificationStatus
            from app.services.twilio_service import TwilioMessageTemplates

            if student.whatsapp_number:
                db.query(NotificationHistory).filter(
                    NotificationHistory.student_id == student.id
                ).update({"recipient_phone": student.whatsapp_number}, synchronize_session=False)

            pending_notifs = db.query(NotificationHistory).filter(
                NotificationHistory.student_id == student.id,
                NotificationHistory.status.in_([NotificationStatus.PENDING, NotificationStatus.QUEUED])
            ).all()
            for notif in pending_notifs:
                template_name, message_body = TwilioMessageTemplates.get_template(
                    milestone_days=notif.milestone_days,
                    student_name=student.student_name,
                    matric_id=student.matric_id,
                    expiry_date_str=student.visa_expiry_date.strftime("%d/%m/%Y") if student.visa_expiry_date else "N/A"
                )
                notif.template_name = template_name
                notif.message_body = message_body
        except Exception as e:
            # Non-blocking notification sync failure
            pass

        db.commit()
        db.refresh(student)
        return StudentResponse.from_orm_model(student, days)

    @staticmethod
    def delete_student(db: Session, student_id: int) -> bool:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return False
        db.delete(student)
        db.commit()
        return True
