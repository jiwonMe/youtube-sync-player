import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { RoomState } from '@/types/room';

export interface UsePermissionsProps {
  socket: Socket | null;
  roomState: RoomState;
  isUserHost: () => boolean;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState>>;
  showChangeHostDialog: boolean;
  setShowChangeHostDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

export function usePermissions({
  socket,
  roomState,
  isUserHost,
  setRoomState,
  showChangeHostDialog,
  setShowChangeHostDialog
}: UsePermissionsProps) {
  // 권한 변경 핸들러
  const handlePermissionChange = (type: string, value: 'host-only' | 'all-users') => {
    if (!socket || !isUserHost()) return;
    
    // 권한 타입에 따라 이벤트 및 상태 업데이트
    switch (type) {
      case 'videoControl':
        // 기존 비디오 제어 권한 변경 (하위 호환성 유지)
        socket.emit("video:controlPermission", value);
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          videoControlPermission: value,
        }));
        break;
        
      case 'play':
        // 재생/일시정지 권한 변경
        socket.emit("permission:update", { type: "play", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          playPermission: value,
        }));
        break;
        
      case 'seek':
        // 시크 권한 변경
        socket.emit("permission:update", { type: "seek", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          seekPermission: value,
        }));
        break;
        
      case 'videoChange':
        // 비디오 변경 권한 변경
        socket.emit("permission:update", { type: "videoChange", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          videoChangePermission: value,
        }));
        break;
    }
  };
  
  // 비디오 제어 권한 변경 핸들러 (하위 호환성 유지)
  const handleVideoControlPermissionChange = (permission: 'host-only' | 'all-users') => {
    handlePermissionChange('videoControl', permission);
  };

  // 호스트 권한 이전 핸들러
  const handleChangeUserHost = () => {
    // 현재 호스트가 아니면 권한 없음
    if (!isUserHost()) {
      return;
    }
    
    // 다른 사용자가 없으면 이전할 수 없음
    if (roomState.users.length <= 1) {
      return;
    }

    // 호스트 권한 이전 대화상자 표시
    setShowChangeHostDialog(true);
  };

  // 다른 사용자에게 호스트 권한 이전
  const transferHostToUser = (targetUserId: string) => {
    if (!socket) return;
    
    socket.emit("room:update", {
      hostId: targetUserId
    });
    
    // 대화상자 닫기
    setShowChangeHostDialog(false);
  };
  
  return {
    handlePermissionChange,
    handleVideoControlPermissionChange,
    handleChangeUserHost,
    transferHostToUser
  };
}
