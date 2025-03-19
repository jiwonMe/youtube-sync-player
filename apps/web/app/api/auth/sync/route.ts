import { NextResponse } from 'next/server';
import { syncUserWithSupabase } from '@/lib/supabase-auth';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Clerk 사용자 정보를 Supabase와 동기화하는 API 라우트
 * 사용자가 로그인하면 이 API를 호출하여 Supabase 데이터베이스에 사용자 정보를 저장합니다.
 */
export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Clerk 사용자 정보를 Supabase와 동기화
    const supabaseUser = await syncUserWithSupabase();
    
    return NextResponse.json({ user: supabaseUser });
  } catch (error) {
    console.error('사용자 동기화 오류:', error);
    return NextResponse.json(
      { error: 'Failed to sync user with Supabase', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 