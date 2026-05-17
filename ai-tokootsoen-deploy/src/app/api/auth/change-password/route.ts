import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, comparePassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ success: false, error: "请填写原密码和新密码" }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ success: false, error: "新密码至少4位" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
  }

  const valid = await comparePassword(oldPassword, user.password);
  if (!valid) {
    return NextResponse.json({ success: false, error: "原密码错误" }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: session.id }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
