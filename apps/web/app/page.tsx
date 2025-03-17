"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Play, 
  Users, 
  Plus, 
  LogIn, 
  Music, 
  Clock, 
  ListVideo, 
  ArrowRight, 
  Youtube, 
  ChevronRight,
  PlusCircle 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [roomName, setRoomName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)

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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Quick Room Creation/Join */}
      <section id="hero-section" className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background gradient with animated effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted z-0">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="container relative px-4 md:px-6 mx-auto z-10">
          <div className="flex flex-col items-center space-y-6 text-center">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-background/80 backdrop-blur-sm">
              <span className="text-primary font-medium mr-1">New</span> 
              <span className="text-muted-foreground">YouTube Sync Player</span>
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Watch <span className="text-primary">YouTube</span> Together
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Synchronized YouTube player with shared playlists. Watch videos with friends in perfect sync, no matter
                where they are.
              </p>
            </div>
            
            {/* Quick Room Creation/Join Tabs */}
            <div className="w-full max-w-md mt-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-t-lg">
                  <TabsTrigger value="create" className="rounded-tl-lg data-[state=active]:bg-background">Create Room</TabsTrigger>
                  <TabsTrigger value="join" className="rounded-tr-lg data-[state=active]:bg-background">Join Room</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Room name (min 3 characters)" 
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        className="border-primary/20 focus-visible:ring-primary"
                      />
                      <Button onClick={handleQuickCreateRoom} size="icon" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create a room quickly and customize settings later.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                      <Link href="/create-room">
                        <Plus className="h-4 w-4 mr-2" />
                        Advanced Room Creation
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
                        className="border-primary/20 focus-visible:ring-primary"
                      />
                      <Button onClick={handleQuickJoinRoom} size="icon" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a room ID to join instantly.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                      <Link href="/join-room">
                        <LogIn className="h-4 w-4 mr-2" />
                        Go to Join Room Page
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
                "absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-opacity duration-300",
                isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              aria-label="Scroll to features"
            >
              <span className="text-xs text-muted-foreground mb-2">Discover Features</span>
              <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center p-1">
                <div className="w-1 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-20 left-[10%] w-64 h-64 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <span className="text-primary font-medium">Features</span>
              </Badge>
              <span className="h-px w-12 bg-primary/20"></span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You <span className="text-primary">Need</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              A complete toolkit for the perfect shared viewing experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
            <FeatureCard
              icon={<Play className="h-10 w-10" />}
              title="Synchronized Playback"
              description="Watch videos in perfect sync with everyone in the room. Play, pause, and seek together."
              index={0}
            />
            <FeatureCard
              icon={<ListVideo className="h-10 w-10" />}
              title="Shared Playlists"
              description="Build a queue of videos together. Anyone can add videos to the playlist."
              index={1}
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Watch Together"
              description="Invite friends with a simple link. No account required to join."
              index={2}
            />
            <FeatureCard
              icon={<Music className="h-10 w-10" />}
              title="Chat While Watching"
              description="Built-in chat to discuss the video in real-time with other viewers."
              index={3}
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10" />}
              title="No Time Limits"
              description="Watch for as long as you want. No restrictions on session duration."
              index={4}
            />
            <FeatureCard
              icon={<Plus className="h-10 w-10" />}
              title="Easy to Use"
              description="Simple interface that anyone can use. No technical knowledge required."
              index={5}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <Badge variant="outline" className="px-3 py-1 mb-4">
              <span className="text-primary font-medium">How It Works</span>
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simple Steps to Get Started</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Follow these easy steps to start watching videos with friends.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <StepCard
              number="1"
              title="Create a Room"
              description="Set up a new room in seconds. Add a name and optional password."
              icon={<PlusCircle className="h-8 w-8" />}
            />
            <StepCard
              number="2"
              title="Invite Friends"
              description="Share your room ID with friends so they can join instantly."
              icon={<Users className="h-8 w-8" />}
            />
            <StepCard
              number="3"
              title="Watch Together"
              description="Add videos to the playlist and enjoy synchronized playback."
              icon={<Play className="h-8 w-8" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-primary/5">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4 md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Watch Together?</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Create a room and invite your friends with a simple link. Start enjoying videos together in perfect sync.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' })}
                  size="lg" 
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Create a Room Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="gap-2"
                >
                  <Link href="/join-room">
                    <LogIn className="h-5 w-5" />
                    Join Existing Room
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-background/50 z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg shadow-lg flex items-center gap-3">
                    <Youtube className="h-8 w-8 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium">YouTube Sync Player</p>
                      <p className="text-xs text-muted-foreground">Watch together, anywhere</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/0 to-background/80 z-0"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <Youtube className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium">YouTube Sync Player</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Que. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode
  title: string
  description: string
  index: number
}) {
  return (
    <Card className={cn(
      "flex flex-col items-center text-center h-full border-primary/5 hover:border-primary/20 transition-all duration-300",
      "hover:shadow-md hover:-translate-y-1",
      "data-[state=open]:shadow-lg"
    )}
    data-aos="fade-up"
    data-aos-delay={100 * index}
    >
      <CardHeader>
        <div className="p-3 bg-primary/10 rounded-full text-primary mb-4 transform transition-transform group-hover:scale-110">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto">
          Learn more <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card className="relative overflow-hidden border-primary/5 hover:border-primary/20 transition-colors">
      <span className="absolute -top-6 -right-6 text-9xl font-bold text-primary/5">{number}</span>
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full text-primary">{icon}</div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="relative z-10">
        <Button variant="ghost" size="sm" className="gap-1 p-0 h-auto text-primary" asChild>
          <Link href={number === "1" ? "/create-room" : number === "2" ? "/join-room" : "/"}>
            Learn more <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// 애니메이션 효과를 위한 CSS 추가
// tailwind.config.js에 다음 내용 추가 필요:
// theme: {
//   extend: {
//     animation: {
//       blob: "blob 7s infinite",
//     },
//     keyframes: {
//       blob: {
//         "0%": {
//           transform: "translate(0px, 0px) scale(1)",
//         },
//         "33%": {
//           transform: "translate(30px, -50px) scale(1.1)",
//         },
//         "66%": {
//           transform: "translate(-20px, 20px) scale(0.9)",
//         },
//         "100%": {
//           transform: "translate(0px, 0px) scale(1)",
//         },
//       },
//     },
//   },
// },

