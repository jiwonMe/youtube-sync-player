import { Server } from "socket.io"
import { createServer } from "http"
import { parse } from "url"
import dotenv from "dotenv"
import type { RoomUser, VideoItem, ChatMessage } from "shared"

/**
 * Nickname generator를 위한 데이터 배열
 */
const adjectives = [
  "행복한", "빛나는", "귀여운", "용감한", "똑똑한", "친절한", "부지런한", "재미있는",
  "활발한", "차분한", "우아한", "신비로운", "멋진", "즐거운", "날쌘", "현명한"
];

const colors = [
  "빨간", "파란", "초록", "노란", "보라", "주황", "분홍", "하얀", 
  "검은", "은색", "금색", "청록", "남색", "연두", "자주", "밤색"
];

const animals = [
  "판다", "코알라", "호랑이", "사자", "기린", "코끼리", "토끼", "거북이",
  "여우", "늑대", "곰", "펭귄", "고래", "돌고래", "사슴", "캥거루"
];

const plants = [
  "장미", "해바라기", "진달래", "벚꽃", "민들레", "국화", "튤립", "무궁화",
  "목련", "연꽃", "코스모스", "라일락", "수선화", "데이지", "유칼립투스", "호박"
];

/**
 * 랜덤 닉네임을 생성하는 함수
 * @returns {string} 형용사, 색상, 동물/식물을 조합한 랜덤 닉네임
 */
function generateRandomNickname(): string {
  // 각 배열에서 랜덤 요소 선택
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // 동물과 식물 중 랜덤하게 하나 선택
  const useAnimal = Math.random() > 0.5;
  const noun = useAnimal 
    ? animals[Math.floor(Math.random() * animals.length)]
    : plants[Math.floor(Math.random() * plants.length)];
    
  // 최종 닉네임 생성 (형용사 + 색상 + 명사)
  return `${adjective} ${color} ${noun}`;
}

// RoomState 타입 정의 추가
type RoomState = {
  roomId: string
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
  isPasswordProtected: boolean
  password?: string // 비밀번호 필드 추가
  createdAt: number
  autoplay: boolean // 자동 재생 설정 추가
  description?: string // 방 설명 필드 추가
  lastSyncTime?: number // 마지막 동기화 시간 추가
}

// Load environment variables
dotenv.config()

// In-memory store for rooms
const rooms = new Map<string, RoomState>()
// Map to find rooms by name (lowercase for case-insensitive lookup)
const roomsByName = new Map<string, string>() // Maps roomName (lowercase) to roomId

// Helper function to find a room by name (case-insensitive)
function findRoomByName(name: string): RoomState | null {
  const roomId = roomsByName.get(name.toLowerCase())
  if (roomId) {
    return rooms.get(roomId) || null
  }
  return null
}

// Helper function to check if a room name is already taken
function isRoomNameTaken(name: string): boolean {
  return roomsByName.has(name.toLowerCase())
}

