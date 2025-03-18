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

/**
 * Event Log 타입 - 이벤트 로그 메시지를 위한 타입
 */
export type EventLog = {
  id: string
  user: RoomUser
  eventType: 'play' | 'pause' | 'seek' | 'videoChange' | 'playlistAdd' | 'playlistRemove' | 'playlistReorder' | 'hostChange' | 'userJoin' | 'userLeave' | 'autoplayToggle'
  details?: {
    videoTitle?: string
    videoId?: string
    time?: number
    autoplay?: boolean
    [key: string]: any
  }
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
  eventLogs: EventLog[]
  autoplay: boolean
  videoControlPermission: 'host-only' | 'all-users'
  playPermission: 'host-only' | 'all-users'
  seekPermission: 'host-only' | 'all-users'
  videoChangePermission: 'host-only' | 'all-users'
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
  eventLogs: [],
  autoplay: true,
  videoControlPermission: 'host-only',
  playPermission: 'host-only',
  seekPermission: 'host-only',
  videoChangePermission: 'host-only'
}
