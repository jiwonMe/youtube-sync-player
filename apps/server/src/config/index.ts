/**
 * 서버 설정 파일
 * 환경 변수 설정과 기본값을 관리합니다.
 */
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 서버 환경 타입
export type NodeEnv = 'development' | 'production' | 'test';

// 서버 설정 인터페이스
export interface ServerConfig {
  // 서버 환경
  nodeEnv: NodeEnv;
  // 서버 포트
  port: number;
  // CORS 설정
  corsOrigin: string | string[];
  // 로그 레벨
  logLevel: string;
  // 비활성 방 제거 타임아웃(ms)
  roomCleanupTimeout: number;
  // 메시지 히스토리 최대 개수
  maxMessageHistory: number;
  // 이벤트 로그 최대 개수
  maxEventLogs: number;
}

// 설정값 생성
const config: ServerConfig = {
  nodeEnv: (process.env.NODE_ENV as NodeEnv) || 'development',
  port: parseInt(process.env.PORT || '3003', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  roomCleanupTimeout: parseInt(process.env.ROOM_CLEANUP_TIMEOUT || '60000', 10),
  maxMessageHistory: parseInt(process.env.MAX_MESSAGE_HISTORY || '200', 10),
  maxEventLogs: parseInt(process.env.MAX_EVENT_LOGS || '100', 10),
};

export default config; 