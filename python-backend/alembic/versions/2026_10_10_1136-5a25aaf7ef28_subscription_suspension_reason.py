"""subscription suspension_reason

Revision ID: 5a25aaf7ef28
Revises: 50397cd2013d
Create Date: 2026-10-10 11:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5a25aaf7ef28'
down_revision: Union[str, None] = '50397cd2013d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('suspension_reason', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('subscriptions', 'suspension_reason')
