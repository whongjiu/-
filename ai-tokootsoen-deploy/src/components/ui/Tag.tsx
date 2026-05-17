import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TagColor = "primary" | "success" | "warning" | "danger" | "hint" | "neutral";

interface TagProps {
  children: ReactNode;
  color?: TagColor;
  className?: string;
  dot?: boolean;
}

const colorClasses: Record<TagColor, string> = {
  primary: "bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100",
  success: "bg-success-50 text-success-600 ring-1 ring-inset ring-success-100",
  warning: "bg-warning-50 text-warning-600 ring-1 ring-inset ring-warning-100",
  danger: "bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger-100",
  hint: "bg-bg-page text-text-hint ring-1 ring-inset ring-border-light",
  neutral: "bg-bg-hover text-text-body ring-1 ring-inset ring-border-light",
};

const dotColorClasses: Record<TagColor, string> = {
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  hint: "bg-text-hint",
  neutral: "bg-text-hint",
};

export default function Tag({ children, color = "neutral", className, dot }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-tag text-xs font-medium",
        "transition-all duration-200 hover:scale-[1.03]",
        colorClasses[color],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColorClasses[color])} />
      )}
      {children}
    </span>
  );
}
