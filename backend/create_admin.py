"""
Run once to seed the first admin account.
Usage: python create_admin.py
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGODB_URI = "mongodb+srv://cm:cm@cluster0.z6bkq2a.mongodb.net/learnix"

ADMIN_EMAIL = "admin@learnix.com"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME = "Learnix Admin"


async def main():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.learnix

    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"✅ Admin already exists: {ADMIN_EMAIL}")
        client.close()
        return

    admin_doc = {
        "name": ADMIN_NAME,
        "email": ADMIN_EMAIL,
        "password": bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode(),
        "role": "ADMIN",
        "enrolled_courses": [],
        "created_at": datetime.utcnow().isoformat(),
    }

    await db.users.insert_one(admin_doc)
    client.close()

    print("✅ Admin account created!")
    print(f"   Email:    {ADMIN_EMAIL}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print("\nYou can now log in at http://localhost:3000/auth/login")


if __name__ == "__main__":
    asyncio.run(main())
