from fastapi import APIRouter, HTTPException

from app.core.dependencies import CurrentUser, DB
from app.services import gap_service

router = APIRouter(prefix="/gaps", tags=["gaps"])


@router.get("/my")
async def my_gaps(current_user: CurrentUser, db: DB) -> list[dict]:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    career = current_user.profile.career_interest if current_user.profile else None
    return await gap_service.analyze_gaps(current_user.id, career, db)


@router.get("/student/{student_id}")
async def student_gaps(student_id: str, current_user: CurrentUser, db: DB) -> list[dict]:
    if current_user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teachers/admin only")
    return await gap_service.analyze_gaps(student_id, None, db)
