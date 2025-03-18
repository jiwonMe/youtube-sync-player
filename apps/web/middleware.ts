import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define public routes that don't require authentication
// 후행 슬래시(trailing slash)를 고려한 공개 경로 패턴 정의
const isPublicRoute = createRouteMatcher([
  "/", 
  "/join-room(.*)/", 
  "/room/(.*)/", 
  "/api/((?!youtube/token).+)",  // API routes except youtube/token
  "/sign-in/(.*)", 
  "/sign-in",
  "/sign-up/(.*)",
  "/sign-up",
  "/privacy-policy"
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

