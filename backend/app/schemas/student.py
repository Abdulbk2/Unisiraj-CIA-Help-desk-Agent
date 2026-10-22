"""
UniSIRAJ CIA Helpdesk Agent - Student Visa Record Schemas
"""

from datetime import date, datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, model_validator, field_validator


class PaginationMetadata(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class StudentBase(BaseModel):
    matric_id: Optional[str] = Field(None, max_length=50, description="University Matriculation ID")
    student_name: Optional[str] = Field(None, max_length=200, description="Full Student Name")
    email: Optional[str] = Field(None, max_length=255)
    whatsapp_number: Optional[str] = Field(None, max_length=50, description="E.164 phone number, e.g. +60123456789")
    passport_number: Optional[str] = Field(None, max_length=50)
    nationality: Optional[str] = Field(None, max_length=100)
    faculty: Optional[str] = Field(None, max_length=150)
    program: Optional[str] = Field(None, max_length=150)
    visa_expiry_date: Optional[date] = None


class StudentCreate(StudentBase):
    # Frontend camelCase aliases
    matricId: Optional[str] = None
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    passportNumber: Optional[str] = None
    visaExpiryDate: Optional[Any] = None

    @field_validator("visa_expiry_date", mode="before")
    @classmethod
    def parse_visa_expiry_date(cls, v: Any) -> Optional[date]:
        if not v:
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            from app.services.spreadsheet_service import parse_date_safely
            parsed, _ = parse_date_safely(v)
            return parsed
        return v

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("matric_id") and data.get("matricId"):
                data["matric_id"] = data["matricId"]
            if not data.get("student_name") and data.get("fullName"):
                data["student_name"] = data["fullName"]
            if not data.get("whatsapp_number") and data.get("phoneNumber"):
                data["whatsapp_number"] = data["phoneNumber"]
            if not data.get("passport_number") and data.get("passportNumber"):
                data["passport_number"] = data["passportNumber"]
            if not data.get("visa_expiry_date") and data.get("visaExpiryDate"):
                data["visa_expiry_date"] = data["visaExpiryDate"]
        return data

    @model_validator(mode="after")
    def validate_required(self) -> "StudentCreate":
        if not self.matric_id or not self.matric_id.strip():
            raise ValueError("matric_id (or matricId) is required")
        if not self.student_name or not self.student_name.strip():
            raise ValueError("student_name (or fullName) is required")
        return self


class StudentUpdate(BaseModel):
    matric_id: Optional[str] = Field(None, max_length=50)
    student_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[str] = Field(None, max_length=255)
    whatsapp_number: Optional[str] = Field(None, max_length=50)
    passport_number: Optional[str] = Field(None, max_length=50)
    nationality: Optional[str] = Field(None, max_length=100)
    faculty: Optional[str] = Field(None, max_length=150)
    program: Optional[str] = Field(None, max_length=150)
    visa_expiry_date: Optional[date] = None
    status: Optional[str] = None

    # Frontend camelCase aliases
    matricId: Optional[str] = None
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    passportNumber: Optional[str] = None
    visaExpiryDate: Optional[Any] = None

    @field_validator("visa_expiry_date", mode="before")
    @classmethod
    def parse_update_visa_expiry_date(cls, v: Any) -> Optional[date]:
        if not v:
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            from app.services.spreadsheet_service import parse_date_safely
            parsed, _ = parse_date_safely(v)
            return parsed
        return v


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    matric_id: str
    student_name: str
    email: Optional[str] = None
    whatsapp_number: Optional[str] = None
    passport_number: Optional[str] = None
    nationality: Optional[str] = None
    faculty: Optional[str] = None
    program: Optional[str] = None
    visa_expiry_date: Optional[date] = None
    status: str
    days_remaining: Optional[int] = None
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Frontend-friendly compatibility aliases
    matricId: Optional[str] = None
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    passportNumber: Optional[str] = None
    visaExpiryDate: Optional[str] = None
    daysRemaining: Optional[int] = None

    @classmethod
    def from_orm_model(cls, student: Any, days_remaining: Optional[int] = None) -> "StudentResponse":
        return cls(
            id=student.id,
            matric_id=student.matric_id,
            student_name=student.student_name,
            email=student.email,
            whatsapp_number=student.whatsapp_number,
            passport_number=student.passport_number,
            nationality=student.nationality,
            faculty=student.faculty,
            program=student.program,
            visa_expiry_date=student.visa_expiry_date,
            status=student.status,
            days_remaining=days_remaining,
            last_verified_at=student.last_verified_at,
            created_at=student.created_at,
            updated_at=student.updated_at,
            # Aliases
            matricId=student.matric_id,
            fullName=student.student_name,
            phoneNumber=student.whatsapp_number,
            passportNumber=student.passport_number,
            visaExpiryDate=student.visa_expiry_date.isoformat() if student.visa_expiry_date else None,
            daysRemaining=days_remaining,
        )


class PaginatedStudentResponse(BaseModel):
    data: List[StudentResponse]
    pagination: PaginationMetadata
