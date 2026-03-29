"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Users, GraduationCap, FileText, Trophy, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getUser, User } from "@/lib/auth";
import { api, getErrorMessage } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher_name: string;
  enrolled_count: number;
  lecture_count: number;
  pdf_count: number;
  quiz_count: number;
  is_enrolled?: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filtered, setFiltered] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/auth/login"); return; }
    setUser(u);
    fetchCourses(u.role);
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.teacher_name.toLowerCase().includes(q)
    ));
  }, [search, courses]);

  const fetchCourses = async (role: string) => {
    try {
      const endpoint = role === "USER" ? "/api/student/available-courses" : "/api/courses/";
      const { data } = await api.get(endpoint);
      setCourses(data);
      setFiltered(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const enroll = async (courseId: string) => {
    if (!user) return;
    setEnrolling(courseId);
    try {
      const { data } = await api.post(`/api/student/enroll/${courseId}`);
      setMsg(data.message);
      setTimeout(() => setMsg(""), 3000);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
    } catch (err: unknown) {
      setMsg(getErrorMessage(err, "Failed to enroll"));
      setTimeout(() => setMsg(""), 3000);
    } finally { setEnrolling(null); }
  };

  if (!user) return null;

  const subjects = [...new Set(courses.map(c => c.subject))];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>
      <Sidebar user={user} />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-3xl font-black mb-1">Browse Courses</h1>
        <p className="text-gray-400 mb-6">Discover and enroll in courses</p>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            {msg}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, subjects, teachers..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none"
            style={{ backgroundColor: "#1a1a2e", border: "1px solid #2a2a4a" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
          />
        </div>

        {/* Subject pills */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setSearch("")} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${!search ? "bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"}`}>
              All
            </button>
            {subjects.map(s => (
              <button key={s} onClick={() => setSearch(s)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${search === s ? "bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No courses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((course) => (
              <div key={course.id} className="card-hover rounded-2xl p-5 border flex flex-col" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                  {course.is_enrolled && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle className="w-3 h-3" /> Enrolled
                    </span>
                  )}
                </div>
                <h3 className="font-bold mb-1">{course.title}</h3>
                <p className="text-indigo-400 text-xs mb-2">{course.subject}</p>
                <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">{course.description}</p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolled_count}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lecture_count}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{course.pdf_count}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{course.quiz_count}</span>
                </div>

                <p className="text-xs text-gray-500 mb-4">by {course.teacher_name}</p>

                <div className="flex gap-2">
                  {course.is_enrolled ? (
                    <Link href={`/courses/${course.id}`} className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-semibold text-center transition-all">
                      Open Course →
                    </Link>
                  ) : (
                    <>
                      <Link href={`/courses/${course.id}`} className="flex-1 py-2 border text-gray-400 hover:text-white rounded-xl text-sm font-semibold text-center transition-all" style={{ borderColor: "#2a2a4a" }}>
                        Preview
                      </Link>
                      {user.role === "USER" && (
                        <button
                          onClick={() => enroll(course.id)}
                          disabled={enrolling === course.id}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold transition-all"
                        >
                          {enrolling === course.id ? "..." : "Enroll"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
