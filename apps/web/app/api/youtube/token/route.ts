import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clerk에서 사용자의 OAuth 토큰 가져오기
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const googleAccount = user.externalAccounts.find(
      (account) => account.provider === "oauth_google"
    )

    if (!googleAccount) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      )
    }

    // Google OAuth 토큰 가져오기
    const { data } = await clerk.users.getUserOauthAccessToken(userId, "google")

    console.log(data)
    const token = data[0]

    if (!token?.token) {
      return NextResponse.json(
        { error: "Failed to get Google access token" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      accessToken: token.token,
      expiresAt: Date.now() + 3600 * 1000, // 1시간
    })
  } catch (error) {
    console.error("Error fetching YouTube token:", error)
    return NextResponse.json(
      { error: "Failed to get YouTube token" },
      { status: 500 }
    )
  }
}

