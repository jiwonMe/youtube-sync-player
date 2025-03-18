"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogIn, ArrowLeft, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { Wave } from "@/components/ui/wave"

/**
 * FormSchema
 * 폼 유효성 검사를 위한 스키마
 */
const formSchema = z.object({
  joinType: z.enum(["id", "name"]).default("id"),
  roomIdentifier: z.string().min(1, {
    message: "Room ID or name is required.",
  }),
  password: z.string().optional(),
})

/**
 * JoinRoomSection 컴포넌트
 * 룸 참가 폼을 표시하는 섹션
 */
function JoinRoomSection() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    // 약간의 지연을 두어 이미 렌더링된 후에 마운트 상태를 변경
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 50);
    
    return () => clearTimeout(timer);
  }, [])

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      joinType: "id",
      roomIdentifier: "",
      password: "",
    },
  })

  // Get current join type
  const joinType = form.watch("joinType")

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setJoinError(null)
    setIsJoining(true)
    
    try {
      const { joinType, roomIdentifier, password } = values

      if (joinType === "name") {
        // 방 이름으로 조회
        const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/rooms/by-name?name=${encodeURIComponent(roomIdentifier)}`)
        
        if (!response.ok) {
          throw new Error("Failed to find room")
        }
        
        const data = await response.json()
        
        if (data.exists) {
          // Room exists, check if password protected
          if (data.isPasswordProtected && !isPasswordRequired) {
            setIsPasswordRequired(true)
            setIsJoining(false)
            return
          }
          
          // Navigate to the room
          router.push(`/room/${data.roomId}`)
        } else {
          setJoinError("No room with that name exists")
          setIsJoining(false)
        }
      } else {
        // 방 ID로 직접 입장
        router.push(`/room/${roomIdentifier}`)
      }
    } catch (error) {
      console.error("Failed to join room:", error)
      setJoinError("Error joining room. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <section className="py-12 md:py-16 relative">
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

        .join-card {
          opacity: 0;
          transform: translateY(20px);
        }

        .join-card.mounted {
          animation: slideUp 0.6s ease-out forwards;
        }

        .password-field {
          opacity: 0;
        }

        .password-field.mounted {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .button-underline {
          width: 0;
          transition: width 0.3s ease-out;
        }

        .button-underline.active {
          width: 100%;
        }
      `}</style>

      <div className="container max-w-md mx-auto px-4">
        <Card className={cn(
          "border border-border/40 bg-card/95 backdrop-blur-sm shadow-lg join-card",
          isMounted && "mounted"
        )}>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-2xl">Join a Room</CardTitle>
            </div>
            <CardDescription>Enter a room ID or name to join an existing room.</CardDescription>
          </CardHeader>
          <CardContent>
            {isSignedIn ? (
              <Alert className="mb-6 bg-primary/10 border-primary/20">
                <AlertDescription className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Joining as <span className="font-semibold ml-1">{user.fullName}</span>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-6 bg-secondary/10 border-secondary/20">
                <AlertDescription className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-secondary" />
                    <span>Joining as a guest</span>
                  </div>
                  <Link 
                    href="/sign-in" 
                    className="flex items-center text-primary hover:text-primary/80 font-medium transition-all duration-200"
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    <span className="relative">
                      Sign in
                      <span className="absolute -bottom-0.5 left-0 w-full h-px bg-primary/50 group-hover:bg-primary"></span>
                    </span>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="joinType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join by</FormLabel>
                      <div className="flex items-center justify-between p-2 rounded-md border border-border/50 bg-background/50">
                        <div className="flex space-x-4">
                          <FormLabel
                            className={cn(
                              "flex items-center cursor-pointer m-0 p-2 rounded-md transition-colors",
                              field.value === "id" ? "bg-red-500/20 text-red-500" : "hover:bg-muted"
                            )}
                            onClick={() => form.setValue("joinType", "id")}
                            htmlFor="join-type-id"
                          >
                            <input
                              {...field}
                              type="radio"
                              value="id"
                              id="join-type-id"
                              className="sr-only"
                              checked={field.value === "id"}
                              onChange={() => form.setValue("joinType", "id")}
                            />
                            <span>Room ID</span>
                          </FormLabel>
                          
                          <FormLabel
                            className={cn(
                              "flex items-center cursor-pointer m-0 p-2 rounded-md transition-colors",
                              field.value === "name" ? "bg-red-500/20 text-red-500" : "hover:bg-muted"
                            )}
                            onClick={() => form.setValue("joinType", "name")}
                            htmlFor="join-type-name"
                          >
                            <input
                              {...field}
                              type="radio"
                              value="name"
                              id="join-type-name"
                              className="sr-only"
                              checked={field.value === "name"}
                              onChange={() => form.setValue("joinType", "name")}
                            />
                            <span>Room Name</span>
                          </FormLabel>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="roomIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{joinType === "id" ? "Room ID" : "Room Name"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={joinType === "id" ? "Enter room ID" : "Enter room name"} 
                          {...field} 
                          className="border-border/50 focus:border-red-500/50"
                        />
                      </FormControl>
                      <FormDescription>
                        {joinType === "id" 
                          ? "This is the unique identifier for the room you want to join." 
                          : "Enter the name of the room you want to join."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {joinError && (
                  <Alert className="bg-red-500/10 border-red-500/20 text-red-500">
                    <AlertDescription>{joinError}</AlertDescription>
                  </Alert>
                )}

                {isPasswordRequired && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className={cn("password-field", isPasswordRequired && "mounted")}>
                        <FormLabel>Room Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter room password" 
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
                    className="w-full gap-2 bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 border-none transition-all duration-300 hover:-translate-y-1 group"
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    disabled={form.formState.isSubmitting || isJoining}
                  >
                    {isJoining ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <LogIn className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        isButtonHovered && "translate-x-1"
                      )} />
                    )}
                    <span className="relative inline-block">
                      {isPasswordRequired ? "Enter Room" : "Join Room"}
                      <span className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-white/30 button-underline",
                        isButtonHovered && "active"
                      )}></span>
                    </span>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <div className="text-center">
              Don&apos;t have a room ID?{" "}
              <Link href="/create-room" className="text-primary hover:underline font-medium transition-colors">
                Create a room
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Background animation */}
      <Wave fadeIn={true} opacity={5} />
    </section>
  )
}

/**
 * JoinRoomPage 컴포넌트
 * 룸 참가 페이지
 */
export default function JoinRoomPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <JoinRoomSection />
    </div>
  )
}

