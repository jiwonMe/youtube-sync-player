# apps/web/types 디렉토리

이 디렉토리는 애플리케이션에서 사용되는 TypeScript 타입 정의를 포함하고 있습니다.

## 주요 파일

- `room.ts`: 방 관련 타입 정의

## 주요 타입 설명

### room.ts

이 파일은 YouTube 동영상 공유 방과 관련된 타입 정의를 포함하고 있습니다.

#### RoomUser

방에 참여한 사용자 정보를 나타내는 타입입니다.

```typescript
export type RoomUser = {
  id: string
  name: string
  image?: string
  isHost?: boolean
}
```

#### ChatMessage

채팅 메시지 정보를 나타내는 타입입니다.

```typescript
export type ChatMessage = {
  id: string
  user: RoomUser
  message: string
  timestamp: number
}
```

#### VideoItem

비디오 항목 정보를 나타내는 타입입니다.

```typescript
export type VideoItem = {
  id: string
  videoId: string
  title: string
  thumbnailUrl: string
}
```

#### RoomState

방의 현재 상태를 나타내는 타입입니다.

```typescript
export type RoomState = {
  roomName: string
  hostId: string
  users: RoomUser[]
  currentVideo: VideoItem | null
  playlist: VideoItem[]
  isPlaying: boolean
  currentTime: number
  messages: ChatMessage[]
  autoplay: boolean
}
```

## 타입 설계 원칙

- **명확성**: 각 타입은 명확한 목적과 의미를 가지도록 설계
- **재사용성**: 여러 컴포넌트와 모듈에서 재사용할 수 있는 공통 타입 정의
- **확장성**: 향후 기능 추가에 대비한 확장 가능한 타입 구조
- **타입 안전성**: 런타임 오류를 방지하기 위한 엄격한 타입 정의

## 사용 방법

이 디렉토리의 타입들은 애플리케이션 전체에서 import하여 사용할 수 있습니다:

```tsx
import { RoomState, VideoItem, ChatMessage } from "@/types/room";

// 사용 예시
const [roomState, setRoomState] = useState<RoomState>({
  roomName: "My Room",
  hostId: "user-123",
  users: [],
  currentVideo: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  messages: [],
  autoplay: true,
});
```

## 타입 확장 가이드라인

새로운 타입을 추가할 때는 다음 가이드라인을 따르는 것이 좋습니다:

1. 관련 기능별로 파일 분리 (예: `user.ts`, `auth.ts` 등)
2. 명확한 이름과 주석으로 타입의 목적 설명
3. 필요한 경우 유니온 타입, 제네릭, 유틸리티 타입 활용
4. 공통 타입은 재사용 가능하도록 설계
