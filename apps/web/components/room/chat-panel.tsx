"use client"

import React, { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown, MessageSquare, Send, Smile } from "lucide-react"
import { formatTimestamp } from "@/utils/room-utils"
import { ChatMessage } from "@/types/room"

/**
 * 채팅 패널 컴포넌트 Props
 */
interface ChatPanelProps {
  /** 채팅 메시지 배열 */
  messages: ChatMessage[]
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
 * 채팅 패널 컴포넌트
 */
export function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  isLoading,
  chatEndRef,
}: ChatPanelProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
    if (!isAtBottom && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    } else if (isAtBottom) {
      setUnreadCount(0);
    }
  }, [messages.length, isAtBottom]);
  
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
            Chat
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
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className="group hover:bg-muted/30 p-2 rounded-md transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
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
                <p className="text-sm pl-8 break-words whitespace-pre-wrap">{msg.message}</p>
              </div>
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