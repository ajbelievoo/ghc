"""Public Cloud resource management — instances, SSH keys, volumes,
floating IPs, containers, quota, unified service list."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import (
    CloudFloatingIp, CloudInstance, CloudProject, CloudStorageContainer,
    CloudSshKey, CloudVolume, User,
)
from app.services.cloud_service import (
    CloudError, add_ssh_key, billing_tick, create_container, create_floating_ip,
    create_volume, ensure_active_project, instance_action, launch_instance,
    sync_instances, sync_project, sync_volumes, unified_services,
)
from app.services.ovh_client import get_ovh_client_from_db

router = APIRouter(prefix="/api/cloud", tags=["cloud"])


def _err(e: CloudError) -> HTTPException:
    status = {"not_found": 404, "bad_request": 400, "insufficient_balance": 402,
              "project_pending": 409, "flavor_unavailable": 400}.get(e.code, 500)
    return HTTPException(status_code=status, detail=str(e))


# ---------- project ----------

@router.get("/project")
def get_project(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = sync_project(db, user)
    except Exception as e:
        raise HTTPException(500, str(e))
    return {
        "id": proj.id, "upstream_id": proj.upstream_project_id,
        "name": proj.name, "status": proj.status,
        "order_id": proj.upstream_order_id,
    }


@router.post("/project/activate")
def activate_project(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Order the real (non-discovery) cloud project upstream, or re-sync if already placed."""
    try:
        ovh = get_ovh_client_from_db(db)
        proj = db.query(CloudProject).filter(CloudProject.user_id == user.id).first()
        if not proj:
            proj = CloudProject(user_id=user.id)
            db.add(proj)
            db.commit()
        ordered = None
        try:
            cart = ovh.create_cart("GHC cloud project", subsidiary="IN")
            ovh.assign_cart(cart["cartId"])
            ovh.add_item_to_cart(cart["cartId"], "cloud", {"planCode": "project", "duration": "P1M", "pricingMode": "default", "quantity": 1})
            co = ovh.post_cart_checkout(cart["cartId"], auto_pay_with_preferred_payment_mean=True)
            ordered = co
        except Exception as e:
            logger_msg = str(e)
        if ordered and ordered.get("orderId"):
            proj.upstream_order_id = str(ordered["orderId"])
            db.commit()
            return {"status": "ordered", "order_id": ordered["orderId"], "url": ordered.get("url")}
        proj = sync_project(db, user, ovh)
        if proj.status == "DISCOVERY":
            return {"status": "discovery", "message": "Upstream account validation is pending — the full project will activate automatically once approved."}
        return {"status": proj.status.lower(), "upstream_id": proj.upstream_project_id}
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- instances ----------

class InstanceCreate(BaseModel):
    instance_name: Optional[str] = None
    flavor: str
    image: Optional[str] = None
    region: str
    deploy_mode: Optional[str] = "1az"
    availability_zone: Optional[str] = None
    count: Optional[int] = 1
    storage_gb: Optional[int] = None
    ssh_key_name: Optional[str] = None
    public_ip: Optional[str] = "basic"
    network: Optional[Dict[str, Any]] = None
    post_script: Optional[str] = None
    flexible: Optional[bool] = False


def _inst_json(i: CloudInstance) -> Dict[str, Any]:
    return {
        "id": i.id, "upstream_id": i.upstream_instance_id, "name": i.name,
        "flavor": i.flavor_code, "flavor_name": i.flavor_name, "image": i.image,
        "region": i.region, "deploy_mode": i.deploy_mode, "status": i.status,
        "upstream_status": i.upstream_status, "public_ip": i.public_ip,
        "private_ip": i.private_ip, "hourly": i.hourly_price, "monthly": i.monthly_price,
        "currency": i.currency, "launched_at": i.launched_at.isoformat() if i.launched_at else None,
        "terminated_at": i.terminated_at.isoformat() if i.terminated_at else None,
    }


