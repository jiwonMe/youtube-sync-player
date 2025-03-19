import { Socket, Server } from 'socket.io';
import { roomSupabaseStore } from '../services/roomSupabaseStore';
import { getCurrentTimestamp } from '../utils/helpers';
import type { RoomUser } from 'shared';
import { logger } from '../utils/logger';

/**
 * 사용자 연결 처리
 */
export async function handleUserConnect(socket: Socket, io: Server, data: {
  roomId: string;
  userId: string;
  userName: string;
  userImage: string;
}): Promise<RoomUser | null> {
  const { roomId, userId, userName, userImage } = data;
  
  try {
    // 방 존재 여부 확인
    let room = await roomSupabaseStore.getRoom(roomId);
    
    if (!room) {
      // 새 방 생성 (기본값으로)
      room = await roomSupabaseStore.createRoom({
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
    await roomSupabaseStore.addUserToRoom(roomId, user);
    
    return user;
  } catch (error) {
    logger.error('handleUserConnect', `Error connecting user ${userId} to room ${roomId}`, error);
    return null;
  }
}

/**
 * 사용자 연결 해제 처리
 */
export async function handleUserDisconnect(socket: Socket, io: Server, userId: string, roomId: string): Promise<void> {
  try {
    // 방에서 사용자 제거
    const { room, isRoomEmpty } = await roomSupabaseStore.removeUserFromRoom(roomId, userId);
    
    if (!room) return;
    
    // 방이 비어있으면 일정 시간 후 제거
    if (isRoomEmpty) {
      setTimeout(async () => {
        // 다시 방이 비어있는지 확인
        const currentRoom = await roomSupabaseStore.getRoom(roomId);
        if (currentRoom && currentRoom.users.length === 0) {
          await roomSupabaseStore.deleteRoom(roomId);
          logger.info('handleUserDisconnect', `Room ${roomId} (${currentRoom.roomName}) removed due to inactivity`);
        }
      }, 60000); // 1분 대기
    } 
    // 호스트가 나간 경우 새 호스트 지정
    else if (userId === room.hostId && room.users.length > 0) {
      // 남은 사용자 중 랜덤으로 새 호스트 선택
      const randomIndex = Math.floor(Math.random() * room.users.length);
      const newHost = room.users[randomIndex];
      
      // 호스트 변경
      await roomSupabaseStore.updateRoom(roomId, { hostId: newHost.id });
      
      // 모든 사용자의 isHost 플래그 업데이트
      for (const user of room.users) {
        user.isHost = user.id === newHost.id;
        await roomSupabaseStore.addUserToRoom(roomId, user);
      }
      
      // 모든 사용자에게 새 호스트 알림
      io.to(roomId).emit("host:changed", {
        id: newHost.id,
        name: newHost.name,
      });
      
      logger.info('handleUserDisconnect', `New host assigned in room ${roomId}: ${newHost.name} (${newHost.id})`);
    }
    
    // 다른 사용자들에게 누군가 나갔음을 알림
    socket.to(roomId).emit("user:left", {
      id: userId,
      name: room.users.find(u => u.id === userId)?.name || "Unknown User",
    });
  } catch (error) {
    logger.error('handleUserDisconnect', `Error disconnecting user ${userId} from room ${roomId}`, error);
  }
}

/**
 * 방 설정 업데이트 처리
 */
export async function handleRoomUpdate(socket: Socket, io: Server, settings: Partial<{
  hostId: string;
  roomName: string;
  description: string;
  isPasswordProtected: boolean;
  password: string;
}>, userId: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 호스트 변경 권한 확인
    if (settings.hostId && settings.hostId !== room.hostId) {
      const oldHostId = room.hostId;
      
      // 현재 호스트가 변경을 요청했는지 확인
      if (userId === oldHostId) {
        // 호스트 변경
        await roomSupabaseStore.updateRoom(roomId, { hostId: settings.hostId });
        
        // 새 호스트 찾기
        const newHost = room.users.find(u => u.id === settings.hostId);
        
        if (newHost) {
          // 이벤트 로그 생성
          await roomSupabaseStore.addEventLog(roomId, newHost, 'hostChange');
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
      const isNameTaken = await roomSupabaseStore.isRoomNameTaken(settings.roomName);
      if (isNameTaken) {
        // 같은 방의 이름 변경인 경우는 허용 (대소문자만 변경 등)
        const existingRoom = await roomSupabaseStore.findRoomByName(settings.roomName);
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
    await roomSupabaseStore.updateRoom(roomId, settings);
    
    // 업데이트된 방 상태 가져오기
    const updatedRoom = await roomSupabaseStore.getRoom(roomId);
    
    // 전체 방 상태 모든 사용자에게 전파
    io.to(roomId).emit("room:state", updatedRoom);
  } catch (error) {
    logger.error('handleRoomUpdate', `Error updating room ${roomId}`, error);
  }
} 