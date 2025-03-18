"use client"

import React, { useRef, useEffect } from "react"
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
import { Plus, Youtube, Link as LinkIcon } from "lucide-react"

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
  const inputRef = useRef<HTMLInputElement>(null);

  // 대화상자가 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (showAddVideoDialog && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showAddVideoDialog]);

  // Enter 키로 추가 가능하게 핸들러 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && videoUrl.trim() && !isAddingVideo) {
      handleAddVideo();
    }
  };

  return (
    <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={triggerButtonClassName}>
          <Plus className="h-4 w-4 mr-2" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube 비디오 추가
          </DialogTitle>
          <DialogDescription>
            플레이리스트에 추가할 YouTube 비디오 URL을 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>지원되는 형식:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>유튜브 영상 URL (https://www.youtube.com/watch?v=...)</li>
              <li>짧은 유튜브 URL (https://youtu.be/...)</li>
              <li>유튜브 임베드 URL (https://www.youtube.com/embed/...)</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setShowAddVideoDialog(false)}
            className="sm:hidden">
            취소
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddVideoDialog(false)}
              className="hidden sm:inline-flex">
              취소
            </Button>
            <Button 
              onClick={handleAddVideo} 
              disabled={isAddingVideo || !videoUrl.trim()}
              className="min-w-[80px]"
            >
              {isAddingVideo ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  추가 중...
                </>
              ) : "비디오 추가"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 