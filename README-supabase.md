# Supabase 설정 및 사용 가이드

이 문서는 YouTube 동영상 공유 플레이어 애플리케이션에서 Supabase를 설정하고 사용하는 방법을 안내합니다.

## 설정 방법

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 생성 후 API 키와 URL을 확인합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key (클라이언트용)
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (서버용, 절대 공개하지 마세요)

3. 환경 변수 설정:
   - `apps/web/.env`: 클라이언트용 환경 변수
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   - `apps/server/.env`: 서버용 환경 변수
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. 데이터베이스 스키마 마이그레이션:
   - Supabase 대시보드의 SQL 편집기에서 다음 마이그레이션 파일을 실행:
     - `apps/server/migrations/01_init_schema.sql`
     - `apps/server/migrations/02_rls_policies.sql`
     - `apps/server/migrations/03_stored_procedures.sql`

## 저장 프로시저 사용

이 프로젝트는 복잡한 쿼리를 처리하기 위해 PostgreSQL 저장 프로시저를 사용합니다. 이는 다음과 같은 장점이 있습니다:

1. **타입 안전성**: TypeScript 타입 시스템과 Supabase PostgrestBuilder 사이의 타입 불일치 문제 해결
2. **성능 최적화**: 서버 측에서 쿼리를 처리하여 네트워크 오버헤드 감소
3. **코드 단순화**: 복잡한 쿼리 로직을 DB에 캡슐화

### 주요 저장 프로시저

1. **get_active_rooms(limit_val, offset_val)**: 활성화된 방 목록을 조회
2. **get_user_playlists(user_id_val)**: 사용자의 플레이리스트 목록을 조회
3. **get_room_playlists(room_id_val)**: 방의 플레이리스트 목록을 조회
4. **get_user_recent_rooms(user_id_val, limit_val)**: 사용자가 최근에 참여한 방 목록을 조회

### 사용 예시

```typescript
// 활성화된 방 목록 조회
const { data, error } = await supabase.rpc('get_active_rooms', {
  limit_val: 10,
  offset_val: 0
});

// 사용자의 플레이리스트 목록 조회
const { data, error } = await supabase.rpc('get_user_playlists', {
  user_id_val: userId
});
```

## 구현된 기능

1. **사용자 관리**:
   - Clerk과의 통합을 통한 사용자 인증
   - Supabase에 사용자 데이터 저장 및 동기화

2. **방 관리**:
   - 방 생성, 조회, 업데이트, 삭제
   - 방 참가자 관리
   - 비밀번호 보호 방

3. **미디어 관리**:
   - 비디오 정보 저장
   - 플레이리스트 관리
   - 시청 기록 추적

## 테이블 구조

1. **users**: 사용자 정보
   - `id`: UUID (기본 키)
   - `clerk_id`: Clerk 사용자 ID
   - `username`: 사용자 이름
   - `avatar_url`: 프로필 이미지 URL
   - `created_at`: 생성 시간
   - `updated_at`: 업데이트 시간
   - `last_seen_at`: 마지막 활동 시간
   - `settings`: 사용자 설정 (JSON)

2. **rooms**: 방 정보
   - `id`: UUID (기본 키)
   - `name`: 방 이름
   - `description`: 방 설명
   - `host_id`: 방장 ID (users 참조)
   - `password`: 비밀번호 (암호화)
   - `created_at`: 생성 시간
   - `updated_at`: 업데이트 시간
   - `is_active`: 활성 상태
   - `video_control_permission`: 비디오 제어 권한

3. **room_users**: 방-사용자 관계
   - `id`: UUID (기본 키)
   - `room_id`: 방 ID (rooms 참조)
   - `user_id`: 사용자 ID (users 참조)
   - `joined_at`: 입장 시간
   - `left_at`: 퇴장 시간
   - `is_host`: 방장 여부

4. **videos**: 비디오 정보
   - `id`: UUID (기본 키)
   - `youtube_id`: YouTube 비디오 ID
   - `title`: 비디오 제목
   - `thumbnail_url`: 썸네일 URL
   - `added_by`: 추가한 사용자 (users 참조)
   - `created_at`: 생성 시간
   - `updated_at`: 업데이트 시간

5. **playlists**: 플레이리스트
   - `id`: UUID (기본 키)
   - `room_id`: 방 ID (rooms 참조, NULL 가능)
   - `user_id`: 사용자 ID (users 참조, NULL 가능)
   - `name`: 플레이리스트 이름
   - `created_at`: 생성 시간
   - `updated_at`: 업데이트 시간

6. **playlist_videos**: 플레이리스트-비디오 관계
   - `id`: UUID (기본 키)
   - `playlist_id`: 플레이리스트 ID (playlists 참조)
   - `video_id`: 비디오 ID (videos 참조)
   - `position`: 순서
   - `added_at`: 추가 시간

7. **watch_history**: 시청 기록
   - `id`: UUID (기본 키)
   - `user_id`: 사용자 ID (users 참조)
   - `video_id`: 비디오 ID (videos 참조)
   - `room_id`: 방 ID (rooms 참조, NULL 가능)
   - `watched_at`: 시청 시간
   - `watch_duration`: 시청 시간 (초)

## 추가 구현 계획

- 채팅 기록 저장 (현재는 메모리에 일시적으로만 저장)
- 사용량 통계 및 분석
- 환경에 따른 로컬 캐싱 전략

## 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 모든 권한을 가지므로 절대 클라이언트에 노출하지 마세요.
- 서버에서만 서비스 키를 사용하고, 클라이언트에서는 익명 키만 사용합니다.
- 개발 환경과 프로덕션 환경에 별도의 Supabase 프로젝트를 사용하는 것이 좋습니다. 