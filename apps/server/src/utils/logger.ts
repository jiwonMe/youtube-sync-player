/**
 * 로깅 유틸리티
 * 서버 로깅을 일관되게 관리하기 위한 모듈입니다.
 */

// 로그 레벨 타입
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 현재 타임스탬프를 ISO 형식으로 반환
function getTimestamp(): string {
  return new Date().toISOString();
}

// 로그 레벨에 따른 색상 설정
const levelColors: Record<LogLevel, string> = {
  debug: colors.cyan,
  info: colors.green,
  warn: colors.yellow,
  error: colors.red,
};

// 로그 레벨별 텍스트
const levelLabels: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
};

// 로그 출력 함수
function log(level: LogLevel, module: string, message: string, ...args: any[]): void {
  // 환경변수로 로그 레벨 제어 가능
  const envLogLevel = process.env.LOG_LEVEL || 'info';
  
  // 로그 레벨 순서
  const levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  
  // 현재 설정된 로그 레벨보다 낮은 레벨은 출력하지 않음
  if (levelOrder[level] < levelOrder[envLogLevel as LogLevel]) {
    return;
  }

  const timestamp = getTimestamp();
  const color = levelColors[level];
  const levelLabel = levelLabels[level];
  
  // 메시지 형식: [시간] [레벨] [모듈] 메시지
  const formattedMsg = `${colors.dim}[${timestamp}]${colors.reset} ${color}[${levelLabel}]${colors.reset} ${colors.magenta}[${module}]${colors.reset} ${message}`;
  
  // 추가 인자가 있는 경우 출력
  if (args.length > 0) {
    console.log(formattedMsg, ...args);
  } else {
    console.log(formattedMsg);
  }
}

// 익스포트할 로거 객체
export const logger = {
  debug: (module: string, message: string, ...args: any[]) => log('debug', module, message, ...args),
  info: (module: string, message: string, ...args: any[]) => log('info', module, message, ...args),
  warn: (module: string, message: string, ...args: any[]) => log('warn', module, message, ...args),
  error: (module: string, message: string, ...args: any[]) => log('error', module, message, ...args),
}; 