import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.exam import Answer, Exam, ExamSession, Question
from app.models.user import User
from app.schemas.exam import (
    ExamDetail,
    ExamResultSummary,
    ExamSessionSchema,
    ExamSummary,
    SubmitExamRequest,
    UploadMetadata,
    VerifyExamRequest,
)
from app.utils.exam_parser import parse_exam_file

UPLOAD_DIR = Path(settings.UPLOAD_DIR)


async def upload_exam(
    file: UploadFile,
    meta: UploadMetadata,
    teacher: User,
    db: AsyncSession,
) -> ExamDetail:
    # Save file
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "exam.pdf").suffix.lower()
    if suffix not in (".pdf", ".docx", ".doc"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    file_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{file_id}{suffix}"
    content = await file.read()
    save_path.write_bytes(content)

    # Parse questions
    try:
        parsed = parse_exam_file(save_path)
    except Exception as exc:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not parse exam file: {exc}")

    if not parsed:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="No questions found in file. Check the format.")

    # Create exam
    exam = Exam(
        id=str(uuid.uuid4()),
        teacher_id=teacher.id,
        subject_id=meta.subject_id,
        title=meta.title,
        grade=meta.grade,
        duration_minutes=meta.duration_minutes,
        total_marks=sum(q.marks for q in parsed),
        status="pending_verification",
        file_path=str(save_path),
    )
    db.add(exam)
    await db.flush()

    for pq in parsed:
        question = Question(
            id=str(uuid.uuid4()),
            exam_id=exam.id,
            order=pq.order,
            question_type=pq.question_type,
            text=pq.text,
            option_a=pq.option_a,
            option_b=pq.option_b,
            option_c=pq.option_c,
            option_d=pq.option_d,
            correct_option=pq.correct_option,
            marks=pq.marks,
        )
        db.add(question)

    await db.commit()
    return await get_exam_detail(exam.id, db)


async def list_exams_for_teacher(teacher_id: str, db: AsyncSession) -> list[ExamSummary]:
    result = await db.execute(
        select(
            Exam,
            func.count(Question.id).label("question_count"),
        )
        .outerjoin(Question, Question.exam_id == Exam.id)
        .where(Exam.teacher_id == teacher_id)
        .group_by(Exam.id)
        .order_by(Exam.created_at.desc())
    )
    rows = result.all()
    return [
        ExamSummary(
            id=exam.id,
            title=exam.title,
            grade=exam.grade,
            duration_minutes=exam.duration_minutes,
            total_marks=exam.total_marks,
            status=exam.status,
            question_count=count,
            alignment_score=exam.alignment_score,
            created_at=exam.created_at,
        )
        for exam, count in rows
    ]


async def list_active_exams_for_student(grade: int | None, db: AsyncSession) -> list[ExamSummary]:
    stmt = (
        select(Exam, func.count(Question.id).label("question_count"))
        .outerjoin(Question, Question.exam_id == Exam.id)
        .where(Exam.status == "active")
        .group_by(Exam.id)
        .order_by(Exam.created_at.desc())
    )
    if grade:
        stmt = stmt.where(Exam.grade == grade)
    result = await db.execute(stmt)
    return [
        ExamSummary(
            id=exam.id,
            title=exam.title,
            grade=exam.grade,
            duration_minutes=exam.duration_minutes,
            total_marks=exam.total_marks,
            status=exam.status,
            question_count=count,
            alignment_score=exam.alignment_score,
            created_at=exam.created_at,
        )
        for exam, count in result.all()
    ]


async def get_exam_detail(exam_id: str, db: AsyncSession) -> ExamDetail:
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id)
        .options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam.questions.sort(key=lambda q: q.order)
    return ExamDetail.model_validate(exam)


