from sqlalchemy.orm import Session

from app.services.currency_service import convert
from app.models.models import Wallet, WalletTransaction, WalletTransactionType


def get_or_create_wallet(db: Session, user_id: str, currency: str = "INR") -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.0, currency=currency)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def credit_wallet(db: Session, user_id: str, amount: float, description: str = "Wallet deposit", gateway: str = None, metadata: dict = None, currency: str = None) -> Wallet:
    wallet = get_or_create_wallet(db, user_id)
    deposit_currency = (currency or "INR").upper()
    if deposit_currency != wallet.currency:
        credit_amount = convert(db, amount, deposit_currency, wallet.currency)
    else:
        credit_amount = amount
    wallet.balance += credit_amount
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.DEPOSIT,
        amount=credit_amount,
        description=description,
        gateway=gateway,
        metadata={"deposit_currency": deposit_currency, "deposit_amount": amount, "wallet_currency": wallet.currency, "credited": credit_amount, **(metadata or {})},
    ))
    db.commit()
    db.refresh(wallet)
    return wallet


def debit_wallet(db: Session, user_id: str, amount: float, description: str = "Wallet payment") -> Wallet:
    wallet = get_or_create_wallet(db, user_id)
    if wallet.balance < amount:
        raise ValueError("Insufficient wallet balance")
    wallet.balance -= amount
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.PAYMENT,
        amount=-amount,
        description=description,
    ))
    db.commit()
    db.refresh(wallet)
    return wallet


def pay_invoice_with_wallet(db: Session, user, invoice) -> dict:
    """Debit the user's wallet for an invoice, mark it paid, complete the linked
    order, then reactivate/extend the related subscription. Shared by the manual
    pay-invoice endpoint and the auto-pay sweep."""
    from fastapi import HTTPException
    from app.models.models import InvoiceStatus, CustomerOrder, OrderStatus

    if invoice.status == InvoiceStatus.PAID:
        return {"paid": True, "already": True}
    wallet = get_or_create_wallet(db, user.id)
    amount = convert(db, invoice.amount, invoice.currency, wallet.currency)
    if wallet.balance < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance: {wallet.balance:.2f} {wallet.currency} (needs {amount:.2f})",
        )
    wallet.balance -= amount
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        type=WalletTransactionType.PAYMENT,
        amount=-amount,
        description=f"Wallet payment for invoice {invoice.id[:8].upper()}",
        gateway="wallet",
        metadata={"invoice_id": invoice.id, "original_amount": invoice.amount, "original_currency": invoice.currency},
    ))
    invoice.status = InvoiceStatus.PAID
    if invoice.order_id:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == invoice.order_id).first()
        if order:
            order.status = OrderStatus.ACTIVE
    db.commit()
    try:
        from app.services.subscription_service import reactivate_after_invoice_payment
        reactivate_after_invoice_payment(db, invoice)
    except Exception:
        import logging
        logging.getLogger(__name__).exception(f"Reactivation after invoice {invoice.id} payment failed")
    return {"paid": True, "invoiceId": invoice.id}
