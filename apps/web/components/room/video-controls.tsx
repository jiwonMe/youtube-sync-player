"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, SkipForward, Volume2, VolumeX, Repeat, Plus } from "lucide-react"
import { formatTime } from "../../utils/room-utils"
import { VideoItem } from "@/types/room"
import { AddVideoDialog } from "./add-video-dialog"

/**
 * 비디오 컨트롤 컴포넌트 Props
 */
interface VideoControlsProps {
  /** 현재 재생 중인 비디오 */
  currentVideo: VideoItem | null
  /** 비디오 재생 중 여부 */
  isPlaying: boolean
  /** 비디오 음소거 상태 */
  isMuted: boolean
  /** 자동 재생 상태 */
  autoplay: boolean
  /** 비디오 재생 진행률 */
  videoProgress: number
  /** 비디오 로딩 중 상태 */
  isLoading: boolean
  /** 비디오 플레이어 참조 */
  playerRef: React.MutableRefObject<any>
  /** 비디오 총 길이 (초) */
  videoDuration: number
  /** 다음 비디오가 있는지 여부 */
  hasNextVideo: boolean
  /** 재생/일시정지 토글 핸들러 */
  handlePlayPause: () => void
  /** 다음 비디오 재생 핸들러 */
  handleNextVideo: (forceNext?: boolean) => void
  /** 음소거 토글 핸들러 */
  setIsMuted: (value: boolean) => void
  /** 자동 재생 토글 핸들러 */
  handleToggleAutoplay: () => void
  /** 비디오 추가 다이얼로그 표시 여부 */
  showAddVideoDialog: boolean
  /** 비디오 추가 다이얼로그 표시 여부 설정 함수 */
  setShowAddVideoDialog: (value: boolean) => void
  /** 비디오 URL */
  videoUrl: string
  /** 비디오 URL 설정 함수 */
  setVideoUrl: (value: string) => void
  /** 비디오 추가 핸들러 */
  handleAddVideo: () => Promise<void>
  /** 비디오 추가 중 상태 */
  isAddingVideo: boolean
  /** 사용자가 비디오를 제어할 권한이 있는지 여부 */
  isAllowedToControl: boolean
  /** 비디오 진행 핸들러 */
  handleSeek: (seekTime: number) => void
}

/**
 * 비디오 컨트롤 컴포넌트
 */
export function VideoControls({
  currentVideo,
  isPlaying,
  isMuted,
  autoplay,
  videoProgress,
  isLoading,
  playerRef,
  videoDuration,
  hasNextVideo,
  handlePlayPause,
  handleNextVideo,
  setIsMuted,
  handleToggleAutoplay,
  showAddVideoDialog,
  setShowAddVideoDialog,
  videoUrl,
  setVideoUrl,
  handleAddVideo,
  isAddingVideo,
  isAllowedToControl,
  handleSeek,
}: VideoControlsProps) {
  // 비디오 진행 바 클릭 시간 이동 핸들러
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentVideo || isLoading || !playerRef.current || !isAllowedToControl) return;
    
    try {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const seekTime = videoDuration * clickPosition;
      
      console.log(`[Progress Bar] 시간 이동: ${seekTime.toFixed(2)}초`);
      
      // handleSeek 함수 호출
      if (typeof handleSeek === 'function') {
        handleSeek(seekTime);
      } else {
        console.error('[Error] handleSeek function is not defined');
      }
    } catch (error) {
      console.error("Error seeking video:", error);
    }
  };
  
  return (
    <>
      {/* 비디오 진행률 표시 */}
      {currentVideo && (
        <div 
          className={`h-2 bg-muted w-full ${isAllowedToControl ? 'cursor-pointer' : 'cursor-not-allowed'} relative group transition-all hover:h-3`}
          onClick={handleProgressBarClick}
          title={`${formatTime(playerRef.current?.getCurrentTime() || 0)} / ${formatTime(videoDuration)}`}
        >
          <Progress value={videoProgress} className="h-full transition-all" />
          <div className="absolute right-2 top-0 text-xs bg-black/70 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(playerRef.current?.getCurrentTime() || 0)} / {formatTime(videoDuration)}
          </div>
        </div>
      )}

      {/* 비디오 컨트롤 */}
      <div className="p-3 bg-muted/50 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPlaying ? "secondary" : "default"}
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={!currentVideo || isLoading || !isAllowedToControl}
                  className="h-9 w-9 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAllowedToControl ? (
                  <p>{isPlaying ? "일시정지" : "재생"}</p>
                ) : (
                  <p>권한이 없습니다. 방장만 영상을 제어할 수 있습니다.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNextVideo(true)}
                  disabled={!currentVideo || isLoading || !hasNextVideo || !isAllowedToControl}
                  className="h-9 w-9 rounded-full"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAllowedToControl ? (
                  <p>다음 비디오</p>
                ) : (
                  <p>권한이 없습니다. 방장만 영상을 제어할 수 있습니다.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMuted ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  disabled={!currentVideo || isLoading}
                  className="h-9 w-9 rounded-full"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMuted ? "음소거 해제" : "음소거"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={autoplay ? "secondary" : "ghost"}
                  size="icon"
                  onClick={handleToggleAutoplay}
                  disabled={!currentVideo || isLoading || !isAllowedToControl}
                  className="h-9 w-9 rounded-full"
                >
                  <Repeat className={`h-4 w-4 ${autoplay ? "text-primary-foreground" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAllowedToControl ? (
                  <p>{autoplay ? "자동 재생 켜짐" : "자동 재생 꺼짐"}</p>
                ) : (
                  <p>권한이 없습니다. 방장만 설정을 변경할 수 있습니다.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentVideo && (
            <div className="text-sm ml-2 hidden sm:block">
              <span className="font-medium">{formatTime(playerRef.current?.getCurrentTime() || 0)}</span>
              <span className="text-muted-foreground"> / {formatTime(videoDuration)}</span>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {currentVideo ? (
            <div className="flex items-center">
              <div className="relative w-8 h-8 rounded overflow-hidden mr-2 border">
                <img
                  src={currentVideo.thumbnailUrl || "/placeholder.svg"}
                  alt={currentVideo.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="text-sm truncate max-w-[300px]">
                <span className="font-medium">{currentVideo.title}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">재생 중인 비디오 없음</p>
          )}

          <AddVideoDialog 
            showAddVideoDialog={showAddVideoDialog}
            setShowAddVideoDialog={setShowAddVideoDialog}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            handleAddVideo={handleAddVideo}
            isAddingVideo={isAddingVideo}
            triggerButtonClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            triggerButtonText="비디오 추가"
          />
        </div>
      </div>
    </>
  )
} 