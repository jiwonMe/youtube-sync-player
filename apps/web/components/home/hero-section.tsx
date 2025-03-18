"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Plus, LogIn, ArrowRight } from "lucide-react"
// import { motion } from "framer-motion"
import { useTrackEvent } from "@/hooks/use-track-event"
import { Events } from "@/lib/mixpanel"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Hero 섹션 컴포넌트
 * 홈페이지 상단에 표시되는 주요 섹션
 */
export function HeroSection() {
  const router = useRouter()
  const { toast } = useToast()
  const [roomName, setRoomName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [isMounted, setIsMounted] = useState(false)
  const [joinByName, setJoinByName] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  // Mixpanel 이벤트 추적 초기화
  const analytics = useTrackEvent('HomeHero')

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    // 약간의 지연을 두어 이미 렌더링된 후에 마운트 상태를 변경
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 50);
    
    // 페이지 접속 이벤트 추적
    analytics.trackFeatureUsed('home_page_viewed')
    
    return () => clearTimeout(timer);
  }, [analytics])

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // 탭 변경 이벤트 추적
  useEffect(() => {
    if (isMounted) {
      analytics.trackFeatureUsed('hero_tab_changed', {
        tabName: activeTab
      })
    }
  }, [activeTab, isMounted, analytics])
  
  // 참여 방식 변경 이벤트 추적 
  useEffect(() => {
    if (isMounted && activeTab === "join") {
      analytics.trackFeatureUsed('join_method_changed', {
        joinByName
      })
    }
  }, [joinByName, activeTab, isMounted, analytics])

  // Quick room creation handler
  const handleQuickCreateRoom = () => {
    if (!roomName || roomName.length < 3) {
      // 유효성 검사 실패 이벤트 추적
      analytics.trackError('quick_create_room_validation_failed', {
        roomNameLength: roomName.length
      })
      
      toast({
        title: "Room name required",
        description: "Room name must be at least 3 characters long.",
        variant: "destructive",
      })
      return
    }
    
    // 빠른 방 생성 버튼 클릭 이벤트 추적
    analytics.trackButtonClick('quick_create_room', {
      roomNameLength: roomName.length
    })

    // Navigate to create room page with name parameter
    router.push(`/create-room?name=${encodeURIComponent(roomName)}`)
  }

  // Quick room join handler
  const handleQuickJoinRoom = async () => {
    if (joinByName) {
      // Join by room name
      if (!roomId || roomId.length < 3) {
        // 유효성 검사 실패 이벤트 추적
        analytics.trackError('quick_join_room_validation_failed', {
          joinMethod: 'name',
          identifierLength: roomId.length
        })
        
        toast({
          title: "Room name required",
          description: "Room name must be at least 3 characters long.",
          variant: "destructive",
        })
        return
      }
      
      // 빠른 방 참여 시도 이벤트 추적
      analytics.trackFeatureUsed('quick_join_room_attempted', {
        joinMethod: 'name',
        identifierLength: roomId.length
      })

      setIsJoining(true)
      try {
        // Find room by name
        const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || ''}/rooms/by-name?name=${encodeURIComponent(roomId)}`)
        
        if (!response.ok) {
          throw new Error("Failed to find room")
        }
        
        const data = await response.json()
        
        if (data.exists) {
          // 빠른 방 참여 성공 이벤트 추적
          analytics.track(Events.ROOM_JOINED, {
            joinMethod: 'name',
            roomId: data.roomId,
            roomName: roomId,
            fromHomepage: true
          })
          
          // Room exists, navigate to it
          router.push(`/room/${data.roomId}`)
        } else {
          // 방 찾기 실패 이벤트 추적
          analytics.trackError('room_not_found', {
            joinMethod: 'name',
            roomName: roomId
          })
          
          toast({
            title: "Room not found",
            description: "No room with that name exists.",
            variant: "destructive",
          })
        }
      } catch (error) {
        // 방 참여 오류 이벤트 추적
        analytics.trackError('quick_join_room_failed', {
          error: error instanceof Error ? error.message : String(error),
          joinMethod: 'name',
          roomName: roomId
        })
        
        console.error("Error finding room:", error)
        toast({
          title: "Error",
          description: "There was an error finding the room. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsJoining(false)
      }
    } else {
      // Join by room ID
      if (!roomId) {
        // 유효성 검사 실패 이벤트 추적
        analytics.trackError('quick_join_room_validation_failed', {
          joinMethod: 'id',
          identifierLength: 0
        })
        
        toast({
          title: "Room ID required",
          description: "Please enter a room ID to join.",
          variant: "destructive",
        })
        return
      }
      
      // 빠른 방 참여 성공 이벤트 추적 (ID 기반)
      analytics.track(Events.ROOM_JOINED, {
        joinMethod: 'id',
        roomId: roomId,
        fromHomepage: true
      })

      // Navigate directly to the room
      router.push(`/room/${roomId}`)
    }
  }

  // Handle keyboard shortcuts
  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickCreateRoom()
    }
  }

  const handleJoinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickJoinRoom()
    }
  }

  return (
    <section id="hero-section" className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px); 
          }
          to { 
            opacity: 1;
            transform: translateY(0); 
          }
        }

        @keyframes lineExpand {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes scrollIndicator {
          0% { transform: translateY(0); }
          50% { transform: translateY(4px); }
          100% { transform: translateY(0); }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .hero-content {
          opacity: 0;
        }

        .hero-content.mounted {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .hero-badge {
          opacity: 0;
        }

        .hero-badge.mounted {
          animation: slideUp 0.6s ease-out 0.2s forwards;
        }

        .hero-title {
          opacity: 0;
        }

        .hero-title.mounted {
          animation: slideUp 0.6s ease-out 0.3s forwards;
        }

        .hero-underline {
          width: 0;
        }

        .hero-underline.mounted {
          animation: lineExpand 0.5s ease-out 0.8s forwards;
        }

        .hero-tabs {
          opacity: 0;
        }

        .hero-tabs.mounted {
          animation: slideUp 0.6s ease-out 0.4s forwards;
        }

        .hero-scroll-text {
          opacity: 0;
        }

        .hero-scroll-text.mounted {
          animation: fadeIn 0.5s ease-out 1.2s forwards;
        }

        .hero-scroll-icon {
          opacity: 0;
        }

        .hero-scroll-icon.mounted {
          animation: fadeIn 0.5s ease-out 1.4s forwards;
        }

        .hero-scroll-dot {
          animation: scrollIndicator 1.5s ease-in-out infinite;
        }

        .hero-blob-container {
          opacity: 0;
        }

        .hero-blob-container.mounted {
          opacity: 0.1;
          transition: opacity 0.6s ease-out;
        }

        .blob-1 {
          opacity: 0;
        }

        .blob-1.mounted {
          opacity: 1;
          animation: blob 7s infinite;
          transition: opacity 0.5s ease-out;
        }

        .blob-2 {
          opacity: 0;
        }

        .blob-2.mounted {
          opacity: 1;
          animation: blob 7s infinite 2s;
          transition: opacity 0.5s ease-out 0.1s;
        }

        .blob-3 {
          opacity: 0;
        }

        .blob-3.mounted {
          opacity: 1;
          animation: blob 7s infinite 4s;
          transition: opacity 0.5s ease-out 0.2s;
        }

        .blob-4 {
          opacity: 0;
        }

        .blob-4.mounted {
          opacity: 1;
          animation: blob 7s infinite 3s;
          transition: opacity 0.5s ease-out 0.15s;
        }
      `}</style>

      {/* Enhanced background gradient with animated effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted z-0">
        <div className={cn("absolute inset-0", isMounted ? "hero-blob-container mounted" : "hero-blob-container")}>
          <div className={cn("absolute top-0 -left-4 w-72 h-72 bg-red-500/40 rounded-full mix-blend-multiply filter blur-xl", isMounted ? "blob-1 mounted" : "blob-1")} />
          <div className={cn("absolute top-0 -right-4 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl", isMounted ? "blob-2 mounted" : "blob-2")} />
          <div className={cn("absolute -bottom-8 left-20 w-72 h-72 bg-rose-500/30 rounded-full mix-blend-multiply filter blur-xl", isMounted ? "blob-3 mounted" : "blob-3")} />
          <div className={cn("absolute bottom-20 right-20 w-56 h-56 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-xl", isMounted ? "blob-4 mounted" : "blob-4")} />
        </div>
      </div>

      <div className="container relative px-4 md:px-6 mx-auto z-10">
        <div className={cn("flex flex-col items-center space-y-6 text-center hero-content", isMounted && "mounted")}>
          <div className={cn("hero-badge", isMounted && "mounted")}>
            <Badge 
              variant="outline" 
              className="px-3 py-1 text-sm bg-background/80 backdrop-blur-sm border-red-500/20 shadow-sm shadow-red-500/10 hover:shadow-red-500/20 hover:border-red-500/30 transition-all duration-300"
            >
              <span className="text-red-500 font-medium mr-1">New</span> 
              <span className="text-muted-foreground">YouTube Sync Player</span>
            </Badge>
          </div>
          
          <div className={cn("space-y-4 hero-title", isMounted && "mounted")}>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Watch <span className="text-red-600 relative inline-block">
                YouTube
                <span className={cn("absolute -bottom-1 left-0 h-0.5 bg-red-500/50 hero-underline", isMounted && "mounted")} />
              </span> Together
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Synchronized YouTube player with shared playlists. Watch videos with friends in perfect sync, no matter
              where they are.
            </p>
          </div>
          
          {/* Quick Room Creation/Join Tabs */}
          <div 
            className={cn(
              "w-full max-w-md mt-4 bg-background/80 backdrop-blur-sm rounded-lg border border-red-500/10 shadow-lg shadow-red-500/5 overflow-hidden hover:shadow-lg hover:shadow-red-500/10 hover:border-red-500/20 transition-all duration-300 hero-tabs",
              isMounted && "mounted"
            )}
          >
            <Tabs 
              defaultValue="create" 
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg bg-muted/50">
                <TabsTrigger 
                  value="create" 
                  className="rounded-tl-lg data-[state=active]:bg-background data-[state=active]:text-red-500 transition-all duration-300 relative overflow-hidden group"
                  onClick={() => {
                    if (activeTab !== "create") {
                      analytics.trackFeatureUsed('tab_switched_to_create')
                    }
                  }}
                >
                  Create Room
                  <span 
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-transform duration-300",
                      activeTab === "create" ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </TabsTrigger>
                <TabsTrigger 
                  value="join" 
                  className="rounded-tr-lg data-[state=active]:bg-background data-[state=active]:text-red-500 transition-all duration-300 relative overflow-hidden group"
                  onClick={() => {
                    if (activeTab !== "join") {
                      analytics.trackFeatureUsed('tab_switched_to_join')
                    }
                  }}
                >
                  Join Room
                  <span 
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-transform duration-300",
                      activeTab === "join" ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Room Name</h3>
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Enter a name for your room" 
                        value={roomName}
                        onChange={(e) => {
                          setRoomName(e.target.value)
                          if (e.target.value.length >= 3) {
                            analytics.trackFeatureUsed('room_name_entered', {
                              length: e.target.value.length
                            })
                          }
                        }}
                        onKeyDown={handleCreateKeyDown}
                        className="border-red-500/20 focus-visible:ring-red-500/30 shadow-sm transition-all duration-300"
                      />
                      <Button 
                        onClick={handleQuickCreateRoom} 
                        size="icon" 
                        className="shrink-0 bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:translate-y-[-2px]"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create a room instantly with a name. You can add videos later.
                    </p>
                  </div>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 group"
                    onClick={() => analytics.trackButtonClick('go_to_create_room_page')}
                  >
                    <Link href="/create-room">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="relative">
                        Go to Create Room Page
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="join" className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Join by</h3>
                      <div className="flex items-center space-x-4 text-xs">
                        <div 
                          className={cn(
                            "flex items-center cursor-pointer",
                            !joinByName ? "text-red-500" : "text-muted-foreground"
                          )}
                          onClick={() => {
                            setJoinByName(false)
                            analytics.trackFeatureUsed('join_method_selected', {
                              method: 'id'
                            })
                          }}
                        >
                          <span className="text-sm">Room ID</span>
                        </div>
                        <div 
                          className={cn(
                            "flex items-center cursor-pointer",
                            joinByName ? "text-red-500" : "text-muted-foreground"
                          )}
                          onClick={() => {
                            setJoinByName(true)
                            analytics.trackFeatureUsed('join_method_selected', {
                              method: 'name'
                            })
                          }}
                        >
                          <span className="text-sm">Room Name</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder={joinByName ? "Enter room name" : "Enter room ID"} 
                        value={roomId}
                        onChange={(e) => {
                          setRoomId(e.target.value)
                          if (e.target.value.length >= 3) {
                            analytics.trackFeatureUsed('room_identifier_entered', {
                              joinMethod: joinByName ? 'name' : 'id',
                              length: e.target.value.length
                            })
                          }
                        }}
                        onKeyDown={handleJoinKeyDown}
                        className="border-red-500/20 focus-visible:ring-red-500/30 shadow-sm transition-all duration-300"
                      />
                      <Button 
                        onClick={handleQuickJoinRoom} 
                        size="icon" 
                        disabled={isJoining}
                        className="shrink-0 bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:translate-y-[-2px]"
                      >
                        {isJoining ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {joinByName 
                        ? "Enter a room name to join instantly." 
                        : "Enter a room ID to join instantly."}
                    </p>
                  </div>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 group"
                    onClick={() => analytics.trackButtonClick('go_to_join_room_page')}
                  >
                    <Link href="/join-room">
                      <LogIn className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                      <span className="relative">
                        Go to Join Room Page
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Floating scroll indicator - 위치 조정 */}
        <div className="relative h-16 mt-8 md:mt-12">
          <button 
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              analytics.trackButtonClick('scroll_to_features')
            }}
            className={cn(
              "absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500",
              isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            aria-label="Scroll to features"
          >
            <span className={cn("text-xs text-muted-foreground mb-2 hero-scroll-text", isMounted && "mounted")}>
              Discover Features
            </span>
            <div className={cn("w-6 h-10 border-2 border-red-500/30 rounded-full flex justify-center p-1 shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 hero-scroll-icon", isMounted && "mounted")}>
              <div className="w-1 h-2 bg-red-500/60 rounded-full hero-scroll-dot" />
            </div>
          </button>
        </div>
      </div>
    </section>
  )
} 