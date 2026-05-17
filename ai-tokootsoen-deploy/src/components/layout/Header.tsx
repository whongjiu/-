"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  name: string;
  role: string;
  roleLabel: string;
  homePath: string;
  breadcrumb?: { label: string; path?: string }[];
  notificationCount?: number;
}

export default function Header({
  name,
  roleLabel,
  homePath,
  breadcrumb,
  notificationCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="hidden lg:flex sticky top-0 z-40 glass-strong border-b border-border-light/70 h-16 items-center backdrop-saturate-150">
      <div className="flex-1 flex items-center justify-between px-6">
        {/* Left: Breadcrumb / App name */}
        <div className="flex items-center gap-2 min-w-0">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav className="flex items-center gap-1 text-sm">
              <button
                onClick={() => router.push(homePath)}
                className="text-text-hint hover:text-primary-500 transition-colors duration-200"
              >
                首页
              </button>
              {breadcrumb.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-text-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {item.path ? (
                    <button
                      onClick={() => router.push(item.path!)}
                      className="text-text-hint hover:text-primary-500 transition-colors duration-200"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-text-title font-semibold">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            <button
              onClick={() => router.push(homePath)}
              className="flex items-center gap-2 text-base font-semibold text-text-title group"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-primary text-white text-xs flex items-center justify-center font-bold shadow-md shadow-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                学
              </span>
              <span className="group-hover:text-primary-600 transition-colors">学风管理</span>
            </button>
          )}
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-btn text-text-hint hover:bg-bg-hover hover:text-primary-500 transition-all duration-200 active:scale-95 group">
            <svg className="w-5 h-5 group-hover:animate-wiggle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-gradient-danger text-white text-[10px] font-semibold rounded-full shadow-sm animate-pulse-glow">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* User avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-bg-hover transition-all duration-200 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-semibold shadow-md shadow-primary-500/30 ring-2 ring-white">
                {name.charAt(0)}
              </div>
              <span className="text-sm text-text-body hidden sm:inline font-medium">{name}</span>
              <svg
                className={`w-3 h-3 text-text-hint transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-card shadow-modal border border-white/60 py-1.5 animate-scale-in origin-top-right">
                <div className="px-3 py-2 border-b border-border-light/70">
                  <div className="text-sm font-semibold text-text-title">{name}</div>
                  <div className="text-xs text-text-hint mt-0.5">{roleLabel}</div>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); router.push(homePath); }}
                  className="w-full text-left px-3 py-2 text-sm text-text-body hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 h-4 inline-flex items-center justify-center">👤</span>
                  个人中心
                </button>
                <button
                  onClick={() => { setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-text-body hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 h-4 inline-flex items-center justify-center">🔒</span>
                  修改密码
                </button>
                <div className="border-t border-border-light/70 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 h-4 inline-flex items-center justify-center">↩️</span>
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
