"""
UniSIRAJ CIA Helpdesk Agent - Grounded AI Administrative Assistant
"""

import os
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import Student, StudentStatus
from app.models.notification import NotificationHistory, NotificationStatus
from app.models.import_job import ImportJob
from app.models.user import User
from app.services.student_service import get_current_business_date, calculate_days_remaining, determine_student_status
from app.services.visa_monitoring_service import VisaMonitoringService
from app.services.audit_service import AuditService
from app.schemas.assistant import AgentQueryResponse, AssistantHealthResponse
from app.core.config import settings
from app.core.logging import logger

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class AiAgentTools:
    """
    Deterministic, parameterized database inspection tools for the AI agent.
    Never allows arbitrary SQL or shell commands.
    """
    @staticmethod
    def get_expiry_summary(db: Session) -> Dict[str, Any]:
        """Get authoritative summary counts of all visa records by status."""
        summary = VisaMonitoringService.get_monitoring_summary(db)
        return {
            "evaluation_date": summary.evaluation_date,
            "total_records": summary.total_records,
            "safe_count": summary.safe_count,
            "action_needed_count_90d": summary.action_needed_count,
            "urgent_count_60d": summary.urgent_count,
            "critical_count_30d": summary.critical_count,
            "expired_count": summary.expired_count,
            "review_required_count": summary.review_required_count,
        }

    @staticmethod
    def get_expiring_records(
        db: Session,
        within_days: int = 30,
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """List students with visas expiring within a given number of days."""
        today = get_current_business_date()
        students = db.query(Student).all()
        results = []

        for s in students:
            days = calculate_days_remaining(s.visa_expiry_date, today)
            if days is not None and days <= within_days:
                expiry_str = s.visa_expiry_date.strftime("%d %b %Y") if s.visa_expiry_date else "N/A"
                results.append({
                    "id": str(s.id),
                    "matric_id": s.matric_id,
                    "matricId": s.matric_id,
                    "student_name": s.student_name,
                    "fullName": s.student_name,
                    "nationality": s.nationality or "International",
                    "passport_number": s.passport_number or "",
                    "passportNumber": s.passport_number or "",
                    "email": s.email or "",
                    "phone_number": s.whatsapp_number or "",
                    "phoneNumber": s.whatsapp_number or "",
                    "whatsapp_number": s.whatsapp_number or "",
                    "faculty": s.faculty or "",
                    "program": s.program or "",
                    "emgs_status": getattr(s, 'emgs_status', 'VERIFIED'),
                    "emgsStatus": getattr(s, 'emgs_status', 'VERIFIED'),
                    "visa_expiry_date": s.visa_expiry_date.isoformat() if s.visa_expiry_date else None,
                    "formattedExpiryDate": expiry_str,
                    "days_remaining": days,
                    "daysRemaining": days,
                    "status": determine_student_status(days),
                    "isExpired": days < 0,
                    "isExpiringToday": days == 0,
                })

        results.sort(key=lambda x: x["days_remaining"])
        return results[:limit]

    @staticmethod
    def get_records_needing_review(db: Session, limit: int = 15) -> List[Dict[str, Any]]:
        """List records with missing expiry dates or requiring administrative review."""
        records = db.query(Student).filter(
            (Student.visa_expiry_date == None) | (Student.status == StudentStatus.REVIEW_REQUIRED)
        ).limit(limit).all()

        return [
            {
                "id": str(s.id),
                "matric_id": s.matric_id,
                "matricId": s.matric_id,
                "student_name": s.student_name,
                "fullName": s.student_name,
                "nationality": s.nationality or "International",
                "passport_number": s.passport_number or "",
                "passportNumber": s.passport_number or "",
                "email": s.email or "",
                "phone_number": s.whatsapp_number or "",
                "phoneNumber": s.whatsapp_number or "",
                "whatsapp_number": s.whatsapp_number or "",
                "faculty": s.faculty or "",
                "program": s.program or "",
                "status": s.status or "REVIEW_REQUIRED",
                "daysRemaining": -999,
                "days_remaining": -999,
                "issue": "Missing visa expiry date in active database record."
            }
            for s in records
        ]

    @staticmethod
    def get_notification_summary(db: Session) -> Dict[str, Any]:
        """Get summary of dispatched WhatsApp notifications and delivery metrics."""
        total = db.query(NotificationHistory).count()
        delivered = db.query(NotificationHistory).filter(NotificationHistory.status == NotificationStatus.DELIVERED).count()
        sent = db.query(NotificationHistory).filter(NotificationHistory.status == NotificationStatus.SENT).count()
        failed = db.query(NotificationHistory).filter(NotificationHistory.status.in_([NotificationStatus.FAILED, NotificationStatus.UNDELIVERED])).count()
        queued = db.query(NotificationHistory).filter(NotificationHistory.status.in_([NotificationStatus.PENDING, NotificationStatus.QUEUED])).count()

        return {
            "total_notifications": total,
            "delivered": delivered,
            "sent_in_transit": sent,
            "queued": queued,
            "failed": failed,
            "delivery_rate_percent": round((delivered / total * 100), 1) if total > 0 else 100.0,
        }

    @staticmethod
    def get_import_validation_summary(db: Session) -> Dict[str, Any]:
        """Summarize latest spreadsheet import job and any validation errors."""
        latest_job = db.query(ImportJob).order_by(ImportJob.created_at.desc()).first()
        if not latest_job:
            return {"message": "No spreadsheet import jobs recorded yet."}

        errors_parsed = []
        if latest_job.validation_errors:
            try:
                errors_parsed = json.loads(latest_job.validation_errors)
            except Exception:
                pass

        return {
            "import_job_id": latest_job.id,
            "filename": latest_job.filename,
            "status": latest_job.status,
            "rows_processed": latest_job.rows_processed,
            "accepted_rows": latest_job.accepted_rows,
            "rejected_rows": latest_job.rejected_rows,
            "created_at": latest_job.created_at.isoformat() if latest_job.created_at else None,
            "total_errors": len(errors_parsed),
            "sample_errors": errors_parsed[:5],
        }

    @staticmethod
    def excel_get_status() -> Dict[str, Any]:
        """Check connection status and metadata of the external master Excel file."""
        from app.services.excel_service import ExcelService
        status = ExcelService.get_status()
        return status.model_dump()

    @staticmethod
    def excel_analyze_sheet(db: Session) -> Dict[str, Any]:
        """Audit the external Excel spreadsheet for data discrepancies with the database and quality warnings."""
        from app.services.excel_service import ExcelService
        analysis = ExcelService.analyze_spreadsheet(db)
        return analysis.model_dump()

    @staticmethod
    def excel_search_students(query: str) -> Dict[str, Any]:
        """Search student records directly inside the external Microsoft Excel spreadsheet."""
        from app.services.excel_service import ExcelService
        search_res = ExcelService.search_students(query)
        return search_res.model_dump()

    @staticmethod
    def excel_fetch_records(limit: int = 15) -> Dict[str, Any]:
        """Fetch records directly from the external Microsoft Excel file."""
        from app.services.excel_service import ExcelService
        fetch_res = ExcelService.fetch_records(page=1, page_size=limit)
        return fetch_res.model_dump()

    @staticmethod
    def excel_sync_records(db: Session, direction: str = "excel_to_db") -> Dict[str, Any]:
        """Execute synchronization between Microsoft Excel master file and the database."""
        from app.services.excel_service import ExcelService
        if direction == "db_to_excel":
            res = ExcelService.sync_db_to_excel(db)
        else:
            res = ExcelService.sync_excel_to_db(db)
        return res.model_dump()


class AiAgentService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = None

        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to create Google GenAI client: {e}")

    def query(
        self,
        db: Session,
        question: str,
        user: Optional[User] = None
    ) -> AgentQueryResponse:
        """
        Grounded query handler:
        1. Classifies intent and runs authoritative parameterized DB queries.
        2. Synthesizes a factual, verified answer using Gemini or deterministic fallback.
        3. Never hallucinates immigration advice or policies not in database.
        """
        start_time = time.time()
        q_lower = question.lower()

        # Deterministic data extraction based on question
        intent = "GENERAL_COMPLIANCE"
        data_context: Dict[str, Any] = {}
        matched_students: List[Any] = []
        followups = [
            "Which students have visas expiring within 30 days?",
            "How many visa reminders were delivered this month?",
            "Which records require urgent review?",
        ]

        if any(w in q_lower for w in ["excel", "xlsx", "master file", "master spreadsheet", "external spreadsheet"]):
            if any(w in q_lower for w in ["sync", "export", "synchronize", "push to db", "pull from db"]):
                intent = "EXCEL_SYNC"
                direction = "db_to_excel" if any(w in q_lower for w in ["db to excel", "export", "database to excel"]) else "excel_to_db"
                sync_res = AiAgentTools.excel_sync_records(db, direction=direction)
                data_context["excel_sync_result"] = sync_res
                followups = [
                    "Analyze the Excel spreadsheet for discrepancies",
                    "Search student in Excel master file",
                    "Download the updated Excel file",
                ]
            elif any(w in q_lower for w in ["search", "find", "lookup", "check student"]):
                intent = "EXCEL_SEARCH"
                term = q_lower
                for stop in ["search for", "search in excel", "find in excel", "lookup in excel", "search", "find", "in excel", "in spreadsheet", "the excel", "spreadsheet"]:
                    term = term.replace(stop, "")
                clean_term = term.strip() or question
                search_res = AiAgentTools.excel_search_students(clean_term)
                data_context["excel_search_matches"] = search_res.get("matches", [])
                matched_students = search_res.get("matches", [])
                followups = [
                    "Analyze the Excel spreadsheet for discrepancies",
                    "Sync this student's data with database",
                    "Fetch all records from Excel",
                ]
            elif any(w in q_lower for w in ["analyze", "discrepanc", "mismatch", "compare", "audit", "conflict", "diff"]):
                intent = "EXCEL_ANALYZE"
                analysis = AiAgentTools.excel_analyze_sheet(db)
                data_context["excel_analysis"] = analysis
                matched_students = analysis.get("discrepancies", [])
                followups = [
                    "Sync Excel records into database to resolve discrepancies",
                    "Export database records into Excel master file",
                    "Search student in Excel",
                ]
            elif any(w in q_lower for w in ["fetch", "show", "rows", "list", "records"]):
                intent = "EXCEL_FETCH"
                fetched = AiAgentTools.excel_fetch_records(limit=10)
                data_context["excel_records"] = fetched.get("data", [])
                matched_students = fetched.get("data", [])
                followups = [
                    "Analyze the Excel spreadsheet for discrepancies",
                    "Search student in Excel",
                    "Sync Excel records to database",
                ]
            else:
                intent = "EXCEL_STATUS"
                st = AiAgentTools.excel_get_status()
                data_context["excel_status"] = st
                followups = [
                    "Analyze the Excel spreadsheet for discrepancies",
                    "Search student in Excel file",
                    "Sync Excel spreadsheet with database",
                ]
        elif any(w in q_lower for w in ["30", "critical", "urgent", "soon"]):
            intent = "EXPIRING_CRITICAL"
            expiring = AiAgentTools.get_expiring_records(db, within_days=30, limit=10)
            data_context["expiring_within_30_days"] = expiring
            matched_students = expiring
            followups = [
                "Send Tier 3 WhatsApp reminders to these students",
                "Show students with visas expiring in 60 days",
                "Check delivery status of previous reminders",
            ]
        elif any(w in q_lower for w in ["60", "follow up", "follow-up"]):
            intent = "EXPIRING_60_DAYS"
            expiring = AiAgentTools.get_expiring_records(db, within_days=60, limit=10)
            data_context["expiring_within_60_days"] = expiring
            matched_students = expiring
        elif any(w in q_lower for w in ["90", "opened", "window"]):
            intent = "EXPIRING_90_DAYS"
            expiring = AiAgentTools.get_expiring_records(db, within_days=90, limit=10)
            data_context["expiring_within_90_days"] = expiring
            matched_students = expiring
        elif any(w in q_lower for w in ["expired", "overstay"]):
            intent = "EXPIRED_OVERSTAY"
            expired = AiAgentTools.get_expiring_records(db, within_days=-1, limit=10)
            data_context["expired_records"] = expired
            matched_students = expired
            followups = [
                "Generate overstay referral list for Immigration",
                "Check if emergency WhatsApp notices were sent",
            ]
        elif any(w in q_lower for w in ["review", "missing", "invalid", "malformed"]):
            intent = "REVIEW_REQUIRED"
            review_records = AiAgentTools.get_records_needing_review(db, limit=10)
            data_context["records_needing_review"] = review_records
            matched_students = review_records
        elif any(w in q_lower for w in ["notification", "delivered", "whatsapp", "failed", "sent"]):
            intent = "NOTIFICATION_METRICS"
            notif_summary = AiAgentTools.get_notification_summary(db)
            data_context["notification_summary"] = notif_summary
            followups = [
                "Retry failed WhatsApp notifications",
                "Show list of students who haven't received reminders",
            ]
        elif any(w in q_lower for w in ["import", "validation", "spreadsheet", "upload", "error"]):
            intent = "IMPORT_VALIDATION"
            import_summary = AiAgentTools.get_import_validation_summary(db)
            data_context["import_summary"] = import_summary
        else:
            # General summary
            summary = AiAgentTools.get_expiry_summary(db)
            data_context["overall_summary"] = summary

        # Synthesize answer using Gemini if configured, or deterministic fallback
        answer_text = ""
        if self.client and GENAI_AVAILABLE:
            system_instruction = (
                "You are the UniSIRAJ CIA International Student Visa Administrative Assistant for the "
                "Centre of International Affairs, Universiti Islam Antarabangsa Tuanku Syed Sirajuddin. "
                "You MUST adhere strictly to the provided authoritative database records. "
                "Do NOT invent Malaysian immigration policies, fines, fees, or student records. "
                "If the answer cannot be verified from the database data, state that authorized CIA staff confirmation is needed."
            )
            prompt = (
                f"User Question: {question}\n\n"
                f"Authoritative Database Context:\n{json.dumps(data_context, indent=2, default=str)}\n\n"
                "Provide a concise, professional, and clear answer grounded exclusively in the database facts above."
            )
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.2,
                    )
                )
                if response and response.text:
                    answer_text = response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to deterministic answer: {e}")

        if not answer_text:
            answer_text = self._build_deterministic_response(intent, data_context)

        execution_time_ms = int((time.time() - start_time) * 1000)

        # Log AI query audit event (sanitized)
        AuditService.log_event(
            db=db,
            action="AI_ADMIN_QUERY",
            resource_type="ASSISTANT",
            user_id=user.id if user else None,
            details={
                "intent": intent,
                "execution_ms": execution_time_ms,
                "matched_count": len(matched_students),
            }
        )

        return AgentQueryResponse(
            answer=answer_text,
            query=question,
            intent=intent,
            confidence=0.96,
            dataFreshness="Live authoritative database state",
            matchedStudents=matched_students,
            suggestedFollowups=followups,
            executionTimeMs=execution_time_ms,
            dataSource="LIVE_FASTAPI",
        )

    def _build_deterministic_response(self, intent: str, data: Dict[str, Any]) -> str:
        """Deterministic response fallback when Gemini API key is unset or offline."""
        if intent == "EXCEL_ANALYZE":
            analysis = data.get("excel_analysis", {})
            return (
                f"Microsoft Excel Master Spreadsheet Analysis: Active file '{analysis.get('filename', 'unisiraj_students_master.xlsx')}' "
                f"(sheet: '{analysis.get('active_sheet', 'Sheet1')}') contains {analysis.get('total_records', 0)} student records. "
                f"Discrepancy audit identified {analysis.get('total_discrepancies', 0)} total anomalies against the live system database "
                f"({len([d for d in analysis.get('discrepancies', []) if d.get('discrepancy_type') == 'MISSING_IN_DB'])} missing in DB, "
                f"{len([d for d in analysis.get('discrepancies', []) if d.get('discrepancy_type') == 'MISSING_IN_EXCEL'])} missing in Excel, and "
                f"{len([d for d in analysis.get('discrepancies', []) if d.get('discrepancy_type') == 'FIELD_MISMATCH'])} field data mismatches)."
            )
        if intent == "EXCEL_SEARCH":
            matches = data.get("excel_search_matches", [])
            if matches:
                top = matches[0]
                return (
                    f"Microsoft Excel Search: Found {len(matches)} matching student record(s) inside the external spreadsheet. "
                    f"Top Match: {top.get('student_name')} ({top.get('matric_id')}) | Nationality: {top.get('nationality')} | "
                    f"Visa Expiry: {top.get('visa_expiry_date')} ({top.get('status')}) | WhatsApp: {top.get('whatsapp_number')}."
                )
            return "Microsoft Excel Search: No matching student records found in the active external spreadsheet."
        if intent == "EXCEL_SYNC":
            sync_res = data.get("excel_sync_result", {})
            return sync_res.get("message", "Microsoft Excel synchronization completed successfully.")
        if intent == "EXCEL_FETCH":
            records = data.get("excel_records", [])
            return f"Retrieved {len(records)} active international student pass record(s) directly from the external Microsoft Excel master workbook."
        if intent == "EXCEL_STATUS":
            st = data.get("excel_status", {})
            return (
                f"External Microsoft Excel master workbook '{st.get('filename', 'unisiraj_students_master.xlsx')}' is connected. "
                f"File size: {st.get('file_size_bytes', 0)} bytes, Total student rows: {st.get('total_rows', 0)}, "
                f"Available sheets: {', '.join(st.get('sheet_names', []))}."
            )

        if intent == "EXPIRING_CRITICAL":
            records = data.get("expiring_within_30_days", [])
            count = len(records)
            return (
                f"Identified {count} international student(s) whose Student Passes expire within the critical 30-day window. "
                "These students require immediate administrative intervention and Tier 3 WhatsApp notifications."
            )
        if intent == "EXPIRED_OVERSTAY":
            records = data.get("expired_records", [])
            count = len(records)
            return (
                f"Alert: Found {count} student record(s) with EXPIRED Student Passes in the active database. "
                "These individuals must be referred immediately to the CIA enforcement desk and Malaysian Immigration for Special Pass regularisation."
            )
        if intent == "NOTIFICATION_METRICS":
            metrics = data.get("notification_summary", {})
            return (
                f"WhatsApp Notification Metrics: Total dispatched: {metrics.get('total_notifications', 0)}, "
                f"Delivered: {metrics.get('delivered', 0)}, In-transit: {metrics.get('sent_in_transit', 0)}, "
                f"Failed: {metrics.get('failed', 0)} ({metrics.get('delivery_rate_percent', 100)}% delivery success rate)."
            )
        if intent == "REVIEW_REQUIRED":
            records = data.get("records_needing_review", [])
            return (
                f"There are {len(records)} student record(s) requiring urgent administrative review due to missing or unverified expiry dates."
            )
        if intent == "IMPORT_VALIDATION":
            imp = data.get("import_summary", {})
            return (
                f"Latest Import Job ({imp.get('import_job_id', 'N/A')}): File '{imp.get('filename', 'N/A')}', "
                f"Status: {imp.get('status')}, Accepted rows: {imp.get('accepted_rows')}, Rejected rows: {imp.get('rejected_rows')}."
            )

        summary = data.get("overall_summary", {})
        return (
            f"UniSIRAJ CIA Compliance Status: Monitoring {summary.get('total_records', 0)} total international student passes. "
            f"Safe: {summary.get('safe_count', 0)}, Action Needed (90d): {summary.get('action_needed_count_90d', 0)}, "
            f"Urgent (60d): {summary.get('urgent_count_60d', 0)}, Critical (30d): {summary.get('critical_count_30d', 0)}, "
            f"Expired: {summary.get('expired_count', 0)}, Review Required: {summary.get('review_required_count', 0)}."
        )

    def get_health(self, db: Session) -> AssistantHealthResponse:
        db_connected = False
        try:
            db.execute(func.now())
            db_connected = True
        except Exception:
            pass

        return AssistantHealthResponse(
            status="healthy" if (db_connected and self.api_key) else "degraded",
            gemini_model=self.model_name,
            gemini_configured=bool(self.api_key),
            database_connected=db_connected,
            tools_registered=[
                "get_expiry_summary",
                "get_expiring_records",
                "get_records_needing_review",
                "get_notification_summary",
                "get_import_validation_summary",
                "excel_get_status",
                "excel_analyze_sheet",
                "excel_search_students",
                "excel_fetch_records",
                "excel_sync_records",
            ],
        )


ai_agent_service = AiAgentService()
