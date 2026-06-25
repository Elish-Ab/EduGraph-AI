"""initial_schema

Revision ID: 8d900f828fb2
Revises:
Create Date: 2026-06-25 00:55:25.067839

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "8d900f828fb2"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("school_code", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("grade", sa.Integer(), nullable=True),
        sa.Column("career_interest", sa.String(100), nullable=True),
        sa.Column("current_avg", sa.Integer(), nullable=True),
        sa.Column("target_score", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "subjects",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(20), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "units",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("subject_id", sa.String(36), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "topics",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("unit_id", sa.String(36), sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "clos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("topic_id", sa.String(36), sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(30), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("bloom_level", sa.String(30), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("clos")
    op.drop_table("topics")
    op.drop_table("units")
    op.drop_table("subjects")
    op.drop_table("student_profiles")
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
