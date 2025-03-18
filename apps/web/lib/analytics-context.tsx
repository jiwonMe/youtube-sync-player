"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import MixpanelTracker, { Events, getBaseEventProperties } from './mixpanel';
import { MIXPANEL_TOKEN } from './env';

/**
 * Analytics context를 위한 인터페이스
 */
interface AnalyticsContextType {
  /**
   * 이벤트를 추적
   * @param eventName - 추적할 이벤트 이름
   * @param properties - 이벤트 속성
   */
  trackEvent: (eventName: string | Events, properties?: Record<string, any>) => void;
}

// Default analytics context
const defaultAnalyticsContext: AnalyticsContextType = {
  trackEvent: () => {}, // 기본 구현은 아무것도 하지 않음
};

// Create analytics context
const AnalyticsContext = createContext<AnalyticsContextType>(defaultAnalyticsContext);

/**
 * Analytics context 제공 컴포넌트
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { userId, isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Mixpanel once when component mounts
  useEffect(() => {
    if (!isInitialized && MIXPANEL_TOKEN) {
      MixpanelTracker.init(MIXPANEL_TOKEN);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Identify user when they sign in
  useEffect(() => {
    if (isInitialized && userId && isSignedIn) {
      MixpanelTracker.identify(userId);
      MixpanelTracker.people.set({
        $userId: userId,
        $last_login: new Date().toISOString(),
      });
    }
  }, [isInitialized, userId, isSignedIn]);

  // Track page views
  useEffect(() => {
    if (isInitialized && pathname) {
      // URL 파라미터 가져오기
      const urlParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        urlParams[key] = value;
      });

      // 페이지 조회 이벤트 추적
      MixpanelTracker.track('Page View', {
        ...getBaseEventProperties(),
        path: pathname,
        params: urlParams,
        title: document.title
      });
    }
  }, [isInitialized, pathname, searchParams]);

  // Create track event function
  const trackEvent = (eventName: string | Events, properties?: Record<string, any>) => {
    if (isInitialized) {
      MixpanelTracker.track(eventName, {
        ...getBaseEventProperties(),
        ...properties,
      });
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Analytics 사용을 위한 커스텀 훅
 * @returns {AnalyticsContextType} Analytics context
 */
export function useAnalytics(): AnalyticsContextType {
  return useContext(AnalyticsContext);
} 