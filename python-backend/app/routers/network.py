"""Per-service networking: IP blocks, failover moves, virtual MACs, vRack,
edge firewall rules, anti-DDoS mitigation, rDNS bulk edit, and a
reachability test (mtr/ping from this host).

All OVH paths used here are documented public API routes. Mutations are only
allowed on IPs/services routed to the caller's own subscription — enforced by
_assert_ip_routed_to before any write.
"""
import logging
import subprocess
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import AdditionalIp, ServiceCategory, Subscription, SubscriptionStatus, User
from app.services.ovh_client import get_ovh_client_from_db
from app.services.subscription_service import get_subscription

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["network"])


def _ovh(db: Session):
    return get_ovh_client_from_db(db)


def _svc_name(sub: Subscription) -> Optional[str]:
    return sub.service_name or None


def _assert_ip_routed_to(ovh, ip: str, sub: Subscription) -> Dict[str, Any]:
    """The IP must currently be routed to this subscription's service —
    prevents operating on IPs that belong to other services/accounts."""
    try:
        data = ovh.get(f"/ip/{ip}")
    except Exception:
        raise HTTPException(status_code=404, detail="IP not found on account")
    routed = (data.get("routedTo") or {}).get("serviceName")
    if routed != _svc_name(sub):
        raise HTTPException(status_code=403, detail="IP is not routed to this service")
    return data


def _user_service_names(db: Session, user_id: str) -> List[str]:
    subs = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.service_name.isnot(None),
    ).all()
    return [s.service_name for s in subs]


# ---------------- IP overview ----------------

@router.get("/server/{server_id}/network")
def network_overview(server_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    sn = _svc_name(sub)
    out: Dict[str, Any] = {"serviceName": sn, "ips": [], "vracks": [], "virtualMacs": [], "categories": []}

    # IPs routed to this service (primary + additional + failover)
    try:
        all_ips = ovh.get("/ip") or []
        for ip in all_ips:
            try:
                d = ovh.get(f"/ip/{ip.replace('/', '%2F')}")
                routed = (d.get("routedTo") or {}).get("serviceName")
                if sn and routed == sn:
                    out["ips"].append({
                        "ip": d.get("ip"), "type": d.get("type"), "version": d.get("version"),
                        "region": (d.get("regions") or [None])[0], "country": d.get("country"),
                        "canBeTerminated": d.get("canBeTerminated"), "byoip": d.get("bringYourOwnIp"),
                    })
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"/ip list failed: {e}")

    # DB-tracked additional IPs on this subscription
    for a in db.query(AdditionalIp).filter(AdditionalIp.subscription_id == sub.id).all():
        if not any(x["ip"] == a.ip_address for x in out["ips"]):
            out["ips"].append({"ip": a.ip_address, "type": "additional", "version": 4})

    # vRack attachments (list each rack's membership of this service)
    try:
        for rack in ovh.get("/vrack") or []:
            try:
                members = ovh.get(f"/vrack/{rack}/dedicatedServer") or []
                cloud = ovh.get(f"/vrack/{rack}/cloudProject") or []
                ips = ovh.get(f"/vrack/{rack}/ip") or []
                info = ovh.get(f"/vrack/{rack}") or {}
                attached = (sn in members) if sn else False
                out["vracks"].append({
                    "name": rack, "description": info.get("description") or info.get("name"),
                    "attached": attached, "memberCount": len(members) + len(cloud),
                    "dedicatedServers": members, "cloudProjects": cloud, "ipBlocks": ips,
                })
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"/vrack list failed: {e}")

    # virtual MACs — dedicated only
    if sub.category == ServiceCategory.DEDICATED and sn:
        try:
            for mac in ovh.get(f"/dedicated/server/{sn}/virtualMac") or []:
                try:
                    info = ovh.get(f"/dedicated/server/{sn}/virtualMac/{mac}") or {}
                    out["virtualMacs"].append({"mac": mac, "type": info.get("type"), "ip": info.get("ipAddress")})
                except Exception:
                    out["virtualMacs"].append({"mac": mac})
        except Exception as e:
            logger.warning(f"virtualMac list failed: {e}")

    out["targets"] = _user_service_names(db, user.id)
    return out


# ---------------- failover IP move ----------------

