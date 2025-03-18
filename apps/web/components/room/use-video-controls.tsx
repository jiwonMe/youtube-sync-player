import { useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { RoomState, VideoItem } from "@/types/room";
import { extractYouTubeId, fetchVideoDetails } from "@/utils/room-utils";

interface UseVideoControlsProps {
  roomId: string;
  socket: Socket | null;
  roomState: RoomState;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState>>;
  playerRef: React.RefObject<any>;
  isUserHost: () => boolean;
  setIsVideoChanging: React.Dispatch<React.SetStateAction<boolean>>;
  isVideoChanging: boolean;
  isSignedIn: boolean | undefined;
  user: any;
}

export function useVideoControls({
  roomId,
  socket,
  roomState,
  setRoomState,
  playerRef,
  isUserHost,
  setIsVideoChanging,
  isVideoChanging,
  isSignedIn,
  user
}: UseVideoControlsProps) {
  // 플레이어 상태 변경 락
  const [playerStateChangeLock, setPlayerStateChangeLock] = useState(false);
  
  // 마지막으로 알려진 시간 참조
  const lastKnownTimeRef = useRef<number>(0);
  
  // 플레이어 상태 변경 잠금 함수
  const lockPlayerStateChange = (lock: boolean) => {
    setPlayerStateChangeLock(lock);
  };
  
  // 비디오 플레이어 상태 변경 핸들러
  const handlePlayerStateChange = (e: any) => {
    if (!socket || playerStateChangeLock || isVideoChanging) {
      console.log(`[Player 이벤트 무시] 소켓:${!!socket}, 잠금:${playerStateChangeLock}, 비디오변경중:${isVideoChanging}`);
      return;
    }
    
    // 사용자가 비디오를 제어할 권한이 없는 경우
    const hasControlPermission = roomState.videoControlPermission === 'all-users' || isUserHost();
    if (!hasControlPermission) {
      console.log(`[권한 없음] 현재 사용자는 비디오 제어 권한이 없습니다. 권한 설정: ${roomState.videoControlPermission}, 호스트: ${isUserHost()}`);
      return;
    }
    
    const isHost = isUserHost();
    
    try {
      const stateNames = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'video cued'
      };
      console.log(`[Player 상태 이벤트] 상태: ${e.data} (${stateNames[e.data as keyof typeof stateNames] || 'unknown'}), isPlaying: ${roomState.isPlaying}`);
      
      switch (e.data) {
        case 1: // 재생 시작
          if (!roomState.isPlaying) {
            console.log(`[소켓 이벤트 발생] player:play 이벤트 발송`);
            socket.emit("player:play");
            lastKnownTimeRef.current = playerRef.current.getCurrentTime();
          } else {
            console.log(`[이벤트 무시] 이미 재생 상태입니다`);
          }
          break;
          
        case 2: // 일시 정지
          if (roomState.isPlaying) {
            console.log(`[소켓 이벤트 발생] player:pause 이벤트 발송`);
            socket.emit("player:pause");
          } else {
            console.log(`[이벤트 무시] 이미 일시정지 상태입니다`);
          }
          break;
          
        case 3: // 버퍼링
          console.log(`[버퍼링 감지] 버퍼링 상태에서는 이벤트 발생하지 않음`);
          break;
          
        default:
          console.log(`[기타 상태] 처리되지 않는 상태: ${e.data}`);
          break;
      }
    } catch (error) {
      console.error("Player state change error:", error);
    }
  };
  
  // 재생/일시정지 토글 핸들러
  const handlePlayPause = () => {
    if (!socket || !roomState.currentVideo) {
      console.log('[PlayPause 무시] 소켓 또는 현재 비디오 없음');
      return;
    }
    
    // 권한 체크
    const hasControlPermission = roomState.videoControlPermission === 'all-users' || isUserHost();
    if (!hasControlPermission) {
      console.log('[PlayPause 권한 없음] 비디오 제어 권한 없음');
      return;
    }
    
    console.log(`[PlayPause 토글] 현재 상태: ${roomState.isPlaying ? '재생 중' : '일시정지'}`);
    
    // 현재 상태와 반대로 소켓 이벤트 발생 및 roomState 업데이트
    if (roomState.isPlaying) {
      console.log('[PlayPause] player:pause 이벤트 발송');
      socket.emit("player:pause");
      
      // roomState 즉시 업데이트
      setRoomState(prev => ({
        ...prev,
        isPlaying: false
      }));
      
      // 직접 플레이어 제어 추가
      if (playerRef.current && playerRef.current.pauseVideo) {
        console.log('[PlayPause] 플레이어 직접 일시정지');
        playerRef.current.pauseVideo();
      }
    } else {
      console.log('[PlayPause] player:play 이벤트 발송');
      socket.emit("player:play");
      
      // roomState 즉시 업데이트
      setRoomState(prev => ({
        ...prev,
        isPlaying: true
      }));
      
      // 직접 플레이어 제어 추가
      if (playerRef.current && playerRef.current.playVideo) {
        console.log('[PlayPause] 플레이어 직접 재생');
        playerRef.current.playVideo();
      }
    }
    
    // 플레이어 락 설정 (변경 즉시 이벤트가 다시 발생하는 것 방지)
    lockPlayerStateChange(true);
    
    // 잠시 후 락 해제
    setTimeout(() => {
      console.log('[PlayPause] 플레이어 상태 변경 잠금 해제');
      lockPlayerStateChange(false);
    }, 500);
  };
  
  // 비디오 에러 핸들러
  const handleVideoError = (error: any) => {
    console.error("YouTube Player error:", error);
    
    // 사용자에게 에러 알림 (필요시 구현)
  };
  
  // 다음 비디오 재생 핸들러
  const handleNextVideo = () => {
    if (!socket || !roomState.currentVideo) return;
    
    // 권한 체크
    const hasControlPermission = roomState.videoControlPermission === 'all-users' || isUserHost();
    if (!hasControlPermission) return;
    
    const currentIndex = roomState.playlist.findIndex(
      (v) => v.id === roomState.currentVideo?.id
    );
    
    if (currentIndex < roomState.playlist.length - 1) {
      const nextVideo = roomState.playlist[currentIndex + 1];
      if (nextVideo) {
        socket.emit("video:change", { videoId: nextVideo.videoId });
      }
    }
  };
  
  // 비디오 선택 핸들러
  const handleVideoSelect = (videoId: string) => {
    if (!socket) return;
    
    // 권한 체크
    const hasControlPermission = roomState.videoControlPermission === 'all-users' || isUserHost();
    if (!hasControlPermission) return;
    
    socket.emit("video:change", { videoId });
  };
  
  // 비디오 제거 핸들러
  const handleRemoveVideo = (videoId: string) => {
    if (!socket || !isUserHost()) return;
    
    socket.emit("playlist:remove", { videoId });
  };
  
  // 비디오 URL로 비디오 추가 핸들러
  const handleAddVideo = async (url: string): Promise<boolean> => {
    if (!socket) return false;
    
    try {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }
      
      // YouTube API에서 비디오 정보 가져오기
      const videoDetails = await fetchVideoDetails(videoId);
      if (!videoDetails) {
        throw new Error("Failed to fetch video details");
      }
      
      // 비디오 정보 생성
      const newVideo: VideoItem = {
        id: `video-${Date.now()}`,
        videoId,
        title: videoDetails.title || "Unknown Title",
        thumbnailUrl: videoDetails.thumbnailUrl || "",
      };
      
      // 서버에 비디오 추가 요청
      socket.emit("playlist:add", newVideo);
      
      // 플레이리스트가 비어있으면 바로 재생
      if (roomState.playlist.length === 0) {
        socket.emit("video:change", { videoId });
      }
      
      return true;
    } catch (error) {
      console.error("Failed to add video:", error);
      return false;
    }
  };
  
  // 자동 재생 토글 핸들러
  const handleToggleAutoplay = () => {
    if (!socket || !isUserHost()) return;
    
    socket.emit("autoplay:toggle", !roomState.autoplay);
  };
  
  // 플레이리스트 순서 변경 핸들러 (드래그앤드롭)
  const handlePlaylistReorder = (result: any) => {
    if (!socket || !isUserHost() || !result.destination) return;
    
    const items = Array.from(roomState.playlist);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    
    socket.emit("playlist:reorder", items);
  };
  
  // 비디오 진행 바 클릭 핸들러 (시크 기능)
  const handleSeek = (seekTime: number) => {
    if (!socket || !roomState.currentVideo || !playerRef.current) {
      console.log('[Seek 무시] 소켓 또는 비디오 또는 플레이어 참조 없음');
      return;
    }
    
    // 권한 체크
    const hasControlPermission = roomState.videoControlPermission === 'all-users' || isUserHost();
    if (!hasControlPermission) {
      console.log('[Seek 권한 없음] 비디오 제어 권한 없음');
      return;
    }
    
    try {
      console.log(`[Seek] 시간 이동: ${seekTime.toFixed(2)}초`);
      
      // 플레이어 시간 이동
      playerRef.current.seekTo(seekTime);
      
      // 서버에 시크 이벤트 발송 (다른 사용자들에게 동기화)
      console.log(`[Seek] 소켓 이벤트 발송 player:seek time=${seekTime.toFixed(2)}`);
      socket.emit("player:seek", { currentTime: seekTime });
      
      // 로컬 상태 업데이트
      lastKnownTimeRef.current = seekTime;
      
      // 플레이어 상태 변경 잠금 (변경 즉시 이벤트가 다시 발생하는 것 방지)
      lockPlayerStateChange(true);
      
      // 잠시 후 락 해제
      setTimeout(() => {
        console.log('[Seek] 플레이어 상태 변경 잠금 해제');
        lockPlayerStateChange(false);
      }, 500);
    } catch (error) {
      console.error("Error seeking video:", error);
    }
  };
  
  return {
    handlePlayerStateChange,
    handlePlayPause,
    handleVideoError,
    handleNextVideo,
    handleVideoSelect,
    handleRemoveVideo,
    handleAddVideo,
    handleToggleAutoplay,
    handlePlaylistReorder,
    handleSeek,
    playerStateChangeLock,
    lastKnownTimeRef,
    lockPlayerStateChange
  };
}
