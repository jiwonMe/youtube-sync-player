// 클라이언트 환경 변수 validation (NEXT_PUBLIC_ 접두사 환경 변수만 포함)
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable")
}

// Socket.io server URL
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

// Mixpanel token for analytics
export const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
if (!MIXPANEL_TOKEN && process.env.NODE_ENV === 'production') {
  console.warn("Missing NEXT_PUBLIC_MIXPANEL_TOKEN environment variable in production")
}

// Supabase 클라이언트 환경 변수
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 