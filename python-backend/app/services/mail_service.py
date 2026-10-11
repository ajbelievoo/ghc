"""Customer mailbox management against the shared Postfix/Dovecot mail DB.

The believoo mail stack (aaPanel mail_sys plugin) stores domains/mailboxes in
SQLite at /www/vmail/postfixadmin.db. GHC customers can manage mailboxes on
domains they own (domain_registrations, ACTIVE) — the same DB Dovecot/Postfix
read from, so changes take effect immediately.
"""
import base64
import crypt
import logging
import os
import re
import secrets
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

MAIL_DB_PATH = os.environ.get("GHC_MAIL_DB", "/www/vmail/postfixadmin.db")
DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024  # 5 GB per mailbox (matches plugin default)
MAX_MAILBOXES_PER_DOMAIN = 50
LOCALPART_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$", re.IGNORECASE)


def _connect() -> sqlite3.Connection:
    if not os.path.exists(MAIL_DB_PATH):
        raise RuntimeError("Mail database is not available on this server")
    conn = sqlite3.connect(MAIL_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def mail_available() -> bool:
    return os.path.exists(MAIL_DB_PATH)


def _hash_password(plain: str) -> tuple[str, str]:
    """Return (md5-crypt hash, hex(base64(plaintext))) matching the plugin format."""
    salt = "$1$" + secrets.token_hex(4) + "$"
    hashed = crypt.crypt(plain, salt)
    encoded = base64.b64encode(plain.encode()).hex().upper()
    return hashed, encoded


def domain_mail_info(domain: str, create: bool = False) -> Dict[str, Any]:
    """Domain row + mailbox count. ``create=True`` provisions the domain row —
    only do that on explicit mailbox creation: a mere read must not make
    Postfix treat an externally-hosted domain as local."""
    domain = domain.lower()
    conn = _connect()
    try:
        row = conn.execute("SELECT * FROM domain WHERE domain = ?", (domain,)).fetchone()
        if not row:
            if not create:
                return {
                    "domain": domain,
                    "maxMailboxes": MAX_MAILBOXES_PER_DOMAIN,
                    "defaultQuota": DEFAULT_QUOTA,
                    "mailboxCount": 0,
                    "active": False,
                    "mailEnabled": False,
                }
            conn.execute(
                "INSERT INTO domain (domain, mailboxes, mailbox_quota, quota, rate_limit, created, active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                (domain, MAX_MAILBOXES_PER_DOMAIN, DEFAULT_QUOTA, 10 * 1024 * 1024 * 1024, 12, datetime.utcnow().isoformat(sep=" ", timespec="seconds")),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM domain WHERE domain = ?", (domain,)).fetchone()
        count = conn.execute("SELECT COUNT(*) FROM mailbox WHERE domain = ? AND active = 1", (domain,)).fetchone()[0]
        return {
            "domain": domain,
            "maxMailboxes": row["mailboxes"] or MAX_MAILBOXES_PER_DOMAIN,
            "defaultQuota": row["mailbox_quota"] or DEFAULT_QUOTA,
            "mailboxCount": count,
            "active": bool(row["active"]),
        }
    finally:
        conn.close()


def list_mailboxes(domain: str) -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT username, local_part, quota, current_usage, active, created FROM mailbox WHERE domain = ? ORDER BY username",
            (domain.lower(),),
        ).fetchall()
        return [
            {
                "username": r["username"],
                "localPart": r["local_part"],
                "quota": r["quota"],
                "usage": r["current_usage"] or 0,
                "active": bool(r["active"]),
                "created": r["created"],
            }
            for r in rows
        ]
    finally:
        conn.close()


def create_mailbox(domain: str, local_part: str, password: str, full_name: str = "", quota: Optional[int] = None) -> Dict[str, Any]:
    domain = domain.lower()
    local_part = local_part.strip().lower()
    if not LOCALPART_RE.match(local_part):
        raise ValueError("Invalid mailbox name — letters, digits, dot, dash, underscore only")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    info = domain_mail_info(domain, create=True)
    if info["mailboxCount"] >= info["maxMailboxes"]:
        raise ValueError(f"Mailbox limit reached ({info['maxMailboxes']})")
    username = f"{local_part}@{domain}"
    conn = _connect()
    try:
        if conn.execute("SELECT 1 FROM mailbox WHERE username = ?", (username,)).fetchone():
            raise ValueError("Mailbox already exists")
        hashed, encoded = _hash_password(password)
        now = datetime.utcnow().isoformat(sep=" ", timespec="seconds")
        conn.execute(
            """INSERT INTO mailbox
               (username, password, password_encode, full_name, is_admin, maildir, quota, current_usage, quota_active, local_part, domain, created, modified, active)
               VALUES (?, ?, ?, ?, 0, ?, ?, 0, 1, ?, ?, ?, ?, 1)""",
            (username, hashed, encoded, full_name or local_part, f"{username}/", quota or info["defaultQuota"], local_part, domain, now, now),
        )
        conn.commit()
        return {"username": username, "quota": quota or info["defaultQuota"], "active": True}
    finally:
        conn.close()


def update_mailbox(domain: str, username: str, password: Optional[str] = None, quota: Optional[int] = None, active: Optional[bool] = None) -> Dict[str, Any]:
    username = username.lower()
    conn = _connect()
    try:
        row = conn.execute("SELECT * FROM mailbox WHERE username = ? AND domain = ?", (username, domain.lower())).fetchone()
        if not row:
            raise ValueError("Mailbox not found")
        now = datetime.utcnow().isoformat(sep=" ", timespec="seconds")
        if password:
            if len(password) < 8:
                raise ValueError("Password must be at least 8 characters")
            hashed, encoded = _hash_password(password)
            conn.execute("UPDATE mailbox SET password = ?, password_encode = ?, modified = ? WHERE username = ?", (hashed, encoded, now, username))
        if quota is not None:
            conn.execute("UPDATE mailbox SET quota = ?, modified = ? WHERE username = ?", (int(quota), now, username))
        if active is not None:
            conn.execute("UPDATE mailbox SET active = ?, modified = ? WHERE username = ?", (1 if active else 0, now, username))
        conn.commit()
        return {"username": username, "active": bool(active) if active is not None else bool(row["active"])}
    finally:
        conn.close()


def delete_mailbox(domain: str, username: str) -> None:
    """Remove the mailbox row — the maildir on disk is kept (plugin behaviour)."""
    username = username.lower()
    conn = _connect()
    try:
        cur = conn.execute("DELETE FROM mailbox WHERE username = ? AND domain = ?", (username, domain.lower()))
        conn.commit()
        if cur.rowcount == 0:
            raise ValueError("Mailbox not found")
    finally:
        conn.close()
