import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: reports });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ success: false, error: "缺少标题或内容" }, { status: 400 });
  }

  const report = await prisma.report.create({ data: { title, content } });
  return NextResponse.json({ success: true, data: report });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { id, title, content } = await req.json();
  if (!id) {
    return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id },
    data: { title, content },
  });

  return NextResponse.json({ success: true, data: report });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });
  }

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
