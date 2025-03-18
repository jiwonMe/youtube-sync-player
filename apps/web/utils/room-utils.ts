import { Socket } from "socket.io-client"
import { io } from "socket.io-client"
import { createMockSocket } from "@/services/mock-socket-service"

/**
 * 방에 소켓 연결을 생성하는 함수
 * 
 * @param roomId - 연결할 방 ID
 * @param userId - 사용자 ID
 * @param userName - 사용자 이름
 * @param userImage - 사용자 이미지 URL
 * @returns Socket 인스턴스
 */
export const connectToRoom = (roomId: string, userId: string, userName: string, userImage: string): Socket => {
  // SOCKET_URL이 제공되지 않은 경우 mock socket 사용
  if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
    return createMockSocket(roomId, userId, userName, userImage)
  }

  return io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    query: { roomId, userId, userName, userImage },
  })
}

/**
 * YouTube URL에서 비디오 ID를 추출하는 함수
 * 
 * @param url - YouTube 비디오 URL
 * @returns YouTube 비디오 ID 또는 null
 */
export const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

/**
 * YouTube API에서 비디오 정보를 가져오는 함수 (현재는 Mock 구현)
 * 
 * @param videoId - YouTube 비디오 ID
 * @returns 비디오 제목과 썸네일 URL이 포함된 객체
 */
export const fetchVideoDetails = async (videoId: string) => {
  // 실제 구현에서는 백엔드 API를 호출하여 YouTube API와 통신
  // 현재는 Mock 데이터 반환
  return {
    title: `YouTube Video (${videoId})`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  }
}

/**
 * 타임스탬프를 포맷팅하는 함수
 * 
 * @param timestamp - 타임스탬프 (밀리초)
 * @returns 포맷팅된 시간 문자열 (HH:MM)
 */
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/**
 * 초를 MM:SS 형식으로 포맷팅하는 함수
 * 
 * @param seconds - 초
 * @returns 포맷팅된 시간 문자열 (MM:SS)
 */
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
} 