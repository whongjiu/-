import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    include: { class: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { username, password, name, role, classId, canNotify } = await req.json();

  if (!username || !password || !name || !role) {
    return NextResponse.json({ success: false, error: "缺少必要信息" }, { status: 400 });
  }

  if (!["member", "leader", "admin"].includes(role)) {
    return NextResponse.json({ success: false, error: "角色无效" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ success: false, error: "账号已存在" }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashed,
      name,
      role,
      classId: classId || null,
      canNotify: canNotify || false,
    },
    include: { class: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { id, username, password, name, role, classId, canNotify } = await req.json();
  if (!id) {
    return NextResponse.json({ success: false, error: "缺少用户ID" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (username) data.username = username;
  if (name) data.name = name;
  if (role) data.role = role;
  if (classId !== undefined) data.classId = classId ? Number(classId) : null;
  if (password) data.password = await hashPassword(password);
  if (canNotify !== undefined) data.canNotify = canNotify;

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { class: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ success: false, error: "缺少用户ID" }, { status: 400 });
  }

  // Prevent self-deletion
  if (id === session.id) {
    return NextResponse.json({ success: false, error: "不能删除自己" }, { status: 400 });
  }

  // Cascade delete related records first
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { reviewedBy: id } }),
    prisma.memberDuty.deleteMany({ where: { memberId: id } }),
    prisma.dutySchedule.deleteMany({ where: { memberId: id } }),
    prisma.rollCallList.deleteMany({ where: { leaderId: id } }),
    prisma.workLog.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
