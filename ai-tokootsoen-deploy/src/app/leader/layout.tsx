import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LeaderLayoutClient from "./layout-client";

const navItems = [
  { label: "日常点名", path: "/leader/daily", icon: "📝" },
  { label: "逐一点名", path: "/leader", icon: "🔍" },
  { label: "录用名单", path: "/leader/enroll", icon: "📋" },
  { label: "请假", path: "/leader/leave", icon: "📎" },
  { label: "值日", path: "/leader/duty", icon: "📅" },
];

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "leader") redirect("/login");

  return (
    <LeaderLayoutClient name={session.name} navItems={navItems}>
      {children}
    </LeaderLayoutClient>
  );
}
