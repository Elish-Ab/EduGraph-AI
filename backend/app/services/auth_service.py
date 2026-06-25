import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import StudentProfile, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


async def register(data: RegisterRequest, db: AsyncSession) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        school_code=data.school_code,
    )
    db.add(user)

    if data.role == "student":
        profile = StudentProfile(id=str(uuid.uuid4()), user_id=user.id)
        db.add(profile)
        user.profile = profile

    await db.commit()
    await db.refresh(user)

    result = await db.execute(
        select(User).where(User.id == user.id).options(selectinload(User.profile))
    )
    user = result.scalar_one()
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


async def login(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(
        select(User).where(User.email == data.email).options(selectinload(User.profile))
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
