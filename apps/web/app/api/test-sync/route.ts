import { NextResponse } from 'next/server';
import { syncUserWithSupabase } from '@/lib/supabase-auth';
import { currentUser } from '@clerk/nextjs/server';
import { supabase, createServiceRoleClient } from '@/lib/supabase';

/**
 * 사용자 동기화 테스트를 위한 API 라우트
 * 이 API는 Clerk 사용자 정보를 Supabase와 동기화하고 자세한 로그를 남깁니다.
 */
export async function GET() {
  try {
    console.log('테스트 동기화 API 호출됨');
    
    const user = await currentUser();
    
    if (!user) {
      console.log('사용자가 인증되지 않음');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('현재 사용자:', {
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
      
      console.log('서비스 롤 테스트 쿼리 결과:', testQuery);
      if (testError) {
        console.error('서비스 롤 테스트 쿼리 오류:', testError);
      }
    } catch (testQueryError) {
      console.error('서비스 롤 테스트 쿼리 예외:', testQueryError);
    }
    
    try {
      // Clerk 사용자 정보를 Supabase와 동기화
      console.log('사용자 동기화 시작...');
      const supabaseUser = await syncUserWithSupabase();
      console.log('사용자 동기화 완료:', supabaseUser);
      
      return NextResponse.json({ 
        success: true, 
        user: supabaseUser,
        message: '사용자 동기화 성공'
      });
    } catch (syncError) {
      console.error('사용자 동기화 예외:', syncError);
      return NextResponse.json(
        { 
          error: 'Failed to sync user with Supabase', 
          details: syncError instanceof Error ? syncError.message : String(syncError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('전체 API 처리 오류:', error);
    return NextResponse.json(
      { 
        error: 'API error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 