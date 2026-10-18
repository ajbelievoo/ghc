import json
import logging
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.config import get_settings
from app.models.models import (
    BillingCycle,
    CustomerOrder,
    Invoice,
    InvoiceStatus,
    OvhOrderLog,
    OrderStatus,
    PlanCatalog,
    PlanDuration,
    ServiceCategory,
    Subscription,
    SubscriptionStatus,
    User,
    Wallet,
    WalletTransaction,
    WalletTransactionType,
)
from app.services.catalog_service import get_margin_for_category, get_metal_vps_margin, get_metal_vps_names
from app.services.currency_service import convert
from app.services.wallet_service import get_or_create_wallet
from app.services.email_service import (
    send_admin_fulfillment_email,
    send_order_failed_email,
    send_order_payment_email,
    send_service_activated_email,
)
from app.services.ovh_client import OvhClient, apply_margin, log_ovh_step, ovh_price_to_decimal

logger = logging.getLogger(__name__)


def _normalize_public_plan_code(code: str) -> str:
    return (code or "").lower().replace("-ovh", "")


def _resolve_plan_code(db: Session, public_code: str) -> Optional[PlanCatalog]:
    """Resolve a customer-facing public plan code to the real OVH-backed plan.
    Public codes strip the -ovh suffix; we prefer the -ovh variant when both exist."""
    if not public_code:
        return None
    candidates = db.query(PlanCatalog).filter(PlanCatalog.is_active == True).all()
    matches = [
        p for p in candidates
        if p.plan_code and (p.plan_code.lower() == public_code.lower() or _normalize_public_plan_code(p.plan_code) == public_code.lower())
    ]
    if not matches:
        return None
    if public_code.lower().endswith("-ovh"):
        exact = next((p for p in matches if p.plan_code.lower() == public_code.lower()), None)
        if exact:
            return exact
    # Prefer the active OVH-suffixed product, then exact, then any
    for p in matches:
        if p.plan_code.lower().endswith("-ovh"):
            return p
    for p in matches:
        if p.plan_code.lower() == public_code.lower():
            return p
    return matches[0]


def _validate_configuration(plan: PlanCatalog, config: Dict[str, Any]) -> None:
    """Ensure user-submitted OS/datacenter values are in the OVH catalog allowed list."""
    metadata = plan.catalog_metadata or {}
    catalog_configs = metadata.get("configurations", [])
    # Map frontend-friendly keys to OVH catalog labels
    label_map = {
        "os": "vps_os" if plan.category == ServiceCategory.VPS else ("dedicated_os" if plan.category == ServiceCategory.DEDICATED else "os"),
        "vps_os": "vps_os",
        "datacenter": "vps_datacenter" if plan.category == ServiceCategory.VPS else ("dedicated_datacenter" if plan.category == ServiceCategory.DEDICATED else "datacenter"),
        "vps_datacenter": "vps_datacenter",
        "dedicated_datacenter": "dedicated_datacenter",
        "region": "region",
    }
    for cfg_key, label in label_map.items():
        value = config.get(cfg_key)
        if not value:
            continue
        catalog_cfg = next((c for c in catalog_configs if c.get("name") == label), None)
        if not catalog_cfg:
            continue
        allowed = catalog_cfg.get("values") or []
        if str(value) not in allowed:
            # Pre-orders may target DCs outside the catalog allowed list — the
            # waitlist universe also includes rule-endpoint codes and extras
            # like BOM that OVH displays but the catalog doesn't list.
            if config.get("_preorder") and cfg_key in ("datacenter", "vps_datacenter"):
                try:
                    from app.routers.compat import _VPS_EXTRA_DCS, _vps_dc_availability
                    extra = {str(x).upper() for x in set(_vps_dc_availability(plan.plan_code).keys()) | _VPS_EXTRA_DCS}
                    if str(value).upper() in extra:
                        continue
                except Exception:
                    pass
            raise ValueError(f"Invalid {cfg_key} '{value}' for plan {plan.plan_code}. Allowed: {', '.join(map(str, allowed))}")


# Mapping of ServiceCategory to the OVH cart item family segment
CART_ADD_SEGMENT = {
    ServiceCategory.VPS: "vps",
    ServiceCategory.DEDICATED: "baremetalServers",
    ServiceCategory.WEB_HOSTING: "webHosting",
    ServiceCategory.LICENSE: "license",
    ServiceCategory.IP_ADDON: "ip",
    ServiceCategory.PUBLIC_CLOUD: "cloud",
    ServiceCategory.CDN: "cdn",
    ServiceCategory.PRIVATE_CLOUD: "privateCloud",
    ServiceCategory.DOMAINS: "domain",
}


# Service category to OVH API resource family for extraction
SERVICE_RESOURCE_FAMILY = {
    ServiceCategory.VPS: "vps",
    ServiceCategory.DEDICATED: "dedicated/server",
    ServiceCategory.WEB_HOSTING: "hosting/web",
    ServiceCategory.DOMAINS: "domain",
}


from app.services.tax_service import generate_invoice_number, gst_fields_for_user


