from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.models import BillingCycle, ServiceCategory, SubscriptionStatus


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


class SubscriptionResponse(BaseModel):
    id: str
    order_id: str | None
    user_id: str
    ovh_resource_id: str | None
    service_name: str | None
    display_name: str | None
    plan_code: str | None
    category: ServiceCategory
    ip_address: str | None
    root_user: str | None
    root_password: str | None
    os_template: str | None
    datacenter: str | None
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    auto_renew: bool
    next_bill_date: str | None
    price_amount: float
    currency: str
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", "next_bill_date", mode="before")
    @classmethod
    def format_datetimes(cls, v):
        return _iso(v)

    class Config:
        from_attributes = True


class SubscriptionAction(BaseModel):
    action: str  # reboot, shutdown, start, terminate, renew


class ReinstallRequest(BaseModel):
    os_template: str
