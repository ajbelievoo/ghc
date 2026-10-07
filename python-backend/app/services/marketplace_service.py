import asyncio
import logging
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.models import (
    GpuInstance,
    KubernetesCluster,
    K8sClusterStatus,
    Vpc,
    VpcStatus,
    WhiteLabelTenant,
)

logger = logging.getLogger(__name__)


def provision_gpu(db: Session, gpu_id: str) -> GpuInstance:
    gpu = db.query(GpuInstance).filter(GpuInstance.id == gpu_id).first()
    if not gpu:
        raise ValueError("GPU not found")

    # Placeholder: real implementation would call cloud GPU API
    gpu.status = "in_use" if gpu.status == "available" else gpu.status
    gpu.meta_data = {**(gpu.meta_data or {}), "provisioned_at": datetime.utcnow().isoformat()}
    db.commit()
    db.refresh(gpu)
    return gpu


def deprovision_gpu(db: Session, gpu_id: str) -> GpuInstance:
    gpu = db.query(GpuInstance).filter(GpuInstance.id == gpu_id).first()
    if not gpu:
        raise ValueError("GPU not found")

    gpu.status = "available"
    gpu.meta_data = {**(gpu.meta_data or {}), "deprovisioned_at": datetime.utcnow().isoformat()}
    db.commit()
    db.refresh(gpu)
    return gpu


def provision_vpc(db: Session, vpc_id: str) -> Vpc:
    vpc = db.query(Vpc).filter(Vpc.id == vpc_id).first()
    if not vpc:
        raise ValueError("VPC not found")

    vpc.status = VpcStatus.ACTIVE
    vpc.provider_ref = f"ovh-vpc-{uuid4().hex[:12]}"
    if not vpc.subnets:
        vpc.subnets = [
            {"cidr_block": _next_subnet(vpc.cidr, 0), "availability_zone": vpc.availability_zone or "default"}
        ]
    if not vpc.routes:
        vpc.routes = [{"destination": "0.0.0.0/0", "target": "igw"}]
    db.commit()
    db.refresh(vpc)
    return vpc


def deprovision_vpc(db: Session, vpc_id: str) -> Vpc:
    vpc = db.query(Vpc).filter(Vpc.id == vpc_id).first()
    if not vpc:
        raise ValueError("VPC not found")

    vpc.status = VpcStatus.DELETING
    db.commit()
    # Async cleanup would remove cloud resource
    vpc.status = VpcStatus.FAILED if False else VpcStatus.ACTIVE
    db.commit()
    db.refresh(vpc)
    return vpc


def provision_kubernetes(db: Session, cluster_id: str) -> KubernetesCluster:
    cluster = db.query(KubernetesCluster).filter(KubernetesCluster.id == cluster_id).first()
    if not cluster:
        raise ValueError("Cluster not found")

    cluster.status = K8sClusterStatus.ACTIVE
    cluster.provider_ref = f"k8s-{uuid4().hex[:12]}"
    cluster.endpoint = f"https://{cluster.provider_ref}.k8s.ghc.believoo.com"
    cluster.billing_payload = {
        "node_count": sum(pool.get("count", 0) for pool in (cluster.node_pools or [])),
        "control_plane_fee": 500.0,
    }
    db.commit()
    db.refresh(cluster)
    return cluster


def deprovision_kubernetes(db: Session, cluster_id: str) -> KubernetesCluster:
    cluster = db.query(KubernetesCluster).filter(KubernetesCluster.id == cluster_id).first()
    if not cluster:
        raise ValueError("Cluster not found")

    cluster.status = K8sClusterStatus.DELETING
    db.commit()
    cluster.status = K8sClusterStatus.FAILED if False else K8sClusterStatus.ACTIVE
    db.commit()
    db.refresh(cluster)
    return cluster


def apply_white_label(db: Session, tenant_id: str) -> WhiteLabelTenant:
    tenant = db.query(WhiteLabelTenant).filter(WhiteLabelTenant.id == tenant_id).first()
    if not tenant:
        raise ValueError("Tenant not found")

    tenant.is_active = True
    tenant.settings = {**(tenant.settings or {}), "applied_at": datetime.utcnow().isoformat()}
    db.commit()
    db.refresh(tenant)
    return tenant


def _next_subnet(cidr: str, index: int) -> str:
    base = cidr.rsplit(".", 1)[0]
    return f"{base}.{index * 64}/26"


async def marketplace_worker():
    """Background worker that processes pending VPC and K8s provisioning requests."""
    while True:
        try:
            db = SessionLocal()
            try:
                pending_vpcs = (
                    db.query(Vpc)
                    .filter(Vpc.status == VpcStatus.PENDING)
                    .limit(10)
                    .all()
                )
                for vpc in pending_vpcs:
                    try:
                        provision_vpc(db, vpc.id)
                        logger.info(f"VPC {vpc.id} provisioned")
                    except Exception as e:
                        logger.exception(f"VPC {vpc.id} provisioning failed: {e}")
                        vpc.status = VpcStatus.FAILED
                        db.commit()

                pending_k8s = (
                    db.query(KubernetesCluster)
                    .filter(KubernetesCluster.status == K8sClusterStatus.PENDING)
                    .limit(10)
                    .all()
                )
                for cluster in pending_k8s:
                    try:
                        provision_kubernetes(db, cluster.id)
                        logger.info(f"K8s cluster {cluster.id} provisioned")
                    except Exception as e:
                        logger.exception(f"K8s {cluster.id} provisioning failed: {e}")
                        cluster.status = K8sClusterStatus.FAILED
                        db.commit()
            finally:
                db.close()
        except Exception:
            logger.exception("Marketplace worker loop error")

        await asyncio.sleep(30)
