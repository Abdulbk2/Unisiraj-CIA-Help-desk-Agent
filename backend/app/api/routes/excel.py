"""
UniSIRAJ CIA Helpdesk Agent - Microsoft Excel Integration API Routes
"""

import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_current_user
from app.services.excel_service import ExcelService
from app.schemas.excel import (
    ExcelStatusResponse,
    ExcelFetchResponse,
    ExcelSearchResponse,
    ExcelAnalysisResponse,
    ExcelSyncRequest,
    ExcelSyncResponse,
)

router = APIRouter(prefix="/excel", tags=["Microsoft Excel Integration"])


@router.get("/status", response_model=ExcelStatusResponse)
def get_excel_status():
    """
    Get connectivity status and metadata of the active Microsoft Excel master workbook.
    """
    return ExcelService.get_status()


@router.get("/records", response_model=ExcelFetchResponse)
def fetch_excel_records(
    sheet: Optional[str] = Query(None, description="Sheet name (defaults to first active sheet)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=200, description="Records per page"),
):
    """
    Fetch paginated student records directly from the external Microsoft Excel spreadsheet.
    """
    return ExcelService.fetch_records(sheet_name=sheet, page=page, page_size=page_size)


@router.get("/search", response_model=ExcelSearchResponse)
def search_excel_records(
    q: str = Query(..., min_length=1, description="Search term across name, matric ID, passport, phone, faculty"),
    sheet: Optional[str] = Query(None, description="Sheet name"),
):
    """
    Full-text search for student records inside the external Microsoft Excel spreadsheet.
    """
    return ExcelService.search_students(query=q, sheet_name=sheet)


@router.get("/analyze", response_model=ExcelAnalysisResponse)
def analyze_excel_spreadsheet(
    sheet: Optional[str] = Query(None, description="Sheet name to analyze"),
    db: Session = Depends(get_db),
):
    """
    Perform deep data quality and discrepancy audit comparing Excel spreadsheet against database.
    Detects students missing in DB, students missing in Excel, and conflicting expiry dates/contact numbers.
    """
    return ExcelService.analyze_spreadsheet(db=db, sheet_name=sheet)


@router.post("/sync", response_model=ExcelSyncResponse)
def sync_excel_spreadsheet(
    payload: ExcelSyncRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Synchronize between Microsoft Excel master workbook and the database.
    - direction 'excel_to_db': Upserts Excel student records into the database.
    - direction 'db_to_excel': Exports live database statuses into the Excel workbook.
    """
    if payload.direction == "db_to_excel":
        return ExcelService.sync_db_to_excel(
            db=db,
            sheet_name=payload.sheet_name,
            user_id=current_user.id if current_user else None,
        )
    return ExcelService.sync_excel_to_db(
        db=db,
        sheet_name=payload.sheet_name,
        user_id=current_user.id if current_user else None,
    )


@router.post("/upload", response_model=ExcelStatusResponse)
async def upload_excel_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Upload or replace the active external Microsoft Excel master workbook.
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid Microsoft Excel (.xlsx or .xls) file.",
        )

    content = await file.read()
    try:
        return ExcelService.save_uploaded_file(file_bytes=content, filename=file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse uploaded Excel file: {str(e)}",
        )


@router.get("/download")
def download_excel_file():
    """
    Download the active Microsoft Excel master workbook (.xlsx).
    """
    file_bytes = ExcelService.get_excel_bytes()
    filename = "UniSIRAJ_International_Students_Master.xlsx"
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
