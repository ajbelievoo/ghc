"""user payment preferences

Revision ID: 404a972c7bfb
Revises: 5a25aaf7ef28
Create Date: 2026-10-10 11:54:41.349731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '404a972c7bfb'
down_revision: Union[str, None] = '5a25aaf7ef28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('wallet_autopay', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('preferred_gateway', sa.String(length=30), nullable=True))
    op.alter_column('users', 'wallet_autopay', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'preferred_gateway')
    op.drop_column('users', 'wallet_autopay')
