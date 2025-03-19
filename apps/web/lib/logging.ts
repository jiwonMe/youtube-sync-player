/**
 * 로깅 유틸리티
 * 
 * Vercel Functions와 개발 환경에서 일관된 로깅을 위한 유틸리티 함수
 */

/**
 * 현재 타임스탬프를 가져오는 함수
 * @returns ISO 형식의 타임스탬프 문자열
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 객체를 JSON 문자열로 안전하게 변환
 * @param obj - 변환할 객체
 * @returns JSON 문자열
 */
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      // 순환 참조 처리
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (error) {
    return `[Unstringifiable Object]: ${String(error)}`;
  } finally {
    seen.clear();
  }
};

// 순환 참조 감지를 위한 Set
const seen = new Set();

/**
 * 로그 내용을 포맷팅하는 함수
 * @param message - 로그 메시지
 * @param data - 관련 데이터 객체
 * @returns 포맷팅된 로그 메시지
 */
const formatLog = (message: string, data?: any): string => {
  const timestamp = getTimestamp();
  let formatted = `[${timestamp}] ${message}`;
  
  if (data !== undefined) {
    formatted += `\n${safeStringify(data)}`;
  }
  
  return formatted;
};

/**
 * 정보 로그
 * @param message - 로그 메시지
 * @param data - 관련 데이터 객체 (선택 사항)
 */
export const logInfo = (message: string, data?: any): void => {
  console.log(formatLog(`INFO: ${message}`, data));
};

/**
 * 경고 로그
 * @param message - 로그 메시지
 * @param data - 관련 데이터 객체 (선택 사항)
 */
export const logWarning = (message: string, data?: any): void => {
  console.warn(formatLog(`WARNING: ${message}`, data));
};

/**
 * 오류 로그
 * @param message - 로그 메시지
 * @param error - 오류 객체 또는 데이터
 */
export const logError = (message: string, error?: any): void => {
  console.error(formatLog(`ERROR: ${message}`, error));
};

/**
 * 디버그 로그 (개발 환경에서만 출력)
 * @param message - 로그 메시지
 * @param data - 관련 데이터 객체 (선택 사항)
 */
export const logDebug = (message: string, data?: any): void => {
  // 개발 환경에서만 디버그 로깅
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLog(`DEBUG: ${message}`, data));
  }
};

/**
 * 로깅 네임스페이스를 생성하는 함수
 * @param namespace - 네임스페이스 이름
 * @returns 네임스페이스가 지정된 로깅 함수들
 */
export const createLogger = (namespace: string) => {
  return {
    info: (message: string, data?: any) => logInfo(`[${namespace}] ${message}`, data),
    warn: (message: string, data?: any) => logWarning(`[${namespace}] ${message}`, data),
    error: (message: string, data?: any) => logError(`[${namespace}] ${message}`, data),
    debug: (message: string, data?: any) => logDebug(`[${namespace}] ${message}`, data),
  };
}; 