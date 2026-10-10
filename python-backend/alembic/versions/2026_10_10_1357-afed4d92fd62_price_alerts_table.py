"""price alerts table

Revision ID: afed4d92fd62
Revises: 63a3a8bd2f0a
Create Date: 2026-10-10 13:57:30.466259

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'afed4d92fd62'
down_revision: Union[str, None] = '63a3a8bd2f0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('price_alerts',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('plan_code', sa.String(length=255), nullable=False),
    sa.Column('plan_name', sa.String(length=255), nullable=True),
    sa.Column('target_price', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(length=10), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('triggered_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_alerts_active'), 'price_alerts', ['active'], unique=False)
    op.create_index(op.f('ix_price_alerts_user_id'), 'price_alerts', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_price_alerts_user_id'), table_name='price_alerts')
    op.drop_index(op.f('ix_price_alerts_active'), table_name='price_alerts')
    op.drop_table('price_alerts')
