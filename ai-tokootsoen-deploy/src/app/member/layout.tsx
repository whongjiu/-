import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import MemberLayoutClient from "./layout-client";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "member") redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const canNotify = user?.canNotify || false;

  const navItems = [
    { label: "仪表盘", path: "/member", icon: "📊" },
    { label: "值日排班", path: "/member/schedule", icon: "📅" },
    ...(canNotify
      ? [{ label: "通报单", path: "/member/report", icon: "📄" }]
      : []),
  ];

  return (
    <MemberLayoutClient name={session.name} navItems={navItems}>
      {children}
    </MemberLayoutClient>
  );
}
