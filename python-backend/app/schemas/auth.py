from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    phone: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    credential: str


class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8, max_length=128)


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    newPassword: str = Field(min_length=8, max_length=128)


class VerifyEmail(BaseModel):
    token: str


class ResendVerification(BaseModel):
    email: EmailStr


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=50)


class TwoFactorCode(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class Login2FA(BaseModel):
    tempToken: str
    code: str = Field(min_length=6, max_length=8)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    phone: str | None
    is_suspended: bool
    created_at: str
    emailVerified: bool = Field(default=False, validation_alias="email_verified")
    twoFactorEnabled: bool = Field(default=False, validation_alias="totp_enabled")

    @field_validator("created_at", mode="before")
    @classmethod
    def format_created_at(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True
        populate_by_name = True


class Token(BaseModel):
    access_token: str
    token: str
    token_type: str = "bearer"
    user: UserResponse
