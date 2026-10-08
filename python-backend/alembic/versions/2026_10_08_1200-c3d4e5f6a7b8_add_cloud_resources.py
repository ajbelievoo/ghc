"""add cloud projects, instances, ssh keys, volumes, containers, floating ips

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-10-08 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cloud_projects",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("upstream_project_id", sa.String(64), nullable=True),
        sa.Column("upstream_order_id", sa.String(64), nullable=True),
        sa.Column("name", sa.String(255), nullable=False, server_default="GHC Cloud Project"),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_cloud_projects_user_id", "cloud_projects", ["user_id"])
    op.create_index("ix_cloud_projects_upstream_project_id", "cloud_projects", ["upstream_project_id"])

    op.create_table(
        "cloud_instances",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("upstream_instance_id", sa.String(64), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("flavor_code", sa.String(100), nullable=False),
        sa.Column("flavor_name", sa.String(255), nullable=True),
        sa.Column("image", sa.String(255), nullable=True),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("deploy_mode", sa.String(10), nullable=False, server_default="1az"),
        sa.Column("hourly_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("monthly_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("public_ip", sa.String(64), nullable=True),
        sa.Column("private_ip", sa.String(64), nullable=True),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("upstream_status", sa.String(50), nullable=True),
        sa.Column("last_status_sync", sa.DateTime(), nullable=True),
        sa.Column("last_billed_at", sa.DateTime(), nullable=True),
        sa.Column("billing_started_at", sa.DateTime(), nullable=True),
        sa.Column("launched_at", sa.DateTime(), nullable=False),
        sa.Column("terminated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_cloud_instances_user_id", "cloud_instances", ["user_id"])
    op.create_index("ix_cloud_instances_upstream_instance_id", "cloud_instances", ["upstream_instance_id"])

    op.create_table(
        "cloud_ssh_keys",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("upstream_key_id", sa.String(64), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("public_key", sa.Text(), nullable=False),
        sa.Column("fingerprint", sa.String(128), nullable=True),
        sa.Column("region", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cloud_ssh_keys_user_id", "cloud_ssh_keys", ["user_id"])

    op.create_table(
        "cloud_volumes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("upstream_volume_id", sa.String(64), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("size_gb", sa.Integer(), nullable=False),
        sa.Column("volume_type", sa.String(50), nullable=False, server_default="classic"),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("hourly_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(30), nullable=False, server_default="creating"),
        sa.Column("attached_instance_id", sa.String(64), nullable=True),
        sa.Column("last_billed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cloud_volumes_user_id", "cloud_volumes", ["user_id"])

    op.create_table(
        "cloud_storage_containers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("upstream_container_id", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("container_type", sa.String(50), nullable=False, server_default="standard"),
        sa.Column("monthly_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("stored_bytes", sa.Float(), nullable=False, server_default="0"),
        sa.Column("object_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="creating"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cloud_storage_containers_user_id", "cloud_storage_containers", ["user_id"])

    op.create_table(
        "cloud_floating_ips",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("cloud_projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("upstream_ip_id", sa.String(64), nullable=True),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("hourly_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("status", sa.String(30), nullable=False, server_default="creating"),
        sa.Column("attached_instance_id", sa.String(64), nullable=True),
        sa.Column("last_billed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_cloud_floating_ips_user_id", "cloud_floating_ips", ["user_id"])


def downgrade() -> None:
    op.drop_table("cloud_floating_ips")
    op.drop_table("cloud_storage_containers")
    op.drop_table("cloud_volumes")
    op.drop_table("cloud_ssh_keys")
    op.drop_table("cloud_instances")
    op.drop_table("cloud_projects")
