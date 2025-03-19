"use client"

import { usePathname } from "next/navigation"
import { Footer } from "./footer"

/**
 * 경로 기반 조건부 Footer 렌더링을 처리하는 클라이언트 컴포넌트
 * room 경로에서는 Footer를 표시하지 않음
 */
export function ClientFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith("/room")) {
    return null
  }
  return <Footer />
} 