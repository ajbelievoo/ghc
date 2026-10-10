import io
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_admin, get_current_user, rate_limit
from app.models.models import (
    AdminConfig,
    CustomerOrder,
    DomainRegistration,
    DomainStatus,
    GatewayConfig,
    Invoice,
    InvoiceStatus,
    MarginSetting,
    OrderStatus,
    PaymentStatus,
    PaymentTransaction,
    PlanCatalog,
    MetricSample,
    ServerPingMetric,
    ServiceAlertRule,
    ServiceCategory,
    Subscription,
    SupportTicket,
    SystemLog,
    TicketStatus,
    AdditionalIp,
    User,
    UserNotification,
    UserRole,
    Wallet,
    WalletTransaction,
    WalletTransactionType,
)
from app.schemas.order import OrderCreate
from app.services import metrics_service
from app.services.catalog_service import get_active_plans
from app.services.currency_service import get_rate
from app.services.domain_service import (
    _verify_domain_owner,
    create_dns_record,
    delete_dns_record,
    list_dns_records,
    refresh_dns_zone,
    update_dns_record,
)
from app.services.order_service import (
    create_customer_order,
    create_service_option_order,
    execute_checkout,
    get_vps_option_catalog,
    pay_order_with_wallet,
    _resolve_plan_code,
)
from app.services.ovh_client import get_ovh_client_from_db, apply_margin
from app.services.subscription_service import (
    add_vps_secondary_dns,
    change_vps_ip_geolocation,
    create_vps_snapshot,
    delete_reverse_dns,
    delete_vps_secondary_dns,
    delete_vps_snapshot,
    get_console_url,
    get_server_bandwidth,
    get_server_details,
    get_service_metrics,
    get_subscription,
    get_user_subscriptions,
    get_vps_backup,
    get_vps_disks,
    get_vps_images,
    get_vps_ip_countries,
    get_vps_overview,
    get_vps_secondary_dns,
    get_vps_tasks,
    lifecycle_action,
    perform_power_action,
    reinstall_os,
    rename_vps,
    request_service_termination,
    reset_vps_password,
    set_normal_boot,
    set_service_auto_renew,
    set_rescue_mode,
    set_vps_netboot,
    update_reverse_dns,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["compat"])


# ---------- Helpers ----------

def _months(interval: int, interval_unit: str) -> float:
    u = (interval_unit or "").lower()
    if u in ("month", "months"):
        return float(interval)
    if u in ("year", "years"):
        return float(interval) * 12
    if u in ("day", "days"):
        return float(interval) / 30
    return float(interval)


def _monthly_price(final_price: float, interval: int, interval_unit: str) -> float:
    months = _months(interval, interval_unit)
    if not months or not final_price:
        return float(final_price or 0)
    return float(final_price) / months


def _domain_dns_taken(domain: str, timeout: float = 1.5) -> bool:
    """Quick independent availability check using public DNS resolvers."""
    try:
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.timeout = timeout
        resolver.lifetime = timeout + 0.5
        for rtype in ("A", "NS", "SOA"):
            try:
                resolver.resolve(domain, rtype)
                return True
            except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
                continue
            except Exception:
                continue
        return False
    except Exception:
        return False


def _resolve_domain_plan(domain: str, plans: list):
    """Find the best matching domain TLD plan by longest suffix match."""
    domain = (domain or "").strip().lower()
    candidates = []
    for p in plans:
        if p.plan_code and p.plan_code.lower() == "ovh" and p.category == ServiceCategory.DOMAINS:
            continue
        codes = {p.plan_code.lower(), (p.invoice_name or "").strip().lower().lstrip(".")}
        for code in codes:
            if not code:
                continue
            if domain.endswith("." + code) or domain == code:
                candidates.append((len(code), p, code))
    if not candidates:
        return None
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][2], candidates[0][1]


def _plan_to_frontend(p: PlanCatalog, currency: Optional[str] = None, db: Session = None) -> dict:
    target = (currency or get_settings().currency or "USD").upper()
    plan_currency = (p.currency or target).upper()
    if db and plan_currency != target:
        from app.services.currency_service import convert
        converted_durations = []
        for d in p.durations:
            converted_durations.append({
                "durationLabel": d.duration_label,
                "interval": d.interval,
                "intervalUnit": d.interval_unit,
                "rawPrice": round(convert(db, d.raw_price, plan_currency, target), 2),
                "finalPrice": round(convert(db, d.final_price, plan_currency, target), 2),
                "monthlyPrice": round(convert(db, _monthly_price(d.final_price, d.interval, d.interval_unit), plan_currency, target), 2),
                "currency": target,
            })
        durations = converted_durations
    else:
        durations = [
            {
                "durationLabel": d.duration_label,
                "interval": d.interval,
                "intervalUnit": d.interval_unit,
                "rawPrice": d.raw_price,
                "finalPrice": d.final_price,
                "monthlyPrice": _monthly_price(d.final_price, d.interval, d.interval_unit),
                "currency": d.currency,
            }
            for d in p.durations
        ]
    regions, os_options, windows = _plan_region_os(p)
    features = _plan_features(p)
    return {
        "id": p.id,
        "planCode": p.plan_code,
        "invoiceName": p.invoice_name,
        "description": p.description,
        "category": p.category.value,
        "family": p.family,
        "cpuCores": p.cpu_cores,
        "ramGb": p.ram_gb,
        "diskGb": p.disk_gb,
        "diskType": p.disk_type,
        "bandwidthMbps": p.bandwidth_mbps,
        "currency": target if db and plan_currency != target else plan_currency,
        "overridePrice": p.override_price,
        "overrideMargin": p.override_margin,
        "isActive": p.is_active,
        "regions": regions,
        "osOptions": os_options,
        "windowsVps": windows,
        "features": features,
        "durations": durations,
    }


def _plan_metadata(p: PlanCatalog) -> dict:
    meta = p.catalog_metadata or {}
    if isinstance(meta, str):
        try:
            import json as _json
            meta = _json.loads(meta)
        except Exception:
            meta = {}
    return meta if isinstance(meta, dict) else {}


def _plan_region_os(p: PlanCatalog):
    """Extract (regions, os_count, windows_supported) from OVH catalog metadata."""
    cfgs = _plan_metadata(p).get("configurations", []) or []
    regions, os_vals = [], []
    for c in cfgs:
        name = (c.get("name") or "").lower()
        vals = c.get("values") or []
        if not isinstance(vals, list):
            continue
        if ("datacenter" in name or name == "region") and len(vals) > len(regions):
            regions = vals
        if ("_os" in name or name in ("os", "image")) and len(vals) > len(os_vals):
            os_vals = vals
    windows = any("windows" in str(v).lower() for v in os_vals)
    return regions, len(os_vals), windows


def _plan_features(p: PlanCatalog) -> dict:
    blobs = _plan_metadata(p).get("blobs") or {}
    commercial = blobs.get("commercial") if isinstance(blobs, dict) else {}
    feats = (commercial or {}).get("features") or []
    return {f["name"]: f["value"] for f in feats if isinstance(f, dict) and f.get("name")}


def _subscription_to_server(s: Subscription) -> dict:
    return {
        "id": s.id,
        "orderId": s.order_id,
        "userId": s.user_id,
        "providerResourceId": s.ovh_resource_id,
        "serviceName": s.service_name,
        "displayName": s.display_name,
        "name": s.display_name or s.service_name or s.plan_code or f"Server {s.id[:8]}",
        "planCode": s.plan_code,
        "category": s.category.value,
        "ipAddress": s.ip_address,
        "rootUser": s.root_user,
        "rootPassword": s.root_password,
        "osTemplate": s.os_template,
        "datacenter": s.datacenter,
        "status": s.status.value,
        "suspensionReason": s.suspension_reason,
        "billingCycle": s.billing_cycle.value,
        "autoRenew": s.auto_renew,
        "nextBillDate": s.next_bill_date.isoformat() if s.next_bill_date else None,
        "priceAmount": s.price_amount,
        "currency": s.currency,
        "createdAt": s.created_at.isoformat(),
        "updatedAt": s.updated_at.isoformat(),
    }


# ---------- Server / Plans ----------

@router.get("/server/plans")
def server_plans(category: Optional[str] = None, family: Optional[str] = None, currency: Optional[str] = None, db: Session = Depends(get_db)):
    cat = None
    if category:
        try:
            cat = ServiceCategory(category)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
    plans = get_active_plans(db, cat)
    return [_plan_to_frontend(p, currency, db) for p in plans]


@router.get("/server/plans/configuration")
def plan_configuration(
    planCode: str,
    category: Optional[str] = None,
    durationLabel: Optional[str] = None,
    db: Session = Depends(get_db),
):
    plan = _resolve_plan_code(db, planCode)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    # Return actual provider configuration options from catalog metadata
    configs = []
    metadata = plan.catalog_metadata or {}
    catalog_configs = metadata.get("configurations", [])
    for cfg in catalog_configs:
        name = cfg.get("name")
        values = cfg.get("values", [])
        if name and values:
            configs.append({"label": name, "values": values})
    # Also expose common frontend keys
    return {
        "planCode": planCode,
        "category": plan.category.value,
        "durationLabel": durationLabel,
        "available": True,
        "configurations": configs,
    }


@router.get("/server/domains")
def server_domains(currency: Optional[str] = None, db: Session = Depends(get_db)):
    from app.models.models import PlanCatalog
    from app.services.currency_service import convert
    target = (currency or get_settings().currency or "USD").upper()
    plans = db.query(PlanCatalog).filter(PlanCatalog.category == "DOMAINS", PlanCatalog.is_active == True).all()
    return [
        {
            "tld": p.plan_code,
            "baseCost": round(convert(db, p.durations[0].raw_price if p.durations else 0, p.currency or "INR", target), 2),
            "marginPercent": 20.0,
            "finalPrice": round(convert(db, p.durations[0].final_price if p.durations else 0, p.currency or "INR", target), 2),
            "currency": target,
        }
        for p in plans
        if p.plan_code and p.plan_code.lower() != "ovh" and ".ovh" not in (p.invoice_name or "").lower()
        and (p.durations and p.durations[0].final_price > 0)
    ]


@router.get("/server/domains/check")
def check_domain(domain: str, currency: Optional[str] = None, db: Session = Depends(get_db)):
    from app.services.currency_service import convert
    target = (currency or get_settings().currency or "USD").upper()
    raw = (domain or "").strip().lower()
    if not raw or "." not in raw or raw.startswith(".") or raw.endswith("."):
        return {"available": False, "domain": raw, "tld": "", "price": 0, "currency": target, "reason": "Please enter a valid domain like example.com"}
    from app.models.models import PlanCatalog
    plans = [p for p in db.query(PlanCatalog).filter(PlanCatalog.category == "DOMAINS", PlanCatalog.is_active == True).all() if p.plan_code and p.plan_code.lower() != "ovh"]
    matched = _resolve_domain_plan(raw, plans)
    if not matched:
        return {"available": False, "domain": raw, "tld": "", "price": 0, "currency": target, "reason": "This extension is not supported"}
    tld_code, plan = matched
    tld = "." + tld_code
    if tld == ".ovh":
        return {"available": False, "domain": raw, "tld": tld, "price": 0, "currency": target, "reason": "This extension is not available"}
    base_currency = (plan.durations[0].currency if plan.durations and plan.durations[0].currency else (plan.currency or "INR")).upper()
    price = plan.durations[0].final_price if plan.durations else 0
    if price <= 0:
        return {"available": False, "domain": raw, "tld": tld, "price": 0, "currency": target, "reason": "Pricing not available"}
    taken = _domain_dns_taken(raw)
    return {
        "available": not taken,
        "domain": raw,
        "tld": tld,
        "price": round(convert(db, price, base_currency, target), 2),
        "currency": target,
        "reason": "Domain is already registered" if taken else None,
    }


