"""Public Cloud provisioning service — real upstream OVH cloud project
lifecycle: project discovery, instance launch, status sync, hourly wallet
billing, and resource actions (volumes, floating IPs, containers, SSH keys)."""
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.models import (
    CloudFloatingIp, CloudInstance, CloudProject, CloudStorageContainer,
    CloudSshKey, CloudVolume, User, UserNotification, Wallet, WalletTransaction,
    WalletTransactionType,
)
from app.services.ovh_client import OvhClient, get_ovh_client_from_db

logger = logging.getLogger(__name__)

HOURLY_GRACE_HOURS = 48       # suspend after this many unpaid hours
LOW_BALANCE_HOURS = 24        # warn when balance < 24h of usage


class CloudError(Exception):
    def __init__(self, message: str, code: str = "cloud_error"):
        super().__init__(message)
        self.code = code


# ---------- project ----------

def sync_project(db: Session, user: User, ovh: Optional[OvhClient] = None) -> CloudProject:
    """Discover the upstream cloud project and mirror it locally."""
    ovh = ovh or get_ovh_client_from_db(db)
    proj = db.query(CloudProject).filter(CloudProject.user_id == user.id).first()
    try:
        projects = ovh.list_cloud_projects() or []
    except Exception as e:
        logger.warning("cloud project list failed: %s", e)
        projects = []
    if projects:
        upstream_id = projects[0]
        if not proj:
            proj = CloudProject(user_id=user.id, upstream_project_id=upstream_id, status="ACTIVE")
            db.add(proj)
        else:
            proj.upstream_project_id = upstream_id
            proj.status = "ACTIVE"
        try:
            info = ovh.get_cloud_project(upstream_id)
            proj.name = info.get("description") or proj.name
            plan = info.get("planCode") or ""
            if plan == "project.discovery":
                proj.status = "DISCOVERY"   # sandbox — cannot run instances
            elif info.get("status") and info["status"] != "ok":
                proj.status = "PENDING"
        except Exception:
            pass
    elif proj and not proj.upstream_project_id:
        proj.status = "PENDING"
    elif not proj:
        proj = CloudProject(user_id=user.id, status="PENDING")
        db.add(proj)
    db.commit()
    return proj


def ensure_active_project(db: Session, user: User, ovh: Optional[OvhClient] = None) -> CloudProject:
    proj = sync_project(db, user, ovh)
    if proj.status != "ACTIVE" or not proj.upstream_project_id:
        raise CloudError(
            "Cloud project activation is in progress. The first project requires upstream validation — try again shortly.",
            code="project_pending",
        )
    return proj


# ---------- pricing ----------

def lookup_flavor_price(db: Session, flavor_code: str) -> Dict[str, Any]:
    """Find the GHC (margin-applied) price for a flavor code from the live catalog."""
    from app.services.cloud_live_service import get_live_cloud_catalog
    try:
        catalog = get_live_cloud_catalog(db).get("catalog", {})
    except Exception:
        catalog = {}
    base = flavor_code.split(".")[0].lower()
    for section_items in catalog.values():
        for section in (section_items or []):
            for item in section.get("items", []):
                if (item.get("code") or "").lower() == base:
                    return {"code": item["code"], "title": item.get("title"), "hour": item.get("hour") or 0.0,
                            "month": item.get("month") or 0.0, "specs": item.get("specs") or {}}
    return {}


# ---------- instances ----------

def _find_flavor(ovh: OvhClient, project_id: str, region: str, flavor_code: str) -> Optional[Dict[str, Any]]:
    """Find a flavor entry. Region may be a parent code (GRA) — resolve to a
    concrete upstream region (GRA11/GRA7/GRA9) where the flavor is available."""
    try:
        flavors = [f for f in (ovh.cloud_flavors(project_id) or []) if f.get("name", "").lower() == flavor_code.lower() and f.get("available", True)]
    except Exception as e:
        logger.warning("flavor lookup failed: %s", e)
        return None
    exact = [f for f in flavors if f.get("region") == region]
    if exact:
        return exact[0]
    prefixed = [f for f in flavors if str(f.get("region", "")).startswith(region)]
    return prefixed[0] if prefixed else (flavors[0] if flavors else None)


