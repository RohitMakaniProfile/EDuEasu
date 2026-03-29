"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Users,
  PlusCircle,
  BookMarked,
} from "lucide-react";
import { clearAuth, User } from "@/lib/auth";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const studentNav = [
    { href: "/dashboard/student", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/courses", icon: GraduationCap, label: "Browse Courses" },
  ];

  const teacherNav = [
    { href: "/dashboard/teacher", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/courses", icon: BookMarked, label: "All Courses" },
  ];

  const adminNav = [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/courses", icon: BookOpen, label: "All Courses" },
  ];

  const navItems =
    user.role === "ADMIN" ? adminNav : user.role === "TEACHER" ? teacherNav : studentNav;

  const roleColors: Record<string, string> = {
    ADMIN: "text-red-400 bg-red-400/10 border-red-400/20",
    TEACHER: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    USER: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  const roleIcons: Record<string, React.ReactNode> = {
    ADMIN: <Shield className="w-3 h-3" />,
    TEACHER: <BookOpen className="w-3 h-3" />,
    USER: <GraduationCap className="w-3 h-3" />,
  };

  const logout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <div
      className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40"
      style={{ backgroundColor: "#1a1a2e", borderColor: "#2a2a4a" }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "#2a2a4a" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black gradient-text">Learnix</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
              style={{
                backgroundColor: active ? "rgba(99,102,241,0.15)" : "transparent",
                color: active ? "#818cf8" : "#9ca3af",
                border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: "#2a2a4a" }}>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: "#16213e", border: "1px solid #2a2a4a" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleColors[user.role]}`}
          >
            {roleIcons[user.role]}
            {user.role === "USER" ? "Student" : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
