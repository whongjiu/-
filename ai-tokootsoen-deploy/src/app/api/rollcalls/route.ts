import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createWorkLog } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = parseInt(searchParams.get("classId") || "0");

  let where: Record<string, unknown> = {};
  if (session.role === "leader") {
    where = { leaderId: session.id };
  } else if (session.role === "member") {
    // Members see roll calls for their assigned classes (from MemberDuty + DutySchedule)
    const myDuties = await prisma.memberDuty.findMany({ where: { memberId: session.id } });
    const mySchedules = await prisma.dutySchedule.findMany({ where: { memberId: session.id }, distinct: ["classId"] });
    const classIds = [...new Set([...myDuties.map(d => d.classId), ...mySchedules.map(s => s.classId)])];
    where = { classId: { in: classIds } };
  } else if (session.role === "admin") {
    // Admin only sees reviewed lists
    where = { reviewed: true };
  }

  if (classId > 0 && session.role !== "member") {
    where = { ...where, classId };
  }

  const lists = await prisma.rollCallList.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      leader: { select: { id: true, name: true } },
      attendances: {
        select: { id: true, studentName: true, status: true, images: true, reviewedBy: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: lists });
}

// POST: Enroll names — leader OR member can do it
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["leader", "member", "admin"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { classId, names } = await req.json();

  if (!classId || !names) {
    return NextResponse.json({ success: false, error: "缺少必要信息" }, { status: 400 });
  }

  const namesArray = Array.isArray(names) ? names : names.split(/[,，、；;\n\r\/\|-]+/).map((n: string) => n.trim()).filter(Boolean);
  const namesJson = JSON.stringify(namesArray);

  // For members, find or create the roll call list for this class
  let list;
  if (session.role === "admin") {
    // Admin can import names for any class — find the class leader
    const leader = await prisma.user.findFirst({
      where: { role: "leader", classId },
    });
    const existing = await prisma.rollCallList.findFirst({
      where: { classId },
    });
    list = await prisma.rollCallList.upsert({
      where: { id: existing?.id || 0 },
      update: { names: namesJson, enrolled: true, leaderId: leader?.id || session.id },
      create: {
        leaderId: leader?.id || session.id,
        classId,
        names: namesJson,
        enrolled: true,
      },
    });
  } else if (session.role === "member") {
    // Upsert by classId (member manages their assigned class's list)
    const existing = await prisma.rollCallList.findFirst({
      where: { classId },
    });
    list = await prisma.rollCallList.upsert({
      where: { id: existing?.id || 0 },
      update: { names: namesJson, enrolled: true },
      create: {
        leaderId: session.id,
        classId,
        names: namesJson,
        enrolled: true,
      },
    });
  } else {
    // Leader enrolls
    const existing = await prisma.rollCallList.findFirst({
      where: { leaderId: session.id, classId },
    });
    if (existing?.enrolled) {
      return NextResponse.json({ success: false, error: "名单已录用，不可重复操作" }, { status: 400 });
    }
    list = await prisma.rollCallList.upsert({
      where: { id: existing?.id || 0 },
      update: { names: namesJson, enrolled: true },
      create: {
        leaderId: session.id,
        classId,
        names: namesJson,
        enrolled: true,
      },
    });
  }

  await createWorkLog(session.id, "录用班级名单", `班级ID: ${classId}, 人数: ${namesArray.length}`);

  return NextResponse.json({ success: true, data: list });
}

// PUT: Update attendance — leader (initial) or member (review/edit)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const { rollCallId, attendances, images } = await req.json();

  // Delete existing attendances for this roll call
  await prisma.attendance.deleteMany({ where: { rollCallId } });

  // Create new
  for (const a of attendances) {
    await prisma.attendance.create({
      data: {
        rollCallId,
        studentName: a.studentName,
        status: a.status,
        images: images ? JSON.stringify(images) : null,
      },
    });
  }

  if (session.role === "leader") {
    await createWorkLog(session.id, "完成点名", `名单ID: ${rollCallId}`);
  } else if (session.role === "member") {
    await createWorkLog(session.id, "二次审批点名", `名单ID: ${rollCallId}`);
  }

  return NextResponse.json({ success: true });
}

// PATCH: member actions on roll call list
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "member") {
    return NextResponse.json({ success: false, error: "仅部员可操作" }, { status: 403 });
  }

  const { rollCallId, action, addImage } = await req.json();

  if (action === "uploadBoard") {
    // Upload board photo to the roll call list
    const list = await prisma.rollCallList.findUnique({ where: { id: rollCallId } });
    const currentImages: string[] = list?.images ? JSON.parse(list.images) : [];
    currentImages.push(addImage);
    await prisma.rollCallList.update({
      where: { id: rollCallId },
      data: { images: JSON.stringify(currentImages) },
    });
    await createWorkLog(session.id, "上传板书照片", `名单ID: ${rollCallId}`);
    return NextResponse.json({ success: true, data: { images: currentImages } });
  }

  if (action !== "finalize") {
    return NextResponse.json({ success: false, error: "无效操作" }, { status: 400 });
  }

  // Mark roll call as reviewed (visible to admin)
  await prisma.rollCallList.update({
    where: { id: rollCallId },
    data: { reviewed: true },
  });

  // Mark all attendances as reviewed by this member
  await prisma.attendance.updateMany({
    where: { rollCallId },
    data: { reviewedBy: session.id },
  });

  await createWorkLog(session.id, "最终提交审批", `名单ID: ${rollCallId}`);

  return NextResponse.json({ success: true });
}
