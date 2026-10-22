"""
UniSIRAJ CIA Helpdesk Agent - Spreadsheet Ingestion & Validation Service
"""

import io
import json
import uuid
import re
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.models.student import Student, StudentStatus
from app.models.import_job import ImportJob, ImportStatus
from app.schemas.import_job import (
    ColumnMappingConfig,
    SpreadsheetPreviewResponse,
    SpreadsheetValidationError,
    SpreadsheetValidationResponse,
    ProposedAddition,
    ProposedUpdate,
    SpreadsheetConfirmResponse,
)
from app.services.student_service import calculate_days_remaining, determine_student_status
from app.services.audit_service import AuditService
from app.core.logging import logger

# Maximum allowed spreadsheet size: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

SYNONYMS = {
    "matricId": ["matric id", "matric no", "matric number", "matric_id", "matric", "student id", "student_id", "student no", "id"],
    "fullName": ["student name", "full name", "student_name", "name", "student", "nama pelajar", "nama"],
    "visaExpiryDate": ["visa expiry date", "visa expiry", "expiry date", "expiry", "pass expiry date", "pass expiry", "visa_expiry_date", "expiry_date", "visa date", "tarikh luput"],
    "phoneNumber": ["phone number", "whatsapp number", "whatsapp", "phone", "contact", "mobile", "tel", "phone_number", "whatsapp_number", "no telefon"],
    "nationality": ["nationality", "country", "citizen", "citizenship", "warganegara"],
    "passportNumber": ["passport number", "passport no", "passport", "passport_number", "passport_no", "no pasport"],
    "faculty": ["faculty", "school", "department", "dept", "fakulti"],
    "program": ["program", "programme", "course", "degree", "program pengajian"],
    "email": ["email", "student email", "e-mail", "email address"],
}


def detect_column(field: str, available_headers: List[str]) -> Optional[str]:
    """Detect matching column header from available headers using synonyms."""
    for h in available_headers:
        if h.strip().lower() == field.lower():
            return h
    syns = SYNONYMS.get(field, [])
    for syn in syns:
        for h in available_headers:
            if h.strip().lower() == syn.lower():
                return h
    for syn in syns:
        for h in available_headers:
            if syn.lower() in h.strip().lower():
                return h
    return None


def extract_cell(row: Dict[str, Any], col_name: Optional[str], field_key: str) -> Optional[str]:
    """Extract cell value with direct match, case-insensitivity, and synonym fallbacks."""
    if col_name and col_name in row:
        val = row[col_name]
        if val is not None and not pd.isna(val) and str(val).strip() != "":
            return str(val).strip()
    if col_name:
        for k, v in row.items():
            if k.strip().lower() == col_name.strip().lower():
                if v is not None and not pd.isna(v) and str(v).strip() != "":
                    return str(v).strip()
    for syn in SYNONYMS.get(field_key, []):
        for k, v in row.items():
            if k.strip().lower() == syn.lower():
                if v is not None and not pd.isna(v) and str(v).strip() != "":
                    return str(v).strip()
    for syn in SYNONYMS.get(field_key, []):
        for k, v in row.items():
            if syn.lower() in k.strip().lower():
                if v is not None and not pd.isna(v) and str(v).strip() != "":
                    return str(v).strip()
    return None


def parse_date_safely(val: Any) -> Tuple[Optional[date], Optional[str]]:
    """
    Parse a date value from spreadsheet cell into date object.
    Returns (date_obj, error_message).
    """
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None, "Date is empty."

    if isinstance(val, (datetime, pd.Timestamp)):
        return val.date(), None
    if isinstance(val, date):
        return val, None

    date_str = str(val).strip()

    # Try common formats
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%Y.%m.%d",
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(date_str, fmt).date()
            return parsed, None
        except ValueError:
            continue

    try:
        # Fallback to dateutil/pandas parser
        parsed = pd.to_datetime(date_str).date()
        return parsed, None
    except Exception:
        return None, f"Unrecognized date format '{date_str}'. Expected YYYY-MM-DD or DD/MM/YYYY."


