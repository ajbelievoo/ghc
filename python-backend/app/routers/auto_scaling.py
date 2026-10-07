from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import AutoScalingRule, User
from app.schemas.auto_scaling import (
    AutoScalingRuleCreate,
    AutoScalingRuleList,
    AutoScalingRuleRead,
    AutoScalingRuleUpdate,
    AutoScalingEventList,
    AutoScalingEventRead,
)
from app.services import auto_scaling_service

router = APIRouter(prefix="/auto-scaling", tags=["auto-scaling"])


@router.post("/rules", response_model=AutoScalingRuleRead)
def create_rule(
    data: AutoScalingRuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    return auto_scaling_service.create_rule(db, data)


@router.get("/rules", response_model=AutoScalingRuleList)
def list_rules(
    subscription_id: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    items = auto_scaling_service.list_rules(db, subscription_id)
    return AutoScalingRuleList(items=items)


@router.get("/rules/{rule_id}", response_model=AutoScalingRuleRead)
def get_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    rule = db.query(AutoScalingRule).filter(AutoScalingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.put("/rules/{rule_id}", response_model=AutoScalingRuleRead)
def update_rule(
    rule_id: str,
    data: AutoScalingRuleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    rule = db.query(AutoScalingRule).filter(AutoScalingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return auto_scaling_service.update_rule(db, rule, data)


@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    rule = db.query(AutoScalingRule).filter(AutoScalingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    auto_scaling_service.delete_rule(db, rule)
    return {"success": True}


@router.get("/events", response_model=AutoScalingEventList)
def list_events(
    rule_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    items = auto_scaling_service.list_events(db, rule_id, limit)
    return AutoScalingEventList(items=items)


@router.post("/evaluate")
def evaluate_now(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    triggered = auto_scaling_service.evaluate_rules(db)
    return {"success": True, "triggered": triggered}
