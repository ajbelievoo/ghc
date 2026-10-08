import base64
import io
import logging

import pyotp
import requests
import segno
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    TOKEN_COOKIE,
    create_access_token,
    create_purpose_token,
    decode_purpose_token,
    get_current_user,
    get_password_hash,
    rate_limit,
    verify_password,
)
from app.models.models import User, UserRole
from app.schemas.auth import (
    ChangePassword,
    ForgotPassword,
    GoogleLogin,
    Login2FA,
    ResendVerification,
    ResetPassword,
    TwoFactorCode,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    VerifyEmail,
)
from app.services import captcha_service
from app.services.email_service import (
    get_admin_config,
    get_admin_flag,
    send_password_changed_email,
    send_reset_email,
    send_verification_email,
    send_welcome_email,
    smtp_configured,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()
logger = logging.getLogger(__name__)

TWO_FA_TOKEN_MINUTES = 10
RESET_TOKEN_MINUTES = 30
VERIFY_TOKEN_MINUTES = 60 * 24


def _user_json(user: User) -> dict:
    return UserResponse.model_validate(user).model_dump()


def _issue_token(user: User, response: Response) -> dict:
    token = create_access_token({"sub": user.id})
    response.set_cookie(
        TOKEN_COOKIE,
        token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": _user_json(user),
    }


def _verification_required(db: Session) -> bool:
    return smtp_configured(db) and get_admin_flag(db, "require_email_verification", False)


def _send_verification_email(db: Session, user: User) -> bool:
    if not smtp_configured(db):
        return False
    token = create_purpose_token(user.id, "verify", VERIFY_TOKEN_MINUTES)
    return send_verification_email(db, user, token, VERIFY_TOKEN_MINUTES)


def _send_reset_email(db: Session, user: User) -> bool:
    if not smtp_configured(db):
        return False
    token = create_purpose_token(user.id, "reset", RESET_TOKEN_MINUTES)
    return send_reset_email(db, user, token, RESET_TOKEN_MINUTES)


def _get_google_client_id(db: Session) -> str:
    return get_admin_config(db, "google_client_id") or settings.google_client_id


def _google_enabled(db: Session) -> bool:
    flag = get_admin_config(db, "google_login_enabled")
    if flag:
        return flag.lower() == "true"
    return bool(_get_google_client_id(db))


def _start_2fa(user: User) -> dict:
    return {
        "twoFactorRequired": True,
        "tempToken": create_purpose_token(user.id, "2fa", TWO_FA_TOKEN_MINUTES),
    }


# ---------- Registration / Login ----------


def _require_captcha(payload) -> None:
    if not captcha_service.verify(getattr(payload, "captchaId", None), getattr(payload, "captchaAnswer", None)):
        raise HTTPException(status_code=400, detail="Invalid or expired CAPTCHA — please try again")


@router.get("/captcha", dependencies=[Depends(rate_limit(30, 60, "captcha"))])
def get_captcha():
    return captcha_service.generate()


@router.post("/register", dependencies=[Depends(rate_limit(10, 60, "register"))])
def register(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    _require_captcha(payload)
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        name=payload.name,
        phone=payload.phone,
        role=UserRole.CLIENT,
        email_verified=not _verification_required(db),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        send_welcome_email(db, user)
    except Exception:
        logger.exception("Welcome email failed")

    email_sent = False
    if not user.email_verified:
        email_sent = _send_verification_email(db, user)

    if _verification_required(db):
        return {"success": True, "verificationSent": email_sent, "user": _user_json(user)}

    return {**_issue_token(user, response), "verificationSent": email_sent}


@router.post("/login", dependencies=[Depends(rate_limit(15, 60, "login"))])
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    _require_captcha(payload)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")
    if _verification_required(db) and not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in")
    if user.totp_enabled:
        return _start_2fa(user)

    return _issue_token(user, response)


@router.post("/login/2fa", dependencies=[Depends(rate_limit(15, 60, "login"))])
def login_2fa(payload: Login2FA, response: Response, db: Session = Depends(get_db)):
    user_id = decode_purpose_token(payload.tempToken, "2fa")
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=401, detail="Invalid 2FA session")
    if not pyotp.TOTP(user.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")
    return _issue_token(user, response)


@router.post("/google", dependencies=[Depends(rate_limit(15, 60, "login"))])
def google_login(payload: GoogleLogin, response: Response, db: Session = Depends(get_db)):
    client_id = _get_google_client_id(db)
    if not _google_enabled(db) or not client_id:
        raise HTTPException(status_code=400, detail="Google sign-in is not enabled")

    try:
        info = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.credential},
            timeout=10,
        ).json()
    except Exception:
        logger.exception("Google tokeninfo request failed")
        raise HTTPException(status_code=502, detail="Could not verify Google token")

    if info.get("aud") != client_id or "error" in info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    email = info.get("email")
    if not email or str(info.get("email_verified", "false")).lower() != "true":
        raise HTTPException(status_code=401, detail="Google account email not verified")

    user = db.query(User).filter((User.google_id == info.get("sub")) | (User.email == email)).first()
    if not user:
        user = User(
            email=email,
            name=info.get("name") or email.split("@")[0],
            google_id=info.get("sub"),
            email_verified=True,
            role=UserRole.CLIENT,
        )
        db.add(user)
    else:
        if not user.google_id:
            user.google_id = info.get("sub")
        user.email_verified = True
    db.commit()
    db.refresh(user)

    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")
    if user.totp_enabled:
        return _start_2fa(user)
    return _issue_token(user, response)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(TOKEN_COOKIE)
    return {"success": True}


