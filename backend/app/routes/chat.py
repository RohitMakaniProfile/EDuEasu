from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.deps import get_current_user
from app.services.rag_service import chat_with_course
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/{course_id}")
async def chat(
    course_id: str,
    req: ChatRequest,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    uid = str(user["_id"])
    enrolled = course_id in user.get("enrolled_courses", [])
    role = user.get("role", "USER")

    if not enrolled and role not in ["TEACHER", "ADMIN"]:
        # Check if teacher of this specific course
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
        if not course or course.get("teacher_id") != uid:
            raise HTTPException(status_code=403, detail="Enroll in this course to use the AI tutor")

    history = [{"role": m.role, "content": m.content} for m in req.history]

    answer = await chat_with_course(
        course_id=course_id,
        query=req.message,
        chat_history=history,
    )

    return {"response": answer, "course_id": course_id}
