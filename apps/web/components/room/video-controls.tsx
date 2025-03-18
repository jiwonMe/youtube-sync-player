"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Play, Pause, SkipForward, Volume2, VolumeX, Repeat, Plus } from "lucide-react"
import { formatTime } from "@/utils/room-utils"
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
}: VideoControlsProps) {
  return (
    <>
      {/* 비디오 진행률 표시 */}
      {currentVideo && (
        <div className="h-1 bg-muted w-full">
          <Progress value={videoProgress} className="h-1" />
        </div>
      )}

      {/* 비디오 컨트롤 */}
      <div className="p-3 bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={!currentVideo || isLoading}
                  className="h-9 w-9"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlaying ? "Pause" : "Play"}</p>
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
                  disabled={!currentVideo || isLoading || !hasNextVideo}
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
                  disabled={!currentVideo || isLoading}
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
                  disabled={!currentVideo || isLoading}
                  className="h-9 w-9"
                >
                  {autoplay ? (
                    <Repeat className="h-4 w-4 text-primary" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{autoplay ? "자동 재생 켜짐" : "자동 재생 꺼짐"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentVideo && (
            <div className="text-sm text-muted-foreground ml-2 hidden sm:block">
              {formatTime(playerRef.current?.getCurrentTime() || 0)} / {formatTime(videoDuration)}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {currentVideo ? (
            <div className="flex items-center">
              <div className="relative w-8 h-8 rounded overflow-hidden mr-2">
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
            <p className="text-sm text-muted-foreground">No video playing</p>
          )}

          <AddVideoDialog 
            showAddVideoDialog={showAddVideoDialog}
            setShowAddVideoDialog={setShowAddVideoDialog}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            handleAddVideo={handleAddVideo}
            isAddingVideo={isAddingVideo}
          />
        </div>
      </div>
    </>
  )
} 