import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase, createServerSupabaseClient, createServiceRoleClient } from './supabase';
import type { Database } from 'shared';
import { createLogger } from './logging';

// 로거 인스턴스 생성
const logger = createLogger('supabase-auth');

/**
 * 서버 측에서 사용자 정보를 Supabase에 동기화하는 함수
 * 사용자가 로그인하면 호출되어 Supabase DB에 사용자 정보를 저장합니다.
 * 
 * @returns 생성/업데이트된 사용자 데이터
 */
export async function syncUserWithSupabase() {
  try {
    logger.info('사용자 동기화 시작');
    
    // Clerk에서 현재 인증된 사용자 정보 가져오기
    const user = await currentUser();
    if (!user) {
      logger.error('사용자가 인증되지 않음');
      throw new Error('사용자가 인증되지 않았습니다.');
    }

    // 서비스 롤 권한으로 Supabase 클라이언트 생성 (RLS 우회)
    logger.info('서비스 롤 클라이언트 생성');
    const serviceClient = createServiceRoleClient();

    const clerk_id = user.id;
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || user.emailAddresses[0]?.emailAddress || 'Anonymous User';
    const avatar_url = user.imageUrl;

    logger.info(`Clerk 사용자 정보`, {
      clerk_id,
      username,
      avatar_url,
      email: user.emailAddresses.map(e => e.emailAddress),
      firstName: user.firstName,
      lastName: user.lastName
    });

    let existingUser = null;
    let findError: any = null;

    try {
      // Supabase에서 사용자 찾기
      logger.info(`clerk_id로 사용자 조회: ${clerk_id}`);
      const result = await serviceClient
        .from('users')
        .select('*')
        .eq('clerk_id', clerk_id)
        .single();
      
      existingUser = result.data;
      findError = result.error;
      
      logger.info('사용자 조회 결과', { 
        found: !!existingUser,
        error: findError ? {
          code: findError.code,
          message: findError.message,
          details: findError.details
        } : null
      });
    } catch (error) {
      logger.error('사용자 조회 중 예외 발생', error);
      // 예외를 findError로 할당
      findError = error;
    }

    // 오류 확인 (사용자가 없는 경우 제외)
    if (findError) {
      if (findError.code === 'PGRST116') {
        logger.info('새 사용자 생성 필요: 데이터베이스에 사용자가 없음');
      } else {
        logger.error('예상치 못한 사용자 조회 오류', {
          code: findError.code,
          message: findError.message,
          details: findError.details
        });
        throw findError;
      }
    }

    let userData;

    if (existingUser) {
      logger.info('기존 사용자 발견, 정보 업데이트 중...', { userId: existingUser.id });
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
          logger.error('사용자 업데이트 오류', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details
          });
          throw updateError;
        }

        logger.info('사용자 정보 업데이트 성공', { userId: updatedUser?.id });
        userData = updatedUser;
      } catch (updateError) {
        logger.error('사용자 업데이트 중 예외 발생', updateError);
        throw updateError;
      }
    } else {
      logger.info('새 사용자 생성 중...');
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
          logger.error('사용자 생성 오류', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          
          // 서비스 롤 권한이 제대로 사용되고 있는지 확인
          logger.info('서비스 롤 권한 테스트', {
            role: 'service_role',
            jwt: await serviceClient.auth.getSession()
          });
          
          throw insertError;
        }

        logger.info('새 사용자 생성 성공', { userId: newUser?.id });
        userData = newUser;
      } catch (insertError) {
        logger.error('사용자 생성 중 예외 발생', insertError);
        throw insertError;
      }
    }

    logger.info('사용자 동기화 완료', { userId: userData?.id });
    return userData;
  } catch (error) {
    logger.error('Supabase 사용자 동기화 오류', error);
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
    logger.info('인증된 Supabase 클라이언트 생성 시작');
    
    // Clerk에서 JWT 토큰 발급
    const authInstance = await auth();
    const token = await authInstance.getToken({ template: 'supabase' });
    
    if (!token) {
      logger.error('JWT 토큰 발급 실패');
      throw new Error('JWT 토큰을 발급받지 못했습니다.');
    }
    
    logger.info('JWT 토큰 발급 성공');
    
    // Supabase 클라이언트 생성 및 JWT 설정
    const client = createServerSupabaseClient();
    client.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    logger.info('인증된 Supabase 클라이언트 생성 완료');
    return client;
  } catch (error) {
    logger.error('인증된 Supabase 클라이언트 생성 오류', error);
    throw error;
  }
}