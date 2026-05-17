"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative bg-bg-card rounded-modal shadow-modal w-full max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto",
          "border border-white/40",
          "animate-scale-in",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3 bg-bg-card/95 backdrop-blur-sm rounded-t-modal">
            <span className="text-base font-semibold text-text-title">{title}</span>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-hint hover:bg-bg-hover hover:text-text-body hover:rotate-90 transition-all duration-300 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5 sm:p-6 pb-safe">{children}</div>
      </div>
    </div>
  );
}
