# apps/web/app 디렉토리

이 디렉토리는 Next.js App Router를 사용한 페이지 및 레이아웃을 포함하고 있습니다.

## 주요 파일

- `globals.css`: 전역 CSS 스타일
- `layout.tsx`: 루트 레이아웃 컴포넌트
- `page.tsx`: 홈페이지 컴포넌트

## 주요 하위 디렉토리

- `[locale]/`: 다국어 지원을 위한 로케일 라우팅
- `api/`: API 라우트
  - `rooms/`: 방 관련 API
  - `youtube/`: YouTube API 관련 엔드포인트
    - `token/`: YouTube API 토큰 관련 엔드포인트
- `auth/`: 인증 관련 페이지
  - `signin/`: 로그인 페이지
- `create-room/`: 방 생성 페이지
- `join-room/`: 방 참여 페이지
- `privacy-policy/`: 개인정보 처리방침 페이지
- `profile/`: 사용자 프로필 페이지
- `room/`: 방 관련 페이지
  - `[roomId]/`: 특정 방 페이지 (동적 라우팅)
- `sign-in/`: 로그인 페이지 (Clerk 인증)
- `sign-up/`: 회원가입 페이지 (Clerk 인증)
- `wave-test/`: 웨이브 애니메이션 테스트 페이지

## 주요 기능

### 페이지 구조

- 홈페이지: 애플리케이션 소개 및 시작하기
- 방 생성 페이지: 새로운 시청 방 생성
- 방 참여 페이지: 기존 방에 참여
- 방 페이지: 실제 비디오 시청 및 상호작용이 이루어지는 메인 페이지
- 인증 페이지: 로그인 및 회원가입
- 프로필 페이지: 사용자 정보 관리

### API 라우트

- `/api/rooms`: 방 생성 및 관리 API
- `/api/youtube/token`: YouTube API 토큰 관리

### 라우팅 특징

- 동적 라우팅: `[roomId]`를 사용하여 각 방에 고유 URL 제공
- 다국어 지원: `[locale]` 파라미터를 통한 다국어 라우팅
- 중첩 레이아웃: 각 섹션별 레이아웃 구성
