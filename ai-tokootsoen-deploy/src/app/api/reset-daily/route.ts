import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

// POST: Clear daily data (attendance + roll call lists)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "yes") {
    return NextResponse.json({ success: false, error: "请确认操作" }, { status: 400 });
  }

  // Delete all attendance records
  const deletedAtt = await prisma.attendance.deleteMany();
  // Un-enroll all roll call lists (keep the lists but mark as not enrolled)
  const updatedLists = await prisma.rollCallList.updateMany({
    where: { enrolled: true },
    data: { enrolled: false, reviewed: false },
  });

  await createWorkLog(session.id, "每日数据重置", `清除考勤: ${deletedAtt.count}条, 重置名单: ${updatedLists.count}个`);

  return NextResponse.json({
    success: true,
    data: {
      deletedAttendances: deletedAtt.count,
      resetRollCallLists: updatedLists.count,
    },
  });
}
