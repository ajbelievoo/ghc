import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.models import (
    BillingCycle,
    CustomerOrder,
    OvhOrderLog,
    OrderStatus,
    ServiceCategory,
    Subscription,
    SubscriptionStatus,
)
from app.services.ovh_client import OvhClient, get_ovh_client_from_db, log_ovh_step

logger = logging.getLogger(__name__)


def get_user_subscriptions(db: Session, user_id: str) -> list[Subscription]:
    return db.query(Subscription).filter(Subscription.user_id == user_id).order_by(Subscription.created_at.desc()).all()


def get_subscription(db: Session, user_id: str, subscription_id: str) -> Optional[Subscription]:
    return db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == user_id,
    ).first()


def get_any_subscription(db: Session, subscription_id: str) -> Optional[Subscription]:
    return db.query(Subscription).filter(
        Subscription.id == subscription_id,
    ).first()


def _get_real_resource_id(sub: Subscription) -> Optional[str]:
    """Return the actual OVH service name if available."""
    return sub.service_name or sub.ovh_resource_id


def _log_action(db: Session, sub: Subscription, action: str, success: bool, error: Optional[str] = None):
    log_ovh_step(
        db,
        sub.order_id or sub.id,
        f"LIFECYCLE_{action.upper()}",
        f"service/{sub.service_name}",
        {"action": action},
        {"success": success},
        is_success=success,
        error_message=error,
    )


def perform_power_action(db: Session, ovh: OvhClient, sub: Subscription, action: str) -> Dict[str, Any]:
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached to subscription")

    try:
        if sub.category == ServiceCategory.VPS:
            if action == "reboot":
                ovh.reboot_vps(resource_id)
            elif action == "shutdown":
                ovh.halt_vps(resource_id)
            elif action == "start":
                ovh.start_vps(resource_id)
            else:
                raise ValueError(f"Unsupported VPS action: {action}")
        elif sub.category == ServiceCategory.DEDICATED:
            if action == "reboot":
                ovh.reboot_dedicated(resource_id)
            elif action == "shutdown":
                ovh.request("POST", f"/dedicated/server/{resource_id}/reboot", monitoring=False)
            elif action == "start":
                raise ValueError("Dedicated servers do not support explicit start via OVH API")
            else:
                raise ValueError(f"Unsupported dedicated action: {action}")
        else:
            raise ValueError(f"Power actions not supported for category {sub.category.value}")

        _log_action(db, sub, action, True)
        return {"success": True, "action": action, "resource_id": resource_id}
    except Exception as e:
        _log_action(db, sub, action, False, str(e))
        raise


def lifecycle_action(db: Session, ovh: OvhClient, sub: Subscription, action: str) -> Subscription:
    updates = {}
    resource_id = _get_real_resource_id(sub)

    if action == "renew":
        cycle_days = 30
        if sub.billing_cycle == BillingCycle.YEARLY:
            cycle_days = 365
        elif sub.billing_cycle == BillingCycle.QUARTERLY:
            cycle_days = 90
        updates = {
            "next_bill_date": datetime.utcnow() + timedelta(days=cycle_days),
            "status": SubscriptionStatus.ACTIVE,
        }

    elif action == "suspend":
        updates = {"status": SubscriptionStatus.SUSPENDED}
        if resource_id and sub.category in (ServiceCategory.VPS, ServiceCategory.DEDICATED):
            try:
                perform_power_action(db, ovh, sub, "shutdown")
            except Exception as e:
                logger.warning(f"Suspend power action failed: {e}")

    elif action == "unsuspend":
        updates = {"status": SubscriptionStatus.ACTIVE}
        if resource_id and sub.category == ServiceCategory.VPS:
            try:
                perform_power_action(db, ovh, sub, "start")
            except Exception as e:
                logger.warning(f"Unsuspend power action failed: {e}")

    elif action in ("terminate", "cancel"):
        updates = {"status": SubscriptionStatus.TERMINATED, "auto_renew": False}
        if resource_id:
            try:
                ovh.terminate_service(resource_id)
            except Exception as e:
                logger.warning(f"Terminate service failed: {e}")

    else:
        raise ValueError(f"Unknown lifecycle action: {action}")

    for key, value in updates.items():
        setattr(sub, key, value)
    sub.updated_at = func.now()
    db.commit()
    db.refresh(sub)
    return sub


