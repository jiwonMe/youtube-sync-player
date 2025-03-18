# 프로젝트 루트 디렉토리

이 디렉토리는 YouTube 동영상을 함께 시청할 수 있는 실시간 공유 플레이어 애플리케이션의 루트 디렉토리입니다.

## Cline 규칙

**중요**: Cline은 파일에 접근하기 전에 항상 해당 폴더의 _context.md 파일을 먼저 읽어야 합니다. 이 규칙은 모든 디렉토리에 적용됩니다.

예를 들어:
- `apps/web/components/room/video-controls.tsx` 파일을 읽기 전에 `apps/web/components/room/_context.md` 파일을 먼저 읽어야 합니다.
- `apps/server/socket-server.ts` 파일을 읽기 전에 `apps/server/_context.md` 파일을 먼저 읽어야 합니다.

이 규칙은 Cline이 파일의 컨텍스트를 이해하고 더 정확한 도움을 제공하기 위한 것입니다.

## 주요 파일

- `.gitignore`: Git 버전 관리에서 제외할 파일 및 디렉토리 목록
- `.npmrc`: NPM 설정 파일
- `package.json`: 프로젝트 의존성 및 스크립트 정의
- `pnpm-workspace.yaml`: PNPM 워크스페이스 설정
- `railway.toml`: Railway 배포 설정
- `README.md`: 프로젝트 설명 및 시작 가이드
- `tailwind.config.ts`: Tailwind CSS 설정
- `turbo.json`: Turborepo 설정
- `vercel.json`: Vercel 배포 설정

## 디렉토리 구조

- `apps/`: 애플리케이션 코드
  - `server/`: Socket.io 서버
  - `web/`: Next.js 웹 애플리케이션
- `packages/`: 공유 패키지
  - `shared/`: 공유 타입 및 유틸리티

## 기술 스택

- **프론트엔드**: Next.js, React, Tailwind CSS, shadcn/ui
- **백엔드**: Node.js, Socket.io
- **개발 도구**: TypeScript, Turborepo, pnpm

## 주요 기능

- 동기화된 YouTube 비디오 재생
- 공유 플레이리스트
- 실시간 채팅
- 사용자 참여 상태 표시
- YouTube 플레이리스트를 위한 Google 인증
