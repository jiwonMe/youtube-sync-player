# apps/web/lib 디렉토리

이 디렉토리는 애플리케이션에서 사용되는 유틸리티 함수와 라이브러리를 포함하고 있습니다.

## 주요 파일

- `env.ts`: 환경 변수 관리 및 검증
- `utils.ts`: 범용 유틸리티 함수
- `mixpanel.ts`: Mixpanel 분석 기능 
- `analytics-context.tsx`: 분석 Context Provider
- `analytics.md`: Mixpanel 분석 구현 가이드 및 전략

## 주요 파일 설명

### env.ts

이 파일은 애플리케이션에서 사용되는 환경 변수를 관리하고 검증하는 역할을 합니다. 환경 변수가 올바르게 설정되었는지 확인하고, 타입 안전한 방식으로 접근할 수 있도록 합니다.

주요 기능:
- 필수 환경 변수 검증
- 환경 변수 타입 변환 (문자열 → 숫자, 불리언 등)
- 개발/프로덕션 환경에 따른 환경 변수 처리

### utils.ts

이 파일은 애플리케이션 전체에서 사용되는 범용 유틸리티 함수들을 포함하고 있습니다.

주요 기능:
- 클래스 이름 병합 (cn 함수)
- 날짜 포맷팅
- 문자열 조작
- 배열 조작
- 객체 변환
- 기타 헬퍼 함수

### mixpanel.ts

이 파일은 Mixpanel을 사용한 분석 기능을 제공합니다. 사용자 행동과 이벤트를 추적하는 데 필요한 유틸리티 함수들을 포함합니다.

주요 기능:
- Mixpanel 인스턴스 초기화
- 이벤트 추적 함수
- 사용자 식별 함수
- 이벤트 카테고리 정의
- 기본 이벤트 속성 생성

### analytics-context.tsx

이 파일은 React Context API를 사용하여 애플리케이션 전체에서 분석 기능을 사용할 수 있도록 합니다.

주요 기능:
- 분석 Context 생성
- 분석 Provider 컴포넌트
- 페이지 조회 이벤트 자동 추적
- 사용자 식별 자동화
- 이벤트 추적 함수 제공

### analytics.md

이 파일은 Mixpanel 분석 기능의 구현 방법과 이벤트 추적 전략에 대한 가이드를 제공합니다.

주요 내용:
- Mixpanel 설정 방법
- 이벤트 추적 사용법
- 이벤트 추적 전략
- 데이터 분석 방법
- 프라이버시 고려사항

## 사용 방법

이 디렉토리의 유틸리티 함수들은 애플리케이션 전체에서 import하여 사용할 수 있습니다:

```tsx
import { cn } from "@/lib/utils"
import { env } from "@/lib/env"
import { useAnalytics } from "@/lib/analytics-context"
import { Events } from "@/lib/mixpanel"

// 사용 예시
const { trackEvent } = useAnalytics();

<div 
  className={cn("base-class", isActive && "active-class")}
  onClick={() => trackEvent(Events.BUTTON_CLICKED, { buttonName: "example-button" })}
>
  {env.NEXT_PUBLIC_APP_NAME}
</div>
```

## 설계 원칙

- **순수 함수**: 부작용 없이 입력에 따라 출력만 반환하는 순수 함수 지향
- **재사용성**: 여러 컴포넌트에서 공통으로 사용할 수 있는 함수 제공
- **타입 안전성**: TypeScript를 활용한 타입 안전한 인터페이스 제공
- **테스트 용이성**: 단위 테스트가 용이한 구조로 설계
