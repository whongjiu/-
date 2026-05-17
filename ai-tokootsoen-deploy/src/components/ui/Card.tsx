import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  glass?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export default function Card({
  children,
  className,
  padding = "md",
  hoverable,
  glass,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card shadow-card border transition-[transform,box-shadow,border-color] duration-300 ease-out",
        glass
          ? "glass border-white/60"
          : "bg-bg-card border-border-light",
        hoverable && "card-hover cursor-pointer hover:border-primary-200",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
