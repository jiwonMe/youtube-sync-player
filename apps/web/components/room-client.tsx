"use client"

import React, { useEffect, useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Socket } from "socket.io-client"
import {
  Users,
  MessageSquare,
  List,
  X,
  Play,
  Youtube,
  Loader2,
  Share,
  Link,
  ExternalLink,
  Settings,
  Crown,
  Plus,
  Lock,
  Copy,
  Check,
  Activity,
  User,
} from "lucide-react"
import { DropResult } from "@hello-pangea/dnd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { YouTubePlayer } from "@/components/youtube-player"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { connectToRoom } from "@/services/socket-service"
import { extractYouTubeId, fetchVideoDetails, verifyRoomPassword } from "../utils/room-utils"
import { RoomState, VideoItem, EventLog } from "@/types/room"
import { ChatPanel } from "@/components/room/chat-panel"
import { PlaylistPanel } from "@/components/room/playlist-panel"
import { UsersPanel } from "@/components/room/users-panel" 
import { UpcomingPlaylist } from "@/components/room/upcoming-playlist"
import { AddVideoDialog } from "@/components/room/add-video-dialog"
import { VideoControls } from "@/components/room/video-controls"
import { PasswordDialog } from "@/components/room/password-dialog"
import { EventLogPanel } from "@/components/room/event-log-panel"
import { SettingsPanel } from "@/components/room/settings-panel"

/**
 * 방 클라이언트 컴포넌트
 */
