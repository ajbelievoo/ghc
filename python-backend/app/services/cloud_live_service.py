"""Live Public Cloud catalog — fetched from the upstream public catalog API,
normalised into the section/leaf structure the frontend renders, margin applied,
cached in memory (TTL 30 min) so it is real-time but not rate-limiting."""
import re
import time
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.models import ServiceCategory
from app.services.catalog_service import get_margin_for_category
from app.services.ovh_client import apply_margin, get_ovh_client_from_db, ovh_price_to_decimal

_CACHE: Dict[str, Any] = {"ts": 0.0, "data": None}
_TTL = 1800  # 30 minutes

_SUFFIX_RE = re.compile(r"\.(hour|month|consumption|monthly|once|install)(\..*)?$")


def _base_code(plan_code: str) -> str:
    c = plan_code
    for _ in range(3):
        c = _SUFFIX_RE.sub("", c)
    return c


def _specs(blobs: Optional[Dict[str, Any]]) -> Dict[str, str]:
    tech = (blobs or {}).get("technical") or {}
    out: Dict[str, str] = {}
    cpu = tech.get("cpu") or {}
    if cpu.get("cores"):
        out["vcore"] = str(cpu["cores"])
    mem = tech.get("memory") or {}
    if mem.get("size"):
        out["memory"] = f"{int(mem['size']) if float(mem['size']) == int(mem['size']) else mem['size']} GB"
    storage = tech.get("storage") or {}
    disks = storage.get("disks") or []
    if disks:
        total = sum(d.get("capacity", 0) * d.get("number", 1) for d in disks)
        techname = disks[0].get("technology", "")
        out["storage"] = f"{total} GB {techname}".strip()
    gpu = tech.get("gpu") or {}
    if gpu.get("model"):
        out["gpu"] = f"{gpu.get('memory', {}).get('size', '')} GB {gpu['model']}".strip()
        if gpu.get("number", 0) > 1:
            out["gpu"] = f"{gpu['number']} x {out['gpu']}"
    bw = tech.get("bandwidth") or {}
    if bw.get("level"):
        lvl = bw["level"]
        out["public-network"] = f"{lvl / 1000:g} Gbps" if lvl >= 1000 else f"{lvl} Mbps"
        if bw.get("guaranteed"):
            out["public-network"] += " guaranteed"
    vrack = tech.get("vrack") or {}
    if vrack.get("level"):
        lvl = vrack["level"]
        out["private-network"] = f"{lvl / 1000:g} Gbps" if lvl >= 1000 else f"{lvl} Mbps"
    return out


def _price_by_unit(plan: Dict[str, Any], unit: str, margin: Decimal) -> Optional[float]:
    best = None
    for p in plan.get("pricings") or []:
        if str(p.get("intervalUnit", "")).lower() != unit:
            continue
        raw = ovh_price_to_decimal(p)
        if raw <= 0:
            continue
        price = apply_margin(raw, margin)
        if best is None or price < best:
            best = price
    return float(best) if best is not None else None


def _collect(catalog: Dict[str, Any], margin: Decimal) -> Dict[str, Dict[str, Any]]:
    items: Dict[str, Dict[str, Any]] = {}
    for plan in (catalog.get("plans") or []) + (catalog.get("addons") or []):
        code = plan.get("planCode")
        if not code:
            continue
        base = _base_code(code)
        blobs = plan.get("blobs") or {}
        name = (blobs.get("commercial") or {}).get("name") or plan.get("invoiceName") or base
        name = re.sub(r"(?i)ovhcloud", "Cloud", str(name)).replace("OVH", "Cloud")
        hour = _price_by_unit(plan, "hour", margin)
        month = _price_by_unit(plan, "month", margin)
        specs = _specs(blobs)
        cur = items.get(base)
        if not cur:
            cur = {"code": base, "name": name, "hour": None, "month": None, "specs": {}}
            items[base] = cur
        if hour is not None and (cur["hour"] is None or hour < cur["hour"]):
            cur["hour"] = hour
        if month is not None and (cur["month"] is None or month < cur["month"]):
            cur["month"] = month
        cur["specs"].update({k: v for k, v in specs.items() if v})
    return {k: v for k, v in items.items() if v["hour"] is not None or v["month"] is not None}


