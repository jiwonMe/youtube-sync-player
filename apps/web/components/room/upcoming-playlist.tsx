"use client"

import React from "react"
import { Socket } from "socket.io-client"
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DraggableStateSnapshot, DropResult } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  List,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Plus,
  Music2
} from "lucide-react"
import { VideoItem } from "@/types/room"
import { RoomState } from "@/types/room"
import { AddVideoDialog } from "./add-video-dialog"

/**
 * 대기열 플레이리스트 컴포넌트 Props
 */
interface UpcomingPlaylistProps {
  /** 비디오 플레이리스트 */
  playlist: VideoItem[]
  /** 현재 재생 중인 비디오 */
  currentVideo: VideoItem | null
  /** 비디오 선택 핸들러 */
  handleVideoSelect: (video: VideoItem) => void
  /** 비디오 제거 핸들러 */
  handleRemoveVideo: (videoId: string, e: React.MouseEvent) => void
  /** 사용자가 방장인지 여부 */
  isHost: boolean
  /** 플레이리스트 순서 변경 핸들러 */
  handlePlaylistReorder: (result: DropResult) => void
  /** 소켓 객체 */
  socket: Socket | null
  /** 비디오 추가 다이얼로그 상태 */
  showAddVideoDialog: boolean
  /** 비디오 추가 다이얼로그 상태 설정 함수 */
  setShowAddVideoDialog: (value: boolean) => void
  /** 비디오 URL 상태 */
  videoUrl: string
  /** 비디오 URL 상태 설정 함수 */
  setVideoUrl: (value: string) => void
  /** 비디오 추가 핸들러 */
  handleAddVideo: () => Promise<void>
  /** 비디오 추가 중 상태 */
  isAddingVideo: boolean
  /** 룸 상태 설정 함수 (직접 상태 업데이트용) */
  setRoomState?: React.Dispatch<React.SetStateAction<RoomState>>
}

/**
 * 다음 재생 예정 비디오 목록을 보여주는 컴포넌트
 */
export function UpcomingPlaylist({
  playlist,
  currentVideo,
  handleVideoSelect,
  handleRemoveVideo,
  isHost,
  handlePlaylistReorder,
  socket,
  showAddVideoDialog,
  setShowAddVideoDialog,
  videoUrl,
  setVideoUrl,
  handleAddVideo,
  isAddingVideo,
  setRoomState
}: UpcomingPlaylistProps) {
  // 다음 재생 예정 비디오 목록 (현재 재생 중인 비디오 제외)
  const upcomingVideos = playlist.filter(video => video.id !== currentVideo?.id);
  
  // 비디오 ID로부터 색상 생성
  const generateColorFromId = (id: string): string => {
    const hash = id.split('').reduce((acc, char) => (acc * 31) + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  // 재생 예정 비디오가 없는 경우 렌더링하지 않음
  if (upcomingVideos.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-background border-t hidden sm:block">
      <div className="p-2 bg-muted/30 flex items-center justify-between sticky top-0 z-10">
        <span className="text-sm font-medium flex items-center">
          <List className="h-4 w-4 mr-2 text-muted-foreground" />
          다음 재생 예정 ({upcomingVideos.length})
        </span>
        <AddVideoDialog
          showAddVideoDialog={showAddVideoDialog}
          setShowAddVideoDialog={setShowAddVideoDialog}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          handleAddVideo={handleAddVideo}
          isAddingVideo={isAddingVideo}
          triggerButtonText="추가"
          triggerButtonClassName="h-7 text-xs"
        />
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
                {upcomingVideos
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
                          className={`flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] cursor-pointer hover:bg-muted/40 rounded-md transition-colors p-2 group relative ${
                            snapshot.isDragging ? "bg-muted/60 shadow-lg" : ""
                          }`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="relative w-full aspect-video rounded-md overflow-hidden mb-2 border border-border">
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
                            <div 
                              className="absolute top-0 right-0 w-1 h-full opacity-60"
                              style={{ 
                                backgroundColor: generateColorFromId(video.id)
                              }}
                            />
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2 pr-2">{video.title}</h4>
                          
                          {/* 컨트롤 버튼 */}
                          {isHost && (
                            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded">
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
                                      console.log('[UpcomingPlaylist] playlist:update 이벤트 발송');
                                      socket.emit("playlist:update", newPlaylist);
                                      
                                      // 로컬 상태 직접 업데이트 (서버 응답 대기 없이)
                                      if (setRoomState) {
                                        setRoomState((prev: RoomState) => ({
                                          ...prev,
                                          playlist: newPlaylist
                                        }));
                                        console.log('[UpcomingPlaylist] 로컬 상태 직접 업데이트');
                                      }
                                    } else {
                                      console.error('[UpcomingPlaylist] 소켓 연결이 없어 재정렬할 수 없습니다');
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
                                    const newPlaylist = [...playlist];
                                    [newPlaylist[actualIndex], newPlaylist[actualIndex + 1]] = 
                                      [newPlaylist[actualIndex + 1], newPlaylist[actualIndex]];
                                    
                                    // 서버에 변경사항 전송
                                    if (socket) {
                                      console.log('[UpcomingPlaylist] playlist:update 이벤트 발송');
                                      socket.emit("playlist:update", newPlaylist);
                                      
                                      // 로컬 상태 직접 업데이트 (서버 응답 대기 없이)
                                      if (setRoomState) {
                                        setRoomState((prev: RoomState) => ({
                                          ...prev,
                                          playlist: newPlaylist
                                        }));
                                        console.log('[UpcomingPlaylist] 로컬 상태 직접 업데이트');
                                      }
                                    } else {
                                      console.error('[UpcomingPlaylist] 소켓 연결이 없어 재정렬할 수 없습니다');
                                    }
                                  }
                                }}
                                disabled={playlist.findIndex(v => v.id === video.id) === playlist.length - 1}
                              >
                                <ArrowDown className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-destructive/10"
                                onClick={(e) => handleRemoveVideo(video.id, e)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
                
                {upcomingVideos.length === 0 && (
                  <div className="flex items-center justify-center w-full h-24 text-muted-foreground">
                    <div className="text-center">
                      <Music2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">다음 재생 예정 영상이 없습니다</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  )
} 