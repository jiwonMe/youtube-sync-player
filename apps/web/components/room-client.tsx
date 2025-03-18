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
} from "lucide-react"
import { DropResult } from "@hello-pangea/dnd"

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
import { RoomState, VideoItem } from "@/types/room"
import { ChatPanel } from "@/components/room/chat-panel"
import { PlaylistPanel } from "@/components/room/playlist-panel"
import { UsersPanel } from "@/components/room/users-panel" 
import { UpcomingPlaylist } from "@/components/room/upcoming-playlist"
import { AddVideoDialog } from "@/components/room/add-video-dialog"
import { VideoControls } from "@/components/room/video-controls"
import { PasswordDialog } from "@/components/room/password-dialog"

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
  })
  const [chatInput, setChatInput] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showMobile, setShowMobile] = useState<"chat" | "playlist" | "users" | null>(null)
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

  const playerRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  // Connect to socket when component mounts
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

    // 플레이어 상태 변경 리스너
    socketIo.on("player:stateChange", (data: { isPlaying: boolean; currentTime: number }) => {
      setRoomState((prev) => ({
        ...prev,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
      }))
    })

    // 동기화 데이터 수신 리스너
    socketIo.on("player:sync", (data: { isPlaying: boolean; currentTime: number; syncTime: number; videoId?: string }) => {
      // 동기화 데이터 수신
      setLastSyncTime(data.syncTime);
      
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
    });

    // 동기화 요청 리스너 (호스트만 처리)
    socketIo.on("player:requestSync", (data: { userId: string; socketId: string }) => {
      const isHost = isSignedIn && user?.id === roomState.hostId;
      
      if (isHost && playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const isPlaying = playerRef.current.getPlayerState() === 1;
          const videoId = roomState.currentVideo?.videoId;
          
          // 특정 사용자에게 동기화 데이터 전송
          socketIo.emit("player:syncTo", {
            targetSocketId: data.socketId,
            isPlaying: isPlaying,
            currentTime: currentTime,
            videoId: videoId
          });
        } catch (err) {
          console.error("동기화 데이터 전송 중 오류:", err);
        }
      }
    });

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

    // 소켓 연결 정리
    return () => {
      if (socketIo) {
        socketIo.disconnect()
      }
      
      // 동기화 인터벌 정리
      if (syncInterval) {
        clearInterval(syncInterval);
      }
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
    }
  }, [socket, user, isSignedIn, roomState.hostId, playerRef.current]);

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

  // 플레이어 상태 변경 핸들러
  const handlePlayerStateChange = (event: any) => {
    if (event.data === 1) {
      // 재생
      setRoomState((prev) => ({ ...prev, isPlaying: true }))

      if (!roomState.isPlaying && socket) {
        const currentTime = playerRef.current?.getCurrentTime() || 0
        socket.emit("player:stateChange", {
          isPlaying: true,
          currentTime: currentTime,
        })
      }
    } else if (event.data === 2) {
      // 일시정지
      setRoomState((prev) => ({ ...prev, isPlaying: false }))

      if (roomState.isPlaying && socket) {
        const currentTime = playerRef.current?.getCurrentTime() || 0
        socket.emit("player:stateChange", {
          isPlaying: false,
          currentTime: currentTime,
        })
      }
    } else if (event.data === 0) {
      // 종료 - 다음 비디오 재생
      handleNextVideo()
    }
  }

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

  // 재생/일시정지 핸들러
  const handlePlayPause = () => {
    const newIsPlaying = !roomState.isPlaying
    setRoomState((prev) => ({ ...prev, isPlaying: newIsPlaying }))

    if (socket) {
      const currentTime = playerRef.current?.getCurrentTime() || 0
      socket.emit("player:stateChange", {
        isPlaying: newIsPlaying,
        currentTime: currentTime,
      })
    }
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
              <Button size="sm" variant="outline" className="h-8">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline-block">Settings</span>
              </Button>
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
                    {showMobile === "chat" ? "Chat" : showMobile === "playlist" ? "Playlist" : "Viewers"}
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
                ) : (
                  <UsersPanel 
                    users={roomState.users} 
                    hostId={roomState.hostId} 
                    isLoading={isLoading} 
                  />
                )}
              </div>
            )}
          </div>

          {/* 사이드바 - 태블릿 및 데스크톱 전용 */}
          <div className="hidden md:flex w-80 border-l bg-card flex-shrink-0 flex-col h-full">
            <Tabs defaultValue="playlist" className="flex flex-col w-full h-full">
              <TabsList className="bg-muted h-12 grid grid-cols-3 p-1 flex-shrink-0">
                <TabsTrigger value="playlist" className="flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <List className="h-4 w-4 mr-2" />
                  <span>Playlist</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Users</span>
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  )
}
