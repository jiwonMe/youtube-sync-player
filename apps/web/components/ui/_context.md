# apps/web/components/ui 디렉토리

이 디렉토리는 애플리케이션 전체에서 재사용 가능한 UI 컴포넌트들을 포함하고 있습니다. 대부분의 컴포넌트는 [shadcn/ui](https://ui.shadcn.com/) 라이브러리를 기반으로 하며, Tailwind CSS로 스타일링되어 있습니다.

## 주요 파일

이 디렉토리에는 다양한 UI 컴포넌트들이 포함되어 있습니다:

- `accordion.tsx`: 아코디언 컴포넌트
- `alert-dialog.tsx`: 알림 다이얼로그 컴포넌트
- `alert.tsx`: 알림 컴포넌트
- `aspect-ratio.tsx`: 종횡비 유지 컴포넌트
- `avatar.tsx`: 아바타 컴포넌트
- `badge.tsx`: 배지 컴포넌트
- `breadcrumb.tsx`: 브레드크럼 네비게이션 컴포넌트
- `button.tsx`: 버튼 컴포넌트
- `calendar.tsx`: 캘린더 컴포넌트
- `card.tsx`: 카드 컴포넌트
- `carousel.tsx`: 캐러셀 컴포넌트
- `chart.tsx`: 차트 컴포넌트
- `checkbox.tsx`: 체크박스 컴포넌트
- `collapsible.tsx`: 접을 수 있는 컴포넌트
- `command.tsx`: 명령 팔레트 컴포넌트
- `context-menu.tsx`: 컨텍스트 메뉴 컴포넌트
- `dialog.tsx`: 다이얼로그 컴포넌트
- `drawer.tsx`: 드로어 컴포넌트
- `dropdown-menu.tsx`: 드롭다운 메뉴 컴포넌트
- `form.tsx`: 폼 컴포넌트
- `hover-card.tsx`: 호버 카드 컴포넌트
- `input-otp.tsx`: OTP 입력 컴포넌트
- `input.tsx`: 입력 필드 컴포넌트
- `label.tsx`: 레이블 컴포넌트
- `menubar.tsx`: 메뉴바 컴포넌트
- `navigation-menu.tsx`: 네비게이션 메뉴 컴포넌트
- `pagination.tsx`: 페이지네이션 컴포넌트
- `popover.tsx`: 팝오버 컴포넌트
- `progress.tsx`: 진행 표시줄 컴포넌트
- `radio-group.tsx`: 라디오 그룹 컴포넌트
- `resizable.tsx`: 크기 조절 가능한 컴포넌트
- `scroll-area.tsx`: 스크롤 영역 컴포넌트
- `select.tsx`: 선택 컴포넌트
- `separator.tsx`: 구분선 컴포넌트
- `sheet.tsx`: 시트 컴포넌트
- `sidebar.tsx`: 사이드바 컴포넌트
- `skeleton.tsx`: 스켈레톤 로딩 컴포넌트
- `slider.tsx`: 슬라이더 컴포넌트
- `sonner.tsx`: 토스트 알림 컴포넌트 (Sonner)
- `switch.tsx`: 스위치 컴포넌트
- `table.tsx`: 테이블 컴포넌트
- `tabs.tsx`: 탭 컴포넌트
- `textarea.tsx`: 텍스트 영역 컴포넌트
- `toast.tsx`: 토스트 알림 컴포넌트
- `toaster.tsx`: 토스트 알림 관리 컴포넌트
- `toggle-group.tsx`: 토글 그룹 컴포넌트
- `toggle.tsx`: 토글 컴포넌트
- `tooltip.tsx`: 툴팁 컴포넌트
- `use-mobile.tsx`: 모바일 감지 훅 컴포넌트
- `use-toast.ts`: 토스트 알림 훅
- `wave.tsx`: 웨이브 애니메이션 컴포넌트

## 컴포넌트 특징

- **접근성**: ARIA 속성을 포함한 접근성 고려
- **테마 지원**: 다크 모드/라이트 모드 지원
- **반응형**: 다양한 화면 크기에 대응
- **커스터마이징 가능**: Tailwind CSS를 통한 쉬운 스타일 커스터마이징
- **타입 안전**: TypeScript로 작성되어 타입 안전성 보장

## 사용 방법

이 컴포넌트들은 애플리케이션 전체에서 일관된 디자인 시스템을 제공합니다. 다른 컴포넌트에서 import하여 사용할 수 있습니다:

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
```

대부분의 컴포넌트는 [Radix UI](https://www.radix-ui.com/)를 기반으로 하며, 접근성과 사용자 경험을 고려하여 설계되었습니다.