@router.get("/server/domains/suggest")
def suggest_domains(keyword: str, currency: Optional[str] = None, db: Session = Depends(get_db)):
    from app.services.currency_service import convert
    target = (currency or get_settings().currency or "USD").upper()
    keyword = (keyword or "").strip().lower()
    if not keyword:
        return []

    plans = db.query(PlanCatalog).filter(PlanCatalog.category == "DOMAINS", PlanCatalog.is_active == True).all()
    plans = [p for p in plans if p.plan_code and p.plan_code.lower() != "ovh" and ".ovh" not in (p.invoice_name or "").lower()]

    base = keyword
    exact_tld = None
    if "." in keyword and not keyword.startswith(".") and not keyword.endswith("."):
        matched = _resolve_domain_plan(keyword, plans)
        if matched:
            exact_tld, _ = matched
            suffix = "." + exact_tld
            if keyword.endswith(suffix):
                base = keyword[: -len(suffix)]

    POPULAR = {"com", "net", "org", "in", "co", "io", "app", "dev", "ai", "tech", "store", "online", "site", "xyz", "shop", "blog", "cloud", "live", "me", "us", "uk", "eu", "de", "fr", "nl", "ca", "au", "jp", "sg"}

    base_currencies = set()
    for p in plans:
        if p.durations:
            base_currencies.add((p.durations[0].currency or p.currency or "INR").upper())
    rates_map = {bc: get_rate(db, bc, target) for bc in base_currencies}

    # Availability: our DB + real DNS delegation checks (parallel) — results must match reality.
    local_taken = set()
    for d in db.query(DomainRegistration).filter(DomainRegistration.domain_name == base, DomainRegistration.status == DomainStatus.ACTIVE).all():
        local_taken.add(d.tld.lower().lstrip("."))

    valid_plans = [p for p in plans if (p.plan_code or "").lower() and (p.plan_code or "").lower() != "ovh" and p.durations and (p.durations[0].final_price or 0) > 0]

    results = []
    for plan in valid_plans:
        tld = (plan.plan_code or "").lower()
        domain = f"{base}.{tld}"
        base_currency = (plan.durations[0].currency or plan.currency or "INR").upper()
        price = (plan.durations[0].final_price or 0) * rates_map.get(base_currency, 1.0)
        results.append({
            "domain": domain,
            "tld": "." + tld,
            "available": tld not in local_taken,
            "price": round(price, 2),
            "currency": target,
            "reason": "Domain is already registered" if tld in local_taken else None,
            "isExact": exact_tld is not None and tld == exact_tld,
        })

    # Popular TLDs first
    results.sort(key=lambda x: (
        not x["isExact"],
        not x["available"],
        not (x["tld"].lstrip(".").split(".")[-1] in POPULAR),
        x["price"] if x["available"] else 999999.0,
    ))
    results = results[:80]

    # Real availability: parallel DNS delegation checks on the shown rows only.
    try:
        from concurrent.futures import ThreadPoolExecutor
        shown = [r["domain"] for r in results]
        with ThreadPoolExecutor(max_workers=24) as ex:
            flags = list(ex.map(lambda d: _domain_dns_taken(d, 1.2), shown))
        for r, taken in zip(results, flags):
            if taken:
                r["available"] = False
                r["reason"] = "Domain is already registered"
    except Exception:
        pass
    return results


@router.post("/server/domains")
def register_domain(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.models import DomainRegistration, DomainStatus, PaymentStatus
    from app.services.currency_service import convert
    from datetime import datetime, timedelta
    years = int(body.get("years", 1))
    tld = (body.get("tld") or "").strip().lower().lstrip(".")
    domain_name = (body.get("domainName") or "").strip().lower()
    full_domain = f"{domain_name}.{tld}" if domain_name and tld else domain_name
    # Price is resolved server-side from the catalog — never trust client-supplied amounts.
    from app.models.models import PlanCatalog
    plans = [p for p in db.query(PlanCatalog).filter(
        PlanCatalog.category == ServiceCategory.DOMAINS, PlanCatalog.is_active == True
    ).all() if p.plan_code and p.plan_code.lower() != "ovh"]
    matched = _resolve_domain_plan(full_domain, plans)
    if not matched:
        raise HTTPException(status_code=400, detail="TLD is not available for registration")
    tld_code, plan = matched
    tld = "." + tld_code
    if tld == ".ovh":
        raise HTTPException(status_code=400, detail="This extension is not available")
    if _domain_dns_taken(full_domain):
        raise HTTPException(status_code=400, detail="Domain is already registered")
    target = (body.get("currency") or get_settings().currency or "USD").upper()
    base_currency = (plan.durations[0].currency if plan.durations and plan.durations[0].currency else (plan.currency or "INR")).upper()
    base_price = (plan.override_price if plan.override_price is not None else plan.durations[0].final_price) * years
    if base_price <= 0:
        raise HTTPException(status_code=400, detail="Pricing not available for this domain")
    price = round(convert(db, base_price, base_currency, target), 2)
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(price * tax_rate, 2)
    total = round(price + tax_amount, 2)
    payment_tx_id = body.get("paymentTransactionId")
    # Idempotency: reuse an existing pending registration for the same domain/currency if no payment attached.
    existing = db.query(DomainRegistration).filter(
        DomainRegistration.user_id == user.id,
        DomainRegistration.domain_name == domain_name,
        DomainRegistration.tld == tld,
        DomainRegistration.currency == target,
        DomainRegistration.status == DomainStatus.PENDING,
        DomainRegistration.payment_transaction_id.is_(None),
    ).first()
    if existing and not payment_tx_id:
        return {
            "success": True,
            "domainId": existing.id,
            "priceAmount": existing.price_amount,
            "taxAmount": existing.tax_amount,
            "totalAmount": round(float(existing.price_amount or 0) + float(existing.tax_amount or 0), 2),
            "currency": existing.currency,
            "status": existing.status.value,
        }
    status = DomainStatus.PENDING
    if payment_tx_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_tx_id, PaymentTransaction.user_id == user.id).first()
        if not tx:
            raise HTTPException(status_code=400, detail="Payment transaction not found")
        if round(float(tx.amount), 2) != total:
            raise HTTPException(status_code=400, detail="Payment amount does not match domain total")
        if (tx.currency or "USD").upper() != target:
            raise HTTPException(status_code=400, detail="Payment currency does not match")
        if tx.status == PaymentStatus.COMPLETED:
            status = DomainStatus.ACTIVE
        elif tx.status != PaymentStatus.PENDING:
            raise HTTPException(status_code=400, detail="Payment is not in a valid state")
    reg = DomainRegistration(
        user_id=user.id,
        domain_name=body.get("domainName", ""),
        tld=tld,
        years=years,
        status=status,
        expires_at=datetime.utcnow() + timedelta(days=365 * years),
        price_amount=price,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        currency=target,
        payment_transaction_id=payment_tx_id,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    if payment_tx_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_tx_id).first()
        if tx:
            meta = tx.payment_metadata or {}
            meta["domain_registration_id"] = reg.id
            tx.payment_metadata = meta
            db.commit()
    return {"success": True, "domainId": reg.id, "priceAmount": price, "taxAmount": tax_amount, "totalAmount": total, "currency": reg.currency, "status": reg.status.value}


