import { Socket, Server } from 'socket.io';
import { roomSupabaseStore } from '../services/roomSupabaseStore';
import { generateId, getCurrentTimestamp } from '../utils/helpers';
import { logger } from '../utils/logger';
import config from '../config';
import type { ChatMessage } from 'shared';

/**
 * 채팅 메시지 처리
 */
export async function handleChatMessage(socket: Socket, io: Server, message: string, userId: string, userName: string, userImage: string, roomId: string): Promise<void> {
  try {
    const room = await roomSupabaseStore.getRoom(roomId);
    if (!room) return;
    
    // 사용자 존재 여부 확인
    const user = room.users.find(u => u.id === userId);
    if (!user) return;
    
    // 채팅 메시지 객체 생성
    const chatMessage: ChatMessage = {
      id: `msg-${getCurrentTimestamp()}-${generateId()}`,
      userId,
      userName: userName,
      userImage: userImage || "",
      message,
      timestamp: getCurrentTimestamp(),
    };
    
    // 룸에 메시지 추가
    const messages = [...room.messages, chatMessage];
    
    // 메시지 개수 제한
    if (messages.length > config.maxMessageHistory) {
      messages.shift(); // 가장 오래된 메시지 제거
    }
    
    // 방 상태 업데이트
    await roomSupabaseStore.updateRoom(roomId, { messages });
    
    // 모든 사용자에게 메시지 전송 (발신자 포함)
    io.to(roomId).emit("chat:message", chatMessage);
    
    logger.debug('Chat', `Message from ${userName} in room ${roomId}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
  } catch (error) {
    logger.error('handleChatMessage', `Error handling chat message in room ${roomId}`, error);
  }
} 