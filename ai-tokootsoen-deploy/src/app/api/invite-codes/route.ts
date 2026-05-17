import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: codes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { count, type, maxUses } = await req.json().catch(() => ({ count: 1 }));
  const n = Math.min(Math.max(count || 1, 1), 50);

  const codes: string[] = [];
  for (let i = 0; i < n; i++) {
    const code = generateCode();
    await prisma.inviteCode.create({
      data: {
        code,
        type: type || "leader",
        maxUses: maxUses || 1,
      },
    });
    codes.push(code);
  }

  return NextResponse.json({ success: true, data: codes });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");

  if (id) {
    await prisma.inviteCode.delete({ where: { id } });
  } else {
    // Delete all unused codes
    await prisma.inviteCode.deleteMany({ where: { used: false } });
  }

  return NextResponse.json({ success: true });
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
