"""
UniSIRAJ CIA Helpdesk Agent - Spreadsheet Ingestion & Validation Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ColumnMappingConfig(BaseModel):
    matricId: str = "Matric ID"
    fullName: str = "Student Name"
    nationality: Optional[str] = "Nationality"
    phoneNumber: Optional[str] = "Phone Number"
    visaExpiryDate: str = "Visa Expiry Date"
    email: Optional[str] = "Email"
    passportNumber: Optional[str] = "Passport No"
    faculty: Optional[str] = "Faculty"
    program: Optional[str] = "Program"


class SpreadsheetPreviewResponse(BaseModel):
    fileName: str
    fileSize: int
    detectedHeaders: List[str]
    totalRows: int
    previewRows: List[Dict[str, Any]]
    allRows: Optional[List[Dict[str, Any]]] = None
    suggestedMapping: Optional[ColumnMappingConfig] = None
    importJobId: Optional[str] = None


class SpreadsheetValidationError(BaseModel):
    rowNumber: int
    matricId: Optional[str] = None
    field: str
    value: Optional[str] = None
    reason: str
    severity: str = "CRITICAL"  # CRITICAL or WARNING


class ProposedAddition(BaseModel):
    matricId: str
    fullName: str
    nationality: Optional[str] = None
    countryCode: Optional[str] = None
    phoneNumber: Optional[str] = None
    passportNumber: Optional[str] = None
    visaExpiryDate: Optional[str] = None
    faculty: Optional[str] = None
    program: Optional[str] = None
    email: Optional[str] = None


class ProposedUpdate(BaseModel):
    existingRecord: Dict[str, Any]
    incomingRecord: Dict[str, Any]
    changedFields: List[str]


class SpreadsheetValidationRequest(BaseModel):
    mapping: Optional[ColumnMappingConfig] = None
    rows: Optional[List[Dict[str, Any]]] = None
    import_job_id: Optional[str] = None


class SpreadsheetValidationResponse(BaseModel):
    totalRows: int
    validRowsCount: int
    invalidRowsCount: int
    duplicateRowsCount: int
    errors: List[SpreadsheetValidationError]
    proposedAdditions: List[ProposedAddition] = []
    proposedUpdates: List[ProposedUpdate] = []
    importJobId: Optional[str] = None


class SpreadsheetConfirmRequest(BaseModel):
    importJobId: Optional[str] = None
    import_job_id: Optional[str] = None
    proposedAdditions: Optional[List[ProposedAddition]] = None
    proposedUpdates: Optional[List[ProposedUpdate]] = None
    overwrite_existing: bool = False


class SpreadsheetConfirmResponse(BaseModel):
    status: str = "SUCCESS"
    success: bool = True
    recordsCreated: int
    recordsUpdated: int
    recordsRejected: int
    warnings: List[str] = []
    batchId: Optional[str] = None
    importJobId: Optional[str] = None
    completionTimestamp: str


class ImportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    user_id: Optional[int] = None
    status: str
    rows_processed: int
    accepted_rows: int
    rejected_rows: int
    validation_errors: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
