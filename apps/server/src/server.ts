import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import { handleHttpRequest } from "./handlers/http";
import { generateRandomNickname } from "./utils/nameGenerator";
import { logger } from "./utils/logger";
import config from "./config";

// 플레이어 핸들러
import {
  handlePlayerStateChange,
  handlePlayerSync,
  handleRequestSync,
  handleSyncTo,
  handleAutoplayToggle,
  handleSeek,
  handlePlay,
  handlePause,
  handleVideoControlPermission
} from "./handlers/player";

// 플레이리스트 핸들러
import {
  handleVideoChange,
  handlePlaylistUpdate,
  handlePlaylistAdd,
  handlePlaylistRemove
} from "./handlers/playlist";

// 채팅 핸들러
import { handleChatMessage } from "./handlers/chat";

// 룸 핸들러
import {
  handleUserConnect,
  handleUserDisconnect,
  handleRoomUpdate
} from "./handlers/room";

// 환경 변수 로드
dotenv.config();

// HTTP 서버 생성
const httpServer = createServer(handleHttpRequest);

// Socket.io 서버 생성
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io 연결 핸들러
io.on("connection", (socket) => {
  // 쿼리 파라미터 가져오기
  const { roomId, userId, userName, userImage } = socket.handshake.query as {
    roomId: string;
    userId: string;
    userName: string;
    userImage: string;
  };

  // 사용자 이름이 없거나 "guest"인 경우 랜덤 닉네임 생성
  const actualUserName = (!userName || userName === "guest") ? generateRandomNickname() : userName;

  logger.info("Socket", `User ${actualUserName} (${userId}) connected to room ${roomId}`);

  // 방 입장
  socket.join(roomId);

  // 사용자 연결 처리
  const user = handleUserConnect(socket, io, {
    roomId,
    userId,
    userName: actualUserName,
    userImage
  });

  if (!user) {
    logger.error("Socket", `Failed to connect user ${userId} to room ${roomId}`);
    return;
  }

  // 방 상태 전송
  const room = io.sockets.adapter.rooms.get(roomId);
  if (room) {
    socket.emit("room:state", room);
  }

  // 다른 사용자들에게 누군가 입장했음을 알림
  socket.to(roomId).emit("user:joined", {
    id: userId,
    name: actualUserName,
    image: userImage,
    isHost: user.isHost,
  });

  // 플레이어 상태 변경 이벤트 핸들러
  socket.on("player:stateChange", (data) => {
    handlePlayerStateChange(socket, io, data);
  });

  // 플레이어 동기화 이벤트 핸들러
  socket.on("player:sync", (data) => {
    handlePlayerSync(socket, data, userId, roomId);
  });

  // 동기화 요청 핸들러
  socket.on("player:requestSync", () => {
    handleRequestSync(socket, io, userId, roomId);
  });

  // 특정 사용자 동기화 핸들러
  socket.on("player:syncTo", (data) => {
    handleSyncTo(socket, io, data, userId, roomId);
  });

  // 자동 재생 설정 변경 핸들러
  socket.on("autoplay:toggle", (data) => {
    handleAutoplayToggle(socket, data, userId, roomId);
  });

  // 비디오 변경 핸들러
  socket.on("video:change", (videoId) => {
    handleVideoChange(socket, io, videoId, userId, roomId);
  });

  // 플레이리스트 업데이트 핸들러
  socket.on("playlist:update", (playlist) => {
    handlePlaylistUpdate(socket, playlist, userId, roomId);
  });

  // 플레이리스트 항목 추가 핸들러
  socket.on("playlist:add", (video) => {
    handlePlaylistAdd(socket, io, video, userId, roomId);
  });

  // 플레이리스트 항목 제거 핸들러
  socket.on("playlist:remove", (videoId) => {
    handlePlaylistRemove(socket, io, videoId, userId, roomId);
  });

  // 채팅 메시지 핸들러
  socket.on("chat:message", (message) => {
    handleChatMessage(socket, io, message, userId, actualUserName, userImage, roomId);
  });

  // 방 설정 업데이트 핸들러
  socket.on("room:update", (settings) => {
    handleRoomUpdate(socket, io, settings, userId, roomId);
  });

  // 시크 이벤트 핸들러
  socket.on("player:seek", (data) => {
    handleSeek(socket, data, userId, roomId);
  });

  // 재생 이벤트 핸들러
  socket.on("player:play", () => {
    handlePlay(socket, userId, roomId);
  });

  // 일시정지 이벤트 핸들러
  socket.on("player:pause", () => {
    handlePause(socket, userId, roomId);
  });

  // 비디오 제어 권한 설정 핸들러
  socket.on("video:controlPermission", (permission) => {
    handleVideoControlPermission(socket, io, permission, userId, roomId);
  });

  // 연결 해제 핸들러
  socket.on("disconnect", () => {
    handleUserDisconnect(socket, io, userId, roomId);
    logger.info("Socket", `User ${actualUserName} (${userId}) disconnected from room ${roomId}`);
  });
});

// 서버 시작 (포트 폴백 메커니즘 포함)
const PORT = config.port;
const MAX_PORT_ATTEMPTS = 10;

function startServer(port: number, attempts = 0): void {
  if (attempts >= MAX_PORT_ATTEMPTS) {
    logger.error("Server", `Failed to start server after ${MAX_PORT_ATTEMPTS} attempts`);
    process.exit(1);
    return;
  }

  httpServer.listen(port)
    .on('listening', () => {
      logger.info("Server", `Socket server running on port ${port} in ${config.nodeEnv} mode`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn("Server", `Port ${port} is in use, trying ${port + 1} instead`);
        startServer(port + 1, attempts + 1);
      } else {
        logger.error("Server", `Socket server error: ${err.message}`, err);
        process.exit(1);
      }
    });
}

// 예상치 못한 예외 처리
process.on('uncaughtException', (err) => {
  logger.error("Process", `Uncaught Exception: ${err.message}`, err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error("Process", `Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// 서버 시작
startServer(PORT); 