# apps/web/utils 디렉토리

이 디렉토리는 애플리케이션에서 사용되는 유틸리티 함수들을 포함하고 있습니다. 이 함수들은 특정 도메인에 특화된 헬퍼 함수들로, lib 디렉토리의 범용 유틸리티와는 구분됩니다.

## 주요 파일

- `room-utils.ts`: 방 관련 유틸리티 함수

## 주요 파일 설명

### room-utils.ts

이 파일은 YouTube 동영상 공유 방과 관련된 유틸리티 함수들을 포함하고 있습니다.

주요 기능:
- YouTube 비디오 URL 파싱 및 ID 추출
- 방 이름 생성 및 검증
- 비디오 시간 포맷팅
- 플레이리스트 관리 헬퍼 함수
- 사용자 권한 확인
- 방 상태 관련 헬퍼 함수

예시 함수:
```typescript
// YouTube 비디오 ID 추출
export function extractVideoId(url: string): string | null {
  // YouTube URL에서 비디오 ID를 추출하는 로직
}

// 시간 포맷팅 (초 -> MM:SS 형식)
export function formatTime(seconds: number): string {
  // 초를 MM:SS 형식으로 변환하는 로직
}

// 사용자가 호스트인지 확인
export function isUserHost(userId: string, roomState: RoomState): boolean {
  // 사용자가 방의 호스트인지 확인하는 로직
}
```

## utils와 lib의 차이점

- **utils**: 특정 도메인이나 기능에 특화된 유틸리티 함수 (예: 방 관련, 비디오 관련)
- **lib**: 애플리케이션 전반에서 사용되는 범용 유틸리티 함수 (예: 문자열 조작, 날짜 포맷팅)

## 유틸리티 설계 원칙

- **순수 함수**: 부작용 없이 입력에 따라 출력만 반환하는 순수 함수 지향
- **단일 책임**: 각 함수는 하나의 명확한 책임만 가짐
- **테스트 용이성**: 단위 테스트가 용이한 구조로 설계
- **재사용성**: 필요한 곳에서 쉽게 재사용할 수 있도록 모듈화
- **타입 안전성**: TypeScript를 활용한 타입 안전한 인터페이스 제공

## 사용 방법

이 디렉토리의 유틸리티 함수들은 애플리케이션 전체에서 import하여 사용할 수 있습니다:

```tsx
import { extractVideoId, formatTime } from "@/utils/room-utils";

// 사용 예시
const videoId = extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
const formattedTime = formatTime(125); // "2:05"
```

## 유틸리티 확장 가이드라인

새로운 유틸리티 함수를 추가할 때는 다음 가이드라인을 따르는 것이 좋습니다:

1. 관련 기능별로 파일 분리 (예: `video-utils.ts`, `auth-utils.ts` 등)
2. 명확한 이름과 주석으로 함수의 목적 설명
3. 입력 및 출력 타입을 명확히 정의
4. 에러 처리 및 예외 상황 고려
5. 필요한 경우 단위 테스트 작성
