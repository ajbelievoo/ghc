"""Drop unique constraint on invoices.order_id

Recurring subscriptions/domains legitimately need multiple invoices per order
(one per billing cycle). The unique constraint crashes renewal invoice
creation with UniqueViolation.

Revision ID: a1b2c3d4e5f6
Revises: 72164c9d4ff2
Create Date: 2026-10-08 00:00:00.000000
"""
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "72164c9d4ff2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("invoices_order_id_key", "invoices", type_="unique")
    op.create_index(op.f("ix_invoices_order_id"), "invoices", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_invoices_order_id"), table_name="invoices")
    op.create_unique_constraint("invoices_order_id_key", "invoices", ["order_id"])
