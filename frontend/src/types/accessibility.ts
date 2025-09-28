/**
 * Accessibility System Types
 * Comprehensive type definitions for WCAG 2.1 Level AA compliance and accessibility features
 */

import type { SupportedLanguage } from './language';

// ARIA roles and properties
export type AriaRole =
  | 'alert' | 'alertdialog' | 'application' | 'article' | 'banner' | 'button'
  | 'cell' | 'checkbox' | 'columnheader' | 'combobox' | 'complementary'
  | 'contentinfo' | 'dialog' | 'document' | 'feed' | 'figure' | 'form'
  | 'grid' | 'gridcell' | 'group' | 'heading' | 'img' | 'link' | 'list'
  | 'listbox' | 'listitem' | 'log' | 'main' | 'marquee' | 'math' | 'menu'
  | 'menubar' | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
  | 'navigation' | 'none' | 'note' | 'option' | 'presentation' | 'progressbar'
  | 'radio' | 'radiogroup' | 'region' | 'row' | 'rowgroup' | 'rowheader'
  | 'scrollbar' | 'search' | 'searchbox' | 'separator' | 'slider' | 'spinbutton'
  | 'status' | 'switch' | 'tab' | 'table' | 'tablist' | 'tabpanel' | 'term'
  | 'textbox' | 'timer' | 'toolbar' | 'tooltip' | 'tree' | 'treegrid'
  | 'treeitem';

export type AriaLiveRegion = 'off' | 'polite' | 'assertive';
export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all';
export type AriaSort = 'none' | 'ascending' | 'descending' | 'other';
export type AriaOrientation = 'horizontal' | 'vertical';
export type AriaDropEffect = 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';

// Basic ARIA attributes interface
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
  'aria-checked'?: boolean | 'mixed';
  'aria-selected'?: boolean;
  'aria-pressed'?: boolean | 'mixed';
  'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-live'?: AriaLiveRegion;
  'aria-atomic'?: boolean;
  'aria-relevant'?: AriaRelevant;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-flowto'?: string;
  'aria-activedescendant'?: string;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-level'?: number;
  'aria-sort'?: AriaSort;
  'aria-orientation'?: AriaOrientation;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-dropeffect'?: AriaDropEffect;
  'aria-grabbed'?: boolean;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-multiline'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-readonly'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-colcount'?: number;
  'aria-colindex'?: number;
  'aria-colspan'?: number;
  'aria-rowcount'?: number;
  'aria-rowindex'?: number;
  'aria-rowspan'?: number;
  role?: AriaRole;
}

// Bilingual accessibility content
export interface BilingualA11yContent {
  de: string;
  en: string;
}

// Enhanced ARIA labels with bilingual support
export interface A11yLabels {
  label?: BilingualA11yContent;
  description?: BilingualA11yContent;
  hint?: BilingualA11yContent;
  error?: BilingualA11yContent;
  success?: BilingualA11yContent;
  warning?: BilingualA11yContent;
  loading?: BilingualA11yContent;
  instructions?: BilingualA11yContent;
}

// Keyboard navigation configuration
export interface KeyboardNavConfig {
  enabled: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
  skipNavigation?: boolean;
  customHandlers?: Record<string, (event: KeyboardEvent) => void>;
  arrowKeyNavigation?: boolean;
  homeEndNavigation?: boolean;
  escapeHandler?: () => void;
  enterHandler?: () => void;
  spaceHandler?: () => void;
  tabHandler?: (event: KeyboardEvent) => void;
}

// Focus management configuration
export interface FocusConfig {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  skipLinks?: boolean;
  focusRing?: boolean;
  highContrast?: boolean;
  announcement?: BilingualA11yContent;
}

// Screen reader announcement options
export interface ScreenReaderAnnouncement {
  message: BilingualA11yContent;
  priority: AriaLiveRegion;
  interrupt?: boolean;
  delay?: number;
  repeatCount?: number;
  language?: SupportedLanguage;
}

// Live region configuration
export interface LiveRegionConfig {
  id: string;
  priority: AriaLiveRegion;
  atomic?: boolean;
  relevant?: AriaRelevant;
  busy?: boolean;
  hidden?: boolean;
  language?: SupportedLanguage;
}

// Skip navigation link configuration
export interface SkipLinkConfig {
  href: string;
  label: BilingualA11yContent;
  order: number;
  visible?: boolean;
  className?: string;
}

// Landmark configuration
export interface LandmarkConfig {
  role: AriaRole;
  label?: BilingualA11yContent;
  describedBy?: string;
  level?: number;
  navigation?: boolean;
}

