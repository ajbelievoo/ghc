import logging
import mimetypes
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user, rate_limit
from app.models.models import SupportTicket, SupportTicketAttachment, SupportTicketReply, TicketStatus, User, UserRole
from app.services.email_service import send_admin_new_ticket, send_support_ticket_created, send_support_ticket_reply
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/support", tags=["support"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "support"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_attachments(files: List[UploadFile], reply_id: str) -> List[dict]:
    attachments = []
    for f in files or []:
        if not f.filename:
            continue
        ext = os.path.splitext(f.filename)[1].lower()
        safe_name = f"{reply_id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        with open(file_path, "wb") as out:
            shutil.copyfileobj(f.file, out)
        attachments.append({
            "filename": f.filename,
            "file_path": file_path,
            "mime_type": f.content_type or mimetypes.guess_type(f.filename)[0] or "application/octet-stream",
            "file_size": os.path.getsize(file_path),
        })
    return attachments


def _attachment_json(a: SupportTicketAttachment) -> dict:
    return {
        "id": a.id,
        "filename": a.filename,
        "mimeType": a.mime_type,
        "size": a.file_size,
        "url": f"/api/support/attachments/{a.id}",
    }


def _reply_json(r: SupportTicketReply) -> dict:
    return {
        "id": r.id,
        "sender": r.sender,
        "message": r.message,
        "createdAt": r.created_at.isoformat(),
        "attachments": [_attachment_json(a) for a in r.attachments],
    }


def _ticket_json(t: SupportTicket, with_replies: bool = False) -> dict:
    data = {
        "id": t.id,
        "name": t.name,
        "email": t.email,
        "category": t.category,
        "subject": t.subject,
        "status": t.status.value,
        "createdAt": t.created_at.isoformat(),
        "updatedAt": t.updated_at.isoformat(),
    }
    if with_replies:
        data["replies"] = [_reply_json(r) for r in t.replies]
    return data


@router.post("/ticket", dependencies=[Depends(rate_limit(5, 300, "support"))])
def create_ticket(
    name: str = Form(...),
    email: EmailStr = Form(...),
    category: str = Form(...),
    subject: str = Form(...),
    message: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    ticket = SupportTicket(
        user_id=user.id if user else None,
        name=name,
        email=email,
        category=category,
        subject=subject,
    )
    db.add(ticket)
    db.flush()
    reply = SupportTicketReply(ticket_id=ticket.id, sender="user", message=message)
    db.add(reply)
    db.flush()
    for att in _save_attachments(files, reply.id):
        db.add(SupportTicketAttachment(reply_id=reply.id, **att))
    db.commit()
    if user:
        create_notification(db, user, "Support ticket created", f"#{ticket.id[:8]}: {ticket.subject}", "info", "/dashboard?tab=support")
    try:
        send_support_ticket_created(db, ticket)
        send_admin_new_ticket(db, ticket)
    except Exception as e:
        logger.warning(f"Failed to send support ticket emails: {e}")
    return {"success": True, "ticketId": ticket.id}


@router.get("/tickets")
def list_tickets(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(SupportTicket)
    if user.role != UserRole.ADMIN:
        query = query.filter(SupportTicket.user_id == user.id)
    if status:
        try:
            query = query.filter(SupportTicket.status == TicketStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    total = query.count()
    tickets = query.order_by(SupportTicket.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"total": total, "page": page, "limit": limit, "tickets": [_ticket_json(t) for t in tickets]}


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket or (user.role != UserRole.ADMIN and ticket.user_id != user.id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_json(ticket, with_replies=True)


@router.post("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, status: str = Form(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    try:
        new_status = TicketStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    if user.role != UserRole.ADMIN:
        if ticket.user_id != user.id or new_status not in (TicketStatus.CLOSED, TicketStatus.OPEN):
            raise HTTPException(status_code=403, detail="Not allowed")
    ticket.status = new_status
    db.commit()
    return {"success": True, "status": ticket.status.value}


@router.post("/tickets/{ticket_id}/reply")
def add_ticket_reply(
    ticket_id: str,
    message: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket or (user.role != UserRole.ADMIN and ticket.user_id != user.id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    sender = "admin" if user.role == UserRole.ADMIN else "user"
    reply = SupportTicketReply(ticket_id=ticket.id, sender=sender, message=message)
    if sender == "admin" and ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
    db.add(reply)
    db.flush()
    for att in _save_attachments(files, reply.id):
        db.add(SupportTicketAttachment(reply_id=reply.id, **att))
    db.commit()
    db.refresh(reply)
    try:
        send_support_ticket_reply(db, ticket, reply)
    except Exception as e:
        logger.warning(f"Failed to send support ticket reply email: {e}")
    if user.role == UserRole.ADMIN and ticket.user_id:
        ticket_user = db.query(User).filter(User.id == ticket.user_id).first()
        if ticket_user:
            create_notification(db, ticket_user, "New ticket reply", f"#{ticket.id[:8]}: {ticket.subject}", "info", "/dashboard?tab=support")
    return {"success": True, "reply": _reply_json(reply)}


@router.get("/attachments/{attachment_id}")
def download_attachment(attachment_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from fastapi.responses import FileResponse
    att = db.query(SupportTicketAttachment).filter(SupportTicketAttachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    reply = db.query(SupportTicketReply).filter(SupportTicketReply.id == att.reply_id).first()
    ticket = db.query(SupportTicket).filter(SupportTicket.id == reply.ticket_id).first()
    if not ticket or (user.role != UserRole.ADMIN and ticket.user_id != user.id):
        raise HTTPException(status_code=404, detail="Not found")
    if not os.path.exists(att.file_path):
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(att.file_path, filename=att.filename, media_type=att.mime_type or "application/octet-stream")
