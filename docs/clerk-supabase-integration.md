# Clerk과 Supabase 연동 가이드

이 문서는 Clerk 인증과 Supabase를 연동하는 방법을 설명합니다.

## 설정 단계

### 1. Clerk JWT Template 설정

Clerk 대시보드에서 다음과 같이 JWT Template을 설정합니다:

1. Clerk 대시보드 접속
2. JWT Templates 메뉴 선택
3. 'supabase' 이름으로 새 템플릿 생성
4. 다음 클레임 추가:

```json
{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "clerk_user_id": "{{user.id}}",
  "exp": "{{exp}}"
}
```

### 2. Supabase JWT 검증 설정

Supabase JWT 검증을 위해 다음 환경 변수를 설정해야 합니다:

```
SUPABASE_JWT_SECRET=<Clerk JWT Secret>
```

Supabase의 JWT 설정:

```sql
-- Clerk에서 발급한 JWT를 Supabase에서 검증할 수 있도록 설정
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb 
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        CASE WHEN current_setting('request.jwt.claim.clerk_user_id', true) IS NULL THEN 
            '{}'::jsonb
        ELSE 
            json_build_object(
                'role', current_setting('request.jwt.claim.role', true),
                'sub', current_setting('request.jwt.claim.sub', true),
                'aud', current_setting('request.jwt.claim.aud', true),
                'clerk_user_id', current_setting('request.jwt.claim.clerk_user_id', true)
            )::jsonb
        END
$$;

-- auth.uid() 함수를 재정의하여 Clerk user ID를 반환
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claim.clerk_user_id', true),
        current_setting('request.jwt.claim.sub', true)
    )
$$;
```

### 3. 클라이언트에서 사용 방법

```typescript
// Clerk에서 JWT 토큰을 가져와 Supabase 클라이언트에 설정하는 예제
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export async function getAuthenticatedSupabaseClient() {
  const { getToken } = auth();
  
  // Clerk에서 JWT 토큰 발급
  const token = await getToken({ template: 'supabase' });
  
  if (!token) {
    throw new Error('Failed to get JWT token');
  }
  
  // Supabase 클라이언트 생성 및 JWT 설정
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
  
  return supabase;
}
```

### 4. 서버 컴포넌트와 API 라우트에서 사용 방법

```typescript
// API 라우트에서 인증된 Supabase 클라이언트 사용 예제
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // 인증된 Supabase 클라이언트 생성
    const supabase = await getAuthenticatedSupabaseClient();
    
    // 이제 RLS 정책이 적용된 쿼리 실행 가능
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    // ...
  } catch (error) {
    // ...
  }
}
```

## 주의사항

1. Clerk JWT Secret을 안전하게 관리해야 합니다.
2. JWT 템플릿의 만료 시간을 적절히 설정해야 합니다.
3. RLS 정책을 주기적으로 점검하여 보안 허점이 없는지 확인해야 합니다. 