// Accessibility testing result
export interface A11yTestResult {
  passed: boolean;
  violations: A11yViolation[];
  warnings: A11yWarning[];
  score: number;
  level: 'A' | 'AA' | 'AAA';
  categories: A11yTestCategory[];
}

// Accessibility violation
export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yViolationNode[];
}

// Accessibility warning
export interface A11yWarning {
  id: string;
  description: string;
  suggestion: string;
  element?: string;
  impact: 'low' | 'medium' | 'high';
}

// Accessibility violation node
export interface A11yViolationNode {
  target: string[];
  html: string;
  failureSummary: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

// Accessibility test category
export interface A11yTestCategory {
  name: string;
  passed: boolean;
  score: number;
  rules: A11yTestRule[];
}

// Accessibility test rule
export interface A11yTestRule {
  id: string;
  passed: boolean;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
}

// User preferences for accessibility
export interface A11yUserPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardOnly: boolean;
  focusIndicators: boolean;
  announcements: boolean;
  language: SupportedLanguage;
  fontSize: number;
  colorScheme: 'light' | 'dark' | 'auto';
}

// Accessibility context type
export interface A11yContextType {
  // Current state
  preferences: A11yUserPreferences;
  isScreenReaderActive: boolean;
  isKeyboardUser: boolean;
  isHighContrast: boolean;
  language: SupportedLanguage;

  // Utilities
  announce: (announcement: ScreenReaderAnnouncement) => void;
  announcePolite: (message: BilingualA11yContent) => void;
  announceAssertive: (message: BilingualA11yContent) => void;
  getA11yLabel: (labels: A11yLabels, type: keyof A11yLabels) => string;

  // Focus management
  focusElement: (element: HTMLElement, options?: FocusConfig) => void;
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  skipToContent: () => void;

  // Keyboard navigation
  setupKeyboardNav: (element: HTMLElement, config: KeyboardNavConfig) => () => void;
  handleArrowKeys: (event: KeyboardEvent, items: HTMLElement[]) => void;

  // Preferences
  updatePreferences: (preferences: Partial<A11yUserPreferences>) => void;
  resetPreferences: () => void;

  // Testing
  runA11yTests: (element?: HTMLElement) => Promise<A11yTestResult>;
  validateWCAG: (level: 'A' | 'AA' | 'AAA') => Promise<boolean>;
}

// Hook return types
export interface UseA11yLabelsReturn {
  getLabel: (labels: A11yLabels, type: keyof A11yLabels, fallback?: string) => string;
  getAriaAttributes: (labels: A11yLabels, config?: AriaAttributes) => AriaAttributes;
  formatMessage: (template: BilingualA11yContent, variables?: Record<string, any>) => string;
}

export interface UseKeyboardNavReturn {
  keyboardProps: {
    onKeyDown: (event: KeyboardEvent) => void;
    tabIndex: number;
    role?: AriaRole;
  };
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  focusItem: (index: number) => void;
  resetNavigation: () => void;
}

export interface UseFocusManagementReturn {
  focusProps: {
    ref: React.RefObject<HTMLElement>;
    tabIndex: number;
    'aria-describedby'?: string;
  };
  isFocused: boolean;
  focus: () => void;
  blur: () => void;
  trapFocus: () => () => void;
  restoreFocus: () => void;
}

export interface UseScreenReaderReturn {
  announce: (message: BilingualA11yContent, priority?: AriaLiveRegion) => void;
  announcePolite: (message: BilingualA11yContent) => void;
  announceAssertive: (message: BilingualA11yContent) => void;
  isActive: boolean;
  liveRegionProps: {
    'aria-live': AriaLiveRegion;
    'aria-atomic': boolean;
    'aria-relevant': AriaRelevant;
    role: 'status' | 'alert' | 'log';
  };
}

export interface UseA11yTestingReturn {
  runTests: (element?: HTMLElement) => Promise<A11yTestResult>;
  validateContrast: (foreground: string, background: string) => boolean;
  validateHeadingStructure: (container?: HTMLElement) => boolean;
  validateLandmarks: (container?: HTMLElement) => boolean;
  validateKeyboardNav: (container?: HTMLElement) => Promise<boolean>;
  generateReport: () => string;
}

// Component accessibility props
export interface A11yComponentProps {
  // ARIA attributes
  ariaLabel?: BilingualA11yContent;
  ariaDescription?: BilingualA11yContent;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
  ariaHidden?: boolean;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  ariaChecked?: boolean;
  ariaCurrent?: string;

  // Role and landmarks
  role?: AriaRole;
  landmark?: LandmarkConfig;

  // Keyboard navigation
  keyboardNav?: KeyboardNavConfig;
  focusManagement?: FocusConfig;