def _find_image_id(ovh: OvhClient, project_id: str, region: str, image_name: Optional[str]) -> Optional[str]:
    if not image_name:
        return None
    want = image_name.lower()
    try:
        for img in ovh.cloud_images(project_id) or []:
            if img.get("region") != region:
                continue
            name = f"{img.get('name','')} {img.get('type','')}".lower()
            if want in name:
                return img.get("id")
        for img in ovh.cloud_images(project_id) or []:
            if want in str(img.get("name", "")).lower():
                return img.get("id")
    except Exception as e:
        logger.warning("image lookup failed: %s", e)
    return None


def launch_instance(db: Session, user: User, cfg: Dict[str, Any]) -> CloudInstance:
    ovh = get_ovh_client_from_db(db)
    flavor_code = (cfg.get("flavor") or "").strip()
    region = (cfg.get("region") or "").strip().upper()
    if not flavor_code or not region:
        raise CloudError("flavor and region are required", code="bad_request")

    price = lookup_flavor_price(db, flavor_code)
    hourly = float(price.get("hour") or 0.0)
    monthly = float(price.get("month") or 0.0) or hourly * 730
    count = max(1, min(10, int(cfg.get("count") or 1)))

    wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    balance = wallet.balance if wallet else 0.0
    need = hourly * LOW_BALANCE_HOURS * count
    if hourly > 0 and balance < need:
        raise CloudError(f"Insufficient wallet balance — top up at least {need:.2f} {wallet.currency if wallet else 'INR'} (≈24h of usage).", code="insufficient_balance")

    proj = ensure_active_project(db, user, ovh)
    project_id = proj.upstream_project_id

    flav = _find_flavor(ovh, project_id, region, flavor_code)
    if not flav:
        raise CloudError(f"Flavor {flavor_code} is not available in region {region}", code="flavor_unavailable")
    flavor_id = flav["id"]
    region = flav.get("region") or region  # resolved concrete region
    image_id = _find_image_id(ovh, project_id, region, cfg.get("image"))

    ssh_key_id = None
    if cfg.get("ssh_key_name"):
        try:
            for k in ovh.cloud_sshkeys(project_id) or []:
                if k.get("name") == cfg["ssh_key_name"]:
                    ssh_key_id = k.get("id")
                    break
        except Exception:
            pass

    created: List[CloudInstance] = []
    for i in range(count):
        name = cfg.get("instance_name") or f"{flavor_code}-{datetime.utcnow():%Y%m%d%H%M}"
        if count > 1:
            name = f"{name}-{i+1}"
        payload: Dict[str, Any] = {
            "flavorId": flavor_id,
            "name": name,
            "region": region,
            "monthlyBilling": False,
        }
        if image_id:
            payload["imageId"] = image_id
        if ssh_key_id:
            payload["sshKeyId"] = ssh_key_id
        if cfg.get("post_script"):
            payload["userData"] = cfg["post_script"]

        inst = CloudInstance(
            user_id=user.id, project_id=proj.id, name=name,
            flavor_code=flavor_code, flavor_name=price.get("title"),
            image=cfg.get("image"), region=region,
            deploy_mode=cfg.get("deploy_mode", "1az"),
            hourly_price=hourly, monthly_price=monthly,
            currency=(wallet.currency if wallet else "INR"),
            status="BUILDING", config=cfg,
            billing_started_at=datetime.utcnow(), last_billed_at=datetime.utcnow(),
        )
        try:
            res = ovh.cloud_create_instance(project_id, payload)
            inst.upstream_instance_id = res.get("id")
            inst.upstream_status = res.get("status")
            for ip in (res.get("ipAddresses") or []):
                if ip.get("type") == "public" and not inst.public_ip:
                    inst.public_ip = ip.get("ip")
        except Exception as e:
            logger.error("upstream instance create failed: %s", e)
            inst.status = "PENDING"
            inst.upstream_status = f"upstream_error: {e}"
        db.add(inst)
        created.append(inst)
    db.commit()
    return created[0] if created else (_ for _ in ()).throw(CloudError("no instance created"))


