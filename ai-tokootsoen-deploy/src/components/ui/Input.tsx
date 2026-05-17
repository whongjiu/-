"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, className, icon, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            focused ? "text-primary-600" : "text-text-body",
            error && "text-danger-500"
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none",
              focused ? "text-primary-500" : "text-text-hint",
              error && "text-danger-500"
            )}
          >
            {icon}
          </span>
        )}
        <input
          className={cn(
            "w-full py-2 rounded-btn border bg-bg-card",
            "text-text-body placeholder:text-text-hint",
            "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
            "focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100/60 focus:bg-white",
            "hover:border-primary-200",
            "disabled:bg-bg-page disabled:text-text-disabled disabled:cursor-not-allowed disabled:hover:border-border-light",
            icon ? "pl-9 pr-3.5" : "px-3.5",
            error
              ? "border-danger-400 focus:border-danger-500 focus:ring-danger-100/60 hover:border-danger-300"
              : "border-border-light",
            className
          )}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-danger-500 animate-fade-in flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4a.75.75 0 11.001-1.5.75.75 0 010 1.5zm0-3a.75.75 0 01-.75-.75v-4a.75.75 0 011.5 0v4a.75.75 0 01-.75.75z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}
