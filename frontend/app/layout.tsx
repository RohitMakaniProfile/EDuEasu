import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learnix — AI-Powered Learning Platform",
  description:
    "Learn smarter with AI-powered courses, quizzes, and personalized tutoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-screen`}
        style={{ backgroundColor: "#0f0f1a", color: "white" }}
      >
        {children}
      </body>
    </html>
  );
}