@router.get("/instances")
def list_instances(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = sync_instances(db, user)
    return [_inst_json(i) for i in rows]


@router.post("/instances")
def create_instance(payload: InstanceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        inst = launch_instance(db, user, payload.dict())
        return _inst_json(inst)
    except CloudError as e:
        raise _err(e)


@router.get("/instances/{instance_id}")
def get_instance(instance_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inst = db.query(CloudInstance).filter(CloudInstance.id == instance_id, CloudInstance.user_id == user.id).first()
    if not inst:
        raise HTTPException(404, "instance not found")
    return _inst_json(inst)


class InstanceAction(BaseModel):
    action: str
    image: Optional[str] = None


@router.post("/instances/{instance_id}/action")
def do_instance_action(instance_id: str, payload: InstanceAction, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        inst = instance_action(db, user, instance_id, payload.action, {"image": payload.image})
        return _inst_json(inst)
    except CloudError as e:
        raise _err(e)


# ---------- ssh keys ----------

class SshKeyCreate(BaseModel):
    name: str
    public_key: str
    region: Optional[str] = None


@router.get("/ssh-keys")
def list_ssh_keys(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(CloudSshKey).filter(CloudSshKey.user_id == user.id).order_by(CloudSshKey.created_at.desc()).all()
    return [{"id": k.id, "name": k.name, "public_key": k.public_key, "fingerprint": k.fingerprint,
             "region": k.region, "created_at": k.created_at.isoformat()} for k in rows]


@router.post("/ssh-keys")
def create_ssh_key(payload: SshKeyCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pk = payload.public_key.strip()
    if not (pk.startswith("ssh-") or pk.startswith("ecdsa-")):
        raise HTTPException(400, "not a valid public key (must start with ssh-/ecdsa-)")
    try:
        k = add_ssh_key(db, user, payload.name.strip(), pk, payload.region)
    except Exception as e:
        raise HTTPException(500, str(e))
    return {"id": k.id, "name": k.name, "fingerprint": k.fingerprint}


@router.delete("/ssh-keys/{key_id}")
def delete_ssh_key(key_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    k = db.query(CloudSshKey).filter(CloudSshKey.id == key_id, CloudSshKey.user_id == user.id).first()
    if not k:
        raise HTTPException(404, "key not found")
    proj = db.query(CloudProject).filter(CloudProject.user_id == user.id, CloudProject.status == "ACTIVE").first()
    if proj and proj.upstream_project_id and k.upstream_key_id:
        try:
            get_ovh_client_from_db(db).cloud_delete_sshkey(proj.upstream_project_id, k.upstream_key_id)
        except Exception:
            pass
    db.delete(k)
    db.commit()
    return {"ok": True}


# ---------- volumes ----------

class VolumeCreate(BaseModel):
    name: str
    size_gb: int
    region: str
    volume_type: Optional[str] = "classic"
    hourly_price: Optional[float] = 0.0


@router.get("/volumes")
def list_volumes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = sync_volumes(db, user)
    return [{"id": v.id, "upstream_id": v.upstream_volume_id, "name": v.name, "size_gb": v.size_gb,
             "type": v.volume_type, "region": v.region, "status": v.status,
             "attached_to": v.attached_instance_id, "hourly": v.hourly_price,
             "created_at": v.created_at.isoformat()} for v in rows]


@router.post("/volumes")
def make_volume(payload: VolumeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.size_gb < 10 or payload.size_gb > 4000:
        raise HTTPException(400, "size must be between 10 and 4000 GB")
    try:
        v = create_volume(db, user, payload.name, payload.size_gb, payload.region,
                          payload.volume_type or "classic", payload.hourly_price or 0.0)
        return {"id": v.id, "status": v.status, "upstream_id": v.upstream_volume_id}
    except CloudError as e:
        raise _err(e)


class VolumeAction(BaseModel):
    action: str  # attach | detach
    instance_id: Optional[str] = None  # upstream instance id


@router.post("/volumes/{volume_id}/action")
def volume_action(volume_id: str, payload: VolumeAction, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = db.query(CloudVolume).filter(CloudVolume.id == volume_id, CloudVolume.user_id == user.id).first()
    if not v:
        raise HTTPException(404, "volume not found")
    proj = db.query(CloudProject).filter(CloudProject.id == v.project_id).first() if v.project_id else None
    if not proj or not proj.upstream_project_id or not v.upstream_volume_id:
        raise HTTPException(409, "volume not provisioned upstream yet")
    ovh = get_ovh_client_from_db(db)
    try:
        if payload.action == "attach":
            if not payload.instance_id:
                raise HTTPException(400, "instance_id required")
            inst = db.query(CloudInstance).filter(CloudInstance.user_id == user.id, CloudInstance.upstream_instance_id == payload.instance_id).first()
            if not inst:
                raise HTTPException(404, "instance not found")
            ovh.cloud_volume_action(proj.upstream_project_id, v.upstream_volume_id, "attach", instanceId=payload.instance_id)
            v.attached_instance_id = payload.instance_id
        elif payload.action == "detach":
            inst_id = payload.instance_id or v.attached_instance_id
            ovh.cloud_volume_action(proj.upstream_project_id, v.upstream_volume_id, "detach", instanceId=inst_id)
            v.attached_instance_id = None
        else:
            raise HTTPException(400, "action must be attach|detach")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
    db.commit()
    return {"id": v.id, "status": v.status, "attached_to": v.attached_instance_id}


@router.delete("/volumes/{volume_id}")
def delete_volume(volume_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = db.query(CloudVolume).filter(CloudVolume.id == volume_id, CloudVolume.user_id == user.id).first()
    if not v:
        raise HTTPException(404, "volume not found")
    proj = db.query(CloudProject).filter(CloudProject.id == v.project_id).first() if v.project_id else None
    if proj and proj.upstream_project_id and v.upstream_volume_id:
        try:
            get_ovh_client_from_db(db).cloud_delete_volume(proj.upstream_project_id, v.upstream_volume_id)
        except Exception:
            pass
    db.delete(v)
    db.commit()
    return {"ok": True}


# ---------- floating ips ----------

class FloatingIpCreate(BaseModel):
    region: str
    hourly_price: Optional[float] = 0.0


@router.get("/floating-ips")
def list_floating_ips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(CloudFloatingIp).filter(CloudFloatingIp.user_id == user.id).all()
    return [{"id": r.id, "ip": r.ip, "region": r.region, "status": r.status,
             "hourly": r.hourly_price, "attached_to": r.attached_instance_id,
             "created_at": r.created_at.isoformat()} for r in rows]


@router.post("/floating-ips")
def make_floating_ip(payload: FloatingIpCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        r = create_floating_ip(db, user, payload.region, payload.hourly_price or 0.0)
        return {"id": r.id, "ip": r.ip, "status": r.status}
    except CloudError as e:
        raise _err(e)


@router.delete("/floating-ips/{ip_id}")
def delete_floating_ip(ip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(CloudFloatingIp).filter(CloudFloatingIp.id == ip_id, CloudFloatingIp.user_id == user.id).first()
    if not r:
        raise HTTPException(404, "floating IP not found")
    proj = db.query(CloudProject).filter(CloudProject.id == r.project_id).first() if r.project_id else None
    if proj and proj.upstream_project_id and r.upstream_ip_id:
        try:
            get_ovh_client_from_db(db).delete(f"/cloud/project/{proj.upstream_project_id}/ip/floating/{r.upstream_ip_id}")
        except Exception:
            pass
    db.delete(r)
    db.commit()
    return {"ok": True}


# ---------- private networks & gateways ----------

class NetworkCreate(BaseModel):
    name: str
    region: str
    vlan_id: Optional[int] = None
    cidr: Optional[str] = None
    dhcp: Optional[bool] = True


@router.get("/networks")
def list_networks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_private_networks(proj.upstream_project_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/networks")
def make_network(payload: NetworkCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        body: Dict[str, Any] = {"name": payload.name, "regions": [payload.region.upper()]}
        if payload.vlan_id is not None:
            body["vlanId"] = payload.vlan_id
        if payload.cidr:
            body["subnets"] = [{"cidr": payload.cidr, "dhcp": bool(payload.dhcp)}]
        return get_ovh_client_from_db(db).cloud_create_private_network(proj.upstream_project_id, body)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- storage containers ----------

class ContainerCreate(BaseModel):
    name: str
    region: str
    container_type: Optional[str] = "standard"
    monthly_price: Optional[float] = 0.0


@router.get("/containers")
def list_containers(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(CloudStorageContainer).filter(CloudStorageContainer.user_id == user.id).all()
    return [{"id": c.id, "name": c.name, "region": c.region, "type": c.container_type,
             "status": c.status, "stored_bytes": c.stored_bytes, "objects": c.object_count,
             "monthly": c.monthly_price, "created_at": c.created_at.isoformat()} for c in rows]


@router.post("/containers")
def make_container(payload: ContainerCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        c = create_container(db, user, payload.name, payload.region,
                             payload.container_type or "standard", payload.monthly_price or 0.0)
        return {"id": c.id, "status": c.status}
    except CloudError as e:
        raise _err(e)


@router.delete("/containers/{container_id}")
def delete_container(container_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.query(CloudStorageContainer).filter(CloudStorageContainer.id == container_id, CloudStorageContainer.user_id == user.id).first()
    if not c:
        raise HTTPException(404, "container not found")
    proj = db.query(CloudProject).filter(CloudProject.id == c.project_id).first() if c.project_id else None
    if proj and proj.upstream_project_id and c.upstream_container_id:
        try:
            get_ovh_client_from_db(db).cloud_delete_storage(proj.upstream_project_id, c.upstream_container_id)
        except Exception:
            pass
    db.delete(c)
    db.commit()
    return {"ok": True}


# ---------- managed kubernetes ----------

class KubeCreate(BaseModel):
    name: str
    region: str
    version: Optional[str] = None
    private_network_id: Optional[str] = None


@router.get("/kubes")
def list_kubes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_kubes(proj.upstream_project_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/kubes")
def make_kube(payload: KubeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_create_kube(
            proj.upstream_project_id, payload.name, payload.region.upper(),
            payload.version, payload.private_network_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/kubes/{kube_id}/kubeconfig")
def get_kubeconfig(kube_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_kube_kubeconfig(proj.upstream_project_id, kube_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.delete("/kubes/{kube_id}")
def delete_kube(kube_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        get_ovh_client_from_db(db).cloud_delete_kube(proj.upstream_project_id, kube_id)
        return {"ok": True}
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- private registry ----------

@router.get("/registries")
def list_registries(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_registries(proj.upstream_project_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


class RegistryCreate(BaseModel):
    name: str
    region: str
    plan_id: Optional[str] = None


@router.post("/registries")
def make_registry(payload: RegistryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        ovh = get_ovh_client_from_db(db)
        plan_id = payload.plan_id
        if not plan_id:
            plans = ovh.cloud_registry_plans(proj.upstream_project_id) or []
            small = sorted(plans, key=lambda p: (p.get("registryLimits") or {}).get("imageStorage", 0))
            plan_id = (small[0] if small else {}).get("id")
        if not plan_id:
            raise HTTPException(400, "no registry plan available")
        return ovh.cloud_create_registry(proj.upstream_project_id, payload.name, plan_id, payload.region.upper())
    except CloudError as e:
        raise _err(e)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.delete("/registries/{registry_id}")
def delete_registry(registry_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        get_ovh_client_from_db(db).cloud_delete_registry(proj.upstream_project_id, registry_id)
        return {"ok": True}
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- quota & usage ----------

@router.get("/quota")
def get_quota(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_quotas(proj.upstream_project_id)
    except CloudError as e:
        raise _err(e)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/usage")
def get_usage(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        proj = ensure_active_project(db, user)
        return get_ovh_client_from_db(db).cloud_usage(proj.upstream_project_id)
    except CloudError as e:
        if "no usages found" in str(e).lower() or "not found" in str(e).lower():
            return {"hourlyUsage": {"totalPrice": 0, "hourlyPrice": 0, "resourcesUsage": [], "lastUpdate": None}}
        raise _err(e)
    except Exception as e:
        msg = str(e)
        if "no usages found" in msg.lower() or "not found" in msg.lower():
            return {"hourlyUsage": {"totalPrice": 0, "hourlyPrice": 0, "resourcesUsage": [], "lastUpdate": None}}
        raise HTTPException(500, msg)


# ---------- unified services ----------

@router.get("/services")
def my_services(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return unified_services(db, user)


# ---------- internal: billing tick (service-key protected) ----------

@router.post("/billing-tick")
def run_billing(db: Session = Depends(get_db)):
    return billing_tick(db)
