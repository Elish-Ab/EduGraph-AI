from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DB
from app.models.curriculum import CLO
from app.models.exam import Exam, Question
from app.models.user import StudentProfile
from app.services import ai_service, exam_service
from app.schemas.exam import VerifyExamRequest

router = APIRouter(prefix="/ai", tags=["ai"])


class VerifyExamAIRequest(BaseModel):
    exam_id: str


class TutorRequest(BaseModel):
    question: str
    gap_clo_ids: list[str] = []


@router.post("/verify-exam")
async def verify_exam_with_ai(
    body: VerifyExamAIRequest,
    current_user: CurrentUser,
    db: DB,
) -> dict:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teachers only")

    # Load exam with questions
    result = await db.execute(
        select(Exam).where(Exam.id == body.exam_id).options(selectinload(Exam.questions))
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your exam")

    # Load all CLOs for this exam's grade
    clo_result = await db.execute(
        select(CLO).join(CLO.topic).join(CLO.topic.property.mapper.class_.unit).join(
            CLO.topic.property.mapper.class_.unit.property.mapper.class_.subject
        )
    )
    # Simpler: load all CLOs
    clo_result = await db.execute(select(CLO))
    all_clos = [
        {"id": c.id, "code": c.code, "description": c.description}
        for c in clo_result.scalars()
    ]

    questions = [
        {
            "id": q.id,
            "text": q.text,
            "grade": exam.grade,
            "options": [o for o in [q.option_a, q.option_b, q.option_c, q.option_d] if o],
        }
        for q in exam.questions
    ]

    try:
        result = await ai_service.verify_exam_questions(questions, all_clos)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")

    return result


@router.post("/tutor/stream")
async def tutor_stream(
    body: TutorRequest,
    current_user: CurrentUser,
    db: DB,
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")

    grade = 11
    career = "general"
    if current_user.profile:
        grade = current_user.profile.grade or 11
        career = current_user.profile.career_interest or "general"

    async def event_stream():
        try:
            async for token in ai_service.stream_tutor_response(
                body.question, grade, career, body.gap_clo_ids
            ):
                yield f"data: {token}\n\n"
        except Exception as exc:
            yield f"data: [Error: {exc}]\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
