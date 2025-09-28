/**
 * LanguageProvider - React Context Provider for Language Management
 *
 * Provides application-wide language state and functionality including:
 * - Global language state management
 * - Server-side rendering support
 * - Translation namespace registration
 * - Performance optimization
 * - Error boundaries for language operations
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import {
  SupportedLanguage,
  LanguageContextType,
  LanguageConfig,
  LANGUAGE_CONSTANTS,
  LanguageError,
} from '../types/language';
import { useLanguage } from './useLanguage';

// Default configuration
const DEFAULT_CONFIG: LanguageConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['de', 'en'],
  fallbackLanguage: 'en',
  autoDetect: true,
  persistPreferences: true,
  urlParameter: {
    paramName: 'lang',
    enabled: true,
    persist: true,
    override: true,
  },
  cacheTimeout: LANGUAGE_CONSTANTS.CACHE.DEFAULT_TIMEOUT,
  maxCacheSize: LANGUAGE_CONSTANTS.CACHE.MAX_SIZE,
  enableMetrics: true,
  enableCompression: false,
  translationPath: '/i18n',
};

// Language Context
const LanguageContext = createContext<LanguageContextType | null>(null);

// Props for the LanguageProvider
interface LanguageProviderProps {
  children: ReactNode;
  config?: Partial<LanguageConfig>;
  serverLanguage?: SupportedLanguage;
  initialTranslations?: Record<string, any>;
}

// Translation namespace registry
class TranslationNamespaceRegistry {
  private namespaces: Map<string, Record<string, any>> = new Map();
  private subscribers: Set<() => void> = new Set();

  register(namespace: string, translations: Record<string, any>) {
    this.namespaces.set(namespace, translations);
    this.notifySubscribers();
  }

  unregister(namespace: string) {
    this.namespaces.delete(namespace);
    this.notifySubscribers();
  }

  get(namespace: string): Record<string, any> | undefined {
    return this.namespaces.get(namespace);
  }

  getAll(): Record<string, Record<string, any>> {
    return Object.fromEntries(this.namespaces.entries());
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  clear() {
    this.namespaces.clear();
    this.notifySubscribers();
  }
}

// Language Provider Component
export function LanguageProvider({
  children,
  config = {},
  serverLanguage,
  initialTranslations,
}: LanguageProviderProps) {
  const router = useRouter();
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // Core language hook
  const languageHook = useLanguage();

  // Additional provider state
  const [isHydrated, setIsHydrated] = useState(false);
  const [namespaceRegistry] = useState(() => new TranslationNamespaceRegistry());
  const [registryVersion, setRegistryVersion] = useState(0);

  // Server-side rendering support
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Namespace management
  const registerTranslationNamespace = useCallback((
    namespace: string,
    translations: Record<string, any>
  ) => {
    namespaceRegistry.register(namespace, translations);
    setRegistryVersion(prev => prev + 1);
  }, [namespaceRegistry]);

  const unregisterTranslationNamespace = useCallback((namespace: string) => {
    namespaceRegistry.unregister(namespace);
    setRegistryVersion(prev => prev + 1);
  }, [namespaceRegistry]);

  // Enhanced translation function that includes namespaces
  const enhancedT = useCallback((key: string, variables?: Record<string, any>): string => {
    // Try main translations first
    const mainResult = languageHook.t(key, variables);
    if (mainResult !== key) {
      return mainResult;
    }

    // Check registered namespaces
    const namespacedKeys = key.split('.');
    if (namespacedKeys.length > 1) {
      const [namespace, ...remainingKeys] = namespacedKeys;
      const namespaceTranslations = namespaceRegistry.get(namespace);

      if (namespaceTranslations) {
        const namespaceKey = remainingKeys.join('.');
        let value: any = namespaceTranslations;

        for (const k of remainingKeys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            break;
          }
        }

        if (typeof value === 'string') {
          // Handle variable substitution
          if (variables) {
            return value.replace(/\{(\w+)\}/g, (match, varName) => {
              return variables[varName]?.toString() || match;
            });
          }
          return value;
        }
      }
    }

    return mainResult;
  }, [languageHook.t, namespaceRegistry, registryVersion]);

  // URL language handling with Next.js router integration
  useEffect(() => {
    if (!isHydrated || !finalConfig.urlParameter.enabled) return;

    const handleRouteChange = (url: string) => {
      const urlObj = new URL(url, window.location.origin);
      const langParam = urlObj.searchParams.get(finalConfig.urlParameter.paramName);

      if (langParam && finalConfig.supportedLanguages.includes(langParam as SupportedLanguage)) {
        const targetLang = langParam as SupportedLanguage;
        if (targetLang !== languageHook.language) {
          languageHook.switchLanguage(targetLang, { updateUrl: false });
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [
    router.events,
    finalConfig.urlParameter.enabled,
    finalConfig.urlParameter.paramName,
    finalConfig.supportedLanguages,
    languageHook.language,
    languageHook.switchLanguage,
    isHydrated,
  ]);

  // Performance monitoring
  useEffect(() => {
    if (!finalConfig.enableMetrics) return;

    const logMetrics = () => {
      const metrics = languageHook.metrics;
      const cacheHitRatio = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0;

      if (metrics.switchTime > LANGUAGE_CONSTANTS.PERFORMANCE.SWITCH_TIMEOUT) {
        console.warn(`Language performance: Switch time ${metrics.switchTime}ms exceeds target`);
      }

      if (cacheHitRatio < 0.8) {
        console.warn(`Language performance: Low cache hit ratio ${(cacheHitRatio * 100).toFixed(1)}%`);
      }
    };

    const interval = setInterval(logMetrics, 30000); // Log every 30 seconds
    return () => clearInterval(interval);
  }, [finalConfig.enableMetrics, languageHook.metrics]);

  // Context value
  const contextValue: LanguageContextType = useMemo(() => ({
    ...languageHook,
    t: enhancedT, // Use enhanced translation function
    registerTranslationNamespace,
    unregisterTranslationNamespace,
    serverLanguage,
    isHydrated,
  }), [
    languageHook,
    enhancedT,
    registerTranslationNamespace,
    unregisterTranslationNamespace,
    serverLanguage,
    isHydrated,
  ]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use the language context
export function useLanguageContext(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new LanguageError(
      'useLanguageContext must be used within a LanguageProvider',
      'CONTEXT_NOT_FOUND'
    );
  }

  return context;
}

// Higher-order component for language functionality
export function withLanguage<P extends object>(
  Component: React.ComponentType<P & { language: LanguageContextType }>
) {
  const WrappedComponent = (props: P) => {
    const language = useLanguageContext();
    return <Component {...props} language={language} />;
  };

  WrappedComponent.displayName = `withLanguage(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Language Switch Component
interface LanguageSwitchProps {
  className?: string;
  showFlags?: boolean;
  showNames?: boolean;
  orientation?: 'horizontal' | 'vertical';
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSwitch({
  className = '',
  showFlags = true,
  showNames = true,
  orientation = 'horizontal',
  onLanguageChange,
}: LanguageSwitchProps) {
  const { language, languages, switchLanguage, isLoading, getSupportedLanguages } = useLanguageContext();
  const supportedLanguages = getSupportedLanguages();

  const handleSwitch = useCallback(async (newLanguage: SupportedLanguage) => {
    try {
      await switchLanguage(newLanguage);
      onLanguageChange?.(newLanguage);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  }, [switchLanguage, onLanguageChange]);

  const flagEmoji = useCallback((lang: SupportedLanguage) => {
    const flags = { de: '🇩🇪', en: '🇺🇸' };
    return flags[lang] || '🌐';
  }, []);

  return (
    <div className={`language-switch ${orientation} ${className}`}>
      {supportedLanguages.map((lang) => {
        const langInfo = languages[lang];
        const isActive = language === lang;

        return (
          <button
            key={lang}
            className={`language-option ${isActive ? 'active' : ''}`}
            onClick={() => handleSwitch(lang)}
            disabled={isLoading}
            aria-label={`Switch to ${langInfo.nativeName}`}
            title={langInfo.nativeName}
          >
            {showFlags && <span className="flag" aria-hidden="true">{flagEmoji(lang)}</span>}
            {showNames && <span className="name">{langInfo.nativeName}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Language Loading Component
interface LanguageLoadingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LanguageLoading({ children, fallback }: LanguageLoadingProps) {
  const { isLoaded, isLoading, error } = useLanguageContext();

  if (error) {
    return (
      <div className="language-error" role="alert">
        <p>Language loading failed: {error}</p>
      </div>
    );
  }

  if (isLoading || !isLoaded) {
    return (
      <>
        {fallback || (
          <div className="language-loading" aria-live="polite">
            <p>Loading language...</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

// Translation Component for declarative usage
interface TranslationProps {
  i18nKey: string;
  variables?: Record<string, any>;
  fallback?: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function Translation({
  i18nKey,
  variables,
  fallback,
  tag: Tag = 'span',
  className,
}: TranslationProps) {
  const { t } = useLanguageContext();
  const translatedText = t(i18nKey, variables);
  const displayText = translatedText !== i18nKey ? translatedText : fallback || i18nKey;

  return <Tag className={className}>{displayText}</Tag>;
}

export default LanguageProvider;