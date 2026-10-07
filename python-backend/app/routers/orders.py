from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import CustomerOrder, User
from app.schemas.order import OrderCreate, OrderResponse, OrderWithLogs
from app.services.order_service import create_customer_order, execute_checkout, pay_order_with_wallet
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
    if order.status not in ("PAYMENT_RECEIVED", "PENDING", "FAILED"):
        raise HTTPException(status_code=400, detail=f"Order status is {order.status.value}")
    try:
        ovh = get_ovh_client_from_db(db)
        execute_checkout(db, ovh, order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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