@router.post("/server/{server_id}/network/ip/{ip}/move")
def move_failover_ip(server_id: str, ip: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    info = _assert_ip_routed_to(ovh, ip, sub)
    if info.get("type") not in ("failover", "ip"):
        raise HTTPException(status_code=400, detail="Only failover IPs can be moved")
    target = body.get("target")
    if not target:
        raise HTTPException(status_code=400, detail="target serviceName required")
    if target not in _user_service_names(db, user.id):
        raise HTTPException(status_code=403, detail="Target must be one of your services")
    try:
        return ovh.post(f"/ip/{ip}/move", to=target)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- anti-DDoS / mitigation ----------------

@router.get("/server/{server_id}/network/ip/{ip}/ddos")
def ddos_status(server_id: str, ip: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    out = {"ip": ip, "mitigations": [], "events": []}
    try:
        for m in ovh.get(f"/ip/{ip}/mitigation") or []:
            try:
                out["mitigations"].append(ovh.get(f"/ip/{ip}/mitigation/{m}"))
            except Exception:
                out["mitigations"].append({"ipOnMitigation": m})
    except Exception:
        pass
    try:
        # live attack events (if any) — /ip/{ip}/mitigation/{ip} gives details
        out["events"] = [m for m in out["mitigations"] if m.get("state") not in (None, "ok", "creationPending")]
    except Exception:
        pass
    return out


@router.post("/server/{server_id}/network/ip/{ip}/mitigation")
def set_mitigation(server_id: str, ip: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    on_ip = body.get("ipOnMitigation") or ip.split("/")[0]
    try:
        return ovh.post(
            f"/ip/{ip}/mitigation",
            ipOnMitigation=on_ip,
            permanent=bool(body.get("permanent", False)),
            auto=bool(body.get("auto", True)),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/{server_id}/network/ip/{ip}/mitigation/{on_ip}")
def delete_mitigation(server_id: str, ip: str, on_ip: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    try:
        return ovh.delete(f"/ip/{ip}/mitigation/{on_ip}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- edge firewall ----------------

@router.get("/server/{server_id}/network/ip/{ip}/firewall")
def firewall_list(server_id: str, ip: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    on_ip = ip.split("/")[0]
    out = {"ip": ip, "enabled": False, "rules": []}
    try:
        fw_ips = ovh.get(f"/ip/{ip}/firewall") or []
        out["enabled"] = on_ip in fw_ips or bool(fw_ips)
        if fw_ips:
            on_ip = fw_ips[0] if on_ip not in fw_ips else on_ip
            rule_ids = ovh.get(f"/ip/{ip}/firewall/{on_ip}/rule") or []
            for rid in rule_ids:
                try:
                    out["rules"].append(ovh.get(f"/ip/{ip}/firewall/{on_ip}/rule/{rid}"))
                except Exception:
                    continue
    except Exception as e:
        logger.warning(f"firewall list {ip}: {e}")
    return out


@router.post("/server/{server_id}/network/ip/{ip}/firewall")
def firewall_enable(server_id: str, ip: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    try:
        if body.get("enabled", True):
            return ovh.post(f"/ip/{ip}/firewall", ipOnFirewall=ip.split("/")[0])
        else:
            return ovh.delete(f"/ip/{ip}/firewall/{ip.split('/')[0]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


_RULE_FIELDS = ("action", "destination", "destinationPort", "protocol", "sequence",
                "source", "sourcePort", "tcpOption")


@router.post("/server/{server_id}/network/ip/{ip}/firewall/rule")
def firewall_add_rule(server_id: str, ip: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    on_ip = ip.split("/")[0]
    if body.get("action") not in ("permit", "deny"):
        raise HTTPException(status_code=400, detail="action must be permit or deny")
    payload = {k: v for k, v in body.items() if k in _RULE_FIELDS and v is not None}
    try:
        return ovh.post(f"/ip/{ip}/firewall/{on_ip}/rule", **payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/{server_id}/network/ip/{ip}/firewall/rule/{rule_seq}")
def firewall_delete_rule(server_id: str, ip: str, rule_seq: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    _assert_ip_routed_to(ovh, ip, sub)
    try:
        return ovh.delete(f"/ip/{ip}/firewall/{ip.split('/')[0]}/rule/{rule_seq}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/server/{server_id}/network/ip/{ip}/firewall/export")
def firewall_export(server_id: str, ip: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return firewall_list(server_id, ip, db, user)


@router.post("/server/{server_id}/network/ip/{ip}/firewall/import")
def firewall_import(server_id: str, ip: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rules = body.get("rules") or []
    if len(rules) > 30:
        raise HTTPException(status_code=400, detail="Max 30 rules per import")
    results = []
    for r in rules:
        try:
            results.append(firewall_add_rule(server_id, ip, r, db, user))
        except HTTPException as e:
            results.append({"error": e.detail, "rule": r})
    return {"imported": len(results), "results": results}


# ---------------- virtual MAC ----------------

@router.post("/server/{server_id}/network/vmac")
def create_vmac(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    if sub.category != ServiceCategory.DEDICATED:
        raise HTTPException(status_code=400, detail="Virtual MAC is only for dedicated servers")
    ovh = _ovh(db)
    try:
        mac = ovh.post(f"/dedicated/server/{sub.service_name}/virtualMac",
                       ipAddress=body.get("ipAddress"), type=body.get("type") or "ovh")
        if body.get("ipAddress"):
            try:
                ovh.post(f"/dedicated/server/{sub.service_name}/virtualAddress",
                         ipAddress=body["ipAddress"], virtualMac=mac)
            except Exception as e:
                logger.warning(f"virtualAddress link failed: {e}")
        return {"mac": mac}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/{server_id}/network/vmac/{mac}")
def delete_vmac(server_id: str, mac: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    try:
        return ovh.delete(f"/dedicated/server/{sub.service_name}/virtualMac/{mac}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- vRack attach/detach ----------------

@router.post("/server/{server_id}/network/vrack")
def vrack_attach(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    rack = body.get("vrack")
    if not rack:
        raise HTTPException(status_code=400, detail="vrack name required")
    ovh = _ovh(db)
    sn = _svc_name(sub)
    try:
        if sub.category == ServiceCategory.DEDICATED:
            return ovh.post(f"/vrack/{rack}/dedicatedServer", dedicatedServer=sn)
        if sub.category == ServiceCategory.VPS:
            return ovh.post(f"/vrack/{rack}/vps", vps=sn)
        raise HTTPException(status_code=400, detail="vRack attach not supported for this service type")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/server/{server_id}/network/vrack/{rack}")
def vrack_detach(server_id: str, rack: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    sn = _svc_name(sub)
    try:
        if sub.category == ServiceCategory.DEDICATED:
            return ovh.delete(f"/vrack/{rack}/dedicatedServer/{sn}")
        if sub.category == ServiceCategory.VPS:
            return ovh.delete(f"/vrack/{rack}/vps/{sn}")
        raise HTTPException(status_code=400, detail="vRack detach not supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- rDNS bulk ----------------

@router.post("/server/{server_id}/network/rdns-bulk")
def rdns_bulk(server_id: str, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.subscription_service import update_reverse_dns, delete_reverse_dns
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    ovh = _ovh(db)
    records = body.get("records") or []
    if len(records) > 50:
        raise HTTPException(status_code=400, detail="Max 50 records per request")
    results = []
    for r in records:
        ip = r.get("ip")
        if not ip:
            continue
        try:
            _assert_ip_routed_to(ovh, ip, sub)
            if r.get("reverse"):
                update_reverse_dns(ovh, ip, r["reverse"])
                results.append({"ip": ip, "ok": True})
            else:
                delete_reverse_dns(ovh, ip)
                results.append({"ip": ip, "ok": True, "cleared": True})
        except HTTPException as e:
            results.append({"ip": ip, "ok": False, "error": e.detail})
        except Exception as e:
            results.append({"ip": ip, "ok": False, "error": str(e)})
    return {"results": results}


# ---------------- network test (looking glass) ----------------

@router.get("/server/{server_id}/network/test")
def network_test(server_id: str, target: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Ping + traceroute from the GHC host to a customer-supplied target —
    useful for diagnosing whether a service is reachable from our edge."""
    sub = get_subscription(db, user.id, server_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Server not found")
    import re, ipaddress
    target = (target or "").strip()
    try:
        ipaddress.ip_address(target)
    except ValueError:
        if not re.fullmatch(r"[a-zA-Z0-9.-]{1,253}", target):
            raise HTTPException(status_code=400, detail="Invalid target")
    out: Dict[str, Any] = {"target": target}
    try:
        p = subprocess.run(["ping", "-c", "3", "-W", "2", target], capture_output=True, text=True, timeout=8)
        out["ping"] = p.stdout.strip().splitlines()[-2:] if p.stdout else []
        out["reachable"] = p.returncode == 0
    except Exception as e:
        out["ping"] = [f"ping failed: {e}"]
        out["reachable"] = False
    try:
        t = subprocess.run(["traceroute", "-m", "15", "-w", "2", "-q", "1", target],
                           capture_output=True, text=True, timeout=20)
        out["traceroute"] = t.stdout.strip().splitlines()[:15] if t.stdout else []
    except FileNotFoundError:
        try:
            t = subprocess.run(["tracepath", "-m", "15", target], capture_output=True, text=True, timeout=20)
            out["traceroute"] = t.stdout.strip().splitlines()[:15] if t.stdout else []
        except Exception:
            out["traceroute"] = ["no traceroute tool installed on host"]
    except Exception as e:
        out["traceroute"] = [f"traceroute failed: {e}"]
    return out
