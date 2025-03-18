import Link from "next/link"

/**
 * Footer Component
 * 
 * @returns 애플리케이션 푸터 컴포넌트
 */
export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-12 md:flex-row">
        <div className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} rtB Sync. All rights reserved.
        </div>
        <div className="text-center text-sm text-muted-foreground md:text-left">
          아이디어 제공: 락장놀 빡상진
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link 
            href="/privacy-policy" 
            className="underline underline-offset-4 hover:text-foreground"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
} 