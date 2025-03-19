import { NextResponse } from 'next/server';
import { syncUserWithSupabase } from '@/lib/supabase-auth';
import { currentUser } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/logging';

// 로거 생성
const logger = createLogger('api-auth-sync');

/**
 * Clerk 사용자 정보를 Supabase와 동기화하는 API 라우트
 * 사용자가 로그인하면 이 API를 호출하여 Supabase 데이터베이스에 사용자 정보를 저장합니다.
 */
export async function POST() {
  try {
    logger.info('사용자 동기화 API 호출됨');
    
    const user = await currentUser();
    
    if (!user) {
      logger.error('인증되지 않은 사용자가 API 접근 시도');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    logger.info('사용자 정보 확인됨', {
      userId: user.id,
      email: user.emailAddresses.map(e => e.emailAddress),
      username: user.username
    });
    
    // Clerk 사용자 정보를 Supabase와 동기화 (service_role 권한 사용)
    logger.info('Supabase 동기화 시작');
    const supabaseUser = await syncUserWithSupabase();
    
    logger.info('Supabase 동기화 완료', { supabaseUserId: supabaseUser?.id });
    return NextResponse.json({ user: supabaseUser });
  } catch (error) {
    logger.error('사용자 동기화 오류', error);
    return NextResponse.json(
      { error: 'Failed to sync user with Supabase', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 