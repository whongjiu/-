import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "请输入账号和密码" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ success: false, error: "账号不存在" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "密码错误" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "admin" | "member" | "leader",
      classId: user.classId,
    };

    await setSession(sessionUser);

    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "登录失败" }, { status: 500 });
  }
}