export default function RoomClient({ roomId }: { roomId: string }) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { toast } = useToast()

  // State
  const [socket, setSocket] = useState<Socket | null>(null)
  const [roomState, setRoomState] = useState<RoomState>({
    roomName: "",
    hostId: "",
    users: [],
    currentVideo: null,
    playlist: [],
    isPlaying: false,
    currentTime: 0,
    messages: [],
    autoplay: true,
    eventLogs: [],
    videoControlPermission: 'all-users',
    playPermission: 'all-users',
    seekPermission: 'all-users',
    videoChangePermission: 'all-users',
  })
  const [chatInput, setChatInput] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showMobile, setShowMobile] = useState<"chat" | "playlist" | "users" | "eventlog" | "settings" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyRoomCodeSuccess, setCopyRoomCodeSuccess] = useState(false)
  const [isVideoChanging, setIsVideoChanging] = useState(false)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [roomInfo, setRoomInfo] = useState<{ roomName: string; isPasswordProtected: boolean }>({
    roomName: "",
    isPasswordProtected: false,
  })
  const [lastSyncTime, setLastSyncTime] = useState(0)
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null)
  const [hasInitialSync, setHasInitialSync] = useState(false) // 최초 동기화 여부 추적
  const [showChangeHostDialog, setShowChangeHostDialog] = useState(false)

  const playerRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastKnownTimeRef = useRef<number>(0) // 마지막으로 알려진 시간 참조

  // 룸 정보 확인 (비밀번호 보호 여부 체크)
  useEffect(() => {
    const checkRoomProtection = async () => {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
        const response = await fetch(`${socketUrl}/rooms/by-name?name=${roomId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch room info');
        }
        
        const data = await response.json();
        
        if (data.exists) {
          setRoomInfo({
            roomName: data.roomName || "Room",
            isPasswordProtected: data.isPasswordProtected
          });
          
          setIsPasswordProtected(data.isPasswordProtected);
          
          // 비밀번호 보호된 방이면 비밀번호 입력 대화상자 표시
          if (data.isPasswordProtected) {
            setShowPasswordDialog(true);
          } else {
            // 비밀번호 보호되지 않은 방이면 바로 연결
            setIsPasswordVerified(true);
          }
        }
      } catch (error) {
        console.error("Failed to check room protection:", error);
        // 에러가 발생해도 일단 연결 시도
        setIsPasswordVerified(true);
      }
    };
    
    checkRoomProtection();
  }, [roomId]);

  // 비밀번호 인증 함수
  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const success = await verifyRoomPassword(roomId, password);
      
      if (success) {
        setIsPasswordVerified(true);
        setShowPasswordDialog(false);
        toast({
          title: "인증 성공",
          description: "방에 입장합니다.",
        });
      }
      
      return success;
    } catch (error) {
      console.error("Failed to verify password:", error);
      return false;
    }
  };

  // 플레이어 상태 변경 리스너
  useEffect(() => {
    if (!socket) return;
    
    // 플레이어 상태 변경 핸들러
    const handleStateChangeEvent = (data: { isPlaying: boolean; currentTime: number }) => {
      console.log(`[서버 이벤트 수신] 플레이어 상태 변경: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${data.currentTime.toFixed(2)}`);
      
      // 상태 변경 잠금 설정 (중복 이벤트 방지)
      lockPlayerStateChange();
      
      // roomState 업데이트
      setRoomState((prev) => ({
        ...prev,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
      }));
    };
    
    // 플레이어 동기화 핸들러
    const handleSyncEvent = (data: { isPlaying: boolean; currentTime: number; syncTime: number; videoId?: string }) => {
      console.log(`[서버 동기화 수신] 플레이어 상태: ${data.isPlaying ? '재생' : '일시정지'}, 시간: ${data.currentTime.toFixed(2)}`);
      
      // 호스트가 아닌 경우만 동기화 처리 (호스트는 동기화를 보내는 쪽)
      if (!isUserHost()) {
        // 상태 변경 잠금 설정 (중복 이벤트 방지)
        lockPlayerStateChange();
        
        // 비디오 ID가 변경되었는지 확인
        if (data.videoId && (!roomState.currentVideo || roomState.currentVideo.videoId !== data.videoId)) {
          const video = roomState.playlist.find((v) => v.videoId === data.videoId);
          if (video) {
            setIsVideoChanging(true);
            setRoomState((prev) => ({
              ...prev,
              currentVideo: video,
              currentTime: data.currentTime,
              isPlaying: data.isPlaying,
            }));
            
            setTimeout(() => {
              setIsVideoChanging(false);
            }, 1000);
          }
        } else {
          // 비디오 시간과 상태만 업데이트
          setRoomState((prev) => ({
            ...prev,
            currentTime: data.currentTime,
            isPlaying: data.isPlaying,
          }));
        }
      }
    };
    
    // 시크 이벤트 핸들러
    const handleSeekEvent = (data: { currentTime: number }) => {
      console.log(`[서버 시크 수신] 시간: ${data.currentTime.toFixed(2)}`);
      
      // 상태 변경 잠금 설정 (중복 이벤트 방지)
      lockPlayerStateChange();
      
      setRoomState((prev) => ({
        ...prev,
        currentTime: data.currentTime,
      }));
    };
    
    // 이벤트 리스너 등록
    socket.on("player:stateChange", handleStateChangeEvent);
    socket.on("player:sync", handleSyncEvent);
    socket.on("player:seek", handleSeekEvent);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      socket.off("player:stateChange", handleStateChangeEvent);
      socket.off("player:sync", handleSyncEvent);
      socket.off("player:seek", handleSeekEvent);
    };
  }, [socket, roomState.currentVideo, roomState.playlist]);
  
  // Connect to socket when component mounts - 기존 이벤트 리스너 정리
  useEffect(() => {
    if (!isLoaded || !isPasswordVerified) return;

    // 게스트 ID 생성 (인증되지 않은 경우)
    const userId = isSignedIn ? user.id : `guest-${Math.random().toString(36).substring(2, 9)}`
    const userName = isSignedIn ? `${user.firstName} ${user.lastName}` : "Guest"
    const userImage = isSignedIn ? user.imageUrl : ""

    // 소켓 연결
    const socketIo = connectToRoom(roomId, userId, userName, userImage)
    setSocket(socketIo)

    // 방 상태 업데이트 리스너
    socketIo.on("room:state", (state) => {
      setIsLoading(false)
      setRoomState(state)
      
      // 최초 방 상태를 받았을 때 마지막 동기화 시간 설정
      if (state.lastSyncTime) {
        setLastSyncTime(state.lastSyncTime);
      }
      
      // 최초 접속 시 동기화 요청 (비호스트만)
      const isUserHost = isSignedIn && user?.id === state.hostId;
      if (!isUserHost && !hasInitialSync) {
        // 서버에 동기화 요청
        socketIo.emit("player:requestSync");
        setHasInitialSync(true);
      }
    })

    // 이벤트 로그 리스너 추가
    socketIo.on("room:eventLog", (eventLog: EventLog) => {
      setRoomState((prev) => ({
        ...prev,
        eventLogs: [...prev.eventLogs, eventLog]
      }))
    })

    // 자동 재생 토글 리스너
    socketIo.on("autoplay:toggle", (data: { autoplay: boolean }) => {
      setRoomState((prev) => ({
        ...prev,
        autoplay: data.autoplay,
      }))
    })

    // 비디오 변경 리스너
    socketIo.on("video:change", (data) => {
      const video = roomState.playlist.find((v) => v.videoId === data.videoId)
      if (video) {
        setIsVideoChanging(true)
        
        setRoomState((prev) => ({
          ...prev,
          currentVideo: video,
          currentTime: data.currentTime || 0,
          isPlaying: true,
        }))
        
        setTimeout(() => {
          const playlistItem = document.getElementById(`playlist-item-${video.id}`)
          if (playlistItem) {
            playlistItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          
          setTimeout(() => {
            setIsVideoChanging(false)
          }, 500)
        }, 300)
      }
    })

    // 플레이리스트 업데이트 리스너
    socketIo.on("playlist:update", (playlist) => {
      setRoomState((prev) => ({
        ...prev,
        playlist,
      }))
    })

    // 플레이리스트 재정렬 리스너
    socketIo.on("playlist:reorder", (playlist) => {
      setRoomState((prev) => ({
        ...prev,
        playlist,
      }))
    })

    // 채팅 메시지 리스너
    socketIo.on("chat:message", (message) => {
      setRoomState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }))
    })

    // 사용자 참가 리스너
    socketIo.on("user:joined", (user) => {
      setRoomState((prev) => ({
        ...prev,
        users: [...prev.users, { ...user, socketId: "" }],
      }))
    })

    // 사용자 퇴장 리스너
    socketIo.on("user:left", (userId) => {
      setRoomState((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
      }))
    })

    // 호스트 변경 리스너 추가
    socketIo.on("host:changed", (data: { id: string, name: string }) => {
      // roomState 업데이트
      setRoomState((prev) => {
        // 새 호스트 ID 업데이트
        const updatedState = {
          ...prev,
          hostId: data.id,
          // 모든 사용자의 호스트 상태 업데이트
          users: prev.users.map(user => ({
            ...user,
            isHost: user.id === data.id
          }))
        };
        
        return updatedState;
      });
      
      // 현재 사용자가 새 호스트인지 확인하고 알림 표시
      if (isSignedIn && user?.id === data.id) {
        toast({
          title: "호스트 권한을 얻었습니다",
          description: "이제 방의 호스트가 되었습니다. 비디오 재생을 제어할 수 있습니다.",
          duration: 5000,
        });
      } else {
        // 다른 사용자에게 호스트 변경 알림
        toast({
          title: "호스트가 변경되었습니다",
          description: `${data.name}님이 새로운 호스트가 되었습니다.`,
          duration: 3000,
        });
      }
    });

    // 비디오 제어 권한 변경 리스너 추가
    socketIo.on("video:controlPermission", (data: { permission: 'host-only' | 'all-users' }) => {
      setRoomState((prev) => ({
        ...prev,
        videoControlPermission: data.permission,
      }));
      
      // 알림 표시
      toast({
        title: "비디오 제어 권한 변경",
        description: data.permission === 'host-only' 
          ? "방장만 비디오를 제어할 수 있습니다." 
          : "모든 참가자가 비디오를 제어할 수 있습니다.",
      });
    });

    // 소켓 연결 정리
    return () => {
      if (socketIo) {
        socketIo.disconnect()
      }
      
      // 동기화 인터벌 정리
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      socketIo.off("room:eventLog")
    }
  }, [roomId, user, isSignedIn, isLoaded, isPasswordVerified, hasInitialSync, roomState.hostId])

  // 호스트 동기화 메커니즘 - 1초마다 재생 시간 전송
  useEffect(() => {
    if (!socket || !playerRef.current) return;
    
    const isHost = isSignedIn && user?.id === roomState.hostId;
    
    // 기존 인터벌 제거
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    // 호스트만 동기화 인터벌 설정
    if (isHost) {
      console.log("호스트로서 동기화 인터벌 설정");
      
      // 1초마다 재생 시간 전송
      const newInterval = setInterval(() => {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const isPlaying = playerRef.current.getPlayerState() === 1;
          const videoId = roomState.currentVideo?.videoId;
          
          socket.emit("player:sync", {
            isPlaying: isPlaying,
            currentTime: currentTime,
            videoId: videoId
          });
        } catch (err) {
          console.error("동기화 데이터 전송 중 오류:", err);
        }
      }, 1000); // 1초마다 실행
      
      setSyncInterval(newInterval);
      
      return () => {
        clearInterval(newInterval);
      };
    } else {
      console.log("일반 사용자로서 동기화 인터벌 해제");
    }
  }, [socket, user, isSignedIn, roomState.hostId]);

  // 새 메시지 도착 시 채팅 스크롤 아래로 이동
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [roomState.messages])

  // 비디오 진행 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && roomState.isPlaying && 
          typeof playerRef.current.getCurrentTime === 'function' && 
          typeof playerRef.current.getDuration === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0
          const duration = playerRef.current.getDuration() || 0
          setVideoProgress((currentTime / duration) * 100)
          setVideoDuration(duration)
        } catch (err) {
          console.error("Error updating video progress:", err)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roomState.isPlaying])

  // 현재 사용자가 호스트인지 확인하는 함수
  const isUserHost = (): boolean => {
    return Boolean(isSignedIn && user && user.id === roomState.hostId);
  }

  // 상태 변경 방지를 위한 디바운스 메커니즘
  const playerStateChangeLock = useRef<boolean>(false);
  const playerStateChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // 상태 변경 잠금 설정 함수
  const lockPlayerStateChange = () => {
    playerStateChangeLock.current = true;
    
    // 이전 타이머가 있다면 정리
    if (playerStateChangeTimeout.current) {
      clearTimeout(playerStateChangeTimeout.current);
    }
    
    // 500ms 후에 잠금 해제
    playerStateChangeTimeout.current = setTimeout(() => {
      playerStateChangeLock.current = false;
      playerStateChangeTimeout.current = null;
    }, 500);
  };

  // YouTube 플레이어 상태 변경 핸들러
  const handlePlayerStateChange = (event: any) => {
    // YouTube player state codes:
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
    const playerState = event.data;

    // 디버깅을 위한 로그
    console.log(`[Player 이벤트] 상태 변경: ${playerState}, 잠금 상태: ${playerStateChangeLock.current}`);

    // 비디오가 변경 중이거나 상태 변경이 잠겨있으면 이벤트 무시
    if (isVideoChanging || playerStateChangeLock.current) {
      console.log("[Player 이벤트] 무시됨: 비디오 변경 중 또는 잠금 상태");
      return;
    }

    // 호스트가 아니면 직접 상태를 변경하지 않음
    if (!isUserHost()) {
      console.log("[Player 이벤트] 무시됨: 호스트 아님");
      return;
    }

    // 현재 재생 시간 확인
    const playerInstance = playerRef.current;
    if (playerInstance) {
      const currentTime = playerInstance.getCurrentTime() || 0;
      
      // 시크 감지 - 마지막 알려진 시간과 현재 시간의 차이가 3초 이상이면 시크로 간주
      if (Math.abs(currentTime - lastKnownTimeRef.current) > 3) {
        console.log(`[시크 감지] 시간 이동: ${lastKnownTimeRef.current}s → ${currentTime}s`);
        // 시크 이벤트 전파
        socket?.emit('player:seek', {
          currentTime: currentTime
        });
      }
      
      // 현재 시간 업데이트
      lastKnownTimeRef.current = currentTime;
    }

    // 상태 변경 시에만 처리
    if (playerState === 1 && !roomState.isPlaying) { // Playing → UI는 일시정지 상태
      console.log(`[상태 변경 감지] 실제 플레이어: 재생 중, UI: 일시정지 상태`);
      
      // UI 상태 업데이트
      setRoomState(prev => ({...prev, isPlaying: true}));
      
      // 상태 변경 잠금 설정
      lockPlayerStateChange();
      
      // 서버에 상태 변경 전달
      socket?.emit('player:stateChange', {
        roomId: roomId,
        stateChange: {
          playing: true,
          currentTime: playerRef.current.getCurrentTime() || 0,
          playbackRate: playerRef.current.getPlaybackRate() || 1
        }
      });
      
      console.log(`[재생 이벤트 발송] ${isSignedIn ? `${user?.firstName} ${user?.lastName}` : "Guest"}`);
    } 
    else if (playerState === 2 && roomState.isPlaying) { // Paused → UI는 재생 상태
      console.log(`[상태 변경 감지] 실제 플레이어: 일시정지, UI: 재생 중`);
      
      // UI 상태 업데이트
      setRoomState(prev => ({...prev, isPlaying: false}));
      
      // 상태 변경 잠금 설정
      lockPlayerStateChange();
      
      // 서버에 상태 변경 전달
      socket?.emit('player:stateChange', {
        roomId: roomId,
        stateChange: {
          playing: false,
          currentTime: playerRef.current.getCurrentTime() || 0,
          playbackRate: playerRef.current.getPlaybackRate() || 1
        }
      });
      
      console.log(`[일시정지 이벤트 발송] ${isSignedIn ? `${user?.firstName} ${user?.lastName}` : "Guest"}`);
    } 
    else if (playerState === 0 && roomState.autoplay) { // Ended with autoplay
      // 동영상 종료 시 다음 동영상 재생 (자동 재생이 활성화된 경우)
      console.log("[비디오 종료] 자동 재생으로 다음 비디오 재생");
      handleNextVideo(true);
    }
  };

  // 재생/일시정지 핸들러
  const handlePlayPause = () => {
    // 비디오 제어 권한 확인
    const isHost = isUserHost();
    const hasPermission = roomState.videoControlPermission === 'all-users' || isHost;
    
    if (!hasPermission) {
      // 권한이 없으면 알림
      toast({
        title: "권한이 없습니다",
        description: "방장만 영상을 제어할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // 비디오가 없으면 동작하지 않음
    if (!roomState.currentVideo || isVideoChanging) {
      console.log("[버튼 클릭] 무시: 비디오 없음 또는 비디오 변경 중");
      return;
    }

    // 상태 변경 중이면 무시
    if (playerStateChangeLock.current) {
      console.log("[버튼 클릭] 무시: 상태 변경 잠금 활성화");
      return;
    }

    try {
      // 현재 플레이어의 실제 상태 확인
      const currentPlayerState = playerRef.current?.getPlayerState?.();
      const isCurrentlyPlaying = currentPlayerState === 1; // 1: playing
      
      // 현재 UI 상태와 플레이어 상태가 일치하는지 확인
      if (roomState.isPlaying !== isCurrentlyPlaying) {
        console.log(`[상태 불일치 감지] UI: ${roomState.isPlaying ? '재생' : '일시정지'}, 플레이어: ${isCurrentlyPlaying ? '재생' : '일시정지'}`);
      }
      
      // UI 상태 변경
      const newIsPlaying = !roomState.isPlaying;
      console.log(`[버튼 클릭] ${newIsPlaying ? '재생' : '일시정지'} 버튼 클릭`);
      
      // 상태 업데이트 및 중복 이벤트 방지를 위한 잠금 설정
      lockPlayerStateChange();
      
      // UI 상태 업데이트
      setRoomState((prev) => ({ ...prev, isPlaying: newIsPlaying }));
  
      // 소켓 이벤트 전송
      if (socket) {
        const currentTime = playerRef.current?.getCurrentTime() || 0;
        const playbackRate = playerRef.current?.getPlaybackRate() || 1;
        
        socket.emit("player:stateChange", {
          roomId: roomId,
          stateChange: {
            playing: newIsPlaying,
            currentTime: currentTime,
            playbackRate: playbackRate
          }
        });
        
        console.log(`[상태 변경 이벤트 발송] playing: ${newIsPlaying}, time: ${currentTime.toFixed(2)}`);
      }
    } catch (err) {
      console.error("[버튼 클릭 오류]", err);
    }
  };

  // 비디오 에러 처리 함수
  const handleVideoError = (errorCode: number) => {
    console.error(`YouTube 비디오 에러 발생: ${errorCode}`)
    
    let errorMessage = "비디오 재생 중 오류가 발생했습니다."
    
    switch (errorCode) {
      case 2:
        errorMessage = "잘못된 비디오 URL 매개변수입니다."
        break
      case 5:
        errorMessage = "HTML5 플레이어에서 재생할 수 없는 비디오입니다."
        break
      case 100:
        errorMessage = "비디오를 찾을 수 없습니다. 삭제되었거나 비공개로 설정되었을 수 있습니다."
        break
      case 101:
      case 150:
        errorMessage = "비디오 소유자가 임베드 재생을 허용하지 않습니다."
        break
    }
    
    toast({
      title: "비디오 재생 오류",
      description: `${errorMessage} 다음 비디오로 자동 전환합니다.`,
      variant: "destructive",
    })
    
    setIsVideoChanging(true)
    handleNextVideo(true)
  }

  // 다음 비디오 핸들러
  const handleNextVideo = (forceNext: boolean = false) => {
    const currentIndex = roomState.playlist.findIndex((video) => video.id === roomState.currentVideo?.id)
    const isVideoEnded = playerRef.current?.getPlayerState?.() === 0
    const isAutoplayDisabled = !roomState.autoplay
    const isUserInitiated = !isVideoEnded || forceNext
    
    if (isAutoplayDisabled && isVideoEnded && !isUserInitiated) {
      return
    }

    if (currentIndex < roomState.playlist.length - 1) {
      const nextVideo = roomState.playlist[currentIndex + 1]
      setIsVideoChanging(true)
      
      if (socket) {
        socket.emit("video:change", nextVideo.id)
        
        setRoomState((prev) => ({
          ...prev,
          currentVideo: nextVideo,
          currentTime: 0,
          isPlaying: true,
        }))
        
        setTimeout(() => {
          setIsVideoChanging(false)
        }, 1000)
      }
    }
  }

  // 채팅 제출 핸들러
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (chatInput.trim() === "") return

    if (socket) {
      socket.emit("chat:message", chatInput)
    }

    setChatInput("")
  }

  // 비디오 선택 핸들러
  const handleVideoSelect = (video: VideoItem) => {
    if (roomState.currentVideo?.id === video.id) {
      return
    }
    
    setIsVideoChanging(true)
    
    if (socket) {
      socket.emit("video:change", video.id)
      
      setRoomState((prev) => ({
        ...prev,
        currentVideo: video,
        currentTime: 0,
        isPlaying: true,
      }))
      
      setTimeout(() => {
        setIsVideoChanging(false)
      }, 1000)
    }
  }

  // 비디오 제거 핸들러
  const handleRemoveVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 부모 onClick 이벤트 전파 방지

    if (socket) {
      socket.emit("playlist:remove", videoId)
    }
  }

  // 비디오 추가 핸들러
  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return

    setIsAddingVideo(true)

    try {
      const videoId = extractYouTubeId(videoUrl)

      if (!videoId) {
        alert("Invalid YouTube URL")
        return
      }

      const videoDetails = await fetchVideoDetails(videoId)

      if (!videoDetails) {
        alert("Failed to fetch video details")
        return
      }

      const isPlaylistEmpty = roomState.playlist.length === 0 || !roomState.currentVideo
      
      const newVideo = {
        id: `video-${Date.now()}`,
        videoId,
        title: videoDetails.title,
        thumbnailUrl: videoDetails.thumbnailUrl,
      }

      if (socket) {
        socket.emit("playlist:add", newVideo)
        
        if (isPlaylistEmpty) {
          setRoomState((prev) => ({
            ...prev,
            currentVideo: newVideo,
            isPlaying: true,
            currentTime: 0,
          }))
        }
      }

      setShowAddVideoDialog(false)
      setVideoUrl("")
    } catch (error) {
      console.error("Error adding video:", error)
      alert("Failed to add video")
    } finally {
      setIsAddingVideo(false)
    }
  }

  // 방 링크 공유
  const handleShareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my YouTube room: ${roomState.roomName}`,
        text: `I'm watching YouTube videos in ${roomState.roomName}. Join me!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }
  
  // 방 코드 복사
  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopyRoomCodeSuccess(true)
    setTimeout(() => setCopyRoomCodeSuccess(false), 2000)
    
    toast({
      title: "방 코드가 복사되었습니다",
      description: "친구에게 공유하여 함께 시청해보세요",
    })
  }

  // 자동 재생 토글 핸들러
  const handleToggleAutoplay = () => {
    const newAutoplay = !roomState.autoplay
    setRoomState((prev) => ({ ...prev, autoplay: newAutoplay }))

    if (socket) {
      const currentTime = playerRef.current?.getCurrentTime() || 0
      socket.emit("autoplay:toggle", {
        isPlaying: roomState.isPlaying,
        currentTime: currentTime,
        autoplay: roomState.autoplay,
      })
    }
  }

  // 플레이리스트 재정렬 핸들러
  const handlePlaylistReorder = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    
    const newPlaylist = [...roomState.playlist]
    const [movedItem] = newPlaylist.splice(result.source.index, 1)
    newPlaylist.splice(result.destination.index, 0, movedItem)
    
    setRoomState(prev => ({
      ...prev,
      playlist: newPlaylist
    }))
    
    if (socket) {
      socket.emit("playlist:reorder", newPlaylist)
    }
  }

  // 비밀번호 입력 취소 처리
  const handlePasswordCancel = () => {
    // 취소 시 이전 페이지로 이동
    window.history.back();
  };

  // 현재 사용자가 방장인지 여부
  const isHost = isSignedIn && user?.id === roomState.hostId
  const hasNextVideo = roomState.currentVideo 
    ? roomState.playlist.findIndex((v) => v.id === roomState.currentVideo?.id) < roomState.playlist.length - 1
    : false

  // 비밀번호 보호된 방이고, 아직 인증되지 않은 경우 로딩 상태 표시
  if (isPasswordProtected && !isPasswordVerified) {
    return (
      <>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <PasswordDialog 
            isOpen={showPasswordDialog}
            onClose={handlePasswordCancel}
            onVerify={handlePasswordVerify}
            roomName={roomInfo.roomName}
          />
        </div>
      </>
    );
  }

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
        
        // 알림 표시
        toast({
          title: "비디오 제어 권한 변경",
          description: value === 'host-only' 
            ? "방장만 비디오를 제어할 수 있습니다." 
            : "모든 참가자가 비디오를 제어할 수 있습니다.",
        });
        break;
        
      case 'play':
        // 재생/일시정지 권한 변경
        socket.emit("permission:update", { type: "play", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          playPermission: value,
        }));
        
        // 알림 표시
        toast({
          title: "재생/일시정지 권한 변경",
          description: value === 'host-only' 
            ? "방장만 영상을 재생/일시정지할 수 있습니다." 
            : "모든 참가자가 영상을 재생/일시정지할 수 있습니다.",
        });
        break;
        
      case 'seek':
        // 시크 권한 변경
        socket.emit("permission:update", { type: "seek", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          seekPermission: value,
        }));
        
        // 알림 표시
        toast({
          title: "시크 권한 변경",
          description: value === 'host-only' 
            ? "방장만 영상 시간을 이동할 수 있습니다." 
            : "모든 참가자가 영상 시간을 이동할 수 있습니다.",
        });
        break;
        
      case 'videoChange':
        // 비디오 변경 권한 변경
        socket.emit("permission:update", { type: "videoChange", value });
        
        // 로컬 상태 업데이트
        setRoomState((prev) => ({
          ...prev,
          videoChangePermission: value,
        }));
        
        // 알림 표시
        toast({
          title: "영상 변경 권한 변경",
          description: value === 'host-only' 
            ? "방장만 영상을 변경할 수 있습니다." 
            : "모든 참가자가 영상을 변경할 수 있습니다.",
        });
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
      toast({
        title: "권한이 없습니다",
        description: "방장만 호스트 권한을 이전할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // 다른 사용자가 없으면 이전할 수 없음
    if (roomState.users.length <= 1) {
      toast({
        title: "권한 이전 불가",
        description: "방에 다른 사용자가 없어 권한을 이전할 수 없습니다.",
        variant: "destructive",
      });
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
    
    // 알림 표시
    toast({
      title: "호스트 권한 이전",
      description: "호스트 권한이 다른 사용자에게 이전되었습니다.",
    });
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* 방 정보 상단바 */}
        <div className="bg-muted/80 p-2 px-4 flex items-center justify-between border-b sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center">
            <h1 className="font-semibold truncate max-w-[200px] md:max-w-md flex items-center">
              {isLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2 text-amber-500 hidden sm:inline-block" />
                  {roomState.roomName}
                  {isPasswordProtected && (
                    <Lock className="h-4 w-4 ml-2 text-amber-500" />
                  )}
                </>
              )}
            </h1>
            <Badge variant="outline" className="ml-2 text-xs">
              {isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <>
                  <Users className="h-3 w-3 mr-1 inline" />
                  {roomState.users.length} {roomState.users.length === 1 ? "viewer" : "viewers"}
                </>
              )}
            </Badge>
          </div>
          
          {/* 방 코드 표시 및 복사 버튼 */}
          <div className="hidden sm:flex items-center bg-background/80 rounded-md border px-2 py-1 mr-2">
            <span className="text-xs font-medium mr-2">방 코드:</span>
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{roomId}</code>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 ml-1" 
              onClick={handleCopyRoomCode}
              title="방 코드 복사"
            >
              {copyRoomCodeSuccess ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* 모바일에서만 보이는 방 코드 복사 버튼 */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopyRoomCode} 
              className="h-8 sm:hidden"
              title="방 코드 복사"
            >
              <Copy className="h-4 w-4 mr-2" />
              <span>코드</span>
              {copyRoomCodeSuccess && <Badge className="ml-2 bg-green-500 h-5 text-[10px]">Copied!</Badge>}
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleShareRoom} className="h-8">
              <Share className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline-block">Share</span>
              {copySuccess && <Badge className="ml-2 bg-green-500 h-5 text-[10px]">Copied!</Badge>}
            </Button>

            {isHost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>룸 설정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleChangeUserHost}>
                    호스트 권한 이전
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>비디오 제어 권한</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => handleVideoControlPermissionChange('host-only')}
                    className={roomState.videoControlPermission === 'host-only' ? 'bg-accent' : ''}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    방장만 제어 가능
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleVideoControlPermissionChange('all-users')}
                    className={roomState.videoControlPermission === 'all-users' ? 'bg-accent' : ''}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    모든 참가자 제어 가능
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 비디오 플레이어 섹션 */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* 비디오 플레이어 */}
            <div className="relative bg-black aspect-video">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : roomState.currentVideo ? (
                <>
                  <YouTubePlayer
                    videoId={roomState.currentVideo.videoId}
                    isPlaying={roomState.isPlaying}
                    currentTime={roomState.currentTime}
                    onStateChange={handlePlayerStateChange}
                    isMuted={isMuted}
                    playerRef={playerRef}
                    onVideoError={handleVideoError}
                  />
                  {isVideoChanging && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-white">비디오 로딩 중...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-zinc-900/90 backdrop-blur-sm p-4">
                  <Youtube className="h-16 w-16 mb-4 text-red-600" />
                  <p className="text-xl font-bold mb-2">재생 중인 영상이 없습니다</p>
                  <p className="text-sm text-zinc-400 mb-6 text-center max-w-md">
                    아래 버튼을 클릭하여 YouTube 영상을 추가하고 친구들과 함께 시청해보세요
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setShowAddVideoDialog(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    YouTube 영상 추가하기
                  </Button>
                </div>
              )}
            </div>

            {/* 비디오 컨트롤 */}
            <VideoControls
              currentVideo={roomState.currentVideo}
              isPlaying={roomState.isPlaying}
              isMuted={isMuted}
              autoplay={roomState.autoplay}
              videoProgress={videoProgress}
              isLoading={isLoading}
              playerRef={playerRef}
              videoDuration={videoDuration}
              hasNextVideo={hasNextVideo}
              handlePlayPause={handlePlayPause}
              handleNextVideo={handleNextVideo}
              setIsMuted={setIsMuted}
              handleToggleAutoplay={handleToggleAutoplay}
              showAddVideoDialog={showAddVideoDialog}
              setShowAddVideoDialog={setShowAddVideoDialog}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              handleAddVideo={handleAddVideo}
              isAddingVideo={isAddingVideo}
              isAllowedToControl={roomState.videoControlPermission === 'all-users' || isUserHost()}
            />

            {/* 모바일 네비게이션 버튼 */}
            <div className="flex items-center md:hidden p-1 bg-muted/30 border-t">
              <Button
                variant={showMobile === "playlist" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowMobile(showMobile === "playlist" ? null : "playlist")}
                className="text-xs flex-1 rounded-none h-10"
              >
                <List className={`h-4 w-4 ${showMobile === "playlist" ? "text-primary" : ""}`} />
                <span className="ml-1">Playlist</span>
              </Button>
              <Button
                variant={showMobile === "chat" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowMobile(showMobile === "chat" ? null : "chat")}
                className="text-xs flex-1 rounded-none h-10"
              >
                <MessageSquare className={`h-4 w-4 ${showMobile === "chat" ? "text-primary" : ""}`} />
                <span className="ml-1">Chat</span>
              </Button>
              <Button
                variant={showMobile === "users" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowMobile(showMobile === "users" ? null : "users")}
                className="text-xs flex-1 rounded-none h-10"
              >
                <Users className={`h-4 w-4 ${showMobile === "users" ? "text-primary" : ""}`} />
                <span className="ml-1">Users</span>
              </Button>
            </div>

            {/* 예정된 플레이리스트 */}
            {roomState.currentVideo && roomState.playlist.length > 1 && (
              <UpcomingPlaylist
                playlist={roomState.playlist}
                currentVideo={roomState.currentVideo}
                handleVideoSelect={handleVideoSelect}
                handleRemoveVideo={handleRemoveVideo}
                isHost={!!isHost}
                handlePlaylistReorder={handlePlaylistReorder}
                socket={socket}
                showAddVideoDialog={showAddVideoDialog}
                setShowAddVideoDialog={setShowAddVideoDialog}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                handleAddVideo={handleAddVideo}
                isAddingVideo={isAddingVideo}
              />
            )}

            {/* 모바일 플레이리스트/채팅 (모바일에서만 활성화될 때 표시) */}
            {showMobile && (
              <div className="md:hidden flex-1 flex flex-col overflow-hidden border-t">
                <div className="p-2 bg-muted flex items-center justify-between">
                  <h3 className="font-medium">
                    {showMobile === "chat" ? "Chat" : 
                     showMobile === "playlist" ? "Playlist" : 
                     showMobile === "users" ? "Viewers" : 
                     showMobile === "settings" ? "Settings" : 
                     showMobile === "eventlog" ? "Event Log" : ""}
                  </h3>
                  <div className="flex items-center gap-2">
                    {showMobile === "playlist" && (
                      <AddVideoDialog
                        showAddVideoDialog={showAddVideoDialog}
                        setShowAddVideoDialog={setShowAddVideoDialog}
                        videoUrl={videoUrl}
                        setVideoUrl={setVideoUrl}
                        handleAddVideo={handleAddVideo}
                        isAddingVideo={isAddingVideo}
                      />
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setShowMobile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showMobile === "chat" ? (
                  <ChatPanel
                    messages={roomState.messages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleChatSubmit={handleChatSubmit}
                    isLoading={isLoading}
                    chatEndRef={chatEndRef}
                  />
                ) : showMobile === "playlist" ? (
                  <PlaylistPanel
                    playlist={roomState.playlist}
                    currentVideo={roomState.currentVideo}
                    handleVideoSelect={handleVideoSelect}
                    handleRemoveVideo={handleRemoveVideo}
                    isLoading={isLoading}
                    isHost={isHost}
                    handlePlaylistReorder={handlePlaylistReorder}
                    socket={socket}
                    showAddVideoDialog={showAddVideoDialog}
                    setShowAddVideoDialog={setShowAddVideoDialog}
                    videoUrl={videoUrl}
                    setVideoUrl={setVideoUrl}
                    handleAddVideo={handleAddVideo}
                    isAddingVideo={isAddingVideo}
                    isPlaying={roomState.isPlaying}
                  />
                ) : showMobile === "users" ? (
                  <UsersPanel 
                    users={roomState.users} 
                    hostId={roomState.hostId} 
                    isLoading={isLoading} 
                  />
                ) : showMobile === "eventlog" ? (
                  <EventLogPanel logs={roomState.eventLogs || []} />
                ) : showMobile === "settings" ? (
                  <SettingsPanel
                    socket={socket}
                    isHost={!!isHost}
                    hostId={roomState.hostId}
                    users={roomState.users}
                    videoControlPermission={roomState.videoControlPermission}
                    playPermission={roomState.playPermission}
                    seekPermission={roomState.seekPermission}
                    videoChangePermission={roomState.videoChangePermission}
                    onChangeHost={handleChangeUserHost}
                    onUpdatePermission={handlePermissionChange}
                    isLoading={isLoading}
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* 사이드바 - 태블릿 및 데스크톱 전용 */}
          <div className="hidden md:flex w-80 border-l bg-card flex-shrink-0 flex-col h-full">
            <Tabs defaultValue="playlist" className="flex flex-col w-full h-full">
              <TabsList className="w-full justify-start pl-2">
                <TabsTrigger value="chat" className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="playlist" className="flex items-center gap-1">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Playlist</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="eventlog" className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Event Log</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="playlist" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  <PlaylistPanel
                    playlist={roomState.playlist}
                    currentVideo={roomState.currentVideo}
                    handleVideoSelect={handleVideoSelect}
                    handleRemoveVideo={handleRemoveVideo}
                    isLoading={isLoading}
                    isHost={isHost}
                    handlePlaylistReorder={handlePlaylistReorder}
                    socket={socket}
                    showAddVideoDialog={showAddVideoDialog}
                    setShowAddVideoDialog={setShowAddVideoDialog}
                    videoUrl={videoUrl}
                    setVideoUrl={setVideoUrl}
                    handleAddVideo={handleAddVideo}
                    isAddingVideo={isAddingVideo}
                    isPlaying={roomState.isPlaying}
                  />
                </TabsContent>

                <TabsContent value="chat" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  <ChatPanel
                    messages={roomState.messages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleChatSubmit={handleChatSubmit}
                    isLoading={isLoading}
                    chatEndRef={chatEndRef}
                  />
                </TabsContent>

                <TabsContent value="users" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  <UsersPanel users={roomState.users} hostId={roomState.hostId} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="eventlog" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  <EventLogPanel logs={roomState.eventLogs || []} />
                </TabsContent>
                
                <TabsContent value="settings" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  {/* 설정 패널 컴포넌트 */}
                  <SettingsPanel
                    socket={socket}
                    isHost={!!isHost}
                    hostId={roomState.hostId}
                    users={roomState.users}
                    videoControlPermission={roomState.videoControlPermission}
                    playPermission={roomState.playPermission}
                    seekPermission={roomState.seekPermission}
                    videoChangePermission={roomState.videoChangePermission}
                    onChangeHost={handleChangeUserHost}
                    onUpdatePermission={handlePermissionChange}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      <Toaster />

      {/* Mobile bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-around">
          <Button 
            variant="ghost" 
            onClick={() => setShowMobile("chat")}
            className="flex-1 py-6"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowMobile("playlist")}
            className="flex-1 py-6"
          >
            <List className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowMobile("users")}
            className="flex-1 py-6"
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowMobile("eventlog")}
            className="flex-1 py-6"
          >
            <Activity className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowMobile("settings")}
            className="flex-1 py-6"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 호스트 권한 이전 대화상자 */}
      <Dialog open={showChangeHostDialog} onOpenChange={setShowChangeHostDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>호스트 권한 이전</DialogTitle>
            <DialogDescription>
              다른 사용자에게 호스트 권한을 이전합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roomState.users.filter(u => u.id !== user?.id).map(user => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                onClick={() => transferHostToUser(user.id)}
              >
                <div className="flex items-center">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <span>{user.name}</span>
                </div>
                <Button size="sm" variant="default">
                  호스트로 지정
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeHostDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
