# Mixpanel 분석 구현 가이드

이 가이드는 YouTube Sync Player 애플리케이션에서 Mixpanel을 사용한 사용자 행동 추적 구현 방법을 설명합니다.

## 설정 방법

1. Mixpanel 프로젝트 설정

   - [Mixpanel](https://mixpanel.com)에 가입하고 새 프로젝트를 생성합니다.
   - 프로젝트 설정에서 프로젝트 토큰을 복사합니다.
   - `.env` 파일에 `NEXT_PUBLIC_MIXPANEL_TOKEN` 환경 변수로 토큰을 추가합니다.

2. Mixpanel 초기화

   - 앱 시작 시 `AnalyticsProvider`가 자동으로 Mixpanel을 초기화합니다.
   - Root Layout에 `AnalyticsProvider`가 이미 설정되어 있습니다.

## 사용 방법

### 컴포넌트에서 이벤트 추적하기

```tsx
// 1. useTrackEvent 훅 임포트
import { useTrackEvent } from '@/hooks/use-track-event';
import { Events } from '@/lib/mixpanel';

function MyComponent() {
  // 2. 컴포넌트 이름과 함께 훅 초기화
  const analytics = useTrackEvent('MyComponent');
  
  // 3. 이벤트 추적 함수 사용
  const handleButtonClick = () => {
    // 버튼 클릭 이벤트 추적
    analytics.trackButtonClick('submit-button', { formFilled: true });
    
    // 실제 버튼 클릭 처리 로직...
  };
  
  // 4. 에러 추적
  try {
    // 기능 구현...
  } catch (error) {
    analytics.trackError('feature_failed', { error: error.message });
  }
  
  return (
    <button onClick={handleButtonClick}>제출</button>
  );
}
```

### 주요 이벤트 추적 함수

`useTrackEvent` 훅은 다음 함수들을 제공합니다:

- `track(eventName, properties)`: 일반 이벤트 추적
- `trackButtonClick(buttonName, properties)`: 버튼 클릭 이벤트 추적
- `trackFeatureUsed(featureName, properties)`: 기능 사용 이벤트 추적
- `trackError(errorMessage, properties)`: 에러 이벤트 추적

### 미리 정의된 이벤트 유형

`Events` enum을 사용하여 일관된 이벤트 이름을 유지할 수 있습니다:

```tsx
import { Events } from '@/lib/mixpanel';

analytics.track(Events.USER_LOGGED_IN, { method: 'email' });
```

주요 이벤트 유형:
- 인증: `USER_SIGNED_UP`, `USER_LOGGED_IN`, `USER_LOGGED_OUT`
- 방: `ROOM_CREATED`, `ROOM_JOINED`, `ROOM_LEFT`
- 비디오: `VIDEO_ADDED`, `VIDEO_REMOVED`, `VIDEO_PLAYED`, `VIDEO_PAUSED`
- 채팅: `CHAT_SENT`
- 일반: `BUTTON_CLICKED`, `FEATURE_USED`, `ERROR_OCCURRED`

## 이벤트 추적 전략

### 주요 추적 이벤트

1. **인증 이벤트**
   - 회원 가입, 로그인, 로그아웃

2. **방 이벤트**
   - 방 생성, 참여, 퇴장
   - 설정 변경

3. **비디오 이벤트**
   - 비디오 추가, 제거
   - 재생, 일시정지, 스킵
   - 플레이리스트 순서 변경

4. **사용자 인터랙션**
   - 버튼 클릭
   - 기능 사용
   - 페이지 조회 (자동 추적됨)

5. **에러 상황**
   - API 요청 실패
   - 기능 사용 중 오류

### 이벤트 프로퍼티

모든 이벤트에는 다음 기본 프로퍼티가 포함됩니다:
- 타임스탬프
- URL 경로
- 리퍼러
- 뷰포트 사이즈
- 컴포넌트 이름

## 데이터 분석

Mixpanel 대시보드에서 다음 분석이 가능합니다:

1. **사용자 플로우**
   - 사용자가 앱을 어떻게 탐색하는지 파악
   - 가장 인기 있는 기능 식별

2. **이탈 지점**
   - 사용자가 앱을 이탈하는 지점 분석
   - 오류가 발생하는 주요 지점 식별

3. **비디오 사용 패턴**
   - 많이 재생되는 비디오 유형
   - 평균 시청 시간

4. **기능 사용률**
   - 가장 많이 사용되는 기능
   - 사용되지 않는 기능 식별

## 프라이버시 고려사항

- 개인 식별 정보는 최소한으로 수집합니다.
- 사용자 ID는 익명화된 형태로만 추적합니다.
- 개인정보처리방침에 분석 도구 사용에 대한 내용을 포함해야 합니다. 