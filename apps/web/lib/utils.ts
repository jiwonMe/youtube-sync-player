import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 초 단위의 시간을 'Xh Ym' 형식으로 변환하는 함수
 * @param seconds 초 단위 시간
 * @returns 읽기 쉬운 시간 형식 (예: '2h 30m')
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return '0m';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
