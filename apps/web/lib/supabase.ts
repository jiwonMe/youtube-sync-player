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