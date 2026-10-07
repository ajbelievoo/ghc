"""add gst fields

Revision ID: e4ed4d07003d
Revises: 1c5890ae1b59
Create Date: 2026-09-15 07:21:35.515638

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4ed4d07003d'
down_revision: Union[str, None] = '1c5890ae1b59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns as nullable first so existing rows don't fail
    op.add_column('invoices', sa.Column('invoice_number', sa.String(length=50), nullable=True))
    op.add_column('invoices', sa.Column('tax_type', sa.String(length=10), nullable=True))
    op.add_column('invoices', sa.Column('hsn_code', sa.String(length=20), nullable=True))
    op.add_column('invoices', sa.Column('place_of_supply', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=False)
    op.add_column('users', sa.Column('country', sa.String(length=2), nullable=True))
    op.add_column('users', sa.Column('gstin', sa.String(length=15), nullable=True))

    # Set sensible defaults for existing rows
    op.execute("UPDATE invoices SET tax_type = 'IGST', hsn_code = '9983'")
    op.execute("UPDATE users SET country = 'IN'")

    # Now enforce not-null for the fields that should always be present
    op.alter_column('invoices', 'tax_type', nullable=False)
    op.alter_column('invoices', 'hsn_code', nullable=False)
    op.alter_column('users', 'country', nullable=False)


def downgrade() -> None:
    op.drop_column('users', 'gstin')
    op.drop_column('users', 'country')
    op.drop_index(op.f('ix_invoices_invoice_number'), table_name='invoices')
    op.drop_column('invoices', 'place_of_supply')
    op.drop_column('invoices', 'hsn_code')
    op.drop_column('invoices', 'tax_type')
    op.drop_column('invoices', 'invoice_number')
