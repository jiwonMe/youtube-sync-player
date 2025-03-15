"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import YouTube from "react-youtube"

interface YouTubePlayerProps {
  videoId: string
  isPlaying: boolean
  currentTime: number
  onStateChange: (event: any) => void
  isMuted: boolean
  playerRef?: React.MutableRefObject<any>
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  currentTime,
  onStateChange,
  isMuted,
  playerRef,
}: YouTubePlayerProps) {
  const internalPlayerRef = useRef<any>(null)
  const actualPlayerRef = playerRef || internalPlayerRef
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Handle player ready
  const onReady = (event: any) => {
    actualPlayerRef.current = event.target
    setIsReady(true)

    // Set initial time if needed
    if (currentTime > 0) {
      actualPlayerRef.current.seekTo(currentTime)
    }

    // Set mute state
    if (isMuted) {
      actualPlayerRef.current.mute()
    } else {
      actualPlayerRef.current.unMute()
    }
  }

  // Handle player error
  const onError = (event: any) => {
    console.error("YouTube Player Error:", event)
    setError("Error loading video. Please try another video.")
  }

  // Sync player state with component props
  useEffect(() => {
    if (!actualPlayerRef.current || !isReady) return

    try {
      if (isPlaying) {
        actualPlayerRef.current.playVideo()
      } else {
        actualPlayerRef.current.pauseVideo()
      }
    } catch (err) {
      console.error("Error controlling player:", err)
    }
  }, [isPlaying, actualPlayerRef, isReady])

  // Handle mute/unmute
  useEffect(() => {
    if (!actualPlayerRef.current || !isReady) return

    try {
      if (isMuted) {
        actualPlayerRef.current.mute()
      } else {
        actualPlayerRef.current.unMute()
      }
    } catch (err) {
      console.error("Error controlling player volume:", err)
    }
  }, [isMuted, actualPlayerRef, isReady])

  // Sync current time
  useEffect(() => {
    if (!actualPlayerRef.current || !isReady) return

    // Only seek if the difference is significant (more than 3 seconds)
    // This prevents constant seeking which can cause playback issues
    const currentPlayerTime = actualPlayerRef.current.getCurrentTime() || 0
    if (Math.abs(currentPlayerTime - currentTime) > 3) {
      actualPlayerRef.current.seekTo(currentTime)
    }
  }, [currentTime, actualPlayerRef, isReady])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-400">Try adding a different video to the playlist</p>
        </div>
      </div>
    )
  }

  return (
    <YouTube
      videoId={videoId}
      opts={{
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1, // Enable fullscreen button
          controls: 0, // Hide controls, we'll use our own
        },
      }}
      onReady={onReady}
      onStateChange={onStateChange}
      onError={onError}
      className="w-full h-full"
    />
  )
}

