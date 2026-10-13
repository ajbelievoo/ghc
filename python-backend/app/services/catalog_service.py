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


def _addon_family_default(plan: Dict[str, Any], family: str) -> Optional[str]:
    """Default addon code for a family (memory/storage/bandwidth) on a bare-metal plan."""
    for fam in plan.get("addonFamilies") or []:
        if isinstance(fam, dict) and fam.get("name") == family:
            default = fam.get("default")
            if default:
                return str(default)
            addons = fam.get("addons") or []
            if addons:
                return str(addons[0])
    return None


def _parse_storage_addon(code: str) -> Tuple[Optional[int], Optional[str]]:
    """'softraid-2x960nvme-pcie-gen4-x' / 'hybridsoftraid-2x960nvme-...-2x1920nvme-...' → (total GB, type)."""
    total = 0
    tech = None
    for m in re.finditer(r"(\d+)x(\d{3,5})(nvme|ssd|sata|sas|hdd)", code.lower()):
        total += int(m.group(1)) * int(m.group(2))
        if not tech:
            tech = m.group(3)
    if not total:
        m = re.search(r"(\d{3,5})(nvme|ssd|sata|sas|hdd)", code.lower())
        if m:
            total = int(m.group(1))
            tech = m.group(2)
    return (total or None), tech


