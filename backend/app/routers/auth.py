from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DB
from app.schemas.auth import (
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: DB) -> TokenResponse:
    return await auth_service.register(data, db)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: DB) -> TokenResponse:
    return await auth_service.login(data, db)


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(data: ProfileUpdateRequest, current_user: CurrentUser, db: DB) -> UserResponse:
    from app.models.user import StudentProfile
    from sqlalchemy import select

    if current_user.role != "student":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only students have a profile")

    profile = current_user.profile
    if profile is None:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    if data.grade is not None:
        profile.grade = data.grade
    if data.career_interest is not None:
        profile.career_interest = data.career_interest
    if data.target_score is not None:
        profile.target_score = data.target_score

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
