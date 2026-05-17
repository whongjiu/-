export function getDayOfWeek(): number {
  // 返回 1-7 (周一到周日)
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export function getDayName(day: number): string {
  const names = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return names[day] || "";
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(date)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function parseNames(namesStr: string): string[] {
  try {
    const parsed = JSON.parse(namesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try Chinese comma/semicolon separated format
    return namesStr
      .split(/[,，、；;\n\r\/\|-]+/)
      .map((n) => n.trim())
      .filter(Boolean);
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Reference Monday for weekly rotation calculation
const WEEKLY_REFERENCE = new Date("2026-02-24");

export function getCurrentWeekIndex(): number {
  const today = new Date();
  const diffMs = today.getTime() - WEEKLY_REFERENCE.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

// Resolve which class is active this week from a sorted list of weekly duties
export function resolveWeeklyActive(
  duties: Array<{ classId: number; order: number | null; class?: { id: number; name: string } | null }>
): { classId: number; name: string } | null {
  if (duties.length === 0) return null;
  const sorted = [...duties].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const idx = ((getCurrentWeekIndex() % sorted.length) + sorted.length) % sorted.length;
  const active = sorted[idx];
  return { classId: active.classId, name: active.class?.name ?? `班级 #${active.classId}` };
}
