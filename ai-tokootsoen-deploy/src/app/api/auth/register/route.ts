import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSession, getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, inviteCode, role, classId } = await req.json();
    const session = await getSession();

    if (!username || !password || !name) {
      return NextResponse.json({ success: false, error: "请填写完整信息" }, { status: 400 });
    }

    // Check registration status (skip if already logged in as admin)
    if (!session || session.role !== "admin") {
      const regConfig = await prisma.systemConfig.findUnique({
        where: { key: "registration_open" },
      });
      if (regConfig?.value !== "true") {
        return NextResponse.json({ success: false, error: "当前未开放注册" }, { status: 403 });
      }
    }

    // Validate invite code
    if (!inviteCode) {
      return NextResponse.json({ success: false, error: "请输入邀请码" }, { status: 400 });
    }

    let inviteCodeRecord: { id: number; code: string; type: string; maxUses: number; useCount: number; used: boolean; usedBy: number | null } | null = null;

    if (session?.role === "admin") {
      // Admin bypass: skip invite code validation
      const existingCode = await prisma.inviteCode.findUnique({
        where: { code: inviteCode },
      });
      if (existingCode) {
        if (existingCode.useCount >= existingCode.maxUses) {
          return NextResponse.json({ success: false, error: "邀请码已用完" }, { status: 403 });
        }
        inviteCodeRecord = existingCode;
      }
    } else {
      const codeRecord = await prisma.inviteCode.findUnique({
        where: { code: inviteCode },
      });

      if (codeRecord) {
        if (codeRecord.useCount >= codeRecord.maxUses) {
          return NextResponse.json({ success: false, error: "邀请码已用完" }, { status: 403 });
        }
        inviteCodeRecord = codeRecord;
      } else {
        // Fallback: check legacy system config invite code
        const inviteConfig = await prisma.systemConfig.findUnique({
          where: { key: "invite_code" },
        });
        if (!inviteConfig || inviteConfig.value !== inviteCode) {
          return NextResponse.json({ success: false, error: "邀请码无效" }, { status: 403 });
        }
      }
    }

    // Check if username exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ success: false, error: "账号已存在" }, { status: 400 });
    }

    // Determine role
    let userRole: string;
    if (session?.role === "admin") {
      userRole = role || "member";
      if (!["admin", "leader", "member"].includes(userRole)) {
        return NextResponse.json({ success: false, error: "无效的角色" }, { status: 400 });
      }
    } else {
      // Public registration: use invite code type, fallback to leader
      userRole = inviteCodeRecord?.type === "member" ? "member" : "leader";
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        name,
        role: userRole,
        inviteCode,
        classId: classId || null,
      },
    });

    // Update invite code usage
    if (inviteCodeRecord) {
      const newUseCount = inviteCodeRecord.useCount + 1;
      await prisma.inviteCode.update({
        where: { id: inviteCodeRecord.id },
        data: {
          useCount: newUseCount,
          used: newUseCount >= inviteCodeRecord.maxUses,
          usedBy: user.id,
        },
      });
    }

    // Admin creating users: don't auto-login
    // Public registration: don't auto-login, redirect to login page
    if (session?.role === "admin") {
      return NextResponse.json({
        success: true,
        data: { id: user.id, name: user.name, role: user.role },
      });
    }

    // Public registration: return success without setting session
    // Client will redirect to login page
    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, role: user.role, redirect: "login" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "注册失败" }, { status: 500 });
  }
}
