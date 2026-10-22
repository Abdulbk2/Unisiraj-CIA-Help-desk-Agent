"""
UniSIRAJ CIA Helpdesk Agent - Twilio Delivery Status Webhook
"""

from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.twilio_service import twilio_service
from app.services.notification_service import NotificationService
from app.core.logging import logger

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/twilio/status")
async def twilio_delivery_status_callback(
    request: Request,
    db: Session = Depends(get_db),
    x_twilio_signature: Optional[str] = Header(None, alias="X-Twilio-Signature"),
):
    """
    Twilio delivery status callback webhook.
    Validates cryptographic HMAC signature and updates notification delivery status safely.
    """
    form_data = await request.form()
    data_dict = {k: str(v) for k, v in form_data.items()}

    # Validate signature if in live Twilio mode
    if twilio_service.provider == "twilio":
        if not x_twilio_signature:
            logger.warning("Rejected Twilio webhook: Missing X-Twilio-Signature header.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing signature header.")

        url = str(request.url)
        is_valid = twilio_service.validate_webhook_signature(url, data_dict, x_twilio_signature)
        if not is_valid:
            logger.warning(f"Rejected Twilio webhook: Invalid signature for URL {url}.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook signature.")

    message_sid = data_dict.get("MessageSid") or data_dict.get("SmsSid")
    message_status = data_dict.get("MessageStatus") or data_dict.get("SmsStatus")
    error_code = data_dict.get("ErrorCode")
    error_message = data_dict.get("ErrorMessage")

    if not message_sid or not message_status:
        # Check JSON body fallback
        try:
            json_body = await request.json()
            message_sid = json_body.get("MessageSid")
            message_status = json_body.get("MessageStatus")
            error_code = json_body.get("ErrorCode")
            error_message = json_body.get("ErrorMessage")
        except Exception:
            pass

    if not message_sid or not message_status:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing MessageSid or MessageStatus.")

    NotificationService.update_webhook_status(
        db=db,
        provider_message_id=message_sid,
        new_status=message_status,
        error_code=error_code,
        error_message=error_message,
    )

    return {"received": True, "provider_message_id": message_sid, "status": message_status}
