"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import YouTube from "react-youtube"
import { useToast } from "@/hooks/use-toast"

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  currentTime: number
  onStateChange: (event: any) => void
  isMuted: boolean
  playerRef?: React.MutableRefObject<any>
  onVideoError?: (errorCode: number) => void
  hasPermission?: boolean
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  currentTime,
  onStateChange,
  isMuted,
  playerRef,
  onVideoError,
  hasPermission = true,
}: YouTubePlayerProps) {
  const internalPlayerRef = useRef<any>(null)
  const actualPlayerRef = playerRef || internalPlayerRef
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlayerMounted, setIsPlayerMounted] = useState(false)
  const [initialPlayTriggered, setInitialPlayTriggered] = useState(false)
  const { toast } = useToast()
  
  // 상태 관리 및 디버깅을 위한 추가 state
  const [lastAction, setLastAction] = useState<"none" | "play" | "pause">("none")
  const [lastPlayerState, setLastPlayerState] = useState<number>(-1)
  
  // 비디오 ID와 isPlaying 변경 감지를 위한 ref
  const previousVideoIdRef = useRef<string>(videoId)
  const isPlayingRef = useRef<boolean>(isPlaying)
  
  // 페이지 최초 로드 상태를 확인하기 위한 ref
  const isFirstLoadRef = useRef<boolean>(true)

  // 권한 없는 사용자의 로컬 동작 상태 추적을 위한 ref
  const wasLocallyPausedRef = useRef<boolean>(false)
  const lastSyncTimeRef = useRef<number>(0)
  const localTimeStateRef = useRef<number>(0)

  // Handle player ready
  const onReady = (event: any) => {
    try {
      actualPlayerRef.current = event.target
      setIsReady(true)
      setIsPlayerMounted(true)
      console.log(`[Player Ready] 플레이어 준비 완료. isPlaying=${isPlaying}`);

      // 초기 음소거 설정
      if (isMuted) {
        event.target.mute();
      } else {
        event.target.unMute();
      }
      
      // 초기 시간 설정
      if (currentTime > 0) {
        event.target.seekTo(currentTime);
      }
      
      // 비디오가 준비되면 재생 상태에 따라 즉시 재생
      if (isPlaying) {
        event.target.playVideo();
        setLastAction("play");
      } else {
        event.target.pauseVideo();
        setLastAction("pause");
      }
      
      // 초기 상태 ref 업데이트
      isPlayingRef.current = isPlaying;
    } catch (err) {
      console.error("Error in onReady:", err)
    }
  }

  // Handle player error
  const onError = (event: any) => {
    const errorCode = event.data;
    const errorMessage = getErrorMessage(errorCode);
    
    console.error("YouTube Player Error:", {
      data: errorCode,
      target: event.target,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
    
    setError(errorMessage);
    
    // 임베딩 제한 및 비디오 찾을 수 없음 오류일 경우 특수 메시지 표시
    if (errorCode === 101 || errorCode === 150) {
      toast({
        title: "비디오 재생 불가",
        description: "이 비디오는 소유자가 외부 재생을 제한했습니다. 다음 곡으로 자동 넘어갑니다.",
        variant: "destructive",
      });
    } else if (errorCode === 100) {
      toast({
        title: "비디오를 찾을 수 없음",
        description: "이 비디오는 삭제되었거나 비공개로 설정되었습니다. 다음 곡으로 자동 넘어갑니다.",
        variant: "destructive",
      });
    } else {
      // 기타 에러에 대한 일반 토스트 메시지
      toast({
        title: "비디오 재생 오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    // 에러 발생 시 부모 컴포넌트에 알림
    if (onVideoError) {
      onVideoError(errorCode);
    }
  }

  // Get error message based on error code
  const getErrorMessage = (errorCode: number) => {
    switch (errorCode) {
      case 2:
        return "Invalid parameter in the player URL.";
      case 5:
        return "The requested video content cannot be played in an HTML5 player.";
      case 100:
        return "The video requested was not found. This error occurs when a video has been removed or marked as private.";
      case 101:
      case 150:
        return "The video owner does not allow it to be played in embedded players.";
      default:
        return "An error occurred while loading the video. Please try another video.";
    }
  }

  // 플레이어 메서드를 안전하게 호출하는 헬퍼 함수
  const safePlayerCall = (callback: (player: any) => void) => {
    if (!actualPlayerRef.current) return;
    if (!isReady) return;
    if (!isPlayerMounted) return;
    
    try {
      // 플레이어 객체가 유효한지 추가 검사
      if (typeof actualPlayerRef.current.getIframe === 'function') {
        const iframe = actualPlayerRef.current.getIframe();
        if (!iframe || !iframe.contentWindow) {
          console.log("YouTube iframe is not ready yet");
          return;
        }
      }
      
      callback(actualPlayerRef.current);
    } catch (err) {
      console.error("Error calling player method:", err);
    }
  };

  // 비디오 ID가 변경되면 에러 상태 초기화
  useEffect(() => {
    if (previousVideoIdRef.current !== videoId) {
      console.log(`[Video ID 변경] ${previousVideoIdRef.current} -> ${videoId}`);
      setError(null);
      setIsReady(false);
      setInitialPlayTriggered(false);
      previousVideoIdRef.current = videoId;
      setLastAction("none");
    }
  }, [videoId]);

  // isPlaying이 변경될 때 플레이어 상태 동기화
  useEffect(() => {
    if (!isReady || !isPlayerMounted) {
      console.log(`[isPlaying 동기화 무시] isReady=${isReady}, isPlayerMounted=${isPlayerMounted}`);
      return;
    }
    
    // isPlaying 값이 변경되었을 때만 실행
    if (isPlayingRef.current !== isPlaying) {
      console.log(`[isPlaying 변경 감지] ${isPlayingRef.current} -> ${isPlaying}`);
      
      safePlayerCall((player) => {
        const currentPlayerState = player.getPlayerState();
        setLastPlayerState(currentPlayerState);
        
        // 플레이어 상태 이름으로 변환
        const stateNames = {
          '-1': 'unstarted',
          '0': 'ended',
          '1': 'playing',
          '2': 'paused',
          '3': 'buffering',
          '5': 'video cued'
        };
        
        // 실제 플레이어 상태 확인 (1: playing, 2: paused)
        const isCurrentlyPlaying = currentPlayerState === 1;
        const isCurrentlyPaused = currentPlayerState === 2;
        const isCurrentlyBuffering = currentPlayerState === 3;
        
        console.log(`[isPlaying 동기화] 현재 플레이어 상태: ${currentPlayerState} (${stateNames[currentPlayerState as keyof typeof stateNames] || 'unknown'})`);
        
        // 버퍼링 중일 때는 명령을 지연시켜 적용
        if (isCurrentlyBuffering) {
          console.log("[상태 동기화] 버퍼링 중이므로 명령 지연");
          setTimeout(() => {
            safePlayerCall(innerPlayer => {
              if (isPlaying) {
                console.log("[상태 동기화] 버퍼링 후 재생 명령 실행");
                innerPlayer.playVideo();
              } else {
                console.log("[상태 동기화] 버퍼링 후 일시정지 명령 실행");
                innerPlayer.pauseVideo();
              }
            });
          }, 300);
          
        // 필요한 경우에만 상태 변경 적용
        } else if (isPlaying && !isCurrentlyPlaying) {
          console.log("[상태 동기화] 재생 명령 실행");
          player.playVideo();
          setLastAction("play");
        } else if (!isPlaying && isCurrentlyPlaying) {
          console.log("[상태 동기화] 일시정지 명령 실행");
          player.pauseVideo();
          setLastAction("pause");
        } else {
          console.log(`[상태 동기화 불필요] 현재 플레이어 상태(${currentPlayerState})와 기대 상태(${isPlaying ? '재생' : '일시정지'})가 일치`);
        }
      });
      
      // 현재 상태 업데이트
      isPlayingRef.current = isPlaying;
    }
  }, [isPlaying, isReady, isPlayerMounted]);

  // Handle mute/unmute
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    safePlayerCall((player) => {
      if (isMuted) {
        player.mute();
      } else {
        player.unMute();
      }
    });
  }, [isMuted, isReady, isPlayerMounted]);

  // Sync current time - 시간 동기화 로직 강화
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    safePlayerCall((player) => {
      try {
        const currentPlayerTime = player.getCurrentTime() || 0;
        localTimeStateRef.current = currentPlayerTime;
        
        // 권한이 없고 로컬에서 재생으로 전환된 경우 무조건 호스트 시간으로 동기화
        if (!hasPermission && wasLocallyPausedRef.current && isPlaying) {
          console.log(`[권한 없음 시간 동기화] 재생 시 호스트 시간으로 강제 동기화: ${currentPlayerTime.toFixed(2)}s -> ${currentTime.toFixed(2)}s`);
          player.seekTo(currentTime);
          lastSyncTimeRef.current = Date.now();
          wasLocallyPausedRef.current = false;
          return;
        }
        
        // 권한이 없는 경우 더 자주 동기화 (0.3초 차이)
        const syncThreshold = !hasPermission ? 0.3 : 0.5;
        
        // 마지막 동기화 후 1초 이상 지났거나 시간 차이가 임계값 이상일 때 동기화
        const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
        const shouldSyncByTime = !hasPermission && timeSinceLastSync > 3000;
        const shouldSyncByDiff = Math.abs(currentPlayerTime - currentTime) > syncThreshold;
        
        if (shouldSyncByDiff || shouldSyncByTime) {
          console.log(`[시간 동기화] ${currentPlayerTime.toFixed(2)}s -> ${currentTime.toFixed(2)}s 
          (차이: ${Math.abs(currentPlayerTime - currentTime).toFixed(2)}s, 
          마지막 동기화 후 ${(timeSinceLastSync/1000).toFixed(1)}초 경과, 
          권한: ${hasPermission ? "있음" : "없음"})`);
          
          player.seekTo(currentTime);
          lastSyncTimeRef.current = Date.now();
        }
      } catch (err) {
        console.error("Error seeking:", err);
      }
    });
  }, [currentTime, isPlaying, isReady, isPlayerMounted, hasPermission]);

  // isPlaying 외부 상태 변화 감지 (서버에서 받는 변경사항)
  useEffect(() => {
    // 외부에서 재생 상태가 변경됨
    if (isPlayingRef.current !== isPlaying) {
      // 재생 상태로 변경됐을 때 이전에 로컬 일시정지 플래그 초기화
      if (isPlaying) {
        wasLocallyPausedRef.current = false;
      }
    }
  }, [isPlaying]);

  // 컴포넌트 언마운트 시 플레이어 참조 정리
  useEffect(() => {
    return () => {
      console.log("[Player Cleanup] 컴포넌트 언마운트");
      setIsPlayerMounted(false);
      setIsReady(false);
      setInitialPlayTriggered(false);
      
      // 플레이어 참조 정리
      if (actualPlayerRef.current) {
        try {
          actualPlayerRef.current = null;
        } catch (err) {
          console.error("Error cleaning up player reference:", err);
        }
      }
    };
  }, []);

  // 상태 변경 이벤트를 래핑하여 중복 이벤트 방지
  const handleStateChange = (event: any) => {
    const newState = event.data;
    
    // 상태 변화 자세한 로깅 추가
    const stateNames = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'video cued'
    };
    
    console.log(`[Youtube 플레이어 상태 변경] ${lastPlayerState} -> ${newState} (${stateNames[newState as keyof typeof stateNames] || 'unknown'})`);
    
    // 상태가 변경되지 않았으면 이벤트를 무시
    if (newState === lastPlayerState) {
      console.log('[상태 이벤트 무시] 이전 상태와 동일');
      return;
    }
    
    // 버퍼링에서 다른 상태로 갈 때는 이벤트를 발생시키지만, 상태가 실제로 변경된 것은 아님
    if (lastPlayerState === 3 && (newState === 1 || newState === 2)) {
      console.log('[버퍼링 이후 상태] 버퍼링 후 상태가 복원됨');
      // 버퍼링에서 복원된 경우에는 상태는 업데이트하되 이벤트 전파는 제한적으로 함
      setLastPlayerState(newState);
      
      // 버퍼링 이후 재생이 기대값과 일치하는지 확인
      if ((newState === 1 && isPlaying) || (newState === 2 && !isPlaying)) {
        console.log('[버퍼링 이후] 예상대로 상태 복원됨, 이벤트 전파 생략');
        return;
      } else {
        console.log('[버퍼링 이후] 예상과 다른 상태로 복원됨, 이벤트 전파 필요');
      }
    }
    
    // 재생 종료 상태(0)는 항상 이벤트를 전파하여 자동 재생 처리
    if (newState === 0) {
      console.log('[재생 종료] 비디오 재생 종료 이벤트 전파');
      setLastPlayerState(newState);
      onStateChange(event);
      return;
    }
    
    // 마지막 상태 업데이트
    setLastPlayerState(newState);
    
    // 부모 컴포넌트에 이벤트 전달
    console.log('[상태 이벤트 전달] 부모 컴포넌트로 이벤트 전파');
    onStateChange(event);
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-400">Try adding a different video to the playlist</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <YouTube
        key={videoId} // 비디오 ID가 변경될 때 컴포넌트를 다시 마운트하여 깨끗한 상태로 시작
        videoId={videoId}
        opts={{
          height: "100%",
          width: "100%",
          playerVars: {
            autoplay: 1, // 자동 재생 활성화 (onReady에서 제어)
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 1, // Enable fullscreen button
            controls: 0, // Hide controls, we'll use our own
            mute: 1, // 최초 로드시 음소거 상태로 시작
            disablekb: 1, // 키보드 컨트롤 비활성화
            iv_load_policy: 3, // 동영상 주석 비활성화
          },
        }}
        onReady={(event) => {
          onReady(event);
          // onReady 이벤트가 발생하면 최초 로드가 아님을 표시
          setTimeout(() => {
            isFirstLoadRef.current = false;
          }, 500);
        }}
        onStateChange={handleStateChange}
        onError={onError}
        className="w-full h-full"
      />
      {/* 비디오 위에 투명한 오버레이 추가하여 마우스 이벤트 차단 */}
      <div 
        className={`absolute inset-0 z-10 ${hasPermission || isFirstLoadRef.current ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={(e) => {
          e.preventDefault();
          
          // 최초 로드 상태가 아니고 권한이 없으면 클릭 무시
          if (!isFirstLoadRef.current && !hasPermission) {
            console.log("[오버레이 클릭] 권한 없음: 클릭 무시");
            return;
          }
          
          // 클릭 시 재생/일시정지 토글
          safePlayerCall((player) => {
            const currentPlayerState = player.getPlayerState();
            const isCurrentlyPlaying = currentPlayerState === 1;
            
            if (isCurrentlyPlaying) {
              console.log("[오버레이 클릭] 일시정지 명령 실행");
              player.pauseVideo();
              setLastAction("pause");
              
              // 권한이 없는 경우 로컬 일시정지 플래그 설정
              if (!hasPermission) {
                wasLocallyPausedRef.current = true;
                localTimeStateRef.current = player.getCurrentTime() || 0;
                console.log(`[오버레이 클릭] 권한 없음: 로컬 일시정지 상태 기록 (현재 시간: ${localTimeStateRef.current.toFixed(2)}s)`);
              }
              
              // 최초 로드시 소켓 전파하지 않음
              if (!isFirstLoadRef.current) {
                console.log("[오버레이 클릭] 소켓 이벤트 전파");
                onStateChange({ data: 2 });
              } else {
                console.log("[오버레이 클릭] 최초 로드시 소켓 이벤트 무시");
              }
            } else {
              console.log("[오버레이 클릭] 재생 명령 실행");
              
              // 권한이 없고 로컬에서 일시정지했다가 재생하는 경우 호스트 시간으로 동기화
              if (!hasPermission && wasLocallyPausedRef.current) {
                const localTime = localTimeStateRef.current;
                console.log(`[오버레이 클릭] 권한 없음: 호스트 시간으로 강제 동기화 (로컬: ${localTime.toFixed(2)}s -> 호스트: ${currentTime.toFixed(2)}s)`);
                player.seekTo(currentTime);
                lastSyncTimeRef.current = Date.now(); // 동기화 시간 기록
              }
              
              player.playVideo();
              setLastAction("play");
              
              // 최초 로드시 소켓 전파하지 않음
              if (!isFirstLoadRef.current) {
                console.log("[오버레이 클릭] 소켓 이벤트 전파");
                onStateChange({ data: 1 });
              } else {
                console.log("[오버레이 클릭] 최초 로드시 소켓 이벤트 무시");
                // 최초 로드 상태 해제
                isFirstLoadRef.current = false;
              }
            }
          });
        }}
        onDoubleClick={(e) => e.preventDefault()}
        style={{ pointerEvents: "all" }}
      />
    </div>
  )
}

