import { NextResponse } from 'next/server';
import { syncUserWithSupabase } from '@/lib/supabase-auth';
import { currentUser } from '@clerk/nextjs/server';
import { supabase, createServiceRoleClient } from '@/lib/supabase';
import { createLogger } from '@/lib/logging';

// 로거 생성
const logger = createLogger('api-test-sync');

/**
 * 사용자 동기화 테스트를 위한 API 라우트
 * 이 API는 Clerk 사용자 정보를 Supabase와 동기화하고 자세한 로그를 남깁니다.
 */
export async function GET() {
  try {
    logger.info('테스트 동기화 API 호출됨');
    
    const user = await currentUser();
    
    if (!user) {
      logger.info('사용자가 인증되지 않음');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    logger.info('현재 사용자 정보', {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses.map(email => email.emailAddress)
    });
    
    // 서비스 롤 클라이언트로 테스트
    try {
      const serviceClient = createServiceRoleClient();
      const { data: testQuery, error: testError } = await serviceClient
        .from('users')
        .select('count(*)');
      
      logger.info('서비스 롤 테스트 쿼리 결과', { 
        result: testQuery,
        hasError: !!testError 
      });
      if (testError) {
        logger.error('서비스 롤 테스트 쿼리 오류', testError);
      }
    } catch (testQueryError) {
      logger.error('서비스 롤 테스트 쿼리 예외', testQueryError);
    }
    
    // 서비스 롤 권한 정보 확인
    try {
      const serviceClient = createServiceRoleClient();
      const { data: sessionData, error: sessionError } = await serviceClient.auth.getSession();
      
      logger.info('서비스 롤 권한 정보', { 
        session: sessionData,
        error: sessionError
      });
    } catch (sessionError) {
      logger.error('서비스 롤 세션 정보 확인 오류', sessionError);
    }
    
    // 서비스 롤 클라이언트로 직접 사용자 테이블 내용 확인 (동기화 전)
    try {
      const serviceClient = createServiceRoleClient();
      const { data: usersBeforeSync, error: usersError } = await serviceClient
        .from('users')
        .select('*');
      
      logger.info('동기화 전 사용자 테이블', { 
        count: usersBeforeSync?.length || 0,
        users: usersBeforeSync?.map(u => ({ id: u.id, clerk_id: u.clerk_id, username: u.username })),
        error: usersError
      });
      if (usersError) {
        logger.error('사용자 테이블 조회 오류', usersError);
      }
    } catch (e) {
      logger.error('사용자 테이블 조회 예외', e);
    }
    
    try {
      // Clerk 사용자 정보를 Supabase와 동기화
      logger.info('사용자 동기화 시작');
      const supabaseUser = await syncUserWithSupabase();
      logger.info('사용자 동기화 완료', { userData: supabaseUser });
      
      // 서비스 롤 클라이언트로 직접 사용자 테이블 내용 확인 (동기화 후)
      try {
        const serviceClient = createServiceRoleClient();
        const { data: usersAfterSync, error: usersError } = await serviceClient
          .from('users')
          .select('*');
        
        logger.info('동기화 후 사용자 테이블', { 
          count: usersAfterSync?.length || 0,
          users: usersAfterSync?.map(u => ({ id: u.id, clerk_id: u.clerk_id, username: u.username })),
          error: usersError
        });
        if (usersError) {
          logger.error('사용자 테이블 조회 오류', usersError);
        }
      } catch (e) {
        logger.error('사용자 테이블 조회 예외', e);
      }
      
      return NextResponse.json({ 
        success: true, 
        user: supabaseUser,
        message: '사용자 동기화 성공'
      });
    } catch (syncError) {
      logger.error('사용자 동기화 예외', syncError);
      return NextResponse.json(
        { 
          error: 'Failed to sync user with Supabase', 
          details: syncError instanceof Error ? syncError.message : String(syncError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('전체 API 처리 오류', error);
    return NextResponse.json(
      { 
        error: 'API error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 