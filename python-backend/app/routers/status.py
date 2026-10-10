"""Public status page + incident/maintenance management.

Public:
  GET  /status/summary           - platform health from real ping data + incidents
  POST /status/subscribe         - email alerts for incidents
  GET  /status/unsubscribe/{tok} - opt out

Admin:
  CRUD /admin/status/incidents   - manage incidents/maintenance + notify
"""
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import (
    ServerPingMetric,
    StatusIncident,
    StatusSubscriber,
    Subscription,
    SubscriptionStatus,
    User,
)
from app.services.email_service import send_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["status"])

STATUS_BASE = "https://ghc.believoo.com/status"


def _incident_dict(i: StatusIncident) -> dict:
    return {
        "id": i.id, "title": i.title, "kind": i.kind, "status": i.status,
        "severity": i.severity, "message": i.message, "services": i.services or [],
        "scheduledFor": i.scheduled_for.isoformat() if i.scheduled_for else None,
        "scheduledUntil": i.scheduled_until.isoformat() if i.scheduled_until else None,
        "resolvedAt": i.resolved_at.isoformat() if i.resolved_at else None,
        "createdAt": i.created_at.isoformat(), "updatedAt": i.updated_at.isoformat(),
    }


def _notify_subscribers(db: Session, incident: StatusIncident, subject_prefix: str = "") -> int:
    subs = db.query(StatusSubscriber).filter(StatusSubscriber.is_active == True).all()  # noqa: E712
    sent = 0
    for s in subs:
        unsub = f"{STATUS_BASE}?unsubscribe={s.token}"
        subject = f"{subject_prefix}GHC Status: {incident.title}".strip()
        sched = ""
        if incident.kind == "maintenance" and incident.scheduled_for:
            sched = f"<p><b>Window:</b> {incident.scheduled_for.strftime('%d %b %Y %H:%M')} UTC" \
                    + (f" – {incident.scheduled_until.strftime('%H:%M')} UTC" if incident.scheduled_until else "") + "</p>"
        body = (f"<h3>{incident.title}</h3>{sched}"
                f"<p><b>Status:</b> {incident.status} &nbsp; <b>Severity:</b> {incident.severity}</p>"
                f"<p>{incident.message or ''}</p>"
                f"<p>Live updates: <a href='{STATUS_BASE}'>{STATUS_BASE}</a> &nbsp;|&nbsp; "
                f"<a href='{unsub}'>Unsubscribe</a></p>")
        try:
            if send_email(db, s.email, subject, body):
                sent += 1
        except Exception as e:
            logger.error(f"status notify {s.email}: {e}")
    return sent


# ---------------- Public ----------------

@router.get("/status/summary")
def status_summary(db: Session = Depends(get_db)):
    """Platform health — real 30-day uptime from ping checks, active incidents,
    and upcoming maintenance."""
    since = datetime.utcnow() - timedelta(days=30)
    cats = {}
    subs = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.monitoring_enabled == True,  # noqa: E712
    ).all()
    sub_cat = {s.id: s.category.value for s in subs}
    ping_rows = db.query(ServerPingMetric).filter(ServerPingMetric.checked_at >= since).all()
    for r in ping_rows:
        cat = sub_cat.get(r.subscription_id)
        if not cat:
            continue
        c = cats.setdefault(cat, {"checks": 0, "up": 0})
        c["checks"] += 1
        if r.status == "UP":
            c["up"] += 1

    services = [
        {"category": cat, "uptime30d": round(c["up"] / c["checks"] * 100, 3), "checks": c["checks"]}
        for cat, c in sorted(cats.items())
    ]

    active = (db.query(StatusIncident)
              .filter(StatusIncident.status.in_(["investigating", "identified", "monitoring", "scheduled", "in_progress"]))
              .order_by(StatusIncident.created_at.desc()).all())
    recent = (db.query(StatusIncident)
              .filter(StatusIncident.status.in_(["resolved", "completed"]),
                      StatusIncident.resolved_at >= datetime.utcnow() - timedelta(days=30))
              .order_by(StatusIncident.resolved_at.desc()).limit(10).all())

    incidents = [i for i in active if i.kind == "incident"]
    maintenance = [i for i in active if i.kind == "maintenance"]
    worst = "operational"
    if any(i.severity == "critical" for i in incidents):
        worst = "major_outage"
    elif incidents:
        worst = "partial_outage" if any(i.severity == "major" for i in incidents) else "degraded"
    elif maintenance:
        worst = "maintenance"

    return {
        "state": worst,
        "generatedAt": datetime.utcnow().isoformat(),
        "services": services,
        "incidents": [_incident_dict(i) for i in incidents],
        "maintenance": [_incident_dict(i) for i in maintenance],
        "history": [_incident_dict(i) for i in recent],
    }


