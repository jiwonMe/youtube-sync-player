import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase, createServerSupabaseClient, createServiceRoleClient } from './supabase';
import type { Database } from 'shared';

/**
 * 서버 측에서 사용자 정보를 Supabase에 동기화하는 함수
 * 사용자가 로그인하면 호출되어 Supabase DB에 사용자 정보를 저장합니다.
 * 
 * @returns 생성/업데이트된 사용자 데이터
 */
export async function syncUserWithSupabase() {
  try {
    // Clerk에서 현재 인증된 사용자 정보 가져오기
    const user = await currentUser();
    if (!user) {
      throw new Error('사용자가 인증되지 않았습니다.');
    }

    // 서비스 롤 권한으로 Supabase 클라이언트 생성 (RLS 우회)
    const serviceClient = createServiceRoleClient();

    const clerk_id = user.id;
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || user.emailAddresses[0]?.emailAddress || 'Anonymous User';
    const avatar_url = user.imageUrl;

    console.log(`Clerk 사용자 정보: ID=${clerk_id}, 이름=${username}`);

    let existingUser = null;
    let findError: any = null;

    try {
      // Supabase에서 사용자 찾기
      const result = await serviceClient
        .from('users')
        .select('*')
        .eq('clerk_id', clerk_id)
        .single();
      
      existingUser = result.data;
      findError = result.error;
    } catch (error) {
      console.log('사용자 조회 중 예외 발생:', error);
      // 예외를 findError로 할당
      findError = error;
    }

    // 오류 확인 (사용자가 없는 경우 제외)
    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log('새 사용자 생성 필요: 데이터베이스에 사용자가 없음');
      } else {
        console.error('예상치 못한 사용자 조회 오류:', findError);
        throw findError;
      }
    }

    let userData;

    if (existingUser) {
      console.log('기존 사용자 발견, 정보 업데이트 중...');
      // 기존 사용자 업데이트
      try {
        const { data: updatedUser, error: updateError } = await serviceClient
          .from('users')
          .update({
            username,
            avatar_url,
            last_seen_at: new Date().toISOString(),
          })
          .eq('clerk_id', clerk_id)
          .select()
          .single();

        if (updateError) {
          console.error('사용자 업데이트 오류:', updateError);
          throw updateError;
        }

        console.log('사용자 정보 업데이트 성공');
        userData = updatedUser;
      } catch (updateError) {
        console.error('사용자 업데이트 중 예외 발생:', updateError);
        throw updateError;
      }
    } else {
      console.log('새 사용자 생성 중...');
      // 새 사용자 생성
      try {
        const { data: newUser, error: insertError } = await serviceClient
          .from('users')
          .insert({
            clerk_id,
            username,
            avatar_url,
          })
          .select()
          .single();

        if (insertError) {
          console.error('사용자 생성 오류:', insertError);
          throw insertError;
        }

        console.log('새 사용자 생성 성공:', newUser?.id);
        userData = newUser;
      } catch (insertError) {
        console.error('사용자 생성 중 예외 발생:', insertError);
        throw insertError;
      }
    }

    return userData;
  } catch (error) {
    console.error('Supabase 사용자 동기화 오류:', error);
    throw error;
  }
}

/**
 * 클라이언트에서 Supabase에 인증된 사용자로 접근하기 위한 함수
 * Clerk에서 JWT 토큰을 발급받아 Supabase에 설정합니다.
 * 
 * @returns Supabase 클라이언트 (현재 사용자로 인증됨)
 */
export async function getAuthenticatedSupabaseClient() {
  try {
    // Clerk에서 JWT 토큰 발급
    const authInstance = await auth();
    const token = await authInstance.getToken({ template: 'supabase' });
    
    if (!token) {
      throw new Error('JWT 토큰을 발급받지 못했습니다.');
    }
    
    // Supabase 클라이언트 생성 및 JWT 설정
    const client = createServerSupabaseClient();
    client.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    return client;
  } catch (error) {
    console.error('인증된 Supabase 클라이언트 생성 오류:', error);
    throw error;
  }
}