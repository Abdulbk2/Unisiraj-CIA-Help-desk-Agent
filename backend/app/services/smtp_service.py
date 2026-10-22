"""
UniSIRAJ CIA Helpdesk Agent - Live Real-Time SMTP Email Service
Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)
"""

import os
import smtplib
import uuid
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger


def get_logo_path() -> Optional[str]:
    """Find the CIA Helpdesk Agent official emblem image on disk."""
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "images", "cia-helpdesk-agent-official.png"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "images", "cia-helpdesk-agent-official.png"),
        r"C:\Users\abdry\antigravity\UniSIRAJ-CIA-Helpdesk-Agent\public\images\cia-helpdesk-agent-official.png",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def generate_professional_html_notice(
    student_name: str,
    matric_id: str,
    passport_number: str = "N/A",
    nationality: str = "International",
    expiry_date: str = "N/A",
    days_remaining: int = 0,
    status_label: str = "Action Needed",
    emgs_status: str = "Verified",
    program: str = "Academic Program",
    faculty: str = "General Studies",
    custom_note: Optional[str] = None,
) -> str:
    """
    Constructs a high-end, responsive HTML email template using the UniSIRAJ CIA Helpdesk Agent brand colors:
    - Primary Navy Blue (#0D2040, #1E3A5F, #2457A7)
    - UniSIRAJ Gold Accent (#D6A52B)
    - Institutional Card (#FFFFFF with #E4E7EC borders)
    - Clean typography and embedded CIA Helpdesk Agent logo (cid:cia_logo)
    """
    # Color-coded urgency configuration
    if days_remaining < 0:
        banner_bg = "#FEF2F2"
        banner_border = "#EF4444"
        banner_text = "#991B1B"
        badge_bg = "#FEE2E2"
        badge_text = "#991B1B"
        days_color = "#DC2626"
        tier_title = "🚨 OVERSTAY NOTICE • IMMEDIATE RECTIFICATION REQUIRED"
        urgency_lead = (
            "<strong>URGENT NOTICE:</strong> Our records indicate that your Student Pass has expired. "
            "Under Malaysian Immigration regulations, remaining in the country without a valid pass constitutes "
            "an overstay offence and incurs compounding penalties. You must report to the CIA Helpdesk immediately."
        )
    elif days_remaining <= 29:
        banner_bg = "#FEF2F2"
        banner_border = "#EF4444"
        banner_text = "#991B1B"
        badge_bg = "#FEE2E2"
        badge_text = "#991B1B"
        days_color = "#DC2626"
        tier_title = "⚠️ CRITICAL VISA RENEWAL NOTICE (<30 DAYS REMAINING)"
        urgency_lead = (
            "<strong>CRITICAL NOTICE:</strong> In accordance with Malaysian Immigration and EMGS procedures, "
            "student pass renewals must be submitted at least 3 months in advance. Your window has entered the "
            "critical escalation threshold with fewer than 30 days remaining."
        )
    elif days_remaining <= 59:
        banner_bg = "#FFF7ED"
        banner_border = "#F97316"
        banner_text = "#9A3412"
        badge_bg = "#FFEDD5"
        badge_text = "#9A3412"
        days_color = "#EA580C"
        tier_title = "📅 URGENT VISA RENEWAL NOTICE (30–59 DAYS)"
        urgency_lead = (
            "<strong>ACTION REQUIRED:</strong> Your Student Pass will expire in under 60 days. "
            "Please ensure that your academic transcripts and EMGS renewal application are submitted "
            "to the CIA Helpdesk without delay."
        )
    elif days_remaining <= 90:
        banner_bg = "#FFFBEB"
        banner_border = "#F59E0B"
        banner_text = "#92400E"
        badge_bg = "#FEF3C7"
        badge_text = "#92400E"
        days_color = "#D97706"
        tier_title = "📋 VISA RENEWAL APPLICATION WINDOW OPEN (60–90 DAYS)"
        urgency_lead = (
            "<strong>RENEWAL WINDOW OPEN:</strong> The 3-month renewal application window has officially opened. "
            "Please begin preparing your passport renewal and supporting documentation for timely EMGS submission."
        )
    else:
        banner_bg = "#F0FDF4"
        banner_border = "#10B981"
        banner_text = "#166534"
        badge_bg = "#DCFCE7"
        badge_text = "#166534"
        days_color = "#16A34A"
        tier_title = "✅ STUDENT PASS COMPLIANCE STATUS UPDATE"
        urgency_lead = "Your Student Pass is currently valid and compliant with Malaysian Immigration guidelines."

    note_section = ""
    if custom_note:
        note_section = f"""
        <div style="background-color:#F5F6F8; border-left:4px solid #D6A52B; padding:12px 16px; border-radius:0 8px 8px 0; margin:18px 0;">
          <div style="font-size:11px; font-weight:700; color:#475467; text-transform:uppercase; letter-spacing:0.5px;">Officer Directive / Special Instructions:</div>
          <p style="margin:4px 0 0 0; font-size:13px; color:#182230; line-height:1.5;">{custom_note}</p>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>UniSIRAJ CIA Official Visa Notice</title>
</head>
<body style="margin:0; padding:0; background-color:#F2F4F7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased; color:#182230;">
  <!-- Hidden Preheader for Receiver Inbox Preview -->
  <div style="display:none; font-size:1px; color:#F2F4F7; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all;">
    Official Visa Compliance Notice - UniSIRAJ Centre for International Affairs (CIA) Helpdesk regarding student pass validity for {student_name} ({matric_id}).
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F2F4F7; padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px; background-color:#FFFFFF; border:1px solid #E4E7EC; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(13,32,64,0.08);">
          
          <!-- Header Banner with Brand Navy & Gold Accent -->
          <tr>
            <td style="background-color:#0D2040; background:linear-gradient(135deg, #0D2040 0%, #1E3A5F 100%); padding:28px 24px 22px 24px; text-align:center;">
              <!-- Logo Container with crisp white badge for perfect contrast -->
              <div style="display:inline-block; background-color:#FFFFFF; padding:10px 22px; border-radius:14px; box-shadow:0 4px 14px rgba(0,0,0,0.18); margin-bottom:12px;">
                <img src="cid:cia_logo" alt="UniSIRAJ CIA Helpdesk Agent" width="220" style="display:block; max-width:220px; width:220px; height:auto; border:0; outline:none; text-decoration:none;" />
              </div>
              <div style="color:#D6A52B; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.8px; margin-top:4px;">
                Centre for International Affairs (CIA)
              </div>
              <div style="color:#CBD5E1; font-size:12px; margin-top:3px; letter-spacing:0.3px;">
                Universiti Islam Antarabangsa Tuanku Syed Sirajuddin
              </div>
            </td>
          </tr>
          
          <!-- UniSIRAJ Gold Accent Divider Bar -->
          <tr>
            <td style="background-color:#D6A52B; height:4px; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding:28px 26px 20px 26px;">
              
              <!-- Urgency Status Pill Banner -->
              <div style="background-color:{banner_bg}; border:1px solid {banner_border}; border-radius:12px; padding:14px 16px; margin-bottom:22px;">
                <div style="font-size:11.5px; font-weight:800; color:{banner_text}; letter-spacing:0.8px; margin-bottom:6px;">
                  {tier_title}
                </div>
                <div style="font-size:13px; color:#182230; line-height:1.55;">
                  {urgency_lead}
                </div>
              </div>

              <!-- Greeting -->
              <p style="font-size:14.5px; color:#182230; line-height:1.6; margin:0 0 12px 0;">
                Assalamu'alaikum wa rahmatullahi wa barakatuh,
              </p>
              <p style="font-size:14px; color:#344054; line-height:1.6; margin:0 0 18px 0;">
                Dear <strong>{student_name}</strong> (Matric ID: <span style="font-family:monospace; color:#2457A7; font-weight:700;">{matric_id}</span>),
              </p>
              <p style="font-size:13.5px; color:#475467; line-height:1.6; margin:0 0 16px 0;">
                This is an official automated visa compliance notification from the <strong>UniSIRAJ Centre for International Affairs (CIA) Helpdesk</strong> regarding your student pass status. Please review your active immigration details below:
              </p>

              <!-- Student Profile Data Table -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8F9FA; border:1px solid #E4E7EC; border-radius:12px; margin:16px 0 20px 0; border-collapse:separate; overflow:hidden;">
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600; width:38%;">Student Full Name</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; color:#101828; font-weight:700;">{student_name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600;">Matric ID</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; color:#2457A7; font-weight:700; font-family:monospace;">{matric_id}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600;">Passport Number</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; color:#344054; font-family:monospace; font-weight:600;">{passport_number}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600;">Nationality</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; color:#344054; font-weight:600;">{nationality}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600;">Current Visa Expiry Date</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; color:#101828; font-weight:700;">{expiry_date}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:12px; color:#667085; font-weight:600;">Days Remaining</td>
                  <td style="padding:10px 16px; border-bottom:1px solid #E4E7EC; font-size:13px; font-weight:800; color:{days_color};">
                    {days_remaining} Days
                    <span style="display:inline-block; margin-left:6px; font-size:10.5px; font-weight:700; background-color:{badge_bg}; color:{badge_text}; padding:2px 8px; border-radius:6px;">
                      {status_label.upper()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 16px; font-size:12px; color:#667085; font-weight:600;">EMGS Application Progress</td>
                  <td style="padding:10px 16px; font-size:13px; color:#027A48; font-weight:700;">{emgs_status}</td>
                </tr>
              </table>

              <!-- Custom Note Section if Present -->
              {note_section}

              <!-- Mandatory Renewal Document Checklist -->
              <div style="background-color:#FFFFFF; border:1px solid #D0D5DD; border-radius:12px; padding:18px 20px; margin:18px 0;">
                <div style="font-size:13px; font-weight:800; color:#101828; margin-bottom:10px; display:flex; align-items:center;">
                  📋 Mandatory Documents Required for Renewal Submission:
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:5px 0; font-size:12.5px; color:#344054;">
                      <strong style="color:#027A48;">✔ 1. Original Passport:</strong> Minimum 18 months validity remaining.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0; font-size:12.5px; color:#344054;">
                      <strong style="color:#027A48;">✔ 2. Academic Results & Attendance Slip:</strong> Certified with &ge;80% attendance.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0; font-size:12.5px; color:#344054;">
                      <strong style="color:#027A48;">✔ 3. EMGS Medical Examination Clearance:</strong> Official endorsed screening slip.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0; font-size:12.5px; color:#344054;">
                      <strong style="color:#027A48;">✔ 4. UniSIRAJ Processing Receipt:</strong> Visa processing administrative fee receipt.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Immediate Helpdesk Action Callout -->
              <div style="background-color:#EFF8FF; border-left:4px solid #2457A7; padding:14px 18px; border-radius:0 10px 10px 0; margin:20px 0;">
                <div style="font-size:12px; font-weight:800; color:#1E3A5F; text-transform:uppercase; letter-spacing:0.6px;">Helpdesk Liaison Action:</div>
                <p style="margin:4px 0 0 0; font-size:13px; color:#175CD3; line-height:1.55;">
                  Please visit the <strong>CIA International Student Helpdesk</strong> at Level 2, Tuanku Syed Sirajuddin Administration Complex, or reply directly to this email to coordinate your passport endorsement.
                </p>
              </div>

              <p style="font-size:13px; color:#475467; line-height:1.6; margin:20px 0 0 0;">
                Warm regards,<br>
                <strong>Centre for International Affairs (CIA) Helpdesk</strong><br>
                <span style="color:#667085; font-size:12px;">Universiti Islam Antarabangsa Tuanku Syed Sirajuddin</span>
              </p>
            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td style="background-color:#F8F9FA; border-top:1px solid #E4E7EC; padding:22px 24px; text-align:center;">
              <p style="margin:0 0 4px 0; font-size:12px; font-weight:800; color:#101828;">
                UniSIRAJ Centre for International Affairs (CIA) Helpdesk
              </p>
              <p style="margin:0 0 6px 0; font-size:11px; color:#475467;">
                Level 2, Tuanku Syed Sirajuddin Administration Complex, UniSIRAJ Main Campus
              </p>
              <p style="margin:0 0 10px 0; font-size:11.5px; color:#667085;">
                Email: <a href="mailto:cia.helpdesk@unisiraj.edu.my" style="color:#2457A7; text-decoration:none; font-weight:600;">cia.helpdesk@unisiraj.edu.my</a> &bull; Tel: <strong>+60 4-979 0000</strong> &bull; WhatsApp: <strong>+60 4-979 0000</strong>
              </p>
              <div style="font-size:10px; color:#98A2B3; line-height:1.4; border-top:1px solid #EAECF0; padding-top:10px; margin-top:8px;">
                CONFIDENTIALITY NOTICE: This transmission is intended strictly for {student_name} ({matric_id}).<br>
                Reference: UIS-VMS-{matric_id} &bull; Generated by UniSIRAJ CIA Helpdesk Agent System
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class SmtpEmailService:
    """
    Live real-time SMTP messaging service for official institutional visa compliance notices.
    Communicates directly with university mail servers or commercial SMTP relays (e.g., Google Workspace, Office 365, Mailgun, SendGrid SMTP).
    """

    def __init__(self):
        self.host = settings.SMTP_HOST.strip()
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER.strip()
        self.password = settings.SMTP_PASSWORD.strip()
        self.from_email = settings.SMTP_FROM_EMAIL.strip() or "cia.helpdesk@unisiraj.edu.my"
        self.from_name = settings.SMTP_FROM_NAME.strip() or "UniSIRAJ CIA Helpdesk"
        self.reply_to = getattr(settings, "SMTP_REPLY_TO", "cia.helpdesk@unisiraj.edu.my").strip()
        self.use_tls = settings.SMTP_USE_TLS
        self.use_ssl = settings.SMTP_USE_SSL

    def is_configured(self) -> bool:
        """Check if minimal SMTP credentials (host and user) are present."""
        return bool(self.host and self.user)

    def generate_html_template(
        self,
        student_name: str,
        matric_id: str,
        passport_number: str = "N/A",
        nationality: str = "International",
        expiry_date: str = "N/A",
        days_remaining: int = 0,
        status_label: str = "Action Needed",
        emgs_status: str = "Verified",
        program: str = "Academic Program",
        faculty: str = "General Studies",
        custom_note: Optional[str] = None,
    ) -> str:
        """Public helper to construct the branded HTML email template."""
        return generate_professional_html_notice(
            student_name=student_name,
            matric_id=matric_id,
            passport_number=passport_number,
            nationality=nationality,
            expiry_date=expiry_date,
            days_remaining=days_remaining,
            status_label=status_label,
            emgs_status=emgs_status,
            program=program,
            faculty=faculty,
            custom_note=custom_note,
        )

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches a live email via SMTP in real-time.
        Embeds the CIA Helpdesk Agent's official logo via standard MIME multipart/related inline attachment.
        """
        if not to_email or "@" not in to_email:
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": f"Invalid recipient email address: '{to_email}'",
                "dispatch_method": "smtp",
            }

        # Check if SMTP host and user are configured
        if not self.is_configured():
            msg = (
                "SMTP configuration missing: SMTP_HOST or SMTP_USER is not defined in backend/.env. "
                "Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD."
            )
            logger.warning(msg)
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": msg,
                "dispatch_method": "smtp",
            }

        msg_id = f"SMTP_{uuid.uuid4().hex[:18].upper()}"

        try:
            logo_path = get_logo_path()
            has_logo = logo_path and os.path.exists(logo_path)

            if html_body:
                # Standard RFC multipart/related container for inline CID images
                root_msg = MIMEMultipart("related")
                root_msg["Subject"] = subject
                root_msg["From"] = f"{self.from_name} <{self.from_email}>"
                root_msg["To"] = to_email
                if self.reply_to:
                    root_msg["Reply-To"] = self.reply_to
                root_msg["Message-ID"] = f"<{msg_id}@unisiraj.edu.my>"

                # Encapsulate plain and HTML alternatives
                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(body, "plain", "utf-8"))
                alt_part.attach(MIMEText(html_body, "html", "utf-8"))
                root_msg.attach(alt_part)

                # Attach inline logo image with Content-ID: <cia_logo>
                if has_logo:
                    try:
                        with open(logo_path, "rb") as f:
                            img_data = f.read()
                        logo_img = MIMEImage(img_data, "png")
                        logo_img.add_header("Content-ID", "<cia_logo>")
                        logo_img.add_header("Content-Disposition", "inline", filename="cia-helpdesk-agent-official.png")
                        root_msg.attach(logo_img)
                    except Exception as img_err:
                        logger.warning(f"Failed to attach inline logo: {img_err}")

                final_msg = root_msg
            else:
                simple_msg = MIMEMultipart("alternative")
                simple_msg["Subject"] = subject
                simple_msg["From"] = f"{self.from_name} <{self.from_email}>"
                simple_msg["To"] = to_email
                if self.reply_to:
                    simple_msg["Reply-To"] = self.reply_to
                simple_msg["Message-ID"] = f"<{msg_id}@unisiraj.edu.my>"
                simple_msg.attach(MIMEText(body, "plain", "utf-8"))
                final_msg = simple_msg

            # Connect via SMTP_SSL (port 465) or standard SMTP with STARTTLS (port 587)
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.host, self.port, timeout=15)
            else:
                server = smtplib.SMTP(self.host, self.port, timeout=15)
                if self.use_tls:
                    server.starttls()

            if self.user and self.password:
                server.login(self.user, self.password)

            server.send_message(final_msg)
            server.quit()

            logger.info(f"[SMTP LIVE] Dispatched official notice to {to_email} [Message-ID: {msg_id}]")
            return {
                "success": True,
                "provider_message_id": msg_id,
                "status": "delivered",
                "error": None,
                "dispatch_method": "smtp",
            }

        except smtplib.SMTPAuthenticationError as auth_err:
            error_str = f"SMTP Authentication failed: {auth_err.smtp_error.decode('utf-8', errors='ignore') if hasattr(auth_err, 'smtp_error') else str(auth_err)}"
            logger.error(f"[SMTP AUTH ERROR] {error_str}")
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": error_str,
                "dispatch_method": "smtp",
            }
        except smtplib.SMTPConnectError as conn_err:
            error_str = f"Could not connect to SMTP server '{self.host}:{self.port}': {str(conn_err)}"
            logger.error(f"[SMTP CONNECT ERROR] {error_str}")
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": error_str,
                "dispatch_method": "smtp",
            }
        except Exception as e:
            error_str = f"Live SMTP email delivery error: {str(e)}"
            logger.error(f"[SMTP ERROR] {error_str}")
            return {
                "success": False,
                "provider_message_id": None,
                "status": "failed",
                "error": error_str,
                "dispatch_method": "smtp",
            }


smtp_service = SmtpEmailService()
