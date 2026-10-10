"""domain transfer columns

Revision ID: 50397cd2013d
Revises: 707548188319
Create Date: 2026-10-10 11:17:58.592087

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '50397cd2013d'
down_revision: Union[str, None] = '707548188319'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('domain_registrations', sa.Column('is_transfer', sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column('domain_registrations', sa.Column('transfer_auth_code', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('domain_registrations', 'transfer_auth_code')
    op.drop_column('domain_registrations', 'is_transfer')