def create_customer_order(
    db: Session,
    user_id: str,
    plan_code: str,
    duration_label: str,
    config: Optional[Dict[str, Any]] = None,
    display_name: Optional[str] = None,
    currency: Optional[str] = None,
    coupon_code: Optional[str] = None,
) -> CustomerOrder:
    plan = _resolve_plan_code(db, plan_code)
    if not plan:
        raise ValueError(f"Plan {plan_code} not found or inactive")

    resolved_code = plan.plan_code

    # Validate configuration values against the live OVH catalog metadata
    _validate_configuration(plan, config or {})

    duration = db.query(PlanDuration).filter(
        PlanDuration.plan_code == resolved_code,
        PlanDuration.duration_label == duration_label,
    ).first()
    if not duration:
        raise ValueError(f"Duration {duration_label} not available for plan {plan_code}")

    # Metal channel (Metal menu → VPS/Dedicated): same upstream plans, priced
    # with the Metal margin instead of the standard margin/overrides.
    is_metal = str((config or {}).get("_brand") or "").lower() == "metal" and plan.category in (ServiceCategory.VPS, ServiceCategory.DEDICATED)
    if is_metal:
        if plan.category == ServiceCategory.DEDICATED:
            from app.services.catalog_service import get_metal_ded_margin, get_metal_ded_names, default_dedicated_display_name
            margin = get_metal_ded_margin(db)
            ded_names = get_metal_ded_names(db)
            ded_names_norm = {_normalize_public_plan_code(k): v for k, v in ded_names.items()}
            metal_name = (
                ded_names.get(resolved_code)
                or ded_names_norm.get(_normalize_public_plan_code(resolved_code))
                or default_dedicated_display_name(plan.invoice_name or "", resolved_code)
            )
        else:
            metal_names = get_metal_vps_names(db)
            metal_names_norm = {_normalize_public_plan_code(k): v for k, v in metal_names.items()}
            metal_name = metal_names.get(resolved_code) or metal_names_norm.get(_normalize_public_plan_code(resolved_code))
        if metal_name:
            config = {**(config or {}), "display_name": metal_name}

    # One pricing path for listings AND orders: upstream raw -> channel/plan
    # margin -> commitment-duration discount. Guarantees the charged amount
    # always equals the price shown on the storefront.
    from app.services.catalog_service import compute_sell_price
    final_price, _disc_pct = compute_sell_price(db, plan, duration, metal=is_metal)

    # Convert final price and base cost into the customer's selected currency
    target_currency = (currency or duration.currency or get_settings().currency or "USD").upper()
    rate = convert(db, 1.0, duration.currency or "INR", target_currency)
    final_price_converted = float(final_price * rate)
    ovh_base_amount = float(duration.raw_price) * rate
    commission_amount = final_price_converted - ovh_base_amount

    discount_amount = 0.0
    coupon_obj = None
    if coupon_code:
        from app.services.coupon_service import get_coupon, validate_coupon, compute_discount
        coupon_obj = get_coupon(db, coupon_code)
        if not coupon_obj:
            raise ValueError("Invalid coupon code")
        ok, reason = validate_coupon(db, coupon_obj, user_id, final_price_converted, plan.category.value if hasattr(plan.category, "value") else plan.category)
        if not ok:
            raise ValueError(reason)
        discount_amount = compute_discount(coupon_obj, final_price_converted)

    # Paid add-ons chosen on the configure page (snapshot / premium backup /
    # extra disk / cpanel-plesk licenses). Codes must belong to the plan's
    # addonFamilies and are priced from the live OVH catalog + channel margin,
    # per month of the selected duration.
    sel_options = [str(c) for c in (config or {}).get("_options") or [] if c]
    options_total = 0.0
    if sel_options:
        from app.routers.compat import _vps_addon_prices
        prices = _vps_addon_prices()
        fams = (plan.catalog_metadata or {}).get("addonFamilies") or []
        allowed = {a for f in fams for a in (f.get("addons") or []) if f.get("name") not in ("os", "storage")}
        _unit = str(duration.interval_unit or "month").lower()
        months = max(1, int(duration.interval or 1)) * (12 if _unit.startswith("y") else 1)
        for code in sel_options:
            if code not in allowed:
                raise ValueError(f"Invalid option '{code}' for plan {plan.plan_code}")
            p = prices.get(code)
            if not p:
                raise ValueError(f"Option '{code}' has no catalog pricing")
            opt_margin = get_metal_vps_margin(db) if (is_metal and plan.category == ServiceCategory.VPS) else get_margin_for_category(db, plan.category)
            sell = float(apply_margin(Decimal(str(p["monthlyPrice"])), opt_margin))
            options_total += sell * months
        options_total = round(options_total * rate, 2)

    # License add-ons must pair with a matching licensed OS image — OVH bills
    # them regardless, so never attach an orphan license; and a licensed image
    # without its license addon would provision a panel that never activates.
    _os_img = str((config or {}).get("os") or "").lower()
    if any(c.startswith("option-cpanel") for c in sel_options) and "cpanel" not in _os_img:
        raise ValueError("cPanel license requires a cPanel OS image")
    if any(c.startswith("option-plesk") for c in sel_options) and "plesk" not in _os_img:
        raise ValueError("Plesk license requires a Plesk OS image")
    if plan.category == ServiceCategory.VPS and (
        ("cpanel" in _os_img and not any(c.startswith("option-cpanel") for c in sel_options))
        or ("plesk" in _os_img and not any(c.startswith("option-plesk") for c in sel_options))
    ):
        raise ValueError("A cPanel/Plesk image requires its license add-on in _options")
    if sel_options:
        config = {**(config or {}), "_options": sel_options, "_options_price": options_total}

    # Pre-order (stock waitlist): customer pays now for an out-of-stock DC;
    # an extra admin-set fee applies on top of the plan price (before tax).
    is_preorder = bool((config or {}).get("_preorder"))
    preorder_fee = 0.0
    if is_preorder:
        from app.services.catalog_service import compute_preorder_fee, get_preorder_settings
        ps = get_preorder_settings(db)
        if not ps["enabled"]:
            raise ValueError("Pre-booking is currently disabled")
        preorder_fee = compute_preorder_fee(db, final_price_converted, target_currency)
        config = {**(config or {}), "_preorder": True, "_preorder_fee": preorder_fee}

    taxable = max(0.0, final_price_converted - discount_amount) + preorder_fee + options_total
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(taxable * tax_rate, 2)
    customer_amount = round(taxable + tax_amount, 2)

    order = CustomerOrder(
        user_id=user_id,
        plan_code=resolved_code,
        duration_label=duration_label,
        category=plan.category,
        customer_amount=customer_amount,
        ovh_base_amount=round(ovh_base_amount, 2),
        commission_amount=round(commission_amount, 2),
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        currency=target_currency,
        status=OrderStatus.PENDING,
        configuration_payload=config or {},
        coupon_code=coupon_obj.code if coupon_obj else None,
        discount_amount=discount_amount,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    if coupon_obj and discount_amount > 0:
        from app.services.coupon_service import redeem_coupon
        redeem_coupon(db, coupon_obj, user_id, order.id, discount_amount)
    return order


def _build_add_item_payload(
    plan_code: str,
    duration: PlanDuration,
    category: ServiceCategory,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    payload = {
        "planCode": plan_code,
        "duration": f"P{duration.interval}{duration.interval_unit[0].upper()}",
        "pricingMode": "default",
        "quantity": 1,
    }
    if category == ServiceCategory.DOMAINS:
        # OVH domain API expects P1Y for a 1-year registration, not P12M
        if duration.interval_unit in ("year", "years"):
            domain_duration = f"P{duration.interval}Y"
        elif duration.interval == 12 and duration.interval_unit in ("month", "months"):
            domain_duration = "P1Y"
        else:
            domain_duration = payload["duration"]
        payload = {
            "domain": config.get("domain"),
            "duration": domain_duration,
            "quantity": 1,
        }
    return payload


def _build_required_configurations(plan: PlanCatalog, config: Dict[str, Any]) -> List[Dict[str, str]]:
    configurations: List[Dict[str, str]] = []
    category = plan.category
    cfg = config or {}
    metadata = plan.catalog_metadata or {}
    catalog_configs = metadata.get("configurations", [])
    catalog_config_names = {c.get("name") for c in catalog_configs if c.get("name")}

    def add_config(label: str, value: Any):
        if value:
            configurations.append({"label": label, "value": str(value)})

    if category == ServiceCategory.VPS:
        # OVH VPS uses vps_os, vps_datacenter, region labels
        os_value = cfg.get("vps_os") or cfg.get("os")
        dc_value = cfg.get("vps_datacenter") or cfg.get("datacenter")
        os_label = "vps_os" if "vps_os" in catalog_config_names else "os"
        dc_label = "vps_datacenter" if "vps_datacenter" in catalog_config_names else "datacenter"
        if os_value:
            add_config(os_label, os_value)
        if dc_value:
            add_config(dc_label, dc_value)
            # Auto-detect region from datacenter for OVH
            dc = str(dc_value).upper()
            if any(code in dc for code in ["BHS", "YNM"]):
                add_config("region", "canada")
            elif any(code in dc for code in ["GRA", "SBG", "RBX", "WAW", "DE", "ERI", "MIL", "PRG", "MAD", "AMS", "BRU", "MRS", "VIE", "ZRH", "EU-", "UK"]):
                add_config("region", "europe")
            elif any(code in dc for code in ["SGP", "SYD", "BOM"]):
                add_config("region", "asia-pacific")
        if cfg.get("region"):
            add_config("region", cfg["region"])
        if cfg.get("infrastructure"):
            add_config("infrastructure", cfg["infrastructure"])
        elif "infrastructure" in catalog_config_names:
            add_config("infrastructure", "production")

    elif category == ServiceCategory.DEDICATED:
        os_label = "dedicated_os" if "dedicated_os" in catalog_config_names else "os"
        dc_label = "dedicated_datacenter" if "dedicated_datacenter" in catalog_config_names else "datacenter"
        if cfg.get("os"):
            add_config(os_label, cfg["os"])
        if cfg.get("datacenter"):
            add_config(dc_label, cfg["datacenter"])
        if cfg.get("language"):
            add_config("language", cfg["language"])
        elif cfg.get("os"):
            add_config("language", "en_GB")

    elif category == ServiceCategory.WEB_HOSTING:
        if cfg.get("datacenter"):
            if "district" in catalog_config_names:
                add_config("district", cfg["datacenter"])
            else:
                add_config("country", cfg["datacenter"])
        if "dns_zone" in catalog_config_names:
            add_config("dns_zone", cfg.get("dns_zone") or "NO_CHANGE")

    elif category == ServiceCategory.LICENSE:
        if cfg.get("license"):
            add_config("license", cfg["license"])
        if cfg.get("service_name"):
            add_config("serviceName", cfg["service_name"])

    elif category == ServiceCategory.DOMAINS:
        # For domains, contacts that accept a nichandle are ADMIN/TECH/BILLING.
        # OWNER_CONTACT and DNS are optional and should not be set unless a real
        # OVH contact ID or explicit value is provided.
        nic = cfg.get("nichandle") or ""
        owner = cfg.get("owner_contact") or ""
        if nic:
            add_config("ADMIN_CONTACT", cfg.get("admin_contact") or nic)
            add_config("TECH_ACCOUNT", cfg.get("tech_contact") or nic)
            add_config("BILLING_ACCOUNT", cfg.get("billing_contact") or nic)
        if owner:
            add_config("OWNER_CONTACT", owner)
        if cfg.get("dns"):
            add_config("DNS", cfg["dns"])

    return configurations


def _add_mandatory_options(db, ovh, order, parent_item_id, service, plan, duration, config) -> List[Any]:
    """Add OVH mandatory addon families (OS, backup, storage) + any paid
    add-ons the customer selected (snapshot, premium backup, extra disk,
    cpanel/plesk license) as child items. A selected code overrides the
    family's mandatory default (e.g. premium backup replaces standard)."""
    all_item_ids = [parent_item_id]
    metadata = plan.catalog_metadata or {}
    addon_families = metadata.get("addonFamilies", [])
    if not addon_families:
        return all_item_ids

    selected = {str(c) for c in (config or {}).get("_options") or []}

    duration_str = f"P{duration.interval}{duration.interval_unit[0].upper()}"

    for family in addon_families:
        addons = family.get("addons") or []
        if not addons:
            continue

        chosen_list: List[str] = []
        picked = [c for c in addons if c in selected]
        if family.get("name") == "os":
            # Prefer Linux OS when available, otherwise use first option
            preferred = next((a for a in addons if "linux" in a.lower()), None)
            chosen_list = [preferred or addons[0]]
        elif picked:
            chosen_list = picked
        elif family.get("mandatory"):
            chosen_list = [addons[0]]
        else:
            continue

        for chosen in chosen_list:
            try:
                option = ovh.add_item_option(
                    order.ovh_cart_id,
                    service,
                    parent_item_id,
                    {
                        "planCode": chosen,
                        "duration": duration_str,
                        "pricingMode": "default",
                        "quantity": 1,
                    },
                )
                option_id = option.get("itemId")
                all_item_ids.append(option_id)
                log_ovh_step(
                    db,
                    order.id,
                    "ADD_OPTION",
                    f"/order/cart/{order.ovh_cart_id}/{service}",
                    {"parentItemId": parent_item_id, "planCode": chosen},
                    option,
                )
            except Exception as e:
                logger.warning(f"Could not add option {chosen} for plan {plan.plan_code}: {e}")
                # Non-fatal: OVH may allow checkout without optional/recommended addons

    return all_item_ids


def _notify_order_status(db: Session, order: CustomerOrder, status: OrderStatus, error: Optional[str] = None):
    """Fire branded transactional emails when order reaches key states."""
    if not order.user:
        return
    try:
        if status == OrderStatus.ACTIVE:
            sub = db.query(Subscription).filter(Subscription.order_id == order.id).first()
            if sub:
                send_service_activated_email(db, order, sub, order.user)
        elif status == OrderStatus.FAILED:
            send_order_failed_email(db, order, order.user, error)
    except Exception:
        logger.exception(f"Order status notification failed for {order.id} / {status.value}")


def _update_order_status(
    db: Session,
    order: CustomerOrder,
    status: OrderStatus,
    error: Optional[str] = None,
    commit: bool = True,
):
    order.status = status
    if error is not None:
        order.error_message = error
    order.updated_at = func.now()
    if commit:
        db.commit()

    if commit and status in (OrderStatus.ACTIVE, OrderStatus.FAILED):
        _notify_order_status(db, order, status, error)

    # Free coupon redemptions burned by unpaid failed orders so the customer
    # can reuse the coupon on a future order.
    if commit and status == OrderStatus.FAILED:
        try:
            from app.services.coupon_service import release_coupon_redemptions
            release_coupon_redemptions(db, order.id)
        except Exception:
            logger.exception(f"Coupon release failed for order {order.id}")


def _extract_service_name_from_order_details(ovh: OvhClient, order_id: int) -> Optional[str]:
    """OVH order details contain the domain/serviceName created by the order."""
    try:
        details = ovh.get_order_details(order_id)
        for detail in details:
            if isinstance(detail, dict):
                domain = detail.get("domain")
                if domain:
                    return domain
    except Exception as e:
        logger.warning(f"Could not extract service name from order details: {e}")
    return None


def _poll_for_service_name(
    ovh: OvhClient,
    category: ServiceCategory,
    order_id: int,
    max_attempts: int = 30,
    delay: int = 10,
) -> Optional[str]:
    """Poll OVH until the ordered service appears."""
    service_name = _extract_service_name_from_order_details(ovh, order_id)
    if service_name:
        return service_name

    api_family = SERVICE_RESOURCE_FAMILY.get(category)
    if not api_family:
        return None

    for attempt in range(max_attempts):
        try:
            services = ovh.request("GET", f"/{api_family}")
            if services and isinstance(services, list):
                # We can't know which one is ours without more info; return first if only one
                if len(services) == 1:
                    return services[0]
                # If multiple, try to match by order details on next attempt
                service_name = _extract_service_name_from_order_details(ovh, order_id)
                if service_name:
                    return service_name
        except Exception as e:
            logger.debug(f"Polling service list attempt {attempt + 1} failed: {e}")
        time.sleep(delay)
    return None


def _extract_service_credentials(ovh: OvhClient, category: ServiceCategory, service_name: str) -> Dict[str, Any]:
    result = {"ip_address": None, "root_user": None, "root_password": None, "datacenter": None}
    try:
        if category == ServiceCategory.VPS:
            info = ovh.get_vps(service_name)
            result["ip_address"] = info.get("ip")
            result["datacenter"] = info.get("location")
            try:
                ips = ovh.get_vps_ips(service_name)
                if ips and isinstance(ips, list):
                    result["ip_address"] = ips[0].get("ip") if isinstance(ips[0], dict) else ips[0]
            except Exception:
                pass
        elif category == ServiceCategory.DEDICATED:
            info = ovh.get_dedicated_server(service_name)
            result["ip_address"] = info.get("ip")
            result["datacenter"] = info.get("datacenter")
        elif category == ServiceCategory.WEB_HOSTING:
            info = ovh.get_web_hosting(service_name)
            result["ip_address"] = info.get("hostingIp")
            result["datacenter"] = info.get("country")
    except Exception as e:
        logger.warning(f"Could not extract service credentials: {e}")
    return result


def _duration_to_cycle(duration_label: str):
    """Map an order duration label to (renewal days, BillingCycle)."""
    mapping = {
        "3_month": (90, BillingCycle.QUARTERLY),
        "6_month": (180, BillingCycle.HALF_YEARLY),
        "12_month": (365, BillingCycle.YEARLY),
        "24_month": (730, BillingCycle.YEARLY),
        "48_month": (1460, BillingCycle.YEARLY),
    }
    return mapping.get(duration_label, (30, BillingCycle.MONTHLY))


def _ensure_invoice_and_subscription(db: Session, order: CustomerOrder):
    """Create a paid invoice and a PENDING subscription if checkout failed after payment."""
    if not order.invoice:
        from app.models.models import Invoice, InvoiceStatus, Subscription, SubscriptionStatus, BillingCycle
        cycle_days, billing_cycle = _duration_to_cycle(order.duration_label)
        tax_type, hsn_code, place = gst_fields_for_user(db, order.user_id)
        invoice = Invoice(
            order_id=order.id,
            user_id=order.user_id,
            amount=order.customer_amount,
            tax_amount=order.tax_amount,
            tax_rate=order.tax_rate,
            tax_type=tax_type,
            hsn_code=hsn_code,
            place_of_supply=place,
            due_date=datetime.utcnow(),
            status=InvoiceStatus.PAID,
            currency=order.currency,
        )
        db.add(invoice)
        db.flush()
        invoice.invoice_number = generate_invoice_number(invoice)
        # Service-option orders (upgrade/disk/backup on an existing service)
        # must not create a new subscription.
        is_option_order = bool((order.configuration_payload or {}).get("service_option"))
        if not order.subscription and not is_option_order:
            sub = Subscription(
                order_id=order.id,
                user_id=order.user_id,
                plan_code=order.plan_code,
                category=order.category,
                status=SubscriptionStatus.PENDING,
                billing_cycle=billing_cycle,
                auto_renew=True,
                next_bill_date=datetime.utcnow() + timedelta(days=cycle_days),
                price_amount=order.customer_amount,
                currency=order.currency,
            )
            db.add(sub)
        db.commit()


def _pay_ovh_order(db: Session, ovh: OvhClient, order: CustomerOrder, ovh_order_id: int) -> bool:
    """Try to pay an OVH order using an available registered payment mean."""
    try:
        available = ovh.get(f"/me/order/{ovh_order_id}/availableRegisteredPaymentMean") or []
        for mean in available:
            payment_mean = mean.get("paymentMean")
            payment_mean_id = mean.get("paymentMeanId")
            try:
                ovh.pay_order_with_registered_payment_mean(int(ovh_order_id), payment_mean, payment_mean_id)
                order.ovh_payment_mean = payment_mean
                _update_order_status(db, order, OrderStatus.OVH_PAID)
                log_ovh_step(db, order.id, "PAY_ORDER", f"/me/order/{ovh_order_id}/payWithRegisteredPaymentMean", {"paymentMean": payment_mean}, {"paid": True})
                return True
            except Exception as e:
                logger.warning(f"Could not pay OVH order {ovh_order_id} with {payment_mean}: {e}")
    except Exception as e:
        logger.warning(f"Could not fetch payment means for OVH order {ovh_order_id}: {e}")
    return False


# ---------- Service-option orders (upgrade / additional disk / automated backup) ----------

SERVICE_OPTION_KINDS = ("upgrade", "additional_disk", "automated_backup", "license")
DISK_SIZES_GB = (50, 100, 200, 500)


def _order_price(order_obj: Dict[str, Any]) -> tuple[Decimal, str]:
    """Extract (withoutTax value, currencyCode) from an OVH order.Order object."""
    prices = (order_obj or {}).get("prices") or {}
    for key in ("withoutTax", "withTax", "originalWithoutTax"):
        p = prices.get(key) or {}
        if p.get("value") is not None:
            return Decimal(str(p["value"])), (p.get("currencyCode") or "EUR")
    return Decimal("0"), "EUR"


def _pick_offer_price(prices: List[Dict[str, Any]]) -> tuple[Decimal, str, Optional[str]]:
    """Pick the shortest-duration price from a GenericProductPricing list."""
    best = None
    for p in prices or []:
        if p.get("price") is None:
            continue
        if best is None or (p.get("interval") or 999) < (best.get("interval") or 999):
            best = p
    if not best:
        return Decimal("0"), "EUR", None
    price = best.get("price") or {}
    return Decimal(str(price.get("value") or 0)), (price.get("currencyCode") or "EUR"), best.get("duration")


def get_vps_option_catalog(db: Session, ovh: OvhClient, sub: Subscription, currency: Optional[str] = None) -> Dict[str, Any]:
    """Return purchasable options for a VPS with customer-facing prices (margin applied)."""
    service_name = sub.service_name or sub.ovh_resource_id
    if not service_name:
        raise ValueError("Subscription has no OVH service attached")
    target = (currency or sub.currency or get_settings().currency or "USD").upper()
    margin = get_margin_for_category(db, ServiceCategory.VPS)
    tax_rate = get_settings().tax_rate_percent / 100.0

    def customer_price(base: Decimal, base_currency: str) -> Dict[str, Any]:
        final = float(apply_margin(base, margin))
        rate = convert(db, 1.0, base_currency, target)
        converted = round(final * rate, 2)
        return {
            "price": converted,
            "tax": round(converted * tax_rate, 2),
            "total": round(converted * (1 + tax_rate), 2),
            "currency": target,
        }

    result: Dict[str, Any] = {"upgrades": [], "additionalDisks": [], "automatedBackup": None, "licenses": []}

    # --- Model upgrades ---
    try:
        offers = ovh.get(f"/order/upgrade/vps/{service_name}") or []
    except Exception as e:
        logger.warning(f"Upgrade offers unavailable for {service_name}: {e}")
        offers = []
    catalog_plans = {
        p.plan_code: p
        for p in db.query(PlanCatalog).filter(
            PlanCatalog.category == ServiceCategory.VPS, PlanCatalog.is_active == True
        ).all()
    }
    for offer in offers:
        code = offer.get("planCode")
        prices = offer.get("prices") or []
        base, base_cur, duration = _pick_offer_price(prices)
        if base <= 0:
            continue
        plan = catalog_plans.get(code)
        entry = {
            "planCode": code,
            "productName": offer.get("productName") or (plan.invoice_name if plan else code),
            "duration": duration,
            **customer_price(base, base_cur),
        }
        if plan:
            meta = plan.catalog_metadata or {}
            blobs = meta.get("blobs") or {}
            tech = blobs.get("technical") or {}
            entry["specs"] = {
                "vcores": tech.get("cpu") or tech.get("vcores"),
                "memory": tech.get("memory") or tech.get("ram"),
                "storage": tech.get("storage"),
            }
        result["upgrades"].append(entry)

    # --- Additional disks ---
    for size in DISK_SIZES_GB:
        try:
            durations = ovh.get(
                f"/order/vps/{service_name}/additionalDisk",
                additionalDiskSize=str(size),
            ) or []
        except Exception as e:
            logger.debug(f"Disk {size}GB durations unavailable: {e}")
            durations = []
        for dur in durations[:1]:  # shortest/first duration only
            try:
                preview = ovh.get(
                    f"/order/vps/{service_name}/additionalDisk/{dur}",
                    additionalDiskSize=str(size),
                ) or {}
                base, base_cur = _order_price(preview)
                if base <= 0:
                    continue
                result["additionalDisks"].append({
                    "size": size,
                    "duration": dur,
                    **customer_price(base, base_cur),
                })
            except Exception as e:
                logger.debug(f"Disk {size}GB {dur} preview failed: {e}")

    # --- Automated backup ---
    try:
        durations = ovh.get(f"/order/vps/{service_name}/automatedBackup") or []
    except Exception as e:
        logger.debug(f"Backup durations unavailable: {e}")
        durations = []
    for dur in durations[:1]:
        try:
            preview = ovh.get(f"/order/vps/{service_name}/automatedBackup/{dur}") or {}
            base, base_cur = _order_price(preview)
            if base <= 0:
                continue
            result["automatedBackup"] = {"duration": dur, **customer_price(base, base_cur)}
        except Exception as e:
            logger.debug(f"Backup {dur} preview failed: {e}")

    # --- Licenses & other cartServiceOption add-ons (cPanel/Plesk/Windows/snapshot) ---
    try:
        svc_options = ovh.get(f"/order/cartServiceOption/vps/{service_name}") or []
    except Exception as e:
        logger.debug(f"cartServiceOption unavailable for {service_name}: {e}")
        svc_options = []
    for opt in svc_options:
        family = (opt.get("family") or "").lower()
        if family in ("additionaldisk", "automatedbackup"):
            continue  # already covered by their dedicated order endpoints
        # Monthly renewal price is the real recurring cost; installation is usually 0
        best = None
        for p in opt.get("prices") or []:
            if "renew" not in (p.get("capacities") or []):
                continue
            val = (p.get("price") or {}).get("value") or 0
            cur = (p.get("price") or {}).get("currencyCode") or "USD"
            if val <= 0:
                continue
            if best is None or val < best[0]:
                best = (val, cur, p.get("duration"), p.get("pricingMode"))
        if not best:
            continue
        base, base_cur, duration, pricing_mode = best
        result["licenses"].append({
            "family": family,
            "planCode": opt.get("planCode"),
            "productName": opt.get("productName") or opt.get("planCode"),
            "duration": duration or "P1M",
            "pricingMode": pricing_mode or "default",
            **customer_price(Decimal(str(base)), base_cur),
        })

    return result


def get_dedicated_option_catalog(db: Session, ovh: OvhClient, sub: Subscription, currency: Optional[str] = None) -> Dict[str, Any]:
    """Return purchasable upgrade offers for a dedicated server (margin applied)."""
    service_name = sub.service_name or sub.ovh_resource_id
    if not service_name:
        raise ValueError("Subscription has no OVH service attached")
    target = (currency or sub.currency or get_settings().currency or "USD").upper()
    margin = get_margin_for_category(db, ServiceCategory.DEDICATED)
    tax_rate = get_settings().tax_rate_percent / 100.0

    def customer_price(base: Decimal, base_currency: str) -> Dict[str, Any]:
        final = float(apply_margin(base, margin))
        rate = convert(db, 1.0, base_currency, target)
        converted = round(final * rate, 2)
        return {
            "price": converted,
            "tax": round(converted * tax_rate, 2),
            "total": round(converted * (1 + tax_rate), 2),
            "currency": target,
        }

    result: Dict[str, Any] = {"upgrades": []}
    try:
        offers = ovh.get(f"/order/upgrade/dedicated/{service_name}") or []
    except Exception as e:
        logger.warning(f"Upgrade offers unavailable for {service_name}: {e}")
        offers = []
    catalog_plans = {
        p.plan_code: p
        for p in db.query(PlanCatalog).filter(
            PlanCatalog.category == ServiceCategory.DEDICATED, PlanCatalog.is_active == True
        ).all()
    }
    for offer in offers:
        code = offer.get("planCode")
        base, base_cur, duration = _pick_offer_price(offer.get("prices") or [])
        if base <= 0:
            continue
        plan = catalog_plans.get(code)
        entry = {
            "planCode": code,
            "productName": offer.get("productName") or (plan.invoice_name if plan else code),
            "duration": duration,
            **customer_price(base, base_cur),
        }
        if plan:
            blobs = (plan.catalog_metadata or {}).get("blobs") or {}
            tech = blobs.get("technical") or {}
            entry["specs"] = {
                "cpu": tech.get("cpu") or tech.get("processor"),
                "memory": tech.get("memory") or tech.get("ram"),
                "storage": tech.get("storage"),
            }
        result["upgrades"].append(entry)
    return result


def create_service_option_order(
    db: Session,
    ovh: OvhClient,
    user_id: str,
    sub: Subscription,
    kind: str,
    params: Dict[str, Any],
    currency: Optional[str] = None,
) -> CustomerOrder:
    """Create a pending order for an option on an existing VPS service.

    After payment, execute_service_option_order() applies the change at OVH.
    """
    if kind not in SERVICE_OPTION_KINDS:
        raise ValueError(f"Unsupported option kind: {kind}")
    service_name = sub.service_name or sub.ovh_resource_id
    if not service_name:
        raise ValueError("Subscription has no OVH service attached")
    if sub.category != ServiceCategory.VPS:
        if not (sub.category == ServiceCategory.DEDICATED and kind == "upgrade"):
            raise ValueError("Service options are currently supported for VPS only (dedicated supports upgrades)")
    if sub.status != SubscriptionStatus.ACTIVE:
        raise ValueError("Server must be active to purchase options")

    option: Dict[str, Any] = {"kind": kind, "serviceName": service_name, "subscriptionId": sub.id}

    if kind == "upgrade":
        plan_code = (params.get("planCode") or "").strip()
        if not plan_code:
            raise ValueError("planCode is required for an upgrade")
        family = "vps" if sub.category == ServiceCategory.VPS else "dedicated"
        offers = ovh.get(f"/order/upgrade/{family}/{service_name}") or []
        offer = next((o for o in offers if o.get("planCode") == plan_code), None)
        if not offer:
            raise ValueError("This upgrade is not available for your VPS")
        base, base_currency, duration = _pick_offer_price(offer.get("prices") or [])
        if base <= 0:
            raise ValueError("No pricing available for this upgrade")
        option.update({"planCode": plan_code, "duration": duration})
        label = f"VPS upgrade → {offer.get('productName') or plan_code}"

    elif kind == "additional_disk":
        size = int(params.get("size") or 0)
        duration = (params.get("duration") or "").strip()
        if size not in DISK_SIZES_GB:
            raise ValueError(f"Disk size must be one of {DISK_SIZES_GB} GB")
        durations = ovh.get(f"/order/vps/{service_name}/additionalDisk", additionalDiskSize=str(size)) or []
        if not durations:
            raise ValueError("Additional disks are not available for this VPS")
        if not duration:
            duration = durations[0]
        if duration not in durations:
            raise ValueError("Invalid duration for additional disk")
        preview = ovh.get(f"/order/vps/{service_name}/additionalDisk/{duration}", additionalDiskSize=str(size)) or {}
        base, base_currency = _order_price(preview)
        if base <= 0:
            raise ValueError("No pricing available for this disk")
        option.update({"size": size, "duration": duration})
        label = f"Additional disk {size} GB"

    elif kind == "automated_backup":
        durations = ovh.get(f"/order/vps/{service_name}/automatedBackup") or []
        if not durations:
            raise ValueError("Automated backup is not available for this VPS")
        duration = (params.get("duration") or "").strip() or durations[0]
        if duration not in durations:
            raise ValueError("Invalid duration for automated backup")
        preview = ovh.get(f"/order/vps/{service_name}/automatedBackup/{duration}") or {}
        base, base_currency = _order_price(preview)
        if base <= 0:
            raise ValueError("No pricing available for automated backup")
        option.update({"duration": duration})
        label = "Automated backup"

    elif kind == "license":
        if sub.category != ServiceCategory.VPS:
            raise ValueError("Licenses can only be attached to a VPS")
        plan_code = (params.get("planCode") or "").strip()
        if not plan_code:
            raise ValueError("planCode is required for a license option")
        svc_options = ovh.get(f"/order/cartServiceOption/vps/{service_name}") or []
        offer = next((o for o in svc_options if o.get("planCode") == plan_code), None)
        if not offer:
            raise ValueError("This option is not available for your VPS")
        # Pick the cheapest monthly 'renew' price, mirroring the catalog listing
        best = None
        for p in offer.get("prices") or []:
            if "renew" not in (p.get("capacities") or []):
                continue
            val = Decimal(str((p.get("price") or {}).get("value") or 0))
            if val <= 0:
                continue
            if best is None or val < best[0]:
                best = (val, (p.get("price") or {}).get("currencyCode") or "USD", p.get("duration"), p.get("pricingMode"))
        if not best:
            raise ValueError("No pricing available for this option")
        base, base_currency, duration, pricing_mode = best
        option.update({
            "planCode": plan_code,
            "duration": duration or "P1M",
            "pricingMode": pricing_mode or "default",
            "family": offer.get("family") or "license",
        })
        label = f"{offer.get('productName') or plan_code} license"

    # Apply category margin + convert to customer currency + tax
    final_price = float(apply_margin(base, get_margin_for_category(db, sub.category)))
    target = (currency or sub.currency or get_settings().currency or "USD").upper()
    rate = convert(db, 1.0, base_currency, target)
    final_price_conv = round(final_price * rate, 2)
    base_conv = round(float(base) * rate, 2)
    commission = round(final_price_conv - base_conv, 2)
    tax_rate = get_settings().tax_rate_percent / 100.0
    tax_amount = round(final_price_conv * tax_rate, 2)
    customer_amount = round(final_price_conv + tax_amount, 2)

    order = CustomerOrder(
        user_id=user_id,
        plan_code=None,
        duration_label=option.get("duration"),
        category=sub.category,
        customer_amount=customer_amount,
        ovh_base_amount=base_conv,
        commission_amount=commission,
        tax_amount=tax_amount,
        tax_rate=tax_rate,
        currency=target,
        status=OrderStatus.PENDING,
        configuration_payload={
            "service_option": option,
            "display_name": label,
        },
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def execute_service_option_order(db: Session, ovh: OvhClient, order: CustomerOrder) -> CustomerOrder:
    """Apply a paid service-option order at OVH (upgrade / additional disk / backup)."""
    cfg = order.configuration_payload or {}
    option = cfg.get("service_option") or {}
    kind = option.get("kind")
    service_name = option.get("serviceName")
    if not kind or not service_name:
        _update_order_status(db, order, OrderStatus.FAILED, "Missing service option details")
        raise ValueError("Missing service option details")

    try:
        if kind == "upgrade":
            plan_code = option.get("planCode")
            family = "dedicated" if (order.category == ServiceCategory.DEDICATED) else "vps"
            try:
                result = ovh.post(
                    f"/order/upgrade/{family}/{service_name}/{plan_code}",
                    quantity=1,
                    autoPayWithPreferredPaymentMethod=True,
                )
            except Exception as e:
                logger.warning(f"Auto-pay upgrade failed, retrying without autoPay: {e}")
                result = ovh.post(
                    f"/order/upgrade/{family}/{service_name}/{plan_code}",
                    quantity=1,
                    autoPayWithPreferredPaymentMethod=False,
                )
            ovh_order = (result or {}).get("order") or {}
            operation = (result or {}).get("operation") or {}
            log_ovh_step(db, order.id, "ORDER_UPGRADE", f"/order/upgrade/vps/{service_name}/{plan_code}", {"quantity": 1}, result)

        elif kind == "additional_disk":
            duration = option.get("duration")
            size = str(option.get("size"))
            ovh_order = ovh.post(
                f"/order/vps/{service_name}/additionalDisk/{duration}",
                additionalDiskSize=size,
            ) or {}
            operation = {}
            log_ovh_step(db, order.id, "ORDER_DISK", f"/order/vps/{service_name}/additionalDisk/{duration}", {"additionalDiskSize": size}, ovh_order)

        elif kind == "automated_backup":
            duration = option.get("duration")
            ovh_order = ovh.post(
                f"/order/vps/{service_name}/automatedBackup/{duration}",
            ) or {}
            operation = {}
            log_ovh_step(db, order.id, "ORDER_BACKUP", f"/order/vps/{service_name}/automatedBackup/{duration}", {}, ovh_order)

        elif kind == "license":
            # Service options (cPanel/Plesk/Windows/snapshot) only sell through the
            # cart flow: POST /order/cart/{id}/vps/options → checkout → pay.
            cart = ovh.create_cart(description=f"GHC option order {order.id}")
            cart_id = cart.get("cartId")
            ovh.assign_cart(cart_id)
            added = ovh.post(
                f"/order/cart/{cart_id}/vps/options",
                planCode=option.get("planCode"),
                duration=option.get("duration") or "P1M",
                pricingMode=option.get("pricingMode") or "default",
                quantity=1,
                serviceName=service_name,
            )
            log_ovh_step(db, order.id, "ADD_LICENSE_OPTION", f"/order/cart/{cart_id}/vps/options", {"planCode": option.get("planCode"), "serviceName": service_name}, added)
            order.ovh_cart_id = cart_id
            try:
                checkout = ovh.post_cart_checkout(cart_id, auto_pay_with_preferred_payment_mean=True)
            except Exception as e:
                logger.warning(f"License auto-pay checkout failed, retrying manual: {e}")
                checkout = ovh.post_cart_checkout(cart_id, auto_pay_with_preferred_payment_mean=False)
            ovh_order = checkout or {}
            operation = {}
            log_ovh_step(db, order.id, "ORDER_LICENSE", f"/order/cart/{cart_id}/checkout", {"autoPay": True}, ovh_order)

        else:
            raise ValueError(f"Unsupported option kind: {kind}")

        ovh_order_id = ovh_order.get("orderId")
        order.ovh_order_id = str(ovh_order_id) if ovh_order_id else None
        order.ovh_order_url = ovh_order.get("url")
        _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED)

        paid = bool(ovh_order_id) and _pay_ovh_order(db, ovh, order, int(ovh_order_id))
        if not paid and ovh_order_id:
            _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED, "Waiting for OVH payment; the order was placed on the provider account")
            return order

        # Order placed and paid (or upgrade auto-paid) — update the subscription
        sub = db.query(Subscription).filter(Subscription.id == option.get("subscriptionId")).first()
        if sub:
            if kind == "upgrade" and option.get("planCode"):
                sub.plan_code = option["planCode"]
            sub.updated_at = func.now()
            db.commit()

        _update_order_status(db, order, OrderStatus.ACTIVE)
        try:
            from app.services.notification_service import create_notification
            create_notification(
                db, order.user,
                "Service option activated",
                f"{(order.configuration_payload or {}).get('display_name') or 'Your option'} is now active on your service.",
                "success",
                f"/dashboard/server/{option.get('subscriptionId')}",
            )
        except Exception:
            pass

        # Invoice for the completed option purchase
        if not order.invoice:
            tax_type, hsn_code, place = gst_fields_for_user(db, order.user_id)
            invoice = Invoice(
                order_id=order.id,
                user_id=order.user_id,
                amount=order.customer_amount,
                tax_amount=order.tax_amount,
                tax_rate=order.tax_rate,
                tax_type=tax_type,
                hsn_code=hsn_code,
                place_of_supply=place,
                due_date=datetime.utcnow(),
                status=InvoiceStatus.PAID,
                currency=order.currency,
            )
            db.add(invoice)
            db.flush()
            invoice.invoice_number = generate_invoice_number(invoice)
            db.commit()

        return order

    except Exception as e:
        logger.exception(f"Service-option order {order.id} failed: {e}")
        _ensure_invoice_and_subscription(db, order)
        _update_order_status(db, order, OrderStatus.PROVISIONING_FAILED, str(e))
        log_ovh_step(db, order.id, "OPTION_ORDER_FAILED", "", {}, {}, is_success=False, error_message=str(e))
        raise


def _complete_provisioning(db: Session, ovh: OvhClient, order: CustomerOrder, plan: PlanCatalog, ovh_order_id: int) -> None:
    """Poll OVH for the delivered service and create the subscription + paid invoice."""
    service_name = _poll_for_service_name(ovh, plan.category, ovh_order_id)
    creds = _extract_service_credentials(ovh, plan.category, service_name) if service_name else {}
    config = order.configuration_payload or {}

    cycle_days, billing_cycle = _duration_to_cycle(order.duration_label)

    subscription = Subscription(
        order_id=order.id,
        user_id=order.user_id,
        ovh_resource_id=service_name,
        service_name=service_name,
        display_name=config.get("display_name"),
        plan_code=order.plan_code,
        category=order.category,
        ip_address=creds.get("ip_address"),
        root_user=creds.get("root_user") or ("root" if order.category in (ServiceCategory.VPS, ServiceCategory.DEDICATED) else None),
        root_password=creds.get("root_password"),
        os_template=config.get("os") or "ubuntu_2204",
        datacenter=creds.get("datacenter"),
        status=SubscriptionStatus.ACTIVE if service_name else SubscriptionStatus.PENDING,
        billing_cycle=billing_cycle,
        auto_renew=True,
        next_bill_date=datetime.utcnow() + timedelta(days=cycle_days),
        price_amount=order.customer_amount,
        currency=order.currency,
    )
    db.add(subscription)
    _update_order_status(db, order, OrderStatus.ACTIVE)
    log_ovh_step(db, order.id, "CREATE_SUBSCRIPTION", f"service/{service_name}", {}, {"service_name": service_name, "subscription_id": subscription.id})

    # Create invoice
    if not order.invoice:
        tax_type, hsn_code, place = gst_fields_for_user(db, order.user_id)
        invoice = Invoice(
            order_id=order.id,
            user_id=order.user_id,
            amount=order.customer_amount,
            tax_amount=order.tax_amount,
            tax_rate=order.tax_rate,
            tax_type=tax_type,
            hsn_code=hsn_code,
            place_of_supply=place,
            due_date=datetime.utcnow(),
            status=InvoiceStatus.PAID,
            currency=order.currency,
        )
        db.add(invoice)
        db.flush()
        invoice.invoice_number = generate_invoice_number(invoice)
        db.commit()


def _resume_service_option_order(db: Session, ovh: OvhClient, order: CustomerOrder, ovh_order_id: int) -> bool:
    """Resume a paid service-option order (upgrade/disk/backup) — no provisioning needed,
    just mark the subscription change + invoice once upstream payment landed."""
    cfg = order.configuration_payload or {}
    option = cfg.get("service_option") or {}
    try:
        ovh_order = ovh.get(f"/me/order/{ovh_order_id}")
    except Exception as e:
        raise ValueError(f"upstream order {ovh_order_id} unreadable: {e}")
    if not ovh_order or not isinstance(ovh_order, dict):
        raise ValueError(f"upstream order {ovh_order_id} no longer exists")
    try:
        status = (ovh.get(f"/me/order/{ovh_order_id}/status") or "").lower()
    except Exception:
        status = ""
    if status == "cancelled":
        raise ValueError(f"upstream order {ovh_order_id} was cancelled")

    paid = status in ("delivered", "validated") or _pay_ovh_order(db, ovh, order, ovh_order_id)
    if not paid:
        _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED, "Waiting for OVH payment; no registered payment method available")
        return True

    sub = db.query(Subscription).filter(Subscription.id == option.get("subscriptionId")).first()
    if sub:
        if option.get("kind") == "upgrade" and option.get("planCode"):
            sub.plan_code = option["planCode"]
        sub.updated_at = func.now()
        db.commit()
    _update_order_status(db, order, OrderStatus.ACTIVE)

    if not order.invoice:
        tax_type, hsn_code, place = gst_fields_for_user(db, order.user_id)
        invoice = Invoice(
            order_id=order.id, user_id=order.user_id,
            amount=order.customer_amount, tax_amount=order.tax_amount, tax_rate=order.tax_rate,
            tax_type=tax_type, hsn_code=hsn_code, place_of_supply=place,
            due_date=datetime.utcnow(), status=InvoiceStatus.PAID, currency=order.currency,
        )
        db.add(invoice)
        db.flush()
        invoice.invoice_number = generate_invoice_number(invoice)
        db.commit()
    return True


