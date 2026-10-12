"""add 2fa backup codes

Revision ID: 1c03232ab36f
Revises: 475808be29ed
Create Date: 2026-10-12 00:53:47.516184

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c03232ab36f'
down_revision: Union[str, None] = '475808be29ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("backup_codes", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "backup_codes")
