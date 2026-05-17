import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  let dormitoryIds: number[] | undefined;

  if (session && session.role === "member") {
    // Member: only see classes in their duty dormitories
    const schedules = await prisma.dutySchedule.findMany({
      where: { memberId: session.id },
      select: { dormitoryId: true },
      distinct: ["dormitoryId"],
    });
    dormitoryIds = schedules.map((s) => s.dormitoryId);

    if (dormitoryIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
  }

  const classes = await prisma.class.findMany({
    where: dormitoryIds ? { dormitoryId: { in: dormitoryIds } } : undefined,
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ success: true, data: classes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ success: false, error: "请输入班级名称" }, { status: 400 });
  }

  const cls = await prisma.class.create({ data: { name } });
  return NextResponse.json({ success: true, data: cls });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { id, name } = await req.json();
  if (!id || !name) {
    return NextResponse.json({ success: false, error: "缺少信息" }, { status: 400 });
  }

  const cls = await prisma.class.update({ where: { id }, data: { name } });
  return NextResponse.json({ success: true, data: cls });
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

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
