"""phase_a_monitoring

Revision ID: 707548188319
Revises: f4e5d6c7b8a9
Create Date: 2026-10-10 07:38:33.278100

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '707548188319'
down_revision: Union[str, None] = 'f4e5d6c7b8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('status_incidents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('kind', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('services', sa.JSON(), nullable=True),
        sa.Column('scheduled_for', sa.DateTime(), nullable=True),
        sa.Column('scheduled_until', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('status_subscribers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('token', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_status_subscribers_email'), 'status_subscribers', ['email'], unique=True)
    op.create_table('service_alert_rules',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('subscription_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('metric', sa.String(length=30), nullable=False),
        sa.Column('operator', sa.String(length=4), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('duration_checks', sa.Integer(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('notify_email', sa.Boolean(), nullable=False),
        sa.Column('last_triggered_at', sa.DateTime(), nullable=True),
        sa.Column('breach_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_alert_rules_subscription_id'), 'service_alert_rules', ['subscription_id'], unique=False)
    op.create_index(op.f('ix_service_alert_rules_user_id'), 'service_alert_rules', ['user_id'], unique=False)
    op.create_table('service_metric_samples',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('subscription_id', sa.String(length=36), nullable=False),
        sa.Column('cpu', sa.Float(), nullable=True),
        sa.Column('ram', sa.Float(), nullable=True),
        sa.Column('disk', sa.Float(), nullable=True),
        sa.Column('load', sa.Float(), nullable=True),
        sa.Column('net_rx', sa.Float(), nullable=True),
        sa.Column('net_tx', sa.Float(), nullable=True),
        sa.Column('disk_read', sa.Float(), nullable=True),
        sa.Column('disk_write', sa.Float(), nullable=True),
        sa.Column('source', sa.String(length=30), nullable=False),
        sa.Column('sampled_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_metric_samples_sampled_at'), 'service_metric_samples', ['sampled_at'], unique=False)
    op.create_index(op.f('ix_service_metric_samples_subscription_id'), 'service_metric_samples', ['subscription_id'], unique=False)
    op.add_column('subscriptions', sa.Column('monitoring_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False))


def downgrade() -> None:
    op.drop_column('subscriptions', 'monitoring_enabled')
    op.drop_index(op.f('ix_service_metric_samples_subscription_id'), table_name='service_metric_samples')
    op.drop_index(op.f('ix_service_metric_samples_sampled_at'), table_name='service_metric_samples')
    op.drop_table('service_metric_samples')
    op.drop_index(op.f('ix_service_alert_rules_user_id'), table_name='service_alert_rules')
    op.drop_index(op.f('ix_service_alert_rules_subscription_id'), table_name='service_alert_rules')
    op.drop_table('service_alert_rules')
    op.drop_index(op.f('ix_status_subscribers_email'), table_name='status_subscribers')
    op.drop_table('status_subscribers')
    op.drop_table('status_incidents')
