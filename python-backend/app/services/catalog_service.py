import json
import logging
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.models import AdminConfig, MarginSetting, PlanCatalog, PlanDuration, ServiceCategory
from app.services.ovh_client import OvhClient, apply_margin, ovh_price_to_decimal

logger = logging.getLogger(__name__)


CATALOG_REGISTRY = [
    {
        "category": ServiceCategory.VPS,
        "endpoint": "vps",
        "family": "vps",
        "default_filter": lambda p: bool(re.match(r"^vps-", p.get("planCode", ""))) and not any(x in p.get("planCode", "") for x in ["degressivity", "10percent", "2024", "2025"]),
    },
    {
        "category": ServiceCategory.DEDICATED,
        "endpoint": "baremetalServers",
        "family": "dedicated",
        "default_filter": lambda p: bool(p.get("planCode")),
    },
    {
        "category": ServiceCategory.WEB_HOSTING,
        "endpoint": "webHosting",
        "family": "webHosting",
        "default_filter": lambda p: True,
    },
    # License, IP and CDN are not exposed as public catalog endpoints for this
    # OVH account/subsidiary; they are available as server add-ons instead.
    {
        "category": ServiceCategory.PUBLIC_CLOUD,
        "endpoint": "cloud",
        "family": "cloud",
        "default_filter": lambda p: True,
        "optional": True,
    },
    {
        "category": ServiceCategory.PRIVATE_CLOUD,
        "endpoint": "privateCloud",
        "family": "privateCloud",
        "default_filter": lambda p: True,
        # Dedicated host SKUs (pcc-host-*) carry the real pricing; the base
        # private_cloud service pack is free. Beta hosts are skipped.
        "addon_filter": lambda a: str(a.get("planCode") or "").startswith("pcc-host-") and "ocpbeta" not in str(a.get("planCode") or ""),
        "optional": True,
    },
    {
        "category": ServiceCategory.DOMAINS,
        "endpoint": "domain",
        "family": "domain",
        "default_filter": lambda p: True,
        "optional": True,
    },
]


# ---------- Helpers ----------

def _coerce_int(val: Any) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(re.sub(r"\D", "", str(val)))
    except (ValueError, TypeError):
        return None


def _find_feature(features: List[Dict[str, Any]], names: List[str]) -> Any:
    if not isinstance(features, list):
        return None
    for name in names:
        for feat in features:
            if feat and isinstance(feat, dict) and feat.get("name") and name.lower() in str(feat["name"]).lower():
                return feat.get("value")
    return None


def _first_disk_capacity(disks: List[Any]) -> Optional[Any]:
    if disks and isinstance(disks, list) and isinstance(disks[0], dict):
        return disks[0].get("capacity") or disks[0].get("size")
    return None


def _first_disk_tech(disks: List[Any]) -> Optional[str]:
    if disks and isinstance(disks, list) and isinstance(disks[0], dict):
        return disks[0].get("technology")
    return None


