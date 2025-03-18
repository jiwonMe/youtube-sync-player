"use client"

import React, { useState, useRef, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Socket } from "socket.io-client"
import {
  Users,
  MessageSquare,
  List,
  X,
  Youtube,
  Loader2,
  Settings,
  Crown,
  Plus,
  Lock,
  Activity,
  User,
  Check,
  Copy,
  Share,
} from "lucide-react"
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
import { RoomState, VideoItem } from "@/types/room"
import { ChatPanel } from "@/components/room/chat-panel"
import { PlaylistPanel } from "@/components/room/playlist-panel"
import { UsersPanel } from "@/components/room/users-panel" 
import { UpcomingPlaylist } from "@/components/room/upcoming-playlist"
import { AddVideoDialog } from "@/components/room/add-video-dialog"
import { VideoControls } from "@/components/room/video-controls"
import { PasswordDialog } from "@/components/room/password-dialog"
import { EventLogPanel } from "@/components/room/event-log-panel"
import { SettingsPanel } from "@/components/room/settings-panel"

// 커스텀 훅 임포트
import { useSocketEvents } from "@/components/room/use-socket-events"
import { useVideoControls } from "@/components/room/use-video-controls"
import { useRoomPassword } from "@/components/room/use-room-password"
import { useRoomUI } from "@/components/room/use-room-ui"
import { usePermissions } from "@/components/room/use-permissions"

/**
 * 방 클라이언트 컴포넌트
 */
export default function RoomClient({ roomId }: { roomId: string }) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { toast } = useToast()
  const playerRef = useRef<any>(null)

  // 기본 상태
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
  const [isLoading, setIsLoading] = useState(true)
  const [videoProgress, setVideoProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isVideoChanging, setIsVideoChanging] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(0)
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null)
  const [hasInitialSync, setHasInitialSync] = useState(false) // 최초 동기화 여부 추적

  // 현재 사용자가 호스트인지 확인하는 함수
  const isUserHost = (): boolean => {
    return Boolean(isSignedIn && user && user.id === roomState.hostId);
  }

  // 비밀번호 관련 기능 커스텀 훅 사용
  const {
    isPasswordProtected,
    isPasswordVerified,
    showPasswordDialog,
    roomInfo,
    setShowPasswordDialog,
    handlePasswordVerify,
    handlePasswordCancel
  } = useRoomPassword({ roomId });

  // UI 관련 기능 커스텀 훅 사용
  const {
    showMobile,
    setShowMobile,
    chatInput,
    setChatInput,
    videoUrl,
    setVideoUrl,
    showAddVideoDialog,
    setShowAddVideoDialog,
    copySuccess,
    setCopySuccess,
    copyRoomCodeSuccess,
    setCopyRoomCodeSuccess,
    isAddingVideo,
    setIsAddingVideo,
    showChangeHostDialog,
    setShowChangeHostDialog,
    isMuted,
    setIsMuted,
    chatEndRef,
    handleShareRoom,
    handleCopyRoomCode,
    handleChatSubmit: uiHandleChatSubmit
  } = useRoomUI({ roomId });

  // 권한 관련 기능 커스텀 훅 사용
  const {
    handlePermissionChange,
    handleVideoControlPermissionChange,
    handleChangeUserHost,
    transferHostToUser
  } = usePermissions({
    socket,
    roomState,
    isUserHost,
    setRoomState,
    showChangeHostDialog,
    setShowChangeHostDialog
  });

  // 비디오 컨트롤 관련 기능 커스텀 훅 사용
  const {
    handlePlayerStateChange,
    handlePlayPause,
    handleVideoError,
    handleNextVideo,
    handleVideoSelect,
    handleRemoveVideo,
    handleAddVideo: addVideo,
    handleToggleAutoplay,
    handlePlaylistReorder,
    handleSeek,
    playerStateChangeLock,
    lastKnownTimeRef,
    lockPlayerStateChange
  } = useVideoControls({
    roomId,
    socket,
    roomState,
    setRoomState,
    playerRef,
    isUserHost,
    setIsVideoChanging,
    isVideoChanging,
    isSignedIn: !!isSignedIn,
    user
  });

  // 비디오 추가 핸들러 - 커스텀 훅과 연결
  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;
    
    setIsAddingVideo(true);
    try {
      const success = await addVideo(videoUrl);
      if (success) {
        setShowAddVideoDialog(false);
        setVideoUrl("");
      }
    } catch (error) {
      console.error("Failed to add video:", error);
    } finally {
      setIsAddingVideo(false);
    }
  };

  // 채팅 제출 핸들러 - 소켓 연결
  const handleChatSubmit = (e: React.FormEvent) => {
    uiHandleChatSubmit(e);
    
    if (chatInput.trim() === "") return;

    if (socket) {
      socket.emit("chat:message", chatInput);
    }

    setChatInput("");
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

    // 이벤트 로그 리스너 추가
    socketIo.on("room:eventLog", (eventLog) => {
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
      socketIo.off("room:state")
      socketIo.off("autoplay:toggle")
      socketIo.off("video:change")
      socketIo.off("playlist:update")
      socketIo.off("playlist:reorder")
      socketIo.off("chat:message")
      socketIo.off("user:joined")
      socketIo.off("user:left")
      socketIo.off("host:changed")
      socketIo.off("video:controlPermission")
    }
  }, [roomId, user, isSignedIn, isLoaded, isPasswordVerified, hasInitialSync, toast])

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

  // 소켓 이벤트 핸들러 커스텀 훅 사용
  useSocketEvents({
    socket,
    roomState,
    setRoomState,
    isUserHost,
    isSignedIn: !!isSignedIn,
    user,
    setIsLoading,
    setIsVideoChanging,
    playerRef,
    setHasInitialSync,
    hasInitialSync,
    lastKnownTimeRef,
    lockPlayerStateChange
  });

  // 현재 사용자가 방장인지 여부
  const isHost = isSignedIn && user?.id === roomState.hostId;
  const hasNextVideo = roomState.currentVideo 
    ? roomState.playlist.findIndex((v) => v.id === roomState.currentVideo?.id) < roomState.playlist.length - 1
    : false;

  // 컴포넌트에 맞게 비디오 핸들러 래핑
  const handleVideoSelectWrapper = (video: VideoItem) => handleVideoSelect(video.videoId);
  const handleRemoveVideoWrapper = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleRemoveVideo(videoId);
  };

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
              isAllowedToControl={roomState.videoControlPermission === 'all-users' || isUserHost() || false}
              handleSeek={handleSeek}
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
                handleVideoSelect={handleVideoSelectWrapper}
                handleRemoveVideo={handleRemoveVideoWrapper}
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
                    handleVideoSelect={handleVideoSelectWrapper}
                    handleRemoveVideo={handleRemoveVideoWrapper}
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
                    handleVideoSelect={handleVideoSelectWrapper}
                    handleRemoveVideo={handleRemoveVideoWrapper}
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