@router.get("/server/my-domains")
def list_my_domains(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    regs = (
        db.query(DomainRegistration)
        .filter(DomainRegistration.user_id == user.id)
        .order_by(DomainRegistration.created_at.desc())
        .all()
    )
    tech_map = {"ACTIVE": "Active", "PENDING": "Provisioning", "SUSPENDED": "Suspended", "EXPIRED": "Expired", "CANCELLED": "Deleted"}
    registrant = (user.name or "").strip() or user.email.split("@")[0]
    registrant = " ".join(w.capitalize() for w in registrant.replace(".", " ").replace("_", " ").split()).upper()
    out = []
    for reg in regs:
        status = reg.status.value if hasattr(reg.status, "value") else reg.status
        out.append({
            "id": reg.id,
            "domainName": reg.domain_name,
            "tld": reg.tld,
            "domain": f"{reg.domain_name}{reg.tld}" if reg.tld.startswith(".") else f"{reg.domain_name}.{reg.tld}",
            "years": reg.years,
            "status": status,
            "technicalStatus": tech_map.get(status, "Active" if status == "ACTIVE" else status.title()),
            "renewalFrequency": "Every year" if (reg.years or 1) <= 1 else f"Every {reg.years} years",
            "ongoingOperations": 1 if status == "PENDING" else 0,
            "registrantContact": registrant,
            "priceAmount": reg.price_amount,
            "taxAmount": reg.tax_amount,
            "totalAmount": round(float(reg.price_amount or 0) + float(reg.tax_amount or 0), 2),
            "currency": reg.currency,
            "expiresAt": reg.expires_at.isoformat() if reg.expires_at else None,
            "createdAt": reg.created_at.isoformat() if reg.created_at else None,
            "paymentTransactionId": reg.payment_transaction_id,
            "autoRenew": bool(reg.auto_renew),
        })
    return out


@router.post("/server/domains/{domain_id}/auto-renew")
def toggle_domain_auto_renew(domain_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reg = db.query(DomainRegistration).filter(
        DomainRegistration.id == domain_id,
        DomainRegistration.user_id == user.id,
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Domain not found")
    reg.auto_renew = not bool(reg.auto_renew)
    db.commit()
    return {"success": True, "domainId": reg.id, "autoRenew": bool(reg.auto_renew)}


@router.get("/server/domains/records")
def get_domain_records(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        records = list_dns_records(ovh, domain)
        return {"domain": domain, "records": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/domains/records")
def add_domain_record(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (body.get("domain") or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        result = create_dns_record(
            ovh,
            domain,
            body.get("recordType"),
            body.get("subDomain"),
            body.get("target"),
            body.get("ttl", 3600),
        )
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/server/domains/records/{record_id}")
def edit_domain_record(record_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (body.get("domain") or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        result = update_dns_record(
            ovh,
            domain,
            record_id,
            body.get("subDomain"),
            body.get("target"),
            body.get("ttl"),
        )
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/domains/records/{record_id}")
def remove_domain_record(record_id: int, domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        result = delete_dns_record(ovh, domain, record_id)
        refresh_dns_zone(ovh, domain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/domains/{domain}/nameservers")
def get_domain_nameservers(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        ids = ovh.get(f"/domain/zone/{domain}/nameServers") or []
        detail = ovh.get(f"/domain/{domain}/nameServer") or []
        servers = []
        for ns_id in (detail if isinstance(detail, list) else []):
            try:
                servers.append(ovh.get(f"/domain/{domain}/nameServer/{ns_id}"))
            except Exception:
                pass
        return {"domain": domain, "current": ids, "servers": servers}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/server/domains/{domain}/nameservers")
def set_domain_nameservers(domain: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    servers = body.get("nameServers") or []
    if not servers or not all(isinstance(s, str) and "." in s for s in servers):
        raise HTTPException(status_code=400, detail="nameServers must be a list of hostnames")
    try:
        ovh = get_ovh_client_from_db(db)
        payload = {"nameServers": [{"host": s.strip().lower()} for s in servers]}
        return ovh.post(f"/domain/{domain}/nameServers/update", **payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/domains/{domain}/dnssec")
def get_domain_dnssec(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return ovh.get(f"/domain/{domain}/dnssec")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/domains/{domain}/dnssec")
def set_domain_dnssec(domain: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return ovh.post(f"/domain/{domain}/dnssec", **{"dsData": body.get("dsData")})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/activity")
def user_activity(limit: int = 10, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Recent user activity across orders, invoices, tickets, and domains."""
    activities = []
    orders = db.query(CustomerOrder).filter(CustomerOrder.user_id == user.id).order_by(CustomerOrder.created_at.desc()).limit(limit).all()
    for o in orders:
        activities.append({
            "type": "order",
            "title": f"Order {o.status.value.lower()}: {o.plan_code}",
            "amount": o.customer_amount,
            "currency": o.currency,
            "status": o.status.value,
            "createdAt": o.created_at.isoformat() if o.created_at else None,
        })
    invoices = db.query(Invoice).filter(Invoice.user_id == user.id).order_by(Invoice.created_at.desc()).limit(limit).all()
    for inv in invoices:
        activities.append({
            "type": "invoice",
            "title": f"Invoice {inv.status.value}",
            "amount": inv.amount,
            "currency": inv.currency,
            "status": inv.status.value,
            "createdAt": inv.created_at.isoformat() if inv.created_at else None,
        })
    tickets = db.query(SupportTicket).filter(SupportTicket.user_id == user.id).order_by(SupportTicket.created_at.desc()).limit(limit).all()
    for t in tickets:
        activities.append({
            "type": "ticket",
            "title": f"Ticket: {t.subject}",
            "status": t.status.value,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
        })
    activities.sort(key=lambda x: x["createdAt"] or "", reverse=True)
    return activities[:limit]


@router.get("/public/announcements")
def public_announcements(db: Session = Depends(get_db)):
    row = db.query(AdminConfig).filter(AdminConfig.key == "public_announcements").first()
    if row and row.value:
        try:
            import json
            return json.loads(row.value)
        except Exception:
            pass
    return [
        {"id": "1", "title": "Welcome to GHC", "message": "Your new cloud control panel is live. Manage servers, domains, invoices and support from one place.", "priority": "info", "createdAt": "2025-07-20T00:00:00"},
        {"id": "2", "title": "New dashboard features", "message": "Service hub, profile management, wallet history, invoice Pay Now, and more are now available.", "priority": "success", "createdAt": "2025-07-22T00:00:00"},
    ]


@router.get("/user/referral")
def user_referral(user: User = Depends(get_current_user)):
    code = user.id[:12].upper()
    return {
        "code": code,
        "link": f"https://ghc.believoo.com/register?ref={code}",
        "reward": "Earn 10% account credit when your referral pays their first invoice.",
    }


@router.get("/user/notifications")
def get_user_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cfg = db.query(AdminConfig).filter(AdminConfig.key == f"notif_{user.id}").first()
    defaults = {"orderUpdates": True, "invoiceReminders": True, "supportReplies": True, "promotions": False, "securityAlerts": True}
    if cfg and cfg.value:
        try:
            import json
            return {**defaults, **json.loads(cfg.value)}
        except Exception:
            return defaults
    return defaults


@router.put("/user/notifications")
def update_user_notifications(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    import json
    cfg = db.query(AdminConfig).filter(AdminConfig.key == f"notif_{user.id}").first()
    if not cfg:
        cfg = AdminConfig(key=f"notif_{user.id}", value=json.dumps(body))
        db.add(cfg)
    else:
        cfg.value = json.dumps(body)
    db.commit()
    return body


@router.get("/user/notifications-list")
def list_user_notifications(limit: int = 20, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = (
        db.query(UserNotification)
        .filter(UserNotification.user_id == user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "isRead": n.is_read,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        }
        for n in items
    ]


@router.post("/user/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.query(UserNotification).filter(UserNotification.id == notif_id, UserNotification.user_id == user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"success": True}


@router.get("/public/status")
def public_status(db: Session = Depends(get_db)):
    services = [
        {"name": "VPS Cloud", "status": "operational"},
        {"name": "Dedicated Servers", "status": "operational"},
        {"name": "Domain Services", "status": "operational"},
        {"name": "Payments", "status": "operational"},
        {"name": "Support Tickets", "status": "operational"},
        {"name": "Email", "status": "operational"},
    ]
    since = datetime.utcnow() - timedelta(hours=1)
    pings = db.query(ServerPingMetric).filter(ServerPingMetric.checked_at >= since).all()
    if pings:
        high_latency = [p for p in pings if p.latency_ms is not None and p.latency_ms > 500]
        failed = [p for p in pings if p.status and p.status != "UP"]
        if failed:
            for s in services:
                if s["name"] in ("VPS Cloud", "Dedicated Servers"):
                    s["status"] = "degraded"
        elif high_latency:
            for s in services:
                if s["name"] in ("VPS Cloud", "Dedicated Servers"):
                    s["status"] = "operational"
            services[0]["status"] = "operational"
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == TicketStatus.OPEN).count()
    if open_tickets > 50:
        services[4]["status"] = "degraded"
    overall = "operational"
    statuses = [s["status"] for s in services]
    if any(s == "major_outage" for s in statuses):
        overall = "major_outage"
    elif any(s == "degraded" for s in statuses):
        overall = "degraded"
    return {
        "overall": overall,
        "updatedAt": datetime.utcnow().isoformat(),
        "services": services,
    }


@router.post("/public/abuse-report", dependencies=[Depends(rate_limit(3, 3600, "abuse-report"))])
def public_abuse_report(body: dict, request: Request, db: Session = Depends(get_db)):
    """Public abuse/DMCA report intake — emails the abuse desk. Rate-limited per IP."""
    name = (body.get("name") or "").strip()[:200]
    email = (body.get("email") or "").strip()[:200]
    target = (body.get("target") or "").strip()[:500]
    rtype = (body.get("type") or "abuse").strip()[:50]
    details = (body.get("details") or "").strip()[:5000]
    if not email or "@" not in email or not target or not details:
        raise HTTPException(status_code=400, detail="email, target and details are required")
    if rtype not in ("spam", "phishing", "malware", "copyright", "network", "content", "other"):
        rtype = "other"
    from app.services.email_service import send_email
    html = (
        f"<h3>Abuse report — {rtype}</h3>"
        f"<p><b>Reporter:</b> {name or 'Anonymous'} &lt;{email}&gt;</p>"
        f"<p><b>Target:</b> {target}</p>"
        f"<p><b>IP:</b> {request.client.host if request.client else 'unknown'}</p>"
        f"<hr><pre style='white-space:pre-wrap'>{details}</pre>"
    )
    ok = send_email(db, "abuse@believoo.com", f"[Abuse:{rtype}] {target[:80]}", html, f"{rtype} report on {target}\n\n{details}\n\nFrom: {name} <{email}>")
    return {"success": True, "emailed": ok}


@router.post("/ai/assistant")
def ai_assistant(body: dict, user: User = Depends(get_current_user)):
    q = (body.get("message") or "").lower()
    answer = "I am your GHC assistant. I can help with servers, domains, billing and support. Please ask a specific question."
    if any(k in q for k in ["reboot", "restart", "power", "shutdown"]):
        answer = "You can reboot or power-cycle your server from the dashboard. Go to My Servers, select a server, and use the Power actions. For rescue mode, click Rescue."
    elif any(k in q for k in ["invoice", "pay", "payment", "bill"]):
        answer = "Invoices can be viewed and paid in the Invoices tab. You can pay via wallet, Razorpay, Cashfree, PayPal, PayU, or Stripe. Download PDF for records."
    elif any(k in q for k in ["domain", "dns", "register", "renew"]):
        answer = "Register and manage domains from the My Domains tab. You can add A, AAAA, CNAME, MX, TXT, NS, SRV and CAA records. Auto-renew can be toggled per domain."
    elif any(k in q for k in ["vps", "server", "dedicated", "plan", "buy", "order"]):
        answer = "Browse VPS, Dedicated, and Web Hosting plans on the home page or use the Service Hub. After payment, provisioning is usually instant."
    elif any(k in q for k in ["ticket", "support", "help", "contact"]):
        answer = "Open a support ticket from the Support tab or email support@believoo.com. Our team replies within a few hours."
    elif any(k in q for k in ["password", "login", "2fa", "security"]):
        answer = "Change your password and enable 2FA in the Profile and Security tabs. Use an authenticator app like Google Authenticator."
    elif any(k in q for k in ["wallet", "deposit", "balance", "credit"]):
        answer = "Add funds to your wallet from the Wallet tab. Wallet balance can be used to pay invoices and buy services instantly."
    elif any(k in q for k in ["carbon", "green", "co2"]):
        answer = "Your estimated carbon footprint is shown on each server detail. We recommend using efficient VPS plans and only keeping needed servers online."
    return {"reply": answer}


@router.get("/branding")
def public_branding(db: Session = Depends(get_db)):
    from app.models.models import AdminConfig
    configs = {c.key: c.value for c in db.query(AdminConfig).all()}
    return {
        "siteName": configs.get("site_name", "GHC - Go Host Cloud"),
        "companyName": configs.get("company_name", "Believoo Pvt Ltd"),
        "primaryColor": configs.get("primary_color", "#00b7ff"),
        "accentColor": configs.get("accent_color", "#00ff88"),
        "logoUrl": configs.get("logo_url", ""),
        "customCss": configs.get("brand_custom_css", ""),
    }


@router.get("/server/gateways")
def server_gateways(db: Session = Depends(get_db)):
    from app.services.payment_service import get_gateway_config, gateway_ready
    gateways = db.query(GatewayConfig).all()
    if not gateways:
        # Return defaults
        return [
            {"name": "stripe", "isActive": False, "displayName": "Stripe"},
            {"name": "razorpay", "isActive": False, "displayName": "Razorpay"},
            {"name": "cashfree", "isActive": False, "displayName": "Cashfree"},
            {"name": "paypal", "isActive": False, "displayName": "PayPal"},
            {"name": "payu", "isActive": False, "displayName": "PayU"},
            {"name": "wallet", "isActive": True, "displayName": "Wallet"},
        ]
    out = []
    for g in gateways:
        is_wallet = g.name == "wallet"
        is_ready = is_wallet or gateway_ready(get_gateway_config(db, g.name))
        out.append({"name": g.name, "isActive": is_ready, "displayName": g.name.title()})
    return out


@router.get("/server/margins")
def server_margins(db: Session = Depends(get_db)):
    margins = db.query(MarginSetting).all()
    return {m.category.value: m.percent for m in margins}


# ---------- Server / Subscriptions ----------

@router.get("/server")
def list_servers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subs = get_user_subscriptions(db, user.id)
    return [_subscription_to_server(s) for s in subs]


@router.get("/server/{server_id}")
def get_server(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = get_ovh_client_from_db(db)
    server = _subscription_to_server(sub)
    details = get_server_details(ovh, sub)
    server.update(details)
    return server


@router.post("/server/{server_id}/power")
def server_power(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    action = body.get("action")
    if action not in ("reboot", "shutdown", "start"):
        raise HTTPException(status_code=400, detail="Invalid action")
    try:
        ovh = get_ovh_client_from_db(db)
        return perform_power_action(db, ovh, sub, action)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/{server_id}/reinstall")
def server_reinstall(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    os_template = body.get("osTemplate")
    ssh_key_name = (body.get("sshKeyName") or "").strip() or None
    try:
        ovh = get_ovh_client_from_db(db)
        return reinstall_os(db, ovh, sub, os_template, ssh_key_name=ssh_key_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/{server_id}/metrics")
def server_metrics(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    try:
        ovh = get_ovh_client_from_db(db)
    except Exception:
        ovh = None
    if not (sub.monitoring_enabled if sub.monitoring_enabled is not None else True):
        return {"available": False, "source": "none", "reason": "monitoring is disabled for this service",
                "cpu": None, "ram": None, "disk": None, "load": None, "netIn": None, "netOut": None,
                "diskRead": None, "diskWrite": None, "fetchedAt": None}
    try:
        return metrics_service.fetch_live_metrics(db, ovh, sub)
    except Exception as e:
        return {"available": False, "source": "none", "reason": str(e),
                "cpu": None, "ram": None, "disk": None, "load": None, "netIn": None, "netOut": None,
                "diskRead": None, "diskWrite": None, "fetchedAt": None}


@router.get("/server/{server_id}/bandwidth")
def server_bandwidth(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return get_server_bandwidth(ovh, sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/{server_id}/console")
def server_console(server_id: str, client_ip: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    try:
        ovh = get_ovh_client_from_db(db)
        return get_console_url(ovh, sub, client_ip or "0.0.0.0")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/{server_id}/rescue")
def server_rescue(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    try:
        ovh = get_ovh_client_from_db(db)
        # VPS supports rescue via netbootMode (local | rescue)
        if sub.category == ServiceCategory.VPS:
            mode = "local" if body.get("enabled") is False else "rescue"
            result = set_vps_netboot(ovh, sub, mode)
            out = {"success": True, "netbootMode": mode, "task": result}
            if body.get("reboot"):
                try:
                    perform_power_action(db, ovh, sub, "reboot")
                    out["reboot"] = True
                except Exception as e:
                    out["rebootError"] = str(e)
            return out
        if body.get("enabled") is False:
            return set_normal_boot(db, ovh, sub)
        return set_rescue_mode(db, ovh, sub, reboot=bool(body.get("reboot")))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/{server_id}/reverse-dns")
def server_reverse_dns(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
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


# ---------- Billing ----------

@router.post("/coupons/validate")
def validate_coupon_endpoint(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Validate a coupon against a plan+duration and return the discounted price."""
    from app.services.coupon_service import get_coupon, validate_coupon, compute_discount
    from app.services.order_service import _resolve_plan_code
    from app.models.models import PlanDuration
    from app.services.catalog_service import get_margin_for_category
    from app.services.currency_service import convert

    code = (body.get("code") or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="code is required")
    coupon = get_coupon(db, code)
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid coupon code")

    plan = _resolve_plan_code(db, body.get("planCode") or "")
    if not plan:
        raise HTTPException(status_code=400, detail="Plan not found")
    duration = db.query(PlanDuration).filter(
        PlanDuration.plan_code == plan.plan_code,
        PlanDuration.duration_label == body.get("durationLabel"),
    ).first()
    if not duration:
        raise HTTPException(status_code=400, detail="Duration not available")

    final_price = float(apply_margin(Decimal(str(duration.raw_price)), get_margin_for_category(db, plan.category)))
    if plan.override_price is not None:
        final_price = float(plan.override_price)
    elif plan.override_margin is not None:
        final_price = float(apply_margin(Decimal(str(duration.raw_price)), Decimal(str(plan.override_margin))))
    target_currency = (body.get("currency") or duration.currency or "USD").upper()
    rate = convert(db, 1.0, duration.currency or "INR", target_currency)
    price = final_price * rate

    ok, reason = validate_coupon(db, coupon, user.id, price, plan.category.value if hasattr(plan.category, "value") else plan.category)
    if not ok:
        raise HTTPException(status_code=400, detail=reason)
    discount = compute_discount(coupon, price)
    return {
        "valid": True,
        "code": coupon.code,
        "discountType": coupon.discount_type,
        "discountValue": coupon.value,
        "discount": discount,
        "subtotal": round(price, 2),
        "final": round(price - discount, 2),
        "currency": target_currency,
    }


@router.get("/admin/coupons")
def admin_list_coupons(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.models.models import Coupon
    rows = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    return [{
        "id": c.id, "code": c.code, "discountType": c.discount_type, "value": c.value,
        "maxUses": c.max_uses, "usedCount": c.used_count, "perUserLimit": c.per_user_limit,
        "minOrderAmount": c.min_order_amount, "appliesToCategory": c.applies_to_category,
        "expiresAt": c.expires_at.isoformat() if c.expires_at else None, "isActive": c.is_active,
    } for c in rows]


@router.post("/admin/coupons")
def admin_upsert_coupon(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.models.models import Coupon
    code = (body.get("code") or "").strip().upper()
    if not code or len(code) < 3:
        raise HTTPException(status_code=400, detail="code must be at least 3 characters")
    dtype = body.get("discountType") or "percent"
    if dtype not in ("percent", "fixed"):
        raise HTTPException(status_code=400, detail="discountType must be percent or fixed")
    value = float(body.get("value") or 0)
    if value <= 0 or (dtype == "percent" and value > 100):
        raise HTTPException(status_code=400, detail="invalid value")
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        coupon = Coupon(code=code)
        db.add(coupon)
    coupon.discount_type = dtype
    coupon.value = value
    if "maxUses" in body:
        coupon.max_uses = body.get("maxUses")
    if "perUserLimit" in body:
        coupon.per_user_limit = int(body.get("perUserLimit") or 1)
    if "minOrderAmount" in body:
        coupon.min_order_amount = body.get("minOrderAmount")
    if "appliesToCategory" in body:
        coupon.applies_to_category = (body.get("appliesToCategory") or "").upper() or None
    if "expiresAt" in body:
        exp = body.get("expiresAt")
        coupon.expires_at = datetime.fromisoformat(exp) if exp else None
    if "isActive" in body:
        coupon.is_active = bool(body.get("isActive"))
    db.commit()
    return {"success": True, "code": coupon.code}


@router.delete("/admin/coupons/{coupon_id}")
def admin_delete_coupon(coupon_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.models.models import Coupon
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(c)
    db.commit()
    return {"success": True}


@router.post("/billing/order")
def billing_create_order(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        order = create_customer_order(
            db,
            user_id=user.id,
            plan_code=body.get("planCode"),
            duration_label=body.get("durationLabel"),
            config=body.get("configuration"),
            currency=body.get("currency"),
            coupon_code=body.get("couponCode") or body.get("coupon_code"),
        )
        return {
            "id": order.id,
            "planCode": order.plan_code,
            "durationLabel": order.duration_label,
            "category": order.category.value,
            "amount": order.customer_amount,
            "taxAmount": order.tax_amount,
            "taxRate": order.tax_rate,
            "currency": order.currency,
            "status": order.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/billing/wallet/pay")
def billing_wallet_pay(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        order = create_customer_order(
            db,
            user_id=user.id,
            plan_code=body.get("planCode"),
            duration_label=body.get("durationLabel"),
            config=body.get("configuration"),
            currency=body.get("currency"),
            coupon_code=body.get("couponCode") or body.get("coupon_code"),
        )
        order = pay_order_with_wallet(db, user.id, order.id)
        # Auto-provision
        try:
            ovh = get_ovh_client_from_db(db)
            execute_checkout(db, ovh, order.id)
        except Exception as e:
            # Wallet paid, but OVH provisioning failed
            return {
                "order": {"id": order.id, "status": order.status.value},
                "message": "Paid with wallet. OVH provisioning failed: " + str(e),
            }
        db.refresh(order)
        return {
            "order": {"id": order.id, "status": order.status.value},
            "subscription": _subscription_to_server(order.subscription) if order.subscription else None,
            "message": "Paid with wallet and provisioned",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/billing/wallet")
def billing_wallet(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not wallet:
        return {"balance": 0, "currency": "INR"}
    return {"balance": wallet.balance, "currency": wallet.currency}


@router.get("/billing/invoices")
def billing_invoices(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).filter(Invoice.user_id == user.id).order_by(Invoice.created_at.desc()).all()
    return [
        {
            "id": inv.id,
            "orderId": inv.order_id,
            "amount": inv.amount,
            "currency": inv.currency,
            "taxAmount": inv.tax_amount,
            "taxRate": inv.tax_rate,
            "status": inv.status.value,
            "dueDate": inv.due_date.isoformat(),
            "createdAt": inv.created_at.isoformat(),
        }
        for inv in invoices
    ]


@router.get("/billing/invoices/{invoice_id}/pdf")
def billing_invoice_pdf(invoice_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    from app.services.invoice_pdf_service import generate_invoice_pdf
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    order = None
    if invoice.order_id:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == invoice.order_id).first()
    pdf_bytes = generate_invoice_pdf(invoice, user, order)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=invoice-{invoice.id[:8].upper()}.pdf"})


@router.post("/billing/invoices/{invoice_id}/pay")
def pay_invoice(invoice_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.payment_service import create_payment_session
    from app.services.wallet_service import get_or_create_wallet
    from app.services.currency_service import convert
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")
    gateway = (body.get("gateway") or "razorpay").lower()
    if gateway == "wallet":
        wallet = get_or_create_wallet(db, user.id)
        amount = convert(db, invoice.amount, invoice.currency, wallet.currency)
        if wallet.balance < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient wallet balance: {wallet.balance:.2f} {wallet.currency}")
        wallet.balance -= amount
        db.add(WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.PAYMENT,
            amount=-amount,
            description=f"Wallet payment for invoice {invoice.id[:8].upper()}",
            gateway="wallet",
            metadata={"invoice_id": invoice.id, "original_amount": invoice.amount, "original_currency": invoice.currency},
        ))
        invoice.status = InvoiceStatus.PAID
        if invoice.order_id:
            order = db.query(CustomerOrder).filter(CustomerOrder.id == invoice.order_id).first()
            if order:
                order.status = OrderStatus.COMPLETED
        db.commit()
        try:
            from app.services.subscription_service import reactivate_after_invoice_payment
            reactivate_after_invoice_payment(db, invoice)
        except Exception:
            logger.exception(f"Reactivation after invoice {invoice.id} wallet payment failed")
        return {"paid": True, "invoiceId": invoice.id, "message": "Paid from wallet"}
    session = create_payment_session(db, user, invoice.amount, invoice.currency, gateway, "INVOICE_PAYMENT", {"invoice_id": invoice.id})
    return {"paid": False, "checkoutUrl": session.checkout_url, "sessionId": session.id}


# ---------- Payments ----------

@router.post("/payments/checkout")
def payments_checkout(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.payment_service import create_gateway_checkout, create_payment_session
    from app.services.order_service import create_customer_order
    from app.services.wallet_service import get_or_create_wallet
    from app.services.currency_service import convert
    amount = float(body.get("amount", 0))
    gateway = (body.get("gateway") or "razorpay").lower()
    tx_type = body.get("type")
    order_id = None
    order = None
    domain_reg = None
    additional_ip = None
    domain_renewal = None
    if tx_type == "ORDER" and body.get("orderId"):
        # Pay an existing pending order (e.g. a VPS service-option order)
        order = db.query(CustomerOrder).filter(
            CustomerOrder.id == body.get("orderId"),
            CustomerOrder.user_id == user.id,
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status != OrderStatus.PENDING:
            raise HTTPException(status_code=400, detail=f"Order is already {order.status.value}")
        order_id = order.id
        amount = float(order.customer_amount)
    elif tx_type == "ORDER" and body.get("planCode"):
        order = create_customer_order(
            db,
            user_id=user.id,
            plan_code=body.get("planCode"),
            duration_label=body.get("durationLabel"),
            config=body.get("configuration"),
            currency=body.get("currency"),
            coupon_code=body.get("couponCode") or body.get("coupon_code"),
        )
        order_id = order.id
        amount = float(order.customer_amount)
    elif tx_type == "DOMAIN_REGISTRATION" and body.get("domainId"):
        domain_reg = db.query(DomainRegistration).filter(
            DomainRegistration.id == body.get("domainId"),
            DomainRegistration.user_id == user.id,
        ).first()
        if not domain_reg:
            raise HTTPException(status_code=404, detail="Domain registration not found")
        if domain_reg.payment_transaction_id:
            raise HTTPException(status_code=400, detail="Domain already has a payment")
        amount = round(float(domain_reg.price_amount + domain_reg.tax_amount), 2)
    elif tx_type == "ADDITIONAL_IP" and body.get("ipId"):
        additional_ip = db.query(AdditionalIp).filter(AdditionalIp.id == body.get("ipId")).first()
        if not additional_ip:
            raise HTTPException(status_code=404, detail="IP purchase not found")
        if additional_ip.payment_transaction_id:
            raise HTTPException(status_code=400, detail="IP already has a payment")
        amount = round(float(additional_ip.price + additional_ip.tax_amount), 2)
    elif tx_type == "DOMAIN_RENEWAL" and body.get("domainId"):
        domain_renewal = db.query(DomainRegistration).filter(
            DomainRegistration.id == body.get("domainId"),
            DomainRegistration.user_id == user.id,
        ).first()
        if not domain_renewal:
            raise HTTPException(status_code=404, detail="Domain not found")
        if domain_renewal.status != DomainStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Only active domains can be renewed")
        years = int(body.get("years", 1))
        plans = [p for p in db.query(PlanCatalog).filter(
            PlanCatalog.category == ServiceCategory.DOMAINS, PlanCatalog.is_active == True
        ).all() if p.plan_code and p.plan_code.lower() != "ovh"]
        matched = _resolve_domain_plan(f"{domain_renewal.domain_name}.{domain_renewal.tld.lstrip('.')}", plans)
        if not matched:
            raise HTTPException(status_code=400, detail="TLD is not available for renewal")
        tld_code, plan = matched
        target = (body.get("currency") or domain_renewal.currency or get_settings().currency or "USD").upper()
        base_currency = (plan.durations[0].currency if plan.durations else (plan.currency or "INR")).upper()
        base_price = (plan.override_price if plan.override_price is not None else plan.durations[0].final_price) * years
        price = round(convert(db, base_price, base_currency, target), 2)
        tax_rate = get_settings().tax_rate_percent / 100.0
        tax_amount = round(price * tax_rate, 2)
        amount = round(price + tax_amount, 2)
        currency = target
    elif amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    currency = (order.currency if order else (domain_reg.currency if domain_reg else (additional_ip.currency if additional_ip else (domain_renewal.currency if domain_renewal else (body.get("currency") or get_settings().currency or "USD"))))).upper()
    tx = create_payment_session(
        db,
        user_id=user.id,
        amount=amount,
        currency=currency,
        gateway=gateway,
        order_id=order_id,
        metadata={
            "type": tx_type,
            "planCode": body.get("planCode"),
            "durationLabel": body.get("durationLabel"),
            "category": body.get("category"),
            "configuration": body.get("configuration"),
            "domainId": body.get("domainId"),
            "domainName": body.get("domainName"),
            "tld": body.get("tld"),
            "years": body.get("years"),
            "ipId": body.get("ipId"),
            "subscriptionId": body.get("subscriptionId"),
        },
    )
    if tx_type == "DOMAIN_REGISTRATION" and domain_reg:
        domain_reg.payment_transaction_id = tx.id
        db.commit()
    if tx_type == "ADDITIONAL_IP" and additional_ip:
        additional_ip.payment_transaction_id = tx.id
        db.commit()
    # Wallet payment is internal — process immediately without a gateway checkout URL.
    if gateway == "wallet":
        wallet = get_or_create_wallet(db, user.id)
        wallet_amount = convert(db, amount, currency, wallet.currency)
        if wallet.balance < wallet_amount:
            raise HTTPException(status_code=400, detail=f"Insufficient wallet balance: {wallet.balance:.2f} {wallet.currency} < {wallet_amount:.2f} {wallet.currency}")
        wallet.balance -= wallet_amount
        db.add(WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionType.PAYMENT,
            amount=-wallet_amount,
            description=f"Wallet payment for {tx_type}",
            gateway="wallet",
            metadata={"payment_transaction_id": tx.id, "type": tx_type, "original_amount": amount, "original_currency": currency},
        ))
        tx.status = PaymentStatus.COMPLETED
        tx.gateway_transaction_id = f"wallet_{tx.id}"
        db.commit()
        # If linked to a domain, activate it
        if domain_reg and domain_reg.status == DomainStatus.PENDING:
            domain_reg.status = DomainStatus.ACTIVE
            domain_reg.expires_at = datetime.utcnow() + timedelta(days=365 * domain_reg.years)
            db.commit()
        if domain_renewal:
            base = domain_renewal.expires_at if domain_renewal.expires_at and domain_renewal.expires_at > datetime.utcnow() else datetime.utcnow()
            domain_renewal.expires_at = base + timedelta(days=365 * (body.get("years") or domain_renewal.years or 1))
            db.commit()
        if additional_ip and additional_ip.status == "PENDING":
            additional_ip.status = "ACTIVE"
            db.commit()
        if order and order.status == OrderStatus.PENDING:
            order.status = OrderStatus.PAYMENT_RECEIVED
            db.commit()
            try:
                ovh = get_ovh_client_from_db(db)
                execute_checkout(db, ovh, order.id)
            except Exception as e:
                return {"id": tx.id, "amount": tx.amount, "currency": tx.currency, "gateway": tx.gateway, "status": tx.status.value, "paid": True, "message": f"Paid — provisioning pending: {e}"}
        return {"id": tx.id, "amount": tx.amount, "currency": tx.currency, "gateway": tx.gateway, "status": tx.status.value, "paid": True}
    try:
        checkout = create_gateway_checkout(db, tx, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "id": tx.id,
        "amount": tx.amount,
        "currency": tx.currency,
        "gateway": tx.gateway,
        "status": tx.status.value,
        **checkout,
    }


@router.get("/payments/session/{session_id}")
def payments_session(session_id: str, db: Session = Depends(get_db)):
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == session_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")
    checkout = (tx.payment_metadata or {}).get("checkout") or {}
    return {
        "id": tx.id,
        "status": tx.status.value,
        "amount": tx.amount,
        "currency": tx.currency,
        "gateway": tx.gateway,
        "checkout": checkout,
    }


@router.post("/payments/session/{session_id}/fulfill")
def payments_fulfill_session(session_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Manual mark-as-paid — admin only. Real payments must go through gateway verification."""
    from app.services.payment_service import fulfill_payment
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == session_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")
    if tx.status.value == "COMPLETED":
        return {"id": tx.id, "status": tx.status.value, "message": "Already fulfilled"}
    tx = fulfill_payment(db, tx.gateway, tx.gateway_transaction_id, float(tx.amount), {"manual_admin": admin.id})
    return {"id": tx.id, "status": tx.status.value, "message": "Payment fulfilled"}


@router.post("/payments/razorpay/verify")
def razorpay_verify(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.payment_service import verify_razorpay_payment
    tx = verify_razorpay_payment(
        db,
        body.get("razorpay_order_id", ""),
        body.get("razorpay_payment_id", ""),
        body.get("razorpay_signature", ""),
    )
    if not tx or tx.user_id != user.id:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    return {"id": tx.id, "status": tx.status.value, "message": "Payment verified"}


@router.api_route("/payments/paypal/capture", methods=["GET", "POST"])
def paypal_capture(tx: str, token: str, db: Session = Depends(get_db)):
    from fastapi.responses import RedirectResponse
    from app.services.payment_service import verify_paypal_capture
    result = verify_paypal_capture(db, tx, token)
    status = "done" if result and result.status.value == "COMPLETED" else "failed"
    return RedirectResponse(url=f"/payment/?tx={tx}&gateway=paypal&{status}=1")


@router.api_route("/payments/payu/response", methods=["POST"])
async def payu_response(request: Request, db: Session = Depends(get_db)):
    from fastapi.responses import RedirectResponse
    from app.services.payment_service import verify_payu_response
    form = await request.form()
    params = {k: str(v) for k, v in form.items()}
    result = verify_payu_response(db, params)
    txid = params.get("udf1") or params.get("txnid", "")
    status = "done" if result and result.status.value == "COMPLETED" else "failed"
    return RedirectResponse(url=f"/payment/?tx={txid}&gateway=payu&{status}=1", status_code=303)


# ---------- Admin ----------

_SETTINGS_DEFAULTS = {
    "google_login_enabled": "false",
    "email_alerts_enabled": "true",
    "require_email_verification": "false",
    "auto_suspend_enabled": "false",
    "profit_margin_percent": "20",
    "site_name": "BelieVoo",
    "primary_color": "#00f0ff",
    "accent_color": "#b500ff",
}


@router.get("/admin/settings")
def admin_settings(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    configs = {c.key: c.value for c in db.query(AdminConfig).all()}
    merged = {**_SETTINGS_DEFAULTS, **configs}
    return {
        "settings": [{"key": k, "value": v} for k, v in merged.items()],
        "gateways": [{"name": g.name, "isActive": g.is_active, "config": g.config} for g in db.query(GatewayConfig).all()],
        # flat keys for backward compatibility
        **{k: (v == "true" if v in ("true", "false") else v) for k, v in merged.items()},
    }


@router.post("/admin/settings")
def admin_update_settings(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    # Accept both {"key": ..., "value": ...} and plain {key: value} shapes
    items = [(body["key"], body["value"])] if "key" in body and "value" in body and len(body) == 2 else body.items()
    for key, value in items:
        config = db.query(AdminConfig).filter(AdminConfig.key == key).first()
        str_value = str(value).lower() if isinstance(value, bool) else str(value)
        if not config:
            config = AdminConfig(key=key, value=str_value)
            db.add(config)
        else:
            config.value = str_value
    db.commit()
    return {"success": True}


@router.get("/admin/gateways")
def admin_gateways(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    gateways = db.query(GatewayConfig).all()
    if not gateways:
        return [
            {"name": "stripe", "isActive": False},
            {"name": "razorpay", "isActive": False},
            {"name": "cashfree", "isActive": False},
            {"name": "paypal", "isActive": False},
            {"name": "payu", "isActive": False},
        ]
    return [{"name": g.name, "isActive": g.is_active, "config": g.config} for g in gateways]


@router.post("/admin/gateways")
def admin_update_gateway(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    name = body.get("name")
    gateway = db.query(GatewayConfig).filter(GatewayConfig.name == name).first()
    if not gateway:
        gateway = GatewayConfig(name=name)
        db.add(gateway)
    gateway.is_active = body.get("isActive", False)
    if "config" in body:
        gateway.config = body.get("config")
    db.commit()
    return {"success": True}


@router.get("/admin/logs")
def admin_logs(type: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(SystemLog)
    if type:
        query = query.filter(SystemLog.type == type)
    logs = query.order_by(SystemLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "type": l.type.value,
            "message": l.message,
            "details": l.details,
            "createdAt": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.post("/admin/sync-ovh-plans")
def admin_sync_ovh_plans(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.services.catalog_service import sync_all_catalogs
    try:
        provider = get_ovh_client_from_db(db)
        results = sync_all_catalogs(db, provider)
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/sync-provider-plans")
def admin_sync_provider_plans(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return admin_sync_ovh_plans(db, admin)


@router.get("/admin/margins")
def admin_get_margins(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    margins = db.query(MarginSetting).all()
    return {m.category.value: m.percent for m in margins}


@router.post("/admin/margins")
def admin_update_margin(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    category = body.get("category")
    percent = float(body.get("percent", 20))
    try:
        cat = ServiceCategory(category)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category")
    setting = db.query(MarginSetting).filter(MarginSetting.category == cat).first()
    if not setting:
        setting = MarginSetting(category=cat, percent=percent)
        db.add(setting)
    else:
        setting.percent = percent
    db.commit()
    return {"success": True}


@router.get("/admin/plans")
def admin_get_plans(category: Optional[str] = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    cat = None
    if category:
        try:
            cat = ServiceCategory(category)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
    plans = get_active_plans(db, cat)
    return [_plan_to_frontend(p) for p in plans]


@router.post("/admin/plans/{plan_code}/override")
def admin_plan_override(plan_code: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    plan = db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.override_price = body.get("overridePrice")
    plan.override_margin = body.get("overrideMargin")
    db.commit()
    return {"success": True}


@router.get("/admin/subscriptions")
def admin_subscriptions(
    status: Optional[str] = None,
    category: Optional[str] = None,
    userId: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    query = db.query(Subscription)
    if status:
        query = query.filter(Subscription.status == status)
    if category:
        query = query.filter(Subscription.category == category)
    if userId:
        query = query.filter(Subscription.user_id == userId)
    subs = query.order_by(Subscription.created_at.desc()).all()
    return [_subscription_to_server(s) for s in subs]


@router.post("/admin/subscriptions/{subscription_id}/lifecycle")
def admin_subscription_lifecycle(subscription_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    action = body.get("action")
    try:
        ovh = get_ovh_client_from_db(db)
        sub = lifecycle_action(db, ovh, sub, action)
        return _subscription_to_server(sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/orders")
def admin_orders(status: Optional[str] = None, page: int = 1, limit: int = 50, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(CustomerOrder)
    if status:
        query = query.filter(CustomerOrder.status == status)
    total = query.count()
    orders = query.order_by(CustomerOrder.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "orders": [
            {
                "id": o.id,
                "userId": o.user_id,
                "user": {"name": o.user.name, "email": o.user.email} if o.user else None,
                "planCode": o.plan_code,
                "displayName": (o.configuration_payload or {}).get("display_name"),
                "category": o.category.value,
                "currency": o.currency,
                "customerAmount": o.customer_amount,
                "taxAmount": o.tax_amount,
                "taxRate": o.tax_rate,
                "providerBaseAmount": o.ovh_base_amount,
                "commissionAmount": o.commission_amount,
                "status": o.status.value,
                "providerOrderId": o.ovh_order_id,
                "paymentTransactionId": (o.payments[0].id if o.payments else None),
                "paymentGateway": (o.payments[0].gateway if o.payments else None),
                "createdAt": o.created_at.isoformat(),
            }
            for o in orders
        ],
    }


@router.post("/admin/orders/{order_id}/retry-provision")
def admin_retry_provision(order_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    from app.services.ovh_client import get_ovh_client_from_db
    from app.services.order_service import execute_checkout
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        ovh = get_ovh_client_from_db(db)
        execute_checkout(db, ovh, order.id)
        return {"success": True, "orderId": order.id, "status": order.status.value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provisioning retry failed: {str(e)}")


@router.get("/admin/users")
def admin_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role.value,
            "isSuspended": u.is_suspended,
            "phone": u.phone,
            "createdAt": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.post("/admin/users/{user_id}")
def admin_update_user(user_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "role" in body:
        try:
            user.role = UserRole(body["role"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if "isSuspended" in body:
        user.is_suspended = body["isSuspended"]
    if "name" in body:
        user.name = body["name"]
    if "phone" in body:
        user.phone = body["phone"]
    db.commit()
    return {"success": True}


_CREDENTIAL_KEYS = [
    "ovh_endpoint", "ovh_application_key", "ovh_application_secret", "ovh_consumer_key", "ovh_subsidiary",
    "ovh_app_key", "ovh_app_secret",
    "google_client_id", "google_client_secret",
    "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from",
]


@router.get("/admin/credentials")
def admin_credentials(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    configs = {c.key: c.value for c in db.query(AdminConfig).all()}
    credentials = {k: configs.get(k, "") for k in _CREDENTIAL_KEYS}
    # Public-facing aliases for the admin UI (provider-neutral)
    credentials["provider_app_key"] = credentials["ovh_app_key"] or credentials["ovh_application_key"]
    credentials["provider_app_secret"] = credentials["ovh_app_secret"] or credentials["ovh_application_secret"]
    credentials["provider_consumer_key"] = credentials["ovh_consumer_key"]
    credentials["provider_endpoint"] = credentials.get("ovh_endpoint", "ovh-ca")
    credentials["provider_subsidiary"] = credentials.get("ovh_subsidiary", "CA")
    credentials.pop("ovh_app_key", None)
    credentials.pop("ovh_app_secret", None)
    gateways = db.query(GatewayConfig).all()
    return {
        "credentials": credentials,
        "gateways": [{"name": g.name, "isActive": g.is_active, "config": g.config} for g in gateways],
    }


@router.post("/admin/credentials")
def admin_update_credentials(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    def _set(key: str, value):
        config = db.query(AdminConfig).filter(AdminConfig.key == key).first()
        if not config:
            config = AdminConfig(key=key, value=str(value))
            db.add(config)
        else:
            config.value = str(value)

    provider = body.get("provider") or {}
    if "provider_app_key" in provider:
        _set("ovh_application_key", provider["provider_app_key"])
    if "provider_app_secret" in provider:
        _set("ovh_application_secret", provider["provider_app_secret"])
    if "provider_consumer_key" in provider:
        _set("ovh_consumer_key", provider["provider_consumer_key"])
    if "provider_endpoint" in provider:
        _set("ovh_endpoint", provider["provider_endpoint"])
    if "provider_subsidiary" in provider:
        _set("ovh_subsidiary", provider["provider_subsidiary"])
    for section in ("google", "smtp"):
        for key, value in (body.get(section) or {}).items():
            _set(key, value)
    for key in _CREDENTIAL_KEYS:
        if key in body:
            _set(key, body[key])

    for gw in body.get("gateways") or []:
        name = gw.get("name")
        if not name:
            continue
        gateway = db.query(GatewayConfig).filter(GatewayConfig.name == name).first()
        if not gateway:
            gateway = GatewayConfig(name=name)
            db.add(gateway)
        gateway.is_active = bool(gw.get("isActive", False))
        if "config" in gw:
            merged = dict(gateway.config or {})
            merged.update(gw["config"] or {})
            gateway.config = merged
    db.commit()
    return {"success": True}


@router.post("/admin/service-auth")
def admin_service_auth(body: dict, db: Session = Depends(get_db)):
    """Service-to-service admin token bridge for the unified Believoo admin panel."""
    key = body.get("serviceKey")
    if not key:
        raise HTTPException(status_code=400, detail="Missing serviceKey")
    cfg = db.query(AdminConfig).filter(AdminConfig.key == "ghc_admin_service_key").first()
    if not cfg or cfg.value != key:
        raise HTTPException(status_code=403, detail="Invalid service key")
    email = body.get("email") or get_settings().admin_email
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin user not found")
    token = create_access_token({"sub": user.id, "role": "admin"})
    return {"token": token}


@router.get("/admin/brand")
def admin_brand(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    configs = {c.key: c.value for c in db.query(AdminConfig).all()}
    return {
        "siteName": configs.get("site_name", "BelieVoo"),
        "companyName": configs.get("company_name", "Believoo Pvt Ltd"),
        "primaryColor": configs.get("primary_color", "#00f0ff"),
        "accentColor": configs.get("accent_color", "#b500ff"),
        "logoUrl": configs.get("logo_url") or None,
        "faviconUrl": configs.get("favicon_url") or None,
        "customCss": configs.get("brand_custom_css") or "",
    }


@router.post("/admin/brand")
def admin_update_brand(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    mapping = {"siteName": "site_name", "companyName": "company_name", "primaryColor": "primary_color", "accentColor": "accent_color", "logoUrl": "logo_url", "faviconUrl": "favicon_url", "customCss": "brand_custom_css"}
    for src, key in mapping.items():
        if src in body:
            config = db.query(AdminConfig).filter(AdminConfig.key == key).first()
            if not config:
                config = AdminConfig(key=key, value=str(body[src] or ""))
                db.add(config)
            else:
                config.value = str(body[src] or "")
    db.commit()
    return {"success": True}


@router.get("/admin/domain-tlds")
def admin_domain_tlds(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    plans = db.query(PlanCatalog).filter(PlanCatalog.category == ServiceCategory.DOMAINS).all()
    return [
        {
            "tld": p.plan_code,
            "baseCost": p.durations[0].raw_price if p.durations else 0,
            "finalPrice": p.durations[0].final_price if p.durations else 0,
            "marginPercent": p.override_margin if p.override_margin is not None else 20.0,
            "currency": p.currency or (p.durations[0].currency if p.durations else "USD"),
            "isActive": p.is_active,
        }
        for p in plans
    ]


@router.post("/admin/domain-tlds")
def admin_update_domain_tld(body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tld = body.get("tld")
    plan = db.query(PlanCatalog).filter(PlanCatalog.category == ServiceCategory.DOMAINS, PlanCatalog.plan_code == tld).first()
    if not plan:
        raise HTTPException(status_code=404, detail="TLD not found in catalog")
    if "baseCost" in body and body["baseCost"] is not None:
        base_cost = float(body["baseCost"])
        margin = plan.override_margin if plan.override_margin is not None else 20.0
        if "marginPercent" in body and body["marginPercent"] is not None:
            margin = float(body["marginPercent"])
            plan.override_margin = margin
        final_price = round(base_cost * (1 + margin / 100.0), 2)
        plan.override_price = final_price
        plan.override_margin = margin
        # Update the underlying duration so all customer paths see the same price
        if plan.durations:
            plan.durations[0].raw_price = base_cost
            plan.durations[0].final_price = final_price
    if "marginPercent" in body and body["marginPercent"] is not None:
        margin = float(body["marginPercent"])
        plan.override_margin = margin
        base_cost = plan.durations[0].raw_price if plan.durations else (plan.override_price or 0)
        if plan.durations:
            plan.durations[0].final_price = round(base_cost * (1 + margin / 100.0), 2)
            plan.override_price = plan.durations[0].final_price
    if "isActive" in body:
        plan.is_active = bool(body["isActive"])
    db.commit()
    return {"success": True}


@router.post("/admin/servers/{server_id}/override")
def admin_server_override(server_id: str, body: dict, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    sub = db.query(Subscription).filter(Subscription.id == server_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    action = body.get("action")
    try:
        ovh = get_ovh_client_from_db(db)
        sub = lifecycle_action(db, ovh, sub, action)
        return _subscription_to_server(sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_METRIC_RANGES = {"1h": timedelta(hours=1), "24h": timedelta(hours=24), "7d": timedelta(days=7)}


@router.get("/server/{server_id}/metrics/history")
def server_metrics_history(server_id: str, range: str = "24h", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    span = _METRIC_RANGES.get(range, _METRIC_RANGES["24h"])
    since = datetime.utcnow() - span
    rows = (db.query(MetricSample)
            .filter(MetricSample.subscription_id == server_id, MetricSample.sampled_at >= since)
            .order_by(MetricSample.sampled_at.asc()).limit(2000).all())
    # Downsample to ~120 points for chart rendering
    step = max(1, len(rows) // 120) if rows else 1
    return [
        {
            "time": r.sampled_at.isoformat(),
            "cpu": r.cpu, "ram": r.ram, "disk": r.disk, "load": r.load,
            "netIn": r.net_rx, "netOut": r.net_tx,
            "diskRead": r.disk_read, "diskWrite": r.disk_write,
        }
        for r in rows[::step]
    ]


@router.get("/server/{server_id}/uptime")
def server_uptime(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Uptime % from real ping history over 24h / 7d / 30d windows."""
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    out = {"ipAddress": sub.ip_address, "monitoringEnabled": bool(sub.monitoring_enabled if sub.monitoring_enabled is not None else True)}
    for label, span in (("d24", timedelta(hours=24)), ("d7", timedelta(days=7)), ("d30", timedelta(days=30))):
        since = datetime.utcnow() - span
        rows = db.query(ServerPingMetric).filter(
            ServerPingMetric.subscription_id == server_id, ServerPingMetric.checked_at >= since
        ).all()
        total = len(rows)
        if not total:
            out[label] = None
            continue
        up = sum(1 for r in rows if r.status == "UP")
        lat = [r.latency_ms for r in rows if r.latency_ms is not None]
        out[label] = {
            "uptime": round(up / total * 100, 3),
            "checks": total,
            "down": total - up,
            "avgLatencyMs": round(sum(lat) / len(lat), 2) if lat else None,
        }
    return out


@router.put("/server/{server_id}/monitoring")
def toggle_monitoring(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    sub.monitoring_enabled = bool(body.get("enabled", True))
    db.commit()
    return {"monitoringEnabled": sub.monitoring_enabled}


# ---------------- Customer alert rules ----------------

def _alert_rule_dict(r: ServiceAlertRule) -> dict:
    return {
        "id": r.id, "metric": r.metric, "operator": r.operator, "threshold": r.threshold,
        "durationChecks": r.duration_checks, "enabled": r.enabled, "notifyEmail": r.notify_email,
        "lastTriggeredAt": r.last_triggered_at.isoformat() if r.last_triggered_at else None,
        "createdAt": r.created_at.isoformat(),
    }


@router.get("/server/{server_id}/alerts")
def list_alert_rules(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    rules = db.query(ServiceAlertRule).filter(ServiceAlertRule.subscription_id == server_id).order_by(ServiceAlertRule.created_at).all()
    return [_alert_rule_dict(r) for r in rules]


@router.post("/server/{server_id}/alerts")
def create_alert_rule(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    metric = (body.get("metric") or "").lower()
    if metric not in ("cpu", "ram", "disk", "latency", "packet_loss"):
        raise HTTPException(status_code=400, detail="metric must be cpu, ram, disk, latency or packet_loss")
    op = (body.get("operator") or "gt").lower()
    if op not in ("gt", "lt"):
        raise HTTPException(status_code=400, detail="operator must be gt or lt")
    try:
        threshold = float(body.get("threshold"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="threshold must be a number")
    count = db.query(ServiceAlertRule).filter(ServiceAlertRule.subscription_id == server_id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 alert rules per service")
    r = ServiceAlertRule(
        subscription_id=sub.id, user_id=user.id, metric=metric, operator=op,
        threshold=threshold, duration_checks=max(1, int(body.get("durationChecks") or 2)),
        enabled=bool(body.get("enabled", True)), notify_email=bool(body.get("notifyEmail", True)),
    )
    db.add(r)
    db.commit()
    return _alert_rule_dict(r)


@router.put("/server/{server_id}/alerts/{rule_id}")
def update_alert_rule(server_id: str, rule_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(ServiceAlertRule).filter(
        ServiceAlertRule.id == rule_id, ServiceAlertRule.subscription_id == server_id,
        ServiceAlertRule.user_id == user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    if "enabled" in body:
        r.enabled = bool(body["enabled"])
        if not r.enabled:
            r.breach_count = 0
    if "threshold" in body:
        r.threshold = float(body["threshold"])
    if "notifyEmail" in body:
        r.notify_email = bool(body["notifyEmail"])
    if "durationChecks" in body:
        r.duration_checks = max(1, int(body["durationChecks"]))
    db.commit()
    return _alert_rule_dict(r)


@router.delete("/server/{server_id}/alerts/{rule_id}")
def delete_alert_rule(server_id: str, rule_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(ServiceAlertRule).filter(
        ServiceAlertRule.id == rule_id, ServiceAlertRule.subscription_id == server_id,
        ServiceAlertRule.user_id == user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    db.delete(r)
    db.commit()
    return {"ok": True}


@router.get("/server/{server_id}/carbon")
def server_carbon(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    # Estimate based on category and active hours. 1 kWh ≈ 0.4 kg CO2.
    daily_kwh = {"VPS": 0.8, "DEDICATED": 3.0, "WEB_HOSTING": 0.3}.get(sub.category.value, 1.0)
    co2_daily = daily_kwh * 0.4
    co2_monthly = co2_daily * 30
    co2_yearly = co2_daily * 365
    trees_needed = round(co2_yearly / 21, 2)
    return {
        "serverId": server_id,
        "category": sub.category.value,
        "co2DailyKg": round(co2_daily, 2),
        "co2MonthlyKg": round(co2_monthly, 2),
        "co2YearlyKg": round(co2_yearly, 2),
        "treesNeeded": trees_needed,
        "message": "Estimate based on average power draw for this server category. Actual emissions depend on datacenter PUE and regional grid.",
    }


@router.get("/server/{server_id}/additional-ips")
def list_additional_ips(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    return [
        {
            "id": ip.id,
            "ipAddress": ip.ip_address,
            "status": ip.status,
            "price": ip.price,
            "currency": ip.currency,
            "createdAt": ip.created_at.isoformat(),
        }
        for ip in sub.additional_ips
    ]


@router.post("/server/{server_id}/additional-ips")
def purchase_additional_ip(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.currency_service import convert
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    if sub.status.value != "ACTIVE":
        raise HTTPException(status_code=400, detail="Server must be active to add IPs")
    currency = (body.get("currency") or sub.currency or get_settings().currency or "USD").upper()
    base_usd = 3.99
    base_price = round(convert(db, base_usd, "USD", currency), 2)
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(base_price * tax_rate, 2)
    total = round(base_price + tax_amount, 2)
    existing = db.query(AdditionalIp).filter(
        AdditionalIp.subscription_id == sub.id,
        AdditionalIp.status == "PENDING",
        AdditionalIp.currency == currency,
        AdditionalIp.payment_transaction_id.is_(None),
    ).first()
    if existing:
        return {
            "success": True,
            "ip": {
                "id": existing.id,
                "status": existing.status,
                "price": existing.price,
                "taxAmount": existing.tax_amount,
                "totalAmount": round(float(existing.price or 0) + float(existing.tax_amount or 0), 2),
                "currency": existing.currency,
            },
        }
    ip = AdditionalIp(
        subscription_id=sub.id,
        status="PENDING",
        price=base_price,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        currency=currency,
    )
    db.add(ip)
    db.commit()
    db.refresh(ip)
    return {"success": True, "ip": {"id": ip.id, "status": ip.status, "price": ip.price, "taxAmount": ip.tax_amount, "totalAmount": total, "currency": ip.currency}}


@router.get("/server/{server_id}/additional-ips/price")
def get_additional_ip_price(server_id: str, currency: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    if sub.status.value != "ACTIVE":
        raise HTTPException(status_code=400, detail="Server must be active to add IPs")
    from app.services.currency_service import convert
    target = (currency or sub.currency or get_settings().currency or "USD").upper()
    base_usd = 3.99
    base_price = round(convert(db, base_usd, "USD", target), 2)
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(base_price * tax_rate, 2)
    total = round(base_price + tax_amount, 2)
    return {
        "success": True,
        "price": base_price,
        "taxAmount": tax_amount,
        "totalAmount": total,
        "currency": target,
    }


# ---------- VPS management (OVH-style service dashboard) ----------

def _vps_sub_and_client(db: Session, user: User, server_id: str):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    if sub.category != ServiceCategory.VPS:
        raise HTTPException(status_code=400, detail="This section is available for VPS services only")
    return sub, get_ovh_client_from_db(db)


@router.get("/server/{server_id}/vps/overview")
def vps_overview(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_overview(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/disks")
def vps_disks(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_disks(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/backups")
def vps_backups(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_backup(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/snapshot")
def vps_snapshot(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    action = (body.get("action") or "create").lower()
    try:
        if action == "create":
            return {"success": True, "task": create_vps_snapshot(ovh, sub, body.get("description"))}
        if action == "delete":
            return {"success": True, "task": delete_vps_snapshot(ovh, sub)}
        raise HTTPException(status_code=400, detail="action must be 'create' or 'delete'")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/backup/restore")
def vps_backup_restore(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    restore_point = body.get("restorePointId")
    if not restore_point:
        raise HTTPException(status_code=400, detail="restorePointId is required")
    try:
        service_name = sub.service_name or sub.ovh_resource_id
        task = ovh.post(f"/vps/{service_name}/automatedBackup/restore", restorePointId=restore_point, type="full")
        return {"success": True, "task": task}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/secondary-dns")
def vps_secondary_dns_list(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_secondary_dns(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/secondary-dns")
def vps_secondary_dns_update(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    domain = (body.get("domain") or "").strip()
    action = (body.get("action") or "add").lower()
    try:
        if action == "add":
            return {"success": True, "task": add_vps_secondary_dns(ovh, sub, domain)}
        if action == "delete":
            return {"success": True, "task": delete_vps_secondary_dns(ovh, sub, domain)}
        raise HTTPException(status_code=400, detail="action must be 'add' or 'delete'")
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/images")
def vps_images(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_images(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/tasks")
def vps_tasks(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_tasks(ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.put("/server/{server_id}/vps")
def vps_update(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        if body.get("displayName"):
            result = rename_vps(ovh, sub, body["displayName"])
            sub.display_name = body["displayName"].strip()
            db.commit()
            return {"success": True, "task": result}
        if body.get("netbootMode"):
            return {"success": True, "task": set_vps_netboot(ovh, sub, body["netbootMode"])}
        raise HTTPException(status_code=400, detail="Nothing to update — send displayName or netbootMode")
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/password")
def vps_password_reset(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return {"success": True, "task": reset_vps_password(ovh, sub)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/options")
def vps_option_catalog(server_id: str, currency: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return get_vps_option_catalog(db, ovh, sub, currency)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/options/order")
def vps_option_order(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    kind = (body.get("kind") or "").strip()
    try:
        order = create_service_option_order(
            db, ovh, user.id, sub, kind,
            {
                "planCode": body.get("planCode"),
                "size": body.get("size"),
                "duration": body.get("duration"),
            },
            currency=body.get("currency"),
        )
        return {
            "success": True,
            "order": {
                "id": order.id,
                "kind": kind,
                "label": (order.configuration_payload or {}).get("display_name"),
                "amount": order.customer_amount,
                "taxAmount": order.tax_amount,
                "currency": order.currency,
                "status": order.status.value,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/vps/ip-countries")
def vps_ip_countries(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    try:
        return {"countries": get_vps_ip_countries(ovh, sub)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/vps/ip-geolocation")
def vps_ip_geolocation(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub, ovh = _vps_sub_and_client(db, user, server_id)
    ip_address = (body.get("ipAddress") or "").strip()
    country = (body.get("country") or "").strip()
    if not ip_address or not country:
        raise HTTPException(status_code=400, detail="ipAddress and country are required")
    try:
        return {"success": True, "result": change_vps_ip_geolocation(ovh, sub, ip_address, country)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/auto-renew")
def server_auto_renew(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = get_ovh_client_from_db(db)
    enabled = bool(body.get("enabled"))
    try:
        return set_service_auto_renew(db, ovh, sub, enabled)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.post("/server/{server_id}/cancel")
def server_cancel(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    if not body.get("confirm"):
        raise HTTPException(status_code=400, detail="Termination must be confirmed")
    ovh = get_ovh_client_from_db(db)
    try:
        return request_service_termination(db, ovh, sub)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OVH API error: {e}")


@router.get("/server/{server_id}/ping")
def server_ping_latest(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    _ping_server(db, sub)
    latest = db.query(ServerPingMetric).filter(ServerPingMetric.subscription_id == server_id).order_by(ServerPingMetric.checked_at.desc()).first()
    if not latest:
        return {"status": "UNKNOWN", "latencyMs": None, "packetLoss": 0, "checkedAt": None, "ipAddress": sub.ip_address}
    return {
        "status": latest.status,
        "latencyMs": round(latest.latency_ms, 2) if latest.latency_ms else None,
        "packetLoss": round(latest.packet_loss, 2),
        "checkedAt": latest.checked_at.isoformat(),
        "ipAddress": latest.ip_address,
    }


@router.get("/server/{server_id}/ping/history")
def server_ping_history(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    rows = db.query(ServerPingMetric).filter(ServerPingMetric.subscription_id == server_id).order_by(ServerPingMetric.checked_at.desc()).limit(100).all()
    return [
        {
            "time": r.checked_at.strftime("%H:%M"),
            "latencyMs": round(r.latency_ms, 2) if r.latency_ms else None,
            "packetLoss": round(r.packet_loss, 2),
            "status": r.status,
            "ipAddress": r.ip_address,
        }
        for r in rows
    ]


def _ping_server(db: Session, sub: Subscription):
    import subprocess
    ip = sub.ip_address
    if not ip:
        metric = ServerPingMetric(subscription_id=sub.id, ip_address=None, latency_ms=None, packet_loss=0.0, status="UNKNOWN", details={"reason": "no ip"})
        db.add(metric)
        db.commit()
        return metric
    try:
        proc = subprocess.run(["ping", "-c", "1", "-W", "2", ip], capture_output=True, text=True, timeout=4)
        if proc.returncode == 0:
            # parse time=0.123 ms or time=0.123ms
            import re
            m = re.search(r"time=([0-9.]+)\s*ms", proc.stdout)
            latency = float(m.group(1)) if m else None
            metric = ServerPingMetric(subscription_id=sub.id, ip_address=ip, latency_ms=latency, packet_loss=0.0, status="UP", details={"output": proc.stdout[:500]})
        else:
            metric = ServerPingMetric(subscription_id=sub.id, ip_address=ip, latency_ms=None, packet_loss=1.0, status="DOWN", details={"output": proc.stdout[:500], "error": proc.stderr[:500]})
    except Exception as e:
        metric = ServerPingMetric(subscription_id=sub.id, ip_address=ip, latency_ms=None, packet_loss=1.0, status="TIMEOUT", details={"error": str(e)})
    db.add(metric)
    db.commit()
    return metric


# ==================== SSH KEYS (account-level, OVH /me/sshKey) ====================

def _ssh_fingerprint(public_key: str) -> str:
    """SHA256 fingerprint of an OpenSSH public key (same format as `ssh-keygen -l`)."""
    import base64, hashlib
    try:
        blob = base64.b64decode(public_key.split()[1].encode())
        return "SHA256:" + base64.b64encode(hashlib.sha256(blob).digest()).decode().rstrip("=")
    except Exception:
        return ""


def _validate_pubkey(key: str) -> str:
    key = (key or "").strip()
    parts = key.split()
    if len(parts) < 2 or not parts[0].startswith(("ssh-", "ecdsa-", "sk-")):
        raise HTTPException(status_code=400, detail="Invalid public key — paste the full `ssh-rsa AAAA…` / `ssh-ed25519 AAAA…` line")
    import base64
    try:
        base64.b64decode(parts[1].encode(), validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid public key encoding")
    return " ".join(parts[:2])


@router.get("/account/ssh-keys")
def list_ssh_keys(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Account-level SSH keys synced with OVH `/me/sshKey` — usable on dedicated
    installs (sshKeyName) and VPS reinstalls (publicSshKey)."""
    try:
        ovh = get_ovh_client_from_db(db)
        out = []
        for name in ovh.get("/me/sshKey") or []:
            try:
                k = ovh.get(f"/me/sshKey/{name}")
                out.append({
                    "name": k.get("keyName") or name,
                    "key": k.get("key"),
                    "default": bool(k.get("default")),
                    "fingerprint": _ssh_fingerprint(k.get("key") or ""),
                })
            except Exception:
                out.append({"name": name})
        return {"keys": out}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/account/ssh-keys")
def create_ssh_key(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    name = (body.get("name") or "").strip()
    if not name or len(name) > 128 or not all(c.isalnum() or c in "-_." for c in name):
        raise HTTPException(status_code=400, detail="Key name must be 1-128 chars (letters, digits, -_.)")
    key = _validate_pubkey(body.get("key") or "")
    try:
        ovh = get_ovh_client_from_db(db)
        res = ovh.post("/me/sshKey", keyName=name, key=key)
        return {"success": True, "key": res, "fingerprint": _ssh_fingerprint(key)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/account/ssh-keys/{name}")
def delete_ssh_key(name: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        ovh = get_ovh_client_from_db(db)
        ovh.delete(f"/me/sshKey/{name}")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DOMAIN: info / lock / authinfo / glue / transfer ====================

@router.get("/server/domains/{domain}/info")
def domain_info(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Live registry-side info: expiry, transfer lock, DNSSEC, whois, name servers."""
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        info = ovh.get(f"/domain/{domain}") or {}
        return {
            "domain": domain,
            "status": info.get("state") or info.get("status"),
            "expirationDate": info.get("expirationDate") or info.get("lastUpdate"),
            "transferLockStatus": info.get("transferLockStatus"),
            "nameServerType": info.get("nameServerType"),
            "whoisOwner": info.get("whoisOwner"),
            "dnssecSupported": info.get("dnssecSupported"),
            "owoSupported": info.get("owoSupported"),  # whois privacy available
            "suspensionState": info.get("suspensionState"),
            "renewalState": info.get("renewalState"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/server/domains/{domain}/lock")
def set_domain_lock(domain: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Toggle the registry transfer lock (clientTransferProhibited)."""
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    locked = bool(body.get("locked", True))
    try:
        ovh = get_ovh_client_from_db(db)
        ovh.put(f"/domain/{domain}", transferLockStatus="locked" if locked else "unlocked")
        return {"success": True, "transferLockStatus": "locked" if locked else "unlocked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/domains/{domain}/authinfo")
def request_authinfo(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Request the EPP/auth code — OVH emails it to the registrant contact."""
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        res = ovh.post(f"/domain/{domain}/authInfo")
        return {"success": True, "task": res, "message": "Transfer code sent to the registrant email address"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/domains/{domain}/glue")
def list_glue_records(domain: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Glue records (registered host objects) — needed when the domain's own
    nameservers are subdomains of itself, e.g. ns1.<domain>."""
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        out = []
        for host in ovh.get(f"/domain/{domain}/glueRecord") or []:
            try:
                d = ovh.get(f"/domain/{domain}/glueRecord/{host}")
                out.append({"host": host, "ips": d.get("ips") or []})
            except Exception:
                out.append({"host": host, "ips": []})
        return {"domain": domain, "glueRecords": out}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/domains/{domain}/glue")
def create_glue_record(domain: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    host = (body.get("host") or "").strip().lower()
    ips = [ip.strip() for ip in (body.get("ips") or []) if ip.strip()]
    import re, ipaddress
    if not host.endswith("." + domain) and not re.fullmatch(r"[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?", host):
        raise HTTPException(status_code=400, detail="host must be a hostname like ns1 (usually under your own domain)")
    if not ips:
        raise HTTPException(status_code=400, detail="at least one IP is required")
    for ip in ips:
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"invalid IP: {ip}")
    # OVH expects the bare host prefix relative to the domain
    host_name = host[: -(len(domain) + 1)] if host.endswith("." + domain) else host
    try:
        ovh = get_ovh_client_from_db(db)
        res = ovh.post(f"/domain/{domain}/glueRecord", host=host_name, ips=ips)
        return {"success": True, "task": res}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/domains/{domain}/glue/{host}")
def delete_glue_record(domain: str, host: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    domain = (domain or "").strip().lower()
    host = host.strip().lower()
    if not _verify_domain_owner(db, user.id, domain):
        raise HTTPException(status_code=404, detail="Domain not found")
    try:
        ovh = get_ovh_client_from_db(db)
        res = ovh.delete(f"/domain/{domain}/glueRecord/{host}")
        return {"success": True, "task": res}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/server/domains/transfer")
def transfer_domain(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Transfer-in: same pricing/idempotency pipeline as registration, but the
    domain must already exist elsewhere and carries an auth/EPP code."""
    from app.models.models import DomainRegistration, DomainStatus, PaymentStatus
    from app.services.currency_service import convert
    from datetime import datetime, timedelta
    years = 1  # transfers always extend by 1 year at most registries
    domain_name = (body.get("domainName") or "").strip().lower()
    auth_code = (body.get("authCode") or "").strip()
    if not domain_name or "." not in domain_name:
        raise HTTPException(status_code=400, detail="Enter a full domain like example.com")
    if not auth_code:
        raise HTTPException(status_code=400, detail="Auth/EPP code is required for transfers")
    if domain_name.startswith("*") or " " in domain_name:
        raise HTTPException(status_code=400, detail="Invalid domain name")
    tld = "." + domain_name.split(".", 1)[1]
    from app.models.models import PlanCatalog
    plans = [p for p in db.query(PlanCatalog).filter(
        PlanCatalog.category == ServiceCategory.DOMAINS, PlanCatalog.is_active == True
    ).all() if p.plan_code and p.plan_code.lower() != "ovh"]
    matched = _resolve_domain_plan(domain_name, plans)
    if not matched:
        raise HTTPException(status_code=400, detail="This extension cannot be transferred here")
    tld_code, plan = matched
    tld = "." + tld_code
    if tld == ".ovh":
        raise HTTPException(status_code=400, detail="This extension is not available")
    target = (body.get("currency") or get_settings().currency or "USD").upper()
    base_currency = (plan.durations[0].currency if plan.durations and plan.durations[0].currency else (plan.currency or "INR")).upper()
    base_price = (plan.override_price if plan.override_price is not None else plan.durations[0].final_price)
    if base_price <= 0:
        raise HTTPException(status_code=400, detail="Transfer pricing not available for this TLD")
    price = round(convert(db, base_price, base_currency, target), 2)
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(price * tax_rate, 2)
    total = round(price + tax_amount, 2)
    payment_tx_id = body.get("paymentTransactionId")
    name = domain_name.split(".", 1)[0]
    existing = db.query(DomainRegistration).filter(
        DomainRegistration.user_id == user.id,
        DomainRegistration.domain_name == name,
        DomainRegistration.tld == tld,
        DomainRegistration.is_transfer == True,  # noqa: E712
        DomainRegistration.status == DomainStatus.PENDING,
        DomainRegistration.payment_transaction_id.is_(None),
    ).first()
    if existing and not payment_tx_id:
        existing.transfer_auth_code = auth_code
        db.commit()
        return {
            "success": True, "domainId": existing.id, "priceAmount": existing.price_amount,
            "taxAmount": existing.tax_amount,
            "totalAmount": round(float(existing.price_amount or 0) + float(existing.tax_amount or 0), 2),
            "currency": existing.currency, "status": existing.status.value, "transfer": True,
        }
    status = DomainStatus.PENDING
    if payment_tx_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_tx_id, PaymentTransaction.user_id == user.id).first()
        if not tx:
            raise HTTPException(status_code=400, detail="Payment transaction not found")
        if round(float(tx.amount), 2) != total:
            raise HTTPException(status_code=400, detail="Payment amount does not match transfer total")
        if (tx.currency or "USD").upper() != target:
            raise HTTPException(status_code=400, detail="Payment currency does not match")
        if tx.status != PaymentStatus.COMPLETED and tx.status != PaymentStatus.PENDING:
            raise HTTPException(status_code=400, detail="Payment is not in a valid state")
    reg = DomainRegistration(
        user_id=user.id,
        domain_name=name,
        tld=tld,
        years=years,
        status=status,
        expires_at=datetime.utcnow() + timedelta(days=365),
        price_amount=price,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        currency=target,
        payment_transaction_id=payment_tx_id,
        is_transfer=True,
        transfer_auth_code=auth_code,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    if payment_tx_id:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_tx_id).first()
        if tx:
            meta = tx.payment_metadata or {}
            meta["domain_registration_id"] = reg.id
            meta["domain_transfer"] = True
            tx.payment_metadata = meta
            db.commit()
    return {"success": True, "domainId": reg.id, "priceAmount": price, "taxAmount": tax_amount,
            "totalAmount": total, "currency": reg.currency, "status": reg.status.value, "transfer": True}
