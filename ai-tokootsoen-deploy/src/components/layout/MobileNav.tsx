"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export default function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border-light/70 pb-safe shadow-[0_-4px_20px_rgba(15,23,42,0.04)]">
      <div className="flex items-stretch justify-around h-[56px]">
        {items.slice(0, 5).map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full",
                "transition-colors duration-200 active:scale-95",
                isActive ? "text-primary-600" : "text-text-hint hover:text-text-body"
              )}
            >
              {/* Top indicator bar with grow-in */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full bg-gradient-to-r from-primary-400 to-primary-600",
                  "transition-all duration-300 ease-out",
                  isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                )}
              />
              <span
                className={cn(
                  "text-xl leading-none transition-transform duration-300",
                  isActive ? "scale-110 -translate-y-0.5" : ""
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  isActive ? "font-semibold text-primary-600" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
