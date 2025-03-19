# apps/server/src/services 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 서비스 레이어를 포함하고 있습니다.

## 주요 파일

- `roomStore.ts`: 메모리 기반 방 관리 서비스 (레거시)
- `roomSupabaseStore.ts`: Supabase 기반 방 관리 서비스 (현재 사용)

## 주요 기능

### RoomStore 서비스 (roomStore.ts)

`roomStore.ts`는 다음 기능을 제공하는 메모리 기반 방 관리 서비스입니다:

- 방 생성, 수정, 삭제 관리
- 사용자 관리
- 비밀번호 보호 방 지원
- 플레이리스트 관리
- 메시지 히스토리

> **주의**: 이 모듈은 2024년 3월 19일부터 `roomSupabaseStore.ts`로 대체되었습니다. 더 이상 production 환경에서 사용되지 않으며, 모든 코드는 Supabase 기반 서비스를 사용합니다.

### RoomSupabaseStore 서비스 (roomSupabaseStore.ts)

`roomSupabaseStore.ts`는 다음 기능을 제공하는 Supabase 기반 방 관리 서비스입니다:

- Supabase 데이터베이스와 연동된 방 생성, 수정, 삭제
- 사용자 관리 및 영구 저장
- 비밀번호 보호 방 지원
- 플레이리스트 관리 및 지속성
- 메시지 히스토리
- 이벤트 로깅

이 스토어는 기존 메모리 기반 roomStore를 대체하여 모든 환경에서 사용됩니다.
