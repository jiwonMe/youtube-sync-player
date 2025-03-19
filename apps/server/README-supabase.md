# Supabase 설정 가이드

이 프로젝트는 Supabase를 데이터베이스 및 백엔드 서비스로 사용합니다. 이 문서는 Supabase 프로젝트 설정 및 마이그레이션 적용 방법을 안내합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase 웹사이트](https://supabase.io)에 접속하여 회원가입 또는 로그인합니다.
2. 새 프로젝트를 생성합니다.
3. 프로젝트가 생성되면 아래 필요한 환경 변수를 얻을 수 있습니다:
   - `SUPABASE_URL`: API URL
   - `SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (주의: 이 키는 공개되어서는 안 됩니다)

## 2. 환경 변수 설정

### 웹 애플리케이션 (.env)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 서버 애플리케이션 (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. 데이터베이스 마이그레이션 적용

Supabase SQL 에디터에서 다음 마이그레이션 스크립트를 순서대로 실행합니다:

1. `apps/server/migrations/01_init_schema.sql`
2. `apps/server/migrations/02_rls_policies.sql`

또는 Supabase CLI를 사용하여 마이그레이션을 적용할 수 있습니다:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

## 4. Supabase와 Clerk 인증 통합

이 프로젝트는 Clerk을 인증 서비스로 사용하며, Supabase는 데이터 저장소로 사용합니다. 따라서:

1. Clerk으로 인증한 사용자 정보를 Supabase users 테이블에 동기화해야 합니다.
2. 사용자가 처음 로그인할 때 Supabase에 사용자 레코드를 생성합니다.
3. Supabase 요청 시 Clerk 사용자 ID를 참조하여 올바른 권한으로 데이터에 접근합니다.

## 5. RLS (Row Level Security) 정책

Supabase의 RLS 정책은 데이터 접근 권한을 관리합니다:

- 사용자는 자신의 데이터만 볼 수 있습니다.
- 방 참여자는 방과 관련된 데이터를 볼 수 있습니다.
- 방 호스트는 방 설정을 변경할 수 있습니다.
- 서비스 역할(백엔드 서버)은 모든 데이터에 접근할 수 있습니다.

## 6. 개발 도구

### Supabase Studio

Supabase 대시보드의 SQL 편집기를 사용하여 데이터베이스를 직접 조작할 수 있습니다.

### Supabase CLI

로컬 개발을 위해 Supabase CLI를 설치할 수 있습니다:

```bash
npm install -g supabase
```

### 타입 생성

Supabase 타입 생성을 통해 데이터베이스 스키마에 맞는 TypeScript 타입을 자동으로 생성할 수 있습니다:

```bash
supabase gen types typescript --project-id your-project-id > packages/shared/src/database.types.ts
```

## 데이터베이스 스키마

현재 구현된 테이블은 다음과 같습니다:

1. `users` - 사용자 정보
2. `rooms` - 방 정보
3. `room_users` - 방 참여자 관계
4. `videos` - 비디오 정보
5. `playlists` - 플레이리스트
6. `playlist_videos` - 플레이리스트-비디오 관계
7. `watch_history` - 시청 기록

## 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 관리자 권한을 가지므로 절대 공개되어서는 안 됩니다.
- 서버 측에서만 service role key를 사용하고, 클라이언트에서는 anon key만 사용해야 합니다.
- 실시간 동기화 작업(채팅, 이벤트 로그)은 일단 다루지 않습니다. 