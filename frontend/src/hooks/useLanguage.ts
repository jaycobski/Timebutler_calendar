/**
 * useLanguage Hook
 * Comprehensive language detection and switching system with performance optimization
 *
 * Features:
 * - Browser language detection
 * - User preference persistence
 * - URL-based language routing
 * - Dynamic translation loading
 * - Performance monitoring
 * - RTL/LTR support
 * - Cultural formatting
 * - Memory management
 * - Error handling
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import {
  SupportedLanguage,
  LanguageInfo,
  BrowserLanguageInfo,
  LanguagePreferences,
  TranslationLoadingState,
  LanguagePerformanceMetrics,
  TranslationCacheEntry,
  LanguageSwitchOptions,
  UseLanguageReturn,
  CulturalFormatting,
  LANGUAGE_CONSTANTS,
  LANGUAGE_INFO,
  LanguageError,
  TranslationLoadError,
  LanguageDetectionError,
} from '../types/language';

// Performance tracking utilities
class PerformanceTracker {
  private metrics: LanguagePerformanceMetrics = {
    detectionTime: 0,
    loadTime: 0,
    switchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalOperations: 0,
  };

  startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  recordDetection(time: number) {
    this.metrics.detectionTime = time;
    this.metrics.totalOperations++;
  }

  recordLoad(time: number) {
    this.metrics.loadTime = time;
  }

  recordSwitch(time: number) {
    this.metrics.switchTime = time;
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getMetrics(): LanguagePerformanceMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      detectionTime: 0,
      loadTime: 0,
      switchTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalOperations: 0,
    };
  }
}

// Translation cache manager
class TranslationCache {
  private cache: Map<string, TranslationCacheEntry> = new Map();
  private maxSize: number = LANGUAGE_CONSTANTS.CACHE.MAX_SIZE;
  private timeout: number = LANGUAGE_CONSTANTS.CACHE.DEFAULT_TIMEOUT;

  private getCacheKey(language: SupportedLanguage, namespace?: string): string {
    return `${language}${namespace ? `_${namespace}` : ''}`;
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private isExpired(entry: TranslationCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.timeout;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // If still over size limit, remove oldest entries
    let totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (const [key] of entries) {
        this.cache.delete(key);
        totalSize -= this.cache.get(key)?.size || 0;
        if (totalSize <= this.maxSize) break;
      }
    }
  }

  set(language: SupportedLanguage, data: Record<string, any>, namespace?: string) {
    const key = this.getCacheKey(language, namespace);
    const size = this.calculateSize(data);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version: '1.0', // Could be dynamic based on app version
      size,
      compressed: false, // Could implement compression for large entries
    });

    this.cleanup();
  }

  get(language: SupportedLanguage, namespace?: string): Record<string, any> | null {
    const key = this.getCacheKey(language, namespace);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      entries: this.cache.size,
      totalSize: Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.size, 0),
      oldestEntry: Math.min(
        ...Array.from(this.cache.values()).map(entry => entry.timestamp)
      ),
    };
  }
}

// Browser language detection utilities
class BrowserLanguageDetector {
  private supportedLanguages: SupportedLanguage[] = ['de', 'en'];

  private parseLanguageTag(tag: string): { language: string; region?: string } {
    const [language, region] = tag.toLowerCase().split('-');
    return { language, region };
  }

  private calculateConfidence(
    detected: string,
    supported: SupportedLanguage,
    isExact: boolean
  ): number {
    if (isExact) return 1.0;
    if (detected.startsWith(supported)) return 0.8;
    return 0.3; // Fallback confidence
  }

  detectLanguage(): BrowserLanguageInfo {
    const timer = performance.now();

    try {
      // Get browser languages in order of preference
      const browserLanguages = navigator.languages || [navigator.language];

      for (const browserLang of browserLanguages) {
        const { language } = this.parseLanguageTag(browserLang);

        // Check for exact match
        if (this.supportedLanguages.includes(language as SupportedLanguage)) {
          return {
            detected: language as SupportedLanguage,
            supported: true,
            exact: true,
            fallback: 'en',
            confidence: 1.0,
          };
        }

        // Check for partial match (e.g., 'de-AT' -> 'de')
        const partialMatch = this.supportedLanguages.find(lang =>
          language.startsWith(lang) || lang.startsWith(language)
        );

        if (partialMatch) {
          return {
            detected: partialMatch,
            supported: true,
            exact: false,
            fallback: 'en',
            confidence: 0.8,
          };
        }
      }

      // No supported language found, use fallback
      const detectionTime = performance.now() - timer;

      return {
        detected: 'en',
        supported: true,
        exact: false,
        fallback: 'en',
        confidence: 0.3,
      };

    } catch (error) {
      throw new LanguageDetectionError(
        `Browser language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getBrowserLanguages(): string[] {
    return navigator.languages || [navigator.language];
  }
}

// Main useLanguage hook
export function useLanguage(): UseLanguageReturn {
  const router = useRouter();

  // State management
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [loadingState, setLoadingState] = useState<TranslationLoadingState>({
    isLoading: false,
    isLoaded: false,
    isError: false,
  });
  const [preferences, setPreferencesState] = useState<LanguagePreferences>({
    language: 'en',
    autoDetect: true,
    userOverride: false,
    timestamp: Date.now(),
  });
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Refs for performance tracking and utilities
  const performanceTracker = useRef(new PerformanceTracker());
  const translationCache = useRef(new TranslationCache());
  const languageDetector = useRef(new BrowserLanguageDetector());
  const isInitialized = useRef(false);

  // Memoized computed values
  const languageInfo = useMemo(() => LANGUAGE_INFO[language], [language]);

  const isRtl = useMemo(() => languageInfo.direction === 'rtl', [languageInfo]);

  const culturalFormatting: CulturalFormatting = useMemo(() => ({
    dates: {
      locale: `${language}-${languageInfo.region}`,
      formats: {
        short: languageInfo.dateFormat,
        medium: language === 'de' ? 'DD. MMM YYYY' : 'MMM DD, YYYY',
        long: language === 'de' ? 'DD. MMMM YYYY' : 'MMMM DD, YYYY',
        full: language === 'de' ? 'dddd, DD. MMMM YYYY' : 'dddd, MMMM DD, YYYY',
      },
    },
    numbers: {
      locale: `${language}-${languageInfo.region}`,
      currency: 'EUR',
      decimal: 2,
      grouping: true,
    },
    time: {
      format: language === 'de' ? '24h' : '12h',
      timezone: 'Europe/Berlin',
    },
  }), [language, languageInfo]);

  // Storage utilities
  const savePreferences = useCallback((prefs: LanguagePreferences) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          LANGUAGE_CONSTANTS.STORAGE_KEYS.PREFERENCES,
          JSON.stringify(prefs)
        );
      }
      // Also set cookie for SSR
      Cookies.set('timebutler-language', prefs.language, {
        expires: 365,
        path: '/',
        sameSite: 'lax',
      });
    } catch (error) {
      console.warn('Failed to save language preferences:', error);
    }
  }, []);

  const loadPreferences = useCallback((): LanguagePreferences => {
    try {
      const stored = typeof window !== 'undefined'
        ? localStorage.getItem(LANGUAGE_CONSTANTS.STORAGE_KEYS.PREFERENCES)
        : null;
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load language preferences:', error);
    }

    // Check cookie fallback
    const cookieLang = Cookies.get('timebutler-language');
    if (cookieLang && ['de', 'en'].includes(cookieLang)) {
      return {
        language: cookieLang as SupportedLanguage,
        autoDetect: false,
        userOverride: true,
        timestamp: Date.now(),
      };
    }

    return {
      language: 'en',
      autoDetect: true,
      userOverride: false,
      timestamp: Date.now(),
    };
  }, []);

  // Translation loading
  const loadTranslations = useCallback(async (
    lang: SupportedLanguage
  ): Promise<Record<string, any>> => {
    const timer = performanceTracker.current.startTimer();

    try {
      // Check cache first
      const cached = translationCache.current.get(lang);
      if (cached) {
        performanceTracker.current.recordCacheHit();
        performanceTracker.current.recordLoad(timer());
        return cached;
      }

      performanceTracker.current.recordCacheMiss();

      // Load translations dynamically
      const module = await import(`../i18n/${lang}.json`);
      const translationData = module.default || module;

      // Cache the translations
      translationCache.current.set(lang, translationData);

      const loadTime = timer();
      performanceTracker.current.recordLoad(loadTime);

      if (loadTime > LANGUAGE_CONSTANTS.PERFORMANCE.LOAD_TIMEOUT) {
        console.warn(`Translation loading took ${loadTime}ms, exceeding ${LANGUAGE_CONSTANTS.PERFORMANCE.LOAD_TIMEOUT}ms target`);
      }

      return translationData;

    } catch (error) {
      const loadTime = timer();
      performanceTracker.current.recordLoad(loadTime);

      throw new TranslationLoadError(
        lang,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }, []);

  // Browser language detection
  const detectLanguage = useCallback(async (): Promise<BrowserLanguageInfo> => {
    const timer = performanceTracker.current.startTimer();

    try {
      const result = languageDetector.current.detectLanguage();
      const detectionTime = timer();
      performanceTracker.current.recordDetection(detectionTime);

      if (detectionTime > LANGUAGE_CONSTANTS.PERFORMANCE.DETECTION_TIMEOUT) {
        console.warn(`Language detection took ${detectionTime}ms, exceeding ${LANGUAGE_CONSTANTS.PERFORMANCE.DETECTION_TIMEOUT}ms target`);
      }

      return result;
    } catch (error) {
      performanceTracker.current.recordDetection(timer());
      throw error;
    }
  }, []);

  // URL parameter handling
  const getLanguageFromUrl = useCallback((): SupportedLanguage | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');

    if (langParam && ['de', 'en'].includes(langParam)) {
      return langParam as SupportedLanguage;
    }

    return null;
  }, []);

  const updateUrlLanguage = useCallback((lang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Language switching
  const switchLanguage = useCallback(async (
    newLanguage: SupportedLanguage,
    options: LanguageSwitchOptions = {}
  ): Promise<void> => {
    const timer = performanceTracker.current.startTimer();

    try {
      setLoadingState(prev => ({ ...prev, isLoading: true, isError: false }));

      // Load new translations
      const newTranslations = await loadTranslations(newLanguage);

      // Update state
      setLanguageState(newLanguage);
      setTranslations(newTranslations);

      // Update preferences
      const newPrefs: LanguagePreferences = {
        language: newLanguage,
        autoDetect: false,
        userOverride: true,
        timestamp: Date.now(),
      };
      setPreferencesState(newPrefs);
      savePreferences(newPrefs);

      // Update URL if requested
      if (options.updateUrl !== false) {
        updateUrlLanguage(newLanguage);
      }

      // Update loading state
      setLoadingState({
        isLoading: false,
        isLoaded: true,
        isError: false,
      });

      const switchTime = timer();
      performanceTracker.current.recordSwitch(switchTime);

      if (switchTime > LANGUAGE_CONSTANTS.PERFORMANCE.SWITCH_TIMEOUT) {
        console.warn(`Language switch took ${switchTime}ms, exceeding ${LANGUAGE_CONSTANTS.PERFORMANCE.SWITCH_TIMEOUT}ms target`);
      }

      // Call callback if provided
      if (options.callback) {
        options.callback(newLanguage);
      }

    } catch (error) {
      setLoadingState({
        isLoading: false,
        isLoaded: false,
        isError: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      performanceTracker.current.recordSwitch(timer());
      throw error;
    }
  }, [loadTranslations, savePreferences, updateUrlLanguage]);

  // Translation function with performance optimization
  const t = useCallback((key: string, variables?: Record<string, any>): string => {
    try {
      const keys = key.split('.');
      let value: any = translations;

      // Navigate through nested object
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Fallback to key if translation not found
          console.warn(`Translation key not found: ${key} for language: ${language}`);
          return key;
        }
      }

      // Handle variable substitution
      if (typeof value === 'string' && variables) {
        return value.replace(/\{(\w+)\}/g, (match, varName) => {
          return variables[varName]?.toString() || match;
        });
      }

      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return key;
    }
  }, [translations, language]);

  // Cultural formatting functions
  const formatDate = useCallback((date: Date, format?: string): string => {
    try {
      const locale = culturalFormatting.dates.locale;

      if (format) {
        // Custom format handling could be implemented here
        return date.toLocaleDateString(locale);
      }

      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return date.toISOString().split('T')[0];
    }
  }, [culturalFormatting]);

  const formatNumber = useCallback((
    number: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    try {
      const locale = culturalFormatting.numbers.locale;
      return number.toLocaleString(locale, options);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return number.toString();
    }
  }, [culturalFormatting]);

  const formatCurrency = useCallback((amount: number, currency = 'EUR'): string => {
    try {
      const locale = culturalFormatting.numbers.locale;
      return amount.toLocaleString(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.warn('Currency formatting error:', error);
      return `€${amount.toFixed(2)}`;
    }
  }, [culturalFormatting]);

  // Preference management
  const updatePreferences = useCallback((updates: Partial<LanguagePreferences>) => {
    const newPrefs = {
      ...preferences,
      ...updates,
      timestamp: Date.now(),
    };
    setPreferencesState(newPrefs);
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  const resetPreferences = useCallback(() => {
    const defaultPrefs: LanguagePreferences = {
      language: 'en',
      autoDetect: true,
      userOverride: false,
      timestamp: Date.now(),
    };
    setPreferencesState(defaultPrefs);
    savePreferences(defaultPrefs);
  }, [savePreferences]);

  // Cache management
  const clearCache = useCallback(() => {
    translationCache.current.clear();
  }, []);

  const preloadLanguage = useCallback(async (lang: SupportedLanguage): Promise<void> => {
    try {
      await loadTranslations(lang);
    } catch (error) {
      console.warn(`Failed to preload language ${lang}:`, error);
    }
  }, [loadTranslations]);

  // Utility functions
  const getBrowserLanguages = useCallback((): string[] => {
    return languageDetector.current.getBrowserLanguages();
  }, []);

  const getSupportedLanguages = useCallback((): SupportedLanguage[] => {
    return ['de', 'en'];
  }, []);

  // Initialization effect
  useEffect(() => {
    if (isInitialized.current) return;

    const initializeLanguage = async () => {
      try {
        setLoadingState(prev => ({ ...prev, isLoading: true }));

        // Load saved preferences
        const savedPrefs = loadPreferences();
        setPreferencesState(savedPrefs);

        let targetLanguage: SupportedLanguage = savedPrefs.language;

        // Check URL parameter (highest priority)
        const urlLang = getLanguageFromUrl();
        if (urlLang) {
          targetLanguage = urlLang;
        }
        // Auto-detect if enabled and no user override
        else if (savedPrefs.autoDetect && !savedPrefs.userOverride) {
          try {
            const detected = await detectLanguage();
            if (detected.supported && detected.confidence > 0.5) {
              targetLanguage = detected.detected;
            }
          } catch (error) {
            console.warn('Language detection failed, using saved preference:', error);
          }
        }

        // Load translations and set language
        const initialTranslations = await loadTranslations(targetLanguage);
        setLanguageState(targetLanguage);
        setTranslations(initialTranslations);

        // Update preferences if language changed
        if (targetLanguage !== savedPrefs.language) {
          const updatedPrefs = {
            ...savedPrefs,
            language: targetLanguage,
            timestamp: Date.now(),
          };
          setPreferencesState(updatedPrefs);
          savePreferences(updatedPrefs);
        }

        setLoadingState({
          isLoading: false,
          isLoaded: true,
          isError: false,
        });

        isInitialized.current = true;

      } catch (error) {
        console.error('Language initialization failed:', error);
        setLoadingState({
          isLoading: false,
          isLoaded: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Initialization failed',
        });
      }
    };

    initializeLanguage();
  }, [loadPreferences, getLanguageFromUrl, detectLanguage, loadTranslations, savePreferences]);

  // Return hook interface
  return {
    // Current state
    language,
    languages: LANGUAGE_INFO,
    isLoading: loadingState.isLoading,
    isLoaded: loadingState.isLoaded,
    error: loadingState.error || null,

    // Translation functions
    t,
    formatDate,
    formatNumber,
    formatCurrency,

    // Language switching
    switchLanguage,
    detectLanguage,

    // Preferences
    preferences,
    updatePreferences,
    resetPreferences,

    // Performance and cache
    metrics: performanceTracker.current.getMetrics(),
    clearCache,
    preloadLanguage,

    // Utilities
    isRtl,
    culturalFormatting,
    getBrowserLanguages,
    getSupportedLanguages,
  };
}

export default useLanguage;