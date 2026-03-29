"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Clock, CheckCircle, XCircle, Trash2, Shield, GraduationCap } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getUser, User } from "@/lib/auth";
import { api } from "@/lib/api";

interface DashData {
  stats: { total_users: number; total_teachers: number; total_courses: number; pending_requests: number; total_enrollments: number };
  recent_users: UserRow[];
}
interface UserRow { id: string; name: string; email: string; role: string; created_at: string }
interface PendingCourse { id: string; title: string; subject: string; description: string; teacher_name: string; created_at: string }
interface CourseRow { id: string; title: string; subject: string; teacher_name: string; status: string; enrolled_count: number }

type Tab = "overview" | "requests" | "users" | "courses";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [dash, setDash] = useState<DashData | null>(null);
  const [pending, setPending] = useState<PendingCourse[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allCourses, setAllCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/auth/login"); return; }
    if (u.role !== "ADMIN") { router.push(`/dashboard/${u.role === "TEACHER" ? "teacher" : "student"}`); return; }
    setUser(u);
    loadDash();
  }, []);

  useEffect(() => {
    if (tab === "requests") loadPending();
    else if (tab === "users") loadUsers();
    else if (tab === "courses") loadCourses();
  }, [tab]);

  const loadDash = async () => { const { data } = await api.get("/api/admin/dashboard"); setDash(data); };
  const loadPending = async () => { setLoading(true); const { data } = await api.get("/api/admin/pending-requests"); setPending(data); setLoading(false); };
  const loadUsers = async () => { setLoading(true); const { data } = await api.get("/api/admin/all-users"); setAllUsers(data); setLoading(false); };
  const loadCourses = async () => { setLoading(true); const { data } = await api.get("/api/admin/all-courses"); setAllCourses(data); setLoading(false); };

  const approve = async (id: string) => { await api.post(`/api/admin/approve-course/${id}`); showMsg("Course approved!"); loadPending(); loadDash(); };
  const reject = async (id: string) => { await api.post(`/api/admin/reject-course/${id}`); showMsg("Course rejected."); loadPending(); };
  const deleteUser = async (id: string) => { if (!confirm("Delete this user?")) return; await api.delete(`/api/admin/delete-user/${id}`); showMsg("User deleted."); loadUsers(); };
  const deleteCourse = async (id: string) => { if (!confirm("Delete this course?")) return; await api.delete(`/api/admin/delete-course/${id}`); showMsg("Course deleted."); loadCourses(); };
  const promoteTeacher = async (id: string) => { await api.post(`/api/admin/promote-teacher/${id}`); showMsg("Promoted to Teacher!"); loadUsers(); };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Shield className="w-4 h-4" /> },
    { key: "requests", label: "Pending Requests", icon: <Clock className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "courses", label: "Courses", icon: <BookOpen className="w-4 h-4" /> },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>
      <Sidebar user={user} />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-3xl font-black mb-1">Admin Dashboard</h1>
        <p className="text-gray-400 mb-6">Platform management</p>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "#1a1a2e" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? "#6366f1" : "transparent",
                color: tab === t.key ? "white" : "#9ca3af",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && dash && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Students", value: dash.stats.total_users, color: "text-indigo-400" },
                { label: "Teachers", value: dash.stats.total_teachers, color: "text-emerald-400" },
                { label: "Courses", value: dash.stats.total_courses, color: "text-purple-400" },
                { label: "Pending", value: dash.stats.pending_requests, color: "text-yellow-400" },
                { label: "Enrollments", value: dash.stats.total_enrollments, color: "text-pink-400" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                  <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <h3 className="font-bold mb-4">Recent Signups</h3>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a4a" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#16213e" }}>
                  <tr>
                    {["Name", "Email", "Role", "Joined"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dash.recent_users.map((u, i) => (
                    <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e" }}>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === "ADMIN" ? "bg-red-400/10 text-red-400" : u.role === "TEACHER" ? "bg-indigo-400/10 text-indigo-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PENDING REQUESTS */}
        {tab === "requests" && (
          loading ? <Spinner /> : pending.length === 0 ? (
            <EmptyState icon={<Clock className="w-10 h-10" />} text="No pending requests" />
          ) : (
            <div className="space-y-4">
              {pending.map(c => (
                <div key={c.id} className="rounded-2xl p-5 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{c.title}</h3>
                      <p className="text-xs text-indigo-400 mb-1">{c.subject}</p>
                      <p className="text-gray-400 text-sm mb-2">{c.description}</p>
                      <p className="text-xs text-gray-500">by <span className="text-gray-300">{c.teacher_name}</span> · {c.created_at?.slice(0, 10)}</p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button onClick={() => approve(c.id)} className="flex items-center gap-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition-all">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => reject(c.id)} className="flex items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* USERS */}
        {tab === "users" && (
          loading ? <Spinner /> : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a4a" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#16213e" }}>
                  <tr>
                    {["Name", "Email", "Role", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, i) => (
                    <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e" }}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === "ADMIN" ? "bg-red-400/10 text-red-400" : u.role === "TEACHER" ? "bg-indigo-400/10 text-indigo-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {u.role === "USER" && (
                            <button onClick={() => promoteTeacher(u.id)} className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg flex items-center gap-1 transition-all">
                              <GraduationCap className="w-3 h-3" /> Make Teacher
                            </button>
                          )}
                          {u.role !== "ADMIN" && (
                            <button onClick={() => deleteUser(u.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg flex items-center gap-1 transition-all">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* COURSES */}
        {tab === "courses" && (
          loading ? <Spinner /> : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a4a" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#16213e" }}>
                  <tr>
                    {["Title", "Subject", "Teacher", "Status", "Students", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((c, i) => (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e" }}>
                      <td className="px-4 py-3 font-medium max-w-[150px] truncate">{c.title}</td>
                      <td className="px-4 py-3 text-gray-400">{c.subject}</td>
                      <td className="px-4 py-3 text-gray-400">{c.teacher_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === "APPROVED" ? "bg-emerald-400/10 text-emerald-400" : c.status === "PENDING" ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{c.enrolled_count}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteCourse(c.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg flex items-center gap-1 transition-all">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-2xl p-12 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
      <div className="text-gray-600 flex justify-center mb-3">{icon}</div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
}
