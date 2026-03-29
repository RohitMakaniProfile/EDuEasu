"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, FileText, Trophy, MessageSquare, Users, Upload, Plus,
  Download, Play, CheckCircle, X, Brain, ArrowRight, Trash2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getUser, User } from "@/lib/auth";
import { api, getErrorMessage } from "@/lib/api";

interface Lecture { id: string; title: string; description: string; url: string; original_name: string; content_type: string; uploaded_at: string }
interface PDF { id: string; title: string; description: string; url: string; original_name: string; indexed: boolean; uploaded_at: string }
interface Quiz { id: string; title: string; question_count: number; created_at: string }
interface CourseDetail {
  id: string; title: string; description: string; subject: string;
  teacher_name: string; is_enrolled: boolean; is_teacher: boolean;
  enrolled_count: number; status: string;
  lectures?: Lecture[]; pdfs?: PDF[]; quizzes?: Quiz[];
}

type Tab = "overview" | "lectures" | "pdfs" | "quizzes" | "chat";

interface ChatMsg { role: "user" | "assistant"; content: string }

export default function CoursePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Upload state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<"lecture" | "pdf" | null>(null);

  // Quiz create state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" }
  ]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/auth/login"); return; }
    setUser(u);
    fetchCourse();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/api/courses/${id}`);
      setCourse(data);
    } catch {
      router.push("/courses");
    } finally { setLoading(false); }
  };

  const enroll = async () => {
    try {
      const { data } = await api.post(`/api/student/enroll/${id}`);
      showMsg(data.message);
      fetchCourse();
    } catch (err: unknown) {
      showMsg(getErrorMessage(err, "Failed"));
    }
  };

  const uploadContent = async (type: "lecture" | "pdf") => {
    if (!uploadFile || !uploadTitle) return;
    setUploading(true);
    const form = new FormData();
    form.append("title", uploadTitle);
    form.append("description", uploadDesc);
    form.append("file", uploadFile);
    try {
      await api.post(`/api/teacher/upload-${type}/${id}`, form, {
        headers: { "Content-Type": undefined },
      });
      showMsg(`${type === "lecture" ? "Lecture" : "PDF"} uploaded successfully!`);
      setShowUploadModal(null);
      setUploadTitle(""); setUploadDesc(""); setUploadFile(null);
      fetchCourse();
    } catch (err: unknown) {
      showMsg(getErrorMessage(err, "Upload failed"));
    } finally { setUploading(false); }
  };

  const createQuiz = async () => {
    if (!quizTitle) return;
    try {
      await api.post(`/api/teacher/create-quiz/${id}`, { title: quizTitle, questions: quizQuestions });
      showMsg("Quiz created!");
      setShowQuizModal(false);
      setQuizTitle(""); setQuizQuestions([{ question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" }]);
      fetchCourse();
    } catch (err: unknown) {
      showMsg(getErrorMessage(err, "Failed"));
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post(`/api/chat/${id}`, { message: chatInput, history });
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally { setChatLoading(false); }
  };

  const deleteLecture = async (lectureId: string) => {
    await api.delete(`/api/teacher/delete-lecture/${id}/${lectureId}`);
    showMsg("Deleted"); fetchCourse();
  };

  const deletePdf = async (pdfId: string) => {
    await api.delete(`/api/teacher/delete-pdf/${id}/${pdfId}`);
    showMsg("Deleted"); fetchCourse();
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0f0f1a" }}>
        <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!course) return null;

  const hasAccess = course.is_enrolled || course.is_teacher;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "overview", label: "Overview", icon: <BookOpen className="w-4 h-4" /> },
    ...(hasAccess ? [
      { key: "lectures" as Tab, label: "Lectures", icon: <Play className="w-4 h-4" />, count: course.lectures?.length },
      { key: "pdfs" as Tab, label: "PDFs", icon: <FileText className="w-4 h-4" />, count: course.pdfs?.length },
      { key: "quizzes" as Tab, label: "Quizzes", icon: <Trophy className="w-4 h-4" />, count: course.quizzes?.length },
      { key: "chat" as Tab, label: "AI Chat", icon: <Brain className="w-4 h-4" /> },
    ] : []),
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>
      <Sidebar user={user} />
      <main className="ml-64 flex-1 p-8">
        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm fixed top-4 right-4 z-50 shadow-lg">
            {msg}
          </div>
        )}

        {/* Course Header */}
        <div className="rounded-2xl p-6 border mb-6" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-indigo-400 font-semibold">{course.subject}</span>
              </div>
              <h1 className="text-2xl font-black mb-2">{course.title}</h1>
              <p className="text-gray-400 text-sm mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolled_count} students</span>
                <span>by <span className="text-gray-300">{course.teacher_name}</span></span>
              </div>
            </div>
            <div className="shrink-0">
              {!hasAccess && user.role === "USER" ? (
                <button onClick={enroll} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2">
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  {course.is_teacher ? "Your Course" : "Enrolled"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "#1a1a2e" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative"
              style={{
                backgroundColor: tab === t.key ? "#6366f1" : "transparent",
                color: tab === t.key ? "white" : "#9ca3af",
              }}
            >
              {t.icon} {t.label}
              {t.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: tab === t.key ? "rgba(255,255,255,0.2)" : "#2a2a4a" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Lectures", value: course.lectures?.length ?? 0, icon: <Play className="w-5 h-5 text-indigo-400" /> },
                { label: "PDFs", value: course.pdfs?.length ?? 0, icon: <FileText className="w-5 h-5 text-pink-400" /> },
                { label: "Quizzes", value: course.quizzes?.length ?? 0, icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 border text-center" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                  <div className="flex justify-center mb-2">{s.icon}</div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-gray-500 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
            {!hasAccess && user.role === "USER" && (
              <div className="rounded-2xl p-6 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
                <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">Enroll to access lectures, PDFs, quizzes, and AI chat</p>
                <button onClick={enroll} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all">
                  Enroll Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* LECTURES TAB */}
        {tab === "lectures" && hasAccess && (
          <div>
            {course.is_teacher && (
              <button onClick={() => setShowUploadModal("lecture")} className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-all">
                <Upload className="w-4 h-4" /> Upload Lecture
              </button>
            )}
            {(course.lectures?.length ?? 0) === 0 ? (
              <div className="rounded-2xl p-12 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
                <Play className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No lectures yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.lectures!.map((lec, i) => (
                  <div key={lec.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center shrink-0 text-indigo-400 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{lec.title}</p>
                      {lec.description && <p className="text-xs text-gray-500 truncate">{lec.description}</p>}
                      <p className="text-xs text-gray-600 mt-0.5">{lec.original_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={lec.url} target="_blank" rel="noopener noreferrer"
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </a>
                      {course.is_teacher && (
                        <button onClick={() => deleteLecture(lec.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDFS TAB */}
        {tab === "pdfs" && hasAccess && (
          <div>
            {course.is_teacher && (
              <button onClick={() => setShowUploadModal("pdf")} className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-all">
                <Upload className="w-4 h-4" /> Upload PDF
              </button>
            )}
            {(course.pdfs?.length ?? 0) === 0 ? (
              <div className="rounded-2xl p-12 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No PDFs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.pdfs!.map((pdf) => (
                  <div key={pdf.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                    <div className="w-10 h-10 bg-pink-600/20 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{pdf.title}</p>
                      {pdf.description && <p className="text-xs text-gray-500 truncate">{pdf.description}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-600">{pdf.original_name}</p>
                        {pdf.indexed && (
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Brain className="w-2.5 h-2.5" /> AI indexed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={pdf.url} target="_blank" rel="noopener noreferrer"
                        className="p-2 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 text-pink-400 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </a>
                      {course.is_teacher && (
                        <button onClick={() => deletePdf(pdf.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUIZZES TAB */}
        {tab === "quizzes" && hasAccess && (
          <div>
            {course.is_teacher && (
              <button onClick={() => setShowQuizModal(true)} className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> Create Quiz
              </button>
            )}
            {(course.quizzes?.length ?? 0) === 0 ? (
              <div className="rounded-2xl p-12 text-center border border-dashed" style={{ borderColor: "#2a2a4a" }}>
                <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No quizzes yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.quizzes!.map((quiz) => (
                  <div key={quiz.id} className="rounded-2xl p-5 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    <h3 className="font-bold mb-1">{quiz.title}</h3>
                    <p className="text-gray-500 text-sm mb-4">{quiz.question_count} questions</p>
                    <Link
                      href={`/courses/${id}/quiz/${quiz.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-semibold transition-all"
                    >
                      Take Quiz <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === "chat" && hasAccess && (
          <div className="flex flex-col h-[calc(100vh-320px)] min-h-96">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "#1a1a2e", border: "1px solid #2a2a4a" }}>
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-semibold">AI Tutor — {course.title}</p>
                <p className="text-xs text-gray-500">Powered by Groq · Course-specific RAG</p>
              </div>
              {chatMessages.length > 0 && (
                <button onClick={() => setChatMessages([])} className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ask me anything about this course!</p>
                  <p className="text-xs mt-1 opacity-60">I&apos;m trained on the course PDFs and materials</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${m.role === "user" ? "bg-indigo-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                    {m.role === "user" ? user.name.charAt(0).toUpperCase() : <Brain className="w-4 h-4 text-white" />}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    style={{
                      backgroundColor: m.role === "user" ? "#6366f1" : "#16213e",
                      border: m.role === "user" ? "none" : "1px solid #2a2a4a",
                    }}
                  >
                    {m.content.split("\n").map((line, li) => (
                      <span key={li}>{line}{li < m.content.split("\n").length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}>
                    <div className="dot-typing"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask about the course content..."
                className="flex-1 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
                style={{ backgroundColor: "#1a1a2e", border: "1px solid #2a2a4a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Upload {showUploadModal === "lecture" ? "Lecture" : "PDF"}</h3>
              <button onClick={() => setShowUploadModal(null)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title *</label>
                <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Enter title" className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }} onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#2a2a4a")} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Optional description" className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }} onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#2a2a4a")} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">File {showUploadModal === "pdf" ? "(PDF only)" : ""}</label>
                <input type="file" accept={showUploadModal === "pdf" ? ".pdf" : "*"} onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full rounded-xl px-4 py-2.5 text-sm text-gray-400" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUploadModal(null)} className="flex-1 py-2.5 border text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all" style={{ borderColor: "#2a2a4a" }}>Cancel</button>
                <button onClick={() => uploadContent(showUploadModal)} disabled={uploading || !uploadFile || !uploadTitle} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold transition-all">
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Create Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl p-6 border my-4" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Create Quiz</h3>
              <button onClick={() => setShowQuizModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Quiz Title *</label>
                <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g. Chapter 1 Quiz" className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }} onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#2a2a4a")} />
              </div>
              {quizQuestions.map((q, qi) => (
                <div key={qi} className="p-4 rounded-xl border" style={{ backgroundColor: "#16213e", borderColor: "#2a2a4a" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-400">Question {qi + 1}</span>
                    {quizQuestions.length > 1 && (
                      <button onClick={() => setQuizQuestions(prev => prev.filter((_, i) => i !== qi))} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                    )}
                  </div>
                  <input value={q.question} onChange={e => setQuizQuestions(prev => prev.map((item, i) => i === qi ? { ...item, question: e.target.value } : item))} placeholder="Enter question" className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none mb-3" style={{ backgroundColor: "#0f0f1a", border: "1px solid #2a2a4a" }} onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#2a2a4a")} />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setQuizQuestions(prev => prev.map((item, i) => i === qi ? { ...item, correct_answer: oi } : item))}
                        className={`w-5 h-5 rounded-full border-2 shrink-0 ${q.correct_answer === oi ? "border-emerald-400 bg-emerald-400" : "border-gray-500"}`}
                      />
                      <input value={opt} onChange={e => setQuizQuestions(prev => prev.map((item, i) => i === qi ? { ...item, options: item.options.map((o, j) => j === oi ? e.target.value : o) } : item))} placeholder={`Option ${oi + 1}`} className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none" style={{ backgroundColor: "#0f0f1a", border: "1px solid #2a2a4a" }} />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-1">Click circle to mark correct answer</p>
                </div>
              ))}
              <button onClick={() => setQuizQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" }])} className="w-full py-2 border border-dashed text-gray-400 hover:text-white rounded-xl text-sm transition-all" style={{ borderColor: "#2a2a4a" }}>
                + Add Question
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowQuizModal(false)} className="flex-1 py-2.5 border text-gray-400 hover:text-white rounded-xl text-sm font-semibold" style={{ borderColor: "#2a2a4a" }}>Cancel</button>
                <button onClick={createQuiz} disabled={!quizTitle} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold transition-all">Create Quiz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
