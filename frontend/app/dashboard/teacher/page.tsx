"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, Clock, CheckCircle, XCircle, Plus, Upload, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getUser, User } from "@/lib/auth";
import { api, getErrorMessage } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  enrolled_count: number;
  lectures: unknown[];
  pdfs: unknown[];
  quizzes: unknown[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/auth/login"); return; }
    if (u.role === "USER") { router.push("/dashboard/student"); return; }
    if (u.role === "ADMIN") { router.push("/dashboard/admin"); return; }
    setUser(u);
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get("/api/teacher/my-courses");
      setCourses(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const requestCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/teacher/request-course", form);
      setMsg("Course request submitted! Awaiting admin approval.");
      setShowModal(false);
      setForm({ title: "", description: "", subject: "" });
      fetchCourses();
    } catch (err: unknown) {
      setMsg(getErrorMessage(err, "Failed to submit request."));
    } finally { setSubmitting(false); }
  };

  const approved = courses.filter(c => c.status === "APPROVED").length;
  const pending = courses.filter(c => c.status === "PENDING").length;
  const totalStudents = courses.reduce((a, c) => a + c.enrolled_count, 0);

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>
      <Sidebar user={user} />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">
              Teacher Dashboard
            </h1>
            <p className="text-gray-400">Manage your courses and content</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" /> Request Course
          </button>
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm border ${msg.includes("Failed") ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"}`}>
            {msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Approved Courses", value: approved, icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, color: "from-emerald-500/20 to-teal-500/20" },
            { label: "Pending Approval", value: pending, icon: <Clock className="w-5 h-5 text-yellow-400" />, color: "from-yellow-500/20 to-orange-500/20" },
            { label: "Total Students", value: totalStudents, icon: <Users className="w-5 h-5 text-indigo-400" />, color: "from-indigo-500/20 to-purple-500/20" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 bg-gradient-to-br ${s.color} border border-white/5`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">{s.label}</p>
                {s.icon}
              </div>
              <p className="text-3xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Courses */}
        <h2 className="text-xl font-bold mb-5">My Courses</h2>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl p-12 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No courses yet</h3>
            <p className="text-gray-600 text-sm mb-5">Request a course to get started</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all text-sm">
              <Plus className="w-4 h-4" /> Request Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course) => (
              <div key={course.id} className="rounded-2xl p-5 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{course.title}</h3>
                    <p className="text-xs text-gray-500">{course.subject}</p>
                  </div>
                  <span className={`ml-3 shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${
                    course.status === "APPROVED" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                    : course.status === "PENDING" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20"
                  }`}>
                    {course.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span><Users className="w-3 h-3 inline mr-1" />{course.enrolled_count} students</span>
                  <span><BookOpen className="w-3 h-3 inline mr-1" />{Array.isArray(course.lectures) ? course.lectures.length : 0} lectures</span>
                  <span>{Array.isArray(course.pdfs) ? course.pdfs.length : 0} PDFs</span>
                </div>
                {course.status === "APPROVED" && (
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-semibold transition-all"
                  >
                    <Upload className="w-4 h-4" /> Manage Content
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Request Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Request New Course</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={requestCourse} className="space-y-4">
              {[
                { key: "title", label: "Course Title", placeholder: "e.g. Introduction to Python" },
                { key: "subject", label: "Subject", placeholder: "e.g. Computer Science" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required
                    placeholder={f.placeholder}
                    className="w-full rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none text-sm"
                    style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe what students will learn..."
                  className="w-full rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none text-sm resize-none"
                  style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-600 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold transition-all">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
