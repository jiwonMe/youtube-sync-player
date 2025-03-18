"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown, Users } from "lucide-react"
import { RoomUser } from "@/types/room"

/**
 * 사용자 패널 컴포넌트 Props
 */
interface UsersPanelProps {
  /** 방 사용자 목록 */
  users: RoomUser[]
  /** 방장 ID */
  hostId: string
  /** 로딩 상태 */
  isLoading: boolean
}

/**
 * 방 사용자 목록을 표시하는 컴포넌트
 */
export function UsersPanel({ users, hostId, isLoading }: UsersPanelProps) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollArea className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 p-2 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            {users.length} {users.length === 1 ? "viewer" : "viewers"}
          </span>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center p-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full mr-3" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center p-2 rounded-md ${
                    user.id === hostId ? "bg-muted/50 border-l-2 border-l-amber-500" : "hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-8 w-8 mr-3 ring-1 ring-muted">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">{user.name}</span>
                      {user.id === hostId && (
                        <Badge variant="outline" className="ml-2 text-xs py-0 h-4">
                          <Crown className="h-3 w-3 mr-1 text-amber-500" />
                          Host
                        </Badge>
                      )}
                    </div>
                    {user.id === hostId && (
                      <span className="text-xs text-muted-foreground">Room creator</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 