def _resume_existing_ovh_order(db: Session, ovh: OvhClient, order: CustomerOrder, plan: PlanCatalog, ovh_order_id: int) -> bool:
    """Continue from an already-placed upstream order instead of placing a new one.

    Returns True when the order was handled (paid + provisioned or still waiting on
    upstream payment). Raises ValueError when the upstream order is gone so the
    caller can fall back to a fresh cart checkout.
    """
    try:
        ovh_order = ovh.get(f"/me/order/{ovh_order_id}")
    except Exception as e:
        raise ValueError(f"upstream order {ovh_order_id} unreadable: {e}")
    if not ovh_order or not isinstance(ovh_order, dict):
        raise ValueError(f"upstream order {ovh_order_id} no longer exists")

    try:
        status = (ovh.get(f"/me/order/{ovh_order_id}/status") or "").lower()
    except Exception:
        status = ""

    if status == "cancelled":
        raise ValueError(f"upstream order {ovh_order_id} was cancelled")

    # Try paying it if it still needs payment (manager may have already paid it).
    paid = status in ("delivered", "validated")
    if not paid:
        paid = _pay_ovh_order(db, ovh, order, ovh_order_id)

    if not paid:
        _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED, "Waiting for OVH payment; no registered payment method available")
        return True

    if order.status != OrderStatus.OVH_PAID:
        _update_order_status(db, order, OrderStatus.OVH_PAID)
    _update_order_status(db, order, OrderStatus.PROVISIONING)
    _complete_provisioning(db, ovh, order, plan, ovh_order_id)
    return True


