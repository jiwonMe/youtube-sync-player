# apps/web/public 디렉토리

이 디렉토리는 Next.js 애플리케이션의 정적 파일들을 포함하고 있습니다. 이 파일들은 웹 서버에 의해 직접 제공되며, 애플리케이션의 루트 URL에서 접근할 수 있습니다.

## 주요 파일

- `logo.svg`: 애플리케이션 로고
- `placeholder-logo.png`: 로고 플레이스홀더 이미지
- `placeholder-logo.svg`: 로고 플레이스홀더 벡터 이미지
- `placeholder-user.jpg`: 사용자 프로필 플레이스홀더 이미지
- `placeholder.jpg`: 일반 플레이스홀더 이미지
- `placeholder.svg`: 일반 플레이스홀더 벡터 이미지

## 디렉토리 용도

이 디렉토리는 다음과 같은 정적 파일들을 저장하는 데 사용됩니다:

- 이미지 (PNG, JPG, SVG 등)
- 아이콘 (favicon.ico, apple-touch-icon.png 등)
- 폰트 파일
- 정적 JSON 데이터
- robots.txt, sitemap.xml 등의 SEO 관련 파일
- 기타 정적 자산

## 파일 접근 방법

public 디렉토리의 파일들은 애플리케이션의 루트 URL에서 직접 접근할 수 있습니다. 예를 들어, `public/logo.svg` 파일은 웹 브라우저에서 `/logo.svg`로 접근할 수 있습니다.

### 코드에서 사용 예시

```tsx
// 이미지 컴포넌트 사용 (권장)
import Image from 'next/image';

function Logo() {
  return <Image src="/logo.svg" alt="로고" width={100} height={50} />;
}

// 또는 직접 경로 사용
function Header() {
  return <header><img src="/logo.svg" alt="로고" /></header>;
}
```

## 주의사항

- 이 디렉토리에 있는 파일들은 빌드 시 최적화되지 않으므로, 가능한 경우 Next.js의 Image 컴포넌트를 사용하여 이미지를 최적화하는 것이 좋습니다.
- 대용량 파일이나 많은 수의 파일은 CDN이나 외부 스토리지 서비스를 사용하는 것이 권장됩니다.
- 민감한 정보나 비공개 데이터는 이 디렉토리에 저장하지 않아야 합니다.
