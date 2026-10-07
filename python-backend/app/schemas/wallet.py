from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.models import WalletTransactionType


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: float
    currency: str

    class Config:
        from_attributes = True


class WalletTransactionResponse(BaseModel):
    id: str
    type: WalletTransactionType
    amount: float
    description: str | None
    status: str
    gateway: str | None
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def format_dt(cls, v):
        return _iso(v)

    class Config:
        from_attributes = True


class WalletDeposit(BaseModel):
    amount: float
    gateway: str = "razorpay"
