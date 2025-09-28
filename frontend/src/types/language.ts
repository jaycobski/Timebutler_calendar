/**
 * Language System Types
 * Comprehensive type definitions for the internationalization and language management system
 */

// Supported languages
export type SupportedLanguage = 'de' | 'en';

// Language metadata
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string;
  dateFormat: string;
  timeFormat: string;
  currencyFormat: string;
  numberFormat: {
    decimal: string;
    thousand: string;
  };
}

// Browser language detection result
export interface BrowserLanguageInfo {
  detected: SupportedLanguage;
  supported: boolean;
  exact: boolean;
  fallback: SupportedLanguage;
  confidence: number;
}

// Language preference storage
export interface LanguagePreferences {
  language: SupportedLanguage;
  autoDetect: boolean;
  lastDetected?: SupportedLanguage;
  userOverride: boolean;
  timestamp: number;
}

// Translation loading states
export interface TranslationLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  error?: string;
  progress?: number;
}

// Performance metrics for language operations
export interface LanguagePerformanceMetrics {
  detectionTime: number;
  loadTime: number;
  switchTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalOperations: number;
}

// Translation cache entry
export interface TranslationCacheEntry {
  data: Record<string, any>;
  timestamp: number;
  version: string;
  size: number;
  compressed: boolean;
}

// Language switching options
export interface LanguageSwitchOptions {
  force?: boolean;
  skipCache?: boolean;
  updateUrl?: boolean;
  animate?: boolean;
  callback?: (language: SupportedLanguage) => void;
}

// URL language parameter configuration
export interface UrlLanguageConfig {
  paramName: string;
  enabled: boolean;
  persist: boolean;
  override: boolean;
}

// Cultural formatting options
export interface CulturalFormatting {
  dates: {
    locale: string;
    formats: {
      short: string;
      medium: string;
      long: string;
      full: string;
    };
  };
  numbers: {
    locale: string;
    currency: string;
    decimal: number;
    grouping: boolean;
  };
  time: {
    format: '12h' | '24h';
    timezone: string;
  };
}

// Language hook return type
export interface UseLanguageReturn {
  // Current state
  language: SupportedLanguage;
  languages: Record<SupportedLanguage, LanguageInfo>;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Translation functions
  t: (key: string, variables?: Record<string, any>) => string;
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;

  // Language switching
  switchLanguage: (language: SupportedLanguage, options?: LanguageSwitchOptions) => Promise<void>;
  detectLanguage: () => Promise<BrowserLanguageInfo>;

  // Preferences
  preferences: LanguagePreferences;
  updatePreferences: (preferences: Partial<LanguagePreferences>) => void;
  resetPreferences: () => void;

  // Performance and cache
  metrics: LanguagePerformanceMetrics;
  clearCache: () => void;
  preloadLanguage: (language: SupportedLanguage) => Promise<void>;

  // Utilities
  isRtl: boolean;
  culturalFormatting: CulturalFormatting;
  getBrowserLanguages: () => string[];
  getSupportedLanguages: () => SupportedLanguage[];
}

// Language context type
export interface LanguageContextType extends UseLanguageReturn {
  // Additional context-specific methods
  registerTranslationNamespace: (namespace: string, translations: Record<string, any>) => void;
  unregisterTranslationNamespace: (namespace: string) => void;

  // Server-side rendering support
  serverLanguage?: SupportedLanguage;
  isHydrated: boolean;
}

// Language configuration
export interface LanguageConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  fallbackLanguage: SupportedLanguage;
  autoDetect: boolean;
  persistPreferences: boolean;
  urlParameter: UrlLanguageConfig;
  cacheTimeout: number;
  maxCacheSize: number;
  enableMetrics: boolean;
  enableCompression: boolean;
  translationPath: string;
}

// Error types
export class LanguageError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LanguageError';
  }
}

export class TranslationLoadError extends LanguageError {
  constructor(language: SupportedLanguage, details?: string) {
    super(
      `Failed to load translations for language: ${language}${details ? ` - ${details}` : ''}`,
      'TRANSLATION_LOAD_ERROR',
      { language, details }
    );
  }
}

export class LanguageDetectionError extends LanguageError {
  constructor(details?: string) {
    super(
      `Failed to detect browser language${details ? ` - ${details}` : ''}`,
      'LANGUAGE_DETECTION_ERROR',
      { details }
    );
  }
}

// Constants
export const LANGUAGE_CONSTANTS = {
  STORAGE_KEYS: {
    PREFERENCES: 'timebutler_language_preferences',
    CACHE: 'timebutler_translation_cache',
    METRICS: 'timebutler_language_metrics',
  },
  CACHE: {
    DEFAULT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    COMPRESSION_THRESHOLD: 1024, // 1KB
  },
  PERFORMANCE: {
    SWITCH_TIMEOUT: 100, // 100ms target
    DETECTION_TIMEOUT: 50, // 50ms target
    LOAD_TIMEOUT: 2000, // 2s timeout
  },
  URL: {
    DEFAULT_PARAM: 'lang',
    VALID_PATTERNS: /^[a-z]{2}(-[A-Z]{2})?$/,
  },
} as const;

// Default language information
export const LANGUAGE_INFO: Record<SupportedLanguage, LanguageInfo> = {
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    region: 'DE',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currencyFormat: '{amount} €',
    numberFormat: {
      decimal: ',',
      thousand: '.',
    },
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    region: 'US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currencyFormat: '€{amount}',
    numberFormat: {
      decimal: '.',
      thousand: ',',
    },
  },
};