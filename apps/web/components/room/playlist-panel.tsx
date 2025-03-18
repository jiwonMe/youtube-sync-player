"use client"

import React from "react"
import { Socket } from "socket.io-client"
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot, DropResult } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  List, 
  Trash2, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Play,
  Pause,
  Music2
} from "lucide-react"
import { VideoItem } from "@/types/room"
import { RoomState } from "@/types/room"
import { AddVideoDialog } from "./add-video-dialog"

/**
 * 플레이리스트 패널 컴포넌트 Props
 */
interface PlaylistPanelProps {
  /** 비디오 플레이리스트 */
  playlist: VideoItem[]
  /** 현재 재생 중인 비디오 */
  currentVideo: VideoItem | null
  /** 비디오 선택 핸들러 */
  handleVideoSelect: (video: VideoItem) => void
  /** 비디오 제거 핸들러 */
  handleRemoveVideo: (videoId: string, e: React.MouseEvent) => void
  /** 로딩 상태 */
  isLoading: boolean
  /** 사용자가 방장인지 여부 */
  isHost: boolean | undefined
  /** 플레이리스트 순서 변경 핸들러 */
  handlePlaylistReorder?: (result: DropResult) => void
  /** 소켓 객체 */
  socket?: Socket | null
  /** 비디오 추가 대화상자 표시 여부 */
  showAddVideoDialog?: boolean
  /** 비디오 추가 대화상자 표시 여부 설정 함수 */
  setShowAddVideoDialog?: (value: boolean) => void
  /** 비디오 URL */
  videoUrl?: string
  /** 비디오 URL 설정 함수 */
  setVideoUrl?: (value: string) => void
  /** 비디오 추가 핸들러 */
  handleAddVideo?: () => Promise<void>
  /** 비디오 추가 중 상태 */
  isAddingVideo?: boolean
  /** 비디오 재생 중 여부 */
  isPlaying?: boolean
  /** 룸 상태 설정 함수 (직접 상태 업데이트용) */
  setRoomState?: React.Dispatch<React.SetStateAction<RoomState>>
}

/**
 * 비디오 플레이리스트를 표시하는 컴포넌트
 */
export function PlaylistPanel({
  playlist,
  currentVideo,
  handleVideoSelect,
  handleRemoveVideo,
  isLoading,
  isHost,
  handlePlaylistReorder,
  socket,
  showAddVideoDialog,
  setShowAddVideoDialog,
  videoUrl,
  setVideoUrl,
  handleAddVideo,
  isAddingVideo,
  isPlaying,
  setRoomState,
}: PlaylistPanelProps) {
  // 비디오 ID로부터 색상 생성
  const generateColorFromId = (id: string): string => {
    const hash = id.split('').reduce((acc, char) => (acc * 31) + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <List className="h-4 w-4 mr-2 text-muted-foreground" />
            {playlist.length} {playlist.length === 1 ? "영상" : "영상"}
          </span>
          
          {setShowAddVideoDialog && (
            <AddVideoDialog
              showAddVideoDialog={showAddVideoDialog || false}
              setShowAddVideoDialog={setShowAddVideoDialog}
              videoUrl={videoUrl || ""}
              setVideoUrl={setVideoUrl || (() => {})}
              handleAddVideo={handleAddVideo || (async () => {})}
              isAddingVideo={isAddingVideo || false}
              triggerButtonText="영상 추가"
              triggerButtonClassName="h-7 text-xs"
            />
          )}
        </div>
        
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={`skeleton-${i}`} className="flex p-3 border-b gap-2 animate-pulse">
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
                  className="space-y-1 p-1"
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
                          className={`flex p-3 cursor-pointer transition-all group ${
                            currentVideo?.id === video.id 
                              ? "bg-primary/10 border-l-[3px] border-l-primary shadow-sm" 
                              : "hover:bg-muted/40 border-l-[3px] border-l-transparent"
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
                                  {isPlaying ? "재생 중" : "일시정지"}
                                </Badge>
                              </div>
                            )}
                            <div 
                              className="absolute top-0 right-0 w-1 h-full opacity-60"
                              style={{ 
                                backgroundColor: generateColorFromId(video.id)
                              }}
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-medium text-sm line-clamp-2 pr-2">
                                {currentVideo?.id === video.id && (
                                  <span className="mr-1.5 inline-flex">
                                    {isPlaying ? (
                                      <Pause className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Play className="h-3.5 w-3.5 text-primary" />
                                    )}
                                  </span>
                                )}
                                {video.title}
                              </h4>
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
                                          console.log(`[플레이리스트] 항목 위로 이동: "${video.title}", 현재 위치: ${actualIndex}`);
                                          const newPlaylist = [...playlist];
                                          [newPlaylist[actualIndex], newPlaylist[actualIndex - 1]] = 
                                            [newPlaylist[actualIndex - 1], newPlaylist[actualIndex]];
                                          
                                          // 서버에 변경사항 전송
                                          if (socket) {
                                            console.log('[플레이리스트] playlist:update 이벤트 발송');
                                            socket.emit("playlist:update", newPlaylist);
                                            
                                            // 로컬 상태 직접 업데이트 (서버 응답 대기 없이)
                                            if (setRoomState) {
                                              setRoomState((prev: RoomState) => ({
                                                ...prev,
                                                playlist: newPlaylist
                                              }));
                                              console.log('[플레이리스트] 로컬 상태 직접 업데이트');
                                            }
                                          } else {
                                            console.error('[플레이리스트] 소켓 연결이 없어 재정렬할 수 없습니다');
                                          }
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
                                          console.log(`[플레이리스트] 항목 아래로 이동: "${video.title}", 현재 위치: ${actualIndex}`);
                                          const newPlaylist = [...playlist];
                                          [newPlaylist[actualIndex], newPlaylist[actualIndex + 1]] = 
                                            [newPlaylist[actualIndex + 1], newPlaylist[actualIndex]];
                                          
                                          // 서버에 변경사항 전송
                                          if (socket) {
                                            console.log('[플레이리스트] playlist:update 이벤트 발송');
                                            socket.emit("playlist:update", newPlaylist);
                                            
                                            // 로컬 상태 직접 업데이트 (서버 응답 대기 없이)
                                            if (setRoomState) {
                                              setRoomState((prev: RoomState) => ({
                                                ...prev,
                                                playlist: newPlaylist
                                              }));
                                              console.log('[플레이리스트] 로컬 상태 직접 업데이트');
                                            }
                                          } else {
                                            console.error('[플레이리스트] 소켓 연결이 없어 재정렬할 수 없습니다');
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
              <Music2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">플레이리스트가 비어있습니다</p>
              <p className="text-xs mb-4">영상을 추가하고 함께 시청해보세요</p>
              
              {setShowAddVideoDialog && (
                <Button 
                  onClick={() => setShowAddVideoDialog(true)}
                  variant="outline"
                  className="mt-2"
                >
                  영상 추가하기
                </Button>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 