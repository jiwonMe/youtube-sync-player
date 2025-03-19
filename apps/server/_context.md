# apps/server 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 Socket.io 서버를 포함하고 있습니다.

## 주요 파일 및 디렉토리

- `Dockerfile`: 서버 컨테이너화를 위한 Docker 설정
- `package.json`: 서버 의존성 및 스크립트 정의
- `README.md`: 서버 설명 및 가이드
- `index.ts`: 서버 시작점
- `tsconfig.json`: TypeScript 컴파일러 설정
- `supabase.ts`: Supabase 클라이언트 설정
- `migrations/`: 데이터베이스 마이그레이션 스크립트
- `src/`: 소스 코드 디렉토리
  - `server.ts`: 메인 서버 설정 및 Socket.io 이벤트 라우팅
  - `types/`: 타입 정의
  - `utils/`: 유틸리티 함수
  - `services/`: 서비스 레이어 (저장소, 데이터 관리)
  - `handlers/`: 이벤트 핸들러 (HTTP, 소켓 이벤트)

## 주요 기능

### 모듈화된 구조

서버는 다음과 같은 모듈화된 구조로 리팩토링되었습니다:

- `types/`: 타입 정의 (RoomState, PlayerState, EventLog 등)
- `utils/`: 공통 유틸리티 함수 (닉네임 생성, ID 생성 등)
- `services/`: 데이터 관리 서비스 (roomStore 등)
- `handlers/`: HTTP 및 소켓 이벤트 핸들러
  - `http.ts`: HTTP 요청 핸들러
  - `room.ts`: 방 관련 소켓 이벤트 핸들러
  - `player.ts`: 플레이어 제어 관련 소켓 이벤트 핸들러
  - `playlist.ts`: 재생목록 관련 소켓 이벤트 핸들러
  - `chat.ts`: 채팅 관련 소켓 이벤트 핸들러

### RoomStore 서비스

`services/roomStore.ts`는 다음 기능을 제공합니다:

- 방 데이터의 CRUD 관리
- 방 이름 기반 검색 및 중복 체크
- 사용자 관리 (추가, 제거)
- 이벤트 로그 관리
- 비밀번호 확인

### HTTP 엔드포인트

- `/health`: 서버 상태 확인
- `/rooms/by-name`: 방 이름으로 방 검색
- `/rooms/check-name`: 방 이름 중복 체크
- `/rooms`: 방 목록 조회 및 새 방 생성
- `/rooms/verify-password`: 방 비밀번호 확인

### Socket.io 이벤트

- `connection`: 사용자 연결
- `player:stateChange`, `player:play`, `player:pause`: 플레이어 제어 관련 이벤트
- `player:sync`, `player:requestSync`, `player:syncTo`: 동기화 관련 이벤트
- `video:change`: 비디오 변경
- `playlist:update`, `playlist:add`, `playlist:remove`: 재생목록 관리 이벤트
- `chat:message`: 채팅 메시지 전송
- `room:update`: 방 설정 업데이트
- `disconnect`: 사용자 연결 해제
- `autoplay:toggle`: 자동 재생 설정 변경
- `video:controlPermission`: 비디오 제어 권한 설정

### Supabase 설정

`supabase.ts` 파일은 Supabase 클라이언트를 초기화하고 구성합니다. 이 서버는 서비스 롤 키를 사용하여 
Supabase 데이터베이스에 접근하므로 높은 권한을 가집니다.

### 데이터베이스 마이그레이션

`migrations/` 디렉토리는 다음 마이그레이션 파일을 포함합니다:

- `01_init_schema.sql`: 초기 테이블 구조 정의
- `02_rls_policies.sql`: Row Level Security 정책 설정
- `03_stored_procedures.sql`: 저장 프로시저 정의
