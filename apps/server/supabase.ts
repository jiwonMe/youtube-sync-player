import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase 클라이언트 인스턴스
 * 서버에서는 service_role 키를 사용하여 관리자 권한으로 Supabase에 접근합니다.
 * 주의: service_role 키는 절대 클라이언트에 노출되어서는 안 됩니다.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 