def reconcile_provider_order(db: Session, ovh: OvhClient, order: CustomerOrder) -> str:
    """Maintenance-safe resume for orders stuck at OVH_ORDER_PLACED/OVH_PAID.

    Only acts on the EXISTING upstream order — never creates a new cart/order, so a
    cron run can never surprise-spend account balance. Returns the resulting action.
    """
    try:
        ovh_order_id = int(order.ovh_order_id)
    except (TypeError, ValueError):
        _update_order_status(db, order, OrderStatus.FAILED, f"Invalid upstream order id {order.ovh_order_id!r}")
        return "failed-invalid-id"

    is_option = bool((order.configuration_payload or {}).get("service_option"))
    try:
        if is_option:
            _resume_service_option_order(db, ovh, order, ovh_order_id)
        else:
            plan = db.query(PlanCatalog).filter(PlanCatalog.plan_code == order.plan_code).first()
            if not plan:
                _update_order_status(db, order, OrderStatus.FAILED, "Plan no longer in catalog")
                return "failed-no-plan"
            _resume_existing_ovh_order(db, ovh, order, plan, ovh_order_id)
        return order.status.value
    except ValueError:
        # upstream order gone/cancelled — mark failed and alert admin
        _update_order_status(db, order, OrderStatus.FAILED, f"Upstream OVH order {ovh_order_id} no longer exists or was cancelled")
        try:
            log_ovh_step(db, order.id, "RECONCILE_DEAD_END", f"/me/order/{ovh_order_id}", {}, {}, is_success=False,
                         error_message="upstream order missing/cancelled")
        except Exception:
            pass
        try:
            from app.models.models import EmailLog
            already_alerted = db.query(EmailLog).filter(
                EmailLog.subject.like(f"%{order.id[:8]}%"),
            ).first()
            if not already_alerted:
                send_admin_fulfillment_email(
                    db, order,
                    f"Upstream order {ovh_order_id} is gone/cancelled — customer paid {order.currency} {order.customer_amount}. "
                    "Refund or place the order manually in the OVH manager, then mark the order accordingly.")
        except Exception:
            pass
        return "failed-upstream-gone"


