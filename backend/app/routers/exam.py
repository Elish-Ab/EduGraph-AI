from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.core.dependencies import CurrentUser, DB
from app.schemas.exam import (
    ExamDetail,
    ExamResultSummary,
    ExamSessionSchema,
    ExamSummary,
    QuestionForStudent,
    SubmitExamRequest,
    UploadMetadata,
    VerifyExamRequest,
)
from app.services import exam_service

router = APIRouter(prefix="/exams", tags=["exams"])


# ── Teacher endpoints ──────────────────────────────────────────────────────

@router.post("", response_model=ExamDetail, status_code=201)
async def upload_exam(
    file: UploadFile,
    title: str = Form(...),
    subject_id: str = Form(...),
    grade: int = Form(...),
    duration_minutes: int = Form(60),
    current_user: CurrentUser = ...,
    db: DB = ...,
) -> ExamDetail:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teachers only")
    meta = UploadMetadata(
        title=title, subject_id=subject_id, grade=grade, duration_minutes=duration_minutes
    )
    return await exam_service.upload_exam(file, meta, current_user, db)


@router.get("/teacher", response_model=list[ExamSummary])
async def list_teacher_exams(current_user: CurrentUser, db: DB) -> list[ExamSummary]:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teachers only")
    return await exam_service.list_exams_for_teacher(current_user.id, db)


@router.get("/{exam_id}", response_model=ExamDetail)
async def get_exam(exam_id: str, current_user: CurrentUser, db: DB) -> ExamDetail:
    return await exam_service.get_exam_detail(exam_id, db)


@router.post("/{exam_id}/verify", response_model=ExamDetail)
async def verify_exam(
    exam_id: str, data: VerifyExamRequest, current_user: CurrentUser, db: DB
) -> ExamDetail:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teachers only")
    return await exam_service.verify_exam(exam_id, data, current_user, db)


# ── Student endpoints ──────────────────────────────────────────────────────

@router.get("", response_model=list[ExamSummary])
async def list_active_exams(current_user: CurrentUser, db: DB) -> list[ExamSummary]:
    grade = None
    if current_user.role == "student" and current_user.profile:
        grade = current_user.profile.grade
    return await exam_service.list_active_exams_for_student(grade, db)


@router.get("/{exam_id}/questions", response_model=list[QuestionForStudent])
async def get_exam_questions(exam_id: str, current_user: CurrentUser, db: DB) -> list[QuestionForStudent]:
    detail = await exam_service.get_exam_detail(exam_id, db)
    return [QuestionForStudent.model_validate(q) for q in detail.questions]


@router.post("/{exam_id}/sessions", response_model=ExamSessionSchema, status_code=201)
async def start_session(exam_id: str, current_user: CurrentUser, db: DB) -> ExamSessionSchema:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    return await exam_service.start_exam_session(exam_id, current_user, db)


@router.post("/sessions/{session_id}/submit", response_model=ExamResultSummary)
async def submit_exam(
    session_id: str, data: SubmitExamRequest, current_user: CurrentUser, db: DB
) -> ExamResultSummary:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    return await exam_service.submit_exam(session_id, data, current_user, db)
