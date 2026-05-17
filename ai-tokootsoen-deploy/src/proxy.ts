import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "xuefeng-jwt-secret-key-change-in-production"
);

const COOKIE_NAME = "xuefeng-token";

// 角色 -> 允许访问的路由前缀
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin"],
  member: ["/member"],
  leader: ["/leader"],
};

// 不需要认证的路径
const publicPaths = [
  "/",
  "/login",
  "/admint",
  "/api/auth/login",
  "/api/auth/register",
  "/api/upload",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 允许静态文件和public路径
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // 公共路径放行
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // 公开资源
  if (
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    // API 返回 401，页面重定向到登录
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }
    const loginPath = pathname.startsWith("/admin") || pathname.startsWith("/admint")
      ? "/admint"
      : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    // 检查角色权限
    for (const [r, routes] of Object.entries(roleRoutes)) {
      const isAllowed = routes.some((route) => pathname.startsWith(route));
      if (isAllowed && r !== role) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "无权限访问" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // 管理员未登录尝试访问登录页 -> 重定向到管理面板
    if ((pathname === "/login" || pathname === "/admint") && role) {
      const redirectPath = role === "admin" ? "/admin" : role === "member" ? "/member" : "/leader";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  } catch {
    // Token 无效
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
