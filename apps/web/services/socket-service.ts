import { io, type Socket } from "socket.io-client"
import { createMockSocket } from "./mock-socket-service"

// Types
export type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
}

export type ChatMessage = {
  id: string
  userId: string
  userName: string
  userImage?: string
  message: string
  timestamp: number
}

export type VideoItem = {
  id: string
  videoId: string
  title: string
  thumbnailUrl: string
}

export type RoomState = {
  roomId: string
  roomName: string
  description?: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
  isPasswordProtected: boolean
}

// Socket connection function
export function connectToRoom(roomId: string, userId: string, userName: string, userImage = ""): Socket {
  // Use mock socket if no SOCKET_URL is provided
  if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
    console.warn("No SOCKET_URL provided, using mock socket")
    return createMockSocket(roomId, userId, userName, userImage) as unknown as Socket
  }

  // Connect to real socket server
  return io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    query: { roomId, userId, userName, userImage },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  })
}

