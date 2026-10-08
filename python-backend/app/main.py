import asyncio
import logging
import os
import subprocess
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.models import models  # noqa: F401 - registers all models
from app.models.models import (
    AdminConfig,
    CustomerOrder,
    DomainRegistration,
    DomainStatus,
    Invoice,
    InvoiceStatus,
    LogType,
    PaymentTransaction,
    PaymentStatus,
    ServerPingMetric,
    Subscription,
    SubscriptionStatus,
    SystemLog,
)
from app.routers import admin, auth, auto_scaling, catalog, cloud, compat, health, marketplace, orders, subscriptions, support, team, wallet, webhooks
from app.services.auto_scaling_service import evaluate_rules
from app.services.marketplace_service import marketplace_worker
from app.services.email_service import send_domain_renewal_reminder_email, send_invoice_overdue_email, send_renewal_reminder_email, send_suspension_email
from app.services.tax_service import generate_invoice_number, gst_fields_for_user
from app.services.usage_service import record_usage

settings = get_settings()
logging.basicConfig(level=logging.INFO if not settings.debug else logging.DEBUG)
logger = logging.getLogger(__name__)

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

# Columns added after initial release — ensure they exist on SQLite without full migrations
USER_COLUMN_MIGRATIONS = {
    "google_id": "VARCHAR(255)",
    "email_verified": "BOOLEAN DEFAULT 1",  # existing users grandfathered as verified
    "totp_secret": "VARCHAR(64)",
    "totp_enabled": "BOOLEAN DEFAULT 0",
    "billing_address": "VARCHAR(500)",
    "billing_city": "VARCHAR(100)",
    "billing_state": "VARCHAR(100)",
    "billing_pincode": "VARCHAR(20)",
}


def ensure_schema():
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.connect() as conn:
        cols = {r[1] for r in conn.execute(text("PRAGMA table_info(users)"))}
        for col, ddl in USER_COLUMN_MIGRATIONS.items():
            if col not in cols:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ddl}"))
                logger.info(f"Added users.{col} column")
        conn.commit()


def _log(db, log_type: LogType, message: str, details=None):
    db.add(SystemLog(type=log_type, message=message, details=details))
    db.commit()


