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
import { useTrackEvent } from "@/hooks/use-track-event"
import { Events } from "@/lib/mixpanel"

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
  
  // Mixpanel 이벤트 추적 초기화
  const analytics = useTrackEvent('CreateRoom')
  
  // URL에서 방 이름 파라미터 가져오기
  const nameFromUrl = searchParams.get('name')

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
    
    // 페이지 접속 이벤트 추적
    analytics.trackFeatureUsed('create_room_page_viewed', {
      withNameParam: !!nameFromUrl,
      isAuthenticated: !!isSignedIn
    })
  }, [isSignedIn, nameFromUrl, analytics])

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
    // 방 생성 시도 이벤트 추적
    analytics.trackFeatureUsed('room_creation_attempted', {
      hasDescription: !!values.description?.trim(),
      isPasswordProtected: values.isPasswordProtected,
      hasPlaylist: !!selectedPlaylist,
      playlistSize: selectedPlaylist?.videos?.length || 0,
      isAuthenticated: !!isSignedIn
    })
    
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
        // 방 이름 중복 발생 이벤트 추적
        analytics.trackError('room_name_already_taken', {
          roomName: values.roomName
        })
        
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
      
      // 방 생성 성공 이벤트 추적
      analytics.track(Events.ROOM_CREATED, {
        roomId: data.roomId,
        roomName: values.roomName,
        isPasswordProtected: values.isPasswordProtected,
        hasDescription: !!values.description?.trim(),
        hasPlaylist: !!selectedPlaylist,
        playlistSize: selectedPlaylist?.videos?.length || 0,
        isAuthenticated: !!isSignedIn
      })
      
      router.push(`/room/${data.roomId}`);
    } catch (error) {
      // 방 생성 오류 이벤트 추적
      analytics.trackError('room_creation_failed', {
        error: error instanceof Error ? error.message : String(error),
        roomName: values.roomName
      })
      
      console.error("Failed to create room:", error);
      
      toast({
        title: "Failed to create room",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    
    // 플레이리스트 선택 이벤트 추적
    analytics.trackFeatureUsed('playlist_selected', {
      playlistId: playlist.id,
      playlistTitle: playlist.title,
      videoCount: playlist.videos?.length || 0
    })
    
    // Optionally set the room name based on playlist title if empty
    if (!form.getValues().roomName) {
      form.setValue("roomName", playlist.title)
    }
  }
  
  // 비밀번호 토글 이벤트 추적
  const handlePasswordToggle = (checked: boolean) => {
    setIsPasswordProtected(checked)
    form.setValue("isPasswordProtected", checked)
    
    analytics.trackFeatureUsed('password_protection_toggled', {
      isEnabled: checked
    })
  }

  return (
    <section className="py-12 md:py-16 animate-fade-in">
      <div className="container max-w-md mx-auto px-4">
        <Card className="border border-border/40 bg-card/95 backdrop-blur-sm shadow-lg animate-slide-up">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="mr-2"
                onClick={() => analytics.trackButtonClick('back_to_home')}
              >
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
                    <Link 
                      href="/sign-in" 
                      className="underline font-semibold text-primary"
                      onClick={() => analytics.trackButtonClick('sign_in_from_create_room')}
                    >
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
                            onChange={(e) => {
                              field.onChange(e)
                              if (e.target.value.length >= 3) {
                                analytics.trackFeatureUsed('room_name_entered', {
                                  length: e.target.value.length
                                })
                              }
                            }}
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
                          onChange={(e) => {
                            field.onChange(e)
                            if (e.target.value.length > 0) {
                              analytics.trackFeatureUsed('description_entered')
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPasswordProtected"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center">
                          <Lock className="h-4 w-4 text-red-500 mr-2" />
                          Password Protection
                        </FormLabel>
                        <FormDescription>Protect your room with a password.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            handlePasswordToggle(checked)
                          }}
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
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter room password"
                            className="border-border/50 focus:border-red-500/50"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              if (e.target.value.length > 0) {
                                analytics.trackFeatureUsed('password_entered', {
                                  length: e.target.value.length
                                })
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div>
                  {isSignedIn ? (
                    <div className="space-y-4">
                      <h3 className="text-base font-medium flex items-center">
                        <PlusCircle className="h-4 w-4 text-red-500 mr-2" />
                        Add videos from your playlists (Optional)
                      </h3>
                      <div className="bg-muted/50 rounded-md p-4 h-[300px] overflow-hidden relative border">
                        <PlaylistSelector onSelect={handlePlaylistSelect} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-md bg-muted/20 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Sign in to add videos from your playlists</p>
                    </div>
                  )}

                  {selectedPlaylist && (
                    <div className="mt-4 p-3 border rounded-md bg-accent/20">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Music className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                        Selected Playlist
                      </h4>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                          <img
                            src={selectedPlaylist.thumbnails.medium.url || selectedPlaylist.thumbnails.default.url}
                            alt={selectedPlaylist.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate">{selectedPlaylist.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedPlaylist.videos ? `${selectedPlaylist.videos.length} videos` : "Loading videos..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className={cn(
                      "w-full relative overflow-hidden transition-all bg-gradient-to-r",
                      isButtonHovered
                        ? "from-red-600 to-red-500 shadow-lg shadow-red-500/20 scale-[1.01]"
                        : "from-red-500 to-red-600"
                    )}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    data-umami-event="create-room-button"
                  >
                    <span className="relative z-10">Create Room</span>
                    {isButtonHovered && (
                      <Wave
                        className="absolute inset-0 z-0"
                        color="rgba(255,255,255,0.1)"
                      />
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center pt-0 border-t">
            <p className="text-xs text-muted-foreground mt-3 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              No account required for your friends to join
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

/**
 * CreateRoomPage 컴포넌트
 * 방 생성 페이지의 메인 컴포넌트
 */
export default function CreateRoomPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-700/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000" />
      <div className="absolute top-[5%] left-[30%] w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl opacity-50 animate-blob animation-delay-3000" />
      
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <CreateRoomSection />
      </Suspense>
    </div>
  )
}

