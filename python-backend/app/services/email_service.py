import logging
import smtplib
import ssl
import uuid
from datetime import datetime
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.models import AdminConfig, CustomerOrder, DomainRegistration, Invoice, Subscription, SupportTicket, SupportTicketReply, User

logger = logging.getLogger(__name__)
settings = get_settings()

SMTP_KEYS = ("smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from")

GHC_LOGO_URL = "https://ghc.believoo.com/images/ghc-email-logo.png"
GHC_PRIMARY = "#00f0ff"


def _get_config(db: Session, key: str) -> str:
    row = db.query(AdminConfig).filter(AdminConfig.key == key).first()
    return row.value if row else ""


def get_smtp_config(db: Session) -> Optional[dict]:
    """SMTP settings from AdminConfig (admin panel) with env fallback. None if not configured."""
    host = _get_config(db, "smtp_host") or settings.smtp_host
    if not host:
        return None
    port_raw = _get_config(db, "smtp_port") or str(settings.smtp_port)
    return {
        "host": host,
        "port": int(port_raw or 587),
        "user": _get_config(db, "smtp_user") or settings.smtp_user,
        "password": _get_config(db, "smtp_pass") or settings.smtp_pass,
        "from": _get_config(db, "smtp_from")
        or settings.smtp_from
        or _get_config(db, "smtp_user")
        or settings.smtp_user,
    }


def smtp_configured(db: Session) -> bool:
    return get_smtp_config(db) is not None


def _fmt_money(amount: float, currency: str) -> str:
    symbol = {"INR": "₹", "USD": "$", "CAD": "C$", "EUR": "€", "GBP": "£"}.get(currency, "")
    return f"{symbol}{amount:,.2f} {currency}" if not symbol else f"{symbol}{amount:,.2f}"


def _fmt_dt(dt: Optional[datetime]) -> str:
    return dt.strftime("%d %b %Y, %I:%M %p UTC") if dt else "N/A"


def _safe_subject(name: str) -> str:
    return name if name else "there"


def _category_label(category) -> str:
    if not category:
        return "Service"
    return str(category).replace("_", " ").title()


