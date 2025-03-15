export async function fetchUserPlaylists(accessToken: string) {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails,
    }))
  } catch (error) {
    console.error("Error fetching playlists:", error)
    throw error
  }
}

export async function fetchPlaylistItems(accessToken: string, playlistId: string) {
  try {
    const allItems = [];
    let nextPageToken = undefined;
    console.log(`🎵 플레이리스트 ID: ${playlistId} 의 비디오들을 가져오는 중...`);

    do {
      // API 호출 URL 구성
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.append("part", "snippet");
      url.searchParams.append("maxResults", "50");
      url.searchParams.append("playlistId", playlistId);
      if (nextPageToken) {
        url.searchParams.append("pageToken", nextPageToken);
      }

      // API 호출
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📄 페이지 데이터:`, data);
      
      // 현재 페이지의 아이템들을 필터링하여 추가
      // 삭제된 비디오나 비공개 비디오는 제외
      const validItems = data.items.filter((item: any) => 
        item.snippet.title !== "Private video" && 
        item.snippet.title !== "Deleted video"
      );
      
      console.log(`✅ 유효한 비디오 수: ${validItems.length}`);
      validItems.forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. ${item.snippet.title} (ID: ${item.snippet.resourceId.videoId})`);
      });
      
      allItems.push(...validItems);
      
      // 다음 페이지 토큰 업데이트
      nextPageToken = data.nextPageToken;
      if (nextPageToken) {
        console.log(`⏭️ 다음 페이지 존재. Token: ${nextPageToken}`);
      }
    } while (nextPageToken);

    console.log(`🎉 총 ${allItems.length}개의 비디오를 가져왔습니다.`);

    // 필요한 정보만 매핑하여 반환
    const mappedItems = allItems.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.high?.url,
    }));

    console.log('🎬 최종 비디오 목록:', mappedItems);
    return mappedItems;
  } catch (error) {
    console.error("❌ Error fetching playlist items:", error);
    throw error;
  }
}

