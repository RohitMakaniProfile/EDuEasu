from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class CourseStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CourseRequest(BaseModel):
    title: str
    description: str
    subject: str


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # 0-based index
    explanation: Optional[str] = None


class QuizCreate(BaseModel):
    title: str
    questions: List[QuizQuestion]


class QuizSubmit(BaseModel):
    answers: List[int]  # list of chosen option indices
