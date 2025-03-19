-- 04_users_insert_policy.sql
-- users 테이블에 INSERT 권한을 추가하는 정책

-- 인증된 사용자는 자신의 사용자 정보를 추가할 수 있는 정책
DROP POLICY IF EXISTS "인증된 사용자는 사용자 정보를 추가할 수 있음" ON users;
CREATE POLICY "인증된 사용자는 사용자 정보를 추가할 수 있음"
ON users FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자는 자신의 계정을 생성할 수 있음을 설명하는 주석
COMMENT ON POLICY "인증된 사용자는 사용자 정보를 추가할 수 있음" ON users IS
'Allows authenticated users to create their own user account in the users table'; 