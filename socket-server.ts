import { Server } from "socket.io"
import { createServer } from "http"
import { parse } from "url"

// Types
type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
  socketId: string
}

type RoomState = {
  roomId: string
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideoId: string | null
  playlist: string[]
  isPlaying: boolean
  currentTime: number
}

// In-memory store for rooms
const rooms = new Map<string, RoomState>()

// Create HTTP server
const httpServer = createServer((req, res) => {
  const parsedUrl = parse(req.url || "", true)

  if (parsedUrl.pathname === "/health") {
    res.writeHead(200)
    res.end("Healthy")
    return
  }

  res.writeHead(404)
  res.end("Not found")
})

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
  },
})

// Socket.io connection handler
io.on("connection", (socket) => {
  // Get query parameters
  const { roomId, userId, userName, userImage } = socket.handshake.query as {
    roomId: string
    userId: string
    userName: string
    userImage: string
  }

  console.log(`User ${userName} (${userId}) connected to room ${roomId}`)

  // Join the room
  socket.join(roomId)

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      roomName: "YouTube Room",
      hostId: userId, // First user becomes host
      users: [],
      currentVideoId: null,
      playlist: [],
      isPlaying: false,
      currentTime: 0,
    })
  }

  // Get room
  const room = rooms.get(roomId)!

  // Add user to room
  const user: RoomUser = {
    id: userId,
    name: userName,
    image: userImage,
    isHost: userId === room.hostId,
    socketId: socket.id,
  }

  room.users.push(user)

  // Send current room state to the new user
  socket.emit("room:state", room)

  // Notify other users that someone joined
  socket.to(roomId).emit("user:joined", user)

  // Handle player state change
  socket.on("player:stateChange", (data: { isPlaying: boolean; currentTime: number }) => {
    // Update room state
    room.isPlaying = data.isPlaying
    room.currentTime = data.currentTime

    // Broadcast to other users
    socket.to(roomId).emit("player:stateChange", data)
  })

  // Handle video change
  socket.on("video:change", (videoId: string) => {
    // Update room state
    room.currentVideoId = videoId
    room.currentTime = 0
    room.isPlaying = true

    // Broadcast to other users
    socket.to(roomId).emit("video:change", { videoId, currentTime: 0 })
  })

  // Handle playlist update
  socket.on("playlist:update", (playlist: string[]) => {
    // Update room state
    room.playlist = playlist

    // Broadcast to other users
    socket.to(roomId).emit("playlist:update", playlist)
  })

  // Handle chat message
  socket.on("chat:message", (message: string) => {
    // Broadcast to all users including sender
    io.to(roomId).emit("chat:message", {
      userId,
      userName,
      userImage,
      message,
      timestamp: Date.now(),
    })
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User ${userName} (${userId}) disconnected from room ${roomId}`)

    // Remove user from room
    room.users = room.users.filter((u) => u.socketId !== socket.id)

    // If room is empty, remove it
    if (room.users.length === 0) {
      rooms.delete(roomId)
      return
    }

    // If host left, assign new host
    if (userId === room.hostId && room.users.length > 0) {
      room.hostId = room.users[0].id
      room.users[0].isHost = true
    }

    // Notify other users that someone left
    socket.to(roomId).emit("user:left", userId)
  })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})

