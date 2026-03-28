# EduEasy — AI-Powered Ed-Tech Platform

A full-stack ed-tech platform with AI chatbot per course, role-based access, quizzes, and PDF indexing.

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install "pydantic[email]"
python create_admin.py         # Creates admin account
uvicorn main:app --reload --port 8001
# API: http://localhost:8001
# Docs: http://localhost:8001/docs
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3001
```

## Default Admin Account

| Email | Password |
|-------|----------|
| admin@learnix.com | Admin@123 |

## Features

- **Auth** — Auto-generated passwords, JWT, forgot-password flow
- **Student** — Browse & enroll in courses, view lectures/PDFs, take quizzes, AI chat
- **Teacher** — Request courses (admin approval required), upload lectures/PDFs, create quizzes
- **Admin** — Approve/reject course requests, manage users & courses, promote roles
- **AI Chatbot** — RAG chatbot per course using course PDFs as knowledge base
- **PDF Indexing** — Uploaded PDFs are auto-parsed and embedded into vector DB

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.14 |
| Database | MongoDB Atlas (motor async) |
| Auth | JWT (python-jose), bcrypt |
| AI/LLM | Groq API — llama-3.3-70b-versatile |
| Vector DB | ChromaDB (local) |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| PDF Parsing | PyMuPDF |

## Roles

| Role | Permissions |
|------|------------|
| Student | Enroll courses, lectures, PDFs, quizzes, AI chat |
| Teacher | Request courses, upload content, create quizzes |
| Admin | Full access — approve courses, manage users |
