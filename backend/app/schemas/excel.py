"""
UniSIRAJ CIA Helpdesk Agent - Microsoft Excel Integration Schemas
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExcelStatusResponse(BaseModel):
    is_connected: bool
    filename: str
    filepath: str
    file_size_bytes: int
    sheet_names: List[str]
    active_sheet: str
    total_rows: int
    last_modified: Optional[str] = None
    last_sync_timestamp: Optional[str] = None
    sync_status: str = "SYNCHRONIZED"


class ExcelStudentItem(BaseModel):
    row_index: int
    matric_id: str
    student_name: str
    nationality: Optional[str] = None
    passport_number: Optional[str] = None
    visa_expiry_date: Optional[str] = None
    whatsapp_number: Optional[str] = None
    faculty: Optional[str] = None
    program: Optional[str] = None
    emgs_status: Optional[str] = None
    days_remaining: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ExcelFetchResponse(BaseModel):
    sheet_name: str
    total_rows: int
    page: int
    page_size: int
    total_pages: int
    data: List[ExcelStudentItem]


class ExcelSearchResponse(BaseModel):
    query: str
    total_matches: int
    matches: List[ExcelStudentItem]


class DiscrepancyItem(BaseModel):
    matric_id: str
    student_name: str
    discrepancy_type: str  # MISSING_IN_DB, MISSING_IN_EXCEL, FIELD_MISMATCH
    field_name: Optional[str] = None
    excel_value: Optional[Any] = None
    db_value: Optional[Any] = None
    description: str


class ExcelAnalysisResponse(BaseModel):
    filename: str
    active_sheet: str
    total_records: int
    quality_metrics: Dict[str, int] = Field(
        default_factory=lambda: {
            "missing_dates": 0,
            "missing_phones": 0,
            "missing_passports": 0,
            "invalid_dates": 0,
        }
    )
    visa_status_distribution: Dict[str, int] = Field(
        default_factory=lambda: {
            "SAFE": 0,
            "ACTION_NEEDED": 0,
            "URGENT": 0,
            "CRITICAL": 0,
            "EXPIRED": 0,
            "REVIEW_REQUIRED": 0,
        }
    )
    discrepancies: List[DiscrepancyItem] = []
    total_discrepancies: int = 0
    analyzed_at: str


class ExcelSyncRequest(BaseModel):
    direction: str = Field(
        default="excel_to_db",
        description="'excel_to_db' to import/update DB from Excel; 'db_to_excel' to export DB to Excel"
    )
    sheet_name: Optional[str] = None


class ExcelSyncResponse(BaseModel):
    direction: str
    records_updated: int
    records_created: int
    conflicts_resolved: int
    total_processed: int
    message: str
    synced_at: str
    status: str = "SUCCESS"
