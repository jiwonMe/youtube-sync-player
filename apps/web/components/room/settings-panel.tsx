"use client"

import React from "react"
import { Crown, Users, Play, SkipForward, FastForward } from "lucide-react"
import { Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface SettingsPanelProps {
  socket: Socket | null
  isHost: boolean
  hostId: string
  users: Array<{
    id: string
    name: string
    image?: string
    isHost?: boolean
  }>
  videoControlPermission: string
  playPermission: string
  seekPermission: string
  videoChangePermission: string
  onChangeHost: () => void
  onUpdatePermission: (type: string, value: 'host-only' | 'all-users') => void
  isLoading: boolean
}

export function SettingsPanel({
  socket,
  isHost,
  hostId,
  users,
  videoControlPermission,
  playPermission,
  seekPermission,
  videoChangePermission,
  onChangeHost,
  onUpdatePermission,
  isLoading,
}: SettingsPanelProps) {
  const { toast } = useToast()

  // 권한이 없는 경우 알림 표시
  const handleUnauthorizedAction = () => {
    toast({
      title: "권한이 없습니다",
      description: "방장만 설정을 변경할 수 있습니다.",
      variant: "destructive",
    })
  }

  // 권한 변경 핸들러
  const handlePermissionChange = (type: string, value: 'host-only' | 'all-users') => {
    if (!isHost) {
      handleUnauthorizedAction()
      return
    }
    
    onUpdatePermission(type, value)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2">
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Crown className="h-5 w-5 mr-2 text-amber-500" />
            방장 권한
          </CardTitle>
          <CardDescription>
            방장은 모든 설정을 변경할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">현재 방장</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {isLoading ? (
                  <div className="h-6 w-full animate-pulse bg-muted-foreground/20 rounded" />
                ) : (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                      <Crown className="h-3 w-3 mr-1" />
                      방장
                    </Badge>
                    {users.find(user => user.id === hostId)?.name || "알 수 없음"}
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={onChangeHost} 
              disabled={!isHost || users.length <= 1}
              variant="outline"
              className="w-full"
            >
              다른 사용자에게 방장 권한 이전
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Play className="h-5 w-5 mr-2 text-green-500" />
            재생/일시정지 권한
          </CardTitle>
          <CardDescription>
            누가 영상을 재생하거나 일시정지할 수 있는지 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            disabled={!isHost}
            value={playPermission}
            onValueChange={(value) => handlePermissionChange("play", value as 'host-only' | 'all-users')}
          >
            <SelectTrigger>
              <SelectValue placeholder="권한 설정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="host-only">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  방장만 가능
                </div>
              </SelectItem>
              <SelectItem value="all-users">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  모든 참가자 가능
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <FastForward className="h-5 w-5 mr-2 text-blue-500" />
            시간 이동(시크) 권한
          </CardTitle>
          <CardDescription>
            누가 영상의 특정 시간으로 이동할 수 있는지 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            disabled={!isHost}
            value={seekPermission}
            onValueChange={(value) => handlePermissionChange("seek", value as 'host-only' | 'all-users')}
          >
            <SelectTrigger>
              <SelectValue placeholder="권한 설정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="host-only">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  방장만 가능
                </div>
              </SelectItem>
              <SelectItem value="all-users">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  모든 참가자 가능
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <SkipForward className="h-5 w-5 mr-2 text-purple-500" />
            영상 변경 권한
          </CardTitle>
          <CardDescription>
            누가 다음 영상으로 변경하거나 플레이리스트에서 영상을 선택할 수 있는지 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            disabled={!isHost}
            value={videoChangePermission}
            onValueChange={(value) => handlePermissionChange("videoChange", value as 'host-only' | 'all-users')}
          >
            <SelectTrigger>
              <SelectValue placeholder="권한 설정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="host-only">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  방장만 가능
                </div>
              </SelectItem>
              <SelectItem value="all-users">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  모든 참가자 가능
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