def reinstall_os(db: Session, ovh: OvhClient, sub: Subscription, os_template: str, ssh_key_name: Optional[str] = None) -> Dict[str, Any]:
    """Request OS reinstallation on VPS or dedicated server."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached to subscription")

    if sub.category not in (ServiceCategory.VPS, ServiceCategory.DEDICATED):
        raise ValueError("OS reinstall only supported for VPS and Dedicated servers")

    # Resolve the account SSH key for injection (VPS wants the raw key,
    # dedicated install wants the key *name* registered under /me/sshKey).
    vps_pubkey = None
    if ssh_key_name:
        try:
            k = ovh.get(f"/me/sshKey/{ssh_key_name}") or {}
            vps_pubkey = k.get("key")
        except Exception as e:
            raise ValueError(f"SSH key '{ssh_key_name}' not found on account: {e}")

    try:
        if sub.category == ServiceCategory.VPS:
            # OVH VPS reinstall: POST /vps/{serviceName}/reinstall
            payload: Dict[str, Any] = {"doNotSendPassword": False}
            if vps_pubkey:
                payload["publicSshKey"] = vps_pubkey
            ovh.request("POST", f"/vps/{resource_id}/reinstall", **payload)
        elif sub.category == ServiceCategory.DEDICATED:
            # OVH Dedicated reinstall: task-based
            payload = {"templateName": os_template}
            if ssh_key_name:
                payload["sshKeyName"] = ssh_key_name
            ovh.request("POST", f"/dedicated/server/{resource_id}/install/start", **payload)

        sub.os_template = os_template
        sub.updated_at = func.now()
        db.commit()
        _log_action(db, sub, f"reinstall_{os_template}", True)
        return {"success": True, "resource_id": resource_id, "os_template": os_template}
    except Exception as e:
        _log_action(db, sub, "reinstall", False, str(e))
        raise


def get_service_metrics(ovh: OvhClient, sub: Subscription, db: Optional[Any] = None) -> Optional[Dict[str, Any]]:
    """Fetch live metrics from the provider if available.

    OVH does not expose real-time CPU/RAM usage for many current VPS/dedicated
    ranges without an agent (RTM). Delegates to metrics_service when a db
    session is supplied (Proxmox config + negative caching live there);
    otherwise returns None so callers show a "monitoring not available" state.
    """
    if db is not None:
        from app.services import metrics_service
        return metrics_service.fetch_live_metrics(db, ovh, sub)
    return None


def _ip_info(ovh: OvhClient, ip: str) -> Dict[str, Any]:
    """Fetch OVH IP details (reverse, type, routedTo)."""
    try:
        data = ovh.get(f"/ip/{ip}")
        return {
            "ip": data.get("ip"),
            "version": data.get("version"),
            "type": data.get("type"),
            "isAdditionalIp": data.get("isAdditionalIp"),
            "routedTo": data.get("routedTo", {}).get("serviceName"),
            "reverseDns": data.get("description"),
            "region": data.get("regions", [None])[0],
            "country": data.get("country"),
        }
    except Exception as e:
        return {"ip": ip, "error": str(e)}


def _vps_network(ovh: OvhClient, service_name: str, primary_ip: Optional[str]) -> Dict[str, Any]:
    """Build network details for a VPS."""
    try:
        ips = ovh.get_vps_ips(service_name) or []
    except Exception:
        ips = []
    ipv4 = primary_ip
    ipv6 = None
    for ip in ips:
        if isinstance(ip, str):
            if ":" in ip and not ipv6:
                ipv6 = ip
            elif "." in ip and not ipv4:
                ipv4 = ip
        else:
            addr = ip.get("ip") or ip.get("ipAddress")
            if addr:
                if ":" in addr and not ipv6:
                    ipv6 = addr
                elif "." in addr and not ipv4:
                    ipv4 = addr
    details = {
        "ipv4": ipv4,
        "ipv6": ipv6,
        "gateway": None,
        "reverseDns": None,
    }
    if ipv4:
        info = _ip_info(ovh, ipv4)
        details["reverseDns"] = info.get("reverseDns")
    return details


def _dedicated_network(ovh: OvhClient, service_name: str, primary_ip: Optional[str]) -> Dict[str, Any]:
    """Build network details for a dedicated server."""
    try:
        ips = ovh.get(f"/dedicated/server/{service_name}/ips") or []
    except Exception:
        ips = []
    if not ips and primary_ip:
        ips = [primary_ip]
    ipv4 = primary_ip
    ipv6 = None
    for ip in ips:
        addr = ip.get("ip") if isinstance(ip, dict) else ip
        if not addr:
            continue
        if ":" in str(addr) and not ipv6:
            ipv6 = str(addr).split("/")[0]
        elif "." in str(addr) and not ipv4:
            ipv4 = str(addr).split("/")[0]
    info = _ip_info(ovh, primary_ip) if primary_ip else {}

    gateway4 = None
    gateway6 = None
    try:
        specs = ovh.get(f"/dedicated/server/{service_name}/specifications/network")
        routing = specs.get("routing") or {}
        gateway4 = (routing.get("ipv4") or {}).get("gateway")
        gateway6 = (routing.get("ipv6") or {}).get("gateway")
    except Exception:
        pass

    return {
        "ipv4": primary_ip,
        "ipv6": ipv6,
        "gateway": gateway4,
        "ipv6Gateway": gateway6,
        "reverseDns": info.get("reverseDns") or (primary_ip if primary_ip else None),
        "mac": None,
        "ips": ips,
    }


def _service_info(ovh: OvhClient, category: ServiceCategory, service_name: str) -> Dict[str, Any]:
    """Fetch serviceInfos for a VPS or dedicated server."""
    family = "vps" if category == ServiceCategory.VPS else "dedicated/server"
    try:
        info = ovh.get(f"/{family}/{service_name}/serviceInfos")
        return {
            "serviceId": info.get("serviceId"),
            "status": info.get("status"),
            "creation": info.get("creation"),
            "expiration": info.get("expiration"),
            "renewalType": info.get("renewalType"),
            "canDeleteAtExpiration": info.get("canDeleteAtExpiration"),
            "renew": info.get("renew"),
            "contactAdmin": info.get("contactAdmin"),
            "contactTech": info.get("contactTech"),
            "contactBilling": info.get("contactBilling"),
        }
    except Exception as e:
        return {"error": str(e)}


def _recent_tasks(ovh: OvhClient, category: ServiceCategory, service_name: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Fetch recent tasks for a service."""
    family = "vps" if category == ServiceCategory.VPS else "dedicated/server"
    try:
        task_ids = ovh.get(f"/{family}/{service_name}/task")[:limit]
        tasks = []
        for tid in task_ids:
            try:
                t = ovh.get(f"/{family}/{service_name}/task/{tid}")
                tasks.append({
                    "id": t.get("taskId") or t.get("id"),
                    "function": t.get("function"),
                    "status": t.get("status"),
                    "comment": t.get("comment"),
                    "doneDate": t.get("doneDate"),
                    "lastUpdate": t.get("lastUpdate"),
                })
            except Exception:
                pass
        return tasks
    except Exception:
        return []


