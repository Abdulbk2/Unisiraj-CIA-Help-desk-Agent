"""
UniSIRAJ CIA Helpdesk Agent - Core Configuration
Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)
"""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_env_path = os.path.join(_backend_dir, ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_env_path, ".env"),
        extra="ignore",
        env_file_encoding="utf-8"
    )

    # App Information
    APP_NAME: str = "UniSIRAJ CIA Helpdesk Agent Backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    API_V1_PREFIX: str = "/api/v1"

    # Database Configuration (PostgreSQL / Google Cloud SQL, SQLite fallback)
    DATABASE_URL: str = Field(
        default="sqlite:///./unisiraj_cia.db",
        description="Database connection string (Cloud SQL PostgreSQL or SQLite for local dev/testing)"
    )

    # Security & JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default="dev_secret_key_unisiraj_cia_min_32_characters_long_replace_in_prod",
        description="Secret key for signing access tokens"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Bootstrap Administrator (Controlled one-time CLI/startup bootstrap)
    BOOTSTRAP_ADMIN_ENABLED: bool = True
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@unisiraj.edu.my"
    BOOTSTRAP_ADMIN_PASSWORD: str = "AdminSecurePassword123!"
    BOOTSTRAP_ADMIN_NAME: str = "CIA System Administrator"

    # WhatsApp Notifications (Twilio)
    TWILIO_PROVIDER: str = Field(
        default="mock",
        description="'twilio' for real provider, 'mock' for local dev and automated tests"
    )
    TWILIO_ACCOUNT_SID: str = "AC_PLACEHOLDER_ACCOUNT_SID"
    TWILIO_AUTH_TOKEN: str = "PLACEHOLDER_AUTH_TOKEN"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    TWILIO_STATUS_CALLBACK_URL: str = ""
    TWILIO_CONTENT_SID: str = ""

    # Live Real-Time SMTP Email Configuration
    SMTP_HOST: str = Field(default="", description="SMTP host e.g. smtp.gmail.com or mail.unisiraj.edu.my")
    SMTP_PORT: int = Field(default=587, description="SMTP port e.g. 587 (STARTTLS) or 465 (SSL)")
    SMTP_USER: str = Field(default="", description="SMTP username / email")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password / app password")
    SMTP_FROM_EMAIL: str = Field(default="cia.helpdesk@unisiraj.edu.my", description="Sender email address")
    SMTP_FROM_NAME: str = Field(default="UniSIRAJ Centre for International Affairs", description="Sender display name")
    SMTP_REPLY_TO: str = Field(default="cia.helpdesk@unisiraj.edu.my", description="Reply-to email address")
    SMTP_USE_TLS: bool = Field(default=True, description="Enable STARTTLS encryption")
    SMTP_USE_SSL: bool = Field(default=False, description="Enable direct SSL encryption")

    # Google Gemini AI Assistant
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Visa Expiry Monitoring Rules
    REMINDER_MILESTONES: str = "90,60,30"
    DEFAULT_TIMEZONE: str = "Asia/Kuala_Lumpur"

    # CORS
    ALLOWED_CORS_ORIGINS: str = "*"

    @property
    def reminder_milestones_list(self) -> List[int]:
        """Parse comma-separated milestones into a descending integer list."""
        try:
            items = [int(x.strip()) for x in self.REMINDER_MILESTONES.split(",") if x.strip()]
            return sorted(items, reverse=True)
        except Exception:
            return [90, 60, 30]

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins."""
        if not self.ALLOWED_CORS_ORIGINS or self.ALLOWED_CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
