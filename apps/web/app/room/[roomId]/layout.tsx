import type React from "react"

/**
 * 룸 페이지의 메타데이터 정의
 * 페이지 제목과 설명을 설정합니다.
 */
export const metadata = {
  title: "YouTube Sync Room",
  description: "Watch YouTube videos together with friends",
}

/**
 * 룸 페이지의 레이아웃 컴포넌트
 * 
 * @param children - 자식 컴포넌트
 */
export default function RoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

