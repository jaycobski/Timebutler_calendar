/**
 * Accessibility Hooks Index
 * Comprehensive accessibility system exports
 */

// Core accessibility hooks
export { useA11yLabels, createBilingualContent, mergeAriaAttributes } from './useA11yLabels';
export { useKeyboardNavigation, useRovingTabIndex, useGridNavigation } from './useKeyboardNavigation';
export { useFocusManagement, useModalFocusManagement, useFocusAnnouncements } from './useFocusManagement';
export { useScreenReader, useLoadingAnnouncements, useFormAnnouncements } from './useScreenReader';
export { useA11yTesting, createTestSummary, getSeverityColor, formatContrastRatio } from './useA11yTesting';
export { useWCAGCompliance, getComplianceSummary, getPriorityFixes } from './useWCAGCompliance';

// Main accessibility provider
export { default as AccessibilityProvider, useAccessibility, withAccessibility } from './AccessibilityProvider';

// Components
export { default as SkipNavigation, useSkipNavigation } from '../components/SkipNavigation';
export { default as AccessibleLandmarks, useLandmarks } from '../components/AccessibleLandmarks';

// Language system (existing)
export { useLanguage } from './useLanguage';
export { LanguageProvider, useLanguageContext, withLanguage } from './LanguageProvider';

// Re-export types for convenience
export type {
  A11yContextType,
  A11yUserPreferences,
  AriaAttributes,
  BilingualA11yContent,
  FocusConfig,
  KeyboardNavConfig,
  ScreenReaderAnnouncement,
  A11yTestResult,
  LandmarkConfig,
  SkipLinkConfig
} from '../types/accessibility';

export type {
  SupportedLanguage,
  LanguageInfo,
  UseLanguageReturn
} from '../types/language';