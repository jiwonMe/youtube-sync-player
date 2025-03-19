# apps/server/src/handlers 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 서버 이벤트 핸들러를 포함하고 있습니다.

## 주요 파일

- `chat.ts`: 채팅 관련 소켓 이벤트 핸들러
- `http.ts`: HTTP 요청 처리 핸들러
- `player.ts`: 플레이어 제어 관련 소켓 이벤트 핸들러
- `playlist.ts`: 재생목록 관련 소켓 이벤트 핸들러
- `room.ts`: 방 관련 소켓 이벤트 핸들러

## 주요 기능

### HTTP 핸들러 (http.ts)

다음과 같은 HTTP 엔드포인트를 제공합니다:

- `/health`: 서버 상태 확인
- `/rooms/by-name`: 방 이름으로 방 검색
- `/rooms/check-name`: 방 이름 중복 체크
- `/rooms`: 방 목록 조회 및 새 방 생성
- `/rooms/verify-password`: 방 비밀번호 확인

### 방 핸들러 (room.ts)

다음과 같은 소켓 이벤트를 처리합니다:

- 사용자 연결 관리 (입장, 퇴장)
- 방 설정 업데이트 (`room:update`)
- 방 정보 동기화
- 사용자 관리 (닉네임 변경, 방장 권한 변경)
- 비밀번호 보호 방 관리

### 플레이어 핸들러 (player.ts)

다음과 같은 플레이어 제어 관련 소켓 이벤트를 처리합니다:

- `player:stateChange`: 플레이어 상태 변경 (재생, 일시정지, 탐색)
- `player:play`: 재생 명령
- `player:pause`: 일시정지 명령
- `player:sync`: 플레이어 동기화 요청
- `player:requestSync`: 동기화 요청 전송
- `player:syncTo`: 특정 시간으로 동기화
- `autoplay:toggle`: 자동 재생 설정 변경
- `video:controlPermission`: 비디오 제어 권한 설정

### 재생목록 핸들러 (playlist.ts)

다음과 같은 재생목록 관련 소켓 이벤트를 처리합니다:

- `playlist:update`: 재생목록 업데이트
- `playlist:add`: 동영상 추가
- `playlist:remove`: 동영상 제거
- `video:change`: 재생 중인 비디오 변경

### 채팅 핸들러 (chat.ts)

다음과 같은 채팅 관련 소켓 이벤트를 처리합니다:

- `chat:message`: 채팅 메시지 전송 및 브로드캐스트
- 메시지 히스토리 관리
- 시스템 메시지 처리
