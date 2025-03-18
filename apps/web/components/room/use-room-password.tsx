import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { verifyRoomPassword } from '@/utils/room-utils';

interface UseRoomPasswordProps {
  roomId: string;
}

export function useRoomPassword({ roomId }: UseRoomPasswordProps) {
  const { toast } = useToast();
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ roomName: string; isPasswordProtected: boolean }>({
    roomName: "",
    isPasswordProtected: false,
  });

  // 룸 정보 확인 (비밀번호 보호 여부 체크)
  useEffect(() => {
    const checkRoomProtection = async () => {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
        const response = await fetch(`${socketUrl}/rooms/by-name?name=${roomId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch room info');
        }
        
        const data = await response.json();
        
        if (data.exists) {
          setRoomInfo({
            roomName: data.roomName || "Room",
            isPasswordProtected: data.isPasswordProtected
          });
          
          setIsPasswordProtected(data.isPasswordProtected);
          
          // 비밀번호 보호된 방이면 비밀번호 입력 대화상자 표시
          if (data.isPasswordProtected) {
            setShowPasswordDialog(true);
          } else {
            // 비밀번호 보호되지 않은 방이면 바로 연결
            setIsPasswordVerified(true);
          }
        }
      } catch (error) {
        console.error("Failed to check room protection:", error);
        // 에러가 발생해도 일단 연결 시도
        setIsPasswordVerified(true);
      }
    };
    
    checkRoomProtection();
  }, [roomId]);

  // 비밀번호 인증 함수
  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const success = await verifyRoomPassword(roomId, password);
      
      if (success) {
        setIsPasswordVerified(true);
        setShowPasswordDialog(false);
        toast({
          title: "인증 성공",
          description: "방에 입장합니다.",
        });
      }
      
      return success;
    } catch (error) {
      console.error("Failed to verify password:", error);
      toast({
        title: "인증 실패",
        description: "비밀번호가 올바르지 않습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  // 비밀번호 입력 취소 처리
  const handlePasswordCancel = () => {
    // 취소 시 이전 페이지로 이동
    window.history.back();
  };

  return {
    isPasswordProtected,
    isPasswordVerified,
    showPasswordDialog,
    roomInfo,
    setShowPasswordDialog,
    handlePasswordVerify,
    handlePasswordCancel
  };
}