def get_server_details(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Fetch rich OVH service details for the client dashboard."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        return {}

    details: Dict[str, Any] = {
        "network": {},
        "location": {},
        "hardware": {},
        "security": {},
        "serviceInfo": _service_info(ovh, sub.category, resource_id),
        "tasks": _recent_tasks(ovh, sub.category, resource_id),
        "ipmi": {},
    }

    try:
        if sub.category == ServiceCategory.VPS:
            info = ovh.get_vps(resource_id)
            model = info.get("model") or {}
            details["hardware"] = {
                "vcores": info.get("vcore") or model.get("vcore"),
                "memoryMb": info.get("memoryLimit") or model.get("memory"),
                "diskGb": model.get("disk"),
                "model": model.get("name") or model.get("offer"),
                "offer": model.get("offer"),
                "version": model.get("version"),
                "os": sub.os_template or info.get("os"),
                "datacenters": model.get("datacenter") or [],
            }
            details["location"] = {
                "datacenter": info.get("datacenter") or (model.get("datacenter") or [None])[0],
                "region": info.get("zone"),
                "zone": info.get("zone"),
                "availabilityZone": info.get("availabilityZone"),
            }
            details["network"] = _vps_network(ovh, resource_id, sub.ip_address)
            details["security"] = {
                "monitoring": False,
                "proactiveIntervention": False,
                "ddosProtection": True,
                "firewall": False,
                "antiDDoS": "Automatic",
                "backupEnabled": False,
            }
            details["os"] = {
                "name": sub.os_template or info.get("os"),
                "panel": None,
            }
            # Console URL if possible; do not call now to avoid POST side effects
            details["ipmi"] = {
                "consoleAvailable": True,
                "consoleType": "KVM (VNC)",
                "consoleUrl": None,
            }

        elif sub.category == ServiceCategory.DEDICATED:
            info = ovh.get_dedicated_server(resource_id)
            hw_specs = get_server_hardware_specs(ovh, sub)
            details["hardware"] = {
                "commercialRange": info.get("commercialRange"),
                "processorName": hw_specs.get("processorName"),
                "numberOfProcessors": hw_specs.get("numberOfProcessors"),
                "coresPerProcessor": hw_specs.get("coresPerProcessor"),
                "threadsPerProcessor": hw_specs.get("threadsPerProcessor"),
                "memoryMb": hw_specs.get("memorySizeMb"),
                "diskGroups": hw_specs.get("diskGroups") or [],
                "cpu": f"{hw_specs.get('numberOfProcessors') or 1} x {hw_specs.get('processorName') or info.get('commercialRange')}" if hw_specs.get('processorName') else info.get("commercialRange"),
                "ramGb": round((hw_specs.get("memorySizeMb") or 0) / 1024) if hw_specs.get("memorySizeMb") else None,
                "diskGb": None,
                "os": info.get("os"),
                "serverId": info.get("serverId"),
                "linkSpeed": info.get("linkSpeed"),
                "bootId": info.get("bootId"),
                "motherboard": hw_specs.get("motherboard"),
                "bootMode": hw_specs.get("bootMode"),
            }
            details["bandwidth"] = get_server_bandwidth(ovh, sub)
            details["location"] = {
                "datacenter": info.get("datacenter"),
                "region": info.get("region"),
                "zone": info.get("availabilityZone"),
                "availabilityZone": info.get("availabilityZone"),
                "rack": info.get("rack"),
            }
            details["network"] = _dedicated_network(ovh, resource_id, sub.ip_address)
            details["security"] = {
                "monitoring": info.get("monitoring"),
                "proactiveIntervention": info.get("monitoring"),
                "ddosProtection": True,
                "firewall": False,
                "antiDDoS": "Permanent" if info.get("professionalUse") is None else None,
                "backupEnabled": False,
                "supportLevel": info.get("supportLevel"),
            }
            details["os"] = {
                "name": info.get("os") or sub.os_template,
                "panel": "Proxmox" if (info.get("os") or "").startswith("proxmox") else None,
            }
            try:
                ipmi = ovh.get(f"/dedicated/server/{resource_id}/features/ipmi")
                details["ipmi"] = {
                    "activated": ipmi.get("activated"),
                    "kvmHtml5": (ipmi.get("supportedFeatures") or {}).get("kvmipHtml5URL"),
                    "kvmJnlp": (ipmi.get("supportedFeatures") or {}).get("kvmipJnlp"),
                    "solUrl": (ipmi.get("supportedFeatures") or {}).get("serialOverLanURL"),
                    "consoleAvailable": ipmi.get("activated") and (ipmi.get("supportedFeatures") or {}).get("kvmipHtml5URL"),
                    "consoleType": "IPMI/KVM",
                }
            except Exception:
                details["ipmi"] = {"consoleAvailable": False}

        elif sub.category == ServiceCategory.WEB_HOSTING:
            info = ovh.get_web_hosting(resource_id)
            details["hardware"] = {
                "offer": info.get("offer"),
                "os": info.get("operatingSystem"),
                "datacenter": info.get("datacenter"),
                "maxQuota": info.get("maxQuota"),
            }
            details["location"] = {
                "datacenter": info.get("datacenter"),
                "country": info.get("country"),
            }
            details["network"] = {
                "ipv4": info.get("hostingIp"),
                "ipv6": None,
            }
            details["os"] = {
                "name": info.get("operatingSystem"),
                "panel": info.get("commercialOffer"),
            }

    except Exception as e:
        logger.warning(f"Failed to fetch server details for {resource_id}: {e}")
        details["error"] = str(e)

    return details


def get_server_bandwidth(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Return bandwidth/traffic details from OVH when available."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        return {"available": False, "error": "No OVH resource attached"}

    try:
        if sub.category == ServiceCategory.DEDICATED:
            specs = ovh.get(f"/dedicated/server/{resource_id}/specifications/network")
            traffic = specs.get("traffic") or {}
            bandwidth = specs.get("bandwidth") or {}
            return {
                "available": True,
                "inputUsedBytes": traffic.get("inputQuotaUsed", {}).get("value"),
                "inputLimitBytes": traffic.get("inputQuotaSize", {}).get("value"),
                "outputUsedBytes": traffic.get("outputQuotaUsed", {}).get("value"),
                "outputLimitBytes": traffic.get("outputQuotaSize", {}).get("value"),
                "resetQuotaDate": traffic.get("resetQuotaDate"),
                "isThrottled": traffic.get("isThrottled"),
                "downstreamMbps": bandwidth.get("InternetToOvh", {}).get("value"),
                "upstreamMbps": bandwidth.get("OvhToInternet", {}).get("value"),
                "connectionMbps": (specs.get("connection") or {}).get("value"),
            }
        elif sub.category == ServiceCategory.VPS:
            # Current-gen VPS ranges do not expose bandwidth counters via the API
            return {"available": False, "error": "VPS bandwidth counters not available"}
        return {"available": False, "error": "Not supported for this category"}
    except Exception as e:
        return {"available": False, "error": str(e)}


def get_server_hardware_specs(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Return detailed hardware specs for dedicated servers."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        return {}
    if sub.category != ServiceCategory.DEDICATED:
        return {}
    try:
        specs = ovh.get(f"/dedicated/server/{resource_id}/specifications/hardware")
        return {
            "processorName": specs.get("processorName"),
            "numberOfProcessors": specs.get("numberOfProcessors"),
            "coresPerProcessor": specs.get("coresPerProcessor"),
            "threadsPerProcessor": specs.get("threadsPerProcessor"),
            "memorySizeMb": (specs.get("memorySize") or {}).get("value"),
            "diskGroups": specs.get("diskGroups") or [],
            "formFactor": specs.get("formFactor"),
            "bootMode": specs.get("bootMode"),
            "motherboard": specs.get("motherboard"),
        }
    except Exception as e:
        return {"error": str(e)}


def _find_boot_id(ovh: OvhClient, service_name: str, boot_type: str) -> Optional[int]:
    """Find a boot option by type (rescue, harddisk, power)."""
    try:
        boot_ids = ovh.get(f"/dedicated/server/{service_name}/boot") or []
        for bid in boot_ids:
            b = ovh.get(f"/dedicated/server/{service_name}/boot/{bid}")
            if b.get("bootType") == boot_type:
                return int(bid)
    except Exception:
        pass
    return None


def set_rescue_mode(db: Session, ovh: OvhClient, sub: Subscription, reboot: bool = False) -> Dict[str, Any]:
    """Set a dedicated server to rescue mode. VPS is not supported."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached")
    if sub.category != ServiceCategory.DEDICATED:
        raise ValueError("Rescue mode is only supported for dedicated servers")

    rescue_id = _find_boot_id(ovh, resource_id, "rescue")
    if not rescue_id:
        raise ValueError("Rescue boot option not found")

    try:
        ovh.put(f"/dedicated/server/{resource_id}", bootId=rescue_id)
    except Exception as e:
        # Some OVH accounts use different endpoints; try alternative
        try:
            ovh.put(f"/dedicated/server/{resource_id}/boot", bootId=rescue_id)
        except Exception:
            raise ValueError(f"Failed to set rescue boot: {e}")

    _log_action(db, sub, "set_rescue", True)
    result = {"success": True, "bootId": rescue_id, "reboot": False}

    if reboot:
        try:
            ovh.reboot_dedicated(resource_id)
            result["reboot"] = True
        except Exception as e:
            result["rebootInitiated"] = False
            result["rebootError"] = str(e)

    return result


def set_normal_boot(db: Session, ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Set a dedicated server back to normal disk boot."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached")
    if sub.category != ServiceCategory.DEDICATED:
        raise ValueError("Only dedicated servers support boot mode changes")

    hd_id = _find_boot_id(ovh, resource_id, "harddisk")
    if not hd_id:
        raise ValueError("Harddisk boot option not found")

    try:
        ovh.put(f"/dedicated/server/{resource_id}", bootId=hd_id)
    except Exception:
        ovh.put(f"/dedicated/server/{resource_id}/boot", bootId=hd_id)

    _log_action(db, sub, "set_normal_boot", True)
    return {"success": True, "bootId": hd_id}


def get_console_url(ovh: OvhClient, sub: Subscription, client_ip: str) -> Dict[str, Any]:
    """Get a one-time remote console URL for a server."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached")

    if sub.category == ServiceCategory.DEDICATED:
        try:
            # Request a fresh IPMI access session
            ovh.post(
                f"/dedicated/server/{resource_id}/features/ipmi/access",
                ipToAllow=client_ip,
                ttl=15,
                type="kvmipHtml5URL",
            )
            # Poll a few times for the session to be ready
            for _ in range(15):
                try:
                    session = ovh.get(
                        f"/dedicated/server/{resource_id}/features/ipmi/access",
                        type="kvmipHtml5URL",
                    )
                    if session.get("value"):
                        return {
                            "consoleType": "IPMI/KVM (HTML5)",
                            "consoleUrl": session["value"],
                            "expiresIn": session.get("ttl"),
                        }
                except Exception:
                    pass
                import time
                time.sleep(1)
            raise ValueError("Console session did not become ready in time")
        except Exception as e:
            return {"consoleType": "IPMI/KVM", "consoleUrl": None, "error": str(e)}

    elif sub.category == ServiceCategory.VPS:
        try:
            # Try newer console endpoint, then older one
            for endpoint in [f"/vps/{resource_id}/getConsoleUrl", f"/vps/{resource_id}/openConsoleAccess"]:
                try:
                    result = ovh.post(endpoint)
                    return {
                        "consoleType": "KVM (VNC)",
                        "consoleUrl": result.get("consoleUrl") or result.get("url") or result.get("value"),
                    }
                except Exception:
                    pass
            return {"consoleType": "KVM (VNC)", "consoleUrl": None, "error": "VPS console URL not available"}
        except Exception as e:
            return {"consoleType": "KVM (VNC)", "consoleUrl": None, "error": str(e)}

    return {"consoleType": None, "consoleUrl": None, "error": "Not supported for this category"}


def update_reverse_dns(ovh: OvhClient, ip_address: str, reverse: str) -> Dict[str, Any]:
    """Update reverse DNS for an IPv4 or IPv6 address."""
    if not ip_address or not reverse:
        raise ValueError("IP and reverse DNS are required")
    # OVH expects the address with /prefix for some IPs; try both
    candidates = [ip_address]
    if "/" not in ip_address:
        if ":" in ip_address:
            candidates.append(f"{ip_address}/128")
        else:
            candidates.append(f"{ip_address}/32")

    last_error = None
    for ip in candidates:
        ip_path = ip.replace("/", "%2F")
        try:
            # Delete existing reverse records first
            try:
                existing = ovh.get(f"/ip/{ip_path}/reverse") or []
                for rev in existing:
                    try:
                        ovh.delete(f"/ip/{ip_path}/reverse/{rev}")
                    except Exception:
                        pass
            except Exception:
                pass
            ovh.post(f"/ip/{ip_path}/reverse", ipReverse=ip_address.split("/")[0], reverse=reverse)
            return {"success": True, "ip": ip_address, "reverse": reverse}
        except Exception as e:
            last_error = e
    raise ValueError(f"Failed to update reverse DNS: {last_error}")


def delete_reverse_dns(ovh: OvhClient, ip_address: str) -> Dict[str, Any]:
    """Delete reverse DNS for an IP address."""
    if not ip_address:
        raise ValueError("IP is required")
    candidates = [ip_address]
    if "/" not in ip_address:
        if ":" in ip_address:
            candidates.append(f"{ip_address}/128")
        else:
            candidates.append(f"{ip_address}/32")

    last_error = None
    for ip in candidates:
        ip_path = ip.replace("/", "%2F")
        try:
            existing = ovh.get(f"/ip/{ip_path}/reverse") or []
            for rev in existing:
                try:
                    ovh.delete(f"/ip/{ip_path}/reverse/{rev}")
                except Exception:
                    pass
            return {"success": True, "ip": ip_address}
        except Exception as e:
            last_error = e
    raise ValueError(f"Failed to delete reverse DNS: {last_error}")


# ---------- VPS management (OVH /vps API) ----------


def _require_vps_service_name(sub: Subscription) -> str:
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached to subscription")
    if sub.category != ServiceCategory.VPS:
        raise ValueError("This feature is only available for VPS services")
    return resource_id


def _safe_ovh_get(ovh: OvhClient, path: str, default=None, **kwargs):
    try:
        return ovh.get(path, **kwargs)
    except Exception as e:
        logger.debug(f"OVH GET {path} failed: {e}")
        return default


def get_vps_overview(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Full VPS overview for the OVH-style dashboard home tab."""
    service_name = _require_vps_service_name(sub)
    info = ovh.get(f"/vps/{service_name}")
    model = info.get("model") or {}

    ips = []
    for ip_addr in _safe_ovh_get(ovh, f"/vps/{service_name}/ips", []) or []:
        ip_detail = _safe_ovh_get(ovh, f"/vps/{service_name}/ips/{ip_addr}", {}) or {}
        ips.append({
            "ipAddress": ip_addr,
            "gateway": ip_detail.get("gateway"),
            "geolocation": ip_detail.get("geolocation"),
            "reverse": ip_detail.get("reverse"),
            "type": ip_detail.get("type"),
            "version": ip_detail.get("version"),
        })

    options = _safe_ovh_get(ovh, f"/vps/{service_name}/option", []) or []
    option_states = {}
    for opt in options:
        detail = _safe_ovh_get(ovh, f"/vps/{service_name}/option/{opt}", {}) or {}
        option_states[opt] = detail.get("state")

    current_image = _safe_ovh_get(ovh, f"/vps/{service_name}/images/current", {}) or {}
    distribution = _safe_ovh_get(ovh, f"/vps/{service_name}/distribution", {}) or {}

    return {
        "serviceName": service_name,
        "displayName": info.get("displayName"),
        "state": info.get("state"),
        "zone": info.get("zone"),
        "cluster": info.get("cluster"),
        "netbootMode": info.get("netbootMode"),
        "keymap": info.get("keymap"),
        "offerType": info.get("offerType"),
        "memoryLimit": info.get("memoryLimit"),
        "vcore": info.get("vcore"),
        "monitoringIpBlocks": info.get("monitoringIpBlocks") or [],
        "slaMonitoring": info.get("slaMonitoring"),
        "model": {
            "name": model.get("name"),
            "offer": model.get("offer"),
            "version": model.get("version"),
            "vcore": model.get("vcore"),
            "memory": model.get("memory"),
            "disk": model.get("disk"),
            "maximumAdditionnalIp": model.get("maximumAdditionnalIp"),
            "availableOptions": model.get("availableOptions") or [],
            "datacenter": model.get("datacenter") or [],
        },
        "ips": ips,
        "options": option_states,
        "image": current_image,
        "distribution": distribution,
        "serviceInfo": _service_info(ovh, sub.category, service_name),
    }


def get_vps_disks(ovh: OvhClient, sub: Subscription) -> List[Dict[str, Any]]:
    """List additional data disks attached to the VPS."""
    service_name = _require_vps_service_name(sub)
    disk_ids = _safe_ovh_get(ovh, f"/vps/{service_name}/disks", []) or []
    disks = []
    for did in disk_ids:
        d = _safe_ovh_get(ovh, f"/vps/{service_name}/disks/{did}") or {}
        d.pop("serviceName", None)
        disks.append(d)
    return disks


def get_vps_backup(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Automated backup state, restore points and snapshot for a VPS."""
    service_name = _require_vps_service_name(sub)
    auto = _safe_ovh_get(ovh, f"/vps/{service_name}/automatedBackup", {}) or {}
    restore_points = _safe_ovh_get(ovh, f"/vps/{service_name}/automatedBackup/restorePoints", []) or []
    snapshot = _safe_ovh_get(ovh, f"/vps/{service_name}/snapshot")
    return {
        "automatedBackup": auto or None,
        "restorePoints": restore_points,
        "snapshot": snapshot,
    }


def create_vps_snapshot(ovh: OvhClient, sub: Subscription, description: Optional[str] = None) -> Dict[str, Any]:
    service_name = _require_vps_service_name(sub)
    payload = {"description": description or f"Snapshot {datetime.utcnow().isoformat()}"}
    return ovh.post(f"/vps/{service_name}/createSnapshot", **payload)


def delete_vps_snapshot(ovh: OvhClient, sub: Subscription) -> Any:
    service_name = _require_vps_service_name(sub)
    return ovh.delete(f"/vps/{service_name}/snapshot")


def get_vps_secondary_dns(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    service_name = _require_vps_service_name(sub)
    domains = _safe_ovh_get(ovh, f"/vps/{service_name}/secondaryDnsDomains", []) or []
    name_server = _safe_ovh_get(ovh, f"/vps/{service_name}/secondaryDnsNameServerAvailable")
    return {"domains": domains, "nameServer": name_server}


def add_vps_secondary_dns(ovh: OvhClient, sub: Subscription, domain: str) -> Any:
    service_name = _require_vps_service_name(sub)
    domain = (domain or "").strip().lower()
    if not domain or "." not in domain:
        raise ValueError("A valid domain name is required")
    return ovh.post(f"/vps/{service_name}/secondaryDnsDomains", domain=domain)


def delete_vps_secondary_dns(ovh: OvhClient, sub: Subscription, domain: str) -> Any:
    service_name = _require_vps_service_name(sub)
    return ovh.delete(f"/vps/{service_name}/secondaryDnsDomains/{domain}")


def get_vps_images(ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Available reinstall images and distribution templates."""
    service_name = _require_vps_service_name(sub)
    images = _safe_ovh_get(ovh, f"/vps/{service_name}/images/available", []) or []
    templates = _safe_ovh_get(ovh, f"/vps/{service_name}/templates", []) or []
    current = _safe_ovh_get(ovh, f"/vps/{service_name}/images/current", {}) or {}
    return {"images": images, "templates": templates, "current": current}


def get_vps_tasks(ovh: OvhClient, sub: Subscription, limit: int = 20) -> List[Dict[str, Any]]:
    service_name = _require_vps_service_name(sub)
    task_ids = _safe_ovh_get(ovh, f"/vps/{service_name}/tasks", []) or []
    tasks = []
    for tid in task_ids[:limit]:
        t = _safe_ovh_get(ovh, f"/vps/{service_name}/tasks/{tid}") or {}
        if t:
            tasks.append(t)
    return tasks


def rename_vps(ovh: OvhClient, sub: Subscription, display_name: str) -> Any:
    service_name = _require_vps_service_name(sub)
    display_name = (display_name or "").strip()
    if not display_name:
        raise ValueError("Display name is required")
    return ovh.put(f"/vps/{service_name}", displayName=display_name)


def set_vps_netboot(ovh: OvhClient, sub: Subscription, mode: str) -> Any:
    """Set VPS boot mode: local | rescue."""
    service_name = _require_vps_service_name(sub)
    if mode not in ("local", "rescue"):
        raise ValueError("Boot mode must be 'local' or 'rescue'")
    return ovh.put(f"/vps/{service_name}", netbootMode=mode)


def reset_vps_password(ovh: OvhClient, sub: Subscription) -> Any:
    service_name = _require_vps_service_name(sub)
    return ovh.post(f"/vps/{service_name}/setPassword")


def change_vps_ip_geolocation(ovh: OvhClient, sub: Subscription, ip_address: str, country: str) -> Any:
    service_name = _require_vps_service_name(sub)
    return ovh.put(f"/vps/{service_name}/ips/{ip_address}", country=country)


def get_vps_ip_countries(ovh: OvhClient, sub: Subscription) -> List[str]:
    service_name = _require_vps_service_name(sub)
    return _safe_ovh_get(ovh, f"/vps/{service_name}/ipCountryAvailable", []) or []


def get_vps_upgrade_offers(ovh: OvhClient, sub: Subscription) -> List[Dict[str, Any]]:
    """Available model upgrades for this VPS from /order/upgrade/vps."""
    service_name = _require_vps_service_name(sub)
    return _safe_ovh_get(ovh, f"/order/upgrade/vps/{service_name}", []) or []


def get_vps_service_options(ovh: OvhClient, sub: Subscription) -> List[Dict[str, Any]]:
    """Purchasable service options (additional disk, automated backup, snapshot…)."""
    service_name = _require_vps_service_name(sub)
    return _safe_ovh_get(ovh, f"/order/cartServiceOption/vps/{service_name}", []) or []


def get_vps_disk_durations(ovh: OvhClient, sub: Subscription, size: int) -> List[str]:
    service_name = _require_vps_service_name(sub)
    return _safe_ovh_get(ovh, f"/order/vps/{service_name}/additionalDisk", additionalDiskSize=str(size)) or []


def get_vps_backup_durations(ovh: OvhClient, sub: Subscription) -> List[str]:
    service_name = _require_vps_service_name(sub)
    return _safe_ovh_get(ovh, f"/order/vps/{service_name}/automatedBackup") or []


def set_service_auto_renew(db: Session, ovh: OvhClient, sub: Subscription, enabled: bool) -> Dict[str, Any]:
    """Toggle automatic renewal at the provider and locally."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached to subscription")
    family = "vps" if sub.category == ServiceCategory.VPS else "dedicated/server"
    renew = {"automatic": enabled}
    if enabled:
        renew.update({"deleteAtExpiration": False, "forced": False})
    else:
        renew.update({"deleteAtExpiration": True})
    try:
        ovh.put(f"/{family}/{resource_id}/serviceInfos", renew=renew)
    except Exception as e:
        logger.warning(f"serviceInfos update failed for {resource_id}: {e}")
        raise ValueError(f"Provider rejected the renewal change: {e}")
    sub.auto_renew = enabled
    sub.updated_at = func.now()
    db.commit()
    return {"success": True, "autoRenew": enabled}


def request_service_termination(db: Session, ovh: OvhClient, sub: Subscription) -> Dict[str, Any]:
    """Request service termination — provider ends the service at its expiry date."""
    resource_id = _get_real_resource_id(sub)
    if not resource_id:
        raise ValueError("No OVH resource attached to subscription")
    result = None
    if sub.category == ServiceCategory.VPS:
        result = ovh.post(f"/vps/{resource_id}/terminate")
    elif sub.category == ServiceCategory.DEDICATED:
        result = ovh.post(f"/dedicated/server/{resource_id}/terminate")
    else:
        raise ValueError(f"Termination not supported for {sub.category.value} services")
    sub.auto_renew = False
    sub.status = SubscriptionStatus.CANCELLED
    sub.updated_at = func.now()
    db.commit()
    _log_action(db, sub, "terminate_requested", True)
    return {"success": True, "task": result, "message": "Termination requested — the service will end at its expiry date"}
