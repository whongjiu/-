"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  name?: string;
  roleLabel?: string;
}

export default function MobileDrawer({ open, onClose, items, name, roleLabel }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleNav = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-bg-card shadow-modal flex flex-col animate-slide-in-left">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 px-4 pt-4 pb-5 text-white overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-blob" />
          <div
            className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-blob"
            style={{ animationDelay: "2s" }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-bold ring-1 ring-white/30">
                学
              </span>
              <span className="text-sm font-semibold">学风管理</span>
            </div>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="w-8 h-8 flex items-center justify-center rounded-btn text-white/90 hover:bg-white/15 transition-all duration-200 active:scale-90 hover:rotate-90"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          {name && (
            <div className="relative mt-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-base font-semibold ring-2 ring-white/40">
                {name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold">{name}</div>
                {roleLabel && <div className="text-xs text-white/80">{roleLabel}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-2 stagger-fade">
          {items.map((item, idx) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");

            const showDivider = idx > 0 && (
              item.label === "账号管理" ||
              item.label === "班级管理" ||
              item.label === "值日排班" ||
              item.label === "点名名单" ||
              item.label === "邀请码" ||
              item.label === "系统配置"
            );

            return (
              <div key={item.path}>
                {showDivider && <div className="my-1.5 mx-3 border-t border-border-light/70" />}
                <button
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm group",
                    "transition-all duration-200 active:scale-[0.97]",
                    isActive
                      ? "bg-gradient-to-r from-primary-50 to-primary-50/40 text-primary-600 font-semibold shadow-sm shadow-primary-500/5"
                      : "text-text-body hover:bg-bg-hover hover:text-primary-600"
                  )}
                >
                  <span
                    className={cn(
                      "text-lg transition-transform duration-300",
                      "group-hover:scale-110 group-hover:rotate-[-4deg]",
                      isActive ? "text-primary-600" : ""
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
