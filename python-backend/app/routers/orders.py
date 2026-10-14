from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import CustomerOrder, Invoice, InvoiceStatus, OrderStatus, PaymentStatus, PaymentTransaction, User
from app.schemas.order import OrderCreate, OrderResponse, OrderWithLogs
from app.services.order_service import create_customer_order, execute_checkout, pay_order_with_wallet, spawn_provisioning
from app.services.ovh_client import get_ovh_client_from_db

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/create", response_model=OrderResponse)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        order = create_customer_order(
            db,
            user_id=user.id,
            plan_code=payload.plan_code,
            duration_label=payload.duration_label,
            config=payload.configuration,
            display_name=payload.display_name,
            coupon_code=payload.coupon_code,
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/pay-wallet", response_model=OrderResponse)
def pay_with_wallet(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        order = pay_order_with_wallet(db, user.id, order_id)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/provision", response_model=OrderWithLogs)
def provision_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id, CustomerOrder.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    free_order = bool((order.configuration_payload or {}).get("_free_order"))
    paid = (
        free_order
        or order.status == OrderStatus.PAYMENT_RECEIVED
        or db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == order.id,
            PaymentTransaction.status == PaymentStatus.COMPLETED,
        ).first() is not None
        or db.query(Invoice).filter(
            Invoice.order_id == order.id,
            Invoice.status == InvoiceStatus.PAID,
        ).first() is not None
    )
    if not paid:
        raise HTTPException(status_code=400, detail="Order is not paid yet")
    if order.status == OrderStatus.PROVISIONING:
        # already spawning/running — idempotent no-op so a double-click can't
        # create a second upstream cart/order
        return order
    if order.status not in (OrderStatus.PAYMENT_RECEIVED, OrderStatus.PENDING, OrderStatus.FAILED, OrderStatus.PROVISIONING_FAILED, OrderStatus.OVH_ORDER_PLACED, OrderStatus.OVH_PAID):
        raise HTTPException(status_code=400, detail=f"Order status is {order.status.value}")
    # Delivery polling can take minutes — run it in the background; the UI polls order status.
    order.status = OrderStatus.PROVISIONING
    db.commit()
    spawn_provisioning(order_id)
    db.refresh(order)
    return order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Customer cancels their own unpaid order — before any payment/provisioning."""
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id, CustomerOrder.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Only unpaid orders can be cancelled (status: {order.status.value})")
    paid_tx = db.query(PaymentTransaction).filter(
        PaymentTransaction.order_id == order.id,
        PaymentTransaction.status == PaymentStatus.COMPLETED,
    ).first()
    if paid_tx:
        raise HTTPException(status_code=400, detail="Order is already paid — contact support for refunds")
    order.status = OrderStatus.CANCELLED
    for inv in db.query(Invoice).filter(Invoice.order_id == order.id, Invoice.status == InvoiceStatus.UNPAID).all():
        inv.status = InvoiceStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(CustomerOrder).filter(CustomerOrder.user_id == user.id).order_by(CustomerOrder.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderWithLogs)
def get_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id, CustomerOrder.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
