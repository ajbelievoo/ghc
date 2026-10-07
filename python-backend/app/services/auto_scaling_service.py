import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import AutoScalingEvent, AutoScalingRule, ScalingAction, ScalingMetric, Subscription, UsageRecord
from app.schemas.auto_scaling import AutoScalingRuleCreate, AutoScalingRuleUpdate
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)


def _get_metric_value(db: Session, subscription: Subscription, metric: ScalingMetric) -> float:
    """Fetch the latest usage record for a metric, or fall back to a placeholder."""
    record = (
        db.query(UsageRecord)
        .filter(UsageRecord.subscription_id == subscription.id)
        .filter(UsageRecord.metric_type == metric.value)
        .order_by(UsageRecord.recorded_at.desc())
        .first()
    )
    if record:
        return record.value

    # TODO: integrate with OVH RTM, Proxmox metrics, or node exporter
    return 0.0


def create_rule(db: Session, data: AutoScalingRuleCreate) -> AutoScalingRule:
    rule = AutoScalingRule(
        id=str(uuid.uuid4()),
        subscription_id=data.subscription_id,
        metric=data.metric,
        threshold=data.threshold,
        duration_minutes=data.duration_minutes,
        action=data.action,
        enabled=data.enabled,
        cooldown_minutes=data.cooldown_minutes,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_rule(db: Session, rule: AutoScalingRule, data: AutoScalingRuleUpdate) -> AutoScalingRule:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return rule


def delete_rule(db: Session, rule: AutoScalingRule) -> None:
    db.delete(rule)
    db.commit()


def list_rules(db: Session, subscription_id: Optional[str] = None) -> List[AutoScalingRule]:
    query = db.query(AutoScalingRule)
    if subscription_id:
        query = query.filter(AutoScalingRule.subscription_id == subscription_id)
    return query.order_by(AutoScalingRule.created_at.desc()).all()


def list_events(db: Session, rule_id: Optional[str] = None, limit: int = 50) -> List[AutoScalingEvent]:
    query = db.query(AutoScalingEvent)
    if rule_id:
        query = query.filter(AutoScalingEvent.rule_id == rule_id)
    return query.order_by(AutoScalingEvent.created_at.desc()).limit(limit).all()


def evaluate_rules(db: Session) -> int:
    """Evaluate all enabled rules and trigger actions where thresholds are breached."""
    rules = (
        db.query(AutoScalingRule)
        .filter(AutoScalingRule.enabled == True)
        .all()
    )

    triggered = 0
    for rule in rules:
        if rule.last_triggered_at and rule.last_triggered_at > datetime.utcnow() - timedelta(minutes=rule.cooldown_minutes):
            continue

        subscription = db.query(Subscription).filter(Subscription.id == rule.subscription_id).first()
        if not subscription or subscription.status.value != "ACTIVE":
            continue

        value = _get_metric_value(db, subscription, ScalingMetric(rule.metric.value))

        if value >= rule.threshold:
            _trigger_action(db, rule, subscription, value)
            rule.last_triggered_at = datetime.utcnow()
            db.commit()
            triggered += 1

    return triggered


def _trigger_action(db: Session, rule: AutoScalingRule, subscription: Subscription, value: float) -> None:
    action = ScalingAction(rule.action.value)
    message = f"{rule.metric.value.upper()} threshold {rule.threshold}% breached for {subscription.service_name} (value: {value}%)."

    event = AutoScalingEvent(
        id=str(uuid.uuid4()),
        rule_id=rule.id,
        subscription_id=subscription.id,
        metric=rule.metric.value,
        value=value,
        threshold=rule.threshold,
        action=action.value,
        status="triggered",
        message=message,
    )
    db.add(event)
    db.commit()

    if action == ScalingAction.NOTIFY and subscription.user:
        create_notification(
            db,
            subscription.user,
            "Auto-scaling alert",
            message,
            "warning",
            f"/dashboard/services/{subscription.id}",
        )
    elif action == ScalingAction.RESTART:
        event.status = "completed"
        event.message += " Restart requested for service."
        # TODO: call OVH restart API
    elif action in (ScalingAction.UPSIZE, ScalingAction.DOWNSIZE):
        event.status = "completed"
        event.message += f" {action.value} workflow initiated."
        # TODO: initiate catalog plan change order

    db.commit()
