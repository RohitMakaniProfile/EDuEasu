from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.deps import get_current_user
from bson import ObjectId

router = APIRouter()


@router.get("/")
async def list_courses(db=Depends(get_db)):
    courses = []
    async for course in db.courses.find({"status": "APPROVED"}).sort("created_at", -1):
        courses.append({
            "id": str(course["_id"]),
            "title": course["title"],
            "description": course["description"],
            "subject": course["subject"],
            "teacher_name": course["teacher_name"],
            "enrolled_count": len(course.get("enrolled_students", [])),
            "lecture_count": len(course.get("lectures", [])),
            "pdf_count": len(course.get("pdfs", [])),
            "quiz_count": len(course.get("quizzes", [])),
        })
    return courses


@router.get("/{course_id}")
async def get_course(
    course_id: str, db=Depends(get_db), user=Depends(get_current_user)
):
    try:
        course = await db.courses.find_one({"_id": ObjectId(course_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    uid = str(user["_id"])
    enrolled = course_id in user.get("enrolled_courses", [])
    is_teacher = course.get("teacher_id") == uid or user.get("role") == "ADMIN"

    data = {
        "id": str(course["_id"]),
        "title": course["title"],
        "description": course["description"],
        "subject": course["subject"],
        "teacher_name": course["teacher_name"],
        "teacher_id": course.get("teacher_id"),
        "status": course["status"],
        "is_enrolled": enrolled,
        "is_teacher": is_teacher,
        "enrolled_count": len(course.get("enrolled_students", [])),
        "created_at": course.get("created_at"),
    }

    if enrolled or is_teacher:
        data["lectures"] = course.get("lectures", [])
        data["pdfs"] = course.get("pdfs", [])
        data["quizzes"] = [
            {
                "id": q["id"],
                "title": q["title"],
                "question_count": len(q.get("questions", [])),
                "created_at": q.get("created_at"),
            }
            for q in course.get("quizzes", [])
        ]

    return data


@router.get("/{course_id}/quiz/{quiz_id}")
async def get_quiz(
    course_id: str, quiz_id: str, db=Depends(get_db), user=Depends(get_current_user)
):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled = course_id in user.get("enrolled_courses", [])
    is_teacher = course.get("teacher_id") == str(user["_id"]) or user.get("role") == "ADMIN"

    if not enrolled and not is_teacher:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    quiz = next((q for q in course.get("quizzes", []) if q["id"] == quiz_id), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Return questions without correct answers
    questions = [
        {
            "question": q["question"],
            "options": q["options"],
        }
        for q in quiz.get("questions", [])
    ]

    return {
        "id": quiz["id"],
        "title": quiz["title"],
        "questions": questions,
        "question_count": len(questions),
    }
