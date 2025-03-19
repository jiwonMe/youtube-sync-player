import { RoomState, EventLog } from '../types';
import { generateId, getCurrentTimestamp } from '../utils/helpers';
import { logger } from '../utils/logger';
import config from '../config';
import type { RoomUser, VideoItem } from 'shared';

/**
 * 룸 데이터 저장소
 * 인메모리 방식으로 방 정보를 관리합니다.
 */
class RoomStore {
  private rooms: Map<string, RoomState>;
  private roomsByName: Map<string, string>; // roomName (lowercase) -> roomId

  constructor() {
    this.rooms = new Map<string, RoomState>();
    this.roomsByName = new Map<string, string>();
    logger.info('RoomStore', 'Room Store initialized');
  }

  /**
   * 모든 방 목록을 반환
   */
  getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 방 ID로 방 정보 조회
   */
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 방 이름으로 방 검색 (대소문자 구분 없음)
   */
  findRoomByName(name: string): RoomState | null {
    const roomId = this.roomsByName.get(name.toLowerCase());
    if (roomId) {
      return this.rooms.get(roomId) || null;
    }
    return null;
  }

  /**
   * 방 이름 중복 확인
   */
  isRoomNameTaken(name: string): boolean {
    return this.roomsByName.has(name.toLowerCase());
  }

  /**
   * 새 방 생성
   */
  createRoom(roomData: {
    roomId: string;
    roomName: string;
    description?: string;
    hostId: string;
    isPasswordProtected: boolean;
    password?: string;
    playlist?: VideoItem[];
  }): RoomState {
    const { roomId, roomName, description, hostId, isPasswordProtected, password, playlist = [] } = roomData;
    
    // 새 방 생성
    const room: RoomState = {
      roomId,
      roomName,
      hostId,
      users: [],
      currentVideo: playlist.length > 0 ? playlist[0] : null,
      playlist,
      isPlaying: false,
      currentTime: 0,
      messages: [],
      eventLogs: [],
      isPasswordProtected,
      password: isPasswordProtected ? password : undefined,
      createdAt: getCurrentTimestamp(),
      autoplay: true,
      description,
      lastSyncTime: getCurrentTimestamp(),
      videoControlPermission: 'host-only',
    };

    // 저장소에 추가
    this.rooms.set(roomId, room);
    this.roomsByName.set(roomName.toLowerCase(), roomId);

    logger.info('RoomStore', `Room created: ${roomName} (${roomId})`);
    return room;
  }

  /**
   * 방 정보 업데이트
   */
  updateRoom(roomId: string, updates: Partial<RoomState>): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // 방 이름 변경 처리
    if (updates.roomName && updates.roomName !== room.roomName) {
      this.roomsByName.delete(room.roomName.toLowerCase());
      this.roomsByName.set(updates.roomName.toLowerCase(), roomId);
      logger.debug('RoomStore', `Room name changed: ${room.roomName} -> ${updates.roomName} (${roomId})`);
    }

    // 방 정보 업데이트
    Object.assign(room, updates);
    this.rooms.set(roomId, room);

    return room;
  }

  /**
   * 방 삭제
   */
  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    this.roomsByName.delete(room.roomName.toLowerCase());
    const result = this.rooms.delete(roomId);
    
    if (result) {
      logger.info('RoomStore', `Room deleted: ${room.roomName} (${roomId})`);
    }
    
    return result;
  }

  /**
   * 방에 사용자 추가
   */
  addUserToRoom(roomId: string, user: RoomUser): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // 사용자가 이미 있는지 확인
    const existingUserIndex = room.users.findIndex(u => u.id === user.id);
    if (existingUserIndex === -1) {
      // 새 사용자 추가
      room.users.push(user);
      logger.debug('RoomStore', `User added to room: ${user.name} (${user.id}) to ${room.roomName} (${roomId})`);
    } else {
      // 기존 사용자 정보 업데이트
      room.users[existingUserIndex] = {
        ...room.users[existingUserIndex],
        ...user,
      };
      logger.debug('RoomStore', `User updated in room: ${user.name} (${user.id}) in ${room.roomName} (${roomId})`);
    }

    return room;
  }

  /**
   * 방에서 사용자 제거
   */
  removeUserFromRoom(roomId: string, userId: string): { room: RoomState | null, isRoomEmpty: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: null, isRoomEmpty: false };

    // 삭제할 사용자 찾기 (로그용)
    const user = room.users.find(u => u.id === userId);
    
    // 사용자 제거
    room.users = room.users.filter(u => u.id !== userId);
    const isRoomEmpty = room.users.length === 0;

    if (user) {
      logger.debug('RoomStore', `User removed from room: ${user.name} (${userId}) from ${room.roomName} (${roomId})`);
    }

    return { room, isRoomEmpty };
  }

  /**
   * 이벤트 로그 추가
   */
  addEventLog(roomId: string, user: RoomUser, eventType: EventLog['eventType'], details?: EventLog['details']): EventLog | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const eventLog: EventLog = {
      id: generateId(),
      user,
      eventType,
      details,
      timestamp: getCurrentTimestamp()
    };

    room.eventLogs.push(eventLog);

    // 최대 이벤트 로그 수 제한
    if (room.eventLogs.length > config.maxEventLogs) {
      room.eventLogs = room.eventLogs.slice(-config.maxEventLogs);
    }

    return eventLog;
  }

  /**
   * 비밀번호 확인
   */
  verifyPassword(roomId: string, password: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    if (!room.isPasswordProtected) return true;
    
    return room.password === password;
  }

  /**
   * 현재 방 통계 정보
   */
  getRoomStats(): { totalRooms: number, totalUsers: number } {
    let totalUsers = 0;
    const rooms = this.getAllRooms();
    
    rooms.forEach(room => {
      totalUsers += room.users.length;
    });
    
    return {
      totalRooms: rooms.length,
      totalUsers
    };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const roomStore = new RoomStore(); 