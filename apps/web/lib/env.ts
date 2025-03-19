// 서버 측 환경 변수 validation - 'use server' 컴포넌트에서만 사용해야 함
// ⚠️ 주의: 이 파일은 서버 컴포넌트에서만 import 해야 합니다. 클라이언트 컴포넌트에서는 env-client.ts를 사용하세요.

// Environment variables validation
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable")
}

export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
if (!CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY environment variable")
}

// Socket.io server URL
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

// Mixpanel token for analytics
export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
if (!MIXPANEL_TOKEN && process.env.NODE_ENV === 'production') {
  console.warn("Missing NEXT_PUBLIC_MIXPANEL_TOKEN environment variable in production")
}

// Supabase 환경 변수
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// YouTube API Key
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

