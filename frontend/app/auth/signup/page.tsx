"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, UserPlus, Copy, CheckCircle } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ password: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/signup", { name, email, role });
      setSuccess({ password: data.temp_password, email: data.email });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (success) {
      navigator.clipboard.writeText(success.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundColor: "#0f0f1a",
          backgroundImage: "radial-gradient(ellipse at top, rgba(16,185,129,0.1) 0%, transparent 60%)",
        }}
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-8 border text-center"
            style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}
          >
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
            <p className="text-gray-400 mb-6">
              Your account for <span className="text-white font-medium">{success.email}</span> is ready.
            </p>

            <div className="rounded-xl p-4 mb-6 text-left" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}>
              <p className="text-xs text-gray-500 mb-1">Your Generated Password</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-lg font-mono text-indigo-300 font-bold tracking-widest">
                  {success.password}
                </code>
                <button
                  onClick={copyPassword}
                  className="p-2 hover:bg-indigo-500/20 rounded-lg transition-colors text-gray-400 hover:text-indigo-400"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs mb-6">
              ⚠️ Save this password now — it won&apos;t be shown again!
            </div>

            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Go to Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "#0f0f1a",
        backgroundImage: "radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">Learnix</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Create Account</h1>
          <p className="text-gray-400 mt-2">Join thousands of learners today</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all"
                style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all"
                style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "USER", label: "Student", emoji: "🎓", desc: "I want to learn" },
                  { value: "TEACHER", label: "Teacher", emoji: "👨‍🏫", desc: "I want to teach" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className="p-4 rounded-xl text-left transition-all duration-200 border-2"
                    style={{
                      backgroundColor: role === r.value ? "rgba(99,102,241,0.15)" : "#16213e",
                      borderColor: role === r.value ? "#6366f1" : "#2a2a4a",
                    }}
                  >
                    <div className="text-2xl mb-1">{r.emoji}</div>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
