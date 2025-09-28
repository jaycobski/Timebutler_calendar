/**
 * Screen Reader Hook
 * Provides comprehensive screen reader utilities with bilingual support
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ScreenReaderAnnouncement,
  UseScreenReaderReturn,
  AriaLiveRegion,
  AriaRelevant,
  BilingualA11yContent,
  LiveRegionConfig,
  SupportedLanguage
} from '../types/accessibility';
import { A11Y_CONSTANTS } from '../types/accessibility';
import { useLanguage } from './useLanguage';

interface AnnouncementQueue {
  id: string;
  announcement: ScreenReaderAnnouncement;
  timestamp: number;
}

interface LiveRegion {
  element: HTMLElement;
  config: LiveRegionConfig;
}

export function useScreenReader(): UseScreenReaderReturn {
  const { language } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [announcementQueue, setAnnouncementQueue] = useState<AnnouncementQueue[]>([]);
  const liveRegionsRef = useRef<Map<string, LiveRegion>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if screen reader is active
  const detectScreenReader = useCallback(() => {
    // Check for common screen reader indicators
    const indicators = [
      // Check for JAWS
      window.navigator.userAgent.includes('JAWS'),
      // Check for NVDA
      window.navigator.userAgent.includes('NVDA'),
      // Check for VoiceOver (Mac)
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      // Check for high contrast mode (often used with screen readers)
      window.matchMedia('(prefers-contrast: high)').matches,
      // Check for reduced motion (often used with screen readers)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // Check for focus-visible support
      CSS.supports('selector(:focus-visible)'),
      // Check for ARIA live region support
      'ariaLive' in document.createElement('div')
    ];

    return indicators.some(indicator => indicator);
  }, []);

  // Create or get live region
  const getOrCreateLiveRegion = useCallback((config: LiveRegionConfig): HTMLElement => {
    const existing = liveRegionsRef.current.get(config.id);
    if (existing) {
      return existing.element;
    }

    // Create new live region
    const element = document.createElement('div');
    element.id = config.id;
    element.setAttribute('aria-live', config.priority);
    element.setAttribute('aria-atomic', config.atomic ? 'true' : 'false');

    if (config.relevant) {
      element.setAttribute('aria-relevant', config.relevant);
    }

    if (config.busy) {
      element.setAttribute('aria-busy', 'true');
    }

    // Style for screen readers only
    element.className = 'sr-only';
    element.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    if (config.hidden) {
      element.setAttribute('aria-hidden', 'true');
    }

    if (config.language) {
      element.setAttribute('lang', config.language);
    }

    document.body.appendChild(element);

    const liveRegion: LiveRegion = { element, config };
    liveRegionsRef.current.set(config.id, liveRegion);

    return element;
  }, []);

  // Get message text for current language
  const getLocalizedMessage = useCallback((message: BilingualA11yContent): string => {
    if (typeof message === 'string') {
      return message;
    }
    return message[language] || message.en || message.de || '';
  }, [language]);

  // Announce message to screen readers
  const announce = useCallback((announcement: ScreenReaderAnnouncement) => {
    const message = getLocalizedMessage(announcement.message);
    if (!message.trim()) return;

    const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add to queue
    const queueItem: AnnouncementQueue = {
      id,
      announcement,
      timestamp: Date.now()
    };

    setAnnouncementQueue(prev => [...prev, queueItem]);

    // Process queue
    processAnnouncementQueue();
  }, [getLocalizedMessage]);

  // Process announcement queue
  const processAnnouncementQueue = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setAnnouncementQueue(prev => {
        if (prev.length === 0) return prev;

        const [current, ...remaining] = prev;
        const { announcement } = current;
        const message = getLocalizedMessage(announcement.message);

        // Get or create appropriate live region
        const regionConfig: LiveRegionConfig = {
          id: A11Y_CONSTANTS.LIVE_REGIONS.IDS.ANNOUNCEMENTS,
          priority: announcement.priority,
          atomic: true,
          relevant: 'additions text',
          language: announcement.language || language
        };

        const liveRegion = getOrCreateLiveRegion(regionConfig);

        // Handle interruption
        if (announcement.interrupt) {
          liveRegion.textContent = '';
          // Wait a brief moment before adding new content
          setTimeout(() => {
            liveRegion.textContent = message;
          }, 50);
        } else {
          liveRegion.textContent = message;
        }

        // Handle repeat count
        if (announcement.repeatCount && announcement.repeatCount > 1) {
          for (let i = 1; i < announcement.repeatCount; i++) {
            setTimeout(() => {
              liveRegion.textContent = '';
              setTimeout(() => {
                liveRegion.textContent = message;
              }, 50);
            }, i * (announcement.delay || A11Y_CONSTANTS.SCREEN_READER.REPEAT_DELAY));
          }
        }

        // Clear announcement after a delay
        setTimeout(() => {
          liveRegion.textContent = '';
        }, A11Y_CONSTANTS.LIVE_REGIONS.CLEANUP_DELAY);

        // Process next announcement if any
        if (remaining.length > 0) {
          timeoutRef.current = setTimeout(() => {
            processAnnouncementQueue();
          }, announcement.delay || A11Y_CONSTANTS.SCREEN_READER.ANNOUNCEMENT_DELAY);
        }

        return remaining;
      });
    }, 0);
  }, [getLocalizedMessage, language, getOrCreateLiveRegion]);

  // Announce with polite priority
  const announcePolite = useCallback((message: BilingualA11yContent) => {
    announce({
      message,
      priority: 'polite',
      language
    });
  }, [announce, language]);

  // Announce with assertive priority
  const announceAssertive = useCallback((message: BilingualA11yContent) => {
    announce({
      message,
      priority: 'assertive',
      language
    });
  }, [announce, language]);

  // Announce error
  const announceError = useCallback((message: BilingualA11yContent) => {
    const regionConfig: LiveRegionConfig = {
      id: A11Y_CONSTANTS.LIVE_REGIONS.IDS.ERRORS,
      priority: 'assertive',
      atomic: true,
      relevant: 'additions text',
      language
    };

    const liveRegion = getOrCreateLiveRegion(regionConfig);
    liveRegion.textContent = getLocalizedMessage(message);

    // Clear after delay
    setTimeout(() => {
      liveRegion.textContent = '';
    }, A11Y_CONSTANTS.LIVE_REGIONS.CLEANUP_DELAY);
  }, [getOrCreateLiveRegion, getLocalizedMessage, language]);

  // Announce status
  const announceStatus = useCallback((message: BilingualA11yContent) => {
    const regionConfig: LiveRegionConfig = {
      id: A11Y_CONSTANTS.LIVE_REGIONS.IDS.STATUS,
      priority: 'polite',
      atomic: true,
      relevant: 'additions text',
      language
    };

    const liveRegion = getOrCreateLiveRegion(regionConfig);
    liveRegion.textContent = getLocalizedMessage(message);

    // Clear after delay
    setTimeout(() => {
      liveRegion.textContent = '';
    }, A11Y_CONSTANTS.LIVE_REGIONS.CLEANUP_DELAY);
  }, [getOrCreateLiveRegion, getLocalizedMessage, language]);

  // Announce navigation change
  const announceNavigation = useCallback((message: BilingualA11yContent) => {
    const regionConfig: LiveRegionConfig = {
      id: A11Y_CONSTANTS.LIVE_REGIONS.IDS.NAVIGATION,
      priority: 'polite',
      atomic: false,
      relevant: 'additions',
      language
    };

    const liveRegion = getOrCreateLiveRegion(regionConfig);
    liveRegion.textContent = getLocalizedMessage(message);

    // Clear after delay
    setTimeout(() => {
      liveRegion.textContent = '';
    }, A11Y_CONSTANTS.LIVE_REGIONS.CLEANUP_DELAY);
  }, [getOrCreateLiveRegion, getLocalizedMessage, language]);

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    setAnnouncementQueue([]);
    liveRegionsRef.current.forEach(({ element }) => {
      element.textContent = '';
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize screen reader detection
  useEffect(() => {
    setIsActive(detectScreenReader());

    // Listen for accessibility events
    const handleFocusVisibleChange = () => {
      setIsActive(detectScreenReader());
    };

    document.addEventListener('focusin', handleFocusVisibleChange);
    document.addEventListener('keydown', handleFocusVisibleChange);

    return () => {
      document.removeEventListener('focusin', handleFocusVisibleChange);
      document.removeEventListener('keydown', handleFocusVisibleChange);
    };
  }, [detectScreenReader]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Remove live regions
      liveRegionsRef.current.forEach(({ element }) => {
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
      });
      liveRegionsRef.current.clear();
    };
  }, []);

  // Generate live region props
  const getLiveRegionProps = useCallback((priority: AriaLiveRegion = 'polite') => ({
    'aria-live': priority,
    'aria-atomic': true,
    'aria-relevant': 'additions text' as AriaRelevant,
    role: priority === 'assertive' ? 'alert' as const : 'status' as const,
  }), []);

  return {
    announce,
    announcePolite,
    announceAssertive,
    announceError,
    announceStatus,
    announceNavigation,
    clearAnnouncements,
    isActive,
    liveRegionProps: getLiveRegionProps(),
    getOrCreateLiveRegion,
    getLocalizedMessage
  };
}

// Hook for managing loading announcements
export function useLoadingAnnouncements() {
  const { announcePolite, announceStatus } = useScreenReader();
  const { language } = useLanguage();

  const announceLoadingStart = useCallback((resource?: string) => {
    const message = resource
      ? {
          de: `Lade ${resource}...`,
          en: `Loading ${resource}...`
        }
      : {
          de: 'Ladevorgang gestartet',
          en: 'Loading started'
        };

    announcePolite(message);
  }, [announcePolite]);

  const announceLoadingComplete = useCallback((resource?: string) => {
    const message = resource
      ? {
          de: `${resource} erfolgreich geladen`,
          en: `${resource} loaded successfully`
        }
      : {
          de: 'Ladevorgang abgeschlossen',
          en: 'Loading completed'
        };

    announceStatus(message);
  }, [announceStatus]);

  const announceLoadingError = useCallback((resource?: string) => {
    const message = resource
      ? {
          de: `Fehler beim Laden von ${resource}`,
          en: `Error loading ${resource}`
        }
      : {
          de: 'Fehler beim Laden',
          en: 'Loading error'
        };

    announceStatus(message);
  }, [announceStatus]);

  return {
    announceLoadingStart,
    announceLoadingComplete,
    announceLoadingError
  };
}

// Hook for form announcements
export function useFormAnnouncements() {
  const { announceAssertive, announceStatus } = useScreenReader();

  const announceValidationError = useCallback((fieldName: string, error: BilingualA11yContent) => {
    const message: BilingualA11yContent = {
      de: `Fehler in ${fieldName}: ${typeof error === 'string' ? error : error.de}`,
      en: `Error in ${fieldName}: ${typeof error === 'string' ? error : error.en}`
    };

    announceAssertive(message);
  }, [announceAssertive]);

  const announceFormSubmission = useCallback((success: boolean) => {
    const message: BilingualA11yContent = success
      ? {
          de: 'Formular erfolgreich übermittelt',
          en: 'Form submitted successfully'
        }
      : {
          de: 'Fehler beim Übermitteln des Formulars',
          en: 'Error submitting form'
        };

    announceStatus(message);
  }, [announceStatus]);

  const announceFieldChange = useCallback((fieldName: string, value: string) => {
    const message: BilingualA11yContent = {
      de: `${fieldName} geändert zu ${value}`,
      en: `${fieldName} changed to ${value}`
    };

    announceStatus(message);
  }, [announceStatus]);

  return {
    announceValidationError,
    announceFormSubmission,
    announceFieldChange
  };
}

// Utility functions
export function createScreenReaderOnlyText(content: string, lang?: SupportedLanguage): HTMLElement {
  const element = document.createElement('span');
  element.className = 'sr-only';
  element.textContent = content;

  if (lang) {
    element.setAttribute('lang', lang);
  }

  element.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;

  return element;
}

export function addScreenReaderText(element: HTMLElement, text: string, lang?: SupportedLanguage) {
  const srText = createScreenReaderOnlyText(text, lang);
  element.appendChild(srText);
  return srText;
}

export function removeScreenReaderText(element: HTMLElement, textElement: HTMLElement) {
  if (element.contains(textElement)) {
    element.removeChild(textElement);
  }
}

export function updateScreenReaderText(textElement: HTMLElement, newText: string) {
  textElement.textContent = newText;
}