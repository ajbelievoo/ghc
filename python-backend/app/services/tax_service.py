"""Tax / GST helpers and reporting."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import CustomerOrder, Invoice, PaymentTransaction, User


def gst_fields_for_user(db: Session, user_id: str):
    """Return tax_type, hsn_code, place_of_supply for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return "IGST", "9983", ""

    # India + valid GSTIN => CGST+SGST (intra-state assumption).
    # Without GSTIN => IGST.
    place = "Delhi"  # Placeholder until per-user state is captured.
    tax_type = "CGST+SGST" if user.country == "IN" and user.gstin else "IGST"
    return tax_type, "9983", place


def _split_gst(tax_amount: float, tax_rate: float, tax_type: str) -> Dict[str, float]:
    """Split tax into CGST/SGST or IGST for Indian GST invoices.

    For IGST the full tax is shown as IGST.
    For intra-state (CGST+SGST) the tax is split 50/50.
    """
    if tax_type.upper() == "IGST" or tax_rate == 0:
        return {"igst": tax_amount, "cgst": 0.0, "sgst": 0.0}

    return {"igst": 0.0, "cgst": tax_amount / 2, "sgst": tax_amount / 2}


def format_invoice_tax(invoice: Invoice) -> Dict[str, Any]:
    """Return tax breakdown for an invoice, ready for PDF or API."""
    tax_type = (invoice.tax_type or "IGST").upper()
    split = _split_gst(invoice.tax_amount, invoice.tax_rate, tax_type)
    taxable = round(invoice.amount - invoice.tax_amount, 2)
    return {
        "taxable_amount": taxable,
        "tax_amount": invoice.tax_amount,
        "tax_rate": invoice.tax_rate,
        "tax_type": tax_type,
        "cgst": split["cgst"],
        "sgst": split["sgst"],
        "igst": split["igst"],
        "total": invoice.amount,
    }


def generate_invoice_number(invoice: Invoice) -> str:
    """Generate a human-readable invoice number."""
    prefix = "GHC-INV"
    date_part = (invoice.created_at or datetime.utcnow()).strftime("%Y%m")
    short_id = invoice.id[:8].upper()
    return f"{prefix}-{date_part}-{short_id}"


def tax_report(db: Session, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
    """Return a tax summary report for a date range."""
    query = db.query(Invoice).filter(Invoice.status == "PAID")
    if start:
        query = query.filter(Invoice.created_at >= start)
    if end:
        query = query.filter(Invoice.created_at <= end)

    invoices = query.all()

    total_taxable = 0.0
    total_tax = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0
    currency = "INR"

    for inv in invoices:
        total_taxable += inv.amount - inv.tax_amount
        total_tax += inv.tax_amount
        split = _split_gst(inv.tax_amount, inv.tax_rate, inv.tax_type or "IGST")
        total_cgst += split["cgst"]
        total_sgst += split["sgst"]
        total_igst += split["igst"]
        if inv.currency:
            currency = inv.currency

    return {
        "currency": currency,
        "start": start.isoformat() if start else None,
        "end": end.isoformat() if end else None,
        "invoice_count": len(invoices),
        "total_taxable": round(total_taxable, 2),
        "total_tax": round(total_tax, 2),
        "total_cgst": round(total_cgst, 2),
        "total_sgst": round(total_sgst, 2),
        "total_igst": round(total_igst, 2),
        "grand_total": round(total_taxable + total_tax, 2),
    }
