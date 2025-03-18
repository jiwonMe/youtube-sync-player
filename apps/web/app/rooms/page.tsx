"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Unlock, Calendar, Users, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Room 인터페이스
 * 방 정보 데이터 구조
 */
interface Room {
  roomId: string
  roomName: string
  description?: string
  isPasswordProtected: boolean
  createdBy: string
  createdAt: string
  userCount: number
}

/**
 * RoomsPage 컴포넌트
 * 현재 활성화된 방 목록을 보여주는 페이지
 */
export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // 방 목록을 가져오는 함수
  const fetchRooms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/rooms")
      if (!response.ok) {
        throw new Error("Failed to fetch rooms")
      }
      const data = await response.json()
      setRooms(data)
      setFilteredRooms(data)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 컴포넌트 마운트 시 방 목록 가져오기
  useEffect(() => {
    fetchRooms()
    
    // 1분마다 방 목록 갱신
    const interval = setInterval(fetchRooms, 60000)
    return () => clearInterval(interval)
  }, [])
  
  // 검색어에 따른 방 필터링
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(rooms)
    } else {
      const filtered = rooms.filter(room => 
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredRooms(filtered)
    }
  }, [searchQuery, rooms])
  
  // 방 입장 처리
  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }
  
  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm hero-badge">
            함께 시청하기
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl hero-title">
            활성화된 <span className="text-primary">방 목록</span>
          </h1>
          <div className="w-24 h-1 mt-2 mb-4 bg-primary mx-auto rounded-full hero-underline"></div>
          <p className="max-w-[700px] text-muted-foreground mt-4 text-lg">
            현재 활성화된 모든 방의 목록입니다. 원하는 방을 클릭하여 입장하세요.
          </p>
        </div>
        
        <div className="relative w-full max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="방 이름이나 설명으로 검색..."
            className="pl-10 pr-4 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-9 w-1/3" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.roomId} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{room.roomName}</CardTitle>
                    {room.isPasswordProtected ? (
                      <Lock className="text-yellow-500 flex-shrink-0" size={18} />
                    ) : (
                      <Unlock className="text-green-500 flex-shrink-0" size={18} />
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <User size={14} /> {room.createdBy}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {room.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                      {room.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={14} />
                    <span>{formatDate(room.createdAt)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users size={14} /> {room.userCount}
                  </Badge>
                  <Button onClick={() => handleJoinRoom(room.roomId)}>입장하기</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">방이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "검색 결과가 없습니다. 다른 검색어를 입력해보세요." : "현재 활성화된 방이 없습니다."}
            </p>
            <Button onClick={() => router.push('/create-room')}>
              새 방 만들기
            </Button>
          </div>
        )}
        
        {filteredRooms.length > 0 && (
          <div className="flex justify-center mt-10">
            <Button onClick={() => router.push('/create-room')} variant="outline" className="mx-2">
              새 방 만들기
            </Button>
            <Button onClick={fetchRooms} variant="outline" className="mx-2">
              새로고침
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 