def run_maintenance():
    """Daily-style maintenance: renewal invoices + auto-suspension of overdue services."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        invoice_lead = now + timedelta(days=3)
        overdue_cutoff = now - timedelta(hours=12)
        auto_suspend = db.query(AdminConfig).filter(AdminConfig.key == "auto_suspend_enabled").first()
        auto_suspend = bool(auto_suspend and auto_suspend.value == "true")

        subs = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.next_bill_date.isnot(None),
        ).all()

        for sub in subs:
            # Renewal invoice ~3 days before due (needs a linked order for the FK)
            if sub.order_id and sub.next_bill_date <= invoice_lead and sub.next_bill_date > now:
                existing = db.query(Invoice).filter(
                    Invoice.user_id == sub.user_id,
                    Invoice.due_date == sub.next_bill_date,
                ).first()
                if not existing:
                    tax_type, hsn_code, place = gst_fields_for_user(db, sub.user_id)
                    tax_rate = get_settings().tax_rate_percent / 100.0
                    taxable = sub.price_amount / (1 + tax_rate)
                    tax_amount = round(sub.price_amount - taxable, 2)
                    invoice = Invoice(
                        order_id=sub.order_id,
                        user_id=sub.user_id,
                        amount=sub.price_amount,
                        tax_amount=tax_amount,
                        tax_rate=tax_rate,
                        tax_type=tax_type,
                        hsn_code=hsn_code,
                        place_of_supply=place,
                        due_date=sub.next_bill_date,
                        currency=(sub.currency or "USD").upper(),
                    )
                    db.add(invoice)
                    db.flush()
                    invoice.invoice_number = generate_invoice_number(invoice)
                    db.commit()
                    db.refresh(invoice)
                    _log(db, LogType.CRON, f"Renewal invoice created for subscription {sub.id}")
                    try:
                        if sub.user:
                            send_renewal_reminder_email(db, sub, sub.user, invoice)
                    except Exception:
                        logger.exception("Renewal reminder email failed")

            # Auto-suspend 12h overdue (only if explicitly enabled in admin settings)
            if auto_suspend and sub.next_bill_date <= overdue_cutoff:
                try:
                    from app.services.ovh_client import get_ovh_client_from_db
                    from app.services.subscription_service import lifecycle_action
                    ovh = get_ovh_client_from_db(db)
                    lifecycle_action(db, ovh, sub, "suspend")
                    _log(db, LogType.CRON, f"Auto-suspended overdue subscription {sub.id}")
                    try:
                        if sub.user:
                            send_suspension_email(db, sub, sub.user)
                    except Exception:
                        logger.exception("Suspension email failed")
                except Exception as e:
                    _log(db, LogType.ERROR, f"Auto-suspend failed for {sub.id}: {e}")

        # Overdue invoice reminders — one email per unpaid invoice past due date
        overdue_invoices = db.query(Invoice).filter(
            Invoice.status == InvoiceStatus.UNPAID,
            Invoice.due_date.isnot(None),
            Invoice.due_date < now,
        ).all()
        for inv in overdue_invoices:
            already = db.query(SystemLog).filter(
                SystemLog.type == LogType.CRON,
                SystemLog.message == f"Overdue invoice reminder sent for {inv.id}",
            ).first()
            if already:
                continue
            try:
                if inv.user:
                    send_invoice_overdue_email(db, inv, inv.user)
                    _log(db, LogType.CRON, f"Overdue invoice reminder sent for {inv.id}")
            except Exception:
                logger.exception(f"Overdue invoice email failed for {inv.id}")

        # Domain renewal reminders (3 days before expiry)
        expiring_domains = db.query(DomainRegistration).filter(
            DomainRegistration.status == DomainStatus.ACTIVE,
            DomainRegistration.expires_at.isnot(None),
            DomainRegistration.expires_at <= invoice_lead,
            DomainRegistration.expires_at > now,
            DomainRegistration.auto_renew == False,
        ).all()
        for dom in expiring_domains:
            # Don't spam: only send one reminder per domain (track via SystemLog)
            already = db.query(SystemLog).filter(
                SystemLog.type == LogType.CRON,
                SystemLog.message == f"Domain renewal reminder sent for {dom.id}",
            ).first()
            if already:
                continue
            try:
                if dom.user:
                    send_domain_renewal_reminder_email(db, dom, dom.user)
                    _log(db, LogType.CRON, f"Domain renewal reminder sent for {dom.id}")
            except Exception:
                logger.exception(f"Domain renewal email failed for {dom.id}")

        # Auto-renew domains expiring within 1 day
        renew_cutoff = now + timedelta(days=1)
        auto_renew_doms = db.query(DomainRegistration).filter(
            DomainRegistration.status == DomainStatus.ACTIVE,
            DomainRegistration.expires_at.isnot(None),
            DomainRegistration.expires_at <= renew_cutoff,
            DomainRegistration.expires_at > now,
            DomainRegistration.auto_renew == True,
        ).all()
        for dom in auto_renew_doms:
            existing_order = db.query(CustomerOrder).filter(
                CustomerOrder.resource_id == dom.id,
                CustomerOrder.status.in_(["PENDING", "PAYMENT_RECEIVED"]),
            ).first()
            if existing_order:
                continue
            try:
                amount = float(dom.price_amount or 0)
                currency = dom.currency or "USD"
                order = CustomerOrder(
                    user_id=dom.user_id,
                    category="DOMAINS",
                    plan_code=dom.tld or "domain_renew",
                    customer_amount=amount,
                    currency=currency,
                    configuration_payload={
                        "domain_name": dom.domain_name,
                        "years": dom.years or 1,
                        "renewal": True,
                        "domain_id": dom.id,
                    },
                )
                db.add(order)
                db.commit()
                db.refresh(order)
                tax_type, hsn_code, place = gst_fields_for_user(db, dom.user_id)
                tax_rate = get_settings().tax_rate_percent / 100.0
                tax_amount = round(amount * tax_rate, 2)
                invoice = Invoice(
                    user_id=dom.user_id,
                    order_id=order.id,
                    amount=round(amount + tax_amount, 2),
                    tax_amount=tax_amount,
                    tax_rate=tax_rate,
                    tax_type=tax_type,
                    hsn_code=hsn_code,
                    place_of_supply=place,
                    currency=currency,
                    due_date=now + timedelta(days=3),
                    status="UNPAID",
                )
                db.add(invoice)
                db.flush()
                invoice.invoice_number = generate_invoice_number(invoice)
                db.commit()
                db.refresh(invoice)
                _log(db, LogType.CRON, f"Auto-renew invoice created for {dom.domain_name}", {"invoice_id": invoice.id, "order_id": order.id})
            except Exception:
                logger.exception(f"Auto-renew setup failed for {dom.id}")
        run_usage_collection()
    except Exception as e:
        logger.exception(f"Maintenance task error: {e}")
    finally:
        db.close()


def run_usage_collection():
    """Collect usage metrics for active subscriptions.

    Currently records uptime hours from ping data. Bandwidth/storage metrics
    can be plugged in here once the OVH RTM or another provider API is wired.
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        billing_period = now.strftime("%Y-%m")
        subs = db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).all()

        for sub in subs:
            # Uptime: 1 hour credit per active hour (simplified).
            # In a real implementation this would be pulled from OVH RTM or
            # a metrics exporter.
            record_usage(
                db,
                subscription_id=sub.id,
                metric_type="uptime_hours",
                value=1.0,
                unit="hours",
                billing_period=billing_period,
                cost=0.0,
                currency=sub.currency or "INR",
                details={"source": "estimated"},
            )

        _log(db, LogType.CRON, f"Usage collection completed for {len(subs)} active subscriptions")
    except Exception as e:
        logger.exception(f"Usage collection error: {e}")
    finally:
        db.close()


