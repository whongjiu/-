import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const configs = await prisma.systemConfig.findMany();
  const map: Record<string, string> = {};
  for (const c of configs) {
    map[c.key] = c.value;
  }
  return NextResponse.json({ success: true, data: map });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  }

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: value as string },
      create: { key, value: value as string },
    });
  }

  return NextResponse.json({ success: true });
}
