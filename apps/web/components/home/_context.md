# apps/web/components/home 디렉토리

이 디렉토리는 홈페이지를 구성하는 컴포넌트들을 포함하고 있습니다.

## 주요 파일

- `cta-section.tsx`: Call-to-Action 섹션 컴포넌트
- `features-section.tsx`: 기능 소개 섹션 컴포넌트
- `footer-section.tsx`: 홈페이지 푸터 섹션 컴포넌트
- `hero-section.tsx`: 히어로(메인 배너) 섹션 컴포넌트
- `steps-section.tsx`: 사용 단계 안내 섹션 컴포넌트

## 주요 컴포넌트 설명

### hero-section.tsx

홈페이지의 첫 번째 섹션으로, 애플리케이션의 주요 가치 제안과 시작하기 버튼을 포함합니다. 사용자의 첫인상을 결정하는 중요한 컴포넌트입니다.

- 빠른 방 생성 및 참여 기능 제공
- 탭 전환을 통한 직관적인 UX
- Mixpanel 이벤트 추적:
  - 페이지 뷰(`home_page_viewed`)
  - 탭 전환(`hero_tab_changed`)
  - 방 생성 시도(`quick_create_room`)
  - 방 참여 시도(`quick_join_room_attempted`)
  - 방 참여 성공(`room_joined`)

### features-section.tsx

애플리케이션의 주요 기능들을 시각적으로 소개하는 섹션입니다. 각 기능에 대한 아이콘, 제목, 설명을 포함합니다.

### steps-section.tsx

애플리케이션 사용 방법을 단계별로 안내하는 섹션입니다. 사용자가 서비스를 시작하는 데 필요한 단계를 시각적으로 설명합니다.

### cta-section.tsx

사용자에게 행동을 유도하는 Call-to-Action 섹션입니다. 주로 방 생성하기 또는 참여하기 버튼을 포함합니다.

- Mixpanel 이벤트 추적:
  - 섹션 노출(`cta_section_viewed`)
  - 방 생성 버튼 클릭(`cta_create_room`)
  - 방 참여 버튼 클릭(`cta_join_room`)

### footer-section.tsx

홈페이지 하단의 푸터 섹션으로, 링크, 저작권 정보, 소셜 미디어 링크 등을 포함합니다.

## 디자인 특징

- 반응형 디자인: 모든 화면 크기에 최적화
- 모던한 UI: Tailwind CSS와 shadcn/ui를 활용한 현대적인 디자인
- 애니메이션: 사용자 경험을 향상시키는 부드러운 애니메이션 효과
- 다크 모드 지원: 라이트/다크 테마 모두 지원

## 분석 추적 정보

홈페이지의 각 섹션에는 Mixpanel을 통한 사용자 행동 분석 기능이 구현되어 있습니다. 이를 통해 어떤 기능이 사용자들에게 인기 있는지, 어떤 전환 경로가 효과적인지 등을 측정할 수 있습니다. 주요 추적 이벤트는 다음과 같습니다:

- 페이지 및 섹션 노출
- 버튼 클릭 및 상호작용
- 방 생성 및 참여 성공/실패
- 사용자 입력 패턴

각 이벤트에는 관련 속성(예: 방 이름 길이, 참여 방식 등)이 포함되어 더 세분화된 분석이 가능합니다.