// Create HTTP server
const httpServer = createServer((req, res) => {
  const parsedUrl = parse(req.url || "", true)

  if (parsedUrl.pathname === "/health") {
    res.writeHead(200)
    res.end("Healthy")
    return
  }

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 방 이름으로 룸 검색 엔드포인트
  if (parsedUrl.pathname === "/rooms/by-name" && req.method === "GET") {
    const roomName = parsedUrl.query.name as string
    
    if (!roomName) {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Room name is required" }))
      return
    }

    const room = findRoomByName(roomName)
    
    if (room) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ 
        exists: true, 
        roomId: room.roomId,
        isPasswordProtected: room.isPasswordProtected 
      }))
    } else {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ exists: false }))
    }
    return
  }

  // 방 이름 중복 체크 엔드포인트
  if (parsedUrl.pathname === "/rooms/check-name" && req.method === "GET") {
    const roomName = parsedUrl.query.name as string
    
    if (!roomName) {
      res.writeHead(400, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Room name is required" }))
      return
    }

    const isTaken = isRoomNameTaken(roomName)
    
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ 
      isTaken: isTaken 
    }))
    return
  }

  // 방 목록 조회 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "GET") {
    try {
      // 방 목록 생성
      const roomsList = Array.from(rooms.values()).map(room => ({
        roomId: room.roomId,
        roomName: room.roomName,
        description: room.description || "",
        isPasswordProtected: room.isPasswordProtected,
        createdBy: room.hostId,
        createdAt: new Date(room.createdAt).toISOString(),
        userCount: room.users.length
      }));
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(roomsList));
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch rooms" }));
    }
    return;
  }

  // 방 생성 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const roomData = JSON.parse(body);
        const { roomId, roomName, description, isPasswordProtected, password, createdBy, playlist } = roomData;

        // 이름 중복 체크
        if (isRoomNameTaken(roomName)) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Room name already exists" }));
          return;
        }

        // 새로운 방 생성
        rooms.set(roomId, {
          roomId,
          roomName,
          hostId: createdBy?.id || "",
          users: [],
          currentVideo: playlist?.length > 0 ? {
            id: playlist[0].id,
            videoId: playlist[0].videoId,
            title: playlist[0].title,
            thumbnailUrl: playlist[0].thumbnailUrl
          } : null,
          playlist: playlist || [], // 플레이리스트 전체를 그대로 사용
          isPlaying: false,
          currentTime: 0,
          messages: [],
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined, // 비밀번호가 설정된 경우에만 저장
          createdAt: Date.now(),
          autoplay: true,
          description: description, // 방 설명 추가
          lastSyncTime: Date.now(), // 마지막 동기화 시간 추가
        });

        // 이름으로도 방을 찾을 수 있도록 매핑 추가
        roomsByName.set(roomName.toLowerCase(), roomId);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, roomId }));
      } catch (error) {
        console.error("Error creating room:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to create room" }));
      }
    });
    return;
  }

  // 비밀번호 확인 엔드포인트 추가
  if (parsedUrl.pathname === "/rooms/verify-password" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { roomId, password } = JSON.parse(body);
        
        if (!roomId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Room ID is required" }));
          return;
        }
        
        const room = rooms.get(roomId);
        
        if (!room) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Room not found" }));
          return;
        }
        
        if (!room.isPasswordProtected) {
          // 비밀번호가 필요없는 방이면 바로 성공 응답
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
          return;
        }
        
        // 비밀번호 검증
        const isPasswordCorrect = room.password === password;
        
        res.writeHead(isPasswordCorrect ? 200 : 403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
          success: isPasswordCorrect,
          message: isPasswordCorrect ? "Password correct" : "Incorrect password" 
        }));
      } catch (error) {
        console.error("Error verifying password:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to verify password" }));
      }
    });
    return;
  }

  res.writeHead(404)
  res.end("Not found")
})

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
    credentials: true,
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

  // 사용자 이름이 없거나 "guest"인 경우 랜덤 닉네임 생성
  const actualUserName = (!userName || userName === "guest") ? generateRandomNickname() : userName;

  console.log(`User ${actualUserName} (${userId}) connected to room ${roomId}`)

  // Join the room
  socket.join(roomId)

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      roomName: "YouTube Room",
      hostId: userId, // First user becomes host
      users: [],
      currentVideo: null,
      playlist: [],
      isPlaying: false,
      currentTime: 0,
      messages: [],
      isPasswordProtected: false,
      createdAt: Date.now(),
      autoplay: true,
      lastSyncTime: Date.now(), // 마지막 동기화 시간 추가
    })
  }

  // Get room
  const room = rooms.get(roomId)!

  // Add user to room if not already present
  const existingUserIndex = room.users.findIndex((u: RoomUser) => u.id === userId)

  if (existingUserIndex === -1) {
    // Add new user
    const user: RoomUser = {
      id: userId,
      name: actualUserName,
      image: userImage,
      isHost: userId === room.hostId,
      socketId: socket.id,
    }
    room.users.push(user)
  } else {
    // Update existing user's socket ID
    room.users[existingUserIndex].socketId = socket.id
    // 이름도 업데이트 (사용자가 다시 접속했을 때 이름이 변경되었을 수 있음)
    room.users[existingUserIndex].name = actualUserName
  }

  // Send current room state to the new user
  socket.emit("room:state", room)

  // Notify other users that someone joined
  socket.to(roomId).emit("user:joined", {
    id: userId,
    name: actualUserName,
    image: userImage,
    isHost: userId === room.hostId,
  })

  // 주기적인 동기화: 호스트로부터 현재 재생 상태 수신
  socket.on("player:sync", (data: { isPlaying: boolean; currentTime: number; videoId?: string }) => {
    // 호스트로부터의 동기화 요청인지 확인
    if (userId === room.hostId) {
      // 방 상태 업데이트
      room.isPlaying = data.isPlaying;
      room.currentTime = data.currentTime;
      room.lastSyncTime = Date.now();
      
      // 비디오 ID가 변경된 경우 현재 비디오 업데이트
      if (data.videoId && room.currentVideo && room.currentVideo.videoId !== data.videoId) {
        const video = room.playlist.find(v => v.videoId === data.videoId);
        if (video) {
          room.currentVideo = video;
        }
      }
      
      // 다른 사용자들에게 동기화 데이터 브로드캐스트
      socket.to(roomId).emit("player:sync", {
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        syncTime: room.lastSyncTime,
        videoId: room.currentVideo?.videoId,
      });
    }
  });

  // 비호스트 클라이언트에서 동기화 요청
  socket.on("player:requestSync", () => {
    // 방 상태를 호스트에게 동기화 요청
    const hostUser = room.users.find(u => u.id === room.hostId);
    if (hostUser) {
      io.to(hostUser.socketId).emit("player:requestSync", {
        userId: userId,
        socketId: socket.id
      });
    } else {
      // 호스트가 없으면 현재 서버에 저장된 상태 전송
      socket.emit("player:sync", {
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        syncTime: room.lastSyncTime,
        videoId: room.currentVideo?.videoId,
      });
    }
  });

  // 호스트가 특정 사용자에게 동기화 데이터 전송
  socket.on("player:syncTo", (data: { targetSocketId: string; isPlaying: boolean; currentTime: number; videoId?: string }) => {
    if (userId === room.hostId) {
      io.to(data.targetSocketId).emit("player:sync", {
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        syncTime: Date.now(),
        videoId: data.videoId || room.currentVideo?.videoId,
      });
    }
  });

  // Handle player state change
  socket.on("player:stateChange", (data: { isPlaying: boolean; currentTime: number }) => {
    // Update room state
    room.isPlaying = data.isPlaying
    room.currentTime = data.currentTime
    room.lastSyncTime = Date.now()

    // Broadcast to other users
    socket.to(roomId).emit("player:stateChange", data)
  })

  // Handle autoplay toggle
  socket.on("autoplay:toggle", (data: { isPlaying: boolean; currentTime: number; autoplay: boolean }) => {
    // Update room state
    room.autoplay = !data.autoplay // Toggle autoplay state

    // Broadcast to other users
    socket.to(roomId).emit("autoplay:toggle", {
      autoplay: room.autoplay
    })
  })

  // Handle video change
  socket.on("video:change", (videoId: string) => {
    // Find the video in the playlist
    const video = room.playlist.find((v: VideoItem) => v.id === videoId)

    if (video) {
      // Update room state
      room.currentVideo = video
      room.currentTime = 0
      room.isPlaying = true

      // Broadcast to other users
      socket.to(roomId).emit("video:change", {
        videoId: video.videoId,
        currentTime: 0,
      })
    }
  })

  // Handle playlist update
  socket.on("playlist:update", (playlist: VideoItem[]) => {
    // Update room state
    room.playlist = playlist

    // Broadcast to other users
    socket.to(roomId).emit("playlist:update", playlist)
  })

  // Handle adding a video to playlist
  socket.on("playlist:add", (video: VideoItem) => {
    // Add video to playlist if it doesn't exist
    if (!room.playlist.some((v: VideoItem) => v.id === video.id)) {
      room.playlist.push(video)
    }

    // If no video is currently playing, set this as current
    if (!room.currentVideo) {
      room.currentVideo = video
      room.currentTime = 0
      room.isPlaying = true
      
      // Notify all users about the video change
      io.to(roomId).emit("video:change", {
        videoId: video.videoId,
        currentTime: 0,
      })
    }

    // Broadcast updated playlist to all users
    io.to(roomId).emit("playlist:update", room.playlist)
  })

  // Handle removing a video from playlist
  socket.on("playlist:remove", (videoId: string) => {
    // Remove video from playlist
    room.playlist = room.playlist.filter((v: VideoItem) => v.id !== videoId)

    // If current video was removed, set next video as current
    if (room.currentVideo && room.currentVideo.id === videoId) {
      room.currentVideo = room.playlist.length > 0 ? room.playlist[0] : null
      room.currentTime = 0
      room.isPlaying = false

      // Notify all users about the video change
      if (room.currentVideo) {
        io.to(roomId).emit("video:change", {
          videoId: room.currentVideo.videoId,
          currentTime: 0,
        })
      }
    }

    // Broadcast updated playlist to all users
    io.to(roomId).emit("playlist:update", room.playlist)
  })

  // Handle chat message
  socket.on("chat:message", (message: string) => {
    // Create message object
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      userName: actualUserName,
      userImage,
      message,
      timestamp: Date.now(),
    }

    // Add message to room
    room.messages.push(chatMessage)

    // Broadcast to all users including sender
    io.to(roomId).emit("chat:message", chatMessage)
  })

  // Handle room settings update
  socket.on("room:update", (settings: Partial<RoomState>) => {
    // Only allow host to update room settings
    if (userId === room.hostId) {
      // 만약 룸 이름이 변경되었다면, 매핑도 업데이트
      if (settings.roomName && settings.roomName !== room.roomName) {
        // 새 이름이 이미 사용중인지 확인
        if (isRoomNameTaken(settings.roomName)) {
          // 같은 방의 이름 변경인 경우는 허용 (대소문자만 변경 등)
          const existingRoom = findRoomByName(settings.roomName)
          if (existingRoom && existingRoom.roomId !== roomId) {
            // 다른 방이 이미 해당 이름을 사용 중이므로 이름 변경 거부
            socket.emit("room:update:error", {
              message: "Room name already taken"
            })
            return
          }
        }
        
        // 기존 이름 매핑 제거
        roomsByName.delete(room.roomName.toLowerCase())
        
        // 새 이름 매핑 추가
        roomsByName.set(settings.roomName.toLowerCase(), roomId)
      }
      
      // Update room settings
      Object.assign(room, settings)

      // Broadcast updated room state to all users
      io.to(roomId).emit("room:state", room)
    }
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User ${actualUserName} (${userId}) disconnected from room ${roomId}`)

    // Remove user from room
    if (room) {
      room.users = room.users.filter((u: RoomUser) => u.id !== userId)

      // If room is empty, remove it after a delay
      if (room.users.length === 0) {
        setTimeout(() => {
          // Check again if room is still empty
          const currentRoom = rooms.get(roomId)
          if (currentRoom && currentRoom.users.length === 0) {
            // 방 이름 매핑도 함께 제거
            roomsByName.delete(currentRoom.roomName.toLowerCase())
            rooms.delete(roomId)
            console.log(`Room ${roomId} (${currentRoom.roomName}) removed due to inactivity`)
          }
        }, 60000) // 1 minute delay
      } else if (userId === room.hostId) {
        // If host left, assign a new host
        const newHost = room.users[0]
        room.hostId = newHost.id
        newHost.isHost = true

        // Notify all users about the new host
        io.to(roomId).emit("host:changed", {
          id: newHost.id,
          name: newHost.name,
        })
      }

      // Notify other users that someone left
      socket.to(roomId).emit("user:left", {
        id: userId,
        name: actualUserName,
      })
    }
  })
})

// Start server with port fallback mechanism
const PORT = parseInt(process.env.PORT || '3003', 10);
let currentPort = PORT;
const MAX_PORT_ATTEMPTS = 10;

function startServer(port: number, attempts = 0) {
  if (attempts >= MAX_PORT_ATTEMPTS) {
    console.error(`Failed to start server after ${MAX_PORT_ATTEMPTS} attempts`);
    process.exit(1);
    return;
  }

  httpServer.listen(port)
    .on('listening', () => {
      console.log(`Socket server running on port ${port}`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, trying ${port + 1} instead.`);
        startServer(port + 1, attempts + 1);
      } else {
        console.error('Socket server error:', err);
        process.exit(1);
      }
    });
}

startServer(currentPort);