def kickoff_after_payment(db: Session, order: CustomerOrder) -> None:
    """Route a paid order: pre-orders join the stock waitlist (WAITING_STOCK),
    normal orders go straight to background provisioning."""
    cfg = order.configuration_payload or {}
    if cfg.get("_preorder"):
        order.status = OrderStatus.WAITING_STOCK
        db.commit()
        try:
            from app.services.notification_service import create_notification
            dc = cfg.get("datacenter") or cfg.get("vps_datacenter") or "the selected location"
            label = cfg.get("display_name") or order.plan_code or "your plan"
            create_notification(db, order.user, "Pre-booking confirmed",
                f"{label} is booked for {dc}. It will activate automatically when stock returns.", "info", "/dashboard")
        except Exception:
            pass
        try:
            send_preorder_received_email(db, order)
        except Exception:
            logger.exception(f"Preorder received email failed for {order.id}")
        return
    order.status = OrderStatus.PROVISIONING
    db.commit()
    spawn_provisioning(order.id)


def send_preorder_received_email(db: Session, order: CustomerOrder) -> None:
    from app.services.email_service import send_email, render_email, _fmt_money, _safe_subject
    cfg = order.configuration_payload or {}
    dc = cfg.get("datacenter") or cfg.get("vps_datacenter") or "-"
    label = cfg.get("display_name") or order.plan_code or "VPS"
    fee = cfg.get("_preorder_fee") or 0
    user = order.user
    if not user or not getattr(user, "email", None):
        return
    html = render_email(
        preheader=f"Pre-booking received for order #{order.id[:8]}",
        heading="Pre-booking confirmed",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your <strong>{label}</strong> is reserved for datacenter <strong>{dc}</strong>. "
            "That location is out of stock right now — your server will be provisioned "
            "automatically as soon as stock opens, and you hold first priority in the queue.",
            "If it does not become available within 30 days, the full amount is refunded "
            "to your GHC wallet automatically.",
        ],
        details=[
            ("Order #", order.id[:8]),
            ("Plan", label),
            ("Location", dc),
            ("Paid", _fmt_money(order.customer_amount, order.currency)),
            ("Priority fee", _fmt_money(fee, order.currency)),
        ],
        cta_label="View Order",
        cta_url=f"{get_settings().site_url}/dashboard/orders/{order.id}",
    )
    send_email(db, user.email, f"Pre-booking confirmed — {label} @ {dc}", html)


