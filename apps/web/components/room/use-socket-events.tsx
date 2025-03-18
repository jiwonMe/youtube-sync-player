import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { RoomState } from "@/types/room";

interface UseSocketEventsProps {
  socket: Socket | null;
  roomState: RoomState;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState>>;
  isUserHost: () => boolean;
  isSignedIn: boolean | undefined;
  user: any;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVideoChanging: React.Dispatch<React.SetStateAction<boolean>>;
  playerRef: React.RefObject<any>;
  setHasInitialSync: React.Dispatch<React.SetStateAction<boolean>>;
  hasInitialSync: boolean;
  lastKnownTimeRef: React.RefObject<number>;
  lockPlayerStateChange: (lock: boolean) => void;
}

export function useSocketEvents({
  socket,
  roomState,
  setRoomState,
  isUserHost,
  isSignedIn,
  user,
  setIsLoading,
  setIsVideoChanging,
  playerRef,
  setHasInitialSync,
  hasInitialSync,
  lastKnownTimeRef,
  lockPlayerStateChange
}: UseSocketEventsProps) {
  // 동기화 관련 이벤트 처리 - 비디오 재생 상태 동기화
  useEffect(() => {
    if (!socket || !playerRef.current) return;

    // 비디오 재생 이벤트 핸들러
    const handlePlay = () => {
      if (!playerRef.current) {
        console.log('[Play 이벤트 무시] 플레이어 참조 없음');
        return;
      }
      
      try {
        console.log('[Play 이벤트 수신] 재생 이벤트 처리 시작');
        
        // 룸 상태 즉시 업데이트 (중요: 선행 처리)
        setRoomState((prev) => {
          // 이미 재생 중이면 상태 변경 생략
          if (prev.isPlaying) {
            console.log('[Play 처리] 이미 재생 중 상태임');
            return prev;
          }
          
          console.log('[Play 처리] roomState.isPlaying = true로 업데이트');
          return {
            ...prev,
            isPlaying: true,
          };
        });
        
        // 플레이어 상태 확인
        const currentState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        console.log(`[Play 처리] 현재 플레이어 상태: ${currentState} (1=재생중, 2=일시정지)`);
        
        // 이미 재생 중이면 상태 변경만 하고 재생 명령 스킵
        if (currentState === 1) {
          console.log('[Play 처리] 이미 재생 중이므로 재생 명령 스킵');
          return;
        }
        
        // 플레이어 컨트롤 업데이트 방지
        console.log('[Play 처리] 플레이어 상태 변경 잠금 설정');
        lockPlayerStateChange(true);
        
        console.log('[Play 처리] 플레이어 재생 명령 실행');
        playerRef.current.playVideo();
        
        // 0.5초 후 플레이어 컨트롤 잠금 해제
        setTimeout(() => {
          console.log('[Play 처리] 플레이어 상태 변경 잠금 해제');
          lockPlayerStateChange(false);
        }, 500);
      } catch (err) {
        console.error("Error handling play event:", err);
      }
    };

    // 비디오 일시정지 이벤트 핸들러
    const handlePause = () => {
      if (!playerRef.current) {
        console.log('[Pause 이벤트 무시] 플레이어 참조 없음');
        return;
      }
      
      try {
        console.log('[Pause 이벤트 수신] 일시정지 이벤트 처리 시작');
        
        // 룸 상태 즉시 업데이트 (중요: 선행 처리)
        setRoomState((prev) => {
          // 이미 일시정지 상태면 변경 생략
          if (!prev.isPlaying) {
            console.log('[Pause 처리] 이미 일시정지 상태임');
            return prev;
          }
          
          console.log('[Pause 처리] roomState.isPlaying = false로 업데이트');
          return {
            ...prev,
            isPlaying: false,
          };
        });
        
        // 플레이어 상태 확인
        const currentState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        console.log(`[Pause 처리] 현재 플레이어 상태: ${currentState} (1=재생중, 2=일시정지)`);
        
        // 이미 일시정지 중이면 상태 변경만 하고 일시정지 명령 스킵
        if (currentState === 2) {
          console.log('[Pause 처리] 이미 일시정지 중이므로 일시정지 명령 스킵');
          return;
        }
        
        // 플레이어 컨트롤 업데이트 방지
        console.log('[Pause 처리] 플레이어 상태 변경 잠금 설정');
        lockPlayerStateChange(true);
        
        console.log('[Pause 처리] 플레이어 일시정지 명령 실행');
        playerRef.current.pauseVideo();
        
        // 0.5초 후 플레이어 컨트롤 잠금 해제
        setTimeout(() => {
          console.log('[Pause 처리] 플레이어 상태 변경 잠금 해제');
          lockPlayerStateChange(false);
        }, 500);
      } catch (err) {
        console.error("Error handling pause event:", err);
      }
    };

    // 동기화 요청 이벤트 핸들러 (호스트만)
    const handleSyncRequest = () => {
      if (!playerRef.current || !isUserHost()) return;
      
      try {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const isPlaying = playerRef.current.getPlayerState() === 1;
        const videoId = roomState.currentVideo?.videoId;
        
        socket.emit("player:sync", {
          isPlaying,
          currentTime,
          videoId,
        });
      } catch (err) {
        console.error("Error handling sync request:", err);
      }
    };

    // 동기화 응답 이벤트 핸들러 (비호스트 클라이언트들)
    const handleSync = (data: {
      isPlaying: boolean;
      currentTime: number;
      videoId: string;
    }) => {
      if (!playerRef.current) {
        console.log('[Sync 이벤트 무시] 플레이어 참조 없음');
        return;
      }
      
      if (isUserHost()) {
        console.log('[Sync 이벤트 무시] 호스트는 동기화 이벤트를 무시합니다');
        return;
      }
      
      try {
        console.log(`[Sync 수신] 서버에서 동기화 데이터 수신: isPlaying=${data.isPlaying}, time=${data.currentTime.toFixed(2)}, video=${data.videoId}`);
        
        // 현재 재생 중인 비디오가 맞는지 확인
        if (
          roomState.currentVideo &&
          data.videoId === roomState.currentVideo.videoId
        ) {
          const currentPlayerTime = playerRef.current.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - data.currentTime);
          
          console.log(`[Sync 처리] 현재 플레이어 시간: ${currentPlayerTime.toFixed(2)}, 서버 시간: ${data.currentTime.toFixed(2)}, 차이: ${timeDiff.toFixed(2)}초`);
          
          // 시간 차이가 2초 이상이면 동기화
          if (timeDiff > 2) {
            console.log(`[Sync 시간 조정] 시간 차이가 너무 큼, 서버 시간으로 동기화: ${data.currentTime.toFixed(2)}초`);
            playerRef.current.seekTo(data.currentTime);
            lastKnownTimeRef.current = data.currentTime;
          } else {
            console.log(`[Sync 시간 유지] 시간 차이가 허용 범위 내, 조정 안함`);
          }
          
          // 재생 상태 동기화
          const currentPlayerState = playerRef.current.getPlayerState();
          console.log(`[Sync 상태 확인] 현재 플레이어 상태: ${currentPlayerState}, 서버 상태: ${data.isPlaying ? '재생' : '일시정지'}`);
          
          if (data.isPlaying && currentPlayerState !== 1) {
            console.log(`[Sync 상태 조정] 재생 상태로 변경`);
            playerRef.current.playVideo();
          } else if (!data.isPlaying && currentPlayerState === 1) {
            console.log(`[Sync 상태 조정] 일시정지 상태로 변경`);
            playerRef.current.pauseVideo();
          } else {
            console.log(`[Sync 상태 유지] 이미 올바른 상태입니다`);
          }
          
          // 룸 상태 업데이트
          setRoomState((prev) => ({
            ...prev,
            isPlaying: data.isPlaying,
            currentTime: data.currentTime,
          }));
          
          console.log(`[Sync 완료] 동기화 처리 완료`);
        } else {
          console.log(`[Sync 비디오 불일치] 현재 비디오(${roomState.currentVideo?.videoId})와 서버 비디오(${data.videoId})가 일치하지 않음`);
        }
      } catch (err) {
        console.error("Error handling sync event:", err);
      }
    };

    // 비디오 진행 바 클릭 핸들러 (시크 기능)
    const handleSeek = (data: { currentTime: number }) => {
      if (!playerRef.current) {
        console.log('[Seek 이벤트 무시] 플레이어 참조 없음');
        return;
      }
      
      try {
        console.log(`[Seek 이벤트 수신] 시간: ${data.currentTime.toFixed(2)}초로 이동 요청`);
        
        // 플레이어 상태 확인
        const currentPlayerTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        console.log(`[Seek 처리] 현재 플레이어 시간: ${currentPlayerTime.toFixed(2)}, 목표 시간: ${data.currentTime.toFixed(2)}`);
        
        // 플레이어 컨트롤 업데이트 방지
        console.log('[Seek 처리] 플레이어 상태 변경 잠금 설정');
        lockPlayerStateChange(true);
        
        // 플레이어 시간 업데이트
        console.log(`[Seek 처리] 플레이어를 ${data.currentTime.toFixed(2)}초로 이동`);
        playerRef.current.seekTo(data.currentTime);
        lastKnownTimeRef.current = data.currentTime;
        
        // 룸 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          currentTime: data.currentTime,
        }));
        
        // 0.5초 후 플레이어 컨트롤 잠금 해제
        setTimeout(() => {
          console.log('[Seek 처리] 플레이어 상태 변경 잠금 해제');
          lockPlayerStateChange(false);
        }, 500);
      } catch (err) {
        console.error("Error handling seek event:", err);
      }
    };

    // 비디오 변경 이벤트 핸들러
    const handleVideoChange = (videoId: string) => {
      if (!playerRef.current) {
        console.log('[VideoChange 이벤트 무시] 플레이어 참조 없음');
        return;
      }
      
      try {
        console.log(`[VideoChange 이벤트 수신] 비디오 ID: ${videoId}`);
        
        // 비디오 변경 중임을 표시
        setIsVideoChanging(true);
        
        // 플레이어 상태 변경 잠금
        lockPlayerStateChange(true);
        
        // 플레이리스트에서 해당 비디오 찾기
        const video = roomState.playlist.find(v => v.videoId === videoId);
        
        if (video) {
          console.log(`[VideoChange 처리] 비디오 변경: "${video.title}"`);
          
          // 룸 상태 업데이트
          setRoomState(prev => ({
            ...prev,
            currentVideo: video,
            currentTime: 0,
            isPlaying: true
          }));
        } else {
          console.log(`[VideoChange 오류] 비디오 ID ${videoId}를 플레이리스트에서 찾을 수 없음`);
        }
        
        // 비디오 변경 후 상태 잠금 해제 (지연 적용)
        setTimeout(() => {
          console.log('[VideoChange 처리] 플레이어 상태 변경 잠금 해제');
          lockPlayerStateChange(false);
          setIsVideoChanging(false);
        }, 1000); // 비디오 로딩을 위해 더 긴 지연 시간 적용
      } catch (err) {
        console.error("Error handling video change event:", err);
        // 에러가 발생해도 잠금 해제 확보
        lockPlayerStateChange(false);
        setIsVideoChanging(false);
      }
    };

    // 이벤트 리스너 등록
    socket.on("player:play", handlePlay);
    socket.on("player:pause", handlePause);
    socket.on("player:requestSync", handleSyncRequest);
    socket.on("player:sync", handleSync);
    socket.on("player:seek", handleSeek);
    socket.on("video:change", handleVideoChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      socket.off("player:play", handlePlay);
      socket.off("player:pause", handlePause);
      socket.off("player:requestSync", handleSyncRequest);
      socket.off("player:sync", handleSync);
      socket.off("player:seek", handleSeek);
      socket.off("video:change", handleVideoChange);
    };
  }, [
    socket,
    playerRef,
    roomState.currentVideo,
    roomState.playlist,
    isUserHost,
    setRoomState,
    lockPlayerStateChange,
    lastKnownTimeRef,
    setIsVideoChanging,
  ]);

  return {
    // 이 훅에서 외부로 노출할 필요가 있는 함수나 상태가 있다면 여기에 추가
  }; // 필요한 경우 외부에서 사용할 값 반환
}
