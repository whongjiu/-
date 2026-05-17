import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "member") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const duties = await prisma.memberDuty.findMany({
    where: { memberId: session.id },
    include: { class: true },
    orderBy: [{ mode: "asc" }, { dayOfWeek: "asc" }, { order: "asc" }],
  });

  // Deduplicate by classId (admin and member sources may overlap)
  const seen = new Set<number>();
  const unique = duties.filter(d => {
    if (seen.has(d.classId)) return false;
    seen.add(d.classId);
    return true;
  });

  return NextResponse.json({ success: true, data: unique });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "member") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { duties, mode } = await req.json();
  // mode: "daily" | "weekly"
  // duties: [{ classId, dayOfWeek (for daily), order (for weekly) }]

  // Get member's allowed dormitories from DutySchedule
  const mySchedules = await prisma.dutySchedule.findMany({
    where: { memberId: session.id },
    select: { dormitoryId: true },
    distinct: ["dormitoryId"],
  });
  const allowedDormIds = mySchedules.map((s) => s.dormitoryId);

  // Validate submitted classIds belong to member's duty dormitories
  const submittedClassIds: number[] = duties.map((d: { classId: number }) => d.classId);
  const allowedClasses = await prisma.class.findMany({
    where: { dormitoryId: { in: allowedDormIds } },
    select: { id: true },
  });
  const allowedClassIds = new Set(allowedClasses.map((c) => c.id));

  for (const classId of submittedClassIds) {
    if (!allowedClassIds.has(classId)) {
      return NextResponse.json(
        { success: false, error: "只能分配值班宿舍楼绑定的班级" },
        { status: 403 }
      );
    }
  }

  // Clear existing self-assigned duties (preserve admin-assigned)
  await prisma.memberDuty.deleteMany({ where: { memberId: session.id, source: "member" } });

  for (const d of duties) {
    await prisma.memberDuty.create({
      data: {
        memberId: session.id,
        classId: d.classId,
        dayOfWeek: d.dayOfWeek || null,
        order: d.order || null,
        mode,
        source: "member",
      },
    });
  }

  await createWorkLog(session.id, "配置值日排班", `模式: ${mode}`);

  return NextResponse.json({ success: true, data: { count: duties.length } });
}
