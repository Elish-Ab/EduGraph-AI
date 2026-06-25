from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class QuestionSchema(BaseModel):
    id: str
    order: int
    question_type: str
    text: str
    option_a: str | None
    option_b: str | None
    option_c: str | None
    option_d: str | None
    correct_option: str | None
    marks: int
    clo_id: str | None

    model_config = {"from_attributes": True}


class QuestionForStudent(BaseModel):
    """Question without the correct answer revealed."""
    id: str
    order: int
    question_type: str
    text: str
    option_a: str | None
    option_b: str | None
    option_c: str | None
    option_d: str | None
    marks: int

    model_config = {"from_attributes": True}


class ExamSummary(BaseModel):
    id: str
    title: str
    grade: int
    duration_minutes: int
    total_marks: int
    status: str
    question_count: int
    alignment_score: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExamDetail(BaseModel):
    id: str
    title: str
    grade: int
    duration_minutes: int
    total_marks: int
    status: str
    ai_notes: str | None
    alignment_score: float | None
    clo_coverage: float | None
    questions: list[QuestionSchema]
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadMetadata(BaseModel):
    title: str
    subject_id: str
    grade: int
    duration_minutes: int = 60


class SubmitAnswerItem(BaseModel):
    question_id: str
    selected_option: str | None = None
    essay_text: str | None = None


class SubmitExamRequest(BaseModel):
    answers: list[SubmitAnswerItem]


class AnswerSchema(BaseModel):
    id: str
    question_id: str
    selected_option: str | None
    essay_text: str | None
    marks_awarded: float | None
    is_correct: bool | None

    model_config = {"from_attributes": True}


class ExamSessionSchema(BaseModel):
    id: str
    exam_id: str
    student_id: str
    started_at: datetime
    submitted_at: datetime | None
    score: float | None
    status: str
    answers: list[AnswerSchema]

    model_config = {"from_attributes": True}


class ExamResultSummary(BaseModel):
    session_id: str
    exam_title: str
    score: float
    total_marks: int
    percentage: float
    correct_count: int
    total_questions: int
    answers: list[AnswerSchema]


class CLOMappingUpdate(BaseModel):
    question_id: str
    clo_id: str


class VerifyExamRequest(BaseModel):
    approve: bool
    ai_notes: str | None = None
    alignment_score: float | None = None
    clo_coverage: float | None = None
    clo_mappings: list[CLOMappingUpdate] = []
