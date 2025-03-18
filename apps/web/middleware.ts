import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define public routes that don't require authentication
// 후행 슬래시(trailing slash)를 고려한 공개 경로 패턴 정의
const isPublicRoute = createRouteMatcher([
  "/", 
  "/join-room(.*)/", 
  "/room/(.*)/", 
  "/api/(?!youtube/token)(.*)",  // All API routes except /api/youtube/token
  "/sign-in/(.*)", 
  "/sign-in",
  "/sign-up/(.*)",
  "/sign-up",
  "/privacy-policy"
])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  
  // 경로가 공개 라우트인지 확인
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // 공개 라우트가 아니면 인증 필요
  try {
    await auth.protect();
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
})

export const config = {
  matcher: ["/((?!.*\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

