from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["student", "teacher", "admin"] = "student"
    school_code: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class StudentProfileResponse(BaseModel):
    grade: int | None
    career_interest: str | None
    current_avg: int | None
    target_score: int | None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    school_code: str | None
    profile: StudentProfileResponse | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdateRequest(BaseModel):
    grade: int | None = None
    career_interest: str | None = None
    target_score: int | None = None
