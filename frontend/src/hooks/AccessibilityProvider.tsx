/**
 * Accessibility Provider
 * Main context provider for all accessibility features with bilingual support
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type {
  A11yContextType,
  A11yUserPreferences,
  ScreenReaderAnnouncement,
  BilingualA11yContent,
  FocusConfig,
  KeyboardNavConfig,
  SupportedLanguage
} from '../types/accessibility';
import { DEFAULT_A11Y_PREFERENCES, A11Y_CONSTANTS } from '../types/accessibility';
import { useA11yLabels } from './useA11yLabels';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useFocusManagement } from './useFocusManagement';
import { useScreenReader } from './useScreenReader';
import { useA11yTesting } from './useA11yTesting';
import { useWCAGCompliance } from './useWCAGCompliance';
import { useLanguage } from './useLanguage';

interface AccessibilityProviderProps {
  children: React.ReactNode;
  initialPreferences?: Partial<A11yUserPreferences>;
  enableAutoTesting?: boolean;
  enableMonitoring?: boolean;
}

const AccessibilityContext = createContext<A11yContextType | null>(null);

export function AccessibilityProvider({
  children,
  initialPreferences = {},
  enableAutoTesting = false,
  enableMonitoring = true
}: AccessibilityProviderProps) {
  const { language } = useLanguage();
  const [preferences, setPreferences] = useState<A11yUserPreferences>(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem(A11Y_CONSTANTS.STORAGE.PREFERENCES);
    const storedPreferences = stored ? JSON.parse(stored) : {};

    return {
      ...DEFAULT_A11Y_PREFERENCES,
      ...storedPreferences,
      ...initialPreferences,
      language
    };
  });

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Initialize hooks
  const { getLabel, getA11yText, commonLabels, errorMessages, successMessages } = useA11yLabels();
  const { setupKeyboardNav, handleArrowKeys } = useKeyboardNavigation();
  const {
    focus: focusElement,
    trapFocus,
    restoreFocus,
    skipToContent
  } = useFocusManagement();
  const {
    announce,
    announcePolite,
    announceAssertive,
    isActive: screenReaderDetected
  } = useScreenReader();
  const { runTests, validateWCAG } = useA11yTesting();
  const { validateCompliance, startMonitoring, stopMonitoring } = useWCAGCompliance();

  const initializationRef = useRef(false);
  const preferencesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect user interaction patterns
  const detectUserPatterns = useCallback(() => {
    // Detect keyboard usage
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('user-is-tabbing');
      }
    };

    // Detect mouse usage
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('user-is-tabbing');
    };

    // Detect screen reader
    setIsScreenReaderActive(screenReaderDetected);

    // Detect high contrast mode
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);

    // Listen for changes
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    highContrastQuery.addEventListener('change', (e) => setIsHighContrast(e.matches));

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      highContrastQuery.removeEventListener('change', () => {});
    };
  }, [screenReaderDetected]);

  // Apply accessibility preferences
  const applyPreferences = useCallback((prefs: A11yUserPreferences) => {
    const html = document.documentElement;
    const body = document.body;

    // Apply reduced motion
    if (prefs.reduceMotion) {
      html.style.setProperty('--animation-duration', '0s');
      html.style.setProperty('--transition-duration', '0s');
      body.classList.add('reduce-motion');
    } else {
      html.style.removeProperty('--animation-duration');
      html.style.removeProperty('--transition-duration');
      body.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (prefs.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Apply large text
    if (prefs.largeText) {
      html.style.fontSize = '120%';
      body.classList.add('large-text');
    } else {
      html.style.fontSize = '';
      body.classList.remove('large-text');
    }

    // Apply font size
    if (prefs.fontSize !== 16) {
      html.style.fontSize = `${prefs.fontSize}px`;
    }

    // Apply color scheme
    if (prefs.colorScheme !== 'auto') {
      html.setAttribute('data-color-scheme', prefs.colorScheme);
    } else {
      html.removeAttribute('data-color-scheme');
    }

    // Apply focus indicators
    if (prefs.focusIndicators) {
      body.classList.add('show-focus-indicators');
    } else {
      body.classList.remove('show-focus-indicators');
    }

    // Apply accessibility classes
    if (prefs.screenReader) {
      body.classList.add('screen-reader-active');
    } else {
      body.classList.remove('screen-reader-active');
    }

    if (prefs.keyboardOnly) {
      body.classList.add('keyboard-only');
    } else {
      body.classList.remove('keyboard-only');
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<A11yUserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };

      // Debounce localStorage updates
      if (preferencesTimeoutRef.current) {
        clearTimeout(preferencesTimeoutRef.current);
      }

      preferencesTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(A11Y_CONSTANTS.STORAGE.PREFERENCES, JSON.stringify(updated));
      }, 500);

      return updated;
    });
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    const resetPrefs = { ...DEFAULT_A11Y_PREFERENCES, language };
    setPreferences(resetPrefs);
    localStorage.removeItem(A11Y_CONSTANTS.STORAGE.PREFERENCES);
  }, [language]);

  // Enhanced announce function with context
  const contextualAnnounce = useCallback((announcement: ScreenReaderAnnouncement) => {
    if (!preferences.announcements) return;

    announce({
      ...announcement,
      language: announcement.language || preferences.language
    });
  }, [announce, preferences.announcements, preferences.language]);

  // Context value
  const contextValue: A11yContextType = {
    // Current state
    preferences,
    isScreenReaderActive,
    isKeyboardUser,
    isHighContrast,
    language: preferences.language,

    // Utilities
    announce: contextualAnnounce,
    announcePolite: (message) => {
      if (preferences.announcements) {
        announcePolite(message);
      }
    },
    announceAssertive: (message) => {
      if (preferences.announcements) {
        announceAssertive(message);
      }
    },
    getA11yLabel: (labels, type) => getLabel(labels, type),

    // Focus management
    focusElement: (element, options) => focusElement({ ...options }),
    trapFocus,
    restoreFocus,
    skipToContent,

    // Keyboard navigation
    setupKeyboardNav,
    handleArrowKeys,

    // Preferences
    updatePreferences,
    resetPreferences,

    // Testing
    runA11yTests: runTests,
    validateWCAG
  };

  // Initialize accessibility features
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    // Apply initial preferences
    applyPreferences(preferences);

    // Detect user patterns
    const cleanup = detectUserPatterns();

    // Start monitoring if enabled
    if (enableMonitoring) {
      startMonitoring();
    }

    // Run initial tests if enabled
    if (enableAutoTesting) {
      setTimeout(() => runTests(), 1000);
    }

    // Setup global accessibility features
    setupGlobalA11yFeatures();

    return () => {
      cleanup();
      if (enableMonitoring) {
        stopMonitoring();
      }
    };
  }, [
    applyPreferences,
    detectUserPatterns,
    enableMonitoring,
    enableAutoTesting,
    preferences,
    startMonitoring,
    stopMonitoring,
    runTests
  ]);

  // Apply preferences when they change
  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences, applyPreferences]);

  // Setup global accessibility features
  const setupGlobalA11yFeatures = useCallback(() => {
    // Add global skip links if they don't exist
    if (!document.querySelector('.skip-navigation')) {
      const skipNav = document.createElement('div');
      skipNav.className = 'skip-navigation';
      skipNav.innerHTML = `
        <a href="#main" class="skip-link">${getA11yText('labels.skipToContent')}</a>
        <a href="#navigation" class="skip-link">${getA11yText('labels.skipToNavigation')}</a>
      `;
      document.body.insertBefore(skipNav, document.body.firstChild);
    }

    // Ensure main landmarks exist
    if (!document.querySelector('main, [role="main"]')) {
      const main = document.querySelector('#main, .main-content, .content');
      if (main) {
        main.setAttribute('role', 'main');
      }
    }

    // Add language attribute if missing
    if (!document.documentElement.hasAttribute('lang')) {
      document.documentElement.setAttribute('lang', preferences.language);
    }

    // Setup global keyboard event handlers
    document.addEventListener('keydown', (event) => {
      // Global escape handler
      if (event.key === 'Escape') {
        // Close any open modals/dialogs
        const openDialogs = document.querySelectorAll('[role="dialog"][aria-hidden="false"], .modal.open');
        openDialogs.forEach(dialog => {
          const closeButton = dialog.querySelector('[data-dismiss], .close, [aria-label*="close"]');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });
      }
    });

    // Announce page ready
    setTimeout(() => {
      contextualAnnounce({
        message: {
          de: 'Seite geladen und bereit',
          en: 'Page loaded and ready'
        },
        priority: 'polite'
      });
    }, 1000);
  }, [getA11yText, preferences.language, contextualAnnounce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preferencesTimeoutRef.current) {
        clearTimeout(preferencesTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Hook to use accessibility context
export function useAccessibility(): A11yContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Higher-order component for accessibility
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const a11y = useAccessibility();

    return (
      <Component
        {...props}
        a11y={a11y}
      />
    );
  };

  WrappedComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default AccessibilityProvider;