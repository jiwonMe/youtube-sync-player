import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET handler for YouTube token
 * 
 * @returns YouTube OAuth token response
 */
export async function GET() {
  try {
    // currentUser()를 사용하여 사용자 정보 가져오기 (auth() 대신)
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자의 OAuth 토큰 가져오기
    const googleAccount = user.externalAccounts.find(
      (account: any) => account.provider === "oauth_google"
    );

    if (!googleAccount) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    // Google OAuth 토큰 가져오기
    const clerk = await clerkClient();
    const { data } = await clerk.users.getUserOauthAccessToken(user.id, "google");
    const token = data[0];

    if (!token?.token) {
      return NextResponse.json(
        { error: "Failed to get Google access token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken: token.token,
      expiresAt: Date.now() + 3600 * 1000, // 1시간
    });
  } catch (error) {
    console.error("Error fetching YouTube token:", error);
    return NextResponse.json(
      { error: "Failed to get YouTube token", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

