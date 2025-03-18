import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
// 후행 슬래시(trailing slash)를 고려한 공개 경로 패턴 정의
const isPublicRoute = createRouteMatcher([
  "/", 
  "/join-room(.*)",  
  "/room/(.*)",  
  "/api/(?!youtube/token)(.*)",  // All API routes except /api/youtube/token
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/privacy-policy"
]);

// Clerk middleware 구현
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 공개 라우트는 인증 필요 없음
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 인증이 필요한 경로는 보호
  try {
    await auth.protect();
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

// 이 middleware는 모든 라우트에 적용됩니다
// 특히 /api/youtube/token 경로를 반드시 포함하도록 합니다
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/youtube/token"
  ],
}