def render_email(
    preheader: str,
    heading: str,
    paragraphs: List[str],
    cta_label: Optional[str] = None,
    cta_url: Optional[str] = None,
    details: Optional[List[Tuple[str, str]]] = None,
    note: Optional[str] = None,
) -> str:
    """Render a branded GHC transactional email."""
    details_rows = ""
    if details:
        rows = ""
        for k, v in details:
            rows += f"""
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:40%;"><strong>{k}</strong></td>
              <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;text-align:right;">{v}</td>
            </tr>"""
        details_rows = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:collapse;">
          <tbody>{rows}</tbody>
        </table>"""

    cta_html = ""
    if cta_label and cta_url:
        cta_html = f"""
        <table class="action" width="100%" cellpadding="0" cellspacing="0" style="margin:28px auto;text-align:center;">
          <tr>
            <td align="center">
              <a href="{cta_url}" target="_blank" style="display:inline-block;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#0a0a1a;text-decoration:none;border-radius:999px;background-color:#00f0ff;padding:13px 34px;">{cta_label}</a>
            </td>
          </tr>
        </table>"""

    note_html = ""
    if note:
        note_html = f"""
        <div style="margin-top:22px;padding:16px;border-left:4px solid #00f0ff;background-color:#f0fdfa;border-radius:0 10px 10px 0;color:#0f172a;font-size:14px;line-height:1.6;">
          {note}
        </div>"""

    paragraphs_html = "".join([f"<p style='margin:0 0 18px;color:#475569;font-size:15px;line-height:1.65;'>{p}</p>" for p in paragraphs])

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>{heading}</title>
  <style>
    @media only screen and (max-width: 600px) {{
      .inner-body {{ width: 100% !important; }}
      .footer {{ width: 100% !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:none;">
  <span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}</span>
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eef2f7;margin:0;padding:0;width:100%;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0;padding:0;width:100%;">
          <tr>
            <td class="header" style="background-color:#0a0a1a;background-image:linear-gradient(135deg,#0a0a1a 0%,#0c1a35 55%,#0a2540 100%);padding:34px 0 30px;text-align:center;border-radius:14px 14px 0 0;">
              <a href="{settings.site_url}" target="_blank" style="display:inline-block;text-decoration:none;">
                <img src="{GHC_LOGO_URL}" alt="GHC - Go Host Cloud" width="140" height="60" style="display:block;border:0;height:60px;width:auto;margin:0 auto;" />
              </a>
            </td>
          </tr>
          <tr>
            <td height="4" style="background-color:#00f0ff;background-image:linear-gradient(90deg,#00f0ff 0%,#00b7ff 50%,#4f46e5 100%);height:4px;line-height:4px;font-size:4px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="body" style="padding:0 0 24px;">
              <table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;border-radius:0 0 14px 14px;box-shadow:0 6px 24px rgba(15,23,42,0.09);width:570px;">
                <tr>
                  <td class="content-cell" style="padding:42px;">
                    <h1 style="color:#0f172a;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.3;margin:0 0 22px;">{heading}</h1>
                    {paragraphs_html}
                    {details_rows}
                    {cta_html}
                    {note_html}
                    <p style="margin:28px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                      Need help? Reply to this email or contact <a href="mailto:support@believoo.com" style="color:#0284c7;text-decoration:underline;">support@believoo.com</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="footer" style="text-align:center;padding:0 20px 32px;">
              <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
                © {datetime.utcnow().year} <a href="{settings.site_url}" style="color:#64748b;text-decoration:underline;">GHC - Go Host Cloud</a>, a Believoo brand. All rights reserved.<br />
                <a href="{settings.site_url}/services" style="color:#64748b;">Services</a> ·
                <a href="{settings.site_url}/support" style="color:#64748b;">Support</a> ·
                <a href="{settings.site_url}" style="color:#64748b;">Dashboard</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _log_email(db: Session, to: str, subject: str, status: str, error: Optional[str] = None):
    try:
        from app.models.models import EmailLog
        db.add(EmailLog(to_email=to, subject=subject[:500], status=status, error=(error or None) and str(error)[:2000]))
        db.commit()
    except Exception:
        logger.debug("EmailLog write failed", exc_info=True)


def send_email(db: Session, to: str, subject: str, html_body: str, text_body: Optional[str] = None, headers: Optional[dict] = None, attachments: Optional[List[tuple]] = None) -> bool:
    """Send a transactional email. Returns False (and logs) if SMTP is not configured or fails."""
    cfg = get_smtp_config(db)
    if not cfg:
        logger.warning(f"SMTP not configured; cannot send email to {to}: {subject}")
        _log_email(db, to, subject, "skipped", "SMTP not configured")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg["from"]
    msg["To"] = to
    msg["Reply-To"] = "support@believoo.com"
    msg["Message-Id"] = f"<{uuid.uuid4().hex}@believoo.com>"
    msg["X-Auto-Response-Suppress"] = "OOF, DR, RN, NRN"
    msg["Precedence"] = "transactional"
    msg["X-Transaction-Email"] = "yes"

    if headers:
        for k, v in headers.items():
            msg[k] = v

    msg.attach(MIMEText(text_body or html_body.replace("<br>", "\n"), "plain"))
    msg.attach(MIMEText(html_body, "html"))

    if attachments:
        for filename, content, mime in attachments:
            part = MIMEBase("application", mime or "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
            msg.attach(part)

    # envelope sender must be a bare address, even if From has a display name
    _, envelope_from = parseaddr(cfg["from"])
    if not envelope_from:
        envelope_from = cfg["user"] or to

    def _smtp_context():
        if not settings.smtp_verify:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            return ctx
        return ssl.create_default_context()

    try:
        if cfg["port"] == 465:
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=_smtp_context(), timeout=15) as server:
                if cfg["user"]:
                    server.login(cfg["user"], cfg["password"])
                server.sendmail(envelope_from, [to], msg.as_string())
        else:
            with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as server:
                server.ehlo()
                server.starttls(context=_smtp_context())
                server.ehlo()
                if cfg["user"]:
                    server.login(cfg["user"], cfg["password"])
                server.sendmail(envelope_from, [to], msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        _log_email(db, to, subject, "sent")
        return True
    except Exception as e:
        logger.exception(f"Failed to send email to {to}: {e}")
        _log_email(db, to, subject, "failed", str(e))
        return False


# ---- Transactional emails ----


def send_welcome_email(db: Session, user: User) -> bool:
    html = render_email(
        preheader=f"Welcome to GHC — your cloud account is ready.",
        heading=f"Welcome to GHC, {_safe_subject(user.name)}!",
        paragraphs=[
            "Your Go Host Cloud account has been created. You can now order VPS, dedicated servers, web hosting and domains with instant provisioning.",
            "Manage your services, renewals and invoices directly from your client dashboard.",
        ],
        cta_label="Go to Dashboard",
        cta_url=settings.site_url,
    )
    return send_email(db, user.email, f"Welcome to {settings.app_name}", html)


def send_verification_email(db: Session, user: User, token: str, minutes: int = 60) -> bool:
    link = f"{settings.site_url}/verify-email/?token={token}"
    html = render_email(
        preheader="Verify your GHC email address to get started.",
        heading="Verify your email address",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Thanks for signing up. Please confirm that <strong>{user.email}</strong> is your email address by clicking the button below.",
            f"This verification link expires in {minutes} minutes.",
        ],
        cta_label="Verify Email",
        cta_url=link,
        note="If you did not create this account, you can ignore this email.",
    )
    return send_email(db, user.email, "Verify your GHC email address", html)


def send_reset_email(db: Session, user: User, token: str, minutes: int = 30) -> bool:
    link = f"{settings.site_url}/reset-password/?token={token}"
    html = render_email(
        preheader="Reset your GHC account password.",
        heading="Reset your password",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            "We received a request to reset your GHC account password. Click the button below to choose a new one.",
            f"This link expires in {minutes} minutes.",
        ],
        cta_label="Reset Password",
        cta_url=link,
        note="If you did not request a password reset, no action is required.",
    )
    return send_email(db, user.email, "Password reset for your GHC account", html)


def send_password_changed_email(db: Session, user: User) -> bool:
    html = render_email(
        preheader="Your GHC account password was changed.",
        heading="Password updated",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            "Your Go Host Cloud account password was just changed. If you made this change, no further action is required.",
            "If you did not change your password, please reset it immediately or contact support.",
        ],
        cta_label="Go to GHC",
        cta_url=f"{settings.site_url}/login",
        note="You are receiving this because your account password was updated.",
    )
    return send_email(db, user.email, "Your GHC password was updated", html)


def send_support_ticket_created(db: Session, ticket: SupportTicket) -> bool:
    html = render_email(
        preheader=f"We received your support request: {ticket.subject}",
        heading="Support ticket received",
        paragraphs=[
            f"Hi {_safe_subject(ticket.name)},",
            f"We received your support request about <strong>{_safe_subject(ticket.subject)}</strong> in the <strong>{_safe_subject(ticket.category)}</strong> category.",
            "Our team typically replies within 24 hours. You can reply to this email or update the ticket from your GHC dashboard.",
        ],
        cta_label="View Ticket",
        cta_url=f"{settings.site_url}/support",
        note="If you did not create this ticket, please ignore this email.",
    )
    return send_email(db, ticket.email, f"GHC ticket #{ticket.id[:8]} received", html)


def send_support_ticket_reply(db: Session, ticket: SupportTicket, reply: SupportTicketReply) -> bool:
    heading = "New reply to your ticket" if reply.sender == "admin" else "Ticket updated"
    html = render_email(
        preheader=f"{heading}: {ticket.subject}",
        heading=heading,
        paragraphs=[
            f"Hi {_safe_subject(ticket.name)},",
            f"There is a new reply on your support ticket <strong>{_safe_subject(ticket.subject)}</strong>:",
            f"<blockquote style='border-left:4px solid #00f0ff;padding-left:12px;margin:12px 0;color:#334155;'>{_safe_subject(reply.message)}</blockquote>",
        ],
        cta_label="View Ticket",
        cta_url=f"{settings.site_url}/support",
        note="Reply to this email or update the ticket from your GHC dashboard.",
    )
    subject = f"Re: GHC ticket #{ticket.id[:8]}" if reply.sender == "admin" else f"Update: GHC ticket #{ticket.id[:8]}"
    return send_email(db, ticket.email, subject, html)


def send_admin_new_ticket(db: Session, ticket: SupportTicket) -> bool:
    html = render_email(
        preheader=f"New GHC support ticket: {ticket.subject}",
        heading="New support ticket",
        paragraphs=[
            f"A new GHC support ticket has been created by <strong>{_safe_subject(ticket.name)}</strong> ({ticket.email}).",
            f"Subject: <strong>{_safe_subject(ticket.subject)}</strong><br>Category: {_safe_subject(ticket.category)}<br>Message:<br><blockquote style='border-left:4px solid #00f0ff;padding-left:12px;margin:12px 0;color:#334155;'>{_safe_subject(ticket.replies[0].message) if ticket.replies else ''}</blockquote>",
        ],
        cta_label="View Dashboard",
        cta_url=f"{settings.site_url}/admin",
    )
    return send_email(db, settings.admin_email, f"New GHC ticket: {ticket.subject[:50]}", html)


def send_team_invite_email(db: Session, invitee_email: str, inviter: User, invite_token: str) -> bool:
    link = f"{settings.site_url}/dashboard/?invite={invite_token}"
    html = render_email(
        preheader=f"{inviter.name} invited you to join their GHC cloud team.",
        heading="You're invited to a GHC team",
        paragraphs=[
            f"<strong>{inviter.name}</strong> ({inviter.email}) invited you to collaborate on their Go Host Cloud account.",
            "Accept the invitation to manage servers, hosting and billing together.",
        ],
        cta_label="Accept Invitation",
        cta_url=link,
    )
    return send_email(db, invitee_email, f"{inviter.name} invited you to GHC", html)


def send_order_payment_email(db: Session, order: CustomerOrder, user: User) -> bool:
    html = render_email(
        preheader=f"Payment received for order #{order.id[:8]}",
        heading="Payment received — thank you!",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"We received your payment of <strong>{_fmt_money(order.customer_amount, order.currency)}</strong> for your {_category_label(order.category)} order. Provisioning will begin automatically.",
        ],
        details=[
            ("Order #", order.id[:8]),
            ("Plan", order.plan_code or "Custom"),
            ("Billing", order.duration_label or "Monthly"),
            ("Category", _category_label(order.category)),
            ("Amount", _fmt_money(order.customer_amount, order.currency)),
        ],
        cta_label="View Order",
        cta_url=f"{settings.site_url}/dashboard/orders/{order.id}",
        note="You will receive another email once the service is active and ready to use.",
    )
    return send_email(db, user.email, f"Payment received for GHC order #{order.id[:8]}", html)


def send_service_activated_email(db: Session, order: CustomerOrder, subscription: Subscription, user: User) -> bool:
    details = [
        ("Service", subscription.display_name or subscription.service_name or order.plan_code or "Your service"),
        ("Plan", order.plan_code or "Custom"),
        ("Category", _category_label(order.category)),
        ("Next bill", _fmt_dt(subscription.next_bill_date)),
    ]
    if subscription.ip_address:
        details.insert(1, ("IP Address", subscription.ip_address))
    if subscription.root_user:
        details.append(("Username", subscription.root_user))

    paragraphs = [
        f"Hi {_safe_subject(user.name)},",
        f"Your {_category_label(order.category)} is now live and ready to use.",
    ]
    if subscription.ip_address:
        paragraphs.append(f"You can connect to it at <strong>{subscription.ip_address}</strong>.")
    paragraphs.append("Login to your dashboard to manage the service, view invoices and set up monitoring.")

    note = None
    if subscription.root_password:
        note = f"<strong>Root password:</strong> {subscription.root_password}<br>Please change it after your first login for security."

    html = render_email(
        preheader="Your GHC service is now active — details inside.",
        heading="Your service is active!",
        paragraphs=paragraphs,
        details=details,
        cta_label="Manage Service",
        cta_url=f"{settings.site_url}/dashboard/services/{subscription.id}",
        note=note,
    )
    return send_email(db, user.email, f"Your GHC {order.plan_code or 'service'} is active", html)


def send_order_failed_email(db: Session, order: CustomerOrder, user: User, error: Optional[str] = None) -> bool:
    reason = error or order.error_message or "Our team has been notified and will review it shortly."
    html = render_email(
        preheader=f"We couldn't activate your GHC order #{order.id[:8]}",
        heading="Order activation failed",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"We ran into an issue while activating your {_category_label(order.category)} order. Don't worry — our support team has been notified.",
        ],
        details=[
            ("Order #", order.id[:8]),
            ("Plan", order.plan_code or "Custom"),
            ("Amount", _fmt_money(order.customer_amount, order.currency)),
        ],
        cta_label="Contact Support",
        cta_url="mailto:support@believoo.com",
        note=f"<strong>Reason:</strong> {reason}",
    )
    return send_email(db, user.email, f"Issue with GHC order #{order.id[:8]}", html)


def send_wallet_topup_email(db: Session, user: User, amount: float, currency: str, gateway: str) -> bool:
    html = render_email(
        preheader=f"Wallet credited with {currency} {amount}",
        heading="Wallet top-up successful",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your GHC wallet has been credited with <strong>{_fmt_money(amount, currency)}</strong> via {gateway}.",
            "You can use this balance to purchase or renew services instantly.",
        ],
        cta_label="View Wallet",
        cta_url=f"{settings.site_url}/dashboard/wallet",
    )
    return send_email(db, user.email, f"Wallet top-up: {_fmt_money(amount, currency)}", html)


def send_renewal_reminder_email(db: Session, subscription: Subscription, user: User, invoice: Invoice) -> bool:
    html = render_email(
        preheader=f"Renew your {subscription.plan_code} before {subscription.next_bill_date.strftime('%d %b')}",
        heading="Your service is expiring soon",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your <strong>{subscription.display_name or subscription.plan_code}</strong> is due for renewal on <strong>{_fmt_dt(subscription.next_bill_date)}</strong>. A renewal invoice has been created for you.",
            "Pay before the due date to avoid service suspension.",
        ],
        details=[
            ("Service", subscription.display_name or subscription.service_name or subscription.plan_code),
            ("Plan", subscription.plan_code or "Custom"),
            ("Renewal amount", _fmt_money(invoice.amount, getattr(invoice, "currency", subscription.currency))),
            ("Due date", _fmt_dt(invoice.due_date)),
            ("Invoice #", str(invoice.id[:8])),
        ],
        cta_label="Pay Invoice",
        cta_url=f"{settings.site_url}/dashboard/invoices/{invoice.id}",
    )
    return send_email(db, user.email, f"Renew GHC {subscription.plan_code or 'service'} by {_fmt_dt(subscription.next_bill_date)}", html)


def send_domain_renewal_reminder_email(db: Session, domain: DomainRegistration, user: User) -> bool:
    html = render_email(
        preheader=f"Renew {domain.domain_name}{domain.tld} before {domain.expires_at.strftime('%d %b')}",
        heading="Your domain is expiring soon",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your domain <strong>{domain.domain_name}{domain.tld}</strong> is due for renewal on <strong>{_fmt_dt(domain.expires_at)}</strong>. Renew it to keep your website and email working.",
            "Log in to your dashboard to renew or enable auto-renew.",
        ],
        details=[
            ("Domain", f"{domain.domain_name}{domain.tld}"),
            ("Renewal amount", _fmt_money(domain.price_amount + domain.tax_amount, domain.currency)),
            ("Expiry date", _fmt_dt(domain.expires_at)),
        ],
        cta_label="Manage Domains",
        cta_url=f"{settings.site_url}/dashboard?tab=domains",
    )
    return send_email(db, user.email, f"Renew your domain {domain.domain_name}{domain.tld}", html)


def send_suspension_email(db: Session, subscription: Subscription, user: User) -> bool:
    html = render_email(
        preheader="Your GHC service has been suspended due to non-payment.",
        heading="Service suspended",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your <strong>{subscription.display_name or subscription.plan_code}</strong> has been suspended because payment is overdue. You can reactivate it immediately by clearing the pending invoice.",
        ],
        details=[
            ("Service", subscription.display_name or subscription.service_name or subscription.plan_code),
            ("Plan", subscription.plan_code or "Custom"),
            ("Next bill", _fmt_dt(subscription.next_bill_date)),
        ],
        cta_label="Reactivate Service",
        cta_url=f"{settings.site_url}/dashboard/invoices",
        note="Need more time? Contact support and we'll help you out.",
    )
    return send_email(db, user.email, f"GHC {subscription.plan_code or 'service'} suspended", html)


def send_invoice_overdue_email(db: Session, invoice: Invoice, user: User) -> bool:
    days = max(0, (datetime.utcnow() - invoice.due_date).days) if invoice.due_date else 0
    html = render_email(
        preheader=f"Invoice #{invoice.invoice_number or invoice.id[:8].upper()} is overdue.",
        heading="Payment overdue",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Your invoice for <strong>{_fmt_money(invoice.amount, invoice.currency)}</strong> was due on <strong>{_fmt_dt(invoice.due_date)}</strong> and is still unpaid{f' ({days} day(s) overdue)' if days else ''}.",
            "Pay now to avoid service suspension. If you have already paid, please ignore this reminder.",
        ],
        details=[
            ("Invoice #", invoice.invoice_number or invoice.id[:8].upper()),
            ("Amount due", _fmt_money(invoice.amount, invoice.currency)),
            ("Due date", _fmt_dt(invoice.due_date)),
        ],
        cta_label="Pay Invoice",
        cta_url=f"{settings.site_url}/dashboard?tab=invoices",
    )
    return send_email(db, user.email, f"Overdue: GHC invoice {invoice.invoice_number or invoice.id[:8].upper()}", html)


def send_invoice_email(db: Session, invoice: Invoice, user: User, order: CustomerOrder, pdf_bytes: bytes) -> bool:
    """Send an invoice to the customer with PDF attached."""
    html = render_email(
        preheader=f"Your GHC invoice #{invoice.id[:8].upper()} is ready.",
        heading="Invoice from GHC - Go Host Cloud",
        paragraphs=[
            f"Hi {_safe_subject(user.name)},",
            f"Please find attached your invoice <strong>#{invoice.id[:8].upper()}</strong> for <strong>{_fmt_money(invoice.amount, invoice.currency)}</strong>.",
            f"Status: {invoice.status.value}. Due date: {_fmt_dt(invoice.due_date)}",
        ],
        details=[
            ("Invoice #", invoice.id[:8].upper()),
            ("Amount", _fmt_money(invoice.amount, invoice.currency)),
            ("Status", invoice.status.value),
            ("Due date", _fmt_dt(invoice.due_date)),
        ],
        cta_label="View Dashboard",
        cta_url=f"{settings.site_url}/dashboard",
        note="For questions, reply to this email or contact support@believoo.com.",
    )
    return send_email(
        db,
        user.email,
        f"GHC Invoice #{invoice.id[:8].upper()}",
        html,
        attachments=[(f"invoice-{invoice.id[:8].upper()}.pdf", pdf_bytes, "pdf")],
    )


def get_admin_config(db: Session, key: str, default: str = "") -> str:
    return _get_config(db, key) or default


def get_admin_flag(db: Session, key: str, default: bool = False) -> bool:
    val = _get_config(db, key)
    if not val:
        return default
    return val.lower() == "true"
