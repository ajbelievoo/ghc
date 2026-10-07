from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, WalletTransaction
from app.schemas.wallet import WalletResponse, WalletTransactionResponse
from app.services.wallet_service import get_or_create_wallet

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/", response_model=WalletResponse)
def get_wallet(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wallet = get_or_create_wallet(db, user.id)
    return wallet


@router.get("/transactions", response_model=list[WalletTransactionResponse])
def list_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wallet = get_or_create_wallet(db, user.id)
    return db.query(WalletTransaction).filter(WalletTransaction.wallet_id == wallet.id).order_by(WalletTransaction.created_at.desc()).all()


@router.post("/deposit")
def create_deposit(
    amount: float,
    gateway: str = "razorpay",
    currency: str = "USD",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.services.payment_service import create_payment_session
    from app.services.currency_service import convert
    tx = create_payment_session(
        db,
        user_id=user.id,
        amount=amount,
        currency=currency,
        gateway=gateway,
        metadata={"type": "WALLET_DEPOSIT"},
    )
    # If deposit currency != INR, compute the INR equivalent for display
    inr_equivalent = convert(db, amount, currency, "INR")
    return {
        "payment_transaction_id": tx.id,
        "gateway": gateway,
        "amount": amount,
        "currency": currency,
        "inrEquivalent": inr_equivalent,
        "status": tx.status.value,
    }
