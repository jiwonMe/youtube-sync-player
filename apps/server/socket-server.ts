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

// EventLog 타입 정의
type EventLog = {
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

// PlayerState 타입 정의 추가
type PlayerState = {
  playing: boolean
  currentTime: number
  playbackRate?: number
  lastUpdated?: number
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
  playerState?: PlayerState // PlayerState 추가
  messages: ChatMessage[]
  eventLogs: EventLog[] // 이벤트 로그 배열 추가
  isPasswordProtected: boolean
  password?: string // 비밀번호 필드 추가
  createdAt: number
  autoplay: boolean // 자동 재생 설정 추가
  description?: string // 방 설명 필드 추가
  lastSyncTime?: number // 마지막 동기화 시간 추가
  videoControlPermission: 'host-only' | 'all-users' // 비디오 제어 권한 설정
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
          eventLogs: [], // 이벤트 로그 배열 초기화
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined, // 비밀번호가 설정된 경우에만 저장
          createdAt: Date.now(),
          autoplay: true,
          description: description, // 방 설명 추가
          lastSyncTime: Date.now(), // 마지막 동기화 시간 추가
          videoControlPermission: 'host-only', // 기본값은 방장만 제어 가능
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
      eventLogs: [], // 이벤트 로그 배열 초기화
      isPasswordProtected: false,
      createdAt: Date.now(),
      autoplay: true,
      lastSyncTime: Date.now(), // 마지막 동기화 시간 추가
      videoControlPermission: 'host-only', // 기본값은 방장만 제어 가능
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
    if (!room) return;
    
    // 호스트 권한 확인
    const isHost = userId === room.hostId;
    if (!isHost) {
      console.log(`[동기화 오류] 호스트가 아닌 사용자의 동기화 요청 무시: ${socket.id}`);
      return;
    }
    
    // 현재 시간이 거의 같은 경우는 불필요한 업데이트 방지
    const timeChanged = Math.abs(room.currentTime - data.currentTime) > 0.5;
    const stateChanged = room.isPlaying !== data.isPlaying;
    
    // 상태나 시간이 변경된 경우만 업데이트
    if (stateChanged || timeChanged) {
      // 룸 상태 업데이트
      room.isPlaying = data.isPlaying;
      room.currentTime = data.currentTime;
      room.lastSyncTime = Date.now();
      
      // 다른 참가자들에게 동기화 데이터 전송
      socket.to(roomId).emit("player:sync", {
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
        syncTime: Date.now(),
        videoId: data.videoId || room.currentVideo?.videoId,
      });
      
      console.log(`[동기화] 호스트(${socket.id})가 상태 동기화: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${data.currentTime.toFixed(2)}s`);
    }
  });

  // 클라이언트가 동기화 요청
  socket.on("player:requestSync", () => {
    if (!room) return;
    
    const hostUser = room.users.find(u => u.id === room.hostId);
    if (!hostUser) {
      console.log(`[동기화 요청 오류] 방(${roomId})에 호스트가 없습니다.`);
      return;
    }
    
    // 호스트가 아닌 사용자의 동기화 요청인 경우
    if (userId !== room.hostId) {
      console.log(`[동기화 요청] 사용자(${socket.id})가 동기화 요청`);
      
      // 호스트에게 이 사용자를 위한 동기화 데이터 요청
      io.to(hostUser.socketId).emit("player:requestSync", {
        userId: userId,
        socketId: socket.id
      });
    }
  });
  
  // 호스트가 특정 사용자에게 동기화 데이터 전송
  socket.on("player:syncTo", (data: { targetSocketId: string; isPlaying: boolean; currentTime: number; videoId?: string }) => {
    if (userId !== room.hostId) {
      console.log(`[동기화 오류] 호스트가 아닌 사용자의 syncTo 요청 무시: ${socket.id}`);
      return;
    }
    
    console.log(`[동기화 전송] 호스트가 사용자(${data.targetSocketId})에게 상태 전송: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${data.currentTime.toFixed(2)}s`);
    
    // 해당 사용자에게 동기화 데이터 전송
    io.to(data.targetSocketId).emit("player:sync", {
      isPlaying: data.isPlaying,
      currentTime: data.currentTime,
      syncTime: Date.now(),
      videoId: data.videoId || room.currentVideo?.videoId,
    });
  });

  // Handle player state change
  socket.on("player:stateChange", (data: { roomId: string; stateChange: { playing: boolean; currentTime: number; playbackRate?: number } }) => {
    const { roomId, stateChange } = data;
    const room = rooms.get(roomId);

    if (!room) {
      console.log(`[오류] 존재하지 않는 방(${roomId})에 대한 상태 변경 요청 무시`);
      return;
    }

    // 현재 소켓 ID로 사용자 조회
    const currentUser = room.users.find((u) => u.socketId === socket.id);
    if (!currentUser) {
      console.log(`[오류] 요청한 사용자를 룸(${roomId})에서 찾을 수 없습니다. 소켓 ID: ${socket.id}`);
      return;
    }

    // 비디오 제어 권한 확인
    const hasPermission = room.videoControlPermission === 'all-users' || currentUser.isHost;
    if (!hasPermission) {
      console.log(`[오류] 사용자(${currentUser.name})에게 비디오 제어 권한이 없습니다. 무시합니다.`);
      return; 
    }
    
    // 현재 방 상태와 요청 상태가 동일한 경우 불필요한 업데이트 방지
    if (room.isPlaying === stateChange.playing) {
      console.log(`[상태 변경 무시] 현재 상태(${room.isPlaying ? '재생' : '일시정지'})와 요청 상태(${stateChange.playing ? '재생' : '일시정지'})가 동일합니다.`);
      
      // 단, 시간이 크게 다른 경우는 업데이트 진행 (비디오 시크)
      if (Math.abs(room.currentTime - stateChange.currentTime) > 1) {
        console.log(`[시간 동기화] 상태는 동일하지만 시간이 다름. ${room.currentTime.toFixed(2)}s -> ${stateChange.currentTime.toFixed(2)}s`);
      } else {
        return; // 상태도 같고 시간도 유사하면 무시
      }
    }

    console.log(`[상태 변경] 룸(${roomId})에서 ${currentUser.name}님이 플레이어 상태를 변경: ${stateChange.playing ? '재생' : '일시정지'}, 시간: ${stateChange.currentTime.toFixed(2)}s`);

    // 이전 상태 임시 저장 (이벤트 로그 표시용)
    const previousState = room.isPlaying;
    
    // 룸의 재생 상태 업데이트
    room.isPlaying = stateChange.playing;
    room.currentTime = stateChange.currentTime;
    room.lastSyncTime = Date.now();

    // 상태 변경을 방의 다른 참가자들에게 발송 - 중요: 상태 변경이 있는 경우에만 이벤트 발송
    socket.to(roomId).emit("player:stateChange", {
      isPlaying: stateChange.playing,
      currentTime: stateChange.currentTime
    });

    // 상태가 실제로 변경되었을 때만 이벤트 로그 생성
    if (previousState !== stateChange.playing) {
      const eventType = stateChange.playing ? "play" : "pause";
      createEventLog(roomId, currentUser, eventType);
    }
  });

  // Handle autoplay toggle
  socket.on("autoplay:toggle", (data: { isPlaying: boolean; currentTime: number; autoplay: boolean }) => {
    if (!room) return;
    
    // 자동 재생 설정 업데이트
    room.autoplay = data.autoplay;
    room.isPlaying = data.isPlaying;
    room.currentTime = data.currentTime;
    
    // 다른 참가자들에게 전파
    socket.to(roomId).emit("autoplay:toggle", data);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      createEventLog(
        roomId, 
        user, 
        'autoplayToggle',
        { autoplay: data.autoplay }
      );
    }
  })

  // Handle video change
  socket.on("video:change", (videoId: string) => {
    if (!room) return;
    
    // 새 비디오 찾기
    const video = room.playlist.find((v) => v.videoId === videoId);
    
    if (video) {
      // 현재 비디오 업데이트
      room.currentVideo = video;
      room.currentTime = 0;
      room.isPlaying = true;
      room.lastSyncTime = Date.now(); // 최종 동기화 시간 업데이트
      
      // 다른 모든 참가자들에게 전파
      io.to(roomId).emit("video:change", videoId);
      
      // 이벤트 로그 생성
      const user = room.users.find(u => u.id === userId);
      if (user) {
        createEventLog(
          roomId, 
          user, 
          'videoChange',
          { videoId, videoTitle: video.title }
        );
      }
    }
  })

  // Handle playlist update
  socket.on("playlist:update", (playlist: VideoItem[]) => {
    if (!room) return;
    
    // 재생목록 업데이트
    room.playlist = playlist;
    
    // 다른 모든 참가자들에게 전파
    socket.to(roomId).emit("playlist:update", playlist);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      createEventLog(
        roomId, 
        user, 
        'playlistReorder'
      );
    }
  })

  // Handle adding a video to playlist
  socket.on("playlist:add", (video: VideoItem) => {
    if (!room) return;
    
    // 재생목록에 비디오 추가
    room.playlist.push(video);
    
    // 현재 재생 중인 비디오가 없는 경우, 새 비디오를 현재 비디오로 설정
    if (!room.currentVideo) {
      room.currentVideo = video;
      room.isPlaying = room.autoplay;
      room.currentTime = 0;
    }
    
    // 다른 모든 참가자들에게 전파
    io.to(roomId).emit("playlist:update", room.playlist);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      createEventLog(
        roomId, 
        user, 
        'playlistAdd',
        { videoId: video.videoId, videoTitle: video.title }
      );
    }
  })

  // Handle removing a video from playlist
  socket.on("playlist:remove", (videoId: string) => {
    if (!room) return;
    
    // 재생목록에서 제거할 비디오 찾기
    const videoIndex = room.playlist.findIndex((v) => v.videoId === videoId);
    
    if (videoIndex !== -1) {
      const removedVideo = room.playlist[videoIndex];
      
      // 재생목록에서 비디오 제거
      room.playlist.splice(videoIndex, 1);
      
      // 현재 재생 중인 비디오가 제거된 경우, 다음 비디오를 재생
      if (room.currentVideo && room.currentVideo.videoId === videoId) {
        if (room.playlist.length > 0) {
          // 다음 비디오 선택
          room.currentVideo = room.playlist[0];
          room.currentTime = 0;
          
          // 변경된 비디오 정보 전파
          io.to(roomId).emit("video:change", room.currentVideo.videoId);
        } else {
          // 재생목록이 비어있으면 현재 비디오 제거
          room.currentVideo = null;
          room.isPlaying = false;
        }
      }
      
      // 업데이트된 재생목록 전파
      io.to(roomId).emit("playlist:update", room.playlist);
      
      // 이벤트 로그 생성
      const user = room.users.find(u => u.id === userId);
      if (user) {
        createEventLog(
          roomId, 
          user, 
          'playlistRemove',
          { videoId, videoTitle: removedVideo.title }
        );
      }
    }
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
    if (!room) return;
    
    // 호스트 변경 - 로그 추가
    if (settings.hostId && settings.hostId !== room.hostId) {
      const oldHostId = room.hostId;
      
      // 현재 호스트가 변경을 요청했는지 확인
      if (userId === oldHostId) {
        // 호스트 변경
        room.hostId = settings.hostId;
        
        // 새 호스트 찾기
        const newHost = room.users.find(u => u.id === settings.hostId);
        
        if (newHost) {
          // 이벤트 로그 생성
          createEventLog(
            roomId, 
            newHost, 
            'hostChange'
          );
        }
        
        // 다른 모든 참가자들에게 전파
        io.to(roomId).emit("room:hostChange", {
          hostId: settings.hostId
        });
      }
    }
    
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
        // If host left, assign a new host randomly
        // 방에 남아있는 사용자 중 랜덤하게 새 호스트 선택
        const randomIndex = Math.floor(Math.random() * room.users.length);
        const newHost = room.users[randomIndex];
        room.hostId = newHost.id;
        
        // 모든 사용자의 isHost 플래그 초기화
        room.users.forEach(user => {
          user.isHost = user.id === newHost.id;
        });

        // Notify all users about the new host
        io.to(roomId).emit("host:changed", {
          id: newHost.id,
          name: newHost.name,
        });
        
        console.log(`New host assigned in room ${roomId}: ${newHost.name} (${newHost.id})`);
      }

      // Notify other users that someone left
      socket.to(roomId).emit("user:left", {
        id: userId,
        name: actualUserName,
      })
    }
  })

  // 시크 이벤트 (시간 이동) 추가
  socket.on("player:seek", (data: { currentTime: number }) => {
    if (!room) return;
    
    // 방의 현재 시간 업데이트
    room.currentTime = data.currentTime;
    room.lastSyncTime = Date.now(); // 최종 동기화 시간 업데이트
    
    // 다른 참가자들에게 전파
    socket.to(roomId).emit("player:seek", data);
    
    // 이벤트 로그 생성
    const user = room.users.find(u => u.id === userId);
    if (user) {
      createEventLog(
        roomId, 
        user, 
        'seek',
        { time: data.currentTime }
      );
    }
  });

  // 재생 이벤트 핸들러 추가
  socket.on("player:play", () => {
    if (!room) return;
    
    // 현재 사용자 가져오기
    const currentUser = room.users.find(u => u.id === userId);
    if (!currentUser) {
      console.log(`[오류] 요청한 사용자를 룸(${roomId})에서 찾을 수 없습니다. 소켓 ID: ${socket.id}`);
      return;
    }
    
    // 비디오 제어 권한 확인
    const hasPermission = room.videoControlPermission === 'all-users' || currentUser.isHost;
    if (!hasPermission) {
      console.log(`[오류] 사용자(${currentUser.name})에게 비디오 제어 권한이 없습니다. 무시합니다.`);
      return;
    }
    
    // 이미 재생 중이면 무시
    if (room.isPlaying) {
      console.log(`[상태 변경 무시] 이미 재생 중입니다.`);
      return;
    }
    
    console.log(`[상태 변경] 룸(${roomId})에서 ${currentUser.name}님이 영상을 재생했습니다.`);
    
    // 현재 시간 가져오기 (방 상태 기록용)
    const now = Date.now();
    
    // 방 상태 업데이트
    room.isPlaying = true;
    room.lastSyncTime = now;
    
    // 다른 모든 참가자들에게 전파
    socket.to(roomId).emit("player:play");
    
    // 이벤트 로그 생성
    createEventLog(roomId, currentUser, 'play');
  });
  
  // 일시정지 이벤트 핸들러 추가
  socket.on("player:pause", () => {
    if (!room) return;
    
    // 현재 사용자 가져오기
    const currentUser = room.users.find(u => u.id === userId);
    if (!currentUser) {
      console.log(`[오류] 요청한 사용자를 룸(${roomId})에서 찾을 수 없습니다. 소켓 ID: ${socket.id}`);
      return;
    }
    
    // 비디오 제어 권한 확인
    const hasPermission = room.videoControlPermission === 'all-users' || currentUser.isHost;
    if (!hasPermission) {
      console.log(`[오류] 사용자(${currentUser.name})에게 비디오 제어 권한이 없습니다. 무시합니다.`);
      return;
    }
    
    // 이미 일시정지 중이면 무시
    if (!room.isPlaying) {
      console.log(`[상태 변경 무시] 이미 일시정지 중입니다.`);
      return;
    }
    
    console.log(`[상태 변경] 룸(${roomId})에서 ${currentUser.name}님이 영상을 일시정지했습니다.`);
    
    // 현재 시간 가져오기 (방 상태 기록용)
    const now = Date.now();
    
    // 방 상태 업데이트
    room.isPlaying = false;
    room.lastSyncTime = now;
    
    // 다른 모든 참가자들에게 전파
    socket.to(roomId).emit("player:pause");
    
    // 이벤트 로그 생성
    createEventLog(roomId, currentUser, 'pause');
  });

  // 비디오 제어 권한 설정 변경 이벤트 핸들러 추가
  socket.on("video:controlPermission", (permission: 'host-only' | 'all-users') => {
    if (!room) return;
    
    // 호스트만 권한을 변경할 수 있음
    if (userId !== room.hostId) {
      console.log(`[권한 오류] 호스트가 아닌 사용자(${socket.id})가 제어 권한을 변경하려고 시도했습니다.`);
      return;
    }
    
    // 이전 권한 저장
    const previousPermission = room.videoControlPermission;
    
    // 권한 업데이트
    room.videoControlPermission = permission;
    
    console.log(`[제어 권한 변경] 룸(${roomId})의 비디오 제어 권한이 변경되었습니다: ${previousPermission} → ${permission}`);
    
    // 모든 참가자에게 권한 변경 알림
    io.to(roomId).emit("video:controlPermission", {
      permission: permission
    });
    
    // 권한이 변경된 경우 이벤트 로그 생성
    if (previousPermission !== permission) {
      // 사용자 정보 가져오기
      const user = room.users.find(u => u.id === userId);
      if (user) {
        createEventLog(
          roomId,
          user,
          'hostChange', // 기존 이벤트 타입 재사용 (또는 원하는 경우 새로운 이벤트 타입 추가)
          { 
            videoControlPermission: permission,
            note: permission === 'host-only' ? '방장만 영상 제어 가능' : '모든 사용자 영상 제어 가능'
          }
        );
      }
    }
  });
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

