"use client";
import Link from "next/link";
import { BookOpen, Brain, Trophy, Users, Play, Star, ArrowRight, Zap, Shield, MessageSquare } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-8 h-8 text-indigo-400" />,
    title: "AI RAG Chatbot",
    desc: "Course-specific AI tutor trained on your course materials. Ask anything, get instant, accurate answers.",
    color: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/30",
  },
  {
    icon: <Trophy className="w-8 h-8 text-yellow-400" />,
    title: "Interactive Quizzes",
    desc: "Test your knowledge with auto-graded quizzes. Get instant feedback and detailed explanations.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
  },
  {
    icon: <Users className="w-8 h-8 text-emerald-400" />,
    title: "Expert Teachers",
    desc: "Learn from verified experts. Teacher approval process ensures top-quality instruction.",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
  {
    icon: <BookOpen className="w-8 h-8 text-pink-400" />,
    title: "Rich Content",
    desc: "Access lectures, PDFs, notes, and multimedia. All your learning materials in one place.",
    color: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/30",
  },
];

const stats = [
  { value: "500+", label: "Courses" },
  { value: "10K+", label: "Students" },
  { value: "200+", label: "Teachers" },
  { value: "98%", label: "Satisfaction" },
];

const steps = [
  { step: "01", title: "Sign Up Free", desc: "Create your account in seconds. No credit card required.", icon: <Star className="w-5 h-5" /> },
  { step: "02", title: "Enroll in Courses", desc: "Browse hundreds of courses and enroll instantly.", icon: <BookOpen className="w-5 h-5" /> },
  { step: "03", title: "Learn with AI", desc: "Use the AI chatbot to get answers from course materials anytime.", icon: <Brain className="w-5 h-5" /> },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f0f1a" }}>
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-indigo-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Learnix</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-gray-400 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Powered by Groq AI — Fastest LLM inference
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in">
            Learn Smarter
            <br />
            <span className="gradient-text">with AI</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in">
            The only learning platform where an AI tutor, trained on your exact course materials,
            is available 24/7 to answer your questions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 rounded-2xl font-semibold text-lg transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              Sign In
            </Link>
          </div>

          {/* Hero visual */}
          <div className="mt-16 relative">
            <div className="glass rounded-3xl p-6 max-w-2xl mx-auto animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-500 text-sm ml-2">AI Course Tutor</span>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">You</div>
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200">
                    Explain gradient descent in simple terms
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-[#16213e] border border-[#2a2a4a] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-200 max-w-sm">
                    Based on your course material, gradient descent is an optimization algorithm that minimizes loss by iteratively moving in the direction of steepest descent...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-16 px-6 border-y border-[#2a2a4a]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Learnix combines cutting-edge AI with expert-curated content to deliver the best learning experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`card-hover rounded-2xl p-6 bg-gradient-to-br ${f.color} border ${f.border} cursor-default`}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              How <span className="gradient-text">Learnix</span> Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                )}
                <div className="w-16 h-16 bg-indigo-600/20 border-2 border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black text-indigo-400">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10" />
            <div className="relative">
              <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-4xl font-black mb-4">
                Ready to Start <span className="gradient-text">Learning?</span>
              </h2>
              <p className="text-gray-400 mb-8">
                Join thousands of students already learning smarter with AI.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2a2a4a] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">Learnix</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Learnix. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
