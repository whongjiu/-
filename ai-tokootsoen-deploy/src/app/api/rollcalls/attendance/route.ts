import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "member") {
    return NextResponse.json({ success: false, error: "仅部员可修改考勤" }, { status: 403 });
  }

  const { attendanceId, status, addImage } = await req.json();

  const data: Record<string, unknown> = { reviewedBy: session.id };
  if (status) data.status = status;

  // Handle image append
  if (addImage) {
    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    const currentImages: string[] = existing?.images ? JSON.parse(existing.images) : [];
    currentImages.push(addImage);
    data.images = JSON.stringify(currentImages);
  }

  const attendance = await prisma.attendance.update({
    where: { id: attendanceId },
    data,
  });

  if (status) {
    await createWorkLog(session.id, "修改考勤状态", `${attendance.studentName} -> ${status}`);
  } else if (addImage) {
    await createWorkLog(session.id, "上传板书照片", `${attendance.studentName}`);
  }

  return NextResponse.json({ success: true, data: attendance });
}
