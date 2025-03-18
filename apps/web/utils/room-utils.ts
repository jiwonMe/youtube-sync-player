/**
 * YouTube URL에서 비디오 ID 추출
 * 
 * @param url - YouTube URL
 * @returns YouTube 비디오 ID 또는 null
 */
export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * YouTube 비디오 상세 정보 가져오기
 * 
 * @param videoId - YouTube 비디오 ID
 * @returns 비디오 제목과 썸네일 URL이 포함된 객체
 */
export async function fetchVideoDetails(videoId: string) {
  try {
    // API 엔드포인트 설정
    const apiUrl = `/api/youtube?videoId=${videoId}`;
    
    // API 호출
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      thumbnailUrl: data.thumbnailUrl,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

/**
 * 타임스탬프를 포맷팅하는 함수
 * 
 * @param timestamp - 타임스탬프 (밀리초)
 * @returns 포맷팅된 시간 문자열 (HH:MM)
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * 시간(초)을 분:초 형식으로 변환
 * 
 * @param seconds - 변환할 시간(초)
 * @returns 포맷팅된 시간 문자열 (MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * 방 비밀번호 확인 함수
 * 
 * @param roomId - 방 ID
 * @param password - 사용자가 입력한 비밀번호
 * @returns 비밀번호 확인 결과
 */
export async function verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
    const response = await fetch(`${socketUrl}/rooms/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, password }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to verify room password:', error);
    return false;
  }
} 