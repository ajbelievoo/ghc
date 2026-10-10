import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_or_service_key, get_current_admin
from app.models.models import (
    AdminConfig,
    CustomerOrder,
    Invoice,
    InvoiceStatus,
    MarginSetting,
    OvhOrderLog,
    PlanCatalog,
    PlanDuration,
    Subscription,
    SubscriptionStatus,
    SystemLog,
    LogType,
    User,
    UserRole,
    Wallet,
)
from app.schemas.admin import AdminConfigResponse, AdminStats, ConfigUpdate, OvhCredentialUpdate, OvhProxyRequest
from app.services.domain_service import create_dns_record, delete_dns_record, list_dns_records, refresh_dns_zone, update_dns_record
from app.services.email_service import get_admin_flag, send_email, send_invoice_email
from app.services.invoice_pdf_service import generate_invoice_pdf
from app.services.tax_service import tax_report
from app.services.usage_service import bill_usage, monthly_usage_summary, record_usage
from app.services.ovh_client import get_ovh_client_from_db
from app.services.catalog_service import CATALOG_REGISTRY, get_active_plans, sync_all_catalogs
from app.services.subscription_service import (
    get_any_subscription,
    get_server_details,
    get_server_bandwidth,
    get_console_url,
    perform_power_action,
    set_rescue_mode,
    set_normal_boot,
    update_reverse_dns,
    delete_reverse_dns,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/cloud/balance")
def admin_cloud_balance(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Return current upstream cloud account balance from the Python OVH client."""
    try:
        client = get_ovh_client_from_db(db)
        me = client.get('/me')
        currency = me.get('currency', 'EUR')

        # Try prepaid account for the subsidiary.
        try:
            accounts = client.get('/me/ovhAccount')
            for acc in accounts or []:
                if isinstance(acc, str):
                    detail = client.get(f'/me/ovhAccount/{acc}')
                    if detail:
                        bal = detail.get('balance') or 0
                        if isinstance(bal, dict):
                            return {
                                'balance': float(bal.get('value', 0)),
                                'currency': bal.get('currencyCode') or detail.get('currency') or currency,
                                'accountId': acc,
                            }
                        return {
                            'balance': float(bal),
                            'currency': detail.get('currency', currency),
                            'accountId': acc,
                        }
        except Exception:
            pass

        # Fallback to fidelity account.
        try:
            fidelity = client.get('/me/fidelityAccount')
            if fidelity:
                bal = fidelity.get('balance') or 0
                if isinstance(bal, dict):
                    return {
                        'balance': float(bal.get('value', 0)),
                        'currency': bal.get('currencyCode') or fidelity.get('currency') or currency,
                    }
                return {
                    'balance': float(bal) * 0.01,
                    'currency': fidelity.get('currency', currency),
                }
        except Exception:
            pass

        return {'balance': 0, 'currency': currency}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ovh/proxy")
def admin_ovh_proxy(
    payload: OvhProxyRequest,
    db: Session = Depends(get_db),
    _: None = Depends(get_admin_or_service_key),
):
    """Pass-through proxy for Laravel OVH calls. Uses the GHC Python OVH client."""
    try:
        client = get_ovh_client_from_db(db)
        return client.request(payload.method.upper(), payload.path, **payload.params)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_orders = db.query(CustomerOrder).count()
    total_subscriptions = db.query(Subscription).count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "ACTIVE").count()
    total_revenue = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "PAID").scalar() or 0.0
    wallet_balance_sum = db.query(func.sum(Wallet.balance)).scalar() or 0.0
    pending_orders = db.query(CustomerOrder).filter(CustomerOrder.status == "PENDING").count()
    failed_orders = db.query(CustomerOrder).filter(CustomerOrder.status == "FAILED").count()

    from datetime import datetime, timedelta

    from app.models.models import BillingCycle, DomainRegistration, DomainStatus, SupportTicket, TicketStatus

    # Monthly-recurring revenue: normalize each active sub to a monthly price
    cycle_divisor = {"MONTHLY": 1, "QUARTERLY": 3, "HALF_YEARLY": 6, "YEARLY": 12}
    mrr = 0.0
    for s in db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).all():
        mrr += (s.price_amount or 0) / cycle_divisor.get(getattr(s.billing_cycle, "value", s.billing_cycle), 1)
    overdue_invoices = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.UNPAID,
        Invoice.due_date.isnot(None),
        Invoice.due_date < datetime.utcnow(),
    ).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])).count()
    expiring_domains = db.query(DomainRegistration).filter(
        DomainRegistration.status == DomainStatus.ACTIVE,
        DomainRegistration.expires_at.isnot(None),
        DomainRegistration.expires_at <= datetime.utcnow() + timedelta(days=30),
    ).count()
    return AdminStats(
        total_users=total_users,
        total_orders=total_orders,
        total_subscriptions=total_subscriptions,
        active_subscriptions=active_subscriptions,
        total_revenue=float(total_revenue),
        wallet_balance_sum=float(wallet_balance_sum),
        pending_orders=pending_orders,
        failed_orders=failed_orders,
        mrr=round(mrr, 2),
        overdue_invoices=overdue_invoices,
        open_tickets=open_tickets,
        expiring_domains_30d=expiring_domains,
    )


@router.post("/sync-catalog")
def admin_sync_catalog(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        ovh = get_ovh_client_from_db(db)
        results = sync_all_catalogs(db, ovh)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tax-report")
def admin_tax_report(
    start: str | None = None,
    end: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """GST / tax summary report for paid invoices in a date range.
    Dates should be ISO-8601, e.g. 2026-09-01T00:00:00.
    """
    from datetime import datetime

    start_dt = datetime.fromisoformat(start) if start else None
    end_dt = datetime.fromisoformat(end) if end else None
    return tax_report(db, start_dt, end_dt)


@router.get("/suspension-queue")
def admin_suspension_queue(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Subscriptions past their bill date (candidates for suspension) + overdue unpaid invoices."""
    from datetime import datetime

    now = datetime.utcnow()
    overdue_subs = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.next_bill_date.isnot(None),
        Subscription.next_bill_date < now,
    ).order_by(Subscription.next_bill_date.asc()).all()
    overdue_invoices = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.UNPAID,
        Invoice.due_date.isnot(None),
        Invoice.due_date < now,
    ).order_by(Invoice.due_date.asc()).all()
    return {
        "autoSuspendEnabled": get_admin_flag(db, "auto_suspend_enabled", False),
        "overdueSubscriptions": [
            {
                "id": s.id,
                "user": {"id": s.user_id, "email": s.user.email if s.user else None, "name": s.user.name if s.user else None},
                "service": s.display_name or s.service_name or s.plan_code,
                "planCode": s.plan_code,
                "amount": s.price_amount,
                "currency": s.currency,
                "dueDate": s.next_bill_date.isoformat() if s.next_bill_date else None,
                "daysOverdue": (now - s.next_bill_date).days if s.next_bill_date else 0,
                "protected": _is_protected_subscription(s),
            }
            for s in overdue_subs
        ],
        "overdueInvoices": [
            {
                "id": i.id,
                "number": i.invoice_number or i.id[:8].upper(),
                "user": {"id": i.user_id, "email": i.user.email if i.user else None},
                "amount": i.amount,
                "currency": i.currency,
                "dueDate": i.due_date.isoformat() if i.due_date else None,
                "daysOverdue": (now - i.due_date).days if i.due_date else 0,
            }
            for i in overdue_invoices
        ],
    }


