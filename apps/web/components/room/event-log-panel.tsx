"use client"

import React, { useRef, useEffect } from "react"
import { Clock, AlertCircle, Play, Pause, SkipForward, Film, UserPlus, UserMinus, Crown, PlayCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { EventLog } from "@/types/room"

/**
 * 이벤트 로그 패널 컴포넌트 Props
 */
interface EventLogPanelProps {
  logs: EventLog[]
}

/**
 * 타임스탬프를 읽기 쉬운 형식으로 변환하는 함수
 * @param timestamp - UNIX 타임스탬프
 * @returns 읽기 쉬운 시간 형식 (HH:MM:SS)
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * 비디오 시간(초)을 읽기 쉬운 형식으로 변환하는 함수
 * @param seconds - 초 단위 시간
 * @returns 읽기 쉬운 형식 (MM:SS)
 */
const formatVideoTime = (seconds: number): string => {
  if (isNaN(seconds)) return "00:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * 이벤트 로그 패널 컴포넌트
 * 방에서 발생한 모든 이벤트 로그를 표시합니다.
 */
export function EventLogPanel({ logs }: EventLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // 새 로그가 추가될 때 자동으로 스크롤 다운
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  /**
   * 이벤트 타입에 따른 색상 반환
   * @param eventType - 이벤트 타입
   * @returns 해당 이벤트 유형의 배지 색상
   */
  const getEventBadgeVariant = (eventType: EventLog['eventType']): "default" | "secondary" | "destructive" | "outline" => {
    switch (eventType) {
      case 'play':
        return "default" // 재생 - 파란색 (긍정적)
      case 'userJoin':
        return "default" // 입장 - 파란색 (긍정적)
      case 'pause':
        return "secondary" // 일시정지 - 회색 (중립적)
      case 'videoChange':
      case 'hostChange':
        return "destructive" // 중요한 변경 - 빨간색 (주의)
      default:
        return "outline" // 테두리만 있는 스타일
    }
  }

  /**
   * 이벤트 아이콘 반환
   * @param eventType - 이벤트 타입
   * @returns 해당 이벤트 유형에 적합한 아이콘
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
   * 이벤트 타입에 따른 텍스트 반환
   * @param log - 이벤트 로그
   * @returns 이벤트 설명 텍스트
   */
  const getEventText = (log: EventLog): string => {
    const { eventType, user, details } = log
    
    switch (eventType) {
      case 'play':
        return `${user.name}님이 영상을 재생했습니다.`
      case 'pause':
        return `${user.name}님이 영상을 일시정지했습니다.`
      case 'seek':
        return `${user.name}님이 ${details?.time ? formatVideoTime(details.time) : ''}로 이동했습니다.`
      case 'videoChange':
        return `${user.name}님이 "${details?.videoTitle || ''}" 영상으로 변경했습니다.`
      case 'playlistAdd':
        return `${user.name}님이 "${details?.videoTitle || ''}" 영상을 재생목록에 추가했습니다.`
      case 'playlistRemove':
        return `${user.name}님이 "${details?.videoTitle || ''}" 영상을 재생목록에서 제거했습니다.`
      case 'playlistReorder':
        return `${user.name}님이 재생목록 순서를 변경했습니다.`
      case 'hostChange':
        return `${user.name}님이 방장이 되었습니다.`
      case 'userJoin':
        return `${user.name}님이 방에 입장했습니다.`
      case 'userLeave':
        return `${user.name}님이 방에서 나갔습니다.`
      case 'autoplayToggle':
        const autoplayStatus = details?.autoplay ? '켰' : '껐'
        return `${user.name}님이 자동 재생을 ${autoplayStatus}습니다.`
      default:
        return `${user.name}님이 알 수 없는 활동을 했습니다.`
    }
  }
  
  return (
    <ScrollArea className="h-full w-full p-4">
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <AlertCircle className="mb-2 h-10 w-10" />
            <p>아직 이벤트 로그가 없습니다.</p>
            <p className="text-sm">방에서 활동이 발생하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <>
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 text-sm">
                <div className="text-muted-foreground whitespace-nowrap">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatTime(log.timestamp)}
                </div>
                <div className="mt-0.5">
                  {getEventIcon(log.eventType)}
                </div>
                <Badge variant={getEventBadgeVariant(log.eventType)} className="self-start mt-0.5">
                  {log.eventType}
                </Badge>
                <div className="flex-1 break-words">
                  <span className="font-medium text-foreground">{log.user.name}</span>
                  {log.user.isHost && <span className="ml-1 text-xs text-yellow-500">(방장)</span>}
                  <span className="ml-1">{getEventText(log).replace(`${log.user.name}님이 `, '')}</span>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </>
        )}
      </div>
    </ScrollArea>
  )
} 