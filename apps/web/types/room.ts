/**
 * 방 관련 타입 정의
 */

// Room User 타입
export type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
}

// Chat Message 타입
export type ChatMessage = {
  id: string
  user: RoomUser
  message: string
  timestamp: number
}

// Video Item 타입
export type VideoItem = {
  id: string
  videoId: string
  title: string
  thumbnailUrl: string
}

// Room State 타입
export type RoomState = {
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
  autoplay: boolean
}

// Mock data for initial rendering
export const mockRoomData: RoomState = {
  roomName: "Loading Room...",
  hostId: "",
  users: [],
  currentVideo: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  messages: [],
  autoplay: true,
} 