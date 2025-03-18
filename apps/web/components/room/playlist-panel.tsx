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
  ArrowDown 
} from "lucide-react"
import { VideoItem } from "@/types/room"

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