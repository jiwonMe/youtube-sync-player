import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRoomUIProps {
  roomId: string;
}

export function useRoomUI({ roomId }: UseRoomUIProps) {
  const { toast } = useToast();
  
  // 모바일 패널 관련 상태
  const [showMobile, setShowMobile] = useState<"chat" | "playlist" | "users" | "settings" | null>(null);
  
  // 채팅 관련 상태
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // 비디오 추가 관련 상태
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  
  // 호스트 변경 대화상자 상태
  const [showChangeHostDialog, setShowChangeHostDialog] = useState(false);
  
  // 복사/공유 관련 상태
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyRoomCodeSuccess, setCopyRoomCodeSuccess] = useState(false);
  
  // 오디오 관련 상태
  const [isMuted, setIsMuted] = useState(false);
  
  // 방 링크 공유
  const handleShareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: `YouTube 방에 초대합니다`,
        text: `YouTube 영상을 함께 시청해요!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      
      toast({
        title: "링크가 복사되었습니다",
        description: "친구에게 공유하여 함께 시청해보세요",
      });
      
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }
  
  // 방 코드 복사
  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopyRoomCodeSuccess(true)
    
    toast({
      title: "방 코드가 복사되었습니다",
      description: "친구에게 공유하여 함께 시청해보세요",
    });
    
    setTimeout(() => setCopyRoomCodeSuccess(false), 2000)
  }
  
  // 채팅 제출 핸들러 (로컬 UI 동작)
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 소켓 전송은 room-client에서 처리
  };
  
  return {
    // 상태
    showMobile,
    setShowMobile,
    chatInput,
    setChatInput,
    videoUrl,
    setVideoUrl,
    showAddVideoDialog,
    setShowAddVideoDialog,
    copySuccess,
    setCopySuccess,
    copyRoomCodeSuccess,
    setCopyRoomCodeSuccess,
    isAddingVideo,
    setIsAddingVideo,
    showChangeHostDialog,
    setShowChangeHostDialog,
    isMuted,
    setIsMuted,
    chatEndRef,
    
    // 함수
    handleShareRoom,
    handleCopyRoomCode,
    handleChatSubmit
  };
}