  // Screen reader
  screenReaderText?: BilingualA11yContent;
  announcements?: ScreenReaderAnnouncement[];

  // Skip links
  skipLinks?: SkipLinkConfig[];

  // Testing
  testId?: string;
  a11yTestMode?: boolean;
}

// Error types
export class A11yError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'A11yError';
  }
}

export class ScreenReaderError extends A11yError {
  constructor(details?: string) {
    super(
      `Screen reader operation failed${details ? ` - ${details}` : ''}`,
      'SCREEN_READER_ERROR',
      { details }
    );
  }
}

export class KeyboardNavError extends A11yError {
  constructor(details?: string) {
    super(
      `Keyboard navigation failed${details ? ` - ${details}` : ''}`,
      'KEYBOARD_NAV_ERROR',
      { details }
    );
  }
}

export class A11yTestError extends A11yError {
  constructor(details?: string) {
    super(
      `Accessibility test failed${details ? ` - ${details}` : ''}`,
      'A11Y_TEST_ERROR',
      { details }
    );
  }
}

// Constants
export const A11Y_CONSTANTS = {
  // WCAG 2.1 Level AA requirements
  WCAG: {
    CONTRAST_RATIOS: {
      NORMAL_TEXT: 4.5,
      LARGE_TEXT: 3.0,
      UI_COMPONENTS: 3.0,
      ENHANCED_NORMAL: 7.0,
      ENHANCED_LARGE: 4.5,
    },
    TIMING: {
      NO_TIMING: false,
      ADJUSTABLE_TIMING: true,
      ESSENTIAL_TIMING: 20, // hours
    },
    SEIZURES: {
      FLASH_THRESHOLD: 3, // flashes per second
    },
    TEXT_SIZE: {
      MIN_SIZE: 16, // pixels
      MAX_ZOOM: 200, // percent
    },
  },

  // Keyboard navigation
  KEYBOARD: {
    KEYS: {
      TAB: 'Tab',
      ENTER: 'Enter',
      SPACE: ' ',
      ESCAPE: 'Escape',
      ARROW_UP: 'ArrowUp',
      ARROW_DOWN: 'ArrowDown',
      ARROW_LEFT: 'ArrowLeft',
      ARROW_RIGHT: 'ArrowRight',
      HOME: 'Home',
      END: 'End',
      PAGE_UP: 'PageUp',
      PAGE_DOWN: 'PageDown',
    },
    FOCUS_RING: {
      WIDTH: '2px',
      STYLE: 'solid',
      OFFSET: '2px',
      COLOR: '#0066cc',
    },
  },

  // Screen reader
  SCREEN_READER: {
    ANNOUNCEMENT_DELAY: 100, // milliseconds
    REPEAT_DELAY: 1000, // milliseconds
    MAX_MESSAGE_LENGTH: 200, // characters
    PRIORITY_TIMEOUT: {
      polite: 0,
      assertive: 50,
      off: 0,
    },
  },

  // Live regions
  LIVE_REGIONS: {
    IDS: {
      ANNOUNCEMENTS: 'sr-announcements',
      STATUS: 'sr-status',
      ERRORS: 'sr-errors',
      NAVIGATION: 'sr-navigation',
    },
    CLEANUP_DELAY: 3000, // milliseconds
  },

  // Testing
  TESTING: {
    TIMEOUT: 5000, // milliseconds
    RETRY_COUNT: 3,
    MIN_SCORE: 95, // percent for AA compliance
    SELECTORS: {
      FOCUSABLE: [
        'a[href]',
        'area[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex^="-"])',
      ].join(','),
      HEADINGS: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
      LANDMARKS: '[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="region"]',
    },
  },

  // Storage keys
  STORAGE: {
    PREFERENCES: 'timebutler_a11y_preferences',
    TEST_RESULTS: 'timebutler_a11y_test_results',
    USER_SETTINGS: 'timebutler_a11y_user_settings',
  },
} as const;

// Default values
export const DEFAULT_A11Y_PREFERENCES: A11yUserPreferences = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false,
  keyboardOnly: false,
  focusIndicators: true,
  announcements: true,
  language: 'de',
  fontSize: 16,
  colorScheme: 'auto',
};

export const DEFAULT_KEYBOARD_CONFIG: KeyboardNavConfig = {
  enabled: true,
  trapFocus: false,
  autoFocus: false,
  skipNavigation: true,
  arrowKeyNavigation: true,
  homeEndNavigation: true,
};

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  autoFocus: false,
  restoreFocus: true,
  trapFocus: false,
  skipLinks: true,
  focusRing: true,
  highContrast: false,
};