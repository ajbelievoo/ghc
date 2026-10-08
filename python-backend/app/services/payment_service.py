import base64
import hashlib
import hmac
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import requests
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.models import AdditionalIp, AdminConfig, CustomerOrder, DomainRegistration, DomainStatus, GatewayConfig, PaymentStatus, PaymentTransaction, User
from app.services.order_service import execute_checkout
from app.services.email_service import send_order_payment_email, send_wallet_topup_email
from app.services.notification_service import create_notification
from app.services.ovh_client import OvhClient, get_ovh_client_from_db
from app.services.wallet_service import credit_wallet

logger = logging.getLogger(__name__)
settings = get_settings()

SUPPORTED_GATEWAYS = ("stripe", "razorpay", "cashfree", "paypal", "payu", "wallet", "manual")


# ---------- Gateway credential resolution ----------


def get_gateway_config(db: Session, name: str) -> Dict[str, Any]:
    """Gateway credentials from admin-panel GatewayConfig with env fallback."""
    row = db.query(GatewayConfig).filter(GatewayConfig.name == name).first()
    cfg = dict(row.config or {}) if row else {}
    cfg["isActive"] = bool(row.is_active) if row else False

    env_map = {
        "stripe": {"keySecret": settings.stripe_secret_key, "webhookSecret": settings.stripe_webhook_secret},
        "razorpay": {
            "keyId": settings.razorpay_key_id or os.environ.get("RAZORPAY_KEY_ID", ""),
            "keySecret": settings.razorpay_key_secret or os.environ.get("RAZORPAY_KEY_SECRET", ""),
            "webhookSecret": settings.razorpay_webhook_secret,
            "mode": settings.razorpay_mode or os.environ.get("RAZORPAY_MODE", "test"),
        },
        "cashfree": {"keyId": settings.cashfree_app_id, "keySecret": settings.cashfree_secret_key},
        "paypal": {"keyId": settings.paypal_client_id, "keySecret": settings.paypal_client_secret},
        "payu": {
            "keyId": settings.payu_key or settings.payu_merchant_key or os.environ.get("PAYU_KEY", ""),
            "keySecret": settings.payu_salt or settings.payu_merchant_salt or os.environ.get("PAYU_SALT", ""),
            "clientId": settings.payu_client_id or os.environ.get("PAYU_CLIENT_ID", ""),
            "clientSecret": settings.payu_client_secret or os.environ.get("PAYU_CLIENT_SECRET", ""),
            "merchantId": settings.payu_merchant_id or os.environ.get("PAYU_MERCHANT_ID", ""),
            "mode": settings.payu_mode or os.environ.get("PAYU_MODE", "live"),
        },
        "manual": {"manual": True},
    }
    for k, v in env_map.get(name, {}).items():
        if v and not cfg.get(k):
            cfg[k] = v
    return cfg


def _is_placeholder(v: Any) -> bool:
    if not v or not isinstance(v, str):
        return True
    v = v.strip()
    return v == "" or v.upper().startswith("YOUR_") or v.upper() in {"EMPTY", "NONE", "NULL"}


def gateway_ready(cfg: Dict[str, Any]) -> bool:
    if not cfg.get("isActive"):
        return False
    if cfg.get("manual"):
        return True
    if cfg.get("wallet"):
        return True
    env = str(cfg.get("env") or cfg.get("mode") or "production").lower()
    if env in ("sandbox", "test"):
        return False
    key_id = cfg.get("keyId") or cfg.get("client_id") or cfg.get("merchant_key")
    key_secret = cfg.get("keySecret") or cfg.get("secret_key") or cfg.get("secret") or cfg.get("merchant_salt")
    return not _is_placeholder(key_id) and not _is_placeholder(key_secret)


# ---------- Payment session / fulfillment ----------


