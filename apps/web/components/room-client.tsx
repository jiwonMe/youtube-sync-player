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
} from "lucide-react"

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
  const handleNextVideo = () => {
    const currentIndex = roomState.playlist.findIndex((video) => video.id === roomState.currentVideo?.id)

    // 자동 재생이 꺼져 있고, 비디오가 끝났을 때 호출된 경우 다음 비디오로 넘어가지 않음
    if (!roomState.autoplay && playerRef.current && playerRef.current.getPlayerState && playerRef.current.getPlayerState() === 0) {
      return
    }

    if (currentIndex < roomState.playlist.length - 1) {
      const nextVideo = roomState.playlist[currentIndex + 1]

      // 비디오 변경 전에 플레이어 상태 초기화
      setRoomState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
      
      // 약간의 지연 후 비디오 변경 이벤트 발송
      setTimeout(() => {
        // Emit video change
        if (socket) {
          socket.emit("video:change", nextVideo.id)
        }
      }, 100);
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
    }));
    
    // 약간의 지연 후 비디오 변경 이벤트 발송
    setTimeout(() => {
      // Emit video change
      if (socket) {
        socket.emit("video:change", video.id);
      }
    }, 100);
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

  return (
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
                      onClick={handleNextVideo}
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
                />
              ) : (
                <UsersPanel users={roomState.users} hostId={roomState.hostId} isLoading={isLoading} />
              )}
            </div>
          )}
        </div>

        {/* Sidebar - for tablet and desktop only */}
        <div className="hidden md:flex w-80 border-l bg-card flex-shrink-0">
          <Tabs defaultValue="playlist" className="flex flex-col w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="playlist" className="flex-1">
                <List className="h-4 w-4 mr-2" />
                Playlist
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="playlist" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
              <PlaylistPanel
                playlist={roomState.playlist}
                currentVideo={roomState.currentVideo}
                handleVideoSelect={handleVideoSelect}
                handleRemoveVideo={handleRemoveVideo}
                isLoading={isLoading}
                isHost={isHost}
              />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
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

            <TabsContent value="users" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
              <UsersPanel users={roomState.users} hostId={roomState.hostId} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
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
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-3">
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
            <div key={msg.id} className="mb-4 group">
              <div className="flex items-center mb-1">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={msg.user.image} alt={msg.user.name} />
                  <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{msg.user.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="text-sm pl-8 break-words">{msg.message}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-xs mt-1">Be the first to say something!</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </ScrollArea>

      <div className="p-3 border-t">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!chatInput.trim() || isLoading}>
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
}

function PlaylistPanel({
  playlist,
  currentVideo,
  handleVideoSelect,
  handleRemoveVideo,
  isLoading,
  isHost,
}: PlaylistPanelProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm font-medium">
          {playlist.length} {playlist.length === 1 ? "video" : "videos"} in playlist
        </span>
      </div>

      <ScrollArea className="flex-1">
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
          playlist.map((video) => (
            <div
              key={video.id}
              id={`playlist-item-${video.id}`}
              className={`flex p-3 border-b cursor-pointer hover:bg-muted/50 group ${
                currentVideo?.id === video.id ? "bg-muted" : ""
              }`}
              onClick={() => handleVideoSelect(video)}
            >
              <div className="relative w-28 h-16 rounded overflow-hidden flex-shrink-0">
                <img
                  src={video.thumbnailUrl || "/placeholder.svg?height=90&width=120"}
                  alt={video.title}
                  className="object-cover w-full h-full"
                />
                {currentVideo?.id === video.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge>Playing</Badge>
                  </div>
                )}
              </div>
              <div className="ml-2 flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm truncate pr-2">{video.title}</h4>
                  {isHost && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemoveVideo(video.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center mt-1">
                  <Youtube className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-xs text-muted-foreground">YouTube</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4">
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
    <div className="flex-1 overflow-y-auto p-2">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={`user-skeleton-${i}`} className="flex items-center p-2 mb-1">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
      ) : users.length > 0 ? (
        users.map((user) => (
          <div key={user.id} className="flex items-center p-2 hover:bg-muted rounded-md">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{user.name}</span>
            {user.id === hostId && (
              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Host
              </Badge>
            )}
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users in room</p>
          </div>
        </div>
      )}
    </div>
  )
}

