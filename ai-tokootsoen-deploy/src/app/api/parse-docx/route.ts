import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "请选择文件" }, { status: 400 });
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json({ success: false, error: "仅支持 .docx 格式" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });

    return NextResponse.json({
      success: true,
      data: {
        text: result.value,
        warnings: result.messages,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "文档解析失败" }, { status: 500 });
  }
}