def _grp(items: Dict[str, Dict[str, Any]], patterns: List[str]) -> List[Dict[str, Any]]:
    out = [v for k, v in items.items() if any(re.match("^" + p, k) for p in patterns)]
    return sorted(out, key=lambda i: (tuple(int(n) for n in re.findall(r"\d+", i["code"])), i["code"]))


def _families(items: Dict[str, Dict[str, Any]], defs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    return [
        {"id": d["id"], "tag": d["tag"], "name": d["name"], "desc": d["desc"], "items": _grp(items, d["patterns"])}
        for d in defs
        if _grp(items, d["patterns"])
    ]


VM_DEFS = [
    {"id": "b3", "tag": "B3", "name": "General Purpose", "desc": "Balanced CPU/RAM resources for development servers, and web or enterprise applications.", "patterns": ["b3-"]},
    {"id": "c3", "tag": "C3", "name": "Compute Optimised", "desc": "High-frequency computing and parallel processing workloads. vCores clocked at 2.3 GHz and higher.", "patterns": ["c3-"]},
    {"id": "r3", "tag": "R3", "name": "RAM Optimised", "desc": "High RAM-to-vCore ratio for in-memory databases, caching and analytics.", "patterns": ["r3-"]},
    {"id": "d2", "tag": "D2", "name": "Discovery", "desc": "Shared resources at unbeatable prices — for testing, staging and small projects.", "patterns": ["d2-"]},
    {"id": "i1", "tag": "I1", "name": "IOPS Optimised", "desc": "Instances with high NVMe IOPS for databases and storage-intensive workloads.", "patterns": ["i1-"]},
    {"id": "b2", "tag": "B2", "name": "General Purpose (previous gen)", "desc": "Previous-generation balanced instances at lower prices.", "patterns": ["b2-"]},
    {"id": "c2", "tag": "C2", "name": "Compute Optimised (previous gen)", "desc": "Previous-generation compute instances.", "patterns": ["c2-"]},
    {"id": "r2", "tag": "R2", "name": "RAM Optimised (previous gen)", "desc": "Previous-generation RAM-optimised instances.", "patterns": ["r2-"]},
]

GPU_DEFS = [
    {"id": "t1", "tag": "T1", "name": "GPU - Tesla V100", "desc": "NVIDIA Tesla V100 (16 GB HBM2).", "patterns": ["t1-"]},
    {"id": "t1-le", "tag": "T1 LE", "name": "GPU - Tesla V100 LE", "desc": "Limited edition Tesla V100 flavor.", "patterns": ["t1-le"]},
    {"id": "t2", "tag": "T2", "name": "GPU - Tesla V100S", "desc": "NVIDIA Tesla V100S (32 GB HBM2).", "patterns": ["t2-(?!le)"]},
    {"id": "t2-le", "tag": "T2 LE", "name": "GPU - Tesla V100S LE", "desc": "Limited edition V100S flavor.", "patterns": ["t2-le"]},
    {"id": "l4", "tag": "L4", "name": "GPU - NVIDIA L4", "desc": "Efficient NVIDIA L4 for inference and media.", "patterns": ["l4-"]},
    {"id": "rtx5000", "tag": "RTX", "name": "GPU - RTX 5000", "desc": "NVIDIA RTX 5000 for graphics and rendering.", "patterns": ["rtx5000-"]},
    {"id": "a10", "tag": "A10", "name": "GPU - NVIDIA A10", "desc": "NVIDIA A10 (24 GB) for inference and graphics.", "patterns": ["a10-"]},
    {"id": "l40s", "tag": "L40S", "name": "GPU - NVIDIA L40S", "desc": "NVIDIA L40S (48 GB) for AI inference.", "patterns": ["l40s-"]},
    {"id": "a100", "tag": "A100", "name": "GPU - NVIDIA A100", "desc": "NVIDIA A100 (80 GB HBM2) for large-scale AI training.", "patterns": ["a100-"]},
    {"id": "h100", "tag": "H100", "name": "GPU - NVIDIA H100", "desc": "NVIDIA H100 — flagship AI accelerator.", "patterns": ["h100-"]},
    {"id": "h200", "tag": "H200", "name": "GPU - NVIDIA H200", "desc": "NVIDIA H200 with HBM3e memory.", "patterns": ["h200-"]},
]

DB_LABELS = {"mysql": "MySQL", "postgresql": "PostgreSQL", "mongodb": "MongoDB", "redis": "Redis", "valkey": "Valkey", "kafka": "Kafka", "opensearch": "OpenSearch", "clickhouse": "ClickHouse", "grafana": "Grafana", "m3db": "M3DB", "cassandra": "Cassandra"}
DB_TIERS = ["discovery", "essential", "production", "business", "enterprise", "advanced"]


def build_live_cloud_catalog(db: Session) -> Dict[str, Any]:
    """Return the grouped cloud catalog. Raises on upstream failure (caller falls back to cache)."""
    now = time.time()
    if _CACHE["data"] and now - _CACHE["ts"] < _TTL:
        return _CACHE["data"]

    ovh = get_ovh_client_from_db(db)
    raw = ovh.get_public_catalog("cloud")
    margin = get_margin_for_category(db, ServiceCategory.PUBLIC_CLOUD)
    items = _collect(raw, margin)
    # Hourly-billed resources are capped at a monthly rate — estimate where absent.
    for it in items.values():
        if it["hour"] is not None and it["month"] is None:
            it["month"] = round(it["hour"] * 730, 2)

    db_secs: List[Dict[str, Any]] = []
    engines: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for code, it in items.items():
        m = re.match(r"databases\.([a-z]+)-([a-z]+)-(.*)", code)
        if not m:
            continue
        eng, tier, size = m.groups()
        engines.setdefault(eng, {}).setdefault(tier, []).append({**it, "name": f"{tier.capitalize()} {size.upper()}"})
    for eng, label in DB_LABELS.items():
        if eng not in engines:
            continue
        merged: List[Dict[str, Any]] = []
        for tier in DB_TIERS:
            merged.extend(engines[eng].get(tier, []))
        db_secs.append({"id": f"db-{eng}", "title": f"Managed {label}", "desc": f"Fully managed {label} — backups, updates and monitoring included.", "items": merged})

    catalog_data = {
        "compute": [
            {"id": "vm", "title": "Virtual Machine Instances", "desc": "Get versatile instances that can be adapted to suit all your needs.", "families": _families(items, VM_DEFS)},
            {"id": "gpu", "title": "Cloud GPU", "desc": "Instances with dedicated NVIDIA GPUs for AI, ML, rendering and HPC.", "families": _families(items, GPU_DEFS)},
            {"id": "metal", "title": "Metal Instances", "desc": "Bare-metal performance inside the Public Cloud — dedicated hardware, API-driven.", "families": [{"id": "bm", "tag": "BM", "name": "Metal Instances", "desc": "Single-tenant bare metal instances.", "items": _grp(items, ["bm-"])}]},
            {"id": "backup", "title": "Instance Backup", "desc": "Back up your instances and volumes — billed per GB stored per hour.", "items": _grp(items, ["image$", "snapshot$", "volume-backup", "volume\\.snapshot"])},
            {"id": "private-images", "title": "Private Image Catalog", "desc": "Store and manage your own images. Image catalog is free — you pay only for the underlying object storage.", "items": _grp(items, ["image$"])},
            {"id": "public-images", "title": "Public Image Catalog", "desc": "Ready-to-use Linux and Windows images maintained for you. Free of charge.", "simpleRows": [{"name": "Public images", "price": "Free", "note": "Ubuntu, Debian, Rocky, Windows, panels"}]},
        ],
        "network": [
            {"id": "loadbalancer", "title": "Load Balancer", "desc": "L4/L7 load balancing with health checks, SSL termination and multi-region support.", "items": _grp(items, ["octavia-loadbalancer", "loadbalancer\\."])},
            {"id": "floatingip", "title": "Floating IP", "desc": "Flexible public IPv4 addresses, movable between instances.", "items": _grp(items, ["floatingip", "publicip"])},
            {"id": "gateway", "title": "Gateway", "desc": "Managed outbound gateway (SNAT) for private instances.", "items": _grp(items, ["gateway\\."])},
            {"id": "vrack", "title": "Private Network (vRack)", "desc": "Private L2 networking between all your services — free.", "items": _grp(items, ["bandwidth_instance_vrack", "vrack"])},
        ],
        "storage": [
            {"id": "block", "title": "Block Storage", "desc": "Persistent volumes attachable to instances — billed per GB per hour.", "items": _grp(items, ["volume\\."])},
            {"id": "file", "title": "File Storage", "desc": "Managed NFS file shares, replicated x3.", "items": _grp(items, ["share"])},
            {"id": "local", "title": "Local Storage", "desc": "Instance-attached low-latency NVMe storage.", "items": _grp(items, ["instance\\.local-storage"])},
            {"id": "object", "title": "Object Storage", "desc": "S3-compatible object storage classes.", "items": _grp(items, ["storage", "archive$", "coldarchive", "bandwidth_storage"])},
        ],
        "containers": [
            {"id": "k8s", "title": "Managed Kubernetes", "desc": "Managed Kubernetes control plane — free tier available. Pay only for worker node instances.", "items": _grp(items, ["mks\\.", "kubernetes"])},
            {"id": "registry", "title": "Managed Private Registry", "desc": "Managed OCI registry for container images and Helm charts.", "items": _grp(items, ["registry\\."])},
            {"id": "rancher", "title": "Managed Rancher", "desc": "Managed Rancher for multi-cluster Kubernetes management.", "items": _grp(items, ["rancher\\."])},
        ],
        "databases": db_secs,
        "analytics": [{"id": "analytics", "title": "Analytics", "desc": "Kafka, ClickHouse, Grafana and OpenSearch analytics services — billed like Managed Databases.", "items": []}],
        "data-platform": [{"id": "dp", "title": "Data Platform", "desc": "Managed data processing, lakehouse and application services.", "items": _grp(items, ["dataplatform\\."])}],
        "ai": [
            {"id": "ai-notebooks", "title": "AI Notebooks", "desc": "Managed Jupyter/VSCode notebooks on CPU or GPU — billed per second.", "items": _grp(items, ["ai-notebook"])},
            {"id": "ai-training", "title": "AI Training", "desc": "Run training jobs on dedicated CPU/GPU without managing infrastructure.", "items": _grp(items, ["ai-training"])},
            {"id": "ai-deploy", "title": "AI Deploy", "desc": "Deploy ML models as scalable API endpoints.", "items": _grp(items, ["ai-app"])},
            {"id": "ai-endpoints", "title": "AI Endpoints", "desc": "Serverless LLM/AI inference APIs — pay per token or per second.", "items": _grp(items, ["ai-endpoints", "ai-voxist"])},
        ],
        "quantum": [
            {"id": "q-notebooks", "title": "Quantum Notebooks", "desc": "Quantum emulators powered by notebook infrastructure.", "items": _grp(items, ["quantum-notebook"])},
            {"id": "qpu", "title": "Quantum Processing Units", "desc": "Real QPU access — quantum processors.", "items": _grp(items, ["quantum-processing-unit"])},
        ],
    }

    _CACHE["data"] = {"updated": int(now), "source": "live", "catalog": catalog_data}
    _CACHE["ts"] = now
    return _CACHE["data"]


def get_live_cloud_catalog(db: Session) -> Dict[str, Any]:
    """Serve cached live catalog; on upstream failure, return stale cache."""
    try:
        return build_live_cloud_catalog(db)
    except Exception:
        if _CACHE["data"]:
            return {**_CACHE["data"], "source": "stale-cache"}
        raise
