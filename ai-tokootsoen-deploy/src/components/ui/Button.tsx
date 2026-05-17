"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "success" | "warning" | "danger" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/25 hover:shadow-md hover:shadow-primary-500/35 hover:from-primary-400 hover:to-primary-500 active:from-primary-600 active:to-primary-700",
  success:
    "bg-gradient-to-br from-success-500 to-success-600 text-white shadow-sm shadow-success-500/25 hover:shadow-md hover:shadow-success-500/35 hover:from-success-400 hover:to-success-500 active:from-success-600 active:to-success-700",
  warning:
    "bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-sm shadow-warning-500/25 hover:shadow-md hover:shadow-warning-500/35 hover:from-warning-400 hover:to-warning-500 active:from-warning-600 active:to-warning-700",
  danger:
    "bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-sm shadow-danger-500/25 hover:shadow-md hover:shadow-danger-500/35 hover:from-danger-400 hover:to-danger-500 active:from-danger-600 active:to-danger-700",
  ghost:
    "bg-transparent text-text-body hover:bg-bg-hover active:bg-border-light",
  outline:
    "bg-transparent text-primary-600 border border-primary-300 hover:bg-primary-50 hover:border-primary-400 hover:shadow-sm hover:shadow-primary-500/15 active:bg-primary-100",
};

const sizeClasses = {
  xs: "px-2.5 py-1 text-xs h-7",
  sm: "px-3 py-1.5 text-xs h-8",
  md: "px-4 py-2 text-sm h-9",
  lg: "px-5 py-2.5 text-sm h-10",
  xl: "px-6 py-3 text-base h-11 font-semibold",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  disabled,
  loading,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-btn font-medium inline-flex items-center justify-center gap-1.5",
        "transition-[transform,box-shadow,background,color,opacity] duration-200 ease-out",
        "hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
        // shine sweep on hover for gradient variants
        variant !== "ghost" && variant !== "outline" &&
          "before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-[60%] before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:skew-x-[-20deg] before:transition-[left] before:duration-700 hover:before:left-[150%]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
          />
        </svg>
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </button>
  );
}
