import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { roomStore } from '../services/roomStore';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

/**
 * HTTP 요청 핸들러
 * @param req - HTTP 요청 객체
 * @param res - HTTP 응답 객체
 */
export function handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
  // CORS 헤더 설정
  setCorsHeaders(res);

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url || "", true);

  // 헬스 체크 엔드포인트
  if (parsedUrl.pathname === "/health") {
    handleHealthCheck(res);
    return;
  }

  // 방 이름으로 방 검색 엔드포인트
  if (parsedUrl.pathname === "/rooms/by-name" && req.method === "GET") {
    handleGetRoomByName(parsedUrl.query, res);
    return;
  }

  // 방 이름 중복 체크 엔드포인트
  if (parsedUrl.pathname === "/rooms/check-name" && req.method === "GET") {
    handleCheckRoomName(parsedUrl.query, res);
    return;
  }

  // 방 목록 조회 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "GET") {
    handleGetRooms(res);
    return;
  }

  // 방 생성 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "POST") {
    handleCreateRoom(req, res);
    return;
  }

  // 비밀번호 확인 엔드포인트
  if (parsedUrl.pathname === "/rooms/verify-password" && req.method === "POST") {
    handleVerifyPassword(req, res);
    return;
  }

  // 404 Not Found
  res.writeHead(404);
  res.end("Not found");
}

/**
 * CORS 헤더 설정
 */
function setCorsHeaders(res: ServerResponse): void {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 헬스 체크 핸들러
 */
function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200);
  res.end("Healthy");
}

/**
 * 방 이름으로 방 검색 핸들러
 */
function handleGetRoomByName(query: any, res: ServerResponse): void {
  const roomName = query.name as string;
  
  if (!roomName) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Room name is required" }));
    return;
  }

  const room = roomStore.findRoomByName(roomName);
  
  if (room) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      exists: true, 
      roomId: room.roomId,
      isPasswordProtected: room.isPasswordProtected 
    }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exists: false }));
  }
}

/**
 * 방 이름 중복 체크 핸들러
 */
function handleCheckRoomName(query: any, res: ServerResponse): void {
  const roomName = query.name as string;
  
  if (!roomName) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Room name is required" }));
    return;
  }

  const isTaken = roomStore.isRoomNameTaken(roomName);
  
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ isTaken }));
}

/**
 * 방 목록 조회 핸들러
 */
function handleGetRooms(res: ServerResponse): void {
  try {
    // 방 목록 생성
    const roomsList = roomStore.getAllRooms().map(room => ({
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
}

/**
 * 방 생성 핸들러
 */
function handleCreateRoom(req: IncomingMessage, res: ServerResponse): void {
  let body = "";
  req.on("data", chunk => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const roomData = JSON.parse(body);
      const { roomId = generateId(), roomName, description, isPasswordProtected, password, createdBy, playlist } = roomData;

      // 이름 중복 체크
      if (roomStore.isRoomNameTaken(roomName)) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Room name already exists" }));
        return;
      }

      // 새로운 방 생성
      const room = roomStore.createRoom({
        roomId,
        roomName,
        description,
        hostId: createdBy?.id || "",
        isPasswordProtected,
        password,
        playlist
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, roomId: room.roomId }));
    } catch (error) {
      console.error("Error creating room:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create room" }));
    }
  });
}

/**
 * 비밀번호 확인 핸들러
 */
function handleVerifyPassword(req: IncomingMessage, res: ServerResponse): void {
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
      
      // 방 존재 여부 확인
      const room = roomStore.getRoom(roomId);
      if (!room) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Room not found" }));
        return;
      }
      
      // 비밀번호 검증
      const isPasswordCorrect = roomStore.verifyPassword(roomId, password);
      
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
} 