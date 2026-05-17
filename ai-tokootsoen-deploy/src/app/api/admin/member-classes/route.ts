import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  // Get all member duties grouped by member
  const duties = await prisma.memberDuty.findMany({
    where: { source: "admin" },
    include: {
      member: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { memberId: "asc" },
  });

  // Group by member
  const grouped: Record<number, { member: { id: number; name: string }; classes: Array<{ id: number; name: string }> }> = {};
  for (const d of duties) {
    if (!grouped[d.memberId]) {
      grouped[d.memberId] = { member: d.member, classes: [] };
    }
    grouped[d.memberId].classes.push(d.class);
  }

  return NextResponse.json({ success: true, data: Object.values(grouped) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { memberId, classIds } = await req.json();

  if (!memberId || !Array.isArray(classIds)) {
    return NextResponse.json({ success: false, error: "缺少参数" }, { status: 400 });
  }

  // Remove existing admin-assigned duties for this member
  await prisma.memberDuty.deleteMany({
    where: { memberId, source: "admin" },
  });

  // Create new admin-assigned duties
  for (const classId of classIds) {
    await prisma.memberDuty.create({
      data: {
        memberId,
        classId,
        mode: "daily",
        source: "admin",
      },
    });
  }

  await createWorkLog(session.id, "分配管辖班级", `部员ID: ${memberId}, 班级数: ${classIds.length}`);

  return NextResponse.json({ success: true, data: { count: classIds.length } });
}
