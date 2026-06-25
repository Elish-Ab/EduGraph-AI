"""study_plan_tables

Revision ID: 3f4fc91893e3
Revises: bf5cf537151e
Create Date: 2026-06-25 01:49:08.217691

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f4fc91893e3'
down_revision: Union[str, Sequence[str], None] = 'bf5cf537151e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_plans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("student_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, unique=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("week_number", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_table(
        "plan_tasks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("plan_id", sa.String(36), sa.ForeignKey("study_plans.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("clo_id", sa.String(36), sa.ForeignKey("clos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("day", sa.String(10), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("task_type", sa.String(30), nullable=False, server_default="review"),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("plan_tasks")
    op.drop_table("study_plans")
