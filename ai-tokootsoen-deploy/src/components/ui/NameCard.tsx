"use client";

import { cn } from "@/lib/utils";

interface NameCardProps {
  name: string;
  selected?: boolean;
  status?: "present" | "absent" | "leave" | "none";
  onClick?: () => void;
  className?: string;
}

const statusBorders = {
  present:
    "border-success-300 bg-gradient-to-br from-success-50 to-success-100/60 text-success-700 hover:border-success-400 hover:shadow-success-500/15",
  absent:
    "border-danger-300 bg-gradient-to-br from-danger-50 to-danger-100/60 text-danger-700 hover:border-danger-400 hover:shadow-danger-500/15",
  leave:
    "border-warning-300 bg-gradient-to-br from-warning-50 to-warning-100/60 text-warning-700 hover:border-warning-400 hover:shadow-warning-500/15",
  none: "border-border-light bg-bg-card text-text-body hover:border-primary-300 hover:text-primary-600 hover:shadow-primary-500/10",
};

export default function NameCard({
  name,
  selected,
  status = "none",
  onClick,
  className,
}: NameCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-3 rounded-card border text-sm font-medium",
        "transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
        statusBorders[status],
        selected &&
          "ring-2 ring-primary-400 ring-offset-1 bg-gradient-to-br from-primary-50 to-primary-100/70 border-primary-300 text-primary-700 shadow-md shadow-primary-500/15",
        className
      )}
    >
      {name}
    </button>
  );
}