class SubscribeBody(BaseModel):
    email: EmailStr


@router.post("/status/subscribe")
def status_subscribe(body: SubscribeBody, db: Session = Depends(get_db)):
    s = db.query(StatusSubscriber).filter(StatusSubscriber.email == body.email.lower()).first()
    if s:
        s.is_active = True
    else:
        s = StatusSubscriber(email=body.email.lower(), token=secrets.token_hex(24))
        db.add(s)
    db.commit()
    return {"ok": True, "message": "Subscribed. You will receive incident alerts by email."}


@router.get("/status/unsubscribe/{token}")
def status_unsubscribe(token: str, db: Session = Depends(get_db)):
    s = db.query(StatusSubscriber).filter(StatusSubscriber.token == token).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subscription not found")
    s.is_active = False
    db.commit()
    return {"ok": True, "message": "Unsubscribed from status alerts."}


# ---------------- Admin ----------------

class IncidentBody(BaseModel):
    title: str
    kind: str = "incident"          # incident | maintenance
    status: str = "investigating"
    severity: str = "minor"
    message: Optional[str] = None
    services: Optional[list] = None
    scheduledFor: Optional[datetime] = None
    scheduledUntil: Optional[datetime] = None
    notify: bool = True             # email subscribers
    notifyCustomers: bool = False   # also email affected customers


def _incident_or_404(db: Session, incident_id: str) -> StatusIncident:
    i = db.query(StatusIncident).filter(StatusIncident.id == incident_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Incident not found")
    return i


@router.get("/admin/status/incidents")
def admin_list_incidents(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    rows = db.query(StatusIncident).order_by(StatusIncident.created_at.desc()).limit(100).all()
    return [_incident_dict(i) for i in rows]


@router.post("/admin/status/incidents")
def admin_create_incident(body: IncidentBody, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if body.kind not in ("incident", "maintenance"):
        raise HTTPException(status_code=400, detail="kind must be incident or maintenance")
    i = StatusIncident(
        title=body.title.strip(), kind=body.kind, status=body.status,
        severity=body.severity, message=body.message, services=body.services or [],
        scheduled_for=body.scheduledFor, scheduled_until=body.scheduledUntil,
    )
    db.add(i)
    db.commit()
    sent = _notify_subscribers(db, i, "[Maintenance] " if i.kind == "maintenance" else "") if body.notify else 0
    if body.notifyCustomers:
        q = db.query(User).join(Subscription, Subscription.user_id == User.id).filter(
            Subscription.status == SubscriptionStatus.ACTIVE)
        if i.services:
            q = q.filter(Subscription.category.in_(i.services))
        for u in q.distinct().all():
            try:
                send_email(db, u.email, f"GHC: {i.title}",
                           f"<p>{i.message or 'A service event is affecting your services.'}</p>"
                           f"<p>Details: <a href='{STATUS_BASE}'>{STATUS_BASE}</a></p>")
            except Exception as e:
                logger.error(f"customer incident mail {u.email}: {e}")
    return _incident_dict(i)


@router.put("/admin/status/incidents/{incident_id}")
def admin_update_incident(incident_id: str, body: IncidentBody, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    i = _incident_or_404(db, incident_id)
    old_status = i.status
    for f in ("title", "kind", "status", "severity", "message"):
        setattr(i, f, getattr(body, f))
    i.services = body.services or []
    i.scheduled_for = body.scheduledFor
    i.scheduled_until = body.scheduledUntil
    if body.status in ("resolved", "completed") and not i.resolved_at:
        i.resolved_at = datetime.utcnow()
    if body.status not in ("resolved", "completed"):
        i.resolved_at = None
    db.commit()
    if body.notify and (old_status != i.status or body.message):
        _notify_subscribers(db, i, "[Resolved] " if i.status in ("resolved", "completed") else "[Update] ")
    return _incident_dict(i)


@router.delete("/admin/status/incidents/{incident_id}")
def admin_delete_incident(incident_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    i = _incident_or_404(db, incident_id)
    db.delete(i)
    db.commit()
    return {"ok": True}
