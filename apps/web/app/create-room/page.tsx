"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Music, Lock, Users, ArrowLeft, Youtube, PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlaylistSelector } from "@/components/playlist-selector"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Wave } from "@/components/ui/wave"

/**
 * FormSchema
 * 폼 유효성 검사를 위한 스키마
 */
const formSchema = z.object({
  roomName: z
    .string()
    .min(3, {
      message: "Room name must be at least 3 characters.",
    })
    .max(50, {
      message: "Room name must not exceed 50 characters.",
    }),
  description: z
    .string()
    .max(200, {
      message: "Description must not exceed 200 characters.",
    })
    .optional(),
  isPasswordProtected: z.boolean().default(false),
  password: z.string().optional(),
})

/**
 * Playlist 타입
 * 유튜브 플레이리스트 데이터 구조
 */
type Playlist = {
  id: string
  title: string
  description: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
  videos?: Array<{
    id: string
    videoId: string
    title: string
    thumbnailUrl: string
  }>
}

/**
 * CreateRoomSection 컴포넌트
 * 룸 생성 폼을 표시하는 섹션
 */
function CreateRoomSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isSignedIn } = useUser()
  const { toast } = useToast()
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  
  // URL에서 방 이름 파라미터 가져오기
  const nameFromUrl = searchParams.get('name')

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: "",
      description: "",
      isPasswordProtected: false,
      password: "",
    },
  })

  // URL에서 전달된 방 이름이 있으면 폼에 설정
  useEffect(() => {
    if (nameFromUrl) {
      form.setValue("roomName", nameFromUrl)
    }
  }, [nameFromUrl, form])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('🎵 선택된 플레이리스트:', selectedPlaylist?.videos?.map(video => ({
      id: video.id,
      videoId: video.videoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl
    })));
    try {
      // 방 이름 중복 체크
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/rooms/check-name?name=${encodeURIComponent(values.roomName)}`);
      
      if (!checkResponse.ok) {
        throw new Error('Failed to check room name');
      }
      
      const checkData = await checkResponse.json();
      
      if (checkData.isTaken) {
        toast({
          title: "Room name already taken",
          description: "Please choose a different room name.",
          variant: "destructive",
        });
        return;
      }

      // API 호출을 통해 방 생성
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          playlist: selectedPlaylist?.videos?.map(video => ({
            id: video.id,
            videoId: video.videoId,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl
          })) || [], // 비디오 목록을 VideoItem 형식으로 변환
          createdBy: isSignedIn
            ? {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.primaryEmailAddress?.emailAddress,
                image: user.imageUrl,
              }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      router.push(`/room/${data.roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  }

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    // Optionally set the room name based on playlist title if empty
    if (!form.getValues().roomName) {
      form.setValue("roomName", playlist.title)
    }
  }

  return (
    <section className="py-12 md:py-16 animate-fade-in">
      <div className="container max-w-md mx-auto px-4">
        <Card className="border border-border/40 bg-card/95 backdrop-blur-sm shadow-lg animate-slide-up">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-2xl">Create a Room</CardTitle>
            </div>
            <CardDescription>Create a new room to watch YouTube videos together with friends.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSignedIn && (
              <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                <AlertDescription className="flex items-center">
                  <Youtube className="h-4 w-4 text-red-600 mr-2" />
                  <span>
                    <Link href="/sign-in" className="underline font-semibold text-primary">
                      Sign in with Google
                    </Link>{" "}
                    to access your YouTube playlists.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="roomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Music className="h-4 w-4 text-red-500" />
                          <Input 
                            placeholder="My Awesome Room" 
                            {...field} 
                            className="border-border/50 focus:border-red-500/50"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>This is the name that will be displayed to others.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What kind of videos will you be watching?"
                          className="resize-none border-border/50 focus:border-red-500/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Separator className="bg-border/50" />
                  <div className={cn(
                    isMounted ? "opacity-100" : "opacity-90",
                    "transition-opacity duration-300"
                  )}>
                    <PlaylistSelector onSelect={handlePlaylistSelect} />
                  </div>
                  {selectedPlaylist && (
                    <div className={cn(
                      "space-y-3 animate-fade-in",
                      isMounted ? "opacity-100" : "opacity-90"
                    )}>
                      <div className="text-sm text-muted-foreground">
                        Selected: <span className="font-medium text-red-500">{selectedPlaylist.title}</span>
                      </div>
                      {selectedPlaylist.videos && selectedPlaylist.videos.length > 0 && (
                        <div className="mt-2 border border-border/50 rounded-md overflow-hidden shadow-sm">
                          <div className="p-2 border-b bg-muted/30 backdrop-blur-sm flex items-center">
                            <Youtube className="h-3.5 w-3.5 text-red-500 mr-2" />
                            <span className="text-sm font-medium">
                              {selectedPlaylist.videos.length} {selectedPlaylist.videos.length === 1 ? "video" : "videos"} in playlist
                            </span>
                          </div>
                          <ScrollArea className="h-[200px]">
                            <div className="p-2">
                              {selectedPlaylist.videos.map((video) => (
                                <div 
                                  key={video.id} 
                                  className="flex p-2 mb-2 hover:bg-red-500/5 rounded-md transition-colors"
                                >
                                  <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0 shadow-sm">
                                    <img
                                      src={video.thumbnailUrl || "/placeholder.svg"}
                                      alt={video.title}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 ml-3">
                                    <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                                    <div className="flex items-center mt-1">
                                      <Youtube className="h-3 w-3 text-red-600 mr-1" />
                                      <span className="text-xs text-muted-foreground">YouTube</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                  <Separator className="bg-border/50" />
                </div>

                <FormField
                  control={form.control}
                  name="isPasswordProtected"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 hover:border-red-500/20 transition-colors duration-200">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-red-500" />
                          Password Protection
                        </FormLabel>
                        <FormDescription>Require a password to join this room.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            setIsPasswordProtected(checked)
                          }}
                          className="data-[state=checked]:bg-red-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isPasswordProtected && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="animate-fade-in">
                        <FormLabel>Room Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter password" 
                            {...field} 
                            className="border-border/50 focus:border-red-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full gap-2 bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 border-none transition-all duration-300 hover:-translate-y-1 group",
                      isMounted ? "opacity-100" : "opacity-90"
                    )}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    disabled={form.formState.isSubmitting}
                  >
                    <PlusCircle className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isButtonHovered && "rotate-90"
                    )} />
                    <span className="relative inline-block">
                      Create Room
                      {isMounted && (
                        <span className={cn(
                          "absolute -bottom-1 left-0 w-0 h-0.5 bg-white/30",
                          isButtonHovered && "w-full transition-all duration-300"
                        )}></span>
                      )}
                    </span>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <div className="text-center">
              Already have a room ID?{" "}
              <Link href="/join-room" className="text-red-500 hover:underline font-medium transition-colors">
                Join a room
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Background animation */}
      {isMounted && (
        <Wave fadeIn={false} opacity={5} />
      )}
    </section>
  )
}

/**
 * CreateRoomPage 컴포넌트
 * 룸 생성 페이지
 */
export default function CreateRoomPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <CreateRoomSection />
      </Suspense>
    </div>
  )
}

