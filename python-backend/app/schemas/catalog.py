from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

from app.models.models import ServiceCategory


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


class PlanDurationResponse(BaseModel):
    duration_label: str
    interval: int
    interval_unit: str
    raw_price: float
    final_price: float
    currency: str

    class Config:
        from_attributes = True


class PlanCatalogResponse(BaseModel):
    id: str
    plan_code: str
    invoice_name: str
    description: str | None
    category: ServiceCategory
    family: str
    cpu_cores: int | None
    ram_gb: int | None
    disk_gb: int | None
    disk_type: str | None
    bandwidth_mbps: int | None
    currency: str
    override_price: float | None
    override_margin: float | None
    is_active: bool
    durations: list[PlanDurationResponse]

    class Config:
        from_attributes = True


class MarginSettingResponse(BaseModel):
    id: str
    category: ServiceCategory
    percent: float

    class Config:
        from_attributes = True


class MarginSettingUpdate(BaseModel):
    percent: float


class SyncResult(BaseModel):
    category: str
    endpoint: str
    synced: int
    errors: int
    message: str | None = None


class CatalogResponse(BaseModel):
    results: list[SyncResult]