def sync_instances(db: Session, user: User) -> List[CloudInstance]:
    proj = db.query(CloudProject).filter(CloudProject.user_id == user.id).first()
    rows = db.query(CloudInstance).filter(CloudInstance.user_id == user.id).all()
    if not proj or not proj.upstream_project_id:
        return rows
    ovh = get_ovh_client_from_db(db)
    try:
        upstream = {i.get("id"): i for i in (ovh.cloud_instances(proj.upstream_project_id) or [])}
    except Exception as e:
        logger.warning("instance sync failed: %s", e)
        return rows
    for inst in rows:
        if inst.upstream_instance_id and inst.upstream_instance_id in upstream:
            u = upstream[inst.upstream_instance_id]
            inst.upstream_status = u.get("status")
            inst.last_status_sync = datetime.utcnow()
            st = (u.get("status") or "").upper()
            if st == "ACTIVE" and inst.status in ("BUILDING", "PENDING", "STOPPED", "SUSPENDED"):
                inst.status = "ACTIVE" if inst.status != "SUSPENDED" else "SUSPENDED"
            elif st in ("SHUTOFF", "STOPPED") and inst.status == "ACTIVE":
                inst.status = "STOPPED"
            elif st in ("ERROR", "DELETED"):
                inst.status = "ERROR" if st == "ERROR" else "DELETED"
            for ip in (u.get("ipAddresses") or []):
                if ip.get("type") == "public" and not inst.public_ip:
                    inst.public_ip = ip.get("ip")
                if ip.get("type") == "private" and not inst.private_ip:
                    inst.private_ip = ip.get("ip")
        elif inst.upstream_instance_id and inst.status not in ("DELETED",):
            inst.status = "DELETED"
            inst.terminated_at = inst.terminated_at or datetime.utcnow()
    db.commit()
    return rows


def instance_action(db: Session, user: User, instance_id: str, action: str, extra: Optional[Dict] = None) -> CloudInstance:
    inst = db.query(CloudInstance).filter(CloudInstance.id == instance_id, CloudInstance.user_id == user.id).first()
    if not inst:
        raise CloudError("instance not found", code="not_found")
    proj = db.query(CloudProject).filter(CloudProject.id == inst.project_id).first() if inst.project_id else None

    allowed = {"start", "stop", "reboot", "reinstall", "shelve", "unshelve", "delete"}
    if action not in allowed:
        raise CloudError(f"unknown action {action}", code="bad_request")

    if action == "delete":
        if inst.upstream_instance_id and proj and proj.upstream_project_id:
            try:
                get_ovh_client_from_db(db).cloud_delete_instance(proj.upstream_project_id, inst.upstream_instance_id)
            except Exception as e:
                logger.warning("upstream delete failed: %s", e)
        inst.status = "DELETED"
        inst.terminated_at = datetime.utcnow()
        db.commit()
        return inst

    if not inst.upstream_instance_id or not proj or not proj.upstream_project_id:
        raise CloudError("instance is not provisioned upstream yet", code="project_pending")

    ovh = get_ovh_client_from_db(db)
    try:
        if action == "start":
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "start")
            inst.status = "ACTIVE"
        elif action == "stop":
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "stop")
            inst.status = "STOPPED"
        elif action == "reboot":
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "reboot", type="soft")
        elif action == "reinstall":
            image_id = _find_image_id(ovh, proj.upstream_project_id, inst.region, (extra or {}).get("image") or inst.image)
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "reinstall", imageId=image_id)
            inst.status = "BUILDING"
        elif action == "shelve":
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "shelve")
            inst.status = "STOPPED"
        elif action == "unshelve":
            ovh.cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "unshelve")
            inst.status = "ACTIVE"
    except Exception as e:
        raise CloudError(f"action failed: {e}", code="upstream_error")
    inst.last_status_sync = datetime.utcnow()
    db.commit()
    return inst


# ---------- hourly billing ----------