def spawn_provisioning(order_id: str) -> None:
    """Run execute_checkout in a daemon thread with its own DB session.

    OVH delivery polling can take minutes — longer than the web tier's request
    timeout (Cloudflare ~100s). Callers return immediately; the order row shows
    PROVISIONING and the UI polls for the final state.
    """
    import threading

    def _run() -> None:
        from app.core.database import SessionLocal
        from app.services.ovh_client import get_ovh_client_from_db
        db = SessionLocal()
        try:
            ovh = get_ovh_client_from_db(db)
            execute_checkout(db, ovh, order_id)
        except Exception:
            logger.exception(f"Background provisioning failed for order {order_id}")
        finally:
            db.close()

    threading.Thread(target=_run, name=f"provision-{order_id[:8]}", daemon=True).start()


def execute_checkout(db: Session, ovh: OvhClient, order_id: str) -> CustomerOrder:
    """
    Full automated loop:
      1. Create cart
      2. Assign to account
      3. Add item
      4. Configure item
      5. Checkout -> OVH order
      6. Pay with fidelityAccount (prepaid wallet)
      7. Extract service details
    """
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    if order.status not in (
        OrderStatus.PENDING,
        OrderStatus.PAYMENT_RECEIVED,
        OrderStatus.OVH_CART_CREATED,
        OrderStatus.OVH_ORDER_PLACED,
        OrderStatus.OVH_PAID,
        OrderStatus.PROVISIONING,
        OrderStatus.PROVISIONING_FAILED,
        OrderStatus.FAILED,
        OrderStatus.WAITING_STOCK,
    ):
        raise ValueError(f"Order is in status {order.status.value}, cannot checkout")

    # Resume path — an upstream OVH order already exists (placed-but-unpaid).
    # Pay/poll that order instead of creating a second cart/order upstream.
    if order.ovh_order_id:
        is_option = bool((order.configuration_payload or {}).get("service_option"))
        plan = db.query(PlanCatalog).filter(PlanCatalog.plan_code == order.plan_code).first() if not is_option else None
        try:
            handled = (
                _resume_service_option_order(db, ovh, order, int(order.ovh_order_id))
                if is_option else
                plan is not None and _resume_existing_ovh_order(db, ovh, order, plan, int(order.ovh_order_id))
            )
            if handled:
                return order
        except ValueError as e:
            # upstream order no longer usable — start over
            logger.info(f"Cannot resume OVH order {order.ovh_order_id}: {e}; starting over")
            order.ovh_order_id = None
            order.ovh_order_url = None
            db.commit()

    # Service-option orders (VPS upgrade / additional disk / automated backup on an
    # existing service) follow a dedicated provisioning path — no cart checkout.
    if (order.configuration_payload or {}).get("service_option"):
        return execute_service_option_order(db, ovh, order)

    plan = db.query(PlanCatalog).filter(PlanCatalog.plan_code == order.plan_code).first()
    if not plan:
        _update_order_status(db, order, OrderStatus.FAILED, "Plan not found in catalog")
        raise ValueError("Plan not found in catalog")

    duration = db.query(PlanDuration).filter(
        PlanDuration.plan_code == order.plan_code,
        PlanDuration.duration_label == order.duration_label,
    ).first()
    if not duration:
        _update_order_status(db, order, OrderStatus.FAILED, "Duration not found")
        raise ValueError("Duration not found")

    config = order.configuration_payload or {}

    try:
        # 1. Create cart
        cart = ovh.create_cart(description=f"BelieVoo order {order.id}")
        order.ovh_cart_id = cart.get("cartId")
        _update_order_status(db, order, OrderStatus.OVH_CART_CREATED)
        log_ovh_step(db, order.id, "CREATE_CART", "/order/cart", {}, cart)

        # 2. Assign cart
        ovh.assign_cart(order.ovh_cart_id)
        log_ovh_step(db, order.id, "ASSIGN_CART", f"/order/cart/{order.ovh_cart_id}/assign", {}, {})

        # 3. Add item
        segment = CART_ADD_SEGMENT.get(plan.category)
        if not segment:
            raise ValueError(f"Unsupported category for cart: {plan.category.value}")

        is_pcc_host = (
            plan.category == ServiceCategory.PRIVATE_CLOUD
            and order.plan_code.startswith("pcc-")
        )
        if is_pcc_host:
            # Private Cloud hosts/options attach to the base service pack —
            # order `private_cloud` first, then attach the chosen SKU.
            pack_payload = _build_add_item_payload("private_cloud", duration, plan.category, config)
            pack_item = ovh.add_item_to_cart(order.ovh_cart_id, segment, pack_payload)
            item_id = pack_item.get("itemId")
            log_ovh_step(db, order.id, "ADD_ITEM", f"/order/cart/{order.ovh_cart_id}/{segment}", pack_payload, pack_item)

            option_payload = {
                "planCode": order.plan_code,
                "duration": f"P{duration.interval}{duration.interval_unit[0].upper()}",
                "pricingMode": "default",
                "quantity": 1,
            }
            option = ovh.add_item_option(order.ovh_cart_id, segment, item_id, option_payload)
            all_item_ids = [item_id, option.get("itemId")]
            log_ovh_step(
                db, order.id, "ADD_OPTION", f"/order/cart/{order.ovh_cart_id}/{segment}/options",
                {"itemId": item_id, "planCode": order.plan_code}, option,
            )
        else:
            add_payload = _build_add_item_payload(order.plan_code, duration, plan.category, config)
            item = ovh.add_item_to_cart(order.ovh_cart_id, segment, add_payload)
            item_id = item.get("itemId")
            log_ovh_step(db, order.id, "ADD_ITEM", f"/order/cart/{order.ovh_cart_id}/{segment}", add_payload, item)

            # 4. Add mandatory addon options (e.g. OS, backup, storage)
            all_item_ids = _add_mandatory_options(db, ovh, order, item_id, segment, plan, duration, config)

        # 5. Configure parent item
        #    vps_datacenter/vps_os and other required labels are handled below
        #    by _build_required_configurations().

        # For domains, default contact fields to the OVH account nichandle
        if plan.category == ServiceCategory.DOMAINS:
            try:
                me = ovh.get_me()
                config = {**config, "nichandle": me.get("nichandle")}
            except Exception:
                pass

        # Configure required/optional labels for the parent item
        for cfg in _build_required_configurations(plan, config):
            ovh.configure_cart_item(order.ovh_cart_id, item_id, cfg["label"], cfg["value"])
            log_ovh_step(
                db, order.id, "CONFIGURE_ITEM",
                f"/order/cart/{order.ovh_cart_id}/item/{item_id}/configuration",
                cfg, {},
            )

        # 5. Checkout (dry run first, then real).
        #    Try auto-pay with the account's preferred payment method first —
        #    a registered default card makes the OVH order paid in one step.
        #    Fall back to a manual-payment order if auto-pay is not allowed.
        dry_checkout = ovh.get_cart_checkout(order.ovh_cart_id)
        log_ovh_step(db, order.id, "DRY_CHECKOUT", f"/order/cart/{order.ovh_cart_id}/checkout", {}, dry_checkout)

        auto_paid = False
        try:
            checkout = ovh.post_cart_checkout(order.ovh_cart_id, auto_pay_with_preferred_payment_mean=True)
            auto_paid = True
        except Exception as e:
            logger.warning(f"Auto-pay checkout failed ({e}); retrying manual checkout")
            log_ovh_step(db, order.id, "CHECKOUT_AUTOPAY_FAILED", f"/order/cart/{order.ovh_cart_id}/checkout", {}, {"error": str(e)})
            checkout = ovh.post_cart_checkout(order.ovh_cart_id, auto_pay_with_preferred_payment_mean=False)

        ovh_order_id = checkout.get("orderId")
        order.ovh_order_id = str(ovh_order_id)
        order.ovh_order_url = checkout.get("url")
        _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED)
        log_ovh_step(db, order.id, "CHECKOUT", f"/order/cart/{order.ovh_cart_id}/checkout", {"autoPay": auto_paid}, checkout)

        # 6. Try to pay OVH order using an available registered payment mean.
        #    If none, leave it unpaid and let the admin/customer pay via ovh_order_url.
        if auto_paid:
            paid = True
            order.ovh_payment_mean = "default"
            _update_order_status(db, order, OrderStatus.OVH_PAID)
        else:
            paid = _pay_ovh_order(db, ovh, order, int(ovh_order_id))

        if not paid:
            _update_order_status(db, order, OrderStatus.OVH_ORDER_PLACED, "Waiting for OVH payment; no registered payment method available")
            try:
                send_admin_fulfillment_email(db, order, f"OVH order {ovh_order_id} placed but unpaid — pay upstream via {order.ovh_order_url or 'manager'}, then retry provisioning")
            except Exception:
                logger.exception("Admin fulfillment email failed")
            # Return early; provisioning will happen after admin/customer completes OVH payment and retries.
            return order

        # 7. Poll for real serviceName and create subscription
        _update_order_status(db, order, OrderStatus.PROVISIONING)
        _complete_provisioning(db, ovh, order, plan, int(ovh_order_id))

        return order

    except Exception as e:
        logger.exception(f"Checkout failed for order {order_id}: {e}")
        _ensure_invoice_and_subscription(db, order)
        _update_order_status(db, order, OrderStatus.PROVISIONING_FAILED, str(e))
        log_ovh_step(db, order.id, "CHECKOUT_FAILED", "", {}, {}, is_success=False, error_message=str(e))
        try:
            reason = f"OVH checkout/provisioning error: {e}"
            if "not allowed" in str(e).lower():
                reason += (" — account-level block: check the default OVH payment method is valid "
                           "(card expiry) at /api/admin/ovh-account-health, or order manually via manager")
            send_admin_fulfillment_email(db, order, reason)
        except Exception:
            logger.exception("Admin fulfillment email failed")
        raise


