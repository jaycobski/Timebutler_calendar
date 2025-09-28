/**
 * Keyboard Navigation Hook
 * Provides comprehensive keyboard navigation utilities with WCAG 2.1 compliance
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type {
  KeyboardNavConfig,
  UseKeyboardNavReturn,
  AriaRole,
  SupportedLanguage
} from '../types/accessibility';
import { A11Y_CONSTANTS } from '../types/accessibility';

interface KeyboardNavItem {
  element: HTMLElement;
  index: number;
  disabled?: boolean;
  hidden?: boolean;
}

export function useKeyboardNavigation(
  config: KeyboardNavConfig = { enabled: true }
): UseKeyboardNavReturn {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [items, setItems] = useState<KeyboardNavItem[]>([]);
  const containerRef = useRef<HTMLElement>(null);
  const isNavigatingRef = useRef(false);

  // Merge with default configuration
  const mergedConfig = useMemo(() => ({
    enabled: true,
    trapFocus: false,
    autoFocus: false,
    skipNavigation: true,
    arrowKeyNavigation: true,
    homeEndNavigation: true,
    ...config
  }), [config]);

  // Get focusable elements within container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const selector = A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE;
    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];

    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        !element.disabled &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.tabIndex !== -1 &&
        element.offsetParent !== null
      );
    });
  }, []);

  // Update items list
  const updateItems = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    const newItems: KeyboardNavItem[] = focusableElements.map((element, index) => ({
      element,
      index,
      disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
      hidden: element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true'
    }));

    setItems(newItems);
  }, [getFocusableElements]);

  // Focus specific item
  const focusItem = useCallback((index: number) => {
    const item = items[index];
    if (!item || item.disabled || item.hidden) return;

    item.element.focus();
    setCurrentIndex(index);
    isNavigatingRef.current = true;

    // Clear navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [items]);

  // Navigate to next item
  const navigateToNext = useCallback(() => {
    const availableItems = items.filter(item => !item.disabled && !item.hidden);
    if (availableItems.length === 0) return;

    const currentItemIndex = availableItems.findIndex(item => item.index === currentIndex);
    const nextIndex = (currentItemIndex + 1) % availableItems.length;
    focusItem(availableItems[nextIndex].index);
  }, [items, currentIndex, focusItem]);

  // Navigate to previous item
  const navigateToPrevious = useCallback(() => {
    const availableItems = items.filter(item => !item.disabled && !item.hidden);
    if (availableItems.length === 0) return;

    const currentItemIndex = availableItems.findIndex(item => item.index === currentIndex);
    const prevIndex = currentItemIndex <= 0
      ? availableItems.length - 1
      : currentItemIndex - 1;
    focusItem(availableItems[prevIndex].index);
  }, [items, currentIndex, focusItem]);

  // Navigate to first item
  const navigateToFirst = useCallback(() => {
    const availableItems = items.filter(item => !item.disabled && !item.hidden);
    if (availableItems.length === 0) return;
    focusItem(availableItems[0].index);
  }, [items, focusItem]);

  // Navigate to last item
  const navigateToLast = useCallback(() => {
    const availableItems = items.filter(item => !item.disabled && !item.hidden);
    if (availableItems.length === 0) return;
    focusItem(availableItems[availableItems.length - 1].index);
  }, [items, focusItem]);

  // Handle arrow key navigation
  const handleArrowKeys = useCallback((event: KeyboardEvent, itemsArray?: HTMLElement[]) => {
    if (!mergedConfig.arrowKeyNavigation) return;

    const targetItems = itemsArray || items.map(item => item.element);
    if (targetItems.length === 0) return;

    switch (event.key) {
      case A11Y_CONSTANTS.KEYBOARD.KEYS.ARROW_DOWN:
      case A11Y_CONSTANTS.KEYBOARD.KEYS.ARROW_RIGHT:
        event.preventDefault();
        navigateToNext();
        break;
      case A11Y_CONSTANTS.KEYBOARD.KEYS.ARROW_UP:
      case A11Y_CONSTANTS.KEYBOARD.KEYS.ARROW_LEFT:
        event.preventDefault();
        navigateToPrevious();
        break;
      case A11Y_CONSTANTS.KEYBOARD.KEYS.HOME:
        if (mergedConfig.homeEndNavigation) {
          event.preventDefault();
          navigateToFirst();
        }
        break;
      case A11Y_CONSTANTS.KEYBOARD.KEYS.END:
        if (mergedConfig.homeEndNavigation) {
          event.preventDefault();
          navigateToLast();
        }
        break;
    }
  }, [mergedConfig, items, navigateToNext, navigateToPrevious, navigateToFirst, navigateToLast]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!mergedConfig.enabled) return;

    const { key } = event;

    // Handle custom handlers first
    if (mergedConfig.customHandlers?.[key]) {
      mergedConfig.customHandlers[key](event);
      return;
    }

    // Handle escape
    if (key === A11Y_CONSTANTS.KEYBOARD.KEYS.ESCAPE && mergedConfig.escapeHandler) {
      event.preventDefault();
      mergedConfig.escapeHandler();
      return;
    }

    // Handle enter
    if (key === A11Y_CONSTANTS.KEYBOARD.KEYS.ENTER && mergedConfig.enterHandler) {
      mergedConfig.enterHandler();
      return;
    }

    // Handle space
    if (key === A11Y_CONSTANTS.KEYBOARD.KEYS.SPACE && mergedConfig.spaceHandler) {
      event.preventDefault();
      mergedConfig.spaceHandler();
      return;
    }

    // Handle tab for focus trapping
    if (key === A11Y_CONSTANTS.KEYBOARD.KEYS.TAB && mergedConfig.trapFocus) {
      if (mergedConfig.tabHandler) {
        mergedConfig.tabHandler(event);
      } else {
        handleTabTrapping(event);
      }
      return;
    }

    // Handle arrow keys
    handleArrowKeys(event);
  }, [mergedConfig, handleArrowKeys]);

  // Handle tab trapping
  const handleTabTrapping = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift+Tab: move to previous element
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move to next element
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  // Reset navigation
  const resetNavigation = useCallback(() => {
    setCurrentIndex(-1);
    updateItems();
  }, [updateItems]);

  // Setup keyboard navigation
  const setupKeyboardNav = useCallback((element: HTMLElement, navConfig?: KeyboardNavConfig) => {
    containerRef.current = element;

    const config = navConfig ? { ...mergedConfig, ...navConfig } : mergedConfig;

    // Update items when element is set
    setTimeout(updateItems, 0);

    // Add event listener
    const keyDownHandler = (event: KeyboardEvent) => {
      // Temporarily override config if provided
      if (navConfig) {
        const originalConfig = mergedConfig;
        Object.assign(mergedConfig, navConfig);
        handleKeyDown(event);
        Object.assign(mergedConfig, originalConfig);
      } else {
        handleKeyDown(event);
      }
    };

    element.addEventListener('keydown', keyDownHandler);

    // Auto focus if requested
    if (config.autoFocus) {
      setTimeout(() => {
        const focusableElements = getFocusableElements(element);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          setCurrentIndex(0);
        }
      }, 100);
    }

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', keyDownHandler);
    };
  }, [mergedConfig, updateItems, handleKeyDown, getFocusableElements]);

  // Update items when container changes
  useEffect(() => {
    if (containerRef.current) {
      updateItems();
    }
  }, [updateItems]);

  // Determine tab index and role
  const getKeyboardProps = useCallback((role?: AriaRole) => {
    const tabIndex = mergedConfig.enabled ? 0 : -1;

    const props: {
      onKeyDown: (event: KeyboardEvent) => void;
      tabIndex: number;
      role?: AriaRole;
    } = {
      onKeyDown: handleKeyDown,
      tabIndex
    };

    if (role) {
      props.role = role;
    }

    return props;
  }, [mergedConfig.enabled, handleKeyDown]);

  return {
    keyboardProps: getKeyboardProps(),
    currentIndex,
    setCurrentIndex,
    focusItem,
    resetNavigation,
    setupKeyboardNav: setupKeyboardNav,
    handleArrowKeys,
    navigateToNext,
    navigateToPrevious,
    navigateToFirst,
    navigateToLast,
    updateItems,
    items: items.map(item => item.element),
    isNavigating: isNavigatingRef.current
  };
}

// Hook for roving tabindex pattern
export function useRovingTabIndex(items: HTMLElement[], orientation: 'horizontal' | 'vertical' = 'horizontal') {
  const [activeIndex, setActiveIndex] = useState(0);

  const updateTabIndices = useCallback(() => {
    items.forEach((item, index) => {
      item.tabIndex = index === activeIndex ? 0 : -1;
    });
  }, [items, activeIndex]);

  const handleKeyDown = useCallback((event: KeyboardEvent, index: number) => {
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case prevKey:
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  }, [orientation, items.length]);

  useEffect(() => {
    updateTabIndices();
    if (items[activeIndex]) {
      items[activeIndex].focus();
    }
  }, [activeIndex, updateTabIndices, items]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    updateTabIndices
  };
}

// Hook for grid navigation
export function useGridNavigation(
  rows: number,
  cols: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0);

  const activeIndex = activeRow * cols + activeCol;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setActiveRow((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActiveRow((prev) => Math.min(rows - 1, prev + 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setActiveCol((prev) => Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setActiveCol((prev) => Math.min(cols - 1, prev + 1));
        break;
      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          setActiveRow(0);
          setActiveCol(0);
        } else {
          setActiveCol(0);
        }
        break;
      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          setActiveRow(rows - 1);
          setActiveCol(cols - 1);
        } else {
          setActiveCol(cols - 1);
        }
        break;
      case 'PageUp':
        event.preventDefault();
        setActiveRow(0);
        break;
      case 'PageDown':
        event.preventDefault();
        setActiveRow(rows - 1);
        break;
    }
  }, [rows, cols]);

  return {
    activeRow,
    activeCol,
    activeIndex,
    setActiveRow,
    setActiveCol,
    handleKeyDown
  };
}

// Utility functions
export function isFocusable(element: HTMLElement): boolean {
  const selector = A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE;
  const focusableElements = document.querySelectorAll(selector);
  return Array.from(focusableElements).includes(element);
}

export function getNextFocusableElement(
  current: HTMLElement,
  direction: 'next' | 'previous' = 'next'
): HTMLElement | null {
  const focusableElements = Array.from(
    document.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE)
  ) as HTMLElement[];

  const currentIndex = focusableElements.indexOf(current);
  if (currentIndex === -1) return null;

  if (direction === 'next') {
    return focusableElements[currentIndex + 1] || focusableElements[0];
  } else {
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  }
}

export function trapFocusWithinElement(container: HTMLElement): () => void {
  const focusableElements = Array.from(
    container.querySelectorAll(A11Y_CONSTANTS.TESTING.SELECTORS.FOCUSABLE)
  ) as HTMLElement[];

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}