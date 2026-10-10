"""
Provider-neutral live metrics for subscriptions.

Sources (in priority order):
- proxmox: subscription.service_name formatted "proxmox:<node>/<vmid>" (self-hosted VPS)
- ovh:     GET /vps/{serviceName}/monitoring (works on older VPS ranges; new
           ranges return 500 — detected once and negatively cached)
- none:    honest unavailable state, never fabricated values
"""
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from app.models.models import AdminConfig, MetricSample, ServiceCategory, Subscription

logger = logging.getLogger(__name__)

# Negative cache: subscription_id -> {source: expiry_ts} to avoid hammering
# upstream endpoints that already told us "not supported".
_UNAVAILABLE_TTL = 600  # seconds
_live_cache: Dict[str, Dict[str, Any]] = {}
_LIVE_TTL = 55  # seconds

_OVH_TYPES = ["cpu:used", "mem:used", "net:rx", "net:tx"]


def _cfg(db: Session, key: str, default: Optional[str] = None) -> Optional[str]:
    row = db.query(AdminConfig).filter(AdminConfig.key == key).first()
    return row.value if row and row.value else default


def _unavailable(source: str, reason: str) -> Dict[str, Any]:
    return {
        "available": False,
        "source": source,
        "reason": reason,
        "cpu": None, "ram": None, "disk": None, "load": None,
        "netIn": None, "netOut": None, "diskRead": None, "diskWrite": None,
        "fetchedAt": None,
    }


def _ok(source: str, **kw) -> Dict[str, Any]:
    out = {"available": True, "source": source, "reason": None, "fetchedAt": datetime.utcnow().isoformat()}
    for k in ("cpu", "ram", "disk", "load", "netIn", "netOut", "diskRead", "diskWrite"):
        out[k] = kw.get(k)
    return out


def _neg_cached(sub_id: str, src: str) -> bool:
    exp = _live_cache.get(f"neg:{sub_id}:{src}")
    return bool(exp and exp > time.time())


def _neg_mark(sub_id: str, src: str) -> None:
    _live_cache[f"neg:{sub_id}:{src}"] = time.time() + _UNAVAILABLE_TTL


# ---------------- OVH VPS monitoring ----------------

def _ovh_last_point(payload: Any) -> Optional[float]:
    """OVH monitoring returns MRTG-ish payloads; parse defensively."""
    pts: List[Any] = []
    if isinstance(payload, dict):
        pts = payload.get("values") or payload.get("points") or []
    elif isinstance(payload, list):
        pts = payload
    if not pts:
        return None
    last = pts[-1]
    if isinstance(last, dict):
        v = last.get("value")
        if v is None:
            v = last.get("y")
        try:
            return float(v) if v is not None else None
        except (TypeError, ValueError):
            return None
    return None


def _fetch_ovh_vps(ovh: Any, sub: Subscription) -> Dict[str, Any]:
    sn = sub.service_name
    if not sn:
        return _unavailable("ovh", "no service name on subscription")
    if _neg_cached(sub.id, "ovh"):
        return _unavailable("ovh", "provider does not expose metrics for this range (cached)")
    got: Dict[str, Optional[float]] = {}
    try:
        for t in _OVH_TYPES:
            try:
                got[t] = _ovh_last_point(ovh.get(f"/vps/{sn}/monitoring", period="lastday", type=t))
            except Exception as e:
                msg = str(e)
                if "Internal server error" in msg or "invalid" in msg.lower():
                    _neg_mark(sub.id, "ovh")
                    return _unavailable("ovh", "OVH does not expose live metrics for this VPS range")
                logger.warning("vps monitoring %s %s: %s", sn, t, e)
    except Exception as e:  # pragma: no cover
        logger.warning("vps monitoring outer: %s", e)
    if all(v is None for v in got.values()):
        return _unavailable("ovh", "provider returned no metric points")
    # cpu:used / mem:used are percent; net:* are bytes/s in OVH MRTG
    return _ok("ovh", cpu=got.get("cpu:used"), ram=got.get("mem:used"),
               netIn=got.get("net:rx"), netOut=got.get("net:tx"))


# ---------------- Proxmox ----------------

def _proxmox_creds(db: Session) -> Optional[Dict[str, Any]]:
    host = _cfg(db, "proxmox_host")
    token_id = _cfg(db, "proxmox_token_id")
    token_secret = _cfg(db, "proxmox_token_secret")
    if not (host and token_id and token_secret):
        return None
    return {
        "base": host.rstrip("/"),
        "headers": {"Authorization": f"PVEAPIToken={token_id}={token_secret}"},
        "verify": (_cfg(db, "proxmox_verify_ssl", "true") or "true").lower() != "false",
    }


