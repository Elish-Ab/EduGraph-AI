from fastapi import APIRouter, HTTPException

from app.core.dependencies import CurrentUser, DB
from app.services import plan_service

router = APIRouter(prefix="/study-plan", tags=["study-plan"])


@router.get("/my")
async def get_my_plan(current_user: CurrentUser, db: DB):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    return await plan_service.get_plan(current_user.id, db)


@router.post("/my/generate")
async def generate_my_plan(current_user: CurrentUser, db: DB):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    career = current_user.profile.career_interest if current_user.profile else None
    return await plan_service.generate_plan(current_user.id, career, db)


@router.patch("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, current_user: CurrentUser, db: DB):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    return await plan_service.mark_task_complete(task_id, current_user.id, db)
