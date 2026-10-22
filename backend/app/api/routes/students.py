"""
UniSIRAJ CIA Helpdesk Agent - Student Management API Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, PaginatedStudentResponse
from app.schemas.notification import NotificationResponse
from app.services.student_service import StudentService
from app.services.audit_service import AuditService
from app.api.dependencies import get_current_user, require_staff, require_admin, get_optional_current_user
from app.models.user import User
from app.models.notification import NotificationHistory

router = APIRouter(prefix="/students", tags=["Student Visa Records"])


@router.get("", response_model=PaginatedStudentResponse)
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, matric ID, nationality, passport"),
    status: Optional[str] = Query(None, description="Filter by SAFE, ACTION_NEEDED, URGENT, CRITICAL, EXPIRED, REVIEW_REQUIRED"),
    faculty: Optional[str] = Query(None, description="Filter by faculty name"),
    sort_by: str = Query("visa_expiry_date", description="Field to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List international student visa records with pagination, search, status filtering, and sorting.
    """
    return StudentService.list_students(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        faculty=faculty,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Add a new international student visa record.
    """
    existing = StudentService.get_student_by_matric(db, payload.matric_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student record with Matric ID '{payload.matric_id}' already exists in the database.",
        )

    res = StudentService.create_student(db, payload)
    AuditService.log_event(
        db=db,
        action="CREATE_STUDENT_RECORD",
        resource_type="STUDENT",
        resource_id=str(res.id),
        user_id=current_user.id if current_user else None,
        details={"matric_id": res.matric_id, "name": res.student_name},
    )
    return res


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieve single student visa record by ID.
    """
    res = StudentService.get_student_by_id(db, student_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )
    return res


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Update student visa details. Accepts numeric ID, 'stu-N' ID, or matriculation ID.
    """
    resolved_id = None
    if student_id.isdigit():
        resolved_id = int(student_id)
    elif student_id.startswith("stu-") and student_id[4:].isdigit():
        resolved_id = int(student_id[4:])
    else:
        st = StudentService.get_student_by_matric(db, student_id)
        if st:
            resolved_id = st.id

    res = None
    if resolved_id is not None:
        res = StudentService.update_student(db, resolved_id, payload)

    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with identifier '{student_id}' not found.",
        )
    AuditService.log_event(
        db=db,
        action="UPDATE_STUDENT_RECORD",
        resource_type="STUDENT",
        resource_id=str(resolved_id),
        user_id=current_user.id if current_user else None,
    )
    return res


@router.delete("/{student_id}")
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Delete a student record. Accepts numeric ID, 'stu-N' ID, or matriculation ID.
    """
    resolved_id = None
    if student_id.isdigit():
        resolved_id = int(student_id)
    elif student_id.startswith("stu-") and student_id[4:].isdigit():
        resolved_id = int(student_id[4:])
    else:
        st = StudentService.get_student_by_matric(db, student_id)
        if st:
            resolved_id = st.id

    if not resolved_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with identifier '{student_id}' not found.",
        )

    success = StudentService.delete_student(db, resolved_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {resolved_id} not found.",
        )
    AuditService.log_event(
        db=db,
        action="DELETE_STUDENT_RECORD",
        resource_type="STUDENT",
        resource_id=str(resolved_id),
        user_id=current_user.id if current_user else None,
    )
    return {"success": True, "message": f"Student record {student_id} permanently deleted."}


@router.get("/{student_id}/notifications", response_model=List[NotificationResponse])
def get_student_notifications(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get notification history and delivery logs for a specific student.
    """
    student = StudentService.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found.",
        )

    records = db.query(NotificationHistory).filter(
        NotificationHistory.student_id == student_id
    ).order_by(NotificationHistory.created_at.desc()).all()

    return records
