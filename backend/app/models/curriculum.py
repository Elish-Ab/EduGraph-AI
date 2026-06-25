import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # e.g. PHYS
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    units: Mapped[list["Unit"]] = relationship("Unit", back_populates="subject")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="units")
    topics: Mapped[list["Topic"]] = relationship("Topic", back_populates="unit")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id: Mapped[str] = mapped_column(String(36), ForeignKey("units.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    unit: Mapped["Unit"] = relationship("Unit", back_populates="topics")
    clos: Mapped[list["CLO"]] = relationship("CLO", back_populates="topic")


class CLO(Base):
    __tablename__ = "clos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)  # e.g. PHYS.11.U1.T1.CLO1
    description: Mapped[str] = mapped_column(Text, nullable=False)
    bloom_level: Mapped[str | None] = mapped_column(String(30), nullable=True)  # remember/understand/apply…

    topic: Mapped["Topic"] = relationship("Topic", back_populates="clos")
