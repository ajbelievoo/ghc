import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.metrics import PAYMENT_WEBHOOK_COUNT
from app.services.payment_service import (
    get_gateway_config,
    handle_cashfree_webhook,
    handle_razorpay_webhook,
    handle_stripe_webhook,
    verify_cashfree_signature,
    verify_razorpay_webhook_signature,
)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
settings = get_settings()
logger = logging.getLogger(__name__)


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    cfg = get_gateway_config(db, "stripe")
    secret = cfg.get("webhookSecret")
    if not secret:
        PAYMENT_WEBHOOK_COUNT.labels(gateway="stripe", status="config_missing").inc()
        raise HTTPException(status_code=400, detail="Stripe webhook secret not configured")
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    if handle_stripe_webhook(db, payload, signature, secret):
        PAYMENT_WEBHOOK_COUNT.labels(gateway="stripe", status="ok").inc()
        return {"status": "ok"}
    PAYMENT_WEBHOOK_COUNT.labels(gateway="stripe", status="failed").inc()
    raise HTTPException(status_code=400, detail="Webhook processing failed")


@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    cfg = get_gateway_config(db, "razorpay")
    secret = cfg.get("webhookSecret") or cfg.get("keySecret")
    if not secret:
        PAYMENT_WEBHOOK_COUNT.labels(gateway="razorpay", status="config_missing").inc()
        raise HTTPException(status_code=400, detail="Razorpay webhook secret not configured")
    raw = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    if not verify_razorpay_webhook_signature(raw, signature, secret):
        PAYMENT_WEBHOOK_COUNT.labels(gateway="razorpay", status="invalid_signature").inc()
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    try:
        payload = await request.json()
    except Exception:
        import json
        payload = json.loads(raw)
    if handle_razorpay_webhook(db, payload):
        PAYMENT_WEBHOOK_COUNT.labels(gateway="razorpay", status="ok").inc()
        return {"status": "ok"}
    PAYMENT_WEBHOOK_COUNT.labels(gateway="razorpay", status="failed").inc()
    raise HTTPException(status_code=400, detail="Webhook processing failed")


@router.post("/cashfree")
async def cashfree_webhook(request: Request, db: Session = Depends(get_db)):
    cfg = get_gateway_config(db, "cashfree")
    secret = cfg.get("keySecret")
    if not secret:
        PAYMENT_WEBHOOK_COUNT.labels(gateway="cashfree", status="config_missing").inc()
        raise HTTPException(status_code=400, detail="Cashfree secret not configured")
    raw = await request.body()
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")
    if not verify_cashfree_signature(raw, timestamp, signature, secret):
        PAYMENT_WEBHOOK_COUNT.labels(gateway="cashfree", status="invalid_signature").inc()
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    try:
        payload = await request.json()
    except Exception:
        import json
        payload = json.loads(raw)
    if handle_cashfree_webhook(db, payload):
        PAYMENT_WEBHOOK_COUNT.labels(gateway="cashfree", status="ok").inc()
        return {"status": "ok"}
    PAYMENT_WEBHOOK_COUNT.labels(gateway="cashfree", status="failed").inc()
    raise HTTPException(status_code=400, detail="Webhook processing failed")
