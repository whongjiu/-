"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ items, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 bg-bg-card/95 backdrop-blur-md border-r border-border-light/70",
        "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-y-auto scrollbar-none">
        {items.map((item, idx) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");

          // Insert divider before certain groups
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
              {showDivider && (
                <div className="my-1.5 mx-3 border-t border-border-light/70" />
              )}
              <button
                onClick={() => router.push(item.path)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-btn group relative overflow-hidden",
                  "transition-[background-color,color,transform] duration-200 ease-out",
                  "active:scale-[0.97]",
                  collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
                  isActive
                    ? "text-primary-600 bg-gradient-to-r from-primary-50 to-primary-50/40 font-semibold shadow-sm shadow-primary-500/5"
                    : "text-text-body hover:bg-bg-hover hover:text-primary-600"
                )}
              >
                {/* Active indicator bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600",
                    "transition-[transform,opacity] duration-300 ease-out",
                    isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                  )}
                />
                {/* Hover slide background */}
                <span
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary-50/60 to-transparent opacity-0",
                    "transition-opacity duration-300",
                    !isActive && "group-hover:opacity-100"
                  )}
                />
                <span
                  className={cn(
                    "relative text-lg shrink-0 transition-transform duration-300",
                    "group-hover:scale-110 group-hover:rotate-[-4deg]",
                    isActive ? "text-primary-600" : "text-text-hint group-hover:text-primary-500"
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span
                    className={cn(
                      "relative text-sm truncate transition-colors",
                      isActive ? "text-primary-600 font-semibold" : "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle at bottom */}
      <div className="p-2 border-t border-border-light/70">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-btn",
            "text-text-hint hover:bg-bg-hover hover:text-primary-500 transition-all duration-200 active:scale-95 group"
          )}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-300 group-hover:scale-110",
              collapsed ? "rotate-0" : "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          {!collapsed && <span className="text-xs font-medium">收起菜单</span>}
        </button>
      </div>
    </aside>
  );
}
