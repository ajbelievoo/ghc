from typing import Any

from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_orders: int
    total_subscriptions: int
    active_subscriptions: int
    total_revenue: float
    wallet_balance_sum: float
    pending_orders: int
    failed_orders: int


class ConfigUpdate(BaseModel):
    value: str


class AdminConfigResponse(BaseModel):
    key: str
    value: str
    updated_at: str

    class Config:
        from_attributes = True


class OvhCredentialUpdate(BaseModel):
    ovh_endpoint: str
    ovh_application_key: str
    ovh_application_secret: str
    ovh_consumer_key: str
    ovh_subsidiary: str


class OvhProxyRequest(BaseModel):
    method: str
    path: str
    params: dict = {}
