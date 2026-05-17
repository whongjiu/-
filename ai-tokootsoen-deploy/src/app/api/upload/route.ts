import { NextRequest, NextResponse } from "next/server";
import { saveUploads } from "@/lib/upload";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "请选择文件" }, { status: 400 });
    }

    const paths = await saveUploads(files);
    return NextResponse.json({ success: true, data: paths });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}
