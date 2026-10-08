"""add coupons

Revision ID: 8095a1c82734
Revises: c3d4e5f6a7b8
Create Date: 2026-10-08 18:08:28.352156

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8095a1c82734'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(64), nullable=False, unique=True),
        sa.Column("discount_type", sa.String(10), nullable=False, server_default="percent"),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("per_user_limit", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("min_order_amount", sa.Float(), nullable=True),
        sa.Column("applies_to_category", sa.String(50), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_coupons_code", "coupons", ["code"], unique=True)
    op.create_table(
        "coupon_redemptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("coupon_id", sa.String(36), sa.ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("customer_orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("discount_amount", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_coupon_redemptions_coupon", "coupon_redemptions", ["coupon_id"])
    op.create_index("ix_coupon_redemptions_user", "coupon_redemptions", ["user_id"])
    op.add_column("customer_orders", sa.Column("coupon_code", sa.String(64), nullable=True))
    op.add_column("customer_orders", sa.Column("discount_amount", sa.Float(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("customer_orders", "discount_amount")
    op.drop_column("customer_orders", "coupon_code")
    op.drop_table("coupon_redemptions")
    op.drop_table("coupons")
