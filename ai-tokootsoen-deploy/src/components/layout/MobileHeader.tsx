"use client";

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  notificationCount?: number;
}

export default function MobileHeader({
  title,
  onMenuClick,
  notificationCount = 0,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-40 glass-strong border-b border-border-light/70 h-12 flex items-center justify-between px-3">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        aria-label="打开导航"
        className="w-9 h-9 flex items-center justify-center rounded-btn text-text-body hover:bg-bg-hover active:bg-primary-50 active:text-primary-600 transition-all duration-200 active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Title with subtle gradient pill */}
      <span className="text-sm font-semibold text-text-title truncate px-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-glow" />
        {title}
      </span>

      {/* Notification */}
      <button
        aria-label="通知"
        className="relative w-9 h-9 flex items-center justify-center rounded-btn text-text-hint hover:bg-bg-hover active:bg-primary-50 active:text-primary-600 transition-all duration-200 active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-gradient-danger text-white text-[10px] font-semibold rounded-full shadow-sm animate-pulse-glow">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>
    </header>
  );
}
