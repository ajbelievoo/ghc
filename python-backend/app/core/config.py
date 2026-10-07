import os
from functools import lru_cache
from typing import List, Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


# Shared payment credentials (kept outside repository)
load_dotenv(os.environ.get("PAYMENT_ENV_FILE", "/www/wwwroot/.payment.env"))


class Settings(BaseSettings):
    app_name: str = "Believoo GHC"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./believoo_dev.db"

    # Security
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    admin_email: str = "admin@believoo.com"
    admin_password: str = "admin123"  # Change on first login

    # OVH Cloud API credentials
    ovh_endpoint: str = "ovh-ca"
    ovh_application_key: str = ""
    ovh_application_secret: str = ""
    ovh_consumer_key: str = ""
    ovh_subsidiary: str = "CA"

    # Default margin (percent)
    default_margin_percent: float = 20.0

    # Default currency for display
    currency: str = "USD"

    # Tax/GST rate (percent, e.g. 18.0)
    tax_rate_percent: float = 18.0

    # Payment gateways (optional)
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    cashfree_app_id: str = ""
    cashfree_secret_key: str = ""
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    payu_merchant_key: str = ""
    payu_merchant_salt: str = ""
    payu_key: str = ""
    payu_salt: str = ""
    payu_client_id: str = ""
    payu_client_secret: str = ""
    payu_merchant_id: str = ""
    payu_mode: str = "live"
    razorpay_mode: str = "test"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # SMTP (transactional email)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = ""
    smtp_verify: bool = True

    # Public site URL (used in emails, payment redirects)
    site_url: str = "https://ghc.believoo.com"

    # Frontend URL for CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def cors_origins_list(self) -> List[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
