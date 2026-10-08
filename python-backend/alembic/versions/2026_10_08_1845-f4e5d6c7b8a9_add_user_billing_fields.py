"""add user billing address fields

Revision ID: a1b2c3d4e5f6
Revises: 8095a1c82734
Create Date: 2026-10-08 18:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f4e5d6c7b8a9"
down_revision = "8095a1c82734"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("billing_address", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("billing_city", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("billing_state", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("billing_pincode", sa.String(length=20), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("billing_pincode")
        batch_op.drop_column("billing_state")
        batch_op.drop_column("billing_city")
        batch_op.drop_column("billing_address")
