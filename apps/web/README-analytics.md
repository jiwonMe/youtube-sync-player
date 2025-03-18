# Mixpanel 분석 시스템 구현 문서

이 문서는 YouTube Sync Player 웹 애플리케이션에 구현된 Mixpanel 분석 시스템에 대한 개요입니다.

## 구현 내용

1. **핵심 파일**:
   - `lib/mixpanel.ts`: Mixpanel 인스턴스와 이벤트 추적 유틸리티
   - `lib/analytics-context.tsx`: React Context 기반 분석 시스템
   - `hooks/use-track-event.ts`: 컴포넌트에서 사용하기 위한 커스텀 훅
   - `lib/env.ts`: Mixpanel 환경 변수 처리 추가
   - `app/layout.tsx`: 루트 레이아웃에 AnalyticsProvider 통합

2. **주요 기능**:
   - **자동 페이지 추적**: 페이지 뷰와 경로 변경을 자동으로 추적
   - **사용자 식별**: Clerk 인증과 통합하여 사용자 자동 식별
   - **표준화된 이벤트**: 일관된 이벤트 이름과 속성을 위한 Events enum
   - **컴포넌트 단위 추적**: 컴포넌트별로 간단하게 이벤트 추적 가능
   - **상세 이벤트 속성**: 모든 이벤트에 기본 컨텍스트 추가

3. **이벤트 추적 카테고리**:
   - 인증 이벤트: 회원가입, 로그인, 로그아웃
   - 방 관련 이벤트: 방 생성, 참여, 퇴장, 설정 변경
   - 비디오 이벤트: 재생, 일시정지, 추가, 제거, 순서 변경
   - 채팅 이벤트: 메시지 전송
   - 일반 인터랙션: 버튼 클릭, 기능 사용
   - 에러 상태: 각종 오류 상황

## 설정 방법

1. Mixpanel 계정 생성 및 프로젝트 설정
2. `.env` 파일에 `NEXT_PUBLIC_MIXPANEL_TOKEN` 추가
3. (선택사항) 개발/테스트 환경에서는 `debug: true` 모드 활성화

## 사용 방법

### 기본적인 이벤트 추적:

컴포넌트에서 직접 사용:

```tsx
import { useAnalytics } from '@/lib/analytics-context';
import { Events } from '@/lib/mixpanel';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  // 이벤트 추적
  trackEvent(Events.BUTTON_CLICKED, { buttonName: 'play-button' });
  
  return (
    // 컴포넌트 렌더링
  );
}
```

### 컴포넌트 단위 이벤트 추적:

```tsx
import { useTrackEvent } from '@/hooks/use-track-event';
import { Events } from '@/lib/mixpanel';

function VideoPlayer() {
  const analytics = useTrackEvent('VideoPlayer');
  
  // 버튼 클릭 이벤트 추적
  const handlePlayClick = () => {
    analytics.trackButtonClick('play-button');
    // 실제 비디오 재생 로직...
  };
  
  // 기능 사용 이벤트 추적
  const handleFullScreen = () => {
    analytics.trackFeatureUsed('fullscreen-mode');
    // 전체화면 전환 로직...
  };
  
  // 에러 추적
  const handleLoadError = (error) => {
    analytics.trackError('video_load_failed', { error: error.message });
  };
  
  return (
    // 컴포넌트 렌더링
  );
}
```

## 이벤트 분석 전략

### 핵심 지표 모니터링

1. **사용자 유입 및 유지**:
   - 일별/주별/월별 활성 사용자(DAU/WAU/MAU)
   - 사용자 재방문율
   - 사용자당 세션 시간

2. **핵심 기능 사용 현황**:
   - 방 생성 및 참여 비율
   - 비디오 재생 수와 시청 시간
   - 채팅 활성도
   - 플레이리스트 추가/삭제 활동

3. **전환율 지표**:
   - 방문 → 회원가입 전환율
   - 방 생성 → 친구 초대 전환율
   - 비디오 추가 → 재생 전환율

4. **사용자 행동 패턴**:
   - 가장 인기 있는 기능
   - 주요 사용자 플로우
   - 이탈 지점 식별

### Mixpanel 내 주요 보고서 설정

- **Funnel Analysis**: 사용자 온보딩 및 핵심 경로 전환율
- **Retention**: 사용자 재방문 추적
- **Flows**: 사용자 경로 시각화
- **Cohorts**: 특정 행동 기반 사용자 그룹 분석

## 통합 예시

이 프로젝트에서는 `AddVideoDialog` 컴포넌트에 Mixpanel 이벤트 추적을 통합했습니다:

- 대화상자 표시 이벤트
- 탭 변경 이벤트
- 비디오 URL 추가 이벤트
- 검색 시도 및 결과 이벤트
- 검색 결과에서 비디오 선택 이벤트
- 다양한 버튼 클릭 이벤트
- 검색 및 비디오 추가 오류 이벤트

이 패턴을 다른 주요 컴포넌트에도 적용하여 일관된 분석 데이터를 수집할 수 있습니다.

## 프라이버시 및 데이터 처리

- 개인정보 보호를 위해 민감한 정보는 수집하지 않습니다.
- 사용자 ID는 익명화된 형태로만 사용합니다.
- 개인정보처리방침에 분석 도구 사용에 대한 내용을 포함해야 합니다.
- EU 사용자를 위한 GDPR 고려사항을 준수합니다.

## 확장 방향

1. **A/B 테스트 통합**:
   - 다양한 UI/UX 변형에 대한 사용자 반응 테스트
   - 기능 출시 전 제한된 사용자에게 미리 노출

2. **사용자 세그먼트 분석**:
   - 활성 사용자 vs 비활성 사용자 행동 패턴 비교
   - 신규 사용자 vs 기존 사용자 기능 사용 차이점

3. **맞춤형 인게이지먼트**:
   - 사용 패턴에 따른 맞춤형 기능 추천
   - 이탈 가능성이 높은 사용자 식별 및 유지 전략 