def _extract_specs(product: Dict[str, Any], plan: Dict[str, Any], category: ServiceCategory) -> Dict[str, Any]:
    """Extract technical specs from OVH catalog blobs."""
    prod_blobs = product.get("blobs", {}) or {}
    plan_blobs = plan.get("blobs", {}) or {}
    if not isinstance(prod_blobs, dict):
        prod_blobs = {}
    if not isinstance(plan_blobs, dict):
        plan_blobs = {}
    tech = prod_blobs.get("technical") or plan_blobs.get("technical") or {}
    commercial = prod_blobs.get("commercial") or plan_blobs.get("commercial") or {}
    features = commercial.get("features", []) if isinstance(commercial, dict) else []
    meta = prod_blobs.get("meta") or plan_blobs.get("meta") or {}
    if not isinstance(tech, dict):
        tech = {}
    if not isinstance(meta, dict):
        meta = {}

    if category == ServiceCategory.DEDICATED:
        cpu = (
            _find_feature(features, ["cpu_cores", "cpu", "processor", "cores"])
            or tech.get("cpu", {}).get("cores")
            or tech.get("cpu", {}).get("number")
            or product.get("cpu", {}).get("cores")
            or plan.get("cpu", {}).get("cores")
        )
        ram = (
            _find_feature(features, ["ram", "memory", "ddr", "gb_ram"])
            or tech.get("memory", {}).get("size")
            or product.get("memory", {}).get("size")
            or plan.get("memory", {}).get("size")
        )
        disk = (
            _find_feature(features, ["storage", "disk", "hdd", "ssd", "nvme"])
            or _first_disk_capacity(tech.get("storage", {}).get("disks", []))
            or _first_disk_capacity(product.get("storage", {}).get("disks", []))
            or _first_disk_capacity(plan.get("storage", {}).get("disks", []))
        )
        disk_type = (
            _find_feature(features, ["disk_type", "technology", "storage_type"])
            or _first_disk_tech(tech.get("storage", {}).get("disks", []))
        )
        bw = (
            _find_feature(features, ["bandwidth", "traffic", "connection"])
            or tech.get("network", {}).get("public", {}).get("bandwidth")
            or tech.get("bandwidth", {}).get("level")
            or product.get("bandwidth", {}).get("level")
            or plan.get("bandwidth", {}).get("level")
        )
    else:
        cpu = (
            tech.get("cpu", {}).get("cores")
            or product.get("cpu", {}).get("cores")
            or plan.get("cpu", {}).get("cores")
            or _find_feature(features, ["cpu", "cores", "vcpu"])
        )
        ram = (
            tech.get("memory", {}).get("size")
            or product.get("memory", {}).get("size")
            or plan.get("memory", {}).get("size")
            or _find_feature(features, ["ram", "memory", "ddr"])
        )
        disk = (
            _first_disk_capacity(tech.get("storage", {}).get("disks", []))
            or _first_disk_capacity(product.get("storage", {}).get("disks", []))
            or _first_disk_capacity(plan.get("storage", {}).get("disks", []))
            or _find_feature(features, ["storage", "disk", "ssd"])
        )
        disk_type = _first_disk_tech(tech.get("storage", {}).get("disks", []))
        tech_network = tech.get("network") if isinstance(tech.get("network"), dict) else {}
        tech_bw = tech.get("bandwidth") if isinstance(tech.get("bandwidth"), dict) else {}
        bw = (
            tech_network.get("public", {}).get("bandwidth")
            or tech_bw.get("level")
            or (product.get("bandwidth") or {}).get("level")
            or (plan.get("bandwidth") or {}).get("level")
            or _find_feature(features, ["bandwidth", "traffic"])
        )

    description = (
        product.get("description")
        or meta.get("description")
        or commercial.get("name")
        or product.get("name")
        or plan.get("description")
        or plan.get("invoiceName")
    )

    return {
        "cpu_cores": _coerce_int(cpu),
        "ram_gb": _coerce_int(ram),
        "disk_gb": _coerce_int(disk),
        "disk_type": disk_type,
        "bandwidth_mbps": _coerce_int(bw),
        "description": description,
    }


def _pcc_host_family(plan_code: str) -> Optional[str]:
    """Map pcc-host-* SKUs to a storefront range (Essentials, Premier, SDDC...)."""
    code = plan_code.lower()
    if "-vsphere-ess" in code:
        return "essentials"
    if "-premier-" in code:
        return "premier"
    if "-sddc" in code:
        return "sddc"
    if "-cdi" in code:
        return "cdi"
    if "-sto" in code:
        return "storage"
    if "-gp" in code:
        return "general"
    return None


def _pcc_host_specs(plan_code: str, invoice_name: str) -> Dict[str, Any]:
    """Derive cores/RAM from host SKU codes like gp5-48x1536, ess64, pre192."""
    specs: Dict[str, Any] = {}
    match = re.search(r"(\d+)x(\d+)", plan_code)
    if match:
        specs["cpu_cores"] = int(match.group(1))
        specs["ram_gb"] = int(match.group(2))
        return specs
    for pattern in (r"-ess(\d+)", r"-pre(\d+)", r"sddc-\d+-sddc-(\d+)", r"sddc(\d+)"):
        match = re.search(pattern, plan_code)
        if match:
            specs["ram_gb"] = int(match.group(1))
            return specs
    match = re.search(r"(\d+)\s*GB", invoice_name or "", re.IGNORECASE)
    if match:
        specs["ram_gb"] = int(match.group(1))
    return specs


def _parse_duration(duration_iso: str) -> Tuple[int, str]:
    """Parse OVH duration like P1M, P1Y, P3M -> (interval, unit)."""
    match = re.match(r"P(\d+)(M|Y)", duration_iso)
    if not match:
        return 1, "month"
    interval = int(match.group(1))
    unit = "year" if match.group(2) == "Y" else "month"
    return interval, unit


def _duration_label(interval: int, unit: str) -> str:
    return f"{interval}_{unit}"


# ---------- Sync ----------

def get_margin_for_category(db: Session, category: ServiceCategory) -> Decimal:
    setting = db.query(MarginSetting).filter(MarginSetting.category == category).first()
    if setting:
        return Decimal(str(setting.percent))
    return Decimal("20.0")


