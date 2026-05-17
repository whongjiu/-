import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  let dormitoryIds: number[] | undefined;

  if (session && session.role === "member") {
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

  const dormitories = await prisma.dormitory.findMany({
    where: dormitoryIds ? { id: { in: dormitoryIds } } : undefined,
    include: { classes: { select: { id: true, name: true } } },
    orderBy: { building: "asc" },
  });
  return NextResponse.json({ success: true, data: dormitories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { building } = await req.json();
  if (!building) {
    return NextResponse.json({ success: false, error: "请输入楼牌号" }, { status: 400 });
  }

  const dorm = await prisma.dormitory.create({ data: { building } });
  return NextResponse.json({ success: true, data: dorm });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { id, building } = await req.json();
  if (!id || !building) {
    return NextResponse.json({ success: false, error: "缺少信息" }, { status: 400 });
  }

  const dorm = await prisma.dormitory.update({ where: { id }, data: { building } });
  return NextResponse.json({ success: true, data: dorm });
}

// PATCH: bind/unbind classes to a dormitory
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { dormitoryId, classIds } = await req.json();
  if (!dormitoryId || !Array.isArray(classIds)) {
    return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
  }

  // Unbind all classes from this dormitory first
  await prisma.class.updateMany({
    where: { dormitoryId },
    data: { dormitoryId: null },
  });

  // Bind selected classes
  if (classIds.length > 0) {
    await prisma.class.updateMany({
      where: { id: { in: classIds } },
      data: { dormitoryId },
    });
  }

  return NextResponse.json({ success: true });
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

  await prisma.dormitory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
