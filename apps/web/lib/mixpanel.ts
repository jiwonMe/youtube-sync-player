import mixpanel from 'mixpanel-browser';

/**
 * Mixpanel 설정 및 초기화를 처리하는 객체
 */
export const MixpanelTracker = {
  /**
   * Mixpanel 인스턴스를 초기화
   * @param {string} token - Mixpanel 프로젝트 토큰
   */
  init: (token: string) => {
    if (typeof window !== 'undefined') {
      mixpanel.init(token, {
        debug: process.env.NODE_ENV !== 'production',
        track_pageview: true,
        persistence: 'localStorage',
        ignore_dnt: process.env.NODE_ENV !== 'production'
      });
    }
  },

  /**
   * 이벤트를 추적
   * @param {string} eventName - 추적할 이벤트 이름
   * @param {object} properties - 이벤트와 함께 전송할 속성
   */
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.track(eventName, properties);
    }
  },

  /**
   * 사용자 식별 정보 설정
   * @param {string} userId - 사용자 고유 ID
   */
  identify: (userId: string) => {
    if (typeof window !== 'undefined') {
      mixpanel.identify(userId);
    }
  },

  /**
   * 사용자 정보 등록
   * @param {object} properties - 사용자 프로필 속성
   */
  people: {
    set: (properties: Record<string, any>) => {
      if (typeof window !== 'undefined') {
        mixpanel.people.set(properties);
      }
    }
  },

  /**
   * 현재 페이지 추적
   * @param {string} pageName - 페이지 이름
   */
  trackPageView: (pageName: string) => {
    if (typeof window !== 'undefined') {
      mixpanel.track('Page View', { page: pageName });
    }
  },

  /**
   * Mixpanel 세션 초기화 (로그아웃 시)
   */
  reset: () => {
    if (typeof window !== 'undefined') {
      mixpanel.reset();
    }
  }
};

/**
 * 이벤트 카테고리 및 이름 정의
 * 이벤트 일관성을 위한 enum 사용
 */
export enum Events {
  // 인증 관련 이벤트
  USER_SIGNED_UP = 'User Signed Up',
  USER_LOGGED_IN = 'User Logged In',
  USER_LOGGED_OUT = 'User Logged Out',
  
  // 방 관련 이벤트
  ROOM_CREATED = 'Room Created',
  ROOM_JOINED = 'Room Joined',
  ROOM_LEFT = 'Room Left',
  
  // 비디오 관련 이벤트
  VIDEO_ADDED = 'Video Added',
  VIDEO_REMOVED = 'Video Removed',
  VIDEO_PLAYED = 'Video Played',
  VIDEO_PAUSED = 'Video Paused',
  VIDEO_SKIPPED = 'Video Skipped',
  PLAYLIST_REORDERED = 'Playlist Reordered',
  
  // 채팅 관련 이벤트
  CHAT_SENT = 'Chat Sent',
  
  // 인터랙션 이벤트
  BUTTON_CLICKED = 'Button Clicked',
  FEATURE_USED = 'Feature Used',
  
  // 에러 이벤트
  ERROR_OCCURRED = 'Error Occurred'
}

/**
 * 모든 이벤트에 포함할 기본 프로퍼티를 생성하는 함수
 * @returns {object} 기본 이벤트 프로퍼티
 */
export const getBaseEventProperties = () => {
  return {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof window !== 'undefined' ? document.referrer : '',
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : {}
  };
};

export default MixpanelTracker; 