def run_ping_monitor():
    import subprocess
    import re
    db = SessionLocal()
    try:
        subs = db.query(Subscription).filter(Subscription.status.in_([SubscriptionStatus.ACTIVE])).all()
        for sub in subs:
            ip = sub.ip_address
            if not ip:
                continue
            try:
                proc = subprocess.run(["ping", "-c", "1", "-W", "2", ip], capture_output=True, text=True, timeout=4)
                if proc.returncode == 0:
                    m = re.search(r"time=([0-9.]+)\s*ms", proc.stdout)
                    latency = float(m.group(1)) if m else None
                    status = "UP"
                    packet_loss = 0.0
                else:
                    latency = None
                    status = "DOWN"
                    packet_loss = 1.0
            except Exception:
                latency = None
                status = "TIMEOUT"
                packet_loss = 1.0
            db.add(ServerPingMetric(
                subscription_id=sub.id,
                ip_address=ip,
                latency_ms=latency,
                packet_loss=packet_loss,
                status=status,
                details={"source": "cron"},
            ))
            db.commit()
    except Exception as e:
        logger.error(f"Ping monitor error: {e}")
    finally:
        db.close()


async def ping_monitor_loop():
    # Wait a bit for startup, then run every 5 minutes
    await asyncio.sleep(30)
    while True:
        await asyncio.to_thread(run_ping_monitor)
        await asyncio.sleep(300)


async def maintenance_loop():
    while True:
        await asyncio.to_thread(run_maintenance)
        await asyncio.sleep(3600)  # hourly


async def auto_scaling_loop():
    await asyncio.sleep(60)
    while True:
        db = None
        try:
            db = SessionLocal()
            await asyncio.to_thread(evaluate_rules, db)
        except Exception as e:
            logger.error(f"Auto-scaling evaluation failed: {e}")
        finally:
            if db:
                db.close()
        await asyncio.sleep(300)  # every 5 minutes


async def cloud_billing_loop():
    """Hourly wallet deduction for running cloud instances — every 10 min."""
    from app.services.cloud_service import billing_tick
    await asyncio.sleep(45)
    while True:
        db = None
        try:
            db = SessionLocal()
            stats = await asyncio.to_thread(billing_tick, db)
            if stats.get("billed") or stats.get("suspended"):
                logger.info(f"Cloud billing tick: {stats}")
        except Exception as e:
            logger.error(f"Cloud billing failed: {e}")
        finally:
            if db:
                db.close()
        await asyncio.sleep(600)  # every 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database schema management:
    # - SQLite: keep legacy auto-create + column-migration behavior.
    # - PostgreSQL: run Alembic migrations on startup so production schema
    #   is controlled by versioned migrations.
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        ensure_schema()
        logger.info("SQLite tables ensured")
    else:
        logger.info("Running Alembic migrations for PostgreSQL...")
        try:
            result = subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                cwd=os.path.dirname(os.path.dirname(__file__)),
                capture_output=True,
                text=True,
                check=True,
            )
            logger.info(result.stdout)
        except subprocess.CalledProcessError as e:
            logger.error(f"Alembic migration failed: {e.stderr}")
            raise RuntimeError(f"Database migration failed: {e.stderr}") from e
        logger.info("PostgreSQL migrations complete")

    # Security: do not start with the unsafe placeholder secret or default admin password
    if settings.secret_key in ("change-me-in-production", "change-this-to-a-random-32-char-string", "", "admin"):
        logger.error("Refusing to start: SECRET_KEY is set to a placeholder value. Update it in .env before running production.")
        raise RuntimeError("Insecure SECRET_KEY")

    if settings.admin_password == "admin123":
        logger.error("Refusing to start: default admin password is in use. Set a strong ADMIN_PASSWORD in .env.")
        raise RuntimeError("Insecure ADMIN_PASSWORD")

    task = asyncio.create_task(maintenance_loop())
    ping_task = asyncio.create_task(ping_monitor_loop())
    auto_scaling_task = asyncio.create_task(auto_scaling_loop())
    marketplace_task = asyncio.create_task(marketplace_worker())
    cloud_billing_task = asyncio.create_task(cloud_billing_loop())
    yield
    task.cancel()
    ping_task.cancel()
    auto_scaling_task.cancel()
    marketplace_task.cancel()
    cloud_billing_task.cancel()


app = FastAPI(
    title=settings.app_name,
    description="GHC - Go Host Cloud API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://checkout.razorpay.com "
        "https://js.stripe.com https://sdk.cashfree.com; "
        "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "frame-src https://accounts.google.com https://checkout.stripe.com https://api.razorpay.com "
        "https://sdk.cashfree.com https://www.paypal.com https://secure.payu.in https://test.payu.in; "
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://api.razorpay.com "
        "https://lumberjack.razorpay.com https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com "
        "https://api-m.paypal.com https://api-m.sandbox.paypal.com https://believoo.com; "
        "frame-ancestors 'self'"
    )
    return response


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Record request counts and latency for Prometheus."""
    from time import time

    from app.core.metrics import REQUEST_COUNT, REQUEST_LATENCY

    start = time()
    response = await call_next(request)
    duration = time() - start

    route = request.url.path
    method = request.method
    status = str(response.status_code)

    REQUEST_COUNT.labels(method=method, endpoint=route, status_code=status).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=route).observe(duration)

    return response


# API routes
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(subscriptions.router)
app.include_router(wallet.router)
app.include_router(webhooks.router)
app.include_router(admin.router)
app.include_router(support.router)
app.include_router(team.router)
app.include_router(compat.router)
app.include_router(auto_scaling.router)
app.include_router(marketplace.router)
app.include_router(cloud.router)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "app": settings.app_name}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str, request: Request):
    """Serve static files from Next.js export; fall back to 404.html for unknown routes."""
    if full_path.startswith("api/"):
        raise StarletteHTTPException(status_code=404)

    # Try exact file
    file_path = os.path.join(FRONTEND_DIST, full_path)
    if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
        headers = {}
        if file_path.endswith((".html", ".htm")):
            headers = {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "CDN-Cache-Control": "no-store",
                "Cloudflare-CDN-Cache-Control": "no-store",
            }
        elif "/_next/static/chunks/" in file_path:
            headers = {"Cache-Control": "public, max-age=31536000, immutable"}
        return FileResponse(file_path, headers=headers)

    # Try directory index (Next.js trailing-slash export)
    index_path = os.path.join(file_path, "index.html") if not full_path.endswith("/") else os.path.join(file_path, "index.html")
    dir_path = file_path if not full_path.endswith("/") else file_path
    if os.path.isdir(dir_path) and os.path.exists(os.path.join(dir_path, "index.html")):
        return FileResponse(os.path.join(dir_path, "index.html"), headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "CDN-Cache-Control": "no-store",
            "Cloudflare-CDN-Cache-Control": "no-store",
        })

    # Branded 404 page
    not_found_path = os.path.join(FRONTEND_DIST, "404.html")
    if os.path.exists(not_found_path):
        return FileResponse(not_found_path, status_code=404, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

    return HTMLResponse("<h1>Frontend not built</h1>", status_code=404)
