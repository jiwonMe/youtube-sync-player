"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import YouTube from "react-youtube"

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  currentTime: number
  onStateChange: (event: any) => void
  isMuted: boolean
  playerRef?: React.MutableRefObject<any>
  onVideoError?: (errorCode: number) => void
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  currentTime,
  onStateChange,
  isMuted,
  playerRef,
  onVideoError,
}: YouTubePlayerProps) {
  const internalPlayerRef = useRef<any>(null)
  const actualPlayerRef = playerRef || internalPlayerRef
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlayerMounted, setIsPlayerMounted] = useState(false)
  const [initialPlayTriggered, setInitialPlayTriggered] = useState(false)

  // Handle player ready
  const onReady = (event: any) => {
    try {
      actualPlayerRef.current = event.target
      setIsReady(true)
      setIsPlayerMounted(true)

      // 초기 시간 설정은 onReady에서 직접 하지 않고 useEffect에서 처리
      // 초기 음소거 설정도 useEffect에서 처리
    } catch (err) {
      console.error("Error in onReady:", err)
    }
  }

  // Handle player error
  const onError = (event: any) => {
    console.error("YouTube Player Error:", {
      data: event.data,
      target: event.target,
      error: {
        code: event.data,
        message: getErrorMessage(event.data)
      }
    });
    setError(getErrorMessage(event.data));
    
    // 에러 발생 시 부모 컴포넌트에 알림
    if (onVideoError) {
      onVideoError(event.data);
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

  // 초기 설정 (시간, 음소거)
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    // 약간의 지연을 두고 초기 설정 적용
    const timer = setTimeout(() => {
      safePlayerCall((player) => {
        // 초기 시간 설정
        if (currentTime > 0) {
          player.seekTo(currentTime);
        }
        
        // 초기 음소거 설정
        if (isMuted) {
          player.mute();
        } else {
          player.unMute();
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isReady, isPlayerMounted, currentTime, isMuted]);

  // Sync player state with component props
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    // 약간의 지연을 두고 재생 상태 변경
    const timer = setTimeout(() => {
      safePlayerCall((player) => {
        if (isPlaying) {
          player.playVideo();
          setInitialPlayTriggered(true);
        } else {
          player.pauseVideo();
        }
      });
    }, initialPlayTriggered ? 0 : 1000); // 첫 재생 시에는 더 긴 지연
    
    return () => clearTimeout(timer);
  }, [isPlaying, isReady, isPlayerMounted, initialPlayTriggered]);

  // Handle mute/unmute
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    const timer = setTimeout(() => {
      safePlayerCall((player) => {
        if (isMuted) {
          player.mute();
        } else {
          player.unMute();
        }
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isMuted, isReady, isPlayerMounted]);

  // Sync current time
  useEffect(() => {
    if (!isReady || !isPlayerMounted) return;
    
    safePlayerCall((player) => {
      // Only seek if the difference is significant (more than 3 seconds)
      // This prevents constant seeking which can cause playback issues
      try {
        const currentPlayerTime = player.getCurrentTime() || 0;
        if (Math.abs(currentPlayerTime - currentTime) > 3) {
          player.seekTo(currentTime);
        }
      } catch (err) {
        console.error("Error seeking:", err);
      }
    });
  }, [currentTime, isReady, isPlayerMounted]);

  // 컴포넌트 언마운트 시 플레이어 참조 정리
  useEffect(() => {
    return () => {
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
    <YouTube
      videoId={videoId}
      opts={{
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 0, // 자동 재생을 비활성화하고 수동으로 제어
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1, // Enable fullscreen button
          controls: 0, // Hide controls, we'll use our own
        },
      }}
      onReady={onReady}
      onStateChange={onStateChange}
      onError={onError}
      className="w-full h-full"
    />
  )
}

