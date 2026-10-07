"""Usage metering and overage billing service."""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import Invoice, InvoiceStatus, UsageRecord
from app.services.tax_service import gst_fields_for_user

logger = logging.getLogger(__name__)


def record_usage(
    db: Session,
    subscription_id: str,
    metric_type: str,
    value: float,
    unit: str,
    billing_period: Optional[str] = None,
    cost: float = 0.0,
    currency: str = "INR",
    details: Optional[dict] = None,
) -> UsageRecord:
    """Record a usage data point for a subscription."""
    if billing_period is None:
        billing_period = datetime.utcnow().strftime("%Y-%m")

    record = UsageRecord(
        subscription_id=subscription_id,
        metric_type=metric_type,
        value=value,
        unit=unit,
        billing_period=billing_period,
        cost=cost,
        currency=currency,
        details=details or {},
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_unbilled_usage(db: Session, subscription_id: str, billing_period: Optional[str] = None) -> List[UsageRecord]:
    """Return unbilled usage records for a subscription."""
    query = db.query(UsageRecord).filter(
        UsageRecord.subscription_id == subscription_id,
        UsageRecord.billed == False,
    )
    if billing_period:
        query = query.filter(UsageRecord.billing_period == billing_period)
    return query.all()


def bill_usage(
    db: Session,
    subscription_id: str,
    billing_period: Optional[str] = None,
    rates: Optional[dict] = None,
) -> Optional[Invoice]:
    """Create an invoice for unbilled usage.

    `rates` is a dict like: {"bandwidth_gb": 0.5, "storage_gb": 0.1}
    """
    from app.models.models import CustomerOrder, Subscription

    rates = rates or {}
    records = get_unbilled_usage(db, subscription_id, billing_period)
    if not records:
        return None

    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub or not sub.order:
        logger.warning(f"Subscription {subscription_id} has no linked order")
        return None

    total = 0.0
    for record in records:
        rate = rates.get(record.metric_type, 0.0)
        record.cost = round(record.value * rate, 2)
        total += record.cost

    if total <= 0:
        return None

    tax_type, hsn_code, place = gst_fields_for_user(db, sub.user_id)
    tax_rate = 0.18  # Default GST
    tax_amount = round(total * tax_rate, 2)
    amount = round(total + tax_amount, 2)

    invoice = Invoice(
        order_id=sub.order_id,
        user_id=sub.user_id,
        amount=amount,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        tax_type=tax_type,
        hsn_code=hsn_code,
        place_of_supply=place,
        currency=sub.currency or "INR",
        due_date=datetime.utcnow() + timedelta(days=7),
        status=InvoiceStatus.UNPAID,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for record in records:
        record.billed = True
        record.invoice_id = invoice.id
    db.commit()

    return invoice


def monthly_usage_summary(db: Session, billing_period: Optional[str] = None) -> dict:
    """Admin summary of usage across all subscriptions."""
    if billing_period is None:
        billing_period = datetime.utcnow().strftime("%Y-%m")

    records = db.query(UsageRecord).filter(UsageRecord.billing_period == billing_period).all()
    by_metric = {}
    total_cost = 0.0
    for r in records:
        by_metric.setdefault(r.metric_type, {"value": 0.0, "unit": r.unit, "cost": 0.0})
        by_metric[r.metric_type]["value"] += r.value
        by_metric[r.metric_type]["cost"] += r.cost
        total_cost += r.cost

    return {
        "billing_period": billing_period,
        "total_records": len(records),
        "total_cost": round(total_cost, 2),
        "by_metric": by_metric,
    }
