import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dayOfWeek = parseInt(searchParams.get("day") || "0");

  const where = dayOfWeek > 0 ? { dayOfWeek } : {};
  const schedules = await prisma.dutySchedule.findMany({
    where,
    include: {
      member: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      dormitory: { select: { id: true, building: true } },
    },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ success: true, data: schedules });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { schedules } = await req.json();

  // Clear existing
  await prisma.dutySchedule.deleteMany();

  // Create new
  for (const s of schedules) {
    await prisma.dutySchedule.create({
      data: {
        dayOfWeek: s.dayOfWeek,
        memberId: s.memberId,
        classId: s.classId || null,
        dormitoryId: s.dormitoryId,
      },
    });
  }

  await createWorkLog(session.id, "更新值班排班");

  return NextResponse.json({ success: true, data: { count: schedules.length } });
}
