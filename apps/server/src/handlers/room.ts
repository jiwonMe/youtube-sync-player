import { Socket, Server } from 'socket.io';
import { roomStore } from '../services/roomStore';
import { getCurrentTimestamp } from '../utils/helpers';
import type { RoomUser } from 'shared';

/**
 * 사용자 연결 처리
 */
export function handleUserConnect(socket: Socket, io: Server, data: {
  roomId: string;
  userId: string;
  userName: string;
  userImage: string;
}): RoomUser | null {
  const { roomId, userId, userName, userImage } = data;
  
  // 방 존재 여부 확인 및 초기화
  let room = roomStore.getRoom(roomId);
  
  if (!room) {
    // 새 방 생성 (기본값으로)
    room = roomStore.createRoom({
      roomId,
      roomName: "YouTube Room",
      hostId: userId, // 첫 번째 사용자가 호스트가 됨
      isPasswordProtected: false
    });
  }
  
  // 사용자 객체 생성
  const user: RoomUser = {
    id: userId,
    name: userName,
    image: userImage,
    isHost: userId === room.hostId,
    socketId: socket.id,
  };
  
  // 방에 사용자 추가
  roomStore.addUserToRoom(roomId, user);
  
  return user;
}

/**
 * 사용자 연결 해제 처리
 */
export function handleUserDisconnect(socket: Socket, io: Server, userId: string, roomId: string): void {
  // 방에서 사용자 제거
  const { room, isRoomEmpty } = roomStore.removeUserFromRoom(roomId, userId);
  
  if (!room) return;
  
  // 방이 비어있으면 일정 시간 후 제거
  if (isRoomEmpty) {
    setTimeout(() => {
      // 다시 방이 비어있는지 확인
      const currentRoom = roomStore.getRoom(roomId);
      if (currentRoom && currentRoom.users.length === 0) {
        roomStore.deleteRoom(roomId);
        console.log(`Room ${roomId} (${currentRoom.roomName}) removed due to inactivity`);
      }
    }, 60000); // 1분 대기
  } 
  // 호스트가 나간 경우 새 호스트 지정
  else if (userId === room.hostId && room.users.length > 0) {
    // 남은 사용자 중 랜덤으로 새 호스트 선택
    const randomIndex = Math.floor(Math.random() * room.users.length);
    const newHost = room.users[randomIndex];
    
    // 호스트 변경
    roomStore.updateRoom(roomId, { hostId: newHost.id });
    
    // 모든 사용자의 isHost 플래그 업데이트
    room.users.forEach(user => {
      user.isHost = user.id === newHost.id;
      roomStore.addUserToRoom(roomId, user);
    });
    
    // 모든 사용자에게 새 호스트 알림
    io.to(roomId).emit("host:changed", {
      id: newHost.id,
      name: newHost.name,
    });
    
    console.log(`New host assigned in room ${roomId}: ${newHost.name} (${newHost.id})`);
  }
  
  // 다른 사용자들에게 누군가 나갔음을 알림
  socket.to(roomId).emit("user:left", {
    id: userId,
    name: room.users.find(u => u.id === userId)?.name || "Unknown User",
  });
}

/**
 * 방 설정 업데이트 처리
 */
export function handleRoomUpdate(socket: Socket, io: Server, settings: Partial<{
  hostId: string;
  roomName: string;
  description: string;
  isPasswordProtected: boolean;
  password: string;
}>, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
  if (!room) return;
  
  // 호스트 변경 권한 확인
  if (settings.hostId && settings.hostId !== room.hostId) {
    const oldHostId = room.hostId;
    
    // 현재 호스트가 변경을 요청했는지 확인
    if (userId === oldHostId) {
      // 호스트 변경
      roomStore.updateRoom(roomId, { hostId: settings.hostId });
      
      // 새 호스트 찾기
      const newHost = room.users.find(u => u.id === settings.hostId);
      
      if (newHost) {
        // 이벤트 로그 생성
        roomStore.addEventLog(roomId, newHost, 'hostChange');
      }
      
      // 모든 참가자들에게 전파
      io.to(roomId).emit("room:hostChange", {
        hostId: settings.hostId
      });
    }
  }
  
  // 방 이름 변경 처리
  if (settings.roomName && settings.roomName !== room.roomName) {
    // 새 이름이 이미 사용중인지 확인
    if (roomStore.isRoomNameTaken(settings.roomName)) {
      // 같은 방의 이름 변경인 경우는 허용 (대소문자만 변경 등)
      const existingRoom = roomStore.findRoomByName(settings.roomName);
      if (existingRoom && existingRoom.roomId !== roomId) {
        // 다른 방이 이미 해당 이름을 사용 중이므로 이름 변경 거부
        socket.emit("room:update:error", {
          message: "Room name already taken"
        });
        return;
      }
    }
  }
  
  // 나머지 설정 업데이트
  roomStore.updateRoom(roomId, settings);
  
  // 전체 방 상태 모든 사용자에게 전파
  io.to(roomId).emit("room:state", roomStore.getRoom(roomId));
} 