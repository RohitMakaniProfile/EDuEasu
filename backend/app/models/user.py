from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    USER = "USER"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "USER"  # USER or TEACHER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    enrolled_courses: List[str] = []
