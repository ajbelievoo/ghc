from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_or_service_key, get_current_user
from app.models.models import PlanCatalog, ServiceCategory, User
from app.schemas.catalog import CatalogResponse, MarginSettingResponse, MarginSettingUpdate, PlanCatalogResponse
from app.services.catalog_service import get_active_plans, get_plan_with_durations, sync_all_catalogs
from app.services.ovh_client import get_ovh_client_from_db

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("/sync", response_model=CatalogResponse)
def sync_catalog(db: Session = Depends(get_db), _: None = Depends(get_admin_or_service_key)):
    try:
        ovh = get_ovh_client_from_db(db)
        results = sync_all_catalogs(db, ovh)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plans", response_model=list[PlanCatalogResponse])
def list_plans(
    category: Optional[ServiceCategory] = None,
    db: Session = Depends(get_db),
):
    plans = get_active_plans(db, category)
    return plans


@router.get("/plans/{plan_code}", response_model=PlanCatalogResponse)
def get_plan(plan_code: str, db: Session = Depends(get_db)):
    plan = get_plan_with_durations(db, plan_code)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.get("/cloud-live")
def live_cloud_catalog(db: Session = Depends(get_db)):
    """Real-time Public Cloud catalog — fetched from the upstream catalog API,
    margin applied, cached 30 min. No auth required (public pricing page)."""
    from app.services.cloud_live_service import get_live_cloud_catalog
    try:
        return get_live_cloud_catalog(db)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Live catalog unavailable: {e}")


@router.get("/private-cloud-live")
def live_hpc_catalog(db: Session = Depends(get_db)):
    """Real-time Hosted Private Cloud catalog — upstream API, margin applied, 30-min cache."""
    from app.services.cloud_live_service import get_live_hpc_catalog
    try:
        return get_live_hpc_catalog(db)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Live catalog unavailable: {e}")


@router.get("/margins", response_model=list[MarginSettingResponse])
def list_margins(db: Session = Depends(get_db)):
    from app.models.models import MarginSetting
    return db.query(MarginSetting).all()


@router.put("/margins/{category}", response_model=MarginSettingResponse)
def update_margin(
    category: ServiceCategory,
    payload: MarginSettingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.models import MarginSetting
    setting = db.query(MarginSetting).filter(MarginSetting.category == category).first()
    if not setting:
        setting = MarginSetting(category=category, percent=payload.percent)
        db.add(setting)
    else:
        setting.percent = payload.percent
    db.commit()
    db.refresh(setting)
    return setting
