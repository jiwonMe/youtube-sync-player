# apps/web 디렉토리

이 디렉토리는 YouTube 동영상 공유 플레이어 애플리케이션의 Next.js 웹 프론트엔드를 포함하고 있습니다.

## 주요 파일

- `components.json`: UI 컴포넌트 설정
- `middleware.ts`: Next.js 미들웨어
- `next.config.mjs`: Next.js 설정
- `package.json`: 의존성 및 스크립트 정의
- `postcss.config.mjs`: PostCSS 설정
- `tailwind.config.ts`: Tailwind CSS 설정
- `tsconfig.json`: TypeScript 컴파일러 설정

## 디렉토리 구조

- `app/`: Next.js App Router 페이지 및 레이아웃
- `components/`: React 컴포넌트
  - `home/`: 홈페이지 관련 컴포넌트
  - `room/`: 방 관련 컴포넌트
  - `ui/`: 재사용 가능한 UI 컴포넌트
- `hooks/`: React 커스텀 훅
- `lib/`: 유틸리티 함수 및 라이브러리
- `messages/`: 다국어 지원 메시지
- `public/`: 정적 파일
- `services/`: 서비스 로직 (소켓, API 등)
- `styles/`: 글로벌 스타일
- `types/`: TypeScript 타입 정의
- `utils/`: 유틸리티 함수

## 주요 기능

- Next.js App Router를 사용한 페이지 라우팅
- 실시간 소켓 통신을 통한 YouTube 비디오 동기화
- 방 생성 및 참여
- 플레이리스트 관리
- 실시간 채팅
- 사용자 관리
- 반응형 UI
- 다국어 지원

## 기술 스택

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.io-client
- Supabase (데이터베이스 및 스토리지)
- Clerk (인증)

## Supabase 관련 파일

- `lib/supabase.ts`: Supabase 클라이언트 초기화
- `lib/supabase-auth.ts`: Clerk과 Supabase 인증 통합
- `lib/db.ts`: Supabase 데이터베이스 조회 함수
