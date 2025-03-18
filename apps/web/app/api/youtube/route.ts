import { NextRequest, NextResponse } from "next/server";

/**
 * YouTube 비디오 상세 정보를 가져오는 API 엔드포인트
 * 
 * URL에서 videoId 쿼리 파라미터를 추출하여 YouTube Data API를 통해
 * 비디오의 제목, 썸네일 URL 등 상세 정보를 가져옵니다.
 * 
 * @param req - Next.js Request 객체
 * @returns 비디오 상세 정보를 포함한 Response
 */
export async function GET(req: NextRequest) {
  try {
    // URL에서 videoId 파라미터 추출
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    // videoId가 없으면 에러 응답
    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // YouTube Data API Key 확인
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error("YouTube API Key is not configured");
      return NextResponse.json(
        { error: "YouTube API is not configured" },
        { status: 500 }
      );
    }

    // YouTube Data API 호출
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API 응답에서 필요한 데이터 추출
    if (data.items && data.items.length > 0) {
      const videoDetails = data.items[0].snippet;
      
      return NextResponse.json({
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnailUrl: videoDetails.thumbnails.high?.url || 
                     videoDetails.thumbnails.medium?.url || 
                     videoDetails.thumbnails.default?.url,
        channelTitle: videoDetails.channelTitle,
        publishedAt: videoDetails.publishedAt
      });
    } else {
      // 비디오가 없는 경우
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching video details:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch video details", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 