"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown, MessageSquare } from "lucide-react"
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