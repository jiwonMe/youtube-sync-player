# apps/web/services 디렉토리

이 디렉토리는 애플리케이션의 외부 서비스 통신 및 API 클라이언트를 포함하고 있습니다.

## 주요 파일

- `mock-socket-service.ts`: 소켓 서비스의 목(mock) 구현
- `socket-service.ts`: Socket.io 클라이언트 서비스
- `youtube-service.ts`: YouTube API 클라이언트 서비스

## 주요 서비스 설명

### socket-service.ts

이 파일은 Socket.io 클라이언트를 사용하여 실시간 통신을 구현합니다. 방 참여, 비디오 동기화, 채팅 등의 실시간 기능을 위한 소켓 연결 및 이벤트 처리를 담당합니다.

주요 기능:
- 소켓 연결 설정 및 관리
- 방 상태 동기화
- 사용자 입장/퇴장 이벤트 처리
- 비디오 재생 상태 동기화
- 채팅 메시지 송수신
- 플레이리스트 관리

### mock-socket-service.ts

이 파일은 개발 및 테스트 환경에서 사용할 수 있는 소켓 서비스의 목(mock) 구현을 제공합니다. 실제 서버 없이도 애플리케이션의 실시간 기능을 테스트할 수 있게 합니다.

주요 기능:
- 실제 소켓 서비스와 동일한 인터페이스 제공
- 가상의 방 상태 및 이벤트 시뮬레이션
- 지연 시간 및 오류 시뮬레이션 가능

### youtube-service.ts

이 파일은 YouTube API와의 통신을 담당하는 서비스입니다. 비디오 정보 검색, 플레이리스트 가져오기 등의 기능을 제공합니다.

주요 기능:
- YouTube API 인증 및 토큰 관리
- 비디오 정보 검색 및 가져오기
- 플레이리스트 검색 및 가져오기
- 비디오 URL 파싱 및 ID 추출
- 썸네일 및 메타데이터 처리

## 서비스 설계 원칙

- **모듈화**: 각 서비스는 특정 외부 시스템과의 통신을 담당하는 독립적인 모듈로 설계
- **추상화**: 복잡한 외부 API 호출을 간단한 인터페이스로 추상화
- **에러 처리**: 네트워크 오류, API 제한 등의 예외 상황에 대한 견고한 처리
- **캐싱**: 필요한 경우 결과를 캐싱하여 성능 최적화
- **테스트 용이성**: 목(mock) 구현을 통한 테스트 지원

## 사용 방법

이 디렉토리의 서비스들은 컴포넌트나 훅에서 다음과 같이 사용할 수 있습니다:

```tsx
import { connectToRoom } from "@/services/socket-service";
import { getVideoInfo } from "@/services/youtube-service";

// 소켓 서비스 사용 예시
const socket = connectToRoom(roomId, userId, userName);

// YouTube 서비스 사용 예시
const videoInfo = await getVideoInfo(videoId);
```
