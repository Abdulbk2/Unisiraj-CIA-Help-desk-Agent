"""
UniSIRAJ CIA Helpdesk Agent - Twilio WhatsApp Messaging Adapter & Mock Provider
"""

import os
import uuid
from typing import Dict, Any, Optional, Tuple
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from app.core.config import settings
from app.core.logging import logger


class TwilioMessageTemplates:
    @staticmethod
    def get_template(
        milestone_days: int,
        student_name: str,
        matric_id: str,
        expiry_date_str: str,
        custom_note: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Returns (template_name, formatted_message)
        """
        contact_info = (
            "Centre of International Affairs (CIA), Level 2, Administration Building, "
            "UniSIRAJ. Email: cia@unisiraj.edu.my | Tel: +60 4-988 5000"
        )

        note_clause = f"\nNote: {custom_note}" if custom_note else ""

        if milestone_days <= 0:
            template_name = "OVERDUE_ALERT"
            body = (
                f"🚨 *UniSIRAJ CIA URGENT NOTICE*\n\n"
                f"Dear *{student_name}* ({matric_id}),\n\n"
                f"Our records indicate that your Student Pass expired on *{expiry_date_str}*. "
                f"Overstaying without a valid pass violates Malaysian Immigration regulations "
                f"and incurs compounding fines.\n\n"
                f"Please report to the CIA Helpdesk IMMEDIATELY for Special Pass regularisation.{note_clause}\n\n"
                f"📍 *CIA Contact:*\n{contact_info}"
            )
        elif milestone_days <= 30:
            template_name = "TIER_3_30_DAYS"
            body = (
                f"⚠️ *UniSIRAJ CIA CRITICAL VISA REMINDER*\n\n"
                f"Dear *{student_name}* ({matric_id}),\n\n"
                f"Your Student Pass will expire in *{milestone_days} days* on *{expiry_date_str}*.\n\n"
                f"Please ensure your renewal passport submission or endorsement with the State Immigration "
                f"Department is completed without further delay to prevent pass expiration.{note_clause}\n\n"
                f"📍 *CIA Helpdesk:*\n{contact_info}"
            )
        elif milestone_days <= 60:
            template_name = "TIER_2_60_DAYS"
            body = (
                f"📅 *UniSIRAJ CIA VISA RENEWAL FOLLOW-UP*\n\n"
                f"Dear *{student_name}* ({matric_id}),\n\n"
                f"Your Student Pass expires in *{milestone_days} days* on *{expiry_date_str}*.\n\n"
                f"Kindly ensure that all required EMGS renewal documents and passport photocopies are submitted "
                f"to the CIA Helpdesk for processing.{note_clause}\n\n"
                f"📍 *CIA Helpdesk:*\n{contact_info}"
            )
        else:
            template_name = "TIER_1_90_DAYS"
            body = (
                f"📋 *UniSIRAJ CIA VISA RENEWAL NOTICE*\n\n"
                f"Dear *{student_name}* ({matric_id}),\n\n"
                f"Your Student Pass will expire on *{expiry_date_str}* (approx. {milestone_days} days remaining).\n\n"
                f"The 3-month renewal application window has opened. Please begin preparing your academic transcripts, "
                f"insurance clearance, and passport renewals for timely EMGS submission.{note_clause}\n\n"
                f"📍 *CIA Helpdesk:*\n{contact_info}"
            )

        return template_name, body


class TwilioService:
    @property
    def provider(self) -> str:
        return settings.TWILIO_PROVIDER.lower()

    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_WHATSAPP_FROM.strip().replace(" ", "") if settings.TWILIO_WHATSAPP_FROM else ""
        self.client = None

        if self.provider == "twilio" and self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")

    def send_whatsapp_message(
        self,
        to_phone: str,
        message_body: str,
        callback_url: Optional[str] = None,
        content_variables: Optional[Dict[str, str]] = None,
        override_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message via Twilio API or simulate via Demo/Mock provider.
        Supports override_provider='twilio' or 'demo'/'mock'.
        """
        import json

        # Ensure recipient has whatsapp: prefix and no spaces/hyphens
        phone_digits = to_phone.strip().replace("whatsapp:", "").replace(" ", "").replace("-", "")
        clean_to = f"whatsapp:{phone_digits}"

        chosen_provider = (override_provider or self.provider).lower()

        # If Demo / Mock mode requested
        if chosen_provider in ["demo", "mock"]:
            demo_sid = f"SM_DEMO_{uuid.uuid4().hex[:24]}"
            logger.info(f"[DEMO WHATSAPP] Simulating delivery to {clean_to}: {message_body[:60]}... [SID: {demo_sid}]")
            return {
                "success": True,
                "provider_message_id": demo_sid,
                "status": "delivered",
                "error": None,
                "dispatch_method": "demo",
            }

        # Otherwise live Twilio dispatch
        if not self.client:
            err_msg = "Twilio client is not initialized. Please ensure valid TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are configured in backend/.env."
            logger.error(err_msg)
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": err_msg,
                "dispatch_method": "twilio",
            }

        try:
            kwargs = {
                "from_": self.from_number,
                "to": clean_to,
            }

            # If a Content Template SID is configured
            if getattr(settings, "TWILIO_CONTENT_SID", None):
                kwargs["content_sid"] = settings.TWILIO_CONTENT_SID
                if content_variables:
                    kwargs["content_variables"] = json.dumps(content_variables)
            else:
                kwargs["body"] = message_body

            if callback_url or settings.TWILIO_STATUS_CALLBACK_URL:
                kwargs["status_callback"] = callback_url or settings.TWILIO_STATUS_CALLBACK_URL

            message = self.client.messages.create(**kwargs)
            return {
                "success": True,
                "provider_message_id": message.sid,
                "status": message.status,
                "error": None,
                "dispatch_method": "twilio",
            }
        except Exception as e:
            err_str = str(e)
            logger.error(f"Twilio WhatsApp dispatch failed to {clean_to}: {err_str}")

            # Provide clear explanations for Twilio Trial & WhatsApp compliance requirements
            if "ContentSid Required" in err_str or "21654" in err_str or "572006" in err_str:
                friendly_error = (
                    f"Twilio Trial Restriction (ContentSid Required): On a Twilio Free Trial account, "
                    f"messages cannot be sent as custom freeform text. To resolve this: "
                    f"(1) Select 'Demo / Simulation Mode' for testing, or "
                    f"(2) Copy the template Content SID from the Twilio Console and add TWILIO_CONTENT_SID=HX... in backend/.env, or "
                    f"(3) Upgrade your Twilio account from Trial to Pay-as-you-go."
                )
            elif "21608" in err_str or "unverified" in err_str.lower():
                friendly_error = (
                    f"Twilio Trial Restriction: Recipient {clean_to} is unverified. "
                    f"On a trial account, recipient must send 'join twilio-trial' to {self.from_number} to opt in."
                )
            elif "63016" in err_str:
                friendly_error = (
                    f"Recipient {clean_to} has not opted into this WhatsApp sender ({self.from_number}). "
                    f"Please text 'join twilio-trial' to {self.from_number} first, or use Demo Mode."
                )
            else:
                friendly_error = f"Twilio API Error: {err_str}"

            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": friendly_error,
                "dispatch_method": "twilio",
            }

    def send_email_message(
        self,
        to_email: str,
        subject: str,
        message_body: str,
        override_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send an official institutional email via Twilio SendGrid API or simulate via Demo/Mock provider.
        Supports override_provider='twilio' or 'demo'.
        """
        import httpx

        chosen_provider = (override_provider or self.provider).lower()
        sendgrid_api_key = getattr(settings, "TWILIO_SENDGRID_API_KEY", "") or os.getenv("TWILIO_SENDGRID_API_KEY", "")
        from_email = getattr(settings, "TWILIO_EMAIL_FROM", "cia.helpdesk@unisiraj.edu.my")

        # If Demo / Mock mode or no SendGrid key configured
        if chosen_provider in ["demo", "mock"] or not sendgrid_api_key:
            demo_sid = f"SG_DEMO_{uuid.uuid4().hex[:20]}"
            logger.info(f"[DEMO EMAIL] Simulating dispatch to {to_email}: '{subject}' [SID: {demo_sid}]")
            return {
                "success": True,
                "provider_message_id": demo_sid,
                "status": "delivered",
                "error": None,
                "dispatch_method": "demo" if chosen_provider in ["demo", "mock"] else "demo (SendGrid key not configured)",
            }

        # Live SendGrid / Twilio Email dispatch
        try:
            payload = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": from_email, "name": "UniSIRAJ Centre for International Affairs"},
                "subject": subject,
                "content": [{"type": "text/plain", "value": message_body}],
            }
            headers = {
                "Authorization": f"Bearer {sendgrid_api_key}",
                "Content-Type": "application/json",
            }

            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers=headers)
                if res.status_code in [200, 202]:
                    sg_id = res.headers.get("X-Message-Id", f"SG_{uuid.uuid4().hex[:18]}")
                    return {
                        "success": True,
                        "provider_message_id": sg_id,
                        "status": "delivered",
                        "error": None,
                        "dispatch_method": "twilio",
                    }
                else:
                    return {
                        "success": False,
                        "provider_message_id": None,
                        "status": "failed",
                        "error": f"SendGrid API Error ({res.status_code}): {res.text}",
                        "dispatch_method": "twilio",
                    }
        except Exception as e:
            logger.error(f"SendGrid email dispatch failed to {to_email}: {e}")
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": f"Email dispatch failed: {str(e)}",
                "dispatch_method": "twilio",
            }

    def validate_webhook_signature(
        self,
        url: str,
        params: Dict[str, Any],
        signature: str
    ) -> bool:
        """
        Verify incoming Twilio webhook HTTP HMAC-SHA1 signature.
        """
        if self.provider == "mock":
            return True  # Bypass in mock/testing environments

        try:
            validator = RequestValidator(self.auth_token)
            return validator.validate(url, params, signature)
        except Exception as e:
            logger.warning(f"Twilio signature validation error: {e}")
            return False


twilio_service = TwilioService()
