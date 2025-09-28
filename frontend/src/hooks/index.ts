/**
 * Hooks Index - Central export for all React hooks
 *
 * This file provides a clean API for importing language functionality
 * and other custom hooks throughout the application.
 */

// Core Language Management
export { useLanguage } from './useLanguage';
export {
  LanguageProvider,
  useLanguageContext,
  withLanguage,
  LanguageSwitch,
  LanguageLoading,
  Translation,
} from './LanguageProvider';

// Performance Optimization - Disabled for deployment
// export {
//   useLanguageOptimization,
//   LanguagePerformanceMonitor,
// } from './useLanguageOptimization';

// Next.js Integration - Disabled for deployment
// export {
//   useNextI18nIntegration,
//   withNextI18n,
//   LanguageSEO,
// } from './useNextI18nIntegration';

// Re-export types for easy access
export type {
  SupportedLanguage,
  LanguageInfo,
  BrowserLanguageInfo,
  LanguagePreferences,
  TranslationLoadingState,
  LanguagePerformanceMetrics,
  LanguageSwitchOptions,
  UseLanguageReturn,
  LanguageContextType,
  CulturalFormatting,
  LanguageConfig,
} from '../types/language';

// Re-export constants
export {
  LANGUAGE_CONSTANTS,
  LANGUAGE_INFO,
} from '../types/language';

// Re-export error classes
export {
  LanguageError,
  TranslationLoadError,
  LanguageDetectionError,
} from '../types/language';