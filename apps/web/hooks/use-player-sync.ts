"use client"

import { useState, useEffect, useRef } from "react"
import type { Socket } from "socket.io-client"

type PlayerState = {
  isPlaying: boolean
  currentTime: number
  isMuted: boolean
}

export function usePlayerSync(socket: Socket | null, initialState: PlayerState) {
  const [playerState, setPlayerState] = useState<PlayerState>(initialState)
  const playerRef = useRef<any>(null)

  // Listen for player state changes from the server
  useEffect(() => {
    if (!socket) return

    const handleStateChange = (data: { isPlaying: boolean; currentTime: number }) => {
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
      }))
    }

    socket.on("player:stateChange", handleStateChange)

    return () => {
      socket.off("player:stateChange", handleStateChange)
    }
  }, [socket])

  // Play/pause handler
  const handlePlayPause = () => {
    const newIsPlaying = !playerState.isPlaying

    setPlayerState((prev) => ({
      ...prev,
      isPlaying: newIsPlaying,
    }))

    if (socket) {
      socket.emit("player:stateChange", {
        isPlaying: newIsPlaying,
        currentTime: playerRef.current?.getCurrentTime() || 0,
      })
    }
  }

  // Seek handler
  const handleSeek = (time: number) => {
    setPlayerState((prev) => ({
      ...prev,
      currentTime: time,
    }))

    if (socket) {
      socket.emit("player:stateChange", {
        isPlaying: playerState.isPlaying,
        currentTime: time,
      })
    }
  }

  // Mute handler
  const handleMute = () => {
    setPlayerState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }))
  }

  return {
    playerState,
    playerRef,
    handlePlayPause,
    handleSeek,
    handleMute,
  }
}

