import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学风管理系统",
  description: "校园学风管理一体化系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-page text-text-body">{children}</body>
    </html>
  );
}
