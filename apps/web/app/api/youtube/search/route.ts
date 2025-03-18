import { NextRequest, NextResponse } from "next/server";

/**
 * YouTube 동영상 검색 API 엔드포인트
 * 
 * URL에서 query 쿼리 파라미터를 추출하여 YouTube Data API를 통해
 * 검색 결과를 가져옵니다.
 * 
 * @param req - Next.js Request 객체
 * @returns 검색 결과를 포함한 Response
 */
export async function GET(req: NextRequest) {
  try {
    // URL에서 검색어 파라미터 추출
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const maxResults = searchParams.get("maxResults") || "10";

    // 검색어가 없으면 에러 응답
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
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

    // YouTube Data API 검색 호출
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // API 응답에서 필요한 데이터 추출
    if (data.items && data.items.length > 0) {
      const searchResults = data.items.map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || 
                     item.snippet.thumbnails.medium?.url || 
                     item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      }));
      
      return NextResponse.json({
        results: searchResults
      });
    } else {
      // 검색 결과가 없는 경우
      return NextResponse.json({
        results: []
      });
    }
  } catch (error) {
    console.error("Error searching videos:", error);
    return NextResponse.json(
      { 
        error: "Failed to search videos", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 