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

