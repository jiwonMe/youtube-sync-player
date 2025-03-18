# apps/web/components 디렉토리

이 디렉토리는 애플리케이션의 React 컴포넌트들을 포함하고 있습니다.

## 주요 파일

- `footer.tsx`: 푸터 컴포넌트
- `navbar.tsx`: 네비게이션 바 컴포넌트
- `playlist-selector.tsx`: 플레이리스트 선택 컴포넌트
- `room-client.tsx`: 방 클라이언트 컴포넌트 (방 페이지의 주요 로직)
- `theme-provider.tsx`: 테마 제공자 컴포넌트
- `youtube-player.tsx`: YouTube 플레이어 컴포넌트

## 주요 하위 디렉토리

- `home/`: 홈페이지 관련 컴포넌트
- `room/`: 방 관련 컴포넌트
- `ui/`: 재사용 가능한 UI 컴포넌트

## 주요 컴포넌트 설명

### room-client.tsx

방 페이지의 핵심 컴포넌트로, 소켓 연결 관리, 비디오 재생 동기화, 사용자 상호작용 처리 등 방의 전반적인 기능을 구현합니다.

### youtube-player.tsx

YouTube IFrame API를 사용하여 비디오 재생을 관리하는 컴포넌트입니다. 비디오 로드, 재생/일시정지, 시간 동기화 등의 기능을 제공합니다.

### playlist-selector.tsx

사용자의 YouTube 플레이리스트를 선택하고 방에 추가할 수 있는 컴포넌트입니다.

### navbar.tsx

애플리케이션의 상단 네비게이션 바로, 로고, 메뉴, 사용자 정보 등을 표시합니다.

### footer.tsx

애플리케이션의 하단 푸터로, 저작권 정보, 링크 등을 포함합니다.

### theme-provider.tsx

애플리케이션의 테마(다크 모드/라이트 모드)를 관리하는 컴포넌트입니다.
