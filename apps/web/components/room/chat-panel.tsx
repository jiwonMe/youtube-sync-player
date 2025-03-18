"use client"

import React, { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Play, Pause, SkipForward, Film, UserPlus, UserMinus, Crown, PlayCircle, AlertCircle, MessageSquare, Send, Smile } from "lucide-react"
import { formatTimestamp, formatTime as formatVideoTime } from "../../utils/room-utils"
import { ChatMessage, EventLog } from "@/types/room"

/**
 * 채팅 패널 컴포넌트 Props
 */
interface ChatPanelProps {
  /** 채팅 메시지 배열 */
  messages: ChatMessage[]
  /** 이벤트 로그 배열 */
  eventLogs: EventLog[]
  /** 채팅 입력 상태 */
  chatInput: string
  /** 채팅 입력 상태 설정 함수 */
  setChatInput: (value: string) => void
  /** 채팅 제출 핸들러 */
  handleChatSubmit: (e: React.FormEvent) => void
  /** 로딩 상태 */
  isLoading: boolean
  /** 채팅 끝 참조 */
  chatEndRef: React.RefObject<HTMLDivElement | null>
}

/**
 * 이벤트 로그 내용을 얻는 함수
 */
const getEventText = (log: EventLog): string => {
  const { eventType, details } = log
  
  switch (eventType) {
    case 'play':
      return `영상을 재생했습니다.`
    case 'pause':
      return `영상을 일시정지했습니다.`
    case 'seek':
      return `${details?.time ? formatVideoTime(details.time) : ''}로 이동했습니다.`
    case 'videoChange':
      return `"${details?.videoTitle || ''}" 영상으로 변경했습니다.`
    case 'playlistAdd':
      return `"${details?.videoTitle || ''}" 영상을 재생목록에 추가했습니다.`
    case 'playlistRemove':
      return `"${details?.videoTitle || ''}" 영상을 재생목록에서 제거했습니다.`
    case 'playlistReorder':
      return `재생목록 순서를 변경했습니다.`
    case 'hostChange':
      return `방장이 되었습니다.`
    case 'userJoin':
      return `방에 입장했습니다.`
    case 'userLeave':
      return `방에서 나갔습니다.`
    case 'autoplayToggle':
      const autoplayStatus = details?.autoplay ? '켰' : '껐'
      return `자동 재생을 ${autoplayStatus}습니다.`
    default:
      return `알 수 없는 활동을 했습니다.`
  }
}

/**
 * 이벤트 아이콘 반환 함수
 */
const getEventIcon = (eventType: EventLog['eventType']) => {
  switch (eventType) {
    case 'play':
      return <Play className="h-3.5 w-3.5 text-green-500" />
    case 'pause':
      return <Pause className="h-3.5 w-3.5 text-gray-500" />
    case 'seek':
      return <SkipForward className="h-3.5 w-3.5 text-blue-500" />
    case 'videoChange':
      return <Film className="h-3.5 w-3.5 text-red-500" />
    case 'userJoin':
      return <UserPlus className="h-3.5 w-3.5 text-green-500" />
    case 'userLeave':
      return <UserMinus className="h-3.5 w-3.5 text-orange-500" />
    case 'hostChange':
      return <Crown className="h-3.5 w-3.5 text-yellow-500" />
    case 'autoplayToggle':
      return <PlayCircle className="h-3.5 w-3.5 text-purple-500" />
    default:
      return <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
  }
}

/**
 * 채팅 패널 컴포넌트
 */
