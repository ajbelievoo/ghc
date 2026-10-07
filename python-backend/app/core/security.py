import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import AdminConfig, User, UserRole

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_COOKIE = "ghc_token"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def create_purpose_token(subject: str, purpose: str, expires_minutes: int) -> str:
    """Short-lived signed token for email verification, password reset, 2FA handoff."""
    return create_access_token(
        {"sub": subject, "purpose": purpose},
        expires_delta=timedelta(minutes=expires_minutes),
    )


def decode_purpose_token(token: str, purpose: str) -> Optional[str]:
    payload = decode_access_token(token)
    if not payload or payload.get("purpose") != purpose:
        return None
    return payload.get("sub")


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def _extract_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get(TOKEN_COOKIE)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = _extract_token(request)
    if not token:
        raise credentials_exception
    payload = decode_access_token(token)
    if payload is None or payload.get("purpose"):
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_admin(request: Request, db: Session = Depends(get_db)) -> User:
    """Allow admin JWT or a valid GHC service key (X-Service-Key header)."""
    service_key = request.headers.get("X-Service-Key")
    if service_key:
        cfg = db.query(AdminConfig).filter(AdminConfig.key == "ghc_admin_service_key").first()
        if cfg and cfg.value == service_key:
            user = db.query(User).filter(User.role == UserRole.ADMIN).first()
            if user:
                return user
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No admin user available")
    user = get_current_user(request, db)
    return get_current_admin(user)


def get_admin_or_service_key(request: Request, db: Session = Depends(get_db)) -> None:
    """Allow admin JWT or a valid GHC service key (X-Service-Key header)."""
    service_key = request.headers.get("X-Service-Key")
    if service_key:
        cfg = db.query(AdminConfig).filter(AdminConfig.key == "ghc_admin_service_key").first()
        if cfg and cfg.value == service_key:
            return

    try:
        user = get_current_user(request, db)
        if user.role == UserRole.ADMIN:
            return
    except HTTPException:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access or valid service key required",
    )


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Like get_current_user but returns None instead of raising."""
    token = _extract_token(request)
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload or payload.get("purpose"):
        return None
    return db.query(User).filter(User.id == payload.get("sub")).first()


def generate_uuid() -> str:
    return str(uuid.uuid4())


# ---------- Simple in-memory rate limiter ----------

_rate_store: dict = defaultdict(deque)
_rate_lock = threading.Lock()


def rate_limit(limit: int, window_seconds: int, scope: str = ""):
    """FastAPI dependency: limits requests per client IP within a sliding window."""
    def dep(request: Request):
        fwd = request.headers.get("x-forwarded-for")
        ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")
        key = f"{scope}:{ip}"
        now = time.time()
        with _rate_lock:
            q = _rate_store[key]
            while q and q[0] < now - window_seconds:
                q.popleft()
            if len(q) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )
            q.append(now)
    return dep
