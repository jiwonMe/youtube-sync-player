import type React from "react"
import Link from "next/link"
import { Play, Users, Plus, LogIn, Music, Clock, ListVideo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Watch YouTube Together
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Synchronized YouTube player with shared playlists. Watch videos with friends in perfect sync, no matter
                where they are.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/create-room">
                  <Plus className="h-5 w-5" />
                  Create a Room
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/join-room">
                  <LogIn className="h-5 w-5" />
                  Join a Room
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Everything you need for a perfect shared viewing experience.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<Play className="h-10 w-10" />}
              title="Synchronized Playback"
              description="Watch videos in perfect sync with everyone in the room. Play, pause, and seek together."
            />
            <FeatureCard
              icon={<ListVideo className="h-10 w-10" />}
              title="Shared Playlists"
              description="Build a queue of videos together. Anyone can add videos to the playlist."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Watch Together"
              description="Invite friends with a simple link. No account required to join."
            />
            <FeatureCard
              icon={<Music className="h-10 w-10" />}
              title="Chat While Watching"
              description="Built-in chat to discuss the video in real-time with other viewers."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10" />}
              title="No Time Limits"
              description="Watch for as long as you want. No restrictions on session duration."
            />
            <FeatureCard
              icon={<Plus className="h-10 w-10" />}
              title="Easy to Use"
              description="Simple interface that anyone can use. No technical knowledge required."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Watch Together?</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Create a room and invite your friends with a simple link.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild size="lg" className="gap-2">
                <Link href="/create-room">
                  <Plus className="h-5 w-5" />
                  Create a Room
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} YouTube Sync Player. All rights reserved.
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
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="flex flex-col items-center text-center h-full">
      <CardHeader>
        <div className="p-2 bg-primary/10 rounded-full text-primary mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