def _parse_proxmox_ref(sub: Subscription) -> Optional[tuple]:
    """service_name 'proxmox:<node>/<vmid>' or datacenter 'proxmox' + service_name 'node/vmid'."""
    sn = (sub.service_name or "").strip()
    if sn.startswith("proxmox:"):
        ref = sn[len("proxmox:"):]
    elif (sub.datacenter or "").lower() == "proxmox" and "/" in sn:
        ref = sn
    else:
        return None
    if "/" not in ref:
        return None
    node, vmid = ref.split("/", 1)
    return (node.strip(), vmid.strip())


def _fetch_proxmox(db: Session, sub: Subscription) -> Dict[str, Any]:
    ref = _parse_proxmox_ref(sub)
    if not ref:
        return _unavailable("proxmox", "service is not a proxmox guest")
    creds = _proxmox_creds(db)
    if not creds:
        return _unavailable("proxmox", "proxmox API not configured (set proxmox_host/token_id/token_secret in admin configs)")
    node, vmid = ref
    try:
        r = requests.get(
            f"{creds['base']}/api2/json/nodes/{node}/qemu/{vmid}/status/current",
            headers=creds["headers"], verify=creds["verify"], timeout=6,
        )
        if r.status_code == 401 or r.status_code == 403:
            _neg_mark(sub.id, "proxmox")
            return _unavailable("proxmox", "proxmox API credentials rejected")
        r.raise_for_status()
        d = (r.json() or {}).get("data") or {}
        if d.get("status") != "running":
            return _unavailable("proxmox", f"guest state: {d.get('status', 'unknown')}")
        cpu = d.get("cpu")
        mem = d.get("mem"); maxmem = d.get("maxmem")
        ram_pct = round(mem / maxmem * 100, 2) if mem and maxmem else None
        # disk usage via agent-independent fields: 'disk'/'maxdisk'
        disk = d.get("disk"); maxdisk = d.get("maxdisk")
        disk_pct = round(disk / maxdisk * 100, 2) if disk and maxdisk else None
        return _ok("proxmox",
                   cpu=round((cpu or 0) * 100, 2) if cpu is not None else None,
                   ram=ram_pct, disk=disk_pct,
                   netIn=d.get("netin"), netOut=d.get("netout"),
                   diskRead=d.get("diskread"), diskWrite=d.get("diskwrite"))
    except requests.RequestException as e:
        logger.warning("proxmox fetch %s/%s: %s", node, vmid, e)
        return _unavailable("proxmox", "proxmox API unreachable")


# ---------------- Public API ----------------

def fetch_live_metrics(db: Session, ovh: Any, sub: Subscription) -> Dict[str, Any]:
    """Best-effort live metrics; never fabricates."""
    key = f"live:{sub.id}"
    hit = _live_cache.get(key)
    if hit and hit["exp"] > time.time():
        return hit["data"]

    if sub.status.value != "ACTIVE":
        res = _unavailable("none", f"service status is {sub.status.value.lower()}")
    elif _parse_proxmox_ref(sub):
        res = _fetch_proxmox(db, sub)
    elif sub.category == ServiceCategory.VPS and sub.service_name:
        res = _fetch_ovh_vps(ovh, sub)
    elif sub.category == ServiceCategory.DEDICATED:
        res = _unavailable("ovh", "OVH API exposes no live metrics for dedicated servers (RTM must be read inside the guest OS)")
    else:
        res = _unavailable("none", "metrics not applicable for this service type")

    _live_cache[key] = {"exp": time.time() + _LIVE_TTL, "data": res}
    return res


def record_metric_sample(db: Session, sub: Subscription, metrics: Dict[str, Any]) -> Optional[MetricSample]:
    if not metrics.get("available"):
        return None
    s = MetricSample(
        subscription_id=sub.id,
        cpu=metrics.get("cpu"), ram=metrics.get("ram"), disk=metrics.get("disk"),
        load=metrics.get("load"), net_rx=metrics.get("netIn"), net_tx=metrics.get("netOut"),
        disk_read=metrics.get("diskRead"), disk_write=metrics.get("diskWrite"),
        source=metrics.get("source", "none"),
    )
    db.add(s)
    return s


def prune_old_samples(db: Session, keep_days: int = 8) -> int:
    cutoff = datetime.utcnow() - timedelta(days=keep_days)
    n = db.query(MetricSample).filter(MetricSample.sampled_at < cutoff).delete(synchronize_session=False)
    return n
