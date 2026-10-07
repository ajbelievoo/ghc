from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.services import marketplace_service
from app.models.models import (
    GpuInstance,
    GpuStatus,
    KubernetesCluster,
    K8sClusterStatus,
    User,
    Vpc,
    VpcStatus,
    WhiteLabelTenant,
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


class GpuCreate(BaseModel):
    name: str
    gpu_model: str
    vram_gb: int
    cuda_cores: int = 0
    node_flavor: Optional[str] = None
    price_hourly: float
    price_monthly: Optional[float] = None
    currency: str = "INR"
    availability_zone: Optional[str] = None
    meta_data: dict = Field(default_factory=dict)


class VpcCreate(BaseModel):
    name: str
    cidr: str
    region: Optional[str] = None
    subnets: List[dict] = Field(default_factory=list)
    firewall_rules: List[dict] = Field(default_factory=list)


class K8sCreate(BaseModel):
    name: str
    version: str = "1.28"
    node_pools: List[dict] = Field(default_factory=list)


class WhiteLabelCreate(BaseModel):
    name: str
    slug: str
    custom_domain: Optional[str] = None
    brand_color: Optional[str] = "#00b7ff"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    support_email: Optional[str] = None
    margin_percent: float = 0.0
    settings: dict = Field(default_factory=dict)


class WhiteLabelUpdate(BaseModel):
    name: Optional[str] = None
    custom_domain: Optional[str] = None
    brand_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    support_email: Optional[str] = None
    margin_percent: Optional[float] = None
    is_active: Optional[bool] = None
    settings: Optional[dict] = None


# --- GPU ---
@router.get("/gpu")
def list_gpus(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(GpuInstance).all()


@router.post("/gpu", status_code=201)
def create_gpu(data: GpuCreate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    item = GpuInstance(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/gpu/{gpu_id}")
def get_gpu(gpu_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(GpuInstance).filter(GpuInstance.id == gpu_id).first()
    if not item:
        raise HTTPException(404, "GPU not found")
    return item


@router.post("/gpu/{gpu_id}/provision")
def provision_gpu(gpu_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(GpuInstance).filter(GpuInstance.id == gpu_id).first()
    if not item:
        raise HTTPException(404, "GPU not found")
    if item.status.value != "available":
        raise HTTPException(409, "GPU not available")
    return marketplace_service.provision_gpu(db, gpu_id)


@router.post("/gpu/{gpu_id}/deprovision")
def deprovision_gpu(gpu_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(GpuInstance).filter(GpuInstance.id == gpu_id).first()
    if not item:
        raise HTTPException(404, "GPU not found")
    return marketplace_service.deprovision_gpu(db, gpu_id)


# --- VPC ---
@router.get("/vpcs")
def list_vpcs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Vpc).filter(Vpc.user_id == user.id).all()


@router.post("/vpcs", status_code=201)
def create_vpc(data: VpcCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = Vpc(user_id=user.id, status=VpcStatus.PENDING, **data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/vpcs/{vpc_id}")
def get_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Vpc).filter(Vpc.id == vpc_id, Vpc.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "VPC not found")
    return item


@router.post("/vpcs/{vpc_id}/provision")
def provision_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Vpc).filter(Vpc.id == vpc_id, Vpc.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "VPC not found")
    return marketplace_service.provision_vpc(db, vpc_id)


@router.post("/vpcs/{vpc_id}/deprovision")
def deprovision_vpc(vpc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Vpc).filter(Vpc.id == vpc_id, Vpc.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "VPC not found")
    return marketplace_service.deprovision_vpc(db, vpc_id)


# --- Kubernetes ---
@router.get("/kubernetes")
def list_clusters(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(KubernetesCluster).filter(KubernetesCluster.user_id == user.id).all()


@router.post("/kubernetes", status_code=201)
def create_cluster(data: K8sCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = KubernetesCluster(user_id=user.id, status=K8sClusterStatus.PENDING, **data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/kubernetes/{cluster_id}")
def get_cluster(cluster_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(KubernetesCluster).filter(KubernetesCluster.id == cluster_id, KubernetesCluster.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Cluster not found")
    return item


@router.post("/kubernetes/{cluster_id}/provision")
def provision_cluster(cluster_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(KubernetesCluster).filter(KubernetesCluster.id == cluster_id, KubernetesCluster.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Cluster not found")
    return marketplace_service.provision_kubernetes(db, cluster_id)


@router.post("/kubernetes/{cluster_id}/deprovision")
def deprovision_cluster(cluster_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(KubernetesCluster).filter(KubernetesCluster.id == cluster_id, KubernetesCluster.user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Cluster not found")
    return marketplace_service.deprovision_kubernetes(db, cluster_id)


# --- White-label ---
@router.get("/white-label")
def list_tenants(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(WhiteLabelTenant).filter(WhiteLabelTenant.owner_user_id == user.id).all()


@router.post("/white-label", status_code=201)
def create_tenant(data: WhiteLabelCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(WhiteLabelTenant).filter(WhiteLabelTenant.slug == data.slug).first()
    if existing:
        raise HTTPException(409, "Slug already in use")
    item = WhiteLabelTenant(owner_user_id=user.id, **data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/white-label/{tenant_id}")
def update_tenant(tenant_id: str, data: WhiteLabelUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(WhiteLabelTenant).filter(WhiteLabelTenant.id == tenant_id, WhiteLabelTenant.owner_user_id == user.id).first()
    if not item:
        raise HTTPException(404, "Tenant not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item
