from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

from app.models.models import OrderStatus, ServiceCategory


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


class OrderCreate(BaseModel):
    plan_code: str
    duration_label: str
    category: ServiceCategory
    display_name: str | None = None
    configuration: dict[str, Any] | None = None


class OrderResponse(BaseModel):
    id: str
    user_id: str
    plan_code: str | None
    duration_label: str | None
    category: ServiceCategory
    customer_amount: float
    ovh_base_amount: float | None
    commission_amount: float | None
    currency: str
    status: OrderStatus
    ovh_cart_id: str | None
    ovh_order_id: str | None
    ovh_order_url: str | None
    ovh_payment_mean: str | None
    error_message: str | None
    configuration_payload: dict[str, Any] | None
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def format_datetimes(cls, v):
        return _iso(v)

    class Config:
        from_attributes = True


class OvhLogResponse(BaseModel):
    id: str
    step: str
    endpoint: str | None
    is_success: bool
    error_message: str | None
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def format_dt(cls, v):
        return _iso(v)

    class Config:
        from_attributes = True


class OrderWithLogs(OrderResponse):
    ovh_logs: list[OvhLogResponse]

    class Config:
        from_attributes = True
