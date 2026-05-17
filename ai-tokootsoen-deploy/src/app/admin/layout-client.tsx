"use client";

import { ReactNode, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileDrawer from "@/components/layout/MobileDrawer";

interface Props {
  name: string;
  navItems: { label: string; path: string; icon: string }[];
  children: ReactNode;
}

export default function AdminLayoutClient({ name, navItems, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const current = navItems.find(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
    );
    return current?.label || "仪表盘";
  }, [pathname, navItems]);

  const mobileNavItems = [
    { label: "仪表盘", path: "/admin", icon: "📊" },
    { label: "值日管理", path: "/admin/schedule", icon: "📅" },
    { label: "数据统计", path: "/admin/report", icon: "📄" },
    { label: "个人中心", path: "/admin", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-bg-page">
      {/* PC Header */}
      <Header
        name={name}
        role="admin"
        roleLabel="管理员·会长"
        homePath="/admin"
        breadcrumb={[{ label: pageTitle }]}
      />

      {/* Mobile Header */}
      <MobileHeader
        title={pageTitle}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* PC Sidebar */}
      <Sidebar items={navItems} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
        name={name}
        roleLabel="管理员·会长"
      />

      {/* Main Content */}
      <main
        className={`transition-[margin-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pt-12 lg:pt-16 pb-14 lg:pb-0 ${
          collapsed ? "lg:ml-16" : "lg:ml-[220px]"
        }`}
      >
        <div key={pathname} className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto min-w-0 animate-fade-up">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav items={mobileNavItems} />
    </div>
  );
}
