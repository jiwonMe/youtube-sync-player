import { EventEmitter } from "events"

// Types
export type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
}

export type ChatMessage = {
  id: string
  user: RoomUser
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
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
}

// Mock socket implementation using EventEmitter
class MockSocket extends EventEmitter {
  private roomState: RoomState
  private userId: string
  private userName: string
  private userImage: string

  constructor(roomId: string, userId: string, userName: string, userImage: string) {
    super()
    this.userId = userId
    this.userName = userName
    this.userImage = userImage

    // Initialize with mock data
    this.roomState = {
      roomId,
      roomName: "React Development Videos",
      hostId: "host-123",
      users: [
        {
          id: "host-123",
          name: "Room Host",
          image: "/placeholder.svg?height=40&width=40",
          isHost: true,
        },
        {
          id: userId,
          name: userName,
          image: userImage || "/placeholder.svg?height=40&width=40",
        },
        {
          id: "user-789",
          name: "Jane Smith",
          image: "/placeholder.svg?height=40&width=40",
        },
      ],
      currentVideo: {
        id: "video-1",
        videoId: "w7ejDZ8SWv8",
        title: "React JS Crash Course",
        thumbnailUrl: "https://i.ytimg.com/vi/w7ejDZ8SWv8/mqdefault.jpg",
      },
      playlist: [
        {
          id: "video-1",
          videoId: "w7ejDZ8SWv8",
          title: "React JS Crash Course",
          thumbnailUrl: "https://i.ytimg.com/vi/w7ejDZ8SWv8/mqdefault.jpg",
        },
        {
          id: "video-2",
          videoId: "Rh3tobg7hEo",
          title: "Next.js for Beginners",
          thumbnailUrl: "https://i.ytimg.com/vi/Rh3tobg7hEo/mqdefault.jpg",
        },
        {
          id: "video-3",
          videoId: "4UZrsTqkcW4",
          title: "Full React Tutorial",
          thumbnailUrl: "https://i.ytimg.com/vi/4UZrsTqkcW4/mqdefault.jpg",
        },
      ],
      isPlaying: false,
      currentTime: 0,
      messages: [
        {
          id: "msg-1",
          user: { id: "host-123", name: "Room Host", image: "/placeholder.svg?height=40&width=40" },
          message: "Welcome to the room! We're watching React tutorials today.",
          timestamp: Date.now() - 300000,
        },
        {
          id: "msg-2",
          user: { id: "user-789", name: "Jane Smith", image: "/placeholder.svg?height=40&width=40" },
          message: "Thanks for having us! I'm excited to learn together.",
          timestamp: Date.now() - 120000,
        },
      ],
    }

    // Emit initial state after a short delay to simulate network
    setTimeout(() => {
      this.emit("room:state", this.roomState)
    }, 1000)
  }

  // Mock socket.io emit method
  emit(event: string, data: any) {
    console.log(`[MockSocket] Emitting ${event}:`, data)

    // Simulate server processing and response
    setTimeout(() => {
      this.handleServerEvent(event, data)
    }, 100)

    return this
  }

  // Handle events that would normally be processed by the server
  private handleServerEvent(event: string, data: any) {
    switch (event) {
      case "player:stateChange":
        this.roomState.isPlaying = data.isPlaying
        this.roomState.currentTime = data.currentTime
        // Broadcast to "other users" (which is just back to self in this mock)
        super.emit("player:stateChange", data)
        break

      case "video:change":
        const video = this.roomState.playlist.find((v) => v.id === data)
        if (video) {
          this.roomState.currentVideo = video
          this.roomState.currentTime = 0
          this.roomState.isPlaying = true
          super.emit("video:change", { videoId: video.videoId, currentTime: 0 })
        }
        break

      case "chat:message":
        const newMessage = {
          id: `msg-${Date.now()}`,
          user: {
            id: this.userId,
            name: this.userName,
            image: this.userImage || "/placeholder.svg?height=40&width=40",
          },
          message: data,
          timestamp: Date.now(),
        }
        this.roomState.messages.push(newMessage)
        super.emit("chat:message", newMessage)
        break
    }
  }

  // Mock disconnect
  disconnect() {
    console.log("[MockSocket] Disconnected")
    this.removeAllListeners()
  }
}

// Factory function to create a mock socket
export function createMockSocket(roomId: string, userId: string, userName: string, userImage: string) {
  return new MockSocket(roomId, userId, userName, userImage)
}