@router.get("/reports/sales.csv")
def admin_sales_report(
    start: str | None = None,
    end: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """CSV export of paid invoices for a date range (ISO-8601)."""
    import csv
    from datetime import datetime

    q = db.query(Invoice).filter(Invoice.status == InvoiceStatus.PAID)
    if start:
        q = q.filter(Invoice.created_at >= datetime.fromisoformat(start))
    if end:
        q = q.filter(Invoice.created_at <= datetime.fromisoformat(end))
    rows = q.order_by(Invoice.created_at.asc()).all()

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["invoice_number", "date", "customer_email", "taxable", "tax", "total", "currency", "tax_type", "hsn", "place_of_supply"])
    for i in rows:
        w.writerow([
            i.invoice_number or i.id[:8].upper(),
            i.created_at.strftime("%Y-%m-%d") if i.created_at else "",
            i.user.email if i.user else "",
            round(i.amount - (i.tax_amount or 0), 2),
            i.tax_amount or 0,
            i.amount,
            i.currency,
            i.tax_type,
            i.hsn_code,
            i.place_of_supply or "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ghc-sales-report.csv"},
    )


# Owner accounts whose upstream services must NEVER be mutated (see AGENTS.md).
def _is_protected_subscription(sub: Subscription) -> bool:
    from app.services.subscription_service import is_protected_subscription
    return is_protected_subscription(sub)


@router.post("/subscriptions/{subscription_id}/suspend")
def admin_suspend_subscription(subscription_id: str, body: dict = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Suspend a subscription (e.g. overdue). Refuses protected owner accounts."""
    from app.services.ovh_client import get_ovh_client_from_db
    from app.services.subscription_service import lifecycle_action

    reason = (body or {}).get("reason") or "manual suspension by administrator"
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if _is_protected_subscription(sub):
        raise HTTPException(status_code=403, detail="Protected account — upstream mutation not allowed")
    try:
        ovh = get_ovh_client_from_db(db)
        sub = lifecycle_action(db, ovh, sub, "suspend", reason=reason)
        db.add(SystemLog(type=LogType.INFO, message=f"Admin {admin.email} suspended subscription {sub.id}", details={"admin_id": admin.id, "subscription_id": sub.id, "reason": reason}))
        db.commit()
        return {"success": True, "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/unsuspend")
def admin_unsuspend_subscription(subscription_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Unsuspend a subscription. Refuses protected owner accounts."""
    from app.services.ovh_client import get_ovh_client_from_db
    from app.services.subscription_service import lifecycle_action

    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if _is_protected_subscription(sub):
        raise HTTPException(status_code=403, detail="Protected account — upstream mutation not allowed")
    try:
        ovh = get_ovh_client_from_db(db)
        sub = lifecycle_action(db, ovh, sub, "unsuspend")
        db.add(SystemLog(type=LogType.INFO, message=f"Admin {admin.email} unsuspended subscription {sub.id}", details={"admin_id": admin.id, "subscription_id": sub.id}))
        db.commit()
        return {"success": True, "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/impersonate")
def admin_impersonate_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Mint a short-lived access token to log in as a customer (support). Logged."""
    from datetime import timedelta

    from app.core.security import create_access_token

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot impersonate another admin")
    token = create_access_token({"sub": target.id, "imp": admin.id}, expires_delta=timedelta(minutes=60))
    db.add(SystemLog(type=LogType.INFO, message=f"Admin {admin.email} impersonated user {target.email}", details={"admin_id": admin.id, "user_id": target.id}))
    db.commit()
    return {"token": token, "user": {"id": target.id, "email": target.email, "name": target.name, "role": target.role.value}}


@router.get("/usage-summary")
def admin_usage_summary(
    billing_period: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Monthly usage summary across all subscriptions."""
    return monthly_usage_summary(db, billing_period)


@router.post("/usage-record")
def admin_record_usage(
    subscription_id: str,
    metric_type: str,
    value: float,
    unit: str,
    billing_period: str | None = None,
    cost: float = 0.0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Manually record a usage data point (for testing / backfill)."""
    return record_usage(db, subscription_id, metric_type, value, unit, billing_period, cost)


@router.post("/usage-bill")
def admin_bill_usage(
    subscription_id: str,
    billing_period: str | None = None,
    rates: dict | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Create an invoice for unbilled usage."""
    invoice = bill_usage(db, subscription_id, billing_period, rates or {})
    if not invoice:
        raise HTTPException(status_code=400, detail="No unbilled usage or zero cost")
    return {"invoice_id": invoice.id, "amount": invoice.amount, "tax_amount": invoice.tax_amount}


@router.get("/catalogs", response_model=list[dict])
def list_catalogs():
    return [
        {
            "category": r["category"].value,
            "endpoint": r["endpoint"],
            "family": r["family"],
            "optional": r.get("optional", False),
        }
        for r in CATALOG_REGISTRY
    ]


@router.get("/plans", response_model=list[dict])
def admin_list_plans(category: str = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.models.models import ServiceCategory
    cat = None
    if category:
        try:
            cat = ServiceCategory(category)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
    plans = get_active_plans(db, cat)
    return [{
        "id": p.id,
        "plan_code": p.plan_code,
        "invoice_name": p.invoice_name,
        "category": p.category.value,
        "cpu_cores": p.cpu_cores,
        "ram_gb": p.ram_gb,
        "disk_gb": p.disk_gb,
        "bandwidth_mbps": p.bandwidth_mbps,
        "override_price": p.override_price,
        "override_margin": p.override_margin,
        "is_active": p.is_active,
        "durations": [
            {
                "duration_label": d.duration_label,
                "raw_price": d.raw_price,
                "final_price": d.final_price,
                "currency": d.currency,
            }
            for d in p.durations
        ],
    } for p in plans]


@router.put("/plans/{plan_code}/price")
def update_plan_price(
    plan_code: str,
    override_price: float = None,
    override_margin: float = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    plan = db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.override_price = override_price
    plan.override_margin = override_margin
    db.commit()
    return {"success": True, "plan_code": plan_code}


@router.get("/orders")
def admin_list_orders(status: str = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(CustomerOrder)
    if status:
        query = query.filter(CustomerOrder.status == status)
    orders = query.order_by(CustomerOrder.created_at.desc()).all()
    return [{
        "id": o.id,
        "user_id": o.user_id,
        "plan_code": o.plan_code,
        "category": o.category.value,
        "customer_amount": o.customer_amount,
        "ovh_base_amount": o.ovh_base_amount,
        "commission_amount": o.commission_amount,
        "status": o.status.value,
        "ovh_order_id": o.ovh_order_id,
        "created_at": o.created_at.isoformat(),
    } for o in orders]


@router.get("/orders/{order_id}/logs")
def admin_order_logs(order_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    logs = db.query(OvhOrderLog).filter(OvhOrderLog.order_id == order_id).order_by(OvhOrderLog.created_at.desc()).all()
    return [{
        "id": l.id,
        "step": l.step,
        "endpoint": l.endpoint,
        "is_success": l.is_success,
        "error_message": l.error_message,
        "created_at": l.created_at.isoformat(),
    } for l in logs]


@router.get("/configs")
def list_configs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    configs = db.query(AdminConfig).all()
    return [AdminConfigResponse(key=c.key, value=c.value, updated_at=c.updated_at.isoformat()) for c in configs]


@router.put("/configs/{key}")
def update_config(key: str, payload: ConfigUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    config = db.query(AdminConfig).filter(AdminConfig.key == key).first()
    if not config:
        config = AdminConfig(key=key, value=payload.value)
        db.add(config)
    else:
        config.value = payload.value
    db.commit()
    db.refresh(config)
    return AdminConfigResponse(key=config.key, value=config.value, updated_at=config.updated_at.isoformat())


@router.put("/ovh-credentials")
def update_ovh_credentials(payload: OvhCredentialUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    keys = {
        "ovh_endpoint": payload.ovh_endpoint,
        "ovh_application_key": payload.ovh_application_key,
        "ovh_application_secret": payload.ovh_application_secret,
        "ovh_consumer_key": payload.ovh_consumer_key,
        "ovh_subsidiary": payload.ovh_subsidiary,
    }
    for key, value in keys.items():
        config = db.query(AdminConfig).filter(AdminConfig.key == key).first()
        if not config:
            config = AdminConfig(key=key, value=value)
            db.add(config)
        else:
            config.value = value
    db.commit()
    return {"success": True}


@router.get("/system-logs")
def system_logs(limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    logs = db.query(SystemLog).order_by(SystemLog.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "type": l.type.value,
        "message": l.message,
        "details": l.details,
        "created_at": l.created_at.isoformat(),
    } for l in logs]


@router.get("/email-logs")
def email_logs(to: str = None, status: str = None, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Outbound transactional email log — sent/failed/skipped."""
    from app.models.models import EmailLog
    q = db.query(EmailLog)
    if to:
        q = q.filter(EmailLog.to_email.ilike(f"%{to}%"))
    if status:
        q = q.filter(EmailLog.status == status)
    logs = q.order_by(EmailLog.created_at.desc()).limit(min(limit, 500)).all()
    return [{
        "id": l.id,
        "to": l.to_email,
        "subject": l.subject,
        "status": l.status,
        "error": l.error,
        "created_at": l.created_at.isoformat(),
    } for l in logs]


@router.get("/domains")
def admin_list_customer_domains(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.models.models import DomainRegistration
    regs = db.query(DomainRegistration).order_by(DomainRegistration.created_at.desc()).all()
    return [{
        "id": r.id,
        "domain": f"{r.domain_name}.{r.tld}" if r.tld and not r.tld.startswith(".") else f"{r.domain_name}{r.tld}",
        "userId": r.user_id,
        "status": r.status.value if hasattr(r.status, "value") else r.status,
        "years": r.years,
        "expiresAt": r.expires_at.isoformat() if r.expires_at else None,
        "autoRenew": r.auto_renew,
    } for r in regs]


@router.get("/domains/records")
def admin_get_domain_records(domain: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        ovh = get_ovh_client_from_db(db)
        records = list_dns_records(ovh, domain)
        return {"domain": domain, "records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/records")
def admin_add_domain_record(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    domain = (body.get("domain") or "").strip().lower()
    try:
        ovh = get_ovh_client_from_db(db)
        result = create_dns_record(ovh, domain, body.get("recordType"), body.get("subDomain"), body.get("target"), body.get("ttl", 3600))
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/domains/records/{record_id}")
def admin_update_domain_record(record_id: int, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    domain = (body.get("domain") or "").strip().lower()
    try:
        ovh = get_ovh_client_from_db(db)
        result = update_dns_record(ovh, domain, record_id, body.get("subDomain"), body.get("target"), body.get("ttl"))
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/domains/records/{record_id}")
def admin_delete_domain_record(record_id: int, domain: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    domain = (domain or "").strip().lower()
    try:
        ovh = get_ovh_client_from_db(db)
        result = delete_dns_record(ovh, domain, record_id)
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices")
def admin_list_invoices(status: str = None, user_id: str = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    if user_id:
        query = query.filter(Invoice.user_id == user_id)
    invoices = query.order_by(Invoice.created_at.desc()).all()
    return [{
        "id": inv.id,
        "user_id": inv.user_id,
        "order_id": inv.order_id,
        "amount": inv.amount,
        "tax_amount": inv.tax_amount,
        "tax_rate": inv.tax_rate,
        "currency": inv.currency,
        "status": inv.status.value,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    } for inv in invoices]


@router.get("/invoices/{invoice_id}/pdf")
def admin_invoice_pdf(invoice_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    user = db.query(User).filter(User.id == invoice.user_id).first()
    order = None
    if invoice.order_id:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == invoice.order_id).first()
    pdf_bytes = generate_invoice_pdf(invoice, user, order)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=invoice-{invoice.id[:8].upper()}.pdf"})


@router.post("/invoices/{invoice_id}/status")
def admin_update_invoice_status(invoice_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    status = body.get("status")
    if status not in [s.value for s in InvoiceStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")
    invoice.status = InvoiceStatus(status)
    db.commit()
    return {"success": True, "invoiceId": invoice.id, "status": invoice.status.value}


@router.post("/invoices/{invoice_id}/send")
def admin_send_invoice_email(invoice_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    user = db.query(User).filter(User.id == invoice.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    order = None
    if invoice.order_id:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == invoice.order_id).first()
    try:
        pdf_bytes = generate_invoice_pdf(invoice, user, order)
        ok = send_invoice_email(db, invoice, user, order, pdf_bytes)
        if not ok:
            raise HTTPException(status_code=500, detail="SMTP not configured or email failed")
        return {"success": True, "invoiceId": invoice.id, "sentTo": user.email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscriptions/{subscription_id}")
def admin_subscription_details(subscription_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = get_any_subscription(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    try:
        ovh = get_ovh_client_from_db(db)
        details = get_server_details(ovh, sub)
        bandwidth = get_server_bandwidth(ovh, sub)
        return {"subscription": {c.name: getattr(sub, c.name) for c in sub.__table__.columns}, "details": details, "bandwidth": bandwidth}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/power")
def admin_subscription_power(subscription_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = get_any_subscription(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    action = body.get("action")
    if action not in ("reboot", "shutdown", "start"):
        raise HTTPException(status_code=400, detail="Invalid action")
    try:
        ovh = get_ovh_client_from_db(db)
        return perform_power_action(db, ovh, sub, action)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/rescue")
def admin_subscription_rescue(subscription_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = get_any_subscription(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    try:
        ovh = get_ovh_client_from_db(db)
        if body.get("enabled") is False:
            return set_normal_boot(db, ovh, sub)
        return set_rescue_mode(db, ovh, sub, reboot=bool(body.get("reboot")))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/console")
def admin_subscription_console(subscription_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = get_any_subscription(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return get_console_url(ovh, sub, body.get("clientIp", "0.0.0.0"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscriptions/{subscription_id}/reverse-dns")
def admin_subscription_reverse_dns(subscription_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = get_any_subscription(db, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    ip = body.get("ip")
    reverse = body.get("reverse")
    delete = body.get("delete")
    try:
        ovh = get_ovh_client_from_db(db)
        if delete:
            return delete_reverse_dns(ovh, ip)
        return update_reverse_dns(ovh, ip, reverse)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