/**
 * Generate a unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * 이벤트 로그를 생성하고 Room의 eventLogs에 추가하는 함수
 * @param roomId - 이벤트가 발생한 방 ID
 * @param user - 이벤트를 발생시킨 사용자
 * @param eventType - 이벤트 타입
 * @param details - 이벤트 상세 정보
 */
function createEventLog(roomId: string, user: RoomUser, eventType: EventLog['eventType'], details?: EventLog['details']) {
  const room = rooms.get(roomId);
  if (!room) return;

  // 로그 생성을 위한 사용자 정보 확인
  console.log(`[이벤트 로그 생성] 방 ${roomId}, 이벤트: ${eventType}, 사용자: ${user.name} (ID: ${user.id}), 호스트: ${user.isHost ? "예" : "아니오"}`);

  // 시간을 포함한 이벤트 로그 생성
  const eventLogTime = Date.now();
  
  const eventLog: EventLog = {
    id: generateId(),
    user,
    eventType,
    details,
    timestamp: eventLogTime
  };
  
  // 이벤트 로그를 룸 상태에 추가
  room.eventLogs.push(eventLog);
  
  // 이벤트 유형에 따라 다른 로그 메시지 출력
  let logMessage = "";
  switch(eventType) {
    case 'play':
      logMessage = `${user.name}님이 영상을 재생했습니다.`;
      break;
    case 'pause':
      logMessage = `${user.name}님이 영상을 일시정지했습니다.`;
      break;
    case 'seek':
      logMessage = `${user.name}님이 ${details?.time || 0}초로 영상을 이동했습니다.`;
      break;
    case 'videoChange':
      logMessage = `${user.name}님이 "${details?.videoTitle || ''}"(으)로 영상을 변경했습니다.`;
      break;
    default:
      logMessage = `${user.name}님이 ${eventType} 이벤트를 발생시켰습니다.`;
  }
  
  console.log(`[이벤트 로그 전송] ${logMessage} (timestamp: ${new Date(eventLogTime).toISOString()})`);
  
  // 방에 있는 모든 사용자에게 이벤트 로그 전파
  io.to(roomId).emit("room:eventLog", eventLog);
  
  // 최대 100개의 로그만 유지 (성능 최적화)
  if (room.eventLogs.length > 100) {
    room.eventLogs = room.eventLogs.slice(-100);
  }
  
  return eventLog;
}
