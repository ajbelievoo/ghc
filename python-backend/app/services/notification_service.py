import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import User, UserNotification

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user: User,
    title: str,
    message: str,
    type_: str = "info",
    link: Optional[str] = None,
) -> Optional[UserNotification]:
    try:
        n = UserNotification(
            user_id=user.id,
            type=type_,
            title=title,
            message=message,
            link=link,
        )
        db.add(n)
        db.commit()
        db.refresh(n)
        return n
    except Exception:
        logger.exception("Failed to create notification")
        return None
