"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Check, ChevronDown, Loader2, Youtube } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchUserPlaylists } from "@/services/youtube-service"

type Playlist = {
  id: string
  title: string
  description: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
}

interface PlaylistSelectorProps {
  onSelect: (playlist: Playlist) => void
}

export function PlaylistSelector({ onSelect }: PlaylistSelectorProps) {
  const { isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Fetch access token when component mounts
  useEffect(() => {
    async function getAccessToken() {
      if (isSignedIn) {
        try {
          // In a real implementation, you would fetch the YouTube access token
          // from your backend using the Clerk user ID
          const response = await fetch("/api/youtube/token", {
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            setAccessToken(data.accessToken)
          }
        } catch (error) {
          console.error("Failed to get access token:", error)
        }
      }
    }

    getAccessToken()
  }, [isSignedIn])

  useEffect(() => {
    async function loadPlaylists() {
      if (accessToken) {
        setLoading(true)
        try {
          const userPlaylists = await fetchUserPlaylists(accessToken)
          setPlaylists(userPlaylists)
        } catch (error) {
          console.error("Failed to load playlists:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (open && playlists.length === 0 && accessToken) {
      loadPlaylists()
    }
  }, [open, accessToken, playlists.length])

  const handleSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    onSelect(playlist)
    setOpen(false)
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">YouTube Playlist</label>
        <Button variant="outline" disabled className="justify-start text-muted-foreground">
          <Youtube className="mr-2 h-4 w-4 text-red-600" />
          Sign in to access your playlists
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">YouTube Playlist</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
            {selectedPlaylist ? (
              <div className="flex items-center">
                {selectedPlaylist.thumbnails?.default?.url && (
                  <div className="relative w-6 h-6 mr-2 overflow-hidden rounded">
                    <Image
                      src={selectedPlaylist.thumbnails.default.url || "/placeholder.svg"}
                      alt={selectedPlaylist.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="truncate max-w-[200px]">{selectedPlaylist.title}</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Youtube className="mr-2 h-4 w-4 text-red-600" />
                <span>Select a playlist</span>
              </div>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search playlists..." />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading playlists...</span>
                  </div>
                ) : (
                  "No playlists found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {playlists.map((playlist) => (
                  <CommandItem
                    key={playlist.id}
                    value={playlist.title}
                    onSelect={() => handleSelect(playlist)}
                    className="flex items-center"
                  >
                    {playlist.thumbnails?.default?.url && (
                      <div className="relative w-8 h-8 mr-2 overflow-hidden rounded">
                        <Image
                          src={playlist.thumbnails.default.url || "/placeholder.svg"}
                          alt={playlist.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="truncate">{playlist.title}</span>
                    {selectedPlaylist?.id === playlist.id && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

