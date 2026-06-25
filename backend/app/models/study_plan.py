import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    week_number: Mapped[int] = mapped_column(Integer, default=1)

    tasks: Mapped[list["PlanTask"]] = relationship(
        "PlanTask", back_populates="plan", cascade="all, delete-orphan"
    )


class PlanTask(Base):
    __tablename__ = "plan_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"))
    clo_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("clos.id", ondelete="SET NULL"), nullable=True)
    day: Mapped[str] = mapped_column(String(10), nullable=False)  # Mon/Tue/...
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    task_type: Mapped[str] = mapped_column(String(30), default="review")  # review/practice/test
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    plan: Mapped["StudyPlan"] = relationship("StudyPlan", back_populates="tasks")