def create_payment_session(
    db: Session,
    user_id: str,
    amount: float,
    currency: str,
    gateway: str,
    order_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> PaymentTransaction:
    tx = PaymentTransaction(
        user_id=user_id,
        order_id=order_id,
        amount=amount,
        currency=currency,
        gateway=gateway,
        status=PaymentStatus.PENDING,
        payment_metadata=metadata or {},
        gateway_transaction_id=str(uuid.uuid4()),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def fulfill_payment(db: Session, gateway: str, gateway_ref: str, amount: float, metadata: Optional[Dict] = None) -> Optional[PaymentTransaction]:
    """Idempotent payment fulfillment — only call after verifying with the gateway."""
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.gateway == gateway,
        PaymentTransaction.gateway_transaction_id == gateway_ref,
    ).first()

    if not tx:
        logger.warning(f"No payment transaction found for {gateway} ref {gateway_ref}")
        return None

    if tx.status == PaymentStatus.COMPLETED:
        return tx

    tx.status = PaymentStatus.COMPLETED
    tx.payment_metadata = {**(tx.payment_metadata or {}), **(metadata or {})}
    db.commit()
    db.refresh(tx)

    # If linked to a wallet deposit, credit wallet
    meta = tx.payment_metadata or {}
    if meta.get("type") == "WALLET_DEPOSIT":
        credit_wallet(
            db,
            tx.user_id,
            amount,
            description=f"Wallet deposit via {gateway}",
            gateway=gateway,
            metadata={"payment_transaction_id": tx.id},
            currency=tx.currency,
        )
        try:
            send_wallet_topup_email(db, tx.user, amount, tx.currency, gateway)
        except Exception:
            logger.exception("Wallet topup email failed")
        create_notification(db, tx.user, "Wallet topped up", f"{tx.currency} {amount:.2f} credited via {gateway}.", "success", "/dashboard?tab=wallet")
    elif tx.order_id:
        # If linked to an order, auto-provision after payment
        order = db.query(CustomerOrder).filter(CustomerOrder.id == tx.order_id).first()
        if order and order.status == "PENDING":
            order.status = "PAYMENT_RECEIVED"
            db.commit()
            db.refresh(order)
            try:
                if order.user:
                    send_order_payment_email(db, order, order.user)
            except Exception:
                logger.exception("Order payment email failed")
            create_notification(db, order.user, "Payment received", f"Payment for {order.display_name or 'order'} confirmed.", "success", "/dashboard")
            try:
                ovh = get_ovh_client_from_db(db)
                execute_checkout(db, ovh, tx.order_id)
            except Exception as e:
                logger.exception(f"Auto-provision after payment failed for order {tx.order_id}: {e}")
    elif meta.get("type") == "DOMAIN_RENEWAL" or meta.get("domainRenewalId"):
        domain_id = meta.get("domainId") or meta.get("domainRenewalId")
        if domain_id:
            domain = db.query(DomainRegistration).filter(DomainRegistration.id == domain_id).first()
            if domain:
                base = domain.expires_at if domain.expires_at and domain.expires_at > datetime.utcnow() else datetime.utcnow()
                domain.expires_at = base + timedelta(days=365 * (meta.get("years") or domain.years or 1))
                domain.payment_transaction_id = tx.id
                db.commit()
    elif meta.get("type") == "DOMAIN_REGISTRATION" or meta.get("domainId"):
        domain_id = meta.get("domainId") or meta.get("domain_registration_id")
        if domain_id:
            domain = db.query(DomainRegistration).filter(DomainRegistration.id == domain_id).first()
            if domain and domain.status == DomainStatus.PENDING:
                domain.status = DomainStatus.ACTIVE
                domain.expires_at = datetime.utcnow() + timedelta(days=365 * domain.years)
                domain.payment_transaction_id = tx.id
                db.commit()
    elif meta.get("type") == "ADDITIONAL_IP" or meta.get("ipId"):
        ip_id = meta.get("ipId")
        if ip_id:
            ip = db.query(AdditionalIp).filter(AdditionalIp.id == ip_id).first()
            if ip and ip.status == "PENDING":
                ip.status = "ACTIVE"
                ip.payment_transaction_id = tx.id
                db.commit()

    return tx


# ---------- Gateway checkout creation ----------


def create_gateway_checkout(db: Session, tx: PaymentTransaction, user: User) -> Dict[str, Any]:
    """Create a real checkout on the configured gateway and return what the frontend needs."""
    gateway = (tx.gateway or "").lower()
    cfg = get_gateway_config(db, gateway)
    if not gateway_ready(cfg):
        raise ValueError(f"Payment gateway '{gateway}' is not configured")

    if gateway == "razorpay":
        return _razorpay_checkout(db, tx, user, cfg)
    if gateway == "stripe":
        return _stripe_checkout(db, tx, user, cfg)
    if gateway == "cashfree":
        return _cashfree_checkout(db, tx, user, cfg)
    if gateway == "paypal":
        return _paypal_checkout(db, tx, user, cfg)
    if gateway == "payu":
        return _payu_checkout(db, tx, user, cfg)

    if gateway == "manual":
        # Manual / offline payment: customer completes payment outside the gateway.
        # Admin must confirm via /payments/session/{id}/fulfill before provisioning.
        checkout = {"manual": True, "instructions": "Please complete payment via UPI / bank transfer / NEFT. The service will be activated after payment verification."}
        tx.payment_metadata = {**(tx.payment_metadata or {}), "checkout": checkout}
        db.commit()
        db.refresh(tx)
        return checkout

    raise ValueError(f"Unsupported gateway '{gateway}'")


def _razorpay_checkout(db: Session, tx: PaymentTransaction, user: User, cfg: dict) -> dict:
    resp = requests.post(
        "https://api.razorpay.com/v1/orders",
        auth=(cfg["keyId"], cfg["keySecret"]),
        json={
            "amount": int(round(float(tx.amount) * 100)),
            "currency": tx.currency,
            "receipt": tx.id,
            "notes": {"payment_transaction_id": tx.id},
        },
        timeout=15,
    )
    if resp.status_code >= 400:
        logger.error(f"Razorpay order failed: {resp.status_code} {resp.text[:300]}")
        raise ValueError("Razorpay order creation failed")
    order = resp.json()
    tx.gateway_transaction_id = order["id"]
    tx.payment_metadata = {**(tx.payment_metadata or {}), "checkout": {"orderId": order["id"], "keyId": cfg["keyId"]}}
    db.commit()
    return {
        "checkoutUrl": f"{settings.site_url}/payment/?tx={tx.id}&gateway=razorpay",
        "razorpay": {"orderId": order["id"], "keyId": cfg["keyId"]},
    }


def _stripe_checkout(db: Session, tx: PaymentTransaction, user: User, cfg: dict) -> dict:
    import stripe

    stripe.api_key = cfg["keySecret"]
    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=user.email,
        line_items=[{
            "price_data": {
                "currency": tx.currency.lower(),
                "unit_amount": int(round(float(tx.amount) * 100)),
                "product_data": {"name": "BelieVoo GHC payment"},
            },
            "quantity": 1,
        }],
        client_reference_id=tx.id,
        metadata={"payment_transaction_id": tx.id},
        success_url=f"{settings.site_url}/payment/?tx={tx.id}&gateway=stripe&done=1",
        cancel_url=f"{settings.site_url}/payment/?tx={tx.id}&gateway=stripe&cancelled=1",
    )
    tx.gateway_transaction_id = session.id
    tx.payment_metadata = {**(tx.payment_metadata or {}), "checkout": {"sessionId": session.id, "url": session.url}}
    db.commit()
    return {"checkoutUrl": session.url}


def _cashfree_checkout(db: Session, tx: PaymentTransaction, user: User, cfg: dict) -> dict:
    env = (cfg.get("env") or "sandbox").lower()
    base = "https://api.cashfree.com" if env == "production" else "https://sandbox.cashfree.com"
    order_id = f"ghc_{tx.id.replace('-', '')[:24]}"
    resp = requests.post(
        f"{base}/pg/orders",
        headers={
            "x-client-id": cfg["keyId"],
            "x-client-secret": cfg["keySecret"],
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json",
        },
        json={
            "order_id": order_id,
            "order_amount": round(float(tx.amount), 2),
            "order_currency": tx.currency,
            "customer_details": {
                "customer_id": user.id.replace("-", "")[:32],
                "customer_email": user.email,
                "customer_phone": (user.phone or "9999999999"),
            },
            "order_meta": {"return_url": f"{settings.site_url}/payment/?tx={tx.id}&gateway=cashfree&order_id={order_id}"},
        },
        timeout=15,
    )
    if resp.status_code >= 400:
        logger.error(f"Cashfree order failed: {resp.status_code} {resp.text[:300]}")
        raise ValueError("Cashfree order creation failed")
    data = resp.json()
    tx.gateway_transaction_id = order_id
    tx.payment_metadata = {
        **(tx.payment_metadata or {}),
        "checkout": {"paymentSessionId": data.get("payment_session_id"), "env": env},
    }
    db.commit()
    return {
        "checkoutUrl": f"{settings.site_url}/payment/?tx={tx.id}&gateway=cashfree",
        "cashfree": {"paymentSessionId": data.get("payment_session_id"), "env": env},
    }


def _paypal_access_token(cfg: dict) -> tuple:
    env = (cfg.get("env") or "live").lower()
    base = "https://api-m.sandbox.paypal.com" if env == "sandbox" else "https://api-m.paypal.com"
    resp = requests.post(
        f"{base}/v1/oauth2/token",
        auth=(cfg["keyId"], cfg["keySecret"]),
        data={"grant_type": "client_credentials"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"], base


def _paypal_checkout(db: Session, tx: PaymentTransaction, user: User, cfg: dict) -> dict:
    token, base = _paypal_access_token(cfg)
    resp = requests.post(
        f"{base}/v2/checkout/orders",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": tx.id,
                "amount": {"currency_code": tx.currency, "value": f"{float(tx.amount):.2f}"},
            }],
            "application_context": {
                "return_url": f"{settings.site_url}/api/payments/paypal/capture?tx={tx.id}",
                "cancel_url": f"{settings.site_url}/payment/?tx={tx.id}&gateway=paypal&cancelled=1",
            },
        },
        timeout=15,
    )
    if resp.status_code >= 400:
        logger.error(f"PayPal order failed: {resp.status_code} {resp.text[:300]}")
        raise ValueError("PayPal order creation failed")
    order = resp.json()
    tx.gateway_transaction_id = order["id"]
    approve = next((l["href"] for l in order.get("links", []) if l.get("rel") == "approve"), None)
    if not approve:
        raise ValueError("PayPal did not return an approval link")
    tx.payment_metadata = {**(tx.payment_metadata or {}), "checkout": {"url": approve}}
    db.commit()
    return {"checkoutUrl": approve}


def _payu_checkout(db: Session, tx: PaymentTransaction, user: User, cfg: dict) -> dict:
    env = (cfg.get("env") or "live").lower()
    url = "https://test.payu.in/_payment" if env == "sandbox" else "https://secure.payu.in/_payment"
    txnid = tx.id.replace("-", "")[:25]
    params = {
        "key": cfg["keyId"],
        "txnid": txnid,
        "amount": f"{float(tx.amount):.2f}",
        "productinfo": "BelieVoo GHC payment",
        "firstname": (user.name or "customer").split()[0],
        "email": user.email,
        "udf1": tx.id,
        "surl": f"{settings.site_url}/api/payments/payu/response",
        "furl": f"{settings.site_url}/api/payments/payu/response",
    }
    params["hash"] = _payu_request_hash(params, cfg["keySecret"])
    tx.gateway_transaction_id = txnid
    tx.payment_metadata = {**(tx.payment_metadata or {}), "checkout": {"url": url, "params": params}}
    db.commit()
    return {"checkoutUrl": f"{settings.site_url}/payment/?tx={tx.id}&gateway=payu", "payu": {"url": url, "params": params}}


def _payu_request_hash(params: dict, salt: str) -> str:
    seq = "|".join([
        params["key"], params["txnid"], params["amount"], params["productinfo"],
        params["firstname"], params["email"],
        params.get("udf1", ""), params.get("udf2", ""), params.get("udf3", ""),
        params.get("udf4", ""), params.get("udf5", ""), "", "", "", "",
        salt,
    ])
    return hashlib.sha512(seq.encode()).hexdigest()


def verify_payu_response(db: Session, params: dict) -> Optional[PaymentTransaction]:
    """Verify PayU's post-back hash and fulfill."""
    txnid = params.get("txnid", "")
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.gateway == "payu",
        PaymentTransaction.gateway_transaction_id == txnid,
    ).first()
    if not tx:
        return None
    cfg = get_gateway_config(db, "payu")
    salt = cfg.get("keySecret", "")
    seq = "|".join([
        salt, params.get("status", ""), "", "", "", "",
        params.get("udf5", ""), params.get("udf4", ""), params.get("udf3", ""),
        params.get("udf2", ""), params.get("udf1", ""),
        params.get("email", ""), params.get("firstname", ""), params.get("productinfo", ""),
        params.get("amount", ""), txnid, params.get("key", ""),
    ])
    expected = hashlib.sha512(seq.encode()).hexdigest()
    if not hmac.compare_digest(expected, params.get("hash", "")):
        logger.warning("PayU response hash mismatch")
        return None
    if params.get("status") == "success":
        return fulfill_payment(db, "payu", txnid, float(tx.amount), {"payu": params})
    return tx


