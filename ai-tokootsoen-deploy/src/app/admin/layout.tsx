import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./layout-client";

const navItems = [
  { label: "仪表盘", path: "/admin", icon: "📊" },
  { label: "账号管理", path: "/admin/users", icon: "👥" },
  { label: "班级管理", path: "/admin/classes", icon: "🏫" },
  { label: "宿舍楼管理", path: "/admin/dormitories", icon: "🏢" },
  { label: "值班排班", path: "/admin/schedule", icon: "📅" },
  { label: "详细值班表", path: "/admin/duty-table", icon: "📋" },
  { label: "管辖分配", path: "/admin/member-classes", icon: "🔗" },
  { label: "点名名单", path: "/admin/rollcall", icon: "📋" },
  { label: "邀请码", path: "/admin/invite-codes", icon: "🔑" },
  { label: "通报单", path: "/admin/report", icon: "📄" },
  { label: "工作日志", path: "/admin/logs", icon: "📝" },
  { label: "系统配置", path: "/admin/config", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admint");
  }

  return (
    <AdminLayoutClient name={session.name} navItems={navItems}>
      {children}
    </AdminLayoutClient>
  );
}
