"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogIn, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Form validation schema
const formSchema = z.object({
  roomId: z.string().min(1, {
    message: "Room ID is required.",
  }),
  password: z.string().optional(),
})

export default function JoinRoomPage() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: "",
      password: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Here you would typically make an API call to check if the room exists and if a password is required
      console.log("Joining room with values:", values)

      // Include user information if logged in
      const joinData = {
        ...values,
        user: isSignedIn
          ? {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.primaryEmailAddress?.emailAddress,
              image: user.imageUrl,
            }
          : null,
      }

      console.log("Join data with user info:", joinData)

      // Mock API call to check if password is required
      // In a real app, you would check this with your backend
      if (!isPasswordRequired) {
        // If we're showing the password field already, this means the user has entered it
        // and we can proceed to the room
        router.push(`/room/${values.roomId}`)
      } else {
        // If we haven't shown the password field yet, but the backend says we need one,
        // show the password field
        setIsPasswordRequired(true)
      }
    } catch (error) {
      console.error("Failed to join room:", error)
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
            <CardTitle className="text-2xl">Join a Room</CardTitle>
          </div>
          <CardDescription>Enter a room ID to join an existing room.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSignedIn ? (
            <Alert className="mb-6">
              <AlertDescription>
                Joining as <span className="font-semibold">{user.fullName}</span>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6">
              <AlertDescription>
                Joining as a guest.{" "}
                <Link href="/sign-in" className="underline font-semibold">
                  Sign in
                </Link>{" "}
                to save your watch history.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter room ID" {...field} />
                    </FormControl>
                    <FormDescription>This is the unique identifier for the room you want to join.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPasswordRequired && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter room password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                {isPasswordRequired ? "Enter Room" : "Join Room"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Don&apos;t have a room ID?{" "}
          <Link href="/create-room" className="ml-1 underline">
            Create a room
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

