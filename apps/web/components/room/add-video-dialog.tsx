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
 * YouTube Music URL을 일반 YouTube URL로 변환
 * @param url - 변환할 URL
 * @returns 변환된 URL
 */
const convertMusicYoutubeUrl = (url: string): string => {
  try {
    // URL이 비어있거나 유효하지 않은 경우 원본 반환
    if (!url || !url.trim()) return url;
    
    // YouTube Music URL인 경우 일반 YouTube URL로 변환
    if (url.includes('music.youtube.com')) {
      // URL 객체 생성
      const urlObj = new URL(url);
      
      // 도메인을 일반 YouTube로 변경
      urlObj.hostname = 'www.youtube.com';
      
      // video ID 확인 (필수 파라미터)
      const videoId = urlObj.searchParams.get('v');
      
      if (!videoId) return url; // video ID가 없으면 원본 반환
      
      // 새 URL 객체 생성 (필수 파라미터만 포함)
      const newUrl = new URL('https://www.youtube.com/watch');
      newUrl.searchParams.set('v', videoId);
      
      return newUrl.toString();
    }
    
    return url;
  } catch (error) {
    // URL 파싱에 실패한 경우 원본 반환
    console.error('YouTube URL 변환 오류:', error);
    return url;
  }
};

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
      processAndAddVideo();
    }
  };

  // URL 입력 처리 핸들러
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // YouTube Music URL 자동 변환
    const convertedUrl = convertMusicYoutubeUrl(e.target.value);
    setVideoUrl(convertedUrl);
  };

  // 비디오 URL 처리 및 추가
  const processAndAddVideo = async () => {
    // 추가하기 전에 URL이 YouTube Music URL인지 한 번 더 확인
    const finalUrl = convertMusicYoutubeUrl(videoUrl);
    if (finalUrl !== videoUrl) {
      setVideoUrl(finalUrl);
    }
    await handleAddVideo();
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
            Add YouTube Video
          </DialogTitle>
          <DialogDescription>
            Enter a YouTube or YouTube Music video URL to add to the playlist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="https://www.youtube.com/watch?v=... or https://music.youtube.com/..."
                value={videoUrl}
                onChange={handleUrlChange}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Supported formats:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>YouTube video URL (https://www.youtube.com/watch?v=...)</li>
              <li>Short YouTube URL (https://youtu.be/...)</li>
              <li>YouTube embed URL (https://www.youtube.com/embed/...)</li>
              <li>YouTube Music URL (https://music.youtube.com/...)</li>
            </ul>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setShowAddVideoDialog(false)}
            className="sm:hidden">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddVideoDialog(false)}
              className="hidden sm:inline-flex">
              Cancel
            </Button>
            <Button 
              onClick={processAndAddVideo} 
              disabled={isAddingVideo || !videoUrl.trim()}
              className="min-w-[80px]"
            >
              {isAddingVideo ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Adding...
                </>
              ) : "Add Video"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 