# ---------- Email verification / password reset ----------


@router.post("/verify-email")
def verify_email(payload: VerifyEmail, db: Session = Depends(get_db)):
    user_id = decode_purpose_token(payload.token, "verify")
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    user.email_verified = True
    db.commit()
    return {"success": True, "message": "Email verified"}


@router.post("/resend-verification", dependencies=[Depends(rate_limit(5, 300, "resend"))])
def resend_verification(payload: ResendVerification, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user and not user.email_verified:
        _send_verification_email(db, user)
    return {"success": True, "message": "If the account exists, a verification email was sent"}


@router.post("/forgot-password", dependencies=[Depends(rate_limit(5, 300, "forgot"))])
def forgot_password(payload: ForgotPassword, db: Session = Depends(get_db)):
    _require_captcha(payload)
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        if not _send_reset_email(db, user):
            logger.warning(f"Password reset requested for {user.email} but SMTP is not configured")
    return {"success": True, "message": "If the account exists, a reset link was sent"}


@router.post("/reset-password")
def reset_password(payload: ResetPassword, db: Session = Depends(get_db)):
    user_id = decode_purpose_token(payload.token, "reset")
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user.password_hash = get_password_hash(payload.newPassword)
    db.commit()
    send_password_changed_email(db, user)
    return {"success": True, "message": "Password updated"}


@router.post("/change-password")
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.password_hash and not verify_password(payload.currentPassword, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = get_password_hash(payload.newPassword)
    db.commit()
    send_password_changed_email(db, user)
    return {"success": True, "message": "Password changed"}


# ---------- Two-factor authentication ----------


@router.post("/2fa/setup")
def twofa_setup(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    secret = pyotp.random_base32()
    user.totp_secret = secret
    db.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="BelieVoo GHC")
    buf = io.BytesIO()
    segno.make(uri, error="m").save(buf, kind="png", scale=5, border=2)
    qr_b64 = base64.b64encode(buf.getvalue()).decode()
    return {"secret": secret, "otpauthUrl": uri, "qrCode": f"data:image/png;base64,{qr_b64}"}


@router.post("/2fa/confirm")
def twofa_confirm(payload: TwoFactorCode, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Run 2FA setup first")
    if not pyotp.TOTP(user.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")
    user.totp_enabled = True
    db.commit()
    return {"success": True, "message": "2FA enabled"}


@router.post("/2fa/disable")
def twofa_disable(payload: TwoFactorCode, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    if not pyotp.TOTP(user.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")
    user.totp_enabled = False
    user.totp_secret = None
    db.commit()
    return {"success": True, "message": "2FA disabled"}


# ---------- Session info / public config ----------


@router.get("/me")
def auth_me(user: User = Depends(get_current_user)):
    return {"user": _user_json(user)}


@router.put("/me")
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.name is not None:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.country is not None:
        user.country = payload.country
    if payload.gstin is not None:
        user.gstin = payload.gstin
    for src, dst in (
        ("billingAddress", "billing_address"),
        ("billingCity", "billing_city"),
        ("billingState", "billing_state"),
        ("billingPincode", "billing_pincode"),
    ):
        value = getattr(payload, src)
        if value is not None:
            setattr(user, dst, value)
    db.commit()
    db.refresh(user)
    return {"user": _user_json(user)}


@router.get("/config")
def auth_config(db: Session = Depends(get_db)):
    return {
        "google_login_enabled": _google_enabled(db),
        "googleClientId": _get_google_client_id(db) if _google_enabled(db) else "",
        "email_alerts_enabled": get_admin_flag(db, "email_alerts_enabled", True),
    }
