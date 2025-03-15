"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { io, type Socket } from "socket.io-client"
import {
  Users,
  MessageSquare,
  List,
  X,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Share,
  Link,
  Crown,
  Plus,
  Trash2,
  Youtube,
  ExternalLink,
  Settings,
  Repeat,
  GripVertical,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react"
// @ts-ignore - 패키지가 설치되지 않았을 때 타입 오류 무시
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot, DropResult } from "@hello-pangea/dnd"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { YouTubePlayer } from "@/components/youtube-player"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createMockSocket } from "@/services/mock-socket-service"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/toaster"

// Types
type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
}

type ChatMessage = {
  id: string
  user: RoomUser
  message: string
  timestamp: number
}

type VideoItem = {
  id: string
  videoId: string
  title: string
  thumbnailUrl: string
}

type RoomState = {
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
  autoplay: boolean
}

// Mock data for initial rendering
const mockRoomData: RoomState = {
  roomName: "Loading Room...",
  hostId: "",
  users: [],
  currentVideo: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  messages: [],
  autoplay: true,
}

// Function to connect to the room
const connectToRoom = (roomId: string, userId: string, userName: string, userImage: string): Socket => {
  // Use mock socket if no SOCKET_URL is provided
  if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
    return createMockSocket(roomId, userId, userName, userImage)
  }

  return io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    query: { roomId, userId, userName, userImage },
  })
}

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

  const playerRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Connect to socket when component mounts
  useEffect(() => {
    // Don't connect until user state is loaded
    if (!isLoaded) return

    // Generate a guest ID if not authenticated
    const userId = isSignedIn ? user.id : `guest-${Math.random().toString(36).substring(2, 9)}`
    const userName = isSignedIn ? `${user.firstName} ${user.lastName}` : "Guest"
    const userImage = isSignedIn ? user.imageUrl : ""

    // Connect to socket
    const socketIo = connectToRoom(roomId, userId, userName, userImage)
    setSocket(socketIo)

    // Listen for room state updates
    socketIo.on("room:state", (state) => {
      setIsLoading(false)
      setRoomState(state)
    })

    // Listen for player state changes
    socketIo.on("player:stateChange", (data: { isPlaying: boolean; currentTime: number }) => {
      setRoomState((prev) => ({
        ...prev,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
      }))
    })

    // Listen for autoplay toggle
    socketIo.on("autoplay:toggle", (data: { autoplay: boolean }) => {
      setRoomState((prev) => ({
        ...prev,
        autoplay: data.autoplay,
      }))
    })

    // Listen for video changes
    socketIo.on("video:change", (data) => {
      const video = roomState.playlist.find((v) => v.videoId === data.videoId)
      if (video) {
        // 비디오 변경 시 플레이어 상태 초기화를 위해 잠시 currentVideo를 null로 설정
        setRoomState((prev) => ({
          ...prev,
          currentVideo: null,
        }))
        
        // 약간의 지연 후 새 비디오 설정
        setTimeout(() => {
          setRoomState((prev) => ({
            ...prev,
            currentVideo: video,
            currentTime: data.currentTime,
            isPlaying: true, // 항상 재생 상태로 설정
          }))
          
          // 비디오가 변경되면 자동으로 스크롤하여 현재 재생 중인 비디오를 표시
          const playlistItem = document.getElementById(`playlist-item-${video.id}`);
          if (playlistItem) {
            playlistItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100)
      }
    })

    // Listen for playlist updates
    socketIo.on("playlist:update", (playlist) => {
      setRoomState((prev) => ({
        ...prev,
        playlist,
      }))
    })

    // Listen for playlist reordering
    socketIo.on("playlist:reorder", (playlist) => {
      setRoomState((prev) => ({
        ...prev,
        playlist,
      }))
    })

    // Listen for chat messages
    socketIo.on("chat:message", (message) => {
      setRoomState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }))
    })

    // Listen for user joined
    socketIo.on("user:joined", (user) => {
      setRoomState((prev) => ({
        ...prev,
        users: [...prev.users, { ...user, socketId: "" }],
      }))
    })

    // Listen for user left
    socketIo.on("user:left", (userId) => {
      setRoomState((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
      }))
    })

    // Clean up socket connection
    return () => {
      if (socketIo) {
        socketIo.disconnect()
      }
    }
  }, [roomId, user, isSignedIn, isLoaded])

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [roomState.messages])

  // Update video progress
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

  // Handle player state changes
  const handlePlayerStateChange = (event: any) => {
    // Update local state based on player events
    if (event.data === 1) {
      // Playing
      setRoomState((prev) => ({ ...prev, isPlaying: true }))

      // Emit player state change if user is the one who played the video
      if (!roomState.isPlaying && socket) {
        const currentTime = playerRef.current && playerRef.current.getCurrentTime ? 
          playerRef.current.getCurrentTime() || 0 : 0;
          
        socket.emit("player:stateChange", {
          isPlaying: true,
          currentTime: currentTime,
        })
      }
    } else if (event.data === 2) {
      // Paused
      setRoomState((prev) => ({ ...prev, isPlaying: false }))

      // Emit player state change if user is the one who paused the video
      if (roomState.isPlaying && socket) {
        const currentTime = playerRef.current && playerRef.current.getCurrentTime ? 
          playerRef.current.getCurrentTime() || 0 : 0;
          
        socket.emit("player:stateChange", {
          isPlaying: false,
          currentTime: currentTime,
        })
      }
    } else if (event.data === 0) {
      // Ended - play next video if available
      handleNextVideo()
    }
  }

  // 비디오 에러 처리 함수
  const handleVideoError = (errorCode: number) => {
    console.error(`YouTube 비디오 에러 발생: ${errorCode}`);
    
    // 에러 코드에 따른 메시지 설정
    let errorMessage = "비디오 재생 중 오류가 발생했습니다.";
    
    switch (errorCode) {
      case 2:
        errorMessage = "잘못된 비디오 URL 매개변수입니다.";
        break;
      case 5:
        errorMessage = "HTML5 플레이어에서 재생할 수 없는 비디오입니다.";
        break;
      case 100:
        errorMessage = "비디오를 찾을 수 없습니다. 삭제되었거나 비공개로 설정되었을 수 있습니다.";
        break;
      case 101:
      case 150:
        errorMessage = "비디오 소유자가 임베드 재생을 허용하지 않습니다.";
        break;
    }
    
    // 토스트 메시지 표시
    toast({
      title: "비디오 재생 오류",
      description: `${errorMessage} 다음 비디오로 자동 전환합니다.`,
      variant: "destructive",
    });
    
    // 에러 발생 시 다음 비디오로 자동 전환
    setTimeout(() => {
      handleNextVideo(true); // 강제로 다음 비디오로 넘어가도록 true 전달
    }, 2000); // 2초 후 다음 비디오로 전환 (토스트 메시지를 충분히 표시하기 위함)
  }

  // Handle play/pause
  const handlePlayPause = () => {
    const newIsPlaying = !roomState.isPlaying
    setRoomState((prev) => ({ ...prev, isPlaying: newIsPlaying }))

    // Emit player state change
    if (socket) {
      const currentTime = playerRef.current && playerRef.current.getCurrentTime ? 
        playerRef.current.getCurrentTime() || 0 : 0;
        
      socket.emit("player:stateChange", {
        isPlaying: newIsPlaying,
        currentTime: currentTime,
      })
    }
  }

  // Handle next video
  const handleNextVideo = (forceNext: boolean = false) => {
    const currentIndex = roomState.playlist.findIndex((video) => video.id === roomState.currentVideo?.id)

    // 자동 재생이 꺼져 있고, 비디오가 끝났을 때 호출된 경우 다음 비디오로 넘어가지 않음
    // 단, 사용자가 직접 다음 버튼을 클릭한 경우나 forceNext가 true인 경우는 예외
    const isVideoEnded = playerRef.current && playerRef.current.getPlayerState && playerRef.current.getPlayerState() === 0;
    const isAutoplayDisabled = !roomState.autoplay;
    const isUserInitiated = !isVideoEnded || forceNext; // 비디오가 끝나지 않은 상태에서 호출되거나 forceNext가 true인 경우
    
    if (isAutoplayDisabled && isVideoEnded && !isUserInitiated) {
      return;
    }

    if (currentIndex < roomState.playlist.length - 1) {
      const nextVideo = roomState.playlist[currentIndex + 1]

      // 비디오 변경 전에 플레이어 상태 초기화
      setRoomState((prev) => ({
        ...prev,
        isPlaying: false,
        currentVideo: null, // 현재 비디오를 null로 설정하여 플레이어 초기화
      }));
      
      // 즉시 다음 비디오로 변경하고 서버에 알림
      if (socket) {
        socket.emit("video:change", nextVideo.id);
        
        // 로컬 상태도 즉시 업데이트하여 UI 반응성 향상
        setTimeout(() => {
          setRoomState((prev) => ({
            ...prev,
            currentVideo: nextVideo,
            currentTime: 0,
            isPlaying: true,
          }));
        }, 50);
      }
    }
  }

  // Handle chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (chatInput.trim() === "") return

    // Emit chat message
    if (socket) {
      socket.emit("chat:message", chatInput)
    }

    setChatInput("")
  }

  // Handle video selection from playlist
  const handleVideoSelect = (video: VideoItem) => {
    // 현재 재생 중인 비디오와 같은 비디오를 선택한 경우 무시
    if (roomState.currentVideo?.id === video.id) {
      return;
    }
    
    // 비디오 변경 전에 플레이어 상태 초기화
    setRoomState((prev) => ({
      ...prev,
      isPlaying: false,
      currentVideo: null, // 현재 비디오를 null로 설정하여 플레이어 초기화
    }));
    
    // 즉시 비디오 변경 이벤트 발송
    if (socket) {
      socket.emit("video:change", video.id);
      
      // 로컬 상태도 즉시 업데이트하여 UI 반응성 향상
      setTimeout(() => {
        setRoomState((prev) => ({
          ...prev,
          currentVideo: video,
          currentTime: 0,
          isPlaying: true,
        }));
      }, 50);
    }
  }

  // Handle video removal from playlist
  const handleRemoveVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent onClick

    if (socket) {
      socket.emit("playlist:remove", videoId)
    }
  }

  // Handle adding a video
  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return

    setIsAddingVideo(true)

    try {
      // Extract video ID from URL
      const videoId = extractYouTubeId(videoUrl)

      if (!videoId) {
        alert("Invalid YouTube URL")
        return
      }

      // Get video details from YouTube API
      const videoDetails = await fetchVideoDetails(videoId)

      if (!videoDetails) {
        alert("Failed to fetch video details")
        return
      }

      // 플레이리스트가 비어있는지 확인
      const isPlaylistEmpty = roomState.playlist.length === 0 || !roomState.currentVideo;
      
      // 새 비디오 객체 생성
      const newVideo = {
        id: `video-${Date.now()}`,
        videoId,
        title: videoDetails.title,
        thumbnailUrl: videoDetails.thumbnailUrl,
      };

      // Add video to playlist
      if (socket) {
        socket.emit("playlist:add", newVideo);
        
        // 플레이리스트가 비어있었다면 클라이언트 측에서도 현재 비디오로 설정
        // (서버에서도 처리하지만 UI 업데이트를 빠르게 하기 위해)
        if (isPlaylistEmpty) {
          setRoomState((prev) => ({
            ...prev,
            currentVideo: newVideo,
            isPlaying: true,
            currentTime: 0,
          }));
        }
      }

      // Close dialog and reset form
      setShowAddVideoDialog(false)
      setVideoUrl("")
    } catch (error) {
      console.error("Error adding video:", error)
      alert("Failed to add video")
    } finally {
      setIsAddingVideo(false)
    }
  }

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // Fetch video details from YouTube API (mock implementation)
  const fetchVideoDetails = async (videoId: string) => {
    // In a real implementation, you would call your backend API
    // which would then call the YouTube API with your API key

    // For now, return mock data
    return {
      title: `YouTube Video (${videoId})`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    }
  }

  // Format timestamp for chat messages
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Format time for video progress
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Share room link
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

  // Check if current user is host
  const isHost = isSignedIn && user?.id === roomState.hostId ? true : false;

  // Handle toggle autoplay
  const handleToggleAutoplay = () => {
    const newAutoplay = !roomState.autoplay
    setRoomState((prev) => ({ ...prev, autoplay: newAutoplay }))

    // Emit autoplay state change
    if (socket) {
      const currentTime = playerRef.current && playerRef.current.getCurrentTime ? 
        playerRef.current.getCurrentTime() || 0 : 0;
        
      socket.emit("autoplay:toggle", {
        isPlaying: roomState.isPlaying,
        currentTime: currentTime,
        autoplay: roomState.autoplay,
      })
    }
  }

  // Handle playlist reordering
  const handlePlaylistReorder = (result: DropResult) => {
    // 드롭이 취소된 경우 (드롭 영역 밖으로 드래그된 경우)
    if (!result.destination) return;
    
    // 위치가 변경되지 않은 경우
    if (result.destination.index === result.source.index) return;
    
    // 플레이리스트 복사
    const newPlaylist = [...roomState.playlist];
    
    // 드래그된 아이템 제거
    const [movedItem] = newPlaylist.splice(result.source.index, 1);
    
    // 새 위치에 아이템 삽입
    newPlaylist.splice(result.destination.index, 0, movedItem);
    
    // 로컬 상태 업데이트
    setRoomState(prev => ({
      ...prev,
      playlist: newPlaylist
    }));
    
    // 서버에 변경사항 전송
    if (socket) {
      socket.emit("playlist:reorder", newPlaylist);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Room info bar */}
        <div className="bg-muted p-2 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="font-semibold truncate max-w-[200px] md:max-w-md">
              {isLoading ? <Skeleton className="h-6 w-40" /> : roomState.roomName}
            </h1>
            <Badge variant="outline" className="ml-2">
              {isLoading ? <Skeleton className="h-4 w-16" /> : `${roomState.users.length} viewers`}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Share this room</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShareRoom}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Room Link
                  {copySuccess && <Badge className="ml-2 bg-green-500">Copied!</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=Join%20my%20YouTube%20room:%20${roomState.roomName}&url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share on Twitter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isHost && (
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Room Settings
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video player section */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* YouTube Player */}
            <div className="relative bg-black aspect-video">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : roomState.currentVideo ? (
                <YouTubePlayer
                  videoId={roomState.currentVideo.videoId}
                  isPlaying={roomState.isPlaying}
                  currentTime={roomState.currentTime}
                  onStateChange={handlePlayerStateChange}
                  isMuted={isMuted}
                  playerRef={playerRef}
                  onVideoError={handleVideoError}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-zinc-900">
                  <Youtube className="h-16 w-16 mb-4 text-red-600" />
                  <p className="text-lg mb-2">No video selected</p>
                  <p className="text-sm text-zinc-400 mb-4">Add a video to the playlist to get started</p>
                  <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add YouTube Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add YouTube Video</DialogTitle>
                        <DialogDescription>Enter a YouTube video URL to add it to the playlist.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl.trim()}>
                          {isAddingVideo ? "Adding..." : "Add Video"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Video progress bar */}
            {roomState.currentVideo && (
              <div className="h-1 bg-muted w-full">
                <Progress value={videoProgress} className="h-1" />
              </div>
            )}

            {/* Video controls */}
            <div className="p-3 bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlayPause}
                        disabled={!roomState.currentVideo || isLoading}
                        className="h-9 w-9"
                      >
                        {roomState.isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{roomState.isPlaying ? "Pause" : "Play"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNextVideo()}
                        disabled={
                          !roomState.currentVideo ||
                          isLoading ||
                          roomState.playlist.findIndex((v) => v.id === roomState.currentVideo?.id) ===
                            roomState.playlist.length - 1
                        }
                        className="h-9 w-9"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Next video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                        disabled={!roomState.currentVideo || isLoading}
                        className="h-9 w-9"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isMuted ? "Unmute" : "Mute"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleAutoplay}
                        disabled={!roomState.currentVideo || isLoading}
                        className="h-9 w-9"
                      >
                        {roomState.autoplay ? (
                          <Repeat className="h-4 w-4 text-primary" />
                        ) : (
                          <Repeat className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{roomState.autoplay ? "자동 재생 켜짐" : "자동 재생 꺼짐"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {roomState.currentVideo && (
                  <div className="text-sm text-muted-foreground ml-2 hidden sm:block">
                    {formatTime(playerRef.current?.getCurrentTime() || 0)} / {formatTime(videoDuration)}
                  </div>
                )}
              </div>

              <div className="flex items-center md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobile(showMobile === "playlist" ? null : "playlist")}
                  className="text-xs"
                >
                  <List className="h-4 w-4 mr-1" />
                  Playlist
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobile(showMobile === "chat" ? null : "chat")}
                  className="text-xs ml-1"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobile(showMobile === "users" ? null : "users")}
                  className="text-xs ml-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-3">
                {roomState.currentVideo ? (
                  <div className="flex items-center">
                    <div className="relative w-8 h-8 rounded overflow-hidden mr-2">
                      <img
                        src={roomState.currentVideo.thumbnailUrl || "/placeholder.svg"}
                        alt={roomState.currentVideo.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-sm truncate max-w-[300px]">
                      <span className="font-medium">{roomState.currentVideo.title}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No video playing</p>
                )}

                <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add YouTube Video</DialogTitle>
                      <DialogDescription>Enter a YouTube video URL to add it to the playlist.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl.trim()}>
                        {isAddingVideo ? "Adding..." : "Add Video"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* 다음 재생 예정 플레이리스트 - YouTube 플레이어 아래 공간 활용 */}
            {roomState.currentVideo && roomState.playlist.length > 1 && (
              <div className="bg-background border-t hidden sm:block">
                <div className="p-2 bg-muted/30 flex items-center justify-between sticky top-0 z-10">
                  <span className="text-sm font-medium flex items-center">
                    <List className="h-4 w-4 mr-2 text-muted-foreground" />
                    다음 재생 예정
                  </span>
                  <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7">
                        <Plus className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline-block">Add Video</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add YouTube Video</DialogTitle>
                        <DialogDescription>Enter a YouTube video URL to add it to the playlist.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl.trim()}>
                          {isAddingVideo ? "Adding..." : "Add Video"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <ScrollArea className="max-h-[160px] md:max-h-[160px] sm:max-h-[140px]">
                  <DragDropContext onDragEnd={handlePlaylistReorder}>
                    <Droppable droppableId="upcoming-playlist" direction="horizontal">
                      {(provided: DroppableProvided) => (
                        <div 
                          className="flex overflow-x-auto p-2 gap-3 pb-4"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {roomState.playlist
                            .filter(video => video.id !== roomState.currentVideo?.id)
                            .slice(0, 10)
                            .map((video, index) => (
                              <Draggable 
                                key={`upcoming-${video.id}`} 
                                draggableId={`upcoming-${video.id}`} 
                                index={index}
                                isDragDisabled={!isHost}
                              >
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] cursor-pointer hover:bg-muted/40 rounded-md transition-colors p-2 group ${
                                      snapshot.isDragging ? "bg-muted/60 shadow-lg" : ""
                                    }`}
                                    onClick={() => handleVideoSelect(video)}
                                  >
                                    <div className="relative w-full aspect-video rounded-md overflow-hidden mb-2">
                                      <img
                                        src={video.thumbnailUrl || "/placeholder.svg"}
                                        alt={video.title}
                                        className="object-cover w-full h-full"
                                      />
                                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                        {index + 1}
                                      </div>
                                      {isHost && (
                                        <div 
                                          {...provided.dragHandleProps}
                                          className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <GripVertical className="h-3 w-3" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-sm line-clamp-2 pr-2">{video.title}</h4>
                                      <div className="flex items-center">
                                        {isHost && (
                                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 hover:bg-muted"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // 현재 플레이리스트에서 이 비디오의 실제 인덱스를 찾습니다
                                                const actualIndex = roomState.playlist.findIndex(v => v.id === video.id);
                                                if (actualIndex > 0) {
                                                  const newPlaylist = [...roomState.playlist];
                                                  [newPlaylist[actualIndex], newPlaylist[actualIndex - 1]] = 
                                                    [newPlaylist[actualIndex - 1], newPlaylist[actualIndex]];
                                                  
                                                  // 서버에 변경사항 전송
                                                  if (socket) {
                                                    socket.emit("playlist:reorder", newPlaylist);
                                                  }
                                                  
                                                  // 로컬 상태 업데이트
                                                  setRoomState(prev => ({
                                                    ...prev,
                                                    playlist: newPlaylist
                                                  }));
                                                }
                                              }}
                                              disabled={roomState.playlist.findIndex(v => v.id === video.id) === 0}
                                            >
                                              <ArrowUp className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 hover:bg-muted"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // 현재 플레이리스트에서 이 비디오의 실제 인덱스를 찾습니다
                                                const actualIndex = roomState.playlist.findIndex(v => v.id === video.id);
                                                if (actualIndex < roomState.playlist.length - 1) {
                                                  const newPlaylist = [...roomState.playlist];
                                                  [newPlaylist[actualIndex], newPlaylist[actualIndex + 1]] = 
                                                    [newPlaylist[actualIndex + 1], newPlaylist[actualIndex]];
                                                  
                                                  // 서버에 변경사항 전송
                                                  if (socket) {
                                                    socket.emit("playlist:reorder", newPlaylist);
                                                  }
                                                  
                                                  // 로컬 상태 업데이트
                                                  setRoomState(prev => ({
                                                    ...prev,
                                                    playlist: newPlaylist
                                                  }));
                                                }
                                              }}
                                              disabled={roomState.playlist.findIndex(v => v.id === video.id) === roomState.playlist.length - 1}
                                            >
                                              <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                            </Button>
                                          </div>
                                        )}
                                        {isHost && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                            onClick={(e) => handleRemoveVideo(video.id, e)}
                                          >
                                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </div>
            )}

            {/* Mobile playlist/chat (shows only on mobile when activated) */}
            {showMobile && (
              <div className="md:hidden flex-1 flex flex-col overflow-hidden border-t">
                <div className="p-2 bg-muted flex items-center justify-between">
                  <h3 className="font-medium">
                    {showMobile === "chat" ? "Chat" : showMobile === "playlist" ? "Playlist" : "Viewers"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {showMobile === "playlist" && (
                      <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add YouTube Video</DialogTitle>
                            <DialogDescription>Enter a YouTube video URL to add it to the playlist.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl.trim()}>
                              {isAddingVideo ? "Adding..." : "Add Video"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                    formatTimestamp={formatTimestamp}
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
                  />
                ) : (
                  <UsersPanel users={roomState.users} hostId={roomState.hostId} isLoading={isLoading} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar - for tablet and desktop only */}
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
                  />
                </TabsContent>

                <TabsContent value="chat" className="h-[calc(100%-3rem)] data-[state=active]:flex data-[state=active]:flex-col hidden">
                  <ChatPanel
                    messages={roomState.messages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    handleChatSubmit={handleChatSubmit}
                    formatTimestamp={formatTimestamp}
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

// ChatPanel Component
interface ChatPanelProps {
  messages: ChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  handleChatSubmit: (e: React.FormEvent) => void
  formatTimestamp: (timestamp: number) => string
  isLoading: boolean
  chatEndRef: React.RefObject<HTMLDivElement | null>
}

function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  formatTimestamp,
  isLoading,
  chatEndRef,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
            Chat
          </span>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            Array(2)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-center mb-1">
                    <Skeleton className="h-6 w-6 rounded-full mr-2" />
                    <Skeleton className="h-4 w-20 mr-2" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="mb-4 group hover:bg-muted/30 p-2 rounded-md transition-colors">
                <div className="flex items-center mb-1">
                  <Avatar className="h-6 w-6 mr-2 ring-1 ring-muted">
                    <AvatarImage src={msg.user.image} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{msg.user.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatTimestamp(msg.timestamp)}</span>
                  {msg.user.isHost && (
                    <Badge variant="outline" className="ml-2 text-xs py-0 h-4">
                      <Crown className="h-3 w-3 mr-1 text-amber-500" />
                      Host
                    </Badge>
                  )}
                </div>
                <p className="text-sm pl-8 break-words">{msg.message}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-40px)] text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs mt-1">Be the first to say something!</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex-shrink-0">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!chatInput.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

// PlaylistPanel Component
interface PlaylistPanelProps {
  playlist: VideoItem[]
  currentVideo: VideoItem | null
  handleVideoSelect: (video: VideoItem) => void
  handleRemoveVideo: (videoId: string, e: React.MouseEvent) => void
  isLoading: boolean
  isHost: boolean | undefined
  handlePlaylistReorder?: (result: DropResult) => void
  socket?: Socket | null
}

function PlaylistPanel({
  playlist,
  currentVideo,
  handleVideoSelect,
  handleRemoveVideo,
  isLoading,
  isHost,
  handlePlaylistReorder,
  socket,
}: PlaylistPanelProps) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <List className="h-4 w-4 mr-2 text-muted-foreground" />
            {playlist.length} {playlist.length === 1 ? "video" : "videos"} in playlist
          </span>
        </div>
        
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={`skeleton-${i}`} className="flex p-3 border-b gap-2">
                <Skeleton className="h-20 w-28 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
        ) : playlist.length > 0 ? (
          <DragDropContext onDragEnd={handlePlaylistReorder || (() => {})}>
            <Droppable droppableId="playlist">
              {(provided: DroppableProvided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {playlist.map((video, index) => (
                    <Draggable 
                      key={video.id} 
                      draggableId={video.id} 
                      index={index}
                      isDragDisabled={!isHost || !handlePlaylistReorder}
                    >
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          id={`playlist-item-${video.id}`}
                          className={`flex p-3 border-b cursor-pointer transition-colors group ${
                            currentVideo?.id === video.id 
                              ? "bg-muted/80 border-l-4 border-l-primary" 
                              : "hover:bg-muted/40 border-l-4 border-l-transparent"
                          } ${snapshot.isDragging ? "bg-muted/60 shadow-lg" : ""}`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="relative w-28 h-16 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={video.thumbnailUrl || "/placeholder.svg"}
                              alt={video.title}
                              className="object-cover w-full h-full"
                            />
                            {currentVideo?.id === video.id && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                                  Now Playing
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm line-clamp-2 pr-2">{video.title}</h4>
                              <div className="flex items-center">
                                {isHost && handlePlaylistReorder && (
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="h-6 w-6 flex items-center justify-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                {isHost && handlePlaylistReorder && (
                                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // 현재 플레이리스트에서 이 비디오의 실제 인덱스를 찾습니다
                                        const actualIndex = playlist.findIndex(v => v.id === video.id);
                                        if (actualIndex > 0) {
                                          const newPlaylist = [...playlist];
                                          [newPlaylist[actualIndex], newPlaylist[actualIndex - 1]] = 
                                            [newPlaylist[actualIndex - 1], newPlaylist[actualIndex]];
                                          
                                          // 서버에 변경사항 전송
                                          if (socket) {
                                            socket.emit("playlist:reorder", newPlaylist);
                                          }
                                          
                                          // 로컬 상태 업데이트
                                          handlePlaylistReorder({
                                            source: { index: actualIndex, droppableId: 'playlist' },
                                            destination: { index: actualIndex - 1, droppableId: 'playlist' },
                                            draggableId: video.id,
                                            type: 'DEFAULT',
                                            mode: 'FLUID',
                                            reason: 'DROP',
                                            combine: null
                                          });
                                        }
                                      }}
                                      disabled={playlist.findIndex(v => v.id === video.id) === 0}
                                    >
                                      <ArrowUp className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // 현재 플레이리스트에서 이 비디오의 실제 인덱스를 찾습니다
                                        const actualIndex = playlist.findIndex(v => v.id === video.id);
                                        if (actualIndex < playlist.length - 1) {
                                          const newPlaylist = [...playlist];
                                          [newPlaylist[actualIndex], newPlaylist[actualIndex + 1]] = [newPlaylist[actualIndex + 1], newPlaylist[actualIndex]];
                                          if (handlePlaylistReorder) {
                                            handlePlaylistReorder({
                                              source: { index: actualIndex, droppableId: 'playlist' },
                                              destination: { index: actualIndex + 1, droppableId: 'playlist' },
                                              draggableId: video.id,
                                              type: 'DEFAULT',
                                              mode: 'FLUID',
                                              reason: 'DROP',
                                              combine: null
                                            });
                                          }
                                        }
                                      }}
                                      disabled={playlist.findIndex(v => v.id === video.id) === playlist.length - 1}
                                    >
                                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                )}
                                {isHost && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                    onClick={(e) => handleRemoveVideo(video.id, e)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="flex items-center justify-center h-[calc(100%-40px)] text-muted-foreground p-4">
            <div className="text-center">
              <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No videos in playlist</p>
              <p className="text-xs mt-1">Add videos to get started</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// UsersPanel Component
interface UsersPanelProps {
  users: RoomUser[]
  hostId: string
  isLoading: boolean
}

function UsersPanel({ users, hostId, isLoading }: UsersPanelProps) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            {users.length} {users.length === 1 ? "viewer" : "viewers"}
          </span>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center p-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full mr-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center p-2 rounded-md ${
                    user.id === hostId ? "bg-muted/50 border-l-2 border-l-amber-500" : "hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-8 w-8 mr-3 ring-1 ring-muted">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">{user.name}</span>
                      {user.id === hostId && (
                        <Badge variant="outline" className="ml-2 text-xs py-0 h-4">
                          <Crown className="h-3 w-3 mr-1 text-amber-500" />
                          Host
                        </Badge>
                      )}
                    </div>
                    {user.id === hostId && (
                      <span className="text-xs text-muted-foreground">Room creator</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

