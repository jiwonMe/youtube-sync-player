"use client";

import { useCallback } from 'react';
import { useAnalytics } from '@/lib/analytics-context';
import { Events } from '@/lib/mixpanel';

/**
 * 컴포넌트에서 이벤트 추적을 쉽게 하기 위한 커스텀 훅
 * @param {string} componentName - 이벤트를 발생시키는 컴포넌트 이름
 * @returns {Function} 이벤트 추적 함수
 */
export function useTrackEvent(componentName: string) {
  const { trackEvent } = useAnalytics();

  /**
   * 이벤트를 추적하는 함수
   * @param {string | Events} eventName - 추적할 이벤트 이름
   * @param {Record<string, any>} additionalProperties - 추가 속성
   */
  const track = useCallback(
    (eventName: string | Events, additionalProperties?: Record<string, any>) => {
      trackEvent(eventName, {
        componentName,
        ...additionalProperties,
      });
    },
    [trackEvent, componentName]
  );

  /**
   * 버튼 클릭 이벤트를 추적하는 함수
   * @param {string} buttonName - 버튼 이름
   * @param {Record<string, any>} additionalProperties - 추가 속성
   */
  const trackButtonClick = useCallback(
    (buttonName: string, additionalProperties?: Record<string, any>) => {
      trackEvent(Events.BUTTON_CLICKED, {
        componentName,
        buttonName,
        ...additionalProperties,
      });
    },
    [trackEvent, componentName]
  );

  /**
   * 기능 사용 이벤트를 추적하는 함수
   * @param {string} featureName - 기능 이름
   * @param {Record<string, any>} additionalProperties - 추가 속성
   */
  const trackFeatureUsed = useCallback(
    (featureName: string, additionalProperties?: Record<string, any>) => {
      trackEvent(Events.FEATURE_USED, {
        componentName,
        featureName,
        ...additionalProperties,
      });
    },
    [trackEvent, componentName]
  );

  /**
   * 에러 이벤트를 추적하는 함수
   * @param {string} errorMessage - 에러 메시지
   * @param {Record<string, any>} additionalProperties - 추가 속성
   */
  const trackError = useCallback(
    (errorMessage: string, additionalProperties?: Record<string, any>) => {
      trackEvent(Events.ERROR_OCCURRED, {
        componentName,
        errorMessage,
        ...additionalProperties,
      });
    },
    [trackEvent, componentName]
  );

  return {
    track,
    trackButtonClick,
    trackFeatureUsed,
    trackError,
  };
} 