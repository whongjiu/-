"use client";

import Link from "next/link";
import LoginPanel from "@/components/shared/LoginPanel";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-gradient-page flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 装饰背景 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[420px] h-[420px] bg-primary-200/40 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[380px] h-[380px] bg-warning-200/30 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-[40%] right-[30%] w-[260px] h-[260px] bg-success-200/25 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "5s" }}
        />
      </div>

      <div className="relative z-10 mb-8 text-center animate-fade-up">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="w-10 h-10 rounded-xl bg-gradient-primary text-white text-base flex items-center justify-center font-bold shadow-lg shadow-primary-500/35 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 animate-float">
            学
          </span>
          <span className="text-2xl font-bold text-gradient-primary">
            学风管理
          </span>
        </Link>
        <p className="text-sm text-text-hint mt-2">
          班级负责人 / 学风部员 登录
        </p>
      </div>

      <div className="relative z-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <LoginPanel />
      </div>

      <div
        className="relative z-10 mt-6 text-center animate-fade-up"
        style={{ animationDelay: "0.2s" }}
      >
        <Link
          href="/admint"
          className="inline-flex items-center gap-1 text-xs text-text-hint hover:text-primary-500 transition-colors group"
        >
          管理员登录入口
          <svg
            className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
