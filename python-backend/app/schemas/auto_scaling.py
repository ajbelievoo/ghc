from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ScalingMetric(str, Enum):
    CPU = "cpu"
    RAM = "ram"
    DISK = "disk"
    BANDWIDTH = "bandwidth"


class ScalingAction(str, Enum):
    NOTIFY = "notify"
    RESTART = "restart"
    UPSIZE = "upsize"
    DOWNSIZE = "downsize"


class AutoScalingRuleCreate(BaseModel):
    subscription_id: str
    metric: ScalingMetric
    threshold: float = Field(..., gt=0, le=100)
    duration_minutes: int = Field(default=5, ge=1)
    action: ScalingAction = ScalingAction.NOTIFY
    cooldown_minutes: int = Field(default=60, ge=0)
    enabled: bool = True


class AutoScalingRuleUpdate(BaseModel):
    metric: Optional[ScalingMetric] = None
    threshold: Optional[float] = Field(None, gt=0, le=100)
    duration_minutes: Optional[int] = Field(None, ge=1)
    action: Optional[ScalingAction] = None
    cooldown_minutes: Optional[int] = Field(None, ge=0)
    enabled: Optional[bool] = None


class AutoScalingRuleRead(BaseModel):
    id: str
    subscription_id: str
    metric: str
    threshold: float
    duration_minutes: int
    action: str
    enabled: bool
    cooldown_minutes: int
    last_triggered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AutoScalingRuleList(BaseModel):
    items: List[AutoScalingRuleRead]


class AutoScalingEventRead(BaseModel):
    id: str
    rule_id: str
    subscription_id: str
    metric: str
    value: float
    threshold: float
    action: str
    status: str
    message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AutoScalingEventList(BaseModel):
    items: List[AutoScalingEventRead]
