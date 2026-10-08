import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, PyEnum):
    CLIENT = "CLIENT"
    ADMIN = "ADMIN"


class ServiceCategory(str, PyEnum):
    VPS = "VPS"
    DEDICATED = "DEDICATED"
    WEB_HOSTING = "WEB_HOSTING"
    CDN = "CDN"
    PUBLIC_CLOUD = "PUBLIC_CLOUD"
    PRIVATE_CLOUD = "PRIVATE_CLOUD"
    IP_ADDON = "IP_ADDON"
    LICENSE = "LICENSE"
    DOMAINS = "DOMAINS"


class SubscriptionStatus(str, PyEnum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    TERMINATED = "TERMINATED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class BillingCycle(str, PyEnum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    HALF_YEARLY = "HALF_YEARLY"
    YEARLY = "YEARLY"


class OrderStatus(str, PyEnum):
    PENDING = "PENDING"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    OVH_CART_CREATED = "OVH_CART_CREATED"
    OVH_ORDER_PLACED = "OVH_ORDER_PLACED"
    OVH_PAID = "OVH_PAID"
    PROVISIONING = "PROVISIONING"
    PROVISIONING_FAILED = "PROVISIONING_FAILED"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class WalletTransactionType(str, PyEnum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    PAYMENT = "PAYMENT"
    REFUND = "REFUND"


class InvoiceStatus(str, PyEnum):
    UNPAID = "UNPAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class DomainStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class LogType(str, PyEnum):
    INFO = "INFO"
    ERROR = "ERROR"
    WARNING = "WARNING"
    PAYMENT_WEBHOOK = "PAYMENT_WEBHOOK"
    PROVIDER_API = "PROVIDER_API"
    CRON = "CRON"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_suspended = Column(Boolean, default=False, nullable=False)
    phone = Column(String(50), nullable=True)
    country = Column(String(2), default="IN", nullable=False)
    gstin = Column(String(15), nullable=True)
    google_id = Column(String(255), nullable=True, index=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    totp_secret = Column(String(64), nullable=True)
    totp_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("CustomerOrder", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    domains = relationship("DomainRegistration", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentTransaction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan", order_by="WalletTransaction.created_at.desc()")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(WalletTransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    status = Column(String(20), default="COMPLETED", nullable=False)
    gateway = Column(String(50), nullable=True)
    meta_data = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wallet = relationship("Wallet", back_populates="transactions")


class MarginSetting(Base):
    __tablename__ = "margin_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(Enum(ServiceCategory), unique=True, nullable=False)
    percent = Column(Float, default=20.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PlanCatalog(Base):
    __tablename__ = "plan_catalogs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_code = Column(String(255), unique=True, nullable=False, index=True)
    invoice_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(ServiceCategory), nullable=False, index=True)
    family = Column(String(100), nullable=False)
    cpu_cores = Column(Integer, nullable=True)
    ram_gb = Column(Integer, nullable=True)
    disk_gb = Column(Integer, nullable=True)
    disk_type = Column(String(50), nullable=True)
    bandwidth_mbps = Column(Integer, nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    override_price = Column(Float, nullable=True)
    override_margin = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    catalog_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    durations = relationship("PlanDuration", back_populates="plan", cascade="all, delete-orphan")


class PlanDuration(Base):
    __tablename__ = "plan_durations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_code = Column(String(255), ForeignKey("plan_catalogs.plan_code", ondelete="CASCADE"), nullable=False)
    duration_label = Column(String(50), nullable=False)
    interval = Column(Integer, nullable=False)
    interval_unit = Column(String(10), nullable=False)
    raw_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    plan = relationship("PlanCatalog", back_populates="durations")

    __table_args__ = (
        UniqueConstraint("plan_code", "duration_label", name="uq_plan_duration"),
        {"sqlite_autoincrement": True},
    )


class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_code = Column(String(255), ForeignKey("plan_catalogs.plan_code"), nullable=True)
    duration_label = Column(String(50), nullable=True)
    category = Column(Enum(ServiceCategory), nullable=False, index=True)
    customer_amount = Column(Float, nullable=False)
    ovh_base_amount = Column(Float, nullable=True)
    commission_amount = Column(Float, nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    ovh_cart_id = Column(String(100), nullable=True)
    ovh_order_id = Column(String(100), nullable=True, index=True)
    ovh_order_url = Column(String(500), nullable=True)
    ovh_payment_mean = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    configuration_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    subscription = relationship("Subscription", back_populates="order", uselist=False)
    ovh_logs = relationship("OvhOrderLog", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("PaymentTransaction", back_populates="order")
    invoice = relationship("Invoice", back_populates="order", uselist=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("customer_orders.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("order_id", name="uq_subscription_order_id"),
    )
    ovh_resource_id = Column(String(255), nullable=True)
    service_name = Column(String(255), nullable=True, index=True)
    display_name = Column(String(255), nullable=True)
    plan_code = Column(String(255), nullable=True)
    category = Column(Enum(ServiceCategory), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    root_user = Column(String(100), nullable=True)
    root_password = Column(String(255), nullable=True)
    os_template = Column(String(255), nullable=True)
    datacenter = Column(String(50), nullable=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.PENDING, nullable=False)
    billing_cycle = Column(Enum(BillingCycle), default=BillingCycle.MONTHLY, nullable=False)
    auto_renew = Column(Boolean, default=True, nullable=False)
    next_bill_date = Column(DateTime, nullable=True)
    price_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = relationship("CustomerOrder", back_populates="subscription")
    user = relationship("User", back_populates="subscriptions")
    additional_ips = relationship("AdditionalIp", back_populates="subscription", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="subscription", cascade="all, delete-orphan")
    scaling_rules = relationship("AutoScalingRule", back_populates="subscription", cascade="all, delete-orphan")


class OvhOrderLog(Base):
    __tablename__ = "ovh_order_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("customer_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    step = Column(String(100), nullable=False)
    endpoint = Column(String(255), nullable=True)
    request_payload = Column(JSON, nullable=True)
    response_payload = Column(JSON, nullable=True)
    is_success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("CustomerOrder", back_populates="ovh_logs")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("customer_orders.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    gateway = Column(String(50), nullable=True)
    gateway_transaction_id = Column(String(255), nullable=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="payments")
    order = relationship("CustomerOrder", back_populates="payments")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("customer_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_pdf_url = Column(String(500), nullable=True)
    invoice_number = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    tax_type = Column(String(10), default="IGST", nullable=False)
    hsn_code = Column(String(20), default="9983", nullable=False)
    place_of_supply = Column(String(50), nullable=True)
    due_date = Column(DateTime, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.UNPAID, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order = relationship("CustomerOrder", back_populates="invoice")
    user = relationship("User", back_populates="invoices")


class DomainRegistration(Base):
    __tablename__ = "domain_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    domain_name = Column(String(255), nullable=False)
    tld = Column(String(50), nullable=False)
    years = Column(Integer, default=1, nullable=False)
    status = Column(Enum(DomainStatus), default=DomainStatus.PENDING, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=False, nullable=False)
    price_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    payment_transaction_id = Column(String(36), ForeignKey("payment_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="domains")
    payment = relationship("PaymentTransaction")


class AdditionalIp(Base):
    __tablename__ = "additional_ips"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)
    price = Column(Float, default=3.99, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    payment_transaction_id = Column(String(36), ForeignKey("payment_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    subscription = relationship("Subscription", back_populates="additional_ips")


class AdminConfig(Base):
    __tablename__ = "admin_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class GatewayConfig(Base):
    __tablename__ = "gateway_configs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    config = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(Enum(LogType), default=LogType.INFO, nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TicketStatus(str, PyEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class InviteStatus(str, PyEnum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    replies = relationship("SupportTicketReply", back_populates="ticket", cascade="all, delete-orphan", order_by="SupportTicketReply.created_at")


class SupportTicketReply(Base):
    __tablename__ = "support_ticket_replies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String(36), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "admin"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("SupportTicket", back_populates="replies")
    attachments = relationship("SupportTicketAttachment", back_populates="reply", cascade="all, delete-orphan")


class SupportTicketAttachment(Base):
    __tablename__ = "support_ticket_attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reply_id = Column(String(36), ForeignKey("support_ticket_replies.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reply = relationship("SupportTicketReply", back_populates="attachments")


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    inviter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitee_email = Column(String(255), nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    permissions = Column(JSON, default=list, nullable=False)
    status = Column(Enum(InviteStatus), default=InviteStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    inviter = relationship("User")


class ServerPingMetric(Base):
    __tablename__ = "server_ping_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(String(100), nullable=True)
    latency_ms = Column(Float, nullable=True)
    packet_loss = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="UP", nullable=False)  # UP, DOWN, TIMEOUT
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    details = Column(JSON, default=dict, nullable=True)

    subscription = relationship("Subscription")


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_type = Column(String(50), nullable=False)  # bandwidth_gb, storage_gb, cpu_hours, etc.
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    billing_period = Column(String(7), nullable=False, index=True)  # YYYY-MM
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    billed = Column(Boolean, default=False, nullable=False)
    cost = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    details = Column(JSON, default=dict, nullable=True)

    subscription = relationship("Subscription")
    invoice = relationship("Invoice")


class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), default="info", nullable=False)  # info, success, warning, error
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")


class ScalingMetric(str, PyEnum):
    CPU = "cpu"
    RAM = "ram"
    DISK = "disk"
    BANDWIDTH = "bandwidth"


class ScalingAction(str, PyEnum):
    NOTIFY = "notify"
    RESTART = "restart"
    UPSIZE = "upsize"
    DOWNSIZE = "downsize"


class AutoScalingRule(Base):
    __tablename__ = "auto_scaling_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(Enum(ScalingMetric), nullable=False)
    threshold = Column(Float, nullable=False)
    duration_minutes = Column(Integer, default=5, nullable=False)
    action = Column(Enum(ScalingAction), default=ScalingAction.NOTIFY, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    cooldown_minutes = Column(Integer, default=60, nullable=False)
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    subscription = relationship("Subscription", back_populates="scaling_rules")


class AutoScalingEvent(Base):
    __tablename__ = "auto_scaling_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String(36), ForeignKey("auto_scaling_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    metric = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    action = Column(String(50), nullable=False)
    status = Column(String(20), default="triggered", nullable=False)  # triggered, completed, failed
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    rule = relationship("AutoScalingRule")
    subscription = relationship("Subscription")


class GpuStatus(str, PyEnum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"


class GpuInstance(Base):
    __tablename__ = "gpu_instances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    gpu_model = Column(String(100), nullable=False)  # e.g. NVIDIA A100
    vram_gb = Column(Integer, nullable=False)
    cuda_cores = Column(Integer, default=0)
    node_flavor = Column(String(100), nullable=True)
    price_hourly = Column(Float, nullable=False)
    price_monthly = Column(Float, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(Enum(GpuStatus), default=GpuStatus.AVAILABLE, nullable=False)
    availability_zone = Column(String(100), nullable=True)
    meta_data = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class VpcStatus(str, PyEnum):
    PENDING = "pending"
    ACTIVE = "active"
    DELETING = "deleting"
    FAILED = "failed"


class Vpc(Base):
    __tablename__ = "vpcs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    cidr = Column(String(50), nullable=False)
    region = Column(String(100), nullable=True)
    status = Column(Enum(VpcStatus), default=VpcStatus.PENDING, nullable=False)
    subnets = Column(JSON, default=list, nullable=True)
    routes = Column(JSON, default=list, nullable=True)
    firewall_rules = Column(JSON, default=list, nullable=True)
    provider_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class K8sClusterStatus(str, PyEnum):
    PENDING = "pending"
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    SCALING = "scaling"
    DELETING = "deleting"
    FAILED = "failed"


class KubernetesCluster(Base):
    __tablename__ = "kubernetes_clusters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(20), default="1.28", nullable=False)
    node_pools = Column(JSON, default=list, nullable=True)
    status = Column(Enum(K8sClusterStatus), default=K8sClusterStatus.PENDING, nullable=False)
    endpoint = Column(String(255), nullable=True)
    kubeconfig = Column(Text, nullable=True)
    provider_ref = Column(String(255), nullable=True)
    billing_payload = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class WhiteLabelTenant(Base):
    __tablename__ = "white_label_tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    custom_domain = Column(String(255), nullable=True, index=True)
    brand_color = Column(String(20), default="#00b7ff", nullable=True)
    logo_url = Column(String(500), nullable=True)
    favicon_url = Column(String(500), nullable=True)
    support_email = Column(String(255), nullable=True)
    margin_percent = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    settings = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User")


class CloudProjectStatus(str, PyEnum):
    PENDING = "PENDING"       # upstream order placed / awaiting activation
    ACTIVE = "ACTIVE"         # upstream project ready
    ERROR = "ERROR"


class CloudProject(Base):
    __tablename__ = "cloud_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    upstream_project_id = Column(String(64), nullable=True, index=True)  # OVH serviceName
    upstream_order_id = Column(String(64), nullable=True)
    name = Column(String(255), default="GHC Cloud Project", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class CloudInstanceStatus(str, PyEnum):
    BUILDING = "BUILDING"
    ACTIVE = "ACTIVE"
    STOPPED = "STOPPED"
    SUSPENDED = "SUSPENDED"     # suspended for insufficient wallet balance
    ERROR = "ERROR"
    DELETED = "DELETED"
    PENDING = "PENDING"         # recorded, awaiting upstream project activation


class CloudInstance(Base):
    __tablename__ = "cloud_instances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True)
    upstream_instance_id = Column(String(64), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    flavor_code = Column(String(100), nullable=False)
    flavor_name = Column(String(255), nullable=True)
    image = Column(String(255), nullable=True)
    region = Column(String(50), nullable=False)
    deploy_mode = Column(String(10), default="1az", nullable=False)
    hourly_price = Column(Float, default=0.0, nullable=False)   # GHC price (margin applied)
    monthly_price = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)
    public_ip = Column(String(64), nullable=True)
    private_ip = Column(String(64), nullable=True)
    config = Column(JSON, default=dict, nullable=True)
    upstream_status = Column(String(50), nullable=True)
    last_status_sync = Column(DateTime, nullable=True)
    last_billed_at = Column(DateTime, nullable=True)
    billing_started_at = Column(DateTime, nullable=True)
    launched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    terminated_at = Column(DateTime, nullable=True)

    user = relationship("User")
    project = relationship("CloudProject")


class CloudSshKey(Base):
    __tablename__ = "cloud_ssh_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    upstream_key_id = Column(String(64), nullable=True)
    name = Column(String(255), nullable=False)
    public_key = Column(Text, nullable=False)
    fingerprint = Column(String(128), nullable=True)
    region = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")


class CloudVolume(Base):
    __tablename__ = "cloud_volumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True)
    upstream_volume_id = Column(String(64), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    size_gb = Column(Integer, nullable=False)
    volume_type = Column(String(50), default="classic", nullable=False)
    region = Column(String(50), nullable=False)
    hourly_price = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(30), default="creating", nullable=False)
    attached_instance_id = Column(String(64), nullable=True)
    last_billed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    project = relationship("CloudProject")


class CloudStorageContainer(Base):
    __tablename__ = "cloud_storage_containers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True)
    upstream_container_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    region = Column(String(50), nullable=False)
    container_type = Column(String(50), default="standard", nullable=False)
    monthly_price = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    stored_bytes = Column(Float, default=0.0, nullable=False)
    object_count = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="creating", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    project = relationship("CloudProject")


class CloudFloatingIp(Base):
    __tablename__ = "cloud_floating_ips"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True)
    upstream_ip_id = Column(String(64), nullable=True)
    ip = Column(String(64), nullable=True)
    region = Column(String(50), nullable=False)
    hourly_price = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(30), default="creating", nullable=False)
    attached_instance_id = Column(String(64), nullable=True)
    last_billed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    project = relationship("CloudProject")
