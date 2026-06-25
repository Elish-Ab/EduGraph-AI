import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    total_marks: Mapped[int] = mapped_column(Integer, default=100)
    # draft | pending_verification | verified | rejected | active | closed
    status: Mapped[str] = mapped_column(String(30), default="draft")
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    alignment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    clo_coverage: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="exam", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["ExamSession"]] = relationship(
        "ExamSession", back_populates="exam", cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id: Mapped[str] = mapped_column(String(36), ForeignKey("exams.id", ondelete="CASCADE"))
    clo_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("clos.id", ondelete="SET NULL"), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    question_type: Mapped[str] = mapped_column(String(20), default="mcq")  # mcq | essay
    text: Mapped[str] = mapped_column(Text, nullable=False)
    option_a: Mapped[str | None] = mapped_column(Text, nullable=True)
    option_b: Mapped[str | None] = mapped_column(Text, nullable=True)
    option_c: Mapped[str | None] = mapped_column(Text, nullable=True)
    option_d: Mapped[str | None] = mapped_column(Text, nullable=True)
    correct_option: Mapped[str | None] = mapped_column(String(1), nullable=True)  # A/B/C/D
    marks: Mapped[int] = mapped_column(Integer, default=2)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="question", cascade="all, delete-orphan"
    )


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id: Mapped[str] = mapped_column(String(36), ForeignKey("exams.id", ondelete="CASCADE"))
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # in_progress | submitted | graded
    status: Mapped[str] = mapped_column(String(20), default="in_progress")

    exam: Mapped["Exam"] = relationship("Exam", back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="session", cascade="all, delete-orphan"
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"))
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id", ondelete="CASCADE"))
    selected_option: Mapped[str | None] = mapped_column(String(1), nullable=True)  # MCQ
    essay_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # Essay
    marks_awarded: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(nullable=True)

    session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