def _dedicated_spec_extras(product: Dict[str, Any], plan: Dict[str, Any]) -> Dict[str, Any]:
    """Real dedicated specs: CPU from product technical blob, RAM/storage/bandwidth
    from the plan's default addon in each addonFamily."""
    out: Dict[str, Any] = {}
    cpu = ((product.get("blobs") or {}).get("technical") or {}).get("server", {}).get("cpu") or {}
    if isinstance(cpu, dict) and cpu:
        out["cpu_cores"] = _coerce_int(cpu.get("cores"))
        out["cpu_brand"] = cpu.get("brand")
        out["cpu_model"] = cpu.get("model")
        out["cpu_threads"] = _coerce_int(cpu.get("threads"))
        out["cpu_freq"] = cpu.get("frequency")
        out["cpu_boost"] = cpu.get("boost")
    ram_code = _addon_family_default(plan, "memory")
    if ram_code:
        m = re.search(r"ram-(\d+)g", ram_code.lower())
        if m:
            out["ram_gb"] = int(m.group(1))
        out["ram_label"] = ram_code
    stor_code = _addon_family_default(plan, "storage") or _addon_family_default(plan, "system-storage")
    if stor_code:
        gb, tech = _parse_storage_addon(stor_code)
        if gb:
            out["disk_gb"] = gb
        if tech:
            out["disk_type"] = tech
        out["storage_label"] = stor_code
    bw_code = _addon_family_default(plan, "bandwidth")
    if bw_code:
        m = re.search(r"bandwidth-(\d+)", bw_code.lower())
        if m:
            out["bandwidth_mbps"] = int(m.group(1))
        out["bandwidth_label"] = bw_code
    return out


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
    _d = lambda v: v if isinstance(v, dict) else {}

    if category == ServiceCategory.DEDICATED:
        extras = _dedicated_spec_extras(product, plan)
        server = _d(tech.get("server"))
        cpu = (
            extras.get("cpu_cores")
            or _d(server.get("cpu")).get("cores")
            or _find_feature(features, ["cpu_cores", "cpu", "processor", "cores"])
            or _d(tech.get("cpu")).get("cores")
            or _d(tech.get("cpu")).get("number")
            or _d(product.get("cpu")).get("cores")
            or _d(plan.get("cpu")).get("cores")
        )
        ram = (
            extras.get("ram_gb")
            or _find_feature(features, ["ram", "memory", "ddr", "gb_ram"])
            or _d(tech.get("memory")).get("size")
            or _d(product.get("memory")).get("size")
            or _d(plan.get("memory")).get("size")
        )
        disk = (
            extras.get("disk_gb")
            or _find_feature(features, ["storage", "disk", "hdd", "ssd", "nvme"])
            or _first_disk_capacity(_d(tech.get("storage")).get("disks", []))
            or _first_disk_capacity(_d(product.get("storage")).get("disks", []))
            or _first_disk_capacity(_d(plan.get("storage")).get("disks", []))
        )
        disk_type = (
            extras.get("disk_type")
            or _find_feature(features, ["disk_type", "technology", "storage_type"])
            or _first_disk_tech(_d(tech.get("storage")).get("disks", []))
        )
        bw = (
            extras.get("bandwidth_mbps")
            or _find_feature(features, ["bandwidth", "traffic", "connection"])
            or _d(_d(tech.get("network")).get("public")).get("bandwidth")
            or _d(tech.get("bandwidth")).get("level")
            or _d(product.get("bandwidth")).get("level")
            or _d(plan.get("bandwidth")).get("level")
        )
    else:
        cpu = (
            _d(tech.get("cpu")).get("cores")
            or _d(product.get("cpu")).get("cores")
            or _d(plan.get("cpu")).get("cores")
            or _find_feature(features, ["cpu", "cores", "vcpu"])
        )
        ram = (
            _d(tech.get("memory")).get("size")
            or _d(product.get("memory")).get("size")
            or _d(plan.get("memory")).get("size")
            or _find_feature(features, ["ram", "memory", "ddr"])
        )
        disk = (
            _first_disk_capacity(_d(tech.get("storage")).get("disks", []))
            or _first_disk_capacity(_d(product.get("storage")).get("disks", []))
            or _first_disk_capacity(_d(plan.get("storage")).get("disks", []))
            or _find_feature(features, ["storage", "disk", "ssd"])
        )
        disk_type = _first_disk_tech(_d(tech.get("storage")).get("disks", []))
        bw = (
            _d(_d(tech.get("network")).get("public")).get("bandwidth")
            or _d(tech.get("bandwidth")).get("level")
            or _d(product.get("bandwidth")).get("level")
            or _d(plan.get("bandwidth")).get("level")
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

    result = {
        "cpu_cores": _coerce_int(cpu),
        "ram_gb": _coerce_int(ram),
        "disk_gb": _coerce_int(disk),
        "disk_type": disk_type,
        "bandwidth_mbps": _coerce_int(bw),
        "description": description,
    }
    if category == ServiceCategory.DEDICATED:
        result["extras"] = extras
    return result


def _pcc_host_family(plan_code: str) -> Optional[str]:
    """Map pcc-host-* SKUs to a storefront range (Essentials, Premier, SDDC...)."""
    code = plan_code.lower()
    if "-vsphere-ess" in code:
        return "essentials"
    if "-premier-" in code or re.search(r"-pre(vsan)?\d", code) or code.endswith("-master"):
        return "premier"
    if "saphana" in code:
        return "sap-hana"
    if "-hpc-" in code:
        return "hpc"
    if "-sddc" in code:
        return "sddc"
    if "-cdi" in code:
        return "cdi"
    if "-sto" in code:
        return "storage"
    if "-gp" in code:
        return "general"
    return "other"


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


# ---------- Metal channel (same upstream VPS plans, own margin + display names) ----------

METAL_MARGIN_KEY = "metal_vps_margin"
METAL_NAMES_KEY = "metal_vps_names"
METAL_DEFAULT_MARGIN = Decimal("20.0")


def get_metal_vps_margin(db: Session) -> Decimal:
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_MARGIN_KEY).first()
    if row and row.value:
        try:
            return Decimal(str(float(row.value)))
        except (ValueError, TypeError):
            pass
    return METAL_DEFAULT_MARGIN


def set_metal_vps_margin(db: Session, percent: float) -> None:
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_MARGIN_KEY).first()
    if not row:
        row = AdminConfig(key=METAL_MARGIN_KEY, value=str(percent))
        db.add(row)
    else:
        row.value = str(percent)
    db.commit()


