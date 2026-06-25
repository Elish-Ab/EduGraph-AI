from fastapi import APIRouter, HTTPException

from app.core.dependencies import CurrentUser, DB
from app.schemas.curriculum import SubjectSchema, SubjectSummary
from app.services import curriculum_service

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/subjects", response_model=list[SubjectSummary])
async def list_subjects(current_user: CurrentUser, db: DB, grade: int | None = None) -> list[SubjectSummary]:
    return await curriculum_service.list_subjects(grade, db)


@router.get("/subjects/{subject_id}", response_model=SubjectSchema)
async def get_subject(subject_id: str, current_user: CurrentUser, db: DB) -> SubjectSchema:
    subject = await curriculum_service.get_subject(subject_id, db)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject
