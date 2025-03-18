import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
// 후행 슬래시(trailing slash)를 고려한 공개 경로 패턴 정의
const isPublicRoute = createRouteMatcher([
  "/", 
  "/join-room(.*)",  
  "/room/(.*)",  
  "/api/rooms(.*)",  // /api/rooms 경로는 공개
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/privacy-policy"
]);

// Clerk middleware 구현
export default clerkMiddleware((auth, req) => {
  // 정적 파일은 항상 공개
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon") ||
    req.nextUrl.pathname.includes("/static/")
  ) {
    return NextResponse.next();
  }

  // 공개 라우트는 인증 필요 없음
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }


  if (req.nextUrl.pathname.startsWith("/api")) {
    try {
      auth.protect();
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    auth.protect();
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

// 이 middleware는 모든 라우트에 적용됩니다
export const config = {
  matcher: [
    // 정적 파일 및 이미지를 제외한 모든 경로
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // API 경로 명시적 포함
    "/api/:path*"
  ]
}
