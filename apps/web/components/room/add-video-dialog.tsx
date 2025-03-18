"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

/**
 * 비디오 추가 대화상자 컴포넌트 Props
 */
interface AddVideoDialogProps {
  /** 대화상자 표시 여부 */
  showAddVideoDialog: boolean
  /** 대화상자 표시 여부 설정 함수 */
  setShowAddVideoDialog: (value: boolean) => void
  /** 비디오 URL */
  videoUrl: string
  /** 비디오 URL 설정 함수 */
  setVideoUrl: (value: string) => void
  /** 비디오 추가 핸들러 */
  handleAddVideo: () => Promise<void>
  /** 비디오 추가 중 상태 */
  isAddingVideo: boolean
  /** 트리거 버튼에 적용할 클래스 */
  triggerButtonClassName?: string
  /** 트리거 버튼 텍스트 */
  triggerButtonText?: string
}

/**
 * 유튜브 비디오 추가 대화상자 컴포넌트
 */
export function AddVideoDialog({
  showAddVideoDialog,
  setShowAddVideoDialog,
  videoUrl,
  setVideoUrl,
  handleAddVideo,
  isAddingVideo,
  triggerButtonClassName = "",
  triggerButtonText = "Add Video"
}: AddVideoDialogProps) {
  return (
    <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={triggerButtonClassName}>
          <Plus className="h-4 w-4 mr-2" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add YouTube Video</DialogTitle>
          <DialogDescription>Enter a YouTube video URL to add it to the playlist.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddVideoDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddVideo} disabled={isAddingVideo || !videoUrl.trim()}>
            {isAddingVideo ? "Adding..." : "Add Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 