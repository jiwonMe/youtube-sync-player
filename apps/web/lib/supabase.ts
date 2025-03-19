import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase 클라이언트 인스턴스
 * 앱 전체에서 재사용할 수 있는 Supabase 클라이언트입니다.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 서버 측 Supabase 클라이언트를 생성하는 함수
 * 서버 컴포넌트나 API 라우트에서 호출할 때 사용합니다.
 * @returns Supabase 클라이언트 인스턴스
 */
export const createServerSupabaseClient = () => {
  // 서버 환경에서는 환경 변수를 직접 사용하여 새 클라이언트 생성
  // 이렇게 하면 항상 최신 토큰이 사용됩니다
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
};

/**
 * 서비스 롤(관리자) 권한을 가진 Supabase 클라이언트를 생성하는 함수
 * RLS 정책을 우회하고 모든 테이블에 접근할 수 있는 클라이언트입니다.
 * 주의: 사용자 정보 동기화와 같은 특별한 작업에만 사용해야 합니다.
 * @returns 서비스 롤 권한의 Supabase 클라이언트 인스턴스
 */
export const createServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    throw new Error('서비스 롤 키가 설정되지 않았습니다. 환경 변수를 확인하세요.');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey
  );
}; 