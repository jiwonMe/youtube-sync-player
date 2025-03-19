import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * 사용자 정보를 Supabase와 동기화하는 훅
 * 
 * 사용자가 로그인하면 /api/auth/sync API를 호출하여 
 * Clerk 사용자 정보를 Supabase 데이터베이스에 동기화합니다.
 */
export function useSupabaseSync() {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // 사용자 정보가 로드되었고 로그인된 상태인 경우에만 동기화
    if (isLoaded && isSignedIn) {
      const syncUser = async () => {
        try {
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('사용자 동기화 오류:', error);
          }
        } catch (error) {
          console.error('사용자 동기화 API 호출 실패:', error);
        }
      };

      syncUser();
    }
  }, [isLoaded, isSignedIn]);
} 