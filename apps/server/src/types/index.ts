import type { RoomUser, VideoItem, ChatMessage } from "shared"

/**
 * EventLog 타입 - 룸 내 발생하는 이벤트 기록
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

/**
 * PlayerState 타입 - 플레이어의 현재 상태
 */
export type PlayerState = {
  playing: boolean
  currentTime: number
  playbackRate?: number
  lastUpdated?: number
}

/**
 * RoomState 타입 - 룸의 전체 상태
 */
export type RoomState = {
  roomId: string
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  playerState?: PlayerState
  messages: ChatMessage[]
  eventLogs: EventLog[]
  isPasswordProtected: boolean
  password?: string
  createdAt: number
  autoplay: boolean
  description?: string
  lastSyncTime?: number
  videoControlPermission: 'host-only' | 'all-users'
}

export type VideoControlPermission = 'host-only' | 'all-users' 