"""add role and subscription_tier to users

Revision ID: 20260320_000003
Revises: 20260319_000002
Create Date: 2026-03-20 10:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260320_000003"
down_revision = "20260319_000002"
branch_labels = None
depends_on = None


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "users", "role"):
        op.add_column(
            "users",
            sa.Column("role", sa.String(length=16), nullable=False,
                      server_default=sa.text("'USER'")),
        )

    if not _has_column(inspector, "users", "subscription_tier"):
        op.add_column(
            "users",
            sa.Column(
                "subscription_tier",
                sa.String(length=16),
                nullable=False,
                server_default=sa.text("'FREE'"),
            ),
        )

    # Backfill from legacy `tier` if present and non-empty.
    if _has_column(inspector, "users", "tier"):
        op.execute(
            """
            UPDATE users
            SET subscription_tier = tier
            WHERE tier IS NOT NULL AND tier != ''
            """
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_column(inspector, "users", "subscription_tier"):
        op.drop_column("users", "subscription_tier")

    if _has_column(inspector, "users", "role"):
        op.drop_column("users", "role")
