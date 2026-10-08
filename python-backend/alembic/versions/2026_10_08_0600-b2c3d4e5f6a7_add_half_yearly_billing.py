"""Add HALF_YEARLY to billingcycle enum

6-month commitment durations (derived for plans where OVH only sells
monthly terms) need a half-yearly renewal cycle.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-08 06:00:00.000000
"""
from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE billingcycle ADD VALUE IF NOT EXISTS 'HALF_YEARLY'")


def downgrade() -> None:
    # Postgres cannot drop individual enum values; left in place.
    pass
