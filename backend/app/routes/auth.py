from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models.user import UserCreate, UserLogin, ForgotPassword, ResetPassword
from app.utils.security import (
    hash_password,
    verify_password,
    generate_password,
    create_access_token,
)
from app.services.email_service import send_welcome_email, send_password_reset_email
from datetime import datetime

router = APIRouter()


@router.post("/signup")
async def signup(data: UserCreate, db=Depends(get_db)):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate role
    allowed_roles = ["USER", "TEACHER"]
    role = data.role.upper() if data.role else "USER"
    if role not in allowed_roles:
        role = "USER"

    raw_password = generate_password()

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(raw_password),
        "role": role,
        "enrolled_courses": [],
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await db.users.insert_one(user_doc)
    send_welcome_email(data.name, data.email, raw_password)

    return {
        "message": "Account created successfully",
        "email": data.email,
        "temp_password": raw_password,
        "role": role,
        "note": "Save your password — it won't be shown again (dev mode: shown here)",
    }


@router.post("/login")
async def login(data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(
        {
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "id": str(user["_id"]),
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "enrolled_courses": user.get("enrolled_courses", []),
        },
    }


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")

    new_password = generate_password()
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password": hash_password(new_password)}},
    )

    send_password_reset_email(user["name"], data.email, new_password)

    return {
        "message": "Password reset successful",
        "new_password": new_password,
        "note": "Dev mode: new password shown here. In production only sent via email.",
    }


@router.post("/change-password")
async def change_password(data: ResetPassword, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password": hash_password(data.new_password)}},
    )
    return {"message": "Password changed successfully"}
