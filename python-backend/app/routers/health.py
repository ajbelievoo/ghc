"""Health, readiness and metrics endpoints for GHC."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.responses import PlainTextResponse

from app.core.database import get_db
from app.core.metrics import metrics_response

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Basic health check including database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False
        raise  # let FastAPI return a 500

    return {
        "status": "ok",
        "database": "ok" if db_ok else "error",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe for orchestrators / load balancers."""
    db.execute(text("SELECT 1"))
    return {"ready": True}


@router.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    return PlainTextResponse(
        content=metrics_response(),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )
