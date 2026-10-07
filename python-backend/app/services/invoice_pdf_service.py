import io
from datetime import datetime
from fpdf import FPDF

from app.services.tax_service import format_invoice_tax, generate_invoice_number


def _format_category(category: str) -> str:
    mapping = {
        "VPS": "Cloud VPS",
        "DEDICATED": "Dedicated Server",
        "WEB_HOSTING": "Web Hosting",
        "DOMAIN": "Domain Registration",
        "CDN": "CDN Service",
        "IP_ADDON": "Additional IP",
    }
    return mapping.get(category, category.replace("_", " ").title())


def _get_plan_name(order: object) -> str:
    """Return a GHC-branded invoice description, never an OVH plan code."""
    if not order:
        return "Service"
    # Prefer the friendly catalog invoice name
    if hasattr(order, "plan") and order.plan and getattr(order.plan, "invoice_name", None):
        return order.plan.invoice_name
    category = _format_category(order.category.value)
    duration = order.duration_label or ""
    if duration:
        return f"{category} ({duration.replace('_', ' ')} months)"
    return category


class InvoicePDF(FPDF):
    def header(self):
        # Branded top bar
        self.set_fill_color(0, 30, 80)
        self.rect(0, 0, 210, 35, "F")

        # Logo / brand text
        self.set_xy(10, 8)
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(0, 183, 255)
        self.cell(0, 10, "GHC", ln=False)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, "Go Host Cloud", ln=True)

        self.set_xy(10, 20)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(200, 220, 255)
        self.cell(0, 5, "A premium brand of Believoo Pvt Ltd", ln=True)

        self.set_xy(120, 10)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(200, 220, 255)
        self.cell(0, 5, "support@believoo.com", ln=True, align="R")
        self.set_xy(120, 16)
        self.cell(0, 5, "https://ghc.believoo.com", ln=True, align="R")

        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Page {self.page_no()} | GHC Billing - Prices in invoiced currency", 0, 0, "C")


def generate_invoice_pdf(invoice: object, user: object, order: object = None) -> bytes:
    pdf = InvoicePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Invoice title
    pdf.set_font("Helvetica", "B", 26)
    pdf.set_text_color(0, 45, 180)
    pdf.cell(0, 12, "INVOICE", ln=True)

    # Invoice meta
    invoice_number = invoice.invoice_number or generate_invoice_number(invoice)
    tax = format_invoice_tax(invoice)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(95, 7, f"Invoice #: {invoice_number}", ln=0)
    pdf.cell(0, 7, f"Status: {invoice.status.value}", ln=1, align="R")
    pdf.cell(95, 7, f"Date: {invoice.created_at.strftime('%d %b %Y')}", ln=0)
    if invoice.due_date:
        pdf.cell(0, 7, f"Due: {invoice.due_date.strftime('%d %b %Y')}", ln=1, align="R")
    if invoice.hsn_code:
        pdf.cell(95, 7, f"HSN/SAC: {invoice.hsn_code}", ln=0)
    if invoice.place_of_supply:
        pdf.cell(0, 7, f"Place of Supply: {invoice.place_of_supply}", ln=1, align="R")
    pdf.ln(8)

    # Billed to
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(0, 24, 90)
    pdf.cell(0, 8, "Billed To", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, user.name or user.email, ln=True)
    pdf.cell(0, 6, user.email, ln=True)
    if user.phone:
        pdf.cell(0, 6, user.phone, ln=True)
    if user.gstin:
        pdf.cell(0, 6, f"GSTIN: {user.gstin}", ln=True)
    if user.country:
        pdf.cell(0, 6, f"Country: {user.country}", ln=True)
    pdf.ln(10)

    # Item table header
    pdf.set_fill_color(240, 248, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(0, 24, 90)
    pdf.cell(90, 9, "Description", 1, 0, "L", True)
    pdf.cell(20, 9, "HSN", 1, 0, "C", True)
    pdf.cell(20, 9, "Qty", 1, 0, "C", True)
    pdf.cell(60, 9, "Amount", 1, 1, "R", True)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(15, 23, 42)
    desc = _get_plan_name(order)
    if order and order.duration_label:
        desc = f"{desc} - {order.duration_label.replace('_', ' ')}"
    hsn = invoice.hsn_code or "9983"
    pdf.cell(90, 9, desc, 1, 0, "L")
    pdf.cell(20, 9, hsn, 1, 0, "C")
    pdf.cell(20, 9, "1", 1, 0, "C")
    pdf.cell(60, 9, f"{invoice.currency} {tax['taxable_amount']:.2f}", 1, 1, "R")

    # Totals
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(145, 7, "Subtotal", 0, 0, "R")
    pdf.cell(45, 7, f"{invoice.currency} {tax['taxable_amount']:.2f}", 0, 1, "R")

    if tax["tax_amount"]:
        if tax["tax_type"] == "IGST":
            pdf.cell(145, 7, f"IGST ({invoice.tax_rate * 100:.0f}%)", 0, 0, "R")
            pdf.cell(45, 7, f"{invoice.currency} {tax['igst']:.2f}", 0, 1, "R")
        else:
            rate = invoice.tax_rate * 100 / 2
            pdf.cell(145, 7, f"CGST ({rate:.1f}%)", 0, 0, "R")
            pdf.cell(45, 7, f"{invoice.currency} {tax['cgst']:.2f}", 0, 1, "R")
            pdf.cell(145, 7, f"SGST ({rate:.1f}%)", 0, 0, "R")
            pdf.cell(45, 7, f"{invoice.currency} {tax['sgst']:.2f}", 0, 1, "R")

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(0, 45, 180)
    pdf.cell(145, 10, "Total", 0, 0, "R")
    pdf.cell(45, 10, f"{invoice.currency} {tax['total']:.2f}", 0, 1, "R")

    # Notes
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(
        0,
        5,
        "Thank you for choosing GHC - Go Host Cloud, a brand of Believoo Pvt Ltd. "
        "This invoice does not include any upstream supplier references. "
        "For support, contact support@believoo.com",
    )

    out = pdf.output(dest="S")
    if isinstance(out, str):
        return out.encode("latin-1")
    return bytes(out)
