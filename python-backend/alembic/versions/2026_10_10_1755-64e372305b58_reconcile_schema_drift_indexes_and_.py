"""reconcile schema drift: indexes and notnull

Revision ID: 64e372305b58
Revises: afed4d92fd62
Create Date: 2026-10-10 17:55:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '64e372305b58'
down_revision = 'afed4d92fd62'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE cloud_projects SET updated_at = created_at WHERE updated_at IS NULL")
    op.alter_column("cloud_projects", "updated_at", nullable=False)
    op.create_index("ix_cloud_volumes_upstream_volume_id", "cloud_volumes", ["upstream_volume_id"])
    op.execute("ALTER INDEX ix_coupon_redemptions_coupon RENAME TO ix_coupon_redemptions_coupon_id")
    op.execute("ALTER INDEX ix_coupon_redemptions_user RENAME TO ix_coupon_redemptions_user_id")
    # redundant: ix_coupons_code unique index already enforces uniqueness
    op.execute("ALTER TABLE coupons DROP CONSTRAINT coupons_code_key")


def downgrade() -> None:
    op.execute("ALTER TABLE coupons ADD CONSTRAINT coupons_code_key UNIQUE (code)")
    op.execute("ALTER INDEX ix_coupon_redemptions_coupon_id RENAME TO ix_coupon_redemptions_coupon")
    op.execute("ALTER INDEX ix_coupon_redemptions_user_id RENAME TO ix_coupon_redemptions_user")
    op.drop_index("ix_cloud_volumes_upstream_volume_id", table_name="cloud_volumes")
    op.alter_column("cloud_projects", "updated_at", nullable=True)
