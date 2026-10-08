import logging
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import Coupon, CouponRedemption

logger = logging.getLogger(__name__)


def get_coupon(db: Session, code: str) -> Optional[Coupon]:
    if not code:
        return None
    return db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()


def validate_coupon(
    db: Session,
    coupon: Coupon,
    user_id: str,
    amount: float,
    category: Optional[str] = None,
) -> Tuple[bool, str]:
    """Return (valid, reason)."""
    if not coupon.is_active:
        return False, "This coupon is no longer active"
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        return False, "This coupon has expired"
    if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
        return False, "This coupon has reached its usage limit"
    if coupon.applies_to_category and category and coupon.applies_to_category.upper() != category.upper():
        return False, f"This coupon only applies to {coupon.applies_to_category}"
    if coupon.min_order_amount and amount < coupon.min_order_amount:
        return False, f"Minimum order amount is {coupon.min_order_amount}"
    used_by_user = db.query(CouponRedemption).filter(
        CouponRedemption.coupon_id == coupon.id,
        CouponRedemption.user_id == user_id,
    ).count()
    if used_by_user >= (coupon.per_user_limit or 1):
        return False, "You have already used this coupon"
    return True, ""


def compute_discount(coupon: Coupon, amount: float) -> float:
    if coupon.discount_type == "percent":
        pct = max(0.0, min(100.0, coupon.value))
        return round(amount * pct / 100.0, 2)
    return round(min(coupon.value, amount), 2)


def redeem_coupon(db: Session, coupon: Coupon, user_id: str, order_id: str, discount: float) -> None:
    db.add(CouponRedemption(coupon_id=coupon.id, user_id=user_id, order_id=order_id, discount_amount=discount))
    coupon.used_count = (coupon.used_count or 0) + 1
    db.commit()
