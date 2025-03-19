import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { roomSupabaseStore } from '../services/roomSupabaseStore';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

/**
 * HTTP 요청 핸들러
 * @param req - HTTP 요청 객체
 * @param res - HTTP 응답 객체
 */
export async function handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
    await handleGetRoomByName(parsedUrl.query, res);
    return;
  }

  // 방 이름 중복 체크 엔드포인트
  if (parsedUrl.pathname === "/rooms/check-name" && req.method === "GET") {
    await handleCheckRoomName(parsedUrl.query, res);
    return;
  }

  // 방 목록 조회 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "GET") {
    await handleGetRooms(res);
    return;
  }

  // 방 생성 엔드포인트
  if (parsedUrl.pathname === "/rooms" && req.method === "POST") {
    await handleCreateRoom(req, res);
    return;
  }

  // 비밀번호 확인 엔드포인트
  if (parsedUrl.pathname === "/rooms/verify-password" && req.method === "POST") {
    await handleVerifyPassword(req, res);
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
async function handleGetRoomByName(query: any, res: ServerResponse): Promise<void> {
  const roomName = query.name as string;
  
  if (!roomName) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Room name is required" }));
    return;
  }

  try {
    const room = await roomSupabaseStore.findRoomByName(roomName);
    
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
  } catch (error) {
    console.error("Error finding room by name:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to find room" }));
  }
}

/**
 * 방 이름 중복 체크 핸들러
 */
async function handleCheckRoomName(query: any, res: ServerResponse): Promise<void> {
  const roomName = query.name as string;
  
  if (!roomName) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Room name is required" }));
    return;
  }

  try {
    const isTaken = await roomSupabaseStore.isRoomNameTaken(roomName);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ isTaken }));
  } catch (error) {
    console.error("Error checking room name:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to check room name" }));
  }
}

/**
 * 방 목록 조회 핸들러
 */
async function handleGetRooms(res: ServerResponse): Promise<void> {
  try {
    // 방 목록 생성
    const rooms = await roomSupabaseStore.getAllRooms();
    const roomsList = rooms.map(room => ({
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
async function handleCreateRoom(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body = "";
  req.on("data", chunk => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    try {
      const roomData = JSON.parse(body);
      const { roomId = generateId(), roomName, description, isPasswordProtected, password, createdBy, playlist } = roomData;

      // 이름 중복 체크
      const isTaken = await roomSupabaseStore.isRoomNameTaken(roomName);
      if (isTaken) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Room name already exists" }));
        return;
      }

      // 새로운 방 생성
      const room = await roomSupabaseStore.createRoom({
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
async function handleVerifyPassword(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body = "";
  req.on("data", chunk => {
    body += chunk.toString();
  });
  req.on("end", async () => {
    try {
      const { roomId, password } = JSON.parse(body);
      
      if (!roomId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Room ID is required" }));
        return;
      }
      
      // 방 존재 여부 확인
      const room = await roomSupabaseStore.getRoom(roomId);
      if (!room) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Room not found" }));
        return;
      }
      
      // 비밀번호 검증
      const isPasswordCorrect = await roomSupabaseStore.verifyPassword(roomId, password);
      
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