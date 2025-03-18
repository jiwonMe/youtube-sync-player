"use client"

import React, { useRef, useEffect, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Youtube, Link as LinkIcon, Search, Clock, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { VideoItem } from "@/types/room"
import { useTrackEvent } from "@/hooks/use-track-event"
import { Events } from "@/lib/mixpanel"

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
 * YouTube 동영상 검색 결과 타입
 */
interface SearchResult extends VideoItem {
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
}

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Mixpanel 이벤트 추적을 위한 훅 초기화
  const analytics = useTrackEvent('AddVideoDialog');
  
  // 검색 상태 관리
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);

  // 대화상자가 열릴 때 현재 활성 탭에 따라 적절한 입력 필드에 포커스
  useEffect(() => {
    if (showAddVideoDialog) {
      // 대화상자가 열릴 때 이벤트 추적
      analytics.trackFeatureUsed('dialog_opened', { activeTab });
      
      setTimeout(() => {
        if (activeTab === "url" && inputRef.current) {
          inputRef.current?.focus();
        } else if (activeTab === "search" && searchInputRef.current) {
          searchInputRef.current?.focus();
        }
      }, 100);
    } else {
      // 대화상자가 닫힐 때 상태 초기화
      setSearchQuery("");
      setSearchResults([]);
      setSelectedVideo(null);
    }
  }, [showAddVideoDialog, activeTab, analytics]);

  // Enter 키로 추가 가능하게 핸들러 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (activeTab === "url" && videoUrl.trim() && !isAddingVideo) {
        processAndAddVideo();
      } else if (activeTab === "search" && searchQuery.trim() && !isSearching) {
        handleSearch();
      }
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
    
    // 비디오 추가 시도 전 이벤트 추적
    analytics.track(Events.VIDEO_ADDED, { 
      method: 'url',
      url: finalUrl,
      isMusicUrl: finalUrl !== videoUrl
    });
    
    await handleAddVideo();
  };
  
  // 검색 처리 핸들러
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedVideo(null);
    
    // 검색 시도 이벤트 추적
    analytics.trackFeatureUsed('search_attempt', { 
      query: searchQuery 
    });
    
    try {
      const response = await fetch(`/api/youtube/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
      
      // 검색 성공 이벤트 추적
      analytics.trackFeatureUsed('search_success', { 
        query: searchQuery,
        resultsCount: data.results?.length || 0
      });
    } catch (error) {
      console.error("YouTube 검색 오류:", error);
      
      // 검색 실패 이벤트 추적
      analytics.trackError("youtube_search_failed", {
        query: searchQuery,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // 검색 결과에서 비디오 선택 핸들러
  const handleSelectVideo = (video: SearchResult) => {
    setSelectedVideo(video);
    // URL 탭의 URL 필드도 업데이트
    setVideoUrl(`https://www.youtube.com/watch?v=${video.videoId}`);
    
    // 비디오 선택 이벤트 추적
    analytics.trackFeatureUsed('video_selected_from_search', { 
      videoId: video.videoId,
      title: video.title
    });
  };
  
  // 선택한 비디오 추가 핸들러
  const handleAddSelectedVideo = async () => {
    if (selectedVideo) {
      // 검색으로 비디오 추가 이벤트 추적
      analytics.track(Events.VIDEO_ADDED, { 
        method: 'search',
        videoId: selectedVideo.videoId,
        title: selectedVideo.title
      });
      
      // URL 탭과 동일한 처리 로직 활용
      await handleAddVideo();
      
      // 추가 후 선택 초기화
      setSelectedVideo(null);
    }
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // 탭 변경 이벤트 추적
    analytics.trackFeatureUsed('tab_changed', { 
      fromTab: activeTab,
      toTab: value
    });
  };

  return (
    <Dialog open={showAddVideoDialog} onOpenChange={setShowAddVideoDialog}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className={triggerButtonClassName}
          onClick={() => analytics.trackButtonClick('add_video_trigger')}
        >
          <Plus className="h-4 w-4 mr-2" />
          {triggerButtonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            동영상 추가
          </DialogTitle>
          <DialogDescription>
            URL을 직접 입력하거나 검색으로 동영상을 찾아 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="url" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL 입력
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              검색
            </TabsTrigger>
          </TabsList>
          
          {/* URL 입력 탭 */}
          <TabsContent value="url" className="space-y-4 py-4">
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
              <p>지원하는 형식:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>YouTube 동영상 URL (https://www.youtube.com/watch?v=...)</li>
                <li>짧은 YouTube URL (https://youtu.be/...)</li>
                <li>YouTube 임베드 URL (https://www.youtube.com/embed/...)</li>
                <li>YouTube Music URL (https://music.youtube.com/...)</li>
              </ul>
            </div>
            
            <DialogFooter className="sm:justify-between pt-2">
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
                  onClick={processAndAddVideo} 
                  disabled={isAddingVideo || !videoUrl.trim()}
                  className="min-w-[80px]"
                >
                  {isAddingVideo ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      추가 중...
                    </>
                  ) : "추가하기"}
                </Button>
              </div>
            </DialogFooter>
          </TabsContent>
          
          {/* 검색 탭 */}
          <TabsContent value="search" className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
              >
                {isSearching ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                ) : "검색"}
              </Button>
            </div>
            
            {/* 검색 결과 목록 */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {isSearching ? (
                // 로딩 상태
                Array(3).fill(0).map((_, i) => (
                  <div key={`skeleton-${i}`} className="flex p-3 border rounded-md gap-2 animate-pulse">
                    <div className="h-16 w-28 bg-muted rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 w-full bg-muted rounded mb-2"></div>
                      <div className="h-3 w-20 bg-muted rounded"></div>
                    </div>
                  </div>
                ))
              ) : searchResults.length > 0 ? (
                // 검색 결과
                searchResults.map((video) => (
                  <div 
                    key={video.id}
                    className={`flex p-2 border rounded-md gap-2 cursor-pointer transition-all ${
                      selectedVideo?.id === video.id 
                        ? "bg-primary/10 border-primary" 
                        : "hover:bg-muted/40"
                    }`}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="relative w-28 h-16 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={video.thumbnailUrl || "/placeholder.svg"}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                      {selectedVideo?.id === video.id && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="h-5 w-5 text-primary bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{video.channelTitle}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>
                ))
              ) : searchQuery && !isSearching ? (
                // 결과 없음
                <div className="text-center py-6 text-muted-foreground">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
            
            <DialogFooter className="sm:justify-between pt-2">
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
                  onClick={handleAddSelectedVideo} 
                  disabled={isAddingVideo || !selectedVideo}
                  className="min-w-[80px]"
                >
                  {isAddingVideo ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      추가 중...
                    </>
                  ) : "선택 추가"}
                </Button>
              </div>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 