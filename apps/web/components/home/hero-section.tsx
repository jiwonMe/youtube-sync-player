"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Plus, LogIn, ArrowRight } from "lucide-react"
// import { motion } from "framer-motion"

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

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    // 약간의 지연을 두어 이미 렌더링된 후에 마운트 상태를 변경
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 50);
    
    return () => clearTimeout(timer);
  }, [])

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Quick room creation handler
  const handleQuickCreateRoom = () => {
    if (!roomName || roomName.length < 3) {
      toast({
        title: "Room name required",
        description: "Room name must be at least 3 characters long.",
        variant: "destructive",
      })
      return
    }

    // Navigate to create room page with name parameter
    router.push(`/create-room?name=${encodeURIComponent(roomName)}`)
  }

  // Quick room join handler
  const handleQuickJoinRoom = () => {
    if (!roomId) {
      toast({
        title: "Room ID required",
        description: "Please enter a room ID to join.",
        variant: "destructive",
      })
      return
    }

    // Navigate directly to the room
    router.push(`/room/${roomId}`)
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
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Room name (min 3 characters)" 
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
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
                    Create a room quickly and customize settings later.
                  </p>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 group"
                  >
                    <Link href="/create-room">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="relative">
                        Advanced Room Creation
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
                      </span>
                    </Link>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="join" className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Enter room ID" 
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyDown={handleJoinKeyDown}
                      className="border-red-500/20 focus-visible:ring-red-500/30 shadow-sm transition-all duration-300"
                    />
                    <Button 
                      onClick={handleQuickJoinRoom} 
                      size="icon" 
                      className="shrink-0 bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:translate-y-[-2px]"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a room ID to join instantly.
                  </p>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full border-red-500/20 hover:bg-red-500/5 shadow-sm transition-all duration-300 group"
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
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
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