def normalize_phone_number(val: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Validate and normalize international phone numbers to E.164.
    Eliminates trailing '.0' artifacts from spreadsheet float conversions.
    Returns (normalized_phone, warning_message).
    """
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None, "Phone number is missing."

    # If numeric float or int from Excel import
    if isinstance(val, (float, int)):
        try:
            val = int(val)
        except Exception:
            pass

    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    s = re.sub(r"\.0+$", "", s)

    # Handle scientific notation e.g. 6.012345e+10
    if "e+" in s.lower():
        try:
            s = str(int(float(s)))
        except Exception:
            pass

    # Strip spaces, dashes, and parentheses
    cleaned = re.sub(r"[\s\-\(\)]", "", s)
    if cleaned.endswith(".0"):
        cleaned = cleaned[:-2]

    if cleaned.startswith("+"):
        if len(cleaned) < 8 or len(cleaned) > 16:
            return cleaned, "Phone number has unusual length."
        return cleaned, None

    # Malaysian local format standardisation: 01... -> +601...
    if cleaned.startswith("01"):
        standardized = f"+60{cleaned[1:]}"
        return standardized, "Missing '+60' international dialling code; automatically standardized."

    if cleaned.startswith("601"):
        return f"+{cleaned}", "Missing leading '+' prefix; standardized to E.164."

    if len(cleaned) >= 10 and not cleaned.startswith("+"):
        return f"+{cleaned}", None

    return cleaned, "Phone number missing international dialling prefix (e.g. +60)."


class SpreadsheetService:
    @staticmethod
    def preview_file(
        filename: str,
        content: bytes,
        user_id: Optional[int] = None
    ) -> SpreadsheetPreviewResponse:
        """
        Validate file format, parse preview rows and full dataset, and stage import job.
        """
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"Uploaded file exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.")

        lower_name = filename.lower()
        if lower_name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False)
        elif lower_name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content), dtype=str, keep_default_na=False)
        else:
            raise ValueError("Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.")

        headers = [str(col).strip() for col in df.columns]
        total_rows = len(df)

        preview_records = []
        for _, row in df.head(10).iterrows():
            record = {str(k).strip(): (str(v).strip() if not pd.isna(v) and v is not None else "") for k, v in row.items()}
            preview_records.append(record)

        all_records = []
        for _, row in df.iterrows():
            record = {str(k).strip(): (str(v).strip() if not pd.isna(v) and v is not None else "") for k, v in row.items()}
            all_records.append(record)

        suggested_mapping = ColumnMappingConfig(
            matricId=detect_column("matricId", headers) or "Matric ID",
            fullName=detect_column("fullName", headers) or "Student Name",
            visaExpiryDate=detect_column("visaExpiryDate", headers) or "Visa Expiry Date",
            phoneNumber=detect_column("phoneNumber", headers) or "Phone Number",
            nationality=detect_column("nationality", headers) or "Nationality",
            passportNumber=detect_column("passportNumber", headers) or "Passport Number",
            faculty=detect_column("faculty", headers) or "Faculty",
            program=detect_column("program", headers) or "Program",
            email=detect_column("email", headers) or "Email",
        )

        import_job_id = f"IMP_{uuid.uuid4().hex[:12]}"

        return SpreadsheetPreviewResponse(
            fileName=filename,
            fileSize=len(content),
            detectedHeaders=headers,
            totalRows=total_rows,
            previewRows=preview_records,
            allRows=all_records,
            suggestedMapping=suggested_mapping,
            importJobId=import_job_id,
        )

    @staticmethod
    def validate_spreadsheet_data(
        db: Session,
        rows: List[Dict[str, Any]],
        mapping: Optional[ColumnMappingConfig] = None,
        import_job_id: Optional[str] = None,
    ) -> SpreadsheetValidationResponse:
        """
        Validate rows against schema and existing database records.
        """
        if mapping is None:
            mapping = ColumnMappingConfig()

        errors: List[SpreadsheetValidationError] = []
        proposed_additions: List[ProposedAddition] = []
        proposed_updates: List[ProposedUpdate] = []

        seen_matrics: Dict[str, int] = {}
        valid_count = 0
        invalid_count = 0
        duplicate_count = 0

        for row_idx, row in enumerate(rows, start=1):
            row_has_critical_error = False

            # 1. Matric ID Check
            matric_val = extract_cell(row, mapping.matricId, "matricId") or ""
            if not matric_val:
                errors.append(SpreadsheetValidationError(
                    rowNumber=row_idx,
                    field=mapping.matricId or "Matric ID",
                    value="",
                    reason="Matriculation ID is required.",
                    severity="CRITICAL"
                ))
                row_has_critical_error = True
            elif matric_val in seen_matrics:
                duplicate_count += 1
                errors.append(SpreadsheetValidationError(
                    rowNumber=row_idx,
                    matricId=matric_val,
                    field=mapping.matricId or "Matric ID",
                    value=matric_val,
                    reason=f"Duplicate Matric ID within spreadsheet (first seen on row {seen_matrics[matric_val]}).",
                    severity="CRITICAL"
                ))
                row_has_critical_error = True
            else:
                seen_matrics[matric_val] = row_idx

            # 2. Student Name Check
            name_val = extract_cell(row, mapping.fullName, "fullName") or ""
            if not name_val:
                errors.append(SpreadsheetValidationError(
                    rowNumber=row_idx,
                    matricId=matric_val,
                    field=mapping.fullName or "Student Name",
                    value="",
                    reason="Student Full Name is required.",
                    severity="CRITICAL"
                ))
                row_has_critical_error = True

            # 3. Visa Expiry Date Check
            date_raw = extract_cell(row, mapping.visaExpiryDate, "visaExpiryDate")
            parsed_date, date_err = parse_date_safely(date_raw)
            if date_err:
                errors.append(SpreadsheetValidationError(
                    rowNumber=row_idx,
                    matricId=matric_val,
                    field=mapping.visaExpiryDate or "Visa Expiry Date",
                    value=str(date_raw or ""),
                    reason=date_err,
                    severity="CRITICAL"
                ))
                row_has_critical_error = True

            # 4. Phone Number Check (Warning only, non-critical)
            phone_raw = extract_cell(row, mapping.phoneNumber, "phoneNumber")
            normalized_phone, phone_warn = normalize_phone_number(phone_raw)
            if phone_warn and phone_raw:
                errors.append(SpreadsheetValidationError(
                    rowNumber=row_idx,
                    matricId=matric_val,
                    field=mapping.phoneNumber or "Phone Number",
                    value=str(phone_raw),
                    reason=phone_warn,
                    severity="WARNING"
                ))

            # Other optional attributes
            nat_val = extract_cell(row, mapping.nationality, "nationality")
            pass_val = extract_cell(row, mapping.passportNumber, "passportNumber")
            fac_val = extract_cell(row, mapping.faculty, "faculty")
            prog_val = extract_cell(row, mapping.program, "program")
            email_val = extract_cell(row, mapping.email, "email")

            if row_has_critical_error:
                invalid_count += 1
                continue

            valid_count += 1

            # Check database for existing record
            existing_student = db.query(Student).filter(Student.matric_id == matric_val).first()
            if existing_student:
                duplicate_count += 1
                changed_fields = []
                if existing_student.student_name != name_val:
                    changed_fields.append("Student Name")
                if parsed_date and existing_student.visa_expiry_date != parsed_date:
                    changed_fields.append("Visa Expiry Date")
                if normalized_phone and existing_student.whatsapp_number != normalized_phone:
                    changed_fields.append("Phone Number")
                if nat_val and existing_student.nationality != nat_val:
                    changed_fields.append("Nationality")
                if pass_val and existing_student.passport_number != pass_val:
                    changed_fields.append("Passport Number")
                if fac_val and existing_student.faculty != fac_val:
                    changed_fields.append("Faculty")
                if prog_val and existing_student.program != prog_val:
                    changed_fields.append("Program")

                proposed_updates.append(ProposedUpdate(
                    existingRecord={
                        "id": existing_student.id,
                        "matricId": existing_student.matric_id,
                        "fullName": existing_student.student_name,
                        "visaExpiryDate": existing_student.visa_expiry_date.isoformat() if existing_student.visa_expiry_date else None,
                        "phoneNumber": existing_student.whatsapp_number,
                        "nationality": existing_student.nationality,
                        "passportNumber": existing_student.passport_number,
                        "faculty": existing_student.faculty,
                        "program": existing_student.program,
                        "email": existing_student.email,
                    },
                    incomingRecord={
                        "matricId": matric_val,
                        "fullName": name_val,
                        "visaExpiryDate": parsed_date.isoformat() if parsed_date else None,
                        "phoneNumber": normalized_phone,
                        "nationality": nat_val,
                        "passportNumber": pass_val,
                        "faculty": fac_val,
                        "program": prog_val,
                        "email": email_val,
                    },
                    changedFields=changed_fields or ["Verified against spreadsheet"]
                ))
            else:
                proposed_additions.append(ProposedAddition(
                    matricId=matric_val,
                    fullName=name_val,
                    nationality=nat_val,
                    phoneNumber=normalized_phone,
                    passportNumber=pass_val,
                    visaExpiryDate=parsed_date.isoformat() if parsed_date else None,
                    faculty=fac_val,
                    program=prog_val,
                    email=email_val,
                ))

        return SpreadsheetValidationResponse(
            totalRows=len(rows),
            validRowsCount=valid_count,
            invalidRowsCount=invalid_count,
            duplicateRowsCount=duplicate_count,
            errors=errors,
            proposedAdditions=proposed_additions,
            proposedUpdates=proposed_updates,
            importJobId=import_job_id,
        )

    @staticmethod
    def commit_import(
        db: Session,
        validated_data: SpreadsheetValidationResponse,
        actor_id: Optional[int] = None,
        overwrite_existing: bool = True
    ) -> SpreadsheetConfirmResponse:
        """
        Transactional commit of validated records.
        Rolls back entirely on unhandled database error.
        """
        records_created = 0
        records_updated = 0
        records_rejected = validated_data.invalidRowsCount
        warnings = []
        batch_id = f"BATCH_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

        try:
            # 1. Process additions
            for item in validated_data.proposedAdditions:
                exp_date = None
                if item.visaExpiryDate:
                    try:
                        exp_date = datetime.strptime(item.visaExpiryDate, "%Y-%m-%d").date()
                    except ValueError:
                        parsed, _ = parse_date_safely(item.visaExpiryDate)
                        exp_date = parsed

                days = calculate_days_remaining(exp_date)
                status = determine_student_status(days)

                existing = db.query(Student).filter(Student.matric_id == item.matricId).first()
                if existing:
                    # Update existing record safely
                    existing.student_name = item.fullName or existing.student_name
                    if item.email:
                        existing.email = item.email
                    if item.phoneNumber:
                        existing.whatsapp_number = item.phoneNumber
                    if item.passportNumber:
                        existing.passport_number = item.passportNumber
                    if item.nationality:
                        existing.nationality = item.nationality
                    if item.faculty:
                        existing.faculty = item.faculty
                    if item.program:
                        existing.program = item.program
                    if exp_date:
                        existing.visa_expiry_date = exp_date
                        existing.status = status
                    existing.last_verified_at = datetime.now(timezone.utc)
                    records_updated += 1
                else:
                    student = Student(
                        matric_id=item.matricId,
                        student_name=item.fullName,
                        email=item.email,
                        whatsapp_number=item.phoneNumber,
                        passport_number=item.passportNumber,
                        nationality=item.nationality,
                        faculty=item.faculty,
                        program=item.program,
                        visa_expiry_date=exp_date,
                        status=status,
                        last_verified_at=datetime.now(timezone.utc),
                    )
                    db.add(student)
                    records_created += 1

            # 2. Process updates if authorized/requested
            if overwrite_existing and validated_data.proposedUpdates:
                for up in validated_data.proposedUpdates:
                    inc = up.incomingRecord
                    m_id = inc.get("matricId")
                    if not m_id:
                        continue
                    student = db.query(Student).filter(Student.matric_id == m_id).first()
                    if student:
                        if inc.get("fullName"):
                            student.student_name = inc.get("fullName")
                        if inc.get("phoneNumber"):
                            student.whatsapp_number = inc.get("phoneNumber")
                        if inc.get("nationality"):
                            student.nationality = inc.get("nationality")
                        if inc.get("passportNumber"):
                            student.passport_number = inc.get("passportNumber")
                        if inc.get("faculty"):
                            student.faculty = inc.get("faculty")
                        if inc.get("program"):
                            student.program = inc.get("program")
                        if inc.get("email"):
                            student.email = inc.get("email")
                        if inc.get("visaExpiryDate"):
                            try:
                                exp_date = datetime.strptime(inc.get("visaExpiryDate"), "%Y-%m-%d").date()
                            except ValueError:
                                parsed, _ = parse_date_safely(inc.get("visaExpiryDate"))
                                exp_date = parsed
                            if exp_date:
                                student.visa_expiry_date = exp_date
                                days = calculate_days_remaining(exp_date)
                                student.status = determine_student_status(days)
                        student.last_verified_at = datetime.now(timezone.utc)
                        records_updated += 1
            elif validated_data.proposedUpdates:
                warnings.append(
                    f"{len(validated_data.proposedUpdates)} existing student record(s) were flagged and left unchanged. "
                    "Use overwrite_existing=true to update them."
                )

            # Record ImportJob record
            job = ImportJob(
                id=validated_data.importJobId or f"IMP_{uuid.uuid4().hex[:12]}",
                filename="spreadsheet_ingestion.xlsx",
                user_id=actor_id,
                status=ImportStatus.COMMITTED,
                rows_processed=validated_data.totalRows,
                accepted_rows=records_created + records_updated,
                rejected_rows=records_rejected,
                validation_errors=json.dumps([e.model_dump() for e in validated_data.errors]) if validated_data.errors else None,
                completed_at=datetime.now(timezone.utc),
            )
            db.add(job)
            db.commit()

            # Record Audit Log
            AuditService.log_event(
                db=db,
                action="COMMIT_SPREADSHEET_IMPORT",
                resource_type="IMPORT_JOB",
                resource_id=job.id,
                user_id=actor_id,
                details={
                    "batch_id": batch_id,
                    "created": records_created,
                    "updated": records_updated,
                    "rejected": records_rejected,
                }
            )

            return SpreadsheetConfirmResponse(
                status="SUCCESS",
                success=True,
                recordsCreated=records_created,
                recordsUpdated=records_updated,
                recordsRejected=records_rejected,
                warnings=warnings,
                batchId=batch_id,
                importJobId=job.id,
                completionTimestamp=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Spreadsheet transaction failed and was rolled back: {e}")
            raise RuntimeError(f"Database transaction error during import commit: {e}")