def get_metal_vps_names(db: Session) -> Dict[str, str]:
    """Custom public display names for Metal VPS plans, keyed by real plan_code."""
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_NAMES_KEY).first()
    if row and row.value:
        try:
            data = json.loads(row.value)
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items() if str(v).strip()}
        except Exception:
            pass
    return {}


def set_metal_vps_names(db: Session, names: Dict[str, str]) -> None:
    clean = {str(k): str(v).strip() for k, v in (names or {}).items() if str(v).strip()}
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_NAMES_KEY).first()
    if not row:
        row = AdminConfig(key=METAL_NAMES_KEY, value=json.dumps(clean))
        db.add(row)
    else:
        row.value = json.dumps(clean)
    db.commit()


# ---------- Metal dedicated channel (own display names over the bare-metal catalog) ----------

METAL_DED_NAMES_KEY = "metal_ded_names"


def get_metal_ded_names(db: Session) -> Dict[str, str]:
    """Custom public display names for dedicated/Metal servers, keyed by real plan_code."""
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_DED_NAMES_KEY).first()
    if row and row.value:
        try:
            data = json.loads(row.value)
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items() if str(v).strip()}
        except Exception:
            pass
    return {}


def set_metal_ded_names(db: Session, names: Dict[str, str]) -> None:
    clean = {str(k): str(v).strip() for k, v in (names or {}).items() if str(v).strip()}
    row = db.query(AdminConfig).filter(AdminConfig.key == METAL_DED_NAMES_KEY).first()
    if not row:
        row = AdminConfig(key=METAL_DED_NAMES_KEY, value=json.dumps(clean))
        db.add(row)
    else:
        row.value = json.dumps(clean)
    db.commit()


def default_dedicated_display_name(invoice_name: str, plan_code: str) -> str:
    """Branded fallback name, e.g. 'ADVANCE-2 | AMD EPYC 4344P' → 'Metal Advance 2'."""
    base = (invoice_name or "").split("|")[0].strip() or plan_code or ""
    tokens = re.split(r"[-_\s]+", base)
    parts = []
    for t in tokens:
        if not t:
            continue
        if t.isupper() and len(t) <= 4 and any(c.isalpha() for c in t):
            parts.append(t)  # keep short acronyms: STOR, HG, RI
        elif t.isdigit():
            parts.append(t)
        else:
            parts.append(t[0].upper() + t[1:].lower())
    label = " ".join(parts).strip()
    return f"Metal {label}" if label else f"Metal {plan_code}"


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
            spec_meta = dict(plan)
            if specs.get("extras"):
                spec_meta["_ghc"] = specs["extras"]

            # Detect currency from first pricing with formattedPrice before using it.
            # Fall back to the subsidiary's currency (formattedPrice may be blank).
            subsidiary_currency = {
                "IN": "INR", "US": "USD", "CA": "CAD", "GB": "GBP",
                "AU": "AUD", "SG": "SGD", "DE": "EUR", "FR": "EUR",
                "IT": "EUR", "ES": "EUR", "PT": "EUR", "NL": "EUR",
                "IE": "EUR", "FI": "EUR", "LT": "EUR", "MA": "USD",
                "SN": "USD", "TN": "USD", "WS": "USD", "QC": "CAD",
            }.get((settings.ovh_subsidiary or "").upper(), "EUR")
            plan_currency = subsidiary_currency or settings.currency or "CAD"
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
                existing.catalog_metadata = spec_meta
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
                    catalog_metadata=spec_meta,
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
    from sqlalchemy.orm import joinedload
    query = db.query(PlanCatalog).options(joinedload(PlanCatalog.durations)).filter(PlanCatalog.is_active == True)
    if category:
        query = query.filter(PlanCatalog.category == category)
    return query.all()


def get_plan_with_durations(db: Session, plan_code: str) -> Optional[PlanCatalog]:
    return db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code, PlanCatalog.is_active == True).first()
