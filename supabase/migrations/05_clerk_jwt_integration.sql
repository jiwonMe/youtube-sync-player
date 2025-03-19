-- 05_clerk_jwt_integration.sql
-- Clerk JWT와 Supabase 연동을 위한 함수 정의

-- Clerk에서 발급한 JWT를 Supabase에서 검증할 수 있도록 설정
DROP FUNCTION IF EXISTS auth.jwt();
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
DROP FUNCTION IF EXISTS auth.uid();
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claim.clerk_user_id', true),
        current_setting('request.jwt.claim.sub', true)
    )
$$;

-- Clerk ID로 사용자 조회 함수
-- 인증된 Clerk 사용자의 Supabase 사용자 ID를 조회하는 함수
DROP FUNCTION IF EXISTS get_user_id_by_clerk_id();
CREATE OR REPLACE FUNCTION get_user_id_by_clerk_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
    SELECT id FROM users WHERE clerk_id = auth.uid()
$$;

-- 현재 요청의 인증 여부를 확인하는 함수
DROP FUNCTION IF EXISTS is_authenticated();
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT current_setting('request.jwt.claim.clerk_user_id', true) IS NOT NULL
$$; 