# ---------- Return-url verification (Razorpay checkout.js callback) ----------


def verify_razorpay_payment(db: Session, order_id: str, payment_id: str, signature: str) -> Optional[PaymentTransaction]:
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.gateway == "razorpay",
        PaymentTransaction.gateway_transaction_id == order_id,
    ).first()
    if not tx:
        return None
    cfg = get_gateway_config(db, "razorpay")
    secret = cfg.get("keySecret", "")
    expected = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        logger.warning("Razorpay signature mismatch")
        return None
    return fulfill_payment(db, "razorpay", order_id, float(tx.amount), {"razorpay_payment_id": payment_id})


def verify_paypal_capture(db: Session, tx_id: str, paypal_order_id: str) -> Optional[PaymentTransaction]:
    tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.id == tx_id,
        PaymentTransaction.gateway == "paypal",
        PaymentTransaction.gateway_transaction_id == paypal_order_id,
    ).first()
    if not tx:
        return None
    cfg = get_gateway_config(db, "paypal")
    token, base = _paypal_access_token(cfg)
    resp = requests.post(
        f"{base}/v2/checkout/orders/{paypal_order_id}/capture",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if resp.status_code >= 400:
        logger.error(f"PayPal capture failed: {resp.status_code} {resp.text[:300]}")
        return None
    data = resp.json()
    if data.get("status") == "COMPLETED":
        return fulfill_payment(db, "paypal", paypal_order_id, float(tx.amount), {"paypal_capture": data})
    return tx


# ---------- Webhooks (signature verified) ----------


def handle_stripe_webhook(db: Session, raw_body: bytes, signature: str, webhook_secret: str) -> bool:
    try:
        import stripe

        event = stripe.Webhook.construct_event(raw_body, signature, webhook_secret)
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            ref = session.get("client_reference_id") or session.get("metadata", {}).get("payment_transaction_id")
            tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == ref).first() if ref else None
            if tx:
                fulfill_payment(db, "stripe", tx.gateway_transaction_id, session.get("amount_total", 0) / 100.0, {"stripe_session": dict(session)})
        return True
    except Exception as e:
        logger.exception(f"Stripe webhook error: {e}")
        return False


def verify_razorpay_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def handle_razorpay_webhook(db: Session, payload: Dict[str, Any]) -> bool:
    try:
        event = payload.get("event")
        if event in ("payment.captured", "order.paid"):
            entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = entity.get("order_id")
            amount = entity.get("amount", 0) / 100.0
            if order_id:
                fulfill_payment(db, "razorpay", order_id, amount, {"razorpay_payment": entity})
        return True
    except Exception as e:
        logger.exception(f"Razorpay webhook error: {e}")
        return False


def verify_cashfree_signature(raw_body: bytes, timestamp: str, signature: str, secret: str) -> bool:
    signed = f"{timestamp}{raw_body.decode('utf-8', 'ignore')}"
    expected = base64.b64encode(hmac.new(secret.encode(), signed.encode(), hashlib.sha256).digest()).decode()
    return hmac.compare_digest(expected, signature or "")


def handle_cashfree_webhook(db: Session, payload: Dict[str, Any]) -> bool:
    try:
        data = payload.get("data", {})
        order_id = data.get("order", {}).get("order_id") or payload.get("order_id")
        status = data.get("payment", {}).get("payment_status") or payload.get("payment_status")
        amount = data.get("payment", {}).get("payment_amount") or payload.get("payment_amount", 0)
        if order_id and status == "SUCCESS":
            fulfill_payment(db, "cashfree", order_id, float(amount), {"cashfree": payload})
        return True
    except Exception as e:
        logger.exception(f"Cashfree webhook error: {e}")
        return False