export function ChatPanel({
  messages,
  eventLogs,
  chatInput,
  setChatInput,
  handleChatSubmit,
  isLoading,
  chatEndRef,
}: ChatPanelProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 채팅과 이벤트를 함께 정렬하여 표시하기 위한 배열 생성
  const combinedItems = React.useMemo(() => {
    // 모든 채팅 메시지와 이벤트 로그를 합치고, 타입을 구분하기 위한 필드 추가
    const chatItems = messages.map(msg => ({
      ...msg,
      itemType: 'chat' as const,
      // 서버에서 전달받은 메시지를 위한 호환성 계층 추가
      _user: msg.user || (msg.userId ? {
        id: msg.userId,
        name: msg.userName || '알 수 없음',
        image: msg.userImage,
        isHost: false // 호스트 여부는 별도로 확인
      } : undefined)
    }));
    
    const eventItems = eventLogs.map(event => ({
      ...event,
      itemType: 'event' as const
    }));
    
    // 두 배열을 합치고 timestamp로 정렬
    return [...chatItems, ...eventItems]
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, eventLogs]);
  
  // 스크롤 위치 감지 및 새 메시지 표시
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setIsAtBottom(isBottom);
    
    if (isBottom && unreadCount > 0) {
      setUnreadCount(0);
    }
  };
  
  // 새 메시지 도착 시 처리
  useEffect(() => {
    if (!isAtBottom && (messages.length > 0 || eventLogs.length > 0)) {
      setUnreadCount(prev => prev + 1);
    } else if (isAtBottom) {
      setUnreadCount(0);
    }
  }, [messages.length, eventLogs.length, isAtBottom]);
  
  // 스크롤 하단으로 이동 핸들러
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
    setIsAtBottom(true);
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea 
        className="flex-1 overflow-auto" 
        onScroll={handleScroll}
      >
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
            Chat & Events
          </span>
        </div>
        
        <div className="p-3 space-y-1">
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
          ) : combinedItems.length > 0 ? (
            combinedItems.map((item) => (
              item.itemType === 'chat' ? (
                // 채팅 메시지 렌더링
                <div 
                  key={`chat-${item.id}`} 
                  className="group hover:bg-muted/30 p-2.5 rounded-md transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex flex-wrap items-center mb-1.5 gap-1">
                    <div className="flex items-center flex-shrink-0">
                      <Avatar className="h-6 w-6 mr-2 ring-1 ring-muted flex-shrink-0">
                        <AvatarImage 
                          src={item._user?.image || item.userImage || ''} 
                          alt={item._user?.name || item.userName || '사용자'} 
                        />
                        <AvatarFallback>
                          {((item._user?.name || item.userName || '?')[0] || '?')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm whitespace-nowrap">
                        {item._user?.name || item.userName || '사용자'}
                      </span>
                    </div>
                    
                    {(item._user?.isHost) && (
                      <Badge variant="outline" className="text-xs py-0 h-4 flex-shrink-0">
                        <Crown className="h-3 w-3 mr-1 text-amber-500" />
                        Host
                      </Badge>
                    )}
                    
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm pl-8 break-words whitespace-pre-wrap">{item.message}</p>
                </div>
              ) : (
                // 이벤트 로그 렌더링
                <div 
                  key={`event-${item.id}`} 
                  className="group p-1.5 rounded-md transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300 bg-muted/5 my-1 border-l-2 border-muted/20"
                >
                  <div className="flex items-center text-xs text-muted-foreground/70 mb-0.5">
                    <Clock className="inline h-3 w-3 mr-1 flex-shrink-0 opacity-60" />
                    <span className="mr-2 whitespace-nowrap text-[10px]">{formatTimestamp(item.timestamp)}</span>
                    <div className="flex items-center mr-1 flex-shrink-0 opacity-70">
                      {getEventIcon(item.eventType)}
                    </div>
                    <Badge variant="outline" className="mr-2 text-[9px] py-0 px-1 h-3.5 border-muted-foreground/20 flex-shrink-0 opacity-60">
                      {item.eventType}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col pl-5">
                    <div className="flex items-center flex-wrap">
                      <span className="text-[11px] font-medium whitespace-nowrap mr-1 text-muted-foreground/80">{item.user?.name || '사용자'}</span>
                      {item.user?.isHost && <span className="text-[9px] text-yellow-500/70 whitespace-nowrap">(방장)</span>}
                    </div>
                    <span className="text-[11px] mt-0.5 text-muted-foreground/80">{getEventText(item)}</span>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-40px)] text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">아직 메시지가 없습니다</p>
                <p className="text-xs">첫 메시지를 보내보세요!</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* 새 메시지 알림 배지 */}
      {unreadCount > 0 && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-[60px] left-1/2 -translate-x-1/2 py-1 px-2 h-auto text-xs rounded-full shadow-lg animate-in slide-in-from-bottom fade-in"
          onClick={scrollToBottom}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          {unreadCount}개의 새 메시지
          <svg 
            className="h-3 w-3 ml-1" 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </Button>
      )}

      <div className="p-3 border-t flex-shrink-0">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="메시지 입력..."
              className="pr-9"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              disabled
            >
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!chatInput.trim()}
            className="rounded-full h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
} 