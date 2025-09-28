/**
 * Focus Management Hook
 * Provides comprehensive focus management with WCAG 2.1 compliance
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FocusConfig,
  UseFocusManagementReturn,
  BilingualA11yContent
} from '../types/accessibility';
import { A11Y_CONSTANTS } from '../types/accessibility';
import { trapFocusWithinElement } from './useKeyboardNavigation';

interface FocusHistoryEntry {
  element: HTMLElement;
  timestamp: number;
  reason: string;
}

export function useFocusManagement(
  config: FocusConfig = {}
): UseFocusManagementReturn {
  const elementRef = useRef<HTMLElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [focusHistory, setFocusHistory] = useState<FocusHistoryEntry[]>([]);
  const trapCleanupRef = useRef<(() => void) | null>(null);
  const originalFocusRef = useRef<HTMLElement | null>(null);

  // Merge with default configuration
  const mergedConfig: FocusConfig = {
    autoFocus: false,
    restoreFocus: true,
    trapFocus: false,
    skipLinks: true,
    focusRing: true,
    highContrast: false,
    ...config
  };

  // Add focus history entry
  const addToFocusHistory = useCallback((element: HTMLElement, reason: string) => {
    setFocusHistory(prev => [
      ...prev.slice(-9), // Keep last 10 entries
      {
        element,
        timestamp: Date.now(),
        reason
      }
    ]);
  }, []);

  // Focus the element
  const focus = useCallback((options?: {
    reason?: string;
    preventScroll?: boolean;
    announcement?: BilingualA11yContent;
  }) => {
    if (!elementRef.current) return;

    const reason = options?.reason || 'programmatic';

    // Store original focus if this is the first focus
    if (!originalFocusRef.current && document.activeElement instanceof HTMLElement) {
      originalFocusRef.current = document.activeElement;
    }

    elementRef.current.focus({
      preventScroll: options?.preventScroll || false
    });

    setIsFocused(true);
    addToFocusHistory(elementRef.current, reason);

    // Announce to screen readers if provided
    if (options?.announcement) {
      announceToScreenReader(options.announcement);
    }
  }, [addToFocusHistory]);

  // Blur the element
  const blur = useCallback(() => {
    if (!elementRef.current) return;

    elementRef.current.blur();
    setIsFocused(false);
  }, []);

  // Trap focus within element
  const trapFocus = useCallback(() => {
    if (!elementRef.current || !mergedConfig.trapFocus) {
      return () => {};
    }

    // Store original focus
    if (document.activeElement instanceof HTMLElement) {
      originalFocusRef.current = document.activeElement;
    }

    // Setup focus trap
    const cleanup = trapFocusWithinElement(elementRef.current);
    trapCleanupRef.current = cleanup;

    // Focus first focusable element
    const focusableElements = Array.from(
      elementRef.current.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE)
    ) as HTMLElement[];

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      cleanup();
      trapCleanupRef.current = null;
    };
  }, [mergedConfig.trapFocus]);

  // Restore focus to previous element
  const restoreFocus = useCallback(() => {
    if (!mergedConfig.restoreFocus) return;

    // Try to restore to original focus first
    if (originalFocusRef.current && document.contains(originalFocusRef.current)) {
      originalFocusRef.current.focus();
      originalFocusRef.current = null;
      return;
    }

    // Try to restore from focus history
    for (let i = focusHistory.length - 1; i >= 0; i--) {
      const entry = focusHistory[i];
      if (document.contains(entry.element)) {
        entry.element.focus();
        addToFocusHistory(entry.element, 'restored');
        return;
      }
    }

    // Fallback to body or main content
    const main = document.querySelector('main') || document.body;
    if (main instanceof HTMLElement) {
      main.focus();
    }
  }, [mergedConfig.restoreFocus, focusHistory, addToFocusHistory]);

  // Skip to main content
  const skipToContent = useCallback(() => {
    const main = document.querySelector('main, [role="main"], #main');
    if (main instanceof HTMLElement) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      addToFocusHistory(main, 'skip-link');
    }
  }, [addToFocusHistory]);

  // Skip to navigation
  const skipToNavigation = useCallback(() => {
    const nav = document.querySelector('nav, [role="navigation"], #navigation');
    if (nav instanceof HTMLElement) {
      nav.focus();
      nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      addToFocusHistory(nav, 'skip-link');
    }
  }, [addToFocusHistory]);

  // Focus first error in form
  const focusFirstError = useCallback(() => {
    const errors = Array.from(
      document.querySelectorAll('[aria-invalid="true"], .error, [data-error]')
    ) as HTMLElement[];

    for (const error of errors) {
      if (error.offsetParent !== null) { // Check if visible
        error.focus();
        error.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addToFocusHistory(error, 'error-focus');
        return true;
      }
    }

    return false;
  }, [addToFocusHistory]);

  // Focus visible element by selector
  const focusBySelector = useCallback((selector: string, reason = 'selector') => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.offsetParent !== null) {
      element.focus();
      addToFocusHistory(element, reason);
      return true;
    }
    return false;
  }, [addToFocusHistory]);

  // Announce to screen reader
  const announceToScreenReader = useCallback((announcement: BilingualA11yContent) => {
    // This will be implemented in the screen reader hook
    // For now, just log the announcement
    console.log('SR Announcement:', announcement);
  }, []);

  // Handle focus events
  const handleFocus = useCallback((event: FocusEvent) => {
    setIsFocused(true);

    if (event.target instanceof HTMLElement) {
      addToFocusHistory(event.target, 'user-focus');
    }
  }, [addToFocusHistory]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Setup focus event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [handleFocus, handleBlur]);

  // Auto focus on mount
  useEffect(() => {
    if (mergedConfig.autoFocus && elementRef.current) {
      setTimeout(() => focus({ reason: 'auto-focus' }), 100);
    }
  }, [mergedConfig.autoFocus, focus]);

  // Cleanup focus trap on unmount
  useEffect(() => {
    return () => {
      if (trapCleanupRef.current) {
        trapCleanupRef.current();
      }
    };
  }, []);

  // Generate focus props
  const focusProps = {
    ref: elementRef,
    tabIndex: mergedConfig.autoFocus ? 0 : -1,
    'aria-describedby': undefined as string | undefined,
    onFocus: handleFocus,
    onBlur: handleBlur
  };

  // Add description ID if announcement is provided
  if (mergedConfig.announcement) {
    const descriptionId = `focus-desc-${Math.random().toString(36).substr(2, 9)}`;
    focusProps['aria-describedby'] = descriptionId;
  }

  return {
    focusProps,
    isFocused,
    focus,
    blur,
    trapFocus,
    restoreFocus,
    skipToContent,
    skipToNavigation,
    focusFirstError,
    focusBySelector,
    focusHistory,
    elementRef
  };
}

// Hook for managing focus within a specific context (like modals)
export function useModalFocusManagement(isOpen: boolean) {
  const modalRef = useRef<HTMLElement>(null);
  const originalFocusRef = useRef<HTMLElement | null>(null);
  const trapCleanupRef = useRef<(() => void) | null>(null);

  const trapFocus = useCallback(() => {
    if (!modalRef.current) return;

    // Store the currently focused element
    if (document.activeElement instanceof HTMLElement) {
      originalFocusRef.current = document.activeElement;
    }

    // Setup focus trap
    const cleanup = trapFocusWithinElement(modalRef.current);
    trapCleanupRef.current = cleanup;

    // Focus the first focusable element in the modal
    const focusableElements = Array.from(
      modalRef.current.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE)
    ) as HTMLElement[];

    if (focusableElements.length > 0) {
      setTimeout(() => {
        focusableElements[0].focus();
      }, 100);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    // Cleanup focus trap
    if (trapCleanupRef.current) {
      trapCleanupRef.current();
      trapCleanupRef.current = null;
    }

    // Restore focus to the original element
    if (originalFocusRef.current && document.contains(originalFocusRef.current)) {
      originalFocusRef.current.focus();
      originalFocusRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      trapFocus();
    } else {
      restoreFocus();
    }

    return () => {
      if (trapCleanupRef.current) {
        trapCleanupRef.current();
      }
    };
  }, [isOpen, trapFocus, restoreFocus]);

  return {
    modalRef,
    trapFocus,
    restoreFocus
  };
}

// Hook for managing focus announcements
export function useFocusAnnouncements(language: 'de' | 'en') {
  const announceRef = useRef<HTMLElement | null>(null);

  const announceChange = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) {
      // Create announcement element if it doesn't exist
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
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
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    // Clear previous message and set new one
    announceRef.current.textContent = '';
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  return { announceChange };
}

// Utility functions
export function isElementFocused(element: HTMLElement): boolean {
  return document.activeElement === element;
}

export function isElementFocusable(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    !element.hasAttribute('disabled') &&
    element.tabIndex >= 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetParent !== null
  );
}

export function getFocusableAncestor(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;
  while (current) {
    if (isElementFocusable(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function createFocusIndicator(element: HTMLElement, config: {
  color?: string;
  width?: string;
  style?: string;
  offset?: string;
} = {}) {
  const {
    color = A11Y_CONSTANTS.KEYBOARD.FOCUS_RING.COLOR,
    width = A11Y_CONSTANTS.KEYBOARD.FOCUS_RING.WIDTH,
    style = A11Y_CONSTANTS.KEYBOARD.FOCUS_RING.STYLE,
    offset = A11Y_CONSTANTS.KEYBOARD.FOCUS_RING.OFFSET
  } = config;

  element.style.outline = `${width} ${style} ${color}`;
  element.style.outlineOffset = offset;
}

export function removeFocusIndicator(element: HTMLElement) {
  element.style.outline = '';
  element.style.outlineOffset = '';
}