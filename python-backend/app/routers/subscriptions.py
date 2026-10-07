from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Subscription, User
from app.schemas.subscription import ReinstallRequest, SubscriptionAction, SubscriptionResponse
from app.services.ovh_client import get_ovh_client_from_db
from app.services.subscription_service import (
    get_subscription,
    get_user_subscriptions,
    get_service_metrics,
    lifecycle_action,
    perform_power_action,
    reinstall_os,
)

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@router.get("/", response_model=list[SubscriptionResponse])
def list_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_user_subscriptions(db, user.id)


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription_detail(subscription_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.post("/{subscription_id}/power", response_model=dict)
def power_action(
    subscription_id: str,
    payload: SubscriptionAction,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = get_subscription(db, user.id, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if payload.action not in ("reboot", "shutdown", "start"):
        raise HTTPException(status_code=400, detail="Action must be reboot, shutdown, or start")
    try:
        ovh = get_ovh_client_from_db(db)
        result = perform_power_action(db, ovh, sub, payload.action)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{subscription_id}/lifecycle", response_model=SubscriptionResponse)
def lifecycle(
    subscription_id: str,
    payload: SubscriptionAction,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = get_subscription(db, user.id, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if payload.action not in ("renew", "suspend", "unsuspend", "terminate", "cancel"):
        raise HTTPException(status_code=400, detail="Invalid lifecycle action")
    try:
        ovh = get_ovh_client_from_db(db)
        sub = lifecycle_action(db, ovh, sub, payload.action)
        return sub
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{subscription_id}/reinstall", response_model=dict)
def reinstall(
    subscription_id: str,
    payload: ReinstallRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = get_subscription(db, user.id, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    try:
        ovh = get_ovh_client_from_db(db)
        result = reinstall_os(db, ovh, sub, payload.os_template)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{subscription_id}/metrics")
def metrics(subscription_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return get_service_metrics(ovh, sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
