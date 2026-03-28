from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.deps import require_admin
from app.services.rag_service import delete_course_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()


def _serialize(doc):
    if not doc:
        return doc
    result = {}
    for k, v in doc.items():
        if k == "_id":
            result["id"] = str(v)
        elif k == "password":
            continue
        elif isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, list):
            result[k] = [str(i) if isinstance(i, ObjectId) else i for i in v]
        else:
            result[k] = v
    return result


@router.get("/dashboard")
async def admin_dashboard(db=Depends(get_db), _=Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "USER"})
    total_teachers = await db.users.count_documents({"role": "TEACHER"})
    total_courses = await db.courses.count_documents({"status": "APPROVED"})
    pending = await db.courses.count_documents({"status": "PENDING"})
    total_enrollments = 0

    async for course in db.courses.find({"status": "APPROVED"}, {"enrolled_students": 1}):
        total_enrollments += len(course.get("enrolled_students", []))

    recent_users = []
    async for user in db.users.find().sort("created_at", -1).limit(5):
        recent_users.append(_serialize(user))

    return {
        "stats": {
            "total_users": total_users,
            "total_teachers": total_teachers,
            "total_courses": total_courses,
            "pending_requests": pending,
            "total_enrollments": total_enrollments,
        },
        "recent_users": recent_users,
    }


@router.get("/pending-requests")
async def get_pending_requests(db=Depends(get_db), _=Depends(require_admin)):
    reqs = []
    async for course in db.courses.find({"status": "PENDING"}).sort("created_at", -1):
        reqs.append(_serialize(course))
    return reqs


@router.post("/approve-course/{course_id}")
async def approve_course(course_id: str, db=Depends(get_db), _=Depends(require_admin)):
    result = await db.courses.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": {"status": "APPROVED", "approved_at": datetime.utcnow().isoformat()}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course approved"}


@router.post("/reject-course/{course_id}")
async def reject_course(course_id: str, db=Depends(get_db), _=Depends(require_admin)):
    result = await db.courses.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": {"status": "REJECTED", "rejected_at": datetime.utcnow().isoformat()}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course rejected"}


@router.delete("/delete-user/{user_id}")
async def delete_user(user_id: str, db=Depends(get_db), admin=Depends(require_admin)):
    if user_id == admin.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.delete("/delete-course/{course_id}")
async def delete_course(course_id: str, db=Depends(get_db), _=Depends(require_admin)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    delete_course_collection(course_id)
    await db.users.update_many(
        {"enrolled_courses": course_id}, {"$pull": {"enrolled_courses": course_id}}
    )
    await db.courses.delete_one({"_id": ObjectId(course_id)})
    return {"message": "Course deleted"}


@router.get("/all-users")
async def get_all_users(db=Depends(get_db), _=Depends(require_admin)):
    users = []
    async for user in db.users.find().sort("created_at", -1):
        users.append(_serialize(user))
    return users


@router.get("/all-courses")
async def get_all_courses(db=Depends(get_db), _=Depends(require_admin)):
    courses = []
    async for course in db.courses.find().sort("created_at", -1):
        course["id"] = str(course["_id"])
        del course["_id"]
        course["enrolled_count"] = len(course.get("enrolled_students", []))
        courses.append(course)
    return courses


@router.post("/promote-teacher/{user_id}")
async def promote_to_teacher(user_id: str, db=Depends(get_db), _=Depends(require_admin)):
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"role": "TEACHER"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User promoted to Teacher"}


@router.post("/promote-admin/{user_id}")
async def promote_to_admin(user_id: str, db=Depends(get_db), _=Depends(require_admin)):
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"role": "ADMIN"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User promoted to Admin"}