def billing_tick(db: Session) -> Dict[str, int]:
    """Debit wallet for each ACTIVE instance/volume/floating-IP per elapsed hour."""
    now = datetime.utcnow()
    stats = {"billed": 0, "suspended": 0, "warned": 0}
    billable = db.query(CloudInstance).filter(CloudInstance.status == "ACTIVE").all()
    for inst in billable:
        last = inst.last_billed_at or inst.billing_started_at or inst.launched_at
        hours = int((now - last).total_seconds() // 3600)
        if hours < 1 or inst.hourly_price <= 0:
            continue
        wallet = db.query(Wallet).filter(Wallet.user_id == inst.user_id).first()
        if not wallet:
            continue
        amount = round(inst.hourly_price * hours, 4)
        if wallet.balance >= amount:
            wallet.balance -= amount
            wallet.updated_at = now
            db.add(WalletTransaction(
                wallet_id=wallet.id, type=WalletTransactionType.DEBIT,
                amount=amount, gateway="hourly-billing", status="COMPLETED",
                description=f"Hourly usage — {inst.name} ({inst.flavor_code}) ×{hours}h",
                meta_data={"instance_id": inst.id, "hours": hours, "rate": inst.hourly_price},
            ))
            inst.last_billed_at = last + timedelta(hours=hours)
            stats["billed"] += 1
            if wallet.balance < inst.hourly_price * LOW_BALANCE_HOURS:
                db.add(UserNotification(
                    user_id=inst.user_id, type="warning", title="Low wallet balance",
                    message=f"Your wallet balance is below ~24h of usage for {inst.name}. Top up to keep it running.",
                    link="/dashboard?tab=wallet",
                ))
                stats["warned"] += 1
        else:
            # insufficient — suspend the instance upstream and mark
            proj = db.query(CloudProject).filter(CloudProject.id == inst.project_id).first() if inst.project_id else None
            if proj and proj.upstream_project_id and inst.upstream_instance_id:
                try:
                    get_ovh_client_from_db(db).cloud_instance_action(proj.upstream_project_id, inst.upstream_instance_id, "stop")
                except Exception as e:
                    logger.warning("suspend stop failed: %s", e)
            inst.status = "SUSPENDED"
            db.add(UserNotification(
                user_id=inst.user_id, type="error", title="Instance suspended — insufficient balance",
                message=f"{inst.name} was stopped because your wallet could not cover {amount:.2f} {wallet.currency}. Top up and start it again.",
                link="/dashboard?tab=wallet",
            ))
            stats["suspended"] += 1

    # Volumes and Floating IPs bill while they exist (regardless of attach state)
    for model, label in ((CloudVolume, "volume"), (CloudFloatingIp, "floating-ip")):
        for res in db.query(model).filter(getattr(model, "status").notlike("pending:%")).all():
            rate = getattr(res, "hourly_price", 0) or 0
            if rate <= 0:
                continue
            last = res.last_billed_at or res.created_at
            hours = int((now - last).total_seconds() // 3600)
            if hours < 1:
                continue
            wallet = db.query(Wallet).filter(Wallet.user_id == res.user_id).first()
            if not wallet:
                continue
            amount = round(rate * hours, 4)
            if wallet.balance >= amount:
                wallet.balance -= amount
                wallet.updated_at = now
                db.add(WalletTransaction(
                    wallet_id=wallet.id, type=WalletTransactionType.DEBIT,
                    amount=amount, gateway="hourly-billing", status="COMPLETED",
                    description=f"Hourly usage — {label} {getattr(res, 'name', res.ip or '')} ×{hours}h",
                    meta_data={f"{label}_id": res.id, "hours": hours, "rate": rate},
                ))
                res.last_billed_at = last + timedelta(hours=hours)
                stats["billed"] += 1
            else:
                db.add(UserNotification(
                    user_id=res.user_id, type="warning", title="Unbilled resource — low balance",
                    message=f"Your {label} could not be billed ({amount:.2f} {wallet.currency}). Top up to avoid suspension.",
                    link="/dashboard?tab=wallet",
                ))
                stats["warned"] += 1
    db.commit()
    return stats


# ---------- ssh keys ----------

def add_ssh_key(db: Session, user: User, name: str, public_key: str, region: Optional[str] = None) -> CloudSshKey:
    fp = hashlib.sha256(public_key.strip().encode()).hexdigest()[:32]
    key = CloudSshKey(user_id=user.id, name=name, public_key=public_key.strip(), fingerprint=fp, region=region)
    proj = db.query(CloudProject).filter(CloudProject.user_id == user.id, CloudProject.status == "ACTIVE").first()
    if proj and proj.upstream_project_id:
        try:
            res = get_ovh_client_from_db(db).cloud_create_sshkey(proj.upstream_project_id, name, public_key.strip(), region)
            key.upstream_key_id = res.get("id")
        except Exception as e:
            logger.warning("upstream sshkey create failed: %s", e)
    db.add(key)
    db.commit()
    return key


# ---------- resources (volumes / floating ip / containers) ----------

def sync_volumes(db: Session, user: User) -> List[CloudVolume]:
    proj = db.query(CloudProject).filter(CloudProject.user_id == user.id).first()
    rows = db.query(CloudVolume).filter(CloudVolume.user_id == user.id).all()
    if not proj or not proj.upstream_project_id:
        return rows
    try:
        upstream = {v.get("id"): v for v in (get_ovh_client_from_db(db).cloud_volumes(proj.upstream_project_id) or [])}
    except Exception:
        return rows
    for v in rows:
        if v.upstream_volume_id and v.upstream_volume_id in upstream:
            u = upstream[v.upstream_volume_id]
            v.status = u.get("status") or v.status
            v.attached_instance_id = (u.get("attachedTo") or [None])[0] if isinstance(u.get("attachedTo"), list) else u.get("attachedTo") or v.attached_instance_id
    db.commit()
    return rows


def create_volume(db: Session, user: User, name: str, size_gb: int, region: str, volume_type: str, hourly: float) -> CloudVolume:
    proj = ensure_active_project(db, user)
    vol = CloudVolume(user_id=user.id, project_id=proj.id, name=name, size_gb=size_gb,
                      volume_type=volume_type, region=region.upper(), hourly_price=hourly,
                      status="creating", last_billed_at=datetime.utcnow())
    try:
        res = get_ovh_client_from_db(db).cloud_create_volume(proj.upstream_project_id, {
            "name": name, "size": size_gb, "region": region.upper(), "type": volume_type,
        })
        vol.upstream_volume_id = res.get("id")
        vol.status = res.get("status") or "creating"
    except Exception as e:
        vol.status = f"pending: {e}"
    db.add(vol)
    db.commit()
    return vol


def create_floating_ip(db: Session, user: User, region: str, hourly: float) -> CloudFloatingIp:
    proj = ensure_active_project(db, user)
    ip = CloudFloatingIp(user_id=user.id, project_id=proj.id, region=region.upper(),
                         hourly_price=hourly, status="creating", last_billed_at=datetime.utcnow())
    try:
        res = get_ovh_client_from_db(db).cloud_create_floating_ip(proj.upstream_project_id, region.upper())
        ip.upstream_ip_id = res.get("id")
        ip.ip = res.get("ip")
        ip.status = res.get("status") or "active"
    except Exception as e:
        ip.status = f"pending: {e}"
    db.add(ip)
    db.commit()
    return ip


def create_container(db: Session, user: User, name: str, region: str, ctype: str, monthly: float) -> CloudStorageContainer:
    proj = ensure_active_project(db, user)
    c = CloudStorageContainer(user_id=user.id, project_id=proj.id, name=name, region=region.upper(),
                              container_type=ctype, monthly_price=monthly, status="creating")
    try:
        res = get_ovh_client_from_db(db).cloud_create_storage(proj.upstream_project_id, {
            "containerName": name, "region": region.upper(), "archive": ctype in ("archive", "cold"),
        })
        c.upstream_container_id = res.get("id")
        c.status = "active"
    except Exception as e:
        c.status = f"pending: {e}"
    db.add(c)
    db.commit()
    return c


# ---------- unified service list ----------

def unified_services(db: Session, user: User) -> List[Dict[str, Any]]:
    from app.models.models import Subscription, DomainRegistration
    out: List[Dict[str, Any]] = []
    for s in db.query(Subscription).filter(Subscription.user_id == user.id).all():
        out.append({
            "kind": "subscription", "id": s.id, "name": s.display_name or s.service_name or s.plan_code,
            "category": s.category.value if hasattr(s.category, "value") else str(s.category),
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "renewal": s.next_bill_date.isoformat() if s.next_bill_date else None,
            "auto_renew": s.auto_renew,
            "price": s.price_amount, "currency": s.currency,
            "detail": s.ip_address or s.datacenter,
        })
    for inst in db.query(CloudInstance).filter(CloudInstance.user_id == user.id, CloudInstance.status != "DELETED").all():
        out.append({
            "kind": "cloud-instance", "id": inst.id, "name": inst.name,
            "category": "PUBLIC_CLOUD", "status": inst.status,
            "renewal": None, "price": inst.hourly_price, "currency": inst.currency,
            "detail": f"{inst.flavor_code} · {inst.region} · hourly",
        })
    for d in db.query(DomainRegistration).filter(DomainRegistration.user_id == user.id).all():
        out.append({
            "kind": "domain", "id": d.id, "name": d.domain_name,
            "category": "DOMAIN", "status": d.status.value if hasattr(d.status, "value") else str(d.status),
            "renewal": d.expires_at.isoformat() if d.expires_at else None,
            "auto_renew": d.auto_renew,
            "price": d.price_amount, "currency": d.currency,
        })
    return out
