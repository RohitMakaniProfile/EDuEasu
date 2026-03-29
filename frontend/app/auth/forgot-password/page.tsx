"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpen, KeyRound, Copy, CheckCircle } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setResult({ password: data.new_password });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed. Please check the email address."));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (result) {
      navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: "#0f0f1a",
        backgroundImage: "radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 60%)",
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
          <h1 className="text-3xl font-bold mt-4">Reset Password</h1>
          <p className="text-gray-400 mt-2">We&apos;ll generate a new password for you</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}>
          {result ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Password Reset!</h3>
              <p className="text-gray-400 text-sm mb-5">Your new password:</p>
              <div className="rounded-xl p-4 mb-4 text-left" style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-lg font-mono text-indigo-300 font-bold tracking-widest">
                    {result.password}
                  </code>
                  <button onClick={copy} className="p-2 hover:bg-indigo-500/20 rounded-lg transition-colors text-gray-400 hover:text-indigo-400">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs mb-5">
                ⚠️ Save this password now!
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-center transition-all"
              >
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <KeyRound className="w-5 h-5" />
                  )}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
              <p className="text-center text-gray-400 text-sm mt-6">
                Remember it?{" "}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
