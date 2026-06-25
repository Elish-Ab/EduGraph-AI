"""exam_tables

Revision ID: bf5cf537151e
Revises: 8d844cf65efb
Create Date: 2026-06-25 01:12:29.318508

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf5cf537151e'
down_revision: Union[str, Sequence[str], None] = '8d844cf65efb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exams",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject_id", sa.String(36), sa.ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("grade", sa.Integer(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("total_marks", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("status", sa.String(30), nullable=False, server_default="draft"),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("ai_notes", sa.Text(), nullable=True),
        sa.Column("alignment_score", sa.Float(), nullable=True),
        sa.Column("clo_coverage", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("exam_id", sa.String(36), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("clo_id", sa.String(36), sa.ForeignKey("clos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("question_type", sa.String(20), nullable=False, server_default="mcq"),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("option_a", sa.Text(), nullable=True),
        sa.Column("option_b", sa.Text(), nullable=True),
        sa.Column("option_c", sa.Text(), nullable=True),
        sa.Column("option_d", sa.Text(), nullable=True),
        sa.Column("correct_option", sa.String(1), nullable=True),
        sa.Column("marks", sa.Integer(), nullable=False, server_default="2"),
    )
    op.create_table(
        "exam_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("exam_id", sa.String(36), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
    )
    op.create_table(
        "answers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(36), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("selected_option", sa.String(1), nullable=True),
        sa.Column("essay_text", sa.Text(), nullable=True),
        sa.Column("marks_awarded", sa.Float(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("answers")
    op.drop_table("exam_sessions")
    op.drop_table("questions")
    op.drop_table("exams")
