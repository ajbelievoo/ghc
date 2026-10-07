import logging
import sys

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models import models
from app.models.models import AdminConfig, MarginSetting, ServiceCategory, User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


def seed_default_margins(db: Session):
    defaults = {
        ServiceCategory.VPS: 20.0,
        ServiceCategory.DEDICATED: 15.0,
        ServiceCategory.WEB_HOSTING: 25.0,
        ServiceCategory.CDN: 20.0,
        ServiceCategory.PUBLIC_CLOUD: 20.0,
        ServiceCategory.PRIVATE_CLOUD: 15.0,
        ServiceCategory.IP_ADDON: 25.0,
        ServiceCategory.LICENSE: 25.0,
        ServiceCategory.DOMAINS: 20.0,
    }
    for category, percent in defaults.items():
        existing = db.query(MarginSetting).filter(MarginSetting.category == category).first()
        if not existing:
            db.add(MarginSetting(category=category, percent=percent))
    db.commit()
    logger.info("Default margin settings seeded")


def seed_admin_user(db: Session):
    existing = db.query(User).filter(User.email == settings.admin_email).first()
    if not existing:
        admin = User(
            email=settings.admin_email,
            password_hash=get_password_hash(settings.admin_password),
            name="Administrator",
            role=UserRole.ADMIN,
            is_suspended=False,
        )
        db.add(admin)
        db.commit()
        logger.info(f"Admin user created: {settings.admin_email}")
    else:
        logger.info(f"Admin user already exists: {settings.admin_email}")


def seed_ovh_configs(db: Session):
    configs = {
        "ovh_endpoint": settings.ovh_endpoint,
        "ovh_application_key": settings.ovh_application_key,
        "ovh_application_secret": settings.ovh_application_secret,
        "ovh_consumer_key": settings.ovh_consumer_key,
        "ovh_subsidiary": settings.ovh_subsidiary,
    }
    for key, value in configs.items():
        existing = db.query(AdminConfig).filter(AdminConfig.key == key).first()
        if not existing:
            db.add(AdminConfig(key=key, value=value))
    db.commit()
    logger.info("OVH configs seeded from environment")


def main():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_margins(db)
        seed_admin_user(db)
        seed_ovh_configs(db)
    finally:
        db.close()
    logger.info("Seed complete")


if __name__ == "__main__":
    main()
