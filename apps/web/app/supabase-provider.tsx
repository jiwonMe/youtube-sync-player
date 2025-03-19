'use client';

import { useSupabaseSync } from "@/hooks/use-supabase-sync";

/**
 * Supabase 통합을 위한 프로바이더 컴포넌트
 * 
 * 이 컴포넌트는 사용자가 로그인할 때 Supabase와 Clerk 사용자 정보를 동기화합니다.
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Supabase 동기화 훅 호출
  useSupabaseSync();
  
  // 어떤 UI도 렌더링하지 않고 자식 컴포넌트만 반환
  return <>{children}</>;
} 