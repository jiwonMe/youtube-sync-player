"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Music, Lock, Users, ArrowLeft, Youtube } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlaylistSelector } from "@/components/playlist-selector"
import { Separator } from "@/components/ui/separator"

// Form validation schema
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

export default function CreateRoomPage() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

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

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('🎵 선택된 플레이리스트:', selectedPlaylist?.videos?.map(video => ({
      id: video.id,
      videoId: video.videoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl
    })));
    try {
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
    <div className="container max-w-md py-10">
      <Card>
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
            <Alert className="mb-6">
              <AlertDescription className="flex items-center">
                <Youtube className="h-4 w-4 text-red-600 mr-2" />
                <span>
                  <Link href="/sign-in" className="underline font-semibold">
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
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="My Awesome Room" {...field} />
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
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Separator />
                <PlaylistSelector onSelect={handlePlaylistSelect} />
                {selectedPlaylist && (
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium">{selectedPlaylist.title}</span>
                  </div>
                )}
                <Separator />
              </div>

              <FormField
                control={form.control}
                name="isPasswordProtected"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
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
                      <FormLabel>Room Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

