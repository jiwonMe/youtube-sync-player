import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createLogger } from '@/lib/logging';

// 로거 생성
const logger = createLogger('use-supabase-sync');

/**
 * 사용자 정보를 Supabase와 동기화하는 훅
 * 
 * 사용자가 로그인하면 /api/auth/sync API를 호출하여 
 * Clerk 사용자 정보를 Supabase 데이터베이스에 동기화합니다.
 */
export function useSupabaseSync() {
  const { isSignedIn, isLoaded, user } = useUser();

  useEffect(() => {
    // 사용자 정보가 로드되었고 로그인된 상태인 경우에만 동기화
    if (isLoaded && isSignedIn) {
      logger.info('사용자 동기화 훅 실행됨', {
        userId: user?.id,
        isSignedIn,
        isLoaded
      });
      
      const syncUser = async () => {
        try {
          logger.info('Supabase 동기화 API 호출 시작');
          
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json();
            logger.error('사용자 동기화 API 응답 오류', {
              status: response.status,
              statusText: response.statusText,
              error
            });
          } else {
            const data = await response.json();
            logger.info('사용자 동기화 API 응답 성공', {
              status: response.status,
              userId: data?.user?.id
            });
          }
        } catch (error) {
          logger.error('사용자 동기화 API 호출 실패', error);
        }
      };

      syncUser();
    } else {
      logger.info('사용자 동기화 조건 불충족', {
        isLoaded,
        isSignedIn
      });
    }
  }, [isLoaded, isSignedIn, user]);
} 