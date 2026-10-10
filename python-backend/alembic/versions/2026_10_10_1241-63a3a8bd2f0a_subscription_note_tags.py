"""subscription note tags

Revision ID: 63a3a8bd2f0a
Revises: da04c55500b7
Create Date: 2026-10-10 12:41:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '63a3a8bd2f0a'
down_revision: Union[str, None] = 'da04c55500b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('customer_note', sa.Text(), nullable=True))
    op.add_column('subscriptions', sa.Column('tags', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('subscriptions', 'tags')
    op.drop_column('subscriptions', 'customer_note')
