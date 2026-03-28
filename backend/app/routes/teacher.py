from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database import get_db
from app.deps import require_teacher, get_current_user
from app.models.course import CourseRequest, QuizCreate
from app.services.rag_service import add_document_to_course
from app.utils.pdf_parser import parse_pdf
from bson import ObjectId
from datetime import datetime
import os
import aiofiles

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(f"{UPLOAD_DIR}/lectures", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/pdfs", exist_ok=True)


@router.post("/request-course")
async def request_course(data: CourseRequest, db=Depends(get_db), teacher=Depends(get_current_user)):
    if teacher.get("role") not in ["TEACHER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only teachers can request courses")

    doc = {
        "title": data.title,
        "description": data.description,
        "subject": data.subject,
        "teacher_id": str(teacher["_id"]),
        "teacher_name": teacher["name"],
        "teacher_email": teacher["email"],
        "status": "PENDING",
        "enrolled_students": [],
        "lectures": [],
        "pdfs": [],
        "quizzes": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.courses.insert_one(doc)
    return {
        "message": "Course request submitted — awaiting admin approval",
        "course_id": str(result.inserted_id),
    }


@router.get("/my-courses")
async def get_my_courses(db=Depends(get_db), teacher=Depends(require_teacher)):
    courses = []
    async for course in db.courses.find({"teacher_id": str(teacher["_id"])}).sort("created_at", -1):
        course["id"] = str(course["_id"])
        del course["_id"]
        course["enrolled_count"] = len(course.get("enrolled_students", []))
        courses.append(course)
    return courses


@router.post("/upload-lecture/{course_id}")
async def upload_lecture(
    course_id: str,
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    db=Depends(get_db),
    teacher=Depends(require_teacher),
):
    query = {"_id": ObjectId(course_id), "status": "APPROVED"}
    if teacher.get("role") != "ADMIN":
        query["teacher_id"] = str(teacher["_id"])
    course = await db.courses.find_one(query)
    if not course:
        raise HTTPException(status_code=404, detail="Approved course not found")

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{ts}_{file.filename.replace(' ', '_')}"
    path = f"{UPLOAD_DIR}/lectures/{safe_name}"

    content = await file.read()
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    lecture = {
        "id": str(ObjectId()),
        "title": title,
        "description": description,
        "filename": safe_name,
        "original_name": file.filename,
        "url": f"/uploads/lectures/{safe_name}",
        "content_type": file.content_type,
        "size_bytes": len(content),
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$push": {"lectures": lecture}}
    )
    return {"message": "Lecture uploaded successfully", "lecture": lecture}


@router.post("/upload-pdf/{course_id}")
async def upload_pdf(
    course_id: str,
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    db=Depends(get_db),
    teacher=Depends(require_teacher),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    query = {"_id": ObjectId(course_id), "status": "APPROVED"}
    if teacher.get("role") != "ADMIN":
        query["teacher_id"] = str(teacher["_id"])
    course = await db.courses.find_one(query)
    if not course:
        raise HTTPException(status_code=404, detail="Approved course not found")

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{ts}_{file.filename.replace(' ', '_')}"
    path = f"{UPLOAD_DIR}/pdfs/{safe_name}"

    content = await file.read()
    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    # Parse and embed for RAG
    pdf_text = parse_pdf(path)
    doc_id = f"pdf_{course_id}_{ts}"
    indexed = False
    if pdf_text:
        add_document_to_course(
            course_id=course_id,
            text=pdf_text,
            doc_id=doc_id,
            metadata={"type": "pdf", "title": title, "filename": safe_name},
        )
        indexed = True

    pdf_doc = {
        "id": doc_id,
        "title": title,
        "description": description,
        "filename": safe_name,
        "original_name": file.filename,
        "url": f"/uploads/pdfs/{safe_name}",
        "indexed": indexed,
        "char_count": len(pdf_text),
        "size_bytes": len(content),
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$push": {"pdfs": pdf_doc}}
    )
    return {"message": "PDF uploaded and indexed for AI chat", "pdf": pdf_doc}


@router.post("/create-quiz/{course_id}")
async def create_quiz(
    course_id: str,
    quiz_data: QuizCreate,
    db=Depends(get_db),
    teacher=Depends(require_teacher),
):
    query = {"_id": ObjectId(course_id), "status": "APPROVED"}
    if teacher.get("role") != "ADMIN":
        query["teacher_id"] = str(teacher["_id"])
    course = await db.courses.find_one(query)
    if not course:
        raise HTTPException(status_code=404, detail="Approved course not found")

    quiz = {
        "id": str(ObjectId()),
        "title": quiz_data.title,
        "questions": [q.dict() for q in quiz_data.questions],
        "question_count": len(quiz_data.questions),
        "created_at": datetime.utcnow().isoformat(),
    }

    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$push": {"quizzes": quiz}}
    )
    return {"message": "Quiz created successfully", "quiz": quiz}


@router.delete("/delete-lecture/{course_id}/{lecture_id}")
async def delete_lecture(
    course_id: str, lecture_id: str, db=Depends(get_db), teacher=Depends(require_teacher)
):
    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$pull": {"lectures": {"id": lecture_id}}}
    )
    return {"message": "Lecture deleted"}


@router.delete("/delete-pdf/{course_id}/{pdf_id}")
async def delete_pdf(
    course_id: str, pdf_id: str, db=Depends(get_db), teacher=Depends(require_teacher)
):
    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$pull": {"pdfs": {"id": pdf_id}}}
    )
    return {"message": "PDF deleted"}


@router.delete("/delete-quiz/{course_id}/{quiz_id}")
async def delete_quiz(
    course_id: str, quiz_id: str, db=Depends(get_db), teacher=Depends(require_teacher)
):
    await db.courses.update_one(
        {"_id": ObjectId(course_id)}, {"$pull": {"quizzes": {"id": quiz_id}}}
    )
    return {"message": "Quiz deleted"}
