# YouTube Player

YouTube 동영상을 함께 시청할 수 있는 실시간 공유 플레이어 애플리케이션입니다.

## 프로젝트 구조

이 프로젝트는 Turborepo를 사용하여 모노레포로 구성되어 있습니다.

```
youtube-player/
├── apps/
│   ├── web/         # Next.js 웹 애플리케이션
│   └── server/      # Socket.io 서버
├── packages/
│   ├── shared/      # 공유 타입 및 유틸리티
│   └── ui/          # 공유 UI 컴포넌트 (향후 확장)
└── turbo.json       # Turborepo 설정
```

## 시작하기

### 개발 환경 설정

1. 저장소 클론:

```bash
git clone <repository-url>
cd youtube-player
```

2. 의존성 설치:

```bash
pnpm install
```

3. 개발 서버 실행:

```bash
pnpm dev
```

이 명령은 웹 애플리케이션(http://localhost:3000)과 소켓 서버(http://localhost:3001)를 동시에 실행합니다.

### 빌드 및 배포

프로덕션 빌드:

```bash
pnpm build
```

프로덕션 서버 실행:

```bash
pnpm start
```

## 기술 스택

- **프론트엔드**: Next.js, React, Tailwind CSS, shadcn/ui
- **백엔드**: Node.js, Socket.io
- **개발 도구**: TypeScript, Turborepo, pnpm

## Features

- Synchronized YouTube video playback
- Shared playlists
- Real-time chat
- User presence
- Google authentication for YouTube playlists

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- A Google OAuth client ID and secret for authentication

### Setup

1. Clone the repository
2. Install dependencies:

