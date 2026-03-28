from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.deps import get_current_user
from app.models.course import QuizSubmit
from bson import ObjectId

router = APIRouter()


@router.get("/available-courses")
async def get_available_courses(db=Depends(get_db), user=Depends(get_current_user)):
    enrolled = user.get("enrolled_courses", [])
    courses = []
    async for course in db.courses.find({"status": "APPROVED"}).sort("created_at", -1):
        cid = str(course["_id"])
        courses.append({
            "id": cid,
            "title": course["title"],
            "description": course["description"],
            "subject": course["subject"],
            "teacher_name": course["teacher_name"],
            "enrolled_count": len(course.get("enrolled_students", [])),
            "lecture_count": len(course.get("lectures", [])),
            "pdf_count": len(course.get("pdfs", [])),
            "quiz_count": len(course.get("quizzes", [])),
            "is_enrolled": cid in enrolled,
        })
    return courses


@router.get("/my-courses")
async def get_my_courses(db=Depends(get_db), user=Depends(get_current_user)):
    enrolled_ids = user.get("enrolled_courses", [])
    courses = []
    for cid in enrolled_ids:
        try:
            course = await db.courses.find_one({"_id": ObjectId(cid)})
            if course:
                courses.append({
                    "id": str(course["_id"]),
                    "title": course["title"],
                    "description": course["description"],
                    "subject": course["subject"],
                    "teacher_name": course["teacher_name"],
                    "lecture_count": len(course.get("lectures", [])),
                    "pdf_count": len(course.get("pdfs", [])),
                    "quiz_count": len(course.get("quizzes", [])),
                })
        except Exception:
            continue
    return courses


@router.post("/enroll/{course_id}")
async def enroll(course_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    uid = str(user["_id"])
    enrolled = user.get("enrolled_courses", [])
    if course_id in enrolled:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    course = await db.courses.find_one({"_id": ObjectId(course_id), "status": "APPROVED"})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$addToSet": {"enrolled_students": uid}}
    )
    await db.users.update_one(
        {"_id": user["_id"]}, {"$addToSet": {"enrolled_courses": course_id}}
    )
    return {"message": f"Successfully enrolled in \"{course['title']}\""}


@router.post("/unenroll/{course_id}")
async def unenroll(course_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    uid = str(user["_id"])
    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$pull": {"enrolled_students": uid}}
    )
    await db.users.update_one(
        {"_id": user["_id"]}, {"$pull": {"enrolled_courses": course_id}}
    )
    return {"message": "Unenrolled successfully"}


@router.post("/submit-quiz/{course_id}/{quiz_id}")
async def submit_quiz(
    course_id: str,
    quiz_id: str,
    submission: QuizSubmit,
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    # Verify enrollment
    if course_id not in user.get("enrolled_courses", []) and user.get("role") not in ["TEACHER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    quiz = next((q for q in course.get("quizzes", []) if q["id"] == quiz_id), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    answers = submission.answers
    score = 0
    results = []

    for i, question in enumerate(quiz["questions"]):
        chosen = answers[i] if i < len(answers) else -1
        correct = question["correct_answer"] == chosen
        if correct:
            score += 1
        results.append({
            "question": question["question"],
            "options": question["options"],
            "your_answer": chosen,
            "correct_answer": question["correct_answer"],
            "correct": correct,
            "explanation": question.get("explanation", ""),
        })

    total = len(quiz["questions"])
    pct = round((score / total * 100) if total > 0 else 0, 1)
    grade = "A" if pct >= 90 else "B" if pct >= 80 else "C" if pct >= 70 else "D" if pct >= 60 else "F"

    return {
        "quiz_title": quiz["title"],
        "score": score,
        "total": total,
        "percentage": pct,
        "grade": grade,
        "results": results,
    }
