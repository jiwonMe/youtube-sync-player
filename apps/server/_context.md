# apps/server 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 Socket.io 서버를 포함하고 있습니다.

## 주요 파일

- `Dockerfile`: 서버 컨테이너화를 위한 Docker 설정
- `package.json`: 서버 의존성 및 스크립트 정의
- `README.md`: 서버 설명 및 가이드
- `socket-server.ts`: 메인 Socket.io 서버 구현
- `supabase.ts`: Supabase 클라이언트 설정
- `migrations/`: 데이터베이스 마이그레이션 스크립트
- `tsconfig.json`: TypeScript 컴파일러 설정

## 주요 기능

### socket-server.ts

이 파일은 Socket.io 서버의 핵심 구현을 포함하고 있으며 다음과 같은 기능을 제공합니다:

- 실시간 방 관리 (생성, 조회, 비밀번호 보호)
- 사용자 연결 및 관리 (입장, 퇴장, 호스트 권한)
- 비디오 재생 동기화 (재생, 일시정지, 시간 동기화)
- 플레이리스트 관리 (추가, 제거, 업데이트)
- 실시간 채팅
- 자동 재생 설정

### 주요 데이터 구조

- `RoomState`: 방의 현재 상태를 나타내는 객체
- `RoomUser`: 방에 참여한 사용자 정보
- `VideoItem`: 비디오 항목 정보
- `ChatMessage`: 채팅 메시지 정보

### HTTP 엔드포인트

- `/health`: 서버 상태 확인
- `/rooms/by-name`: 방 이름으로 방 검색
- `/rooms/check-name`: 방 이름 중복 체크
- `/rooms`: 새 방 생성
- `/rooms/verify-password`: 방 비밀번호 확인

### Socket.io 이벤트

- `connection`: 사용자 연결
- `room:state`: 방 상태 전송
- `user:joined`: 사용자 입장 알림
- `player:stateChange`: 플레이어 상태 변경
- `autoplay:toggle`: 자동 재생 설정 변경
- `video:change`: 비디오 변경
- `playlist:update`: 플레이리스트 업데이트
- `playlist:add`: 플레이리스트에 비디오 추가
- `playlist:remove`: 플레이리스트에서 비디오 제거
- `chat:message`: 채팅 메시지 전송
- `room:update`: 방 설정 업데이트
- `disconnect`: 사용자 연결 해제

### Supabase 설정

`supabase.ts` 파일은 Supabase 클라이언트를 초기화하고 구성합니다. 이 서버는 서비스 롤 키를 사용하여 
Supabase 데이터베이스에 접근하므로 높은 권한을 가집니다.

### 데이터베이스 마이그레이션

`migrations/` 디렉토리는 다음 마이그레이션 파일을 포함합니다:

- `01_init_schema.sql`: 초기 테이블 구조 정의
- `02_rls_policies.sql`: Row Level Security 정책 설정
- `03_stored_procedures.sql`: 저장 프로시저 정의