COMMITMENT_MONTHS = (3, 6, 12)
DEFAULT_COMMITMENT_DISCOUNTS = {"3_month": 0.0, "6_month": 5.0, "12_month": 10.0}


def _commitment_discounts(db: Session) -> Dict[str, float]:
    """Commitment discounts (% off the monthly rate) per duration label.

    Overridable via admin_configs key `commitment_discounts` (JSON object).
    """
    try:
        row = db.query(AdminConfig).filter(AdminConfig.key == "commitment_discounts").first()
        if row and row.value:
            data = json.loads(row.value)
            return {**DEFAULT_COMMITMENT_DISCOUNTS, **{k: float(v) for k, v in data.items()}}
    except Exception:
        pass
    return dict(DEFAULT_COMMITMENT_DISCOUNTS)


def _derive_commitment_durations(db: Session, plan_code: str, provided_labels: set, discounts: Dict[str, float]) -> None:
    """Create/update multi-month commitment durations OVH doesn't offer natively.

    Several catalog plans (e.g. the VPS 2027 range) only expose P1M pricing
    upstream. Customers can still prepay for 3/6/12 months — OVH is billed
    monthly upstream — so these rows are derived from the monthly price.
    """
    monthly = db.query(PlanDuration).filter(
        PlanDuration.plan_code == plan_code,
        PlanDuration.duration_label == "1_month",
    ).first()
    if not monthly or not monthly.final_price:
        return
    for months in COMMITMENT_MONTHS:
        label = f"{months}_month"
        if label in provided_labels:
            continue
        discount = Decimal(str(discounts.get(label, 0))) / Decimal("100")
        raw_price = (Decimal(str(monthly.raw_price)) * months).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        final_price = (Decimal(str(monthly.final_price)) * months * (1 - discount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        duration = db.query(PlanDuration).filter(
            PlanDuration.plan_code == plan_code,
            PlanDuration.duration_label == label,
        ).first()
        if duration:
            duration.raw_price = float(raw_price)
            duration.final_price = float(final_price)
            duration.interval = months
            duration.interval_unit = "month"
            duration.currency = monthly.currency
        else:
            db.add(PlanDuration(
                plan_code=plan_code,
                duration_label=label,
                interval=months,
                interval_unit="month",
                raw_price=float(raw_price),
                final_price=float(final_price),
                currency=monthly.currency,
            ))


def sync_category(db: Session, ovh: OvhClient, registry: Dict[str, Any]) -> Tuple[int, int, Optional[str]]:
    category = registry["category"]
    endpoint = registry["endpoint"]
    family = registry["family"]
    plan_filter = registry.get("default_filter", lambda p: True)
    optional = registry.get("optional", False)

    settings = get_settings()
    margin = get_margin_for_category(db, category)
    discounts = _commitment_discounts(db)
    synced = 0
    errors = 0

    # Mark existing plans in this category inactive first; reactivate as we sync
    db.query(PlanCatalog).filter(PlanCatalog.category == category).update({"is_active": False})
    db.commit()

    try:
        catalog = ovh.get_public_catalog(endpoint)
    except Exception as e:
        logger.warning(f"Could not fetch catalog {endpoint}: {e}")
        if not optional:
            raise
        return 0, 1, str(e)

    products = catalog.get("products", []) or []
    plans = catalog.get("plans", []) or []
    product_map = {p.get("name"): p for p in products if p.get("name")}

    addon_filter = registry.get("addon_filter")
    items: List[Dict[str, Any]] = [p for p in plans if plan_filter(p)]
    if addon_filter:
        items += [a for a in (catalog.get("addons") or []) if addon_filter(a)]

    for plan in items:
        try:
            plan_code = plan.get("planCode")
            if not plan_code:
                continue

            product = product_map.get(plan.get("product") or plan_code, {})
            specs = _extract_specs(product, plan, category)
            invoice_name = plan.get("invoiceName") or plan.get("planCode") or ""
            if category == ServiceCategory.PRIVATE_CLOUD and plan_code.startswith("pcc-host-"):
                specs = {**_pcc_host_specs(plan_code, invoice_name), **{k: v for k, v in specs.items() if v}}
            plan_family = _pcc_host_family(plan_code) if category == ServiceCategory.PRIVATE_CLOUD else None

            # Detect currency from first pricing with formattedPrice before using it
            plan_currency = settings.currency or "CAD"
            for pricing in (plan.get("pricings", []) or plan.get("prices", [])):
                if pricing.get("formattedPrice"):
                    text = str(pricing.get("formattedPrice", ""))
                    if "₹" in text:
                        plan_currency = "INR"
                    elif "€" in text:
                        plan_currency = "EUR"
                    elif "£" in text:
                        plan_currency = "GBP"
                    elif "$" in text:
                        plan_currency = "USD" if settings.ovh_subsidiary == "US" else (settings.currency or "CAD")
                    match = re.search(r"([A-Z]{3})", text)
                    if match and match.group(1) in ("USD", "CAD", "EUR", "GBP", "INR", "AUD", "SGD"):
                        plan_currency = match.group(1)
                    break

            # Upsert plan catalog
            existing = db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code).first()
            if existing:
                existing.invoice_name = invoice_name
                existing.description = specs.get("description")
                existing.family = plan_family or family
                existing.category = category
                existing.cpu_cores = specs.get("cpu_cores")
                existing.ram_gb = specs.get("ram_gb")
                existing.disk_gb = specs.get("disk_gb")
                existing.disk_type = specs.get("disk_type")
                existing.bandwidth_mbps = specs.get("bandwidth_mbps")
                existing.catalog_metadata = plan
                existing.is_active = True
            else:
                existing = PlanCatalog(
                    plan_code=plan_code,
                    invoice_name=invoice_name,
                    description=specs.get("description"),
                    category=category,
                    family=plan_family or family,
                    cpu_cores=specs.get("cpu_cores"),
                    ram_gb=specs.get("ram_gb"),
                    disk_gb=specs.get("disk_gb"),
                    disk_type=specs.get("disk_type"),
                    bandwidth_mbps=specs.get("bandwidth_mbps"),
                    catalog_metadata=plan,
                    currency=plan_currency,
                )
                db.add(existing)
            db.flush()

            existing.currency = plan_currency

            # Sync durations/prices - OVH uses "pricings" array
            seen_durations = {}
            pricings = plan.get("pricings", []) or plan.get("prices", [])
            for pricing in pricings:
                interval = pricing.get("interval")
                interval_unit = pricing.get("intervalUnit")
                if not interval or not interval_unit or interval_unit.lower() == "none":
                    continue
                label = _duration_label(interval, interval_unit)
                if label in seen_durations:
                    continue
                seen_durations[label] = True

                raw_price = ovh_price_to_decimal(pricing)
                final_price = apply_margin(raw_price, margin)
                currency = plan_currency
                if pricing.get("formattedPrice"):
                    text = str(pricing.get("formattedPrice", ""))
                    # Map currency symbols to ISO codes
                    if "₹" in text:
                        currency = "INR"
                    elif "€" in text:
                        currency = "EUR"
                    elif "£" in text:
                        currency = "GBP"
                    elif "$" in text:
                        currency = "USD" if settings.ovh_subsidiary == "US" else (settings.currency or "CAD")
                    # Also try ISO code in text
                    match = re.search(r"([A-Z]{3})", text)
                    if match and match.group(1) in ("USD", "CAD", "EUR", "GBP", "INR", "AUD", "SGD"):
                        currency = match.group(1)

                duration = db.query(PlanDuration).filter(
                    PlanDuration.plan_code == plan_code,
                    PlanDuration.duration_label == label,
                ).first()
                if duration:
                    duration.raw_price = float(raw_price)
                    duration.final_price = float(final_price)
                    duration.interval = interval
                    duration.interval_unit = interval_unit
                    duration.currency = currency
                else:
                    db.add(PlanDuration(
                        plan_code=plan_code,
                        duration_label=label,
                        interval=interval,
                        interval_unit=interval_unit,
                        raw_price=float(raw_price),
                        final_price=float(final_price),
                        currency=currency,
                    ))
            _derive_commitment_durations(db, plan_code, seen_durations, discounts)
            db.flush()
            synced += 1
        except Exception as e:
            logger.warning(f"Failed to sync plan {plan.get('planCode')} in {category}: {e}")
            errors += 1

    db.commit()
    return synced, errors, None


def sync_all_catalogs(db: Session, ovh: OvhClient) -> List[Dict[str, Any]]:
    results = []
    for registry in CATALOG_REGISTRY:
        synced, errors, message = sync_category(db, ovh, registry)
        results.append({
            "category": registry["category"].value,
            "endpoint": registry["endpoint"],
            "synced": synced,
            "errors": errors,
            "message": message,
        })
    return results


def get_active_plans(db: Session, category: Optional[ServiceCategory] = None) -> List[PlanCatalog]:
    query = db.query(PlanCatalog).filter(PlanCatalog.is_active == True)
    if category:
        query = query.filter(PlanCatalog.category == category)
    return query.all()


def get_plan_with_durations(db: Session, plan_code: str) -> Optional[PlanCatalog]:
    return db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code, PlanCatalog.is_active == True).first()
