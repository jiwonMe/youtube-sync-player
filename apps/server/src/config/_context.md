# apps/server/src/config 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 서버 설정을 포함하고 있습니다.

## 주요 파일

- `index.ts`: 서버의 주요 설정값과 환경 변수를 관리합니다.

## 주요 기능

### 환경 변수 관리

`index.ts` 파일은 다음과 같은 서버 설정을 제공합니다:

- 서버 환경 설정 (development, production, test)
- 서버 포트 설정
- CORS 설정
- 로그 레벨 설정
- 룸 정리 타임아웃 설정
- 메시지 히스토리 및 이벤트 로그 최대 개수 설정

### 설정 인터페이스

- `ServerConfig`: 서버 설정에 대한 타입 정의를 제공합니다.
- `NodeEnv`: 서버 환경 타입을 정의합니다.

### 주요 설정 기본값

- `port`: 3003 (기본값)
- `corsOrigin`: '*' (기본값)
- `logLevel`: 'info' (기본값)
- `roomCleanupTimeout`: 60000ms (기본값)
- `maxMessageHistory`: 200 (기본값)
- `maxEventLogs`: 100 (기본값)
