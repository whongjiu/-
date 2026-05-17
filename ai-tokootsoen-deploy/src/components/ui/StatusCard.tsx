import { cn } from "@/lib/utils";

interface StatusCardProps {
  active: boolean;
  activeText?: string;
  inactiveText?: string;
  className?: string;
}

export default function StatusCard({
  active,
  activeText = "值班中",
  inactiveText = "不值班",
  className,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card px-6 py-5 text-center font-semibold text-lg",
        "shadow-card border transition-all duration-500 ease-out",
        "animate-scale-in",
        active
          ? "bg-gradient-to-br from-success-50 to-success-100/70 text-success-700 border-success-200"
          : "bg-gradient-to-br from-danger-50 to-danger-100/70 text-danger-600 border-danger-200",
        className
      )}
    >
      {/* 装饰光斑 */}
      <div
        className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-50 animate-blob",
          active ? "bg-success-300" : "bg-danger-300"
        )}
      />
      <div
        className={cn(
          "absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl opacity-40 animate-blob",
          active ? "bg-success-200" : "bg-danger-200"
        )}
        style={{ animationDelay: "1.5s" }}
      />

      {/* 内容 */}
      <div className="relative flex items-center justify-center gap-2">
        <span
          className={cn(
            "inline-block w-2.5 h-2.5 rounded-full",
            active
              ? "bg-success-500 animate-pulse-glow"
              : "bg-danger-500"
          )}
        />
        <span>{active ? activeText : inactiveText}</span>
      </div>
    </div>
  );
}