def fulfill_cart_orders(db: Session, tx) -> None:
    """Mark every order in a CART payment as paid and kick off provisioning.
    Shared by the wallet cart path and gateway webhooks/fulfillment."""
    meta = tx.payment_metadata or {}
    order_ids = meta.get("orderIds") or []
    for oid in order_ids:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == oid).first()
        if not order or order.status != OrderStatus.PENDING:
            continue
        order.status = OrderStatus.PAYMENT_RECEIVED
        db.commit()
        try:
            if order.user:
                send_order_payment_email(db, order, order.user)
        except Exception:
            pass
        try:
            kickoff_after_payment(db, order)
        except Exception:
            logger.exception(f"Cart order {order.id} provisioning kickoff failed")


def pay_order_with_wallet(db: Session, user_id: str, order_id: str) -> CustomerOrder:
    """Pay a pending order from user's internal wallet balance."""
    order = db.query(CustomerOrder).filter(
        CustomerOrder.id == order_id, CustomerOrder.user_id == user_id
    ).with_for_update().first()
    if not order:
        raise ValueError("Order not found")
    if order.status != OrderStatus.PENDING:
        raise ValueError(f"Order is already in status {order.status.value}")

    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).with_for_update().first()
    if not wallet:
        wallet = get_or_create_wallet(db, user_id, currency="INR")

    # Wallet is always in INR; convert order amount if needed
    order_currency = (order.currency or get_settings().currency or "USD").upper()
    if order_currency == wallet.currency:
        wallet_deduction = order.customer_amount
    else:
        wallet_deduction = convert(db, order.customer_amount, order_currency, wallet.currency, strict=True)

    if wallet.balance < wallet_deduction:
        raise ValueError(f"Insufficient wallet balance: {wallet.balance} {wallet.currency} < {wallet_deduction} {wallet.currency}")

    wallet.balance -= wallet_deduction
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.PAYMENT,
        amount=-wallet_deduction,
        description=f"Payment for order {order.id}",
        metadata={"order_currency": order_currency, "order_amount": order.customer_amount, "deducted": wallet_deduction, "wallet_currency": wallet.currency},
    ))

    order.status = OrderStatus.PAYMENT_RECEIVED
    db.commit()
    db.refresh(order)
    try:
        if order.user:
            send_order_payment_email(db, order, order.user)
    except Exception:
        logger.exception("Order payment email failed")
    return order