async def verify_exam(
    exam_id: str,
    data: VerifyExamRequest,
    teacher: User,
    db: AsyncSession,
) -> ExamDetail:
    result = await db.execute(
        select(Exam).where(Exam.id == exam_id).options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your exam")

    exam.status = "active" if data.approve else "rejected"
    exam.ai_notes = data.ai_notes
    if data.alignment_score is not None:
        exam.alignment_score = data.alignment_score
    if data.clo_coverage is not None:
        exam.clo_coverage = data.clo_coverage

    # Apply CLO mappings
    if data.clo_mappings:
        q_map = {q.id: q for q in exam.questions}
        for mapping in data.clo_mappings:
            if mapping.question_id in q_map:
                q_map[mapping.question_id].clo_id = mapping.clo_id

    await db.commit()
    return await get_exam_detail(exam_id, db)


async def start_exam_session(exam_id: str, student: User, db: AsyncSession) -> ExamSessionSchema:
    # Check exam exists and is active
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None or exam.status != "active":
        raise HTTPException(status_code=404, detail="Exam not available")

    # Check for existing in-progress session
    existing = await db.execute(
        select(ExamSession).where(
            ExamSession.exam_id == exam_id,
            ExamSession.student_id == student.id,
            ExamSession.status == "in_progress",
        )
    )
    session = existing.scalar_one_or_none()
    if session is None:
        session = ExamSession(
            id=str(uuid.uuid4()),
            exam_id=exam_id,
            student_id=student.id,
        )
        db.add(session)
        await db.commit()

    result = await db.execute(
        select(ExamSession)
        .where(ExamSession.id == session.id)
        .options(selectinload(ExamSession.answers))
    )
    return ExamSessionSchema.model_validate(result.scalar_one())


async def submit_exam(
    session_id: str,
    data: SubmitExamRequest,
    student: User,
    db: AsyncSession,
) -> ExamResultSummary:
    result = await db.execute(
        select(ExamSession)
        .where(ExamSession.id == session_id, ExamSession.student_id == student.id)
        .options(selectinload(ExamSession.answers))
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Session already submitted")

    # Load questions with correct answers
    q_result = await db.execute(
        select(Question).where(Question.exam_id == session.exam_id)
    )
    questions = {q.id: q for q in q_result.scalars()}

    # Delete old answers if re-submitting
    for old in session.answers:
        await db.delete(old)

    total_marks = 0
    earned_marks = 0.0
    correct_count = 0
    answer_objs: list[Answer] = []

    for item in data.answers:
        q = questions.get(item.question_id)
        if q is None:
            continue
        is_correct = None
        marks_awarded = 0.0

        if q.question_type == "mcq" and item.selected_option and q.correct_option:
            is_correct = item.selected_option.upper() == q.correct_option.upper()
            marks_awarded = float(q.marks) if is_correct else 0.0
            if is_correct:
                correct_count += 1

        answer = Answer(
            id=str(uuid.uuid4()),
            session_id=session_id,
            question_id=item.question_id,
            selected_option=item.selected_option,
            essay_text=item.essay_text,
            marks_awarded=marks_awarded,
            is_correct=is_correct,
        )
        db.add(answer)
        answer_objs.append(answer)
        total_marks += q.marks
        earned_marks += marks_awarded

    session.submitted_at = datetime.now(timezone.utc)
    session.score = earned_marks
    session.status = "submitted"

    # Fetch exam title
    exam_result = await db.execute(select(Exam).where(Exam.id == session.exam_id))
    exam = exam_result.scalar_one()

    await db.commit()
    await db.refresh(session)

    return ExamResultSummary(
        session_id=session_id,
        exam_title=exam.title,
        score=earned_marks,
        total_marks=total_marks,
        percentage=round(earned_marks / total_marks * 100, 1) if total_marks else 0,
        correct_count=correct_count,
        total_questions=len(data.answers),
        answers=[
            from_answer(a) for a in answer_objs
        ],
    )


def from_answer(a: Answer):
    from app.schemas.exam import AnswerSchema
    return AnswerSchema(
        id=a.id,
        question_id=a.question_id,
        selected_option=a.selected_option,
        essay_text=a.essay_text,
        marks_awarded=a.marks_awarded,
        is_correct=a.is_correct,
    )
