import logging
import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user, rate_limit
from app.models.models import InviteStatus, TeamInvite, User
from app.services.email_service import send_team_invite_email

router = APIRouter(prefix="/api/team", tags=["team"])
settings = get_settings()
logger = logging.getLogger(__name__)

ALLOWED_PERMISSIONS = {"VIEW_SERVERS", "MANAGE_SERVERS", "VIEW_BILLING", "MANAGE_BILLING"}


class InviteCreate(BaseModel):
    inviteeEmail: EmailStr
    permissions: List[str] = []


class InviteToken(BaseModel):
    token: str


class MemberAction(BaseModel):
    memberId: str


class PermissionsUpdate(BaseModel):
    memberId: str
    permissions: List[str] = []


def _user_brief(u: Optional[User]) -> dict:
    if not u:
        return {"id": "", "name": "", "email": ""}
    return {"id": u.id, "name": u.name, "email": u.email}


def _invite_json(inv: TeamInvite) -> dict:
    return {
        "id": inv.id,
        "inviteeEmail": inv.invitee_email,
        "permissions": inv.permissions or [],
        "status": inv.status.value,
        "token": inv.token,
        "createdAt": inv.created_at.isoformat(),
    }


@router.get("")
def get_my_team(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sent = (
        db.query(TeamInvite)
        .filter(TeamInvite.inviter_id == user.id, TeamInvite.status == InviteStatus.PENDING)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )
    accepted_sent = (
        db.query(TeamInvite)
        .filter(TeamInvite.inviter_id == user.id, TeamInvite.status == InviteStatus.ACCEPTED)
        .all()
    )
    received = (
        db.query(TeamInvite)
        .filter(TeamInvite.invitee_email == user.email, TeamInvite.status == InviteStatus.PENDING)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )
    accepted_received = (
        db.query(TeamInvite)
        .filter(TeamInvite.invitee_email == user.email, TeamInvite.status == InviteStatus.ACCEPTED)
        .all()
    )

    my_team = []
    for inv in accepted_sent:
        member = db.query(User).filter(User.email == inv.invitee_email).first()
        my_team.append({"id": inv.id, "member": _user_brief(member), "permissions": inv.permissions or []})

    shared_with_me = []
    for inv in accepted_received:
        owner = db.query(User).filter(User.id == inv.inviter_id).first()
        shared_with_me.append({"id": inv.id, "owner": _user_brief(owner), "permissions": inv.permissions or []})

    received_invites = []
    for inv in received:
        inviter = db.query(User).filter(User.id == inv.inviter_id).first()
        received_invites.append({**_invite_json(inv), "inviter": _user_brief(inviter)})

    return {
        "sentInvites": [_invite_json(i) for i in sent],
        "myTeam": my_team,
        "sharedWithMe": shared_with_me,
        "receivedInvites": received_invites,
    }


@router.post("/invite", dependencies=[Depends(rate_limit(10, 300, "team_invite"))])
def invite_member(payload: InviteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.inviteeEmail.lower() == user.email.lower():
        raise HTTPException(status_code=400, detail="You cannot invite yourself")
    bad = [p for p in payload.permissions if p not in ALLOWED_PERMISSIONS]
    if bad:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {', '.join(bad)}")

    existing = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.inviter_id == user.id,
            TeamInvite.invitee_email == payload.inviteeEmail,
            TeamInvite.status.in_([InviteStatus.PENDING, InviteStatus.ACCEPTED]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This user is already invited")

    invite = TeamInvite(
        inviter_id=user.id,
        invitee_email=payload.inviteeEmail,
        token=secrets.token_urlsafe(32),
        permissions=payload.permissions,
    )
    db.add(invite)
    db.commit()

    link = f"{settings.site_url}/dashboard/?invite={invite.token}"
    try:
        send_team_invite_email(db, payload.inviteeEmail, user, invite.token)
    except Exception:
        logger.exception("Team invite email failed")
    return {"success": True, "invite": _invite_json(invite)}


def _find_received_invite(db: Session, token: str, user: User) -> TeamInvite:
    invite = db.query(TeamInvite).filter(TeamInvite.token == token).first()
    if not invite or invite.status != InviteStatus.PENDING:
        raise HTTPException(status_code=404, detail="Invitation not found or already handled")
    if invite.invitee_email.lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="This invitation is for a different email address")
    return invite


@router.post("/accept")
def accept_invitation(payload: InviteToken, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invite = _find_received_invite(db, payload.token, user)
    invite.status = InviteStatus.ACCEPTED
    db.commit()
    return {"success": True}


@router.post("/reject")
def reject_invitation(payload: InviteToken, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invite = _find_received_invite(db, payload.token, user)
    invite.status = InviteStatus.REJECTED
    db.commit()
    return {"success": True}


def _find_sent_invite_for_member(db: Session, member_id: str, user: User) -> TeamInvite:
    """memberId may be the invite id or the member's user id."""
    invite = (
        db.query(TeamInvite)
        .filter(TeamInvite.inviter_id == user.id, TeamInvite.status.in_([InviteStatus.PENDING, InviteStatus.ACCEPTED]))
        .filter(TeamInvite.id == member_id)
        .first()
    )
    if not invite:
        member = db.query(User).filter(User.id == member_id).first()
        if member:
            invite = (
                db.query(TeamInvite)
                .filter(
                    TeamInvite.inviter_id == user.id,
                    TeamInvite.invitee_email == member.email,
                    TeamInvite.status.in_([InviteStatus.PENDING, InviteStatus.ACCEPTED]),
                )
                .first()
            )
    if not invite:
        raise HTTPException(status_code=404, detail="Member not found")
    return invite


@router.post("/revoke")
def revoke_access(payload: MemberAction, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invite = _find_sent_invite_for_member(db, payload.memberId, user)
    invite.status = InviteStatus.REVOKED
    db.commit()
    return {"success": True}


@router.post("/permissions")
def update_permissions(payload: PermissionsUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bad = [p for p in payload.permissions if p not in ALLOWED_PERMISSIONS]
    if bad:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {', '.join(bad)}")
    invite = _find_sent_invite_for_member(db, payload.memberId, user)
    invite.permissions = payload.permissions
    db.commit()
    return {"success": True}