# ---------- Pre-order / stock waitlist ----------

def _preorder_dc(order: CustomerOrder) -> Optional[str]:
    cfg = order.configuration_payload or {}
    dc = cfg.get("datacenter") or cfg.get("vps_datacenter")
    return str(dc).upper() if dc else None


def _preorder_os_family(order: CustomerOrder) -> str:
    cfg = order.configuration_payload or {}
    img = str(cfg.get("os") or cfg.get("vps_os") or cfg.get("image") or "")
    return "windows" if "windows" in img.lower() else "linux"


def _refund_preorder(db: Session, order: CustomerOrder) -> None:
    """Full wallet refund for an expired/failed pre-order."""
    from app.services.wallet_service import credit_wallet
    from app.services.email_service import render_email, send_email, _fmt_money, _safe_subject
    cfg = order.configuration_payload or {}
    label = cfg.get("display_name") or order.plan_code or "VPS"
    credit_wallet(
        db, order.user_id, order.customer_amount,
        description=f"Auto-refund: pre-order {order.id[:8]} — {label} never came back in stock",
        metadata={"type": "PREORDER_REFUND", "order_id": order.id, "order_currency": order.currency},
        currency=order.currency,
    )
    order.status = OrderStatus.REFUNDED
    db.commit()
    try:
        from app.services.notification_service import create_notification
        create_notification(db, order.user, "Pre-booking refunded",
            f"Your {label} pre-booking expired — {_fmt_money(order.customer_amount, order.currency)} was refunded to your wallet.",
            "info", "/dashboard/wallet")
    except Exception:
        pass
    try:
        user = order.user
        if user and getattr(user, "email", None):
            html = render_email(
                preheader=f"Refund for pre-order #{order.id[:8]}",
                heading="Pre-booking refunded",
                paragraphs=[
                    f"Hi {_safe_subject(user.name)},",
                    f"Your <strong>{label}</strong> pre-booking at <strong>{_preorder_dc(order) or '-'}</strong> "
                    "did not come back in stock within the waiting period. The full amount has been "
                    "refunded to your GHC wallet.",
                    "You can re-book whenever the location opens again — availability changes daily.",
                ],
                details=[
                    ("Order #", order.id[:8]),
                    ("Plan", label),
                    ("Refunded", _fmt_money(order.customer_amount, order.currency)),
                ],
                cta_label="View Wallet",
                cta_url=f"{get_settings().site_url}/dashboard/wallet",
            )
            send_email(db, user.email, f"Refund issued — pre-order #{order.id[:8]}", html)
    except Exception:
        logger.exception(f"Preorder refund email failed for {order.id}")


def preorder_tick(db: Session) -> Dict[str, int]:
    """One watcher cycle: refund expired pre-orders, then fulfill the earliest
    eligible order per plan whose DC+OS family is back in stock at OVH.

    Fulfillment spawns the normal provisioning thread — OVH stock is NOT
    reserved for us, so execute_checkout can still lose the race; failed
    attempts roll back into the queue (max 3 attempts before admin review).
    """
    from app.services.catalog_service import get_preorder_settings
    from app.routers.compat import _vps_dc_availability, _ded_dc_availability

    stats = {"refunded": 0, "queued": 0, "kicked": 0, "requeued": 0}
    ps = get_preorder_settings(db)

    waiting = db.query(CustomerOrder).filter(
        CustomerOrder.status == OrderStatus.WAITING_STOCK,
    ).order_by(CustomerOrder.created_at.asc()).all()
    stats["queued"] = len(waiting)

    # 1) Expiry refunds — even if preorders are disabled, existing ones must refund.
    cutoff = datetime.utcnow() - timedelta(days=int(ps.get("refundDays") or 30))
    for order in list(waiting):
        if order.created_at and order.created_at < cutoff:
            try:
                _refund_preorder(db, order)
                stats["refunded"] += 1
            except Exception:
                logger.exception(f"Preorder refund failed for {order.id}")
    waiting = [o for o in waiting if o.status == OrderStatus.WAITING_STOCK]

    if not ps.get("enabled", True) or not waiting:
        return stats

    # 2) Retry failed attempts (OVH lost the stock race) — up to 3 tries.
    failed = db.query(CustomerOrder).filter(
        CustomerOrder.status == OrderStatus.PROVISIONING_FAILED,
    ).order_by(CustomerOrder.created_at.asc()).all()
    for order in failed:
        cfg = dict(order.configuration_payload or {})
        if not cfg.get("_preorder"):
            continue
        attempts = int(cfg.get("_preorder_attempts") or 0)
        if attempts < 3:
            cfg["_preorder_attempts"] = attempts
            order.configuration_payload = cfg
            order.status = OrderStatus.WAITING_STOCK
            db.commit()
            waiting.append(order)
            stats["requeued"] += 1

    # 3) Per-plan stock probe; fulfill at most ONE order per plan+cycle — the
    # next cycle re-probes, so we never race ourselves for a single unit.
    by_plan: Dict[str, List[CustomerOrder]] = {}
    for order in sorted(waiting, key=lambda o: o.created_at or datetime.utcnow()):
        by_plan.setdefault(order.plan_code or "", []).append(order)

    for plan_code, orders in by_plan.items():
        plan_row = db.query(PlanCatalog).filter(PlanCatalog.plan_code == plan_code).first()
        is_ded = bool(plan_row and plan_row.category == ServiceCategory.DEDICATED)
        # Dedicated stock comes from the public datacenter-availabilities feed
        # (status=available for any delivery time); VPS uses the order-rule API.
        avail = _ded_dc_availability(plan_code) if is_ded else _vps_dc_availability(plan_code)
        if not avail:
            continue
        kicked_dc = set()
        for order in orders:
            dc = _preorder_dc(order)
            if not dc or dc in kicked_dc:
                continue
            if is_ded:
                info = avail.get(str(dc)) or avail.get(str(dc).lower())
                st = "available" if (info or {}).get("status") == "available" else None
            else:
                fam = _preorder_os_family(order)
                st = (avail.get(dc) or {}).get("linuxStatus" if fam == "linux" else "windowsStatus")
            if st != "available":
                continue
            cfg = dict(order.configuration_payload or {})
            cfg["_preorder_attempts"] = int(cfg.get("_preorder_attempts") or 0) + 1
            cfg["_preorder_stock_detected_at"] = datetime.utcnow().isoformat()
            order.configuration_payload = cfg
            order.status = OrderStatus.PROVISIONING
            db.commit()
            logger.info(f"Preorder stock detected: order {order.id} plan {plan_code} dc {dc} ({fam}) — provisioning")
            try:
                spawn_provisioning(order.id)
                stats["kicked"] += 1
                kicked_dc.add(dc)
            except Exception:
                logger.exception(f"Preorder provisioning kickoff failed for {order.id}")
                order.status = OrderStatus.WAITING_STOCK
                cfg["_preorder_attempts"] -= 1
                order.configuration_payload = cfg
                db.commit()
    return stats
