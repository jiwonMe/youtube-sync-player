# YouTube Sync Player - Socket.io Server

이 서버는 YouTube 동영상 동기화 플레이어 애플리케이션의 실시간 통신을 담당합니다. 사용자 간 비디오 동기화, 채팅, 방 관리 등의 기능을 제공합니다.

## 주요 기능

- 실시간 영상 동기화 (재생, 일시정지, 시크)
- 방 생성 및 관리 (비밀번호 보호, 호스트 권한)
- 실시간 채팅
- 재생목록 관리
- 자동 재생 설정
- 이벤트 로그 기록

## 설치 및 실행

### 설치

```bash
# 의존성 설치
npm install

# 또는
yarn install
```

### 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정합니다:

```bash
cp .env.example .env
```

### 개발 모드 실행

```bash
# 개발 서버 실행
npm run dev

# 자동 재시작 (파일 변경 감지)
npm run dev:watch
```

### 빌드 및 프로덕션 실행

```bash
# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 프로젝트 구조

```
apps/server/
├── src/               # 소스 코드
│   ├── config/        # 설정
│   ├── handlers/      # 이벤트 핸들러
│   │   ├── chat.ts    # 채팅 핸들러
│   │   ├── http.ts    # HTTP 요청 핸들러
│   │   ├── player.ts  # 플레이어 제어 핸들러
│   │   ├── playlist.ts # 재생목록 핸들러
│   │   └── room.ts    # 방 관리 핸들러
│   ├── services/      # 서비스 레이어
│   │   └── roomStore.ts # 방 데이터 저장소
│   ├── types/         # 타입 정의
│   ├── utils/         # 유틸리티 함수
│   └── server.ts      # 메인 서버 파일
├── index.ts           # 진입점
├── .env.example       # 환경 변수 예제
├── package.json       # 의존성 및 스크립트
└── tsconfig.json      # TypeScript 설정
```

## API 엔드포인트

### HTTP 엔드포인트

- `GET /health`: 서버 상태 확인
- `GET /rooms`: 방 목록 조회
- `GET /rooms/by-name?name={roomName}`: 방 이름으로 방 검색
- `GET /rooms/check-name?name={roomName}`: 방 이름 중복 체크
- `POST /rooms`: 새 방 생성
- `POST /rooms/verify-password`: 방 비밀번호 확인

### Socket.io 이벤트

#### 연결 및 방 관리
- `connection`: 사용자 연결
- `room:state`: 방 상태 전송
- `room:update`: 방 설정 업데이트
- `room:hostChange`: 호스트 변경
- `disconnect`: 연결 종료

#### 비디오 제어
- `player:stateChange`: 플레이어 상태 변경
- `player:play`: 비디오 재생
- `player:pause`: 비디오 일시정지
- `player:seek`: 비디오 시크
- `player:sync`: 동기화 상태 전송
- `player:requestSync`: 동기화 요청
- `player:syncTo`: 특정 사용자에게 동기화

#### 재생목록
- `video:change`: 비디오 변경
- `playlist:update`: 재생목록 업데이트
- `playlist:add`: 재생목록 비디오 추가
- `playlist:remove`: 재생목록 비디오 제거

#### 사용자
- `user:joined`: 사용자 입장
- `user:left`: 사용자 퇴장
- `host:changed`: 호스트 변경

#### 기타
- `chat:message`: 채팅 메시지
- `autoplay:toggle`: 자동 재생 설정
- `video:controlPermission`: 비디오 제어 권한 설정

## 환경 변수

| 변수명 | 설명 | 기본값 |
|-----|-----|-----|
| `NODE_ENV` | 환경 설정 (development, production) | development |
| `PORT` | 서버 포트 | 3003 |
| `LOG_LEVEL` | 로그 레벨 (debug, info, warn, error) | info |
| `CORS_ORIGIN` | CORS 설정 | * |
| `ROOM_CLEANUP_TIMEOUT` | 비활성 방 제거 타임아웃(ms) | 60000 |
| `MAX_MESSAGE_HISTORY` | 최대 메시지 저장 개수 | 200 |
| `MAX_EVENT_LOGS` | 최대 이벤트 로그 저장 개수 | 100 |

