/**
 * 고유 ID를 생성하는 함수
 * @returns {string} 랜덤 문자열 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * 현재 타임스탬프(밀리초)를 반환하는 함수
 * @returns {number} 현재 시간의 타임스탬프
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * 숫자에 소수점 자릿수를 지정하는 함수
 * @param {number} value - 소수점을 표시할 숫자
 * @param {number} digits - 표시할 소수점 자릿수
 * @returns {string} 소수점이 포맷된 문자열
 */
export function formatDecimal(value: number, digits: number = 2): string {
  return value.toFixed(digits);
} 