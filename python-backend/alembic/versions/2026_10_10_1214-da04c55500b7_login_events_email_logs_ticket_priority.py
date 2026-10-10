"""login events, email logs, ticket priority

Revision ID: da04c55500b7
Revises: 404a972c7bfb
Create Date: 2026-10-10 12:14:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'da04c55500b7'
down_revision: Union[str, None] = '404a972c7bfb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'login_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('method', sa.String(length=20), nullable=False),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.String(length=400), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_login_events_user_id', 'login_events', ['user_id'])
    op.create_index('ix_login_events_created_at', 'login_events', ['created_at'])
    op.create_table(
        'email_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('to_email', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_email_logs_to_email', 'email_logs', ['to_email'])
    op.create_index('ix_email_logs_created_at', 'email_logs', ['created_at'])
    op.add_column('support_tickets', sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'))


def downgrade() -> None:
    op.drop_column('support_tickets', 'priority')
    op.drop_table('email_logs')
    op.drop_table('login_events')
