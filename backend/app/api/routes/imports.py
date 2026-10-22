"""
UniSIRAJ CIA Helpdesk Agent - Spreadsheet Ingestion API Endpoints
"""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.import_job import (
    SpreadsheetPreviewResponse,
    SpreadsheetValidationRequest,
    SpreadsheetValidationResponse,
    SpreadsheetConfirmRequest,
    SpreadsheetConfirmResponse,
    ImportJobResponse,
)
from app.services.spreadsheet_service import SpreadsheetService
from app.models.import_job import ImportJob
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/imports", tags=["Spreadsheet Ingestion"])


@router.post("/preview", response_model=SpreadsheetPreviewResponse)
async def preview_spreadsheet(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Ingest uploaded Excel (.xlsx) or CSV file and return metadata with first rows preview.
    """
    content = await file.read()
    try:
        preview = SpreadsheetService.preview_file(
            filename=file.filename or "upload.xlsx",
            content=content,
            user_id=current_user.id if current_user else None,
        )
        return preview
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded file: {str(e)}",
        )


@router.post("/validate", response_model=SpreadsheetValidationResponse)
def validate_spreadsheet(
    payload: SpreadsheetValidationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Perform row-by-row validation, detect duplicate matric IDs, check date formats, and format diffs.
    """
    if not payload.rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rows provided for validation.",
        )

    res = SpreadsheetService.validate_spreadsheet_data(
        db=db,
        rows=payload.rows,
        mapping=payload.mapping,
        import_job_id=payload.import_job_id,
    )
    return res


@router.post("/confirm", response_model=SpreadsheetConfirmResponse)
def confirm_spreadsheet(
    payload: SpreadsheetValidationResponse,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Confirm and commit validated student records inside an atomic database transaction.
    """
    try:
        res = SpreadsheetService.commit_import(
            db=db,
            validated_data=payload,
            actor_id=current_user.id if current_user else None,
            overwrite_existing=True,
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{import_id}/commit", response_model=SpreadsheetConfirmResponse)
def commit_import_job(
    import_id: str,
    payload: SpreadsheetConfirmRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Commit an import job by import ID with optional overwrite_existing flag.
    """
    # Create validation response structure from payload if provided
    val_resp = SpreadsheetValidationResponse(
        totalRows=len(payload.proposedAdditions or []) + len(payload.proposedUpdates or []),
        validRowsCount=len(payload.proposedAdditions or []),
        invalidRowsCount=0,
        duplicateRowsCount=len(payload.proposedUpdates or []),
        errors=[],
        proposedAdditions=payload.proposedAdditions or [],
        proposedUpdates=payload.proposedUpdates or [],
        importJobId=import_id,
    )

    try:
        res = SpreadsheetService.commit_import(
            db=db,
            validated_data=val_resp,
            actor_id=current_user.id if current_user else None,
            overwrite_existing=payload.overwrite_existing,
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{import_id}", response_model=ImportJobResponse)
def get_import_job(
    import_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieve import job status and statistics.
    """
    job = db.query(ImportJob).filter(ImportJob.id == import_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import job with ID {import_id} not found.",
        )
    return job


@router.get("/{import_id}/errors")
def get_import_job_errors(
    import_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieve row-by-row validation errors for an import job.
    """
    job = db.query(ImportJob).filter(ImportJob.id == import_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import job with ID {import_id} not found.",
        )

    errors = []
    if job.validation_errors:
        try:
            errors = json.loads(job.validation_errors)
        except Exception:
            pass

    return {
        "import_job_id": job.id,
        "total_errors": len(errors),
        "errors": errors,
    }
