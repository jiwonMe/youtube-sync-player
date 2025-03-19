import { Socket, Server } from 'socket.io';
import { roomStore } from '../services/roomStore';
import { formatDecimal } from '../utils/helpers';
import type { RoomUser } from 'shared';

/**
 * 플레이어 상태 변경 처리
 */
export function handlePlayerStateChange(socket: Socket, io: Server, data: { 
  roomId: string; 
  stateChange: { 
    playing: boolean; 
    currentTime: number; 
    playbackRate?: number 
  } 
}): void {
  const { roomId, stateChange } = data;
  const room = roomStore.getRoom(roomId);

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

  console.log(`[상태 변경] 룸(${roomId})에서 ${currentUser.name}님이 플레이어 상태를 변경: ${stateChange.playing ? '재생' : '일시정지'}, 시간: ${formatDecimal(stateChange.currentTime)}s`);

  // 이전 상태 임시 저장 (이벤트 로그 표시용)
  const previousState = room.isPlaying;
  
  // 룸의 재생 상태 업데이트
  const updates: Partial<typeof room> = {
    isPlaying: stateChange.playing,
    currentTime: stateChange.currentTime,
    lastSyncTime: Date.now()
  };
  
  roomStore.updateRoom(roomId, updates);

  // 상태 변경을 방의 다른 참가자들에게 발송
  socket.to(roomId).emit("player:stateChange", {
    isPlaying: stateChange.playing,
    currentTime: stateChange.currentTime
  });

  // 상태가 실제로 변경되었을 때만 이벤트 로그 생성
  if (previousState !== stateChange.playing) {
    const eventType = stateChange.playing ? "play" : "pause";
    roomStore.addEventLog(roomId, currentUser, eventType);
  }
}

/**
 * 플레이어 동기화 요청 처리
 */
export function handlePlayerSync(socket: Socket, data: { 
  isPlaying: boolean; 
  currentTime: number; 
  videoId?: string 
}, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
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
    roomStore.updateRoom(roomId, {
      isPlaying: data.isPlaying,
      currentTime: data.currentTime,
      lastSyncTime: Date.now()
    });
    
    // 다른 참가자들에게 동기화 데이터 전송
    socket.to(roomId).emit("player:sync", {
      isPlaying: data.isPlaying,
      currentTime: data.currentTime,
      syncTime: Date.now(),
      videoId: data.videoId || room.currentVideo?.videoId,
    });
    
    console.log(`[동기화] 호스트(${socket.id})가 상태 동기화: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${formatDecimal(data.currentTime)}s`);
  }
}

/**
 * 동기화 요청 처리
 */
export function handleRequestSync(socket: Socket, io: Server, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
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
}

/**
 * 특정 사용자에게 동기화 데이터 전송
 */
export function handleSyncTo(socket: Socket, io: Server, data: { 
  targetSocketId: string; 
  isPlaying: boolean; 
  currentTime: number; 
  videoId?: string 
}, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
  if (!room || userId !== room.hostId) {
    console.log(`[동기화 오류] 호스트가 아닌 사용자의 syncTo 요청 무시: ${socket.id}`);
    return;
  }
  
  console.log(`[동기화 전송] 호스트가 사용자(${data.targetSocketId})에게 상태 전송: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${formatDecimal(data.currentTime)}s`);
  
  // 해당 사용자에게 동기화 데이터 전송
  io.to(data.targetSocketId).emit("player:sync", {
    isPlaying: data.isPlaying,
    currentTime: data.currentTime,
    syncTime: Date.now(),
    videoId: data.videoId || room.currentVideo?.videoId,
  });
}

/**
 * 자동 재생 설정 변경 처리
 */
export function handleAutoplayToggle(socket: Socket, data: { 
  isPlaying: boolean; 
  currentTime: number; 
  autoplay: boolean 
}, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
  if (!room) return;
  
  // 자동 재생 설정 업데이트
  roomStore.updateRoom(roomId, {
    autoplay: data.autoplay,
    isPlaying: data.isPlaying,
    currentTime: data.currentTime
  });
  
  // 다른 참가자들에게 전파
  socket.to(roomId).emit("autoplay:toggle", data);
  
  // 이벤트 로그 생성
  const user = room.users.find(u => u.id === userId);
  if (user) {
    roomStore.addEventLog(
      roomId, 
      user, 
      'autoplayToggle',
      { autoplay: data.autoplay }
    );
  }
}

/**
 * 시크 이벤트 처리
 */
export function handleSeek(socket: Socket, data: { currentTime: number }, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
  if (!room) return;
  
  // 방의 현재 시간 업데이트
  roomStore.updateRoom(roomId, {
    currentTime: data.currentTime,
    lastSyncTime: Date.now()
  });
  
  // 다른 참가자들에게 전파
  socket.to(roomId).emit("player:seek", data);
  
  // 이벤트 로그 생성
  const user = room.users.find(u => u.id === userId);
  if (user) {
    roomStore.addEventLog(
      roomId, 
      user, 
      'seek',
      { time: data.currentTime }
    );
  }
}

/**
 * 재생 이벤트 처리
 */
export function handlePlay(socket: Socket, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
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
  
  // 방 상태 업데이트
  roomStore.updateRoom(roomId, {
    isPlaying: true,
    lastSyncTime: Date.now()
  });
  
  // 다른 모든 참가자들에게 전파
  socket.to(roomId).emit("player:play");
  
  // 이벤트 로그 생성
  roomStore.addEventLog(roomId, currentUser, 'play');
}

/**
 * 일시정지 이벤트 처리
 */
export function handlePause(socket: Socket, userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
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
  
  // 방 상태 업데이트
  roomStore.updateRoom(roomId, {
    isPlaying: false,
    lastSyncTime: Date.now()
  });
  
  // 다른 모든 참가자들에게 전파
  socket.to(roomId).emit("player:pause");
  
  // 이벤트 로그 생성
  roomStore.addEventLog(roomId, currentUser, 'pause');
}

/**
 * 비디오 제어 권한 설정 변경 처리
 */
export function handleVideoControlPermission(socket: Socket, io: Server, permission: 'host-only' | 'all-users', userId: string, roomId: string): void {
  const room = roomStore.getRoom(roomId);
  if (!room) return;
  
  // 호스트만 권한을 변경할 수 있음
  if (userId !== room.hostId) {
    console.log(`[권한 오류] 호스트가 아닌 사용자(${socket.id})가 제어 권한을 변경하려고 시도했습니다.`);
    return;
  }
  
  // 이전 권한 저장
  const previousPermission = room.videoControlPermission;
  
  // 권한 업데이트
  roomStore.updateRoom(roomId, {
    videoControlPermission: permission
  });
  
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
      roomStore.addEventLog(
        roomId,
        user,
        'hostChange',
        { 
          videoControlPermission: permission,
          note: permission === 'host-only' ? '방장만 영상 제어 가능' : '모든 사용자 영상 제어 가능'
        }
      );
    }
  }
} 