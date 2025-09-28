/**
 * Language System Usage Examples
 *
 * Comprehensive examples demonstrating how to use the language system:
 * - Basic language switching
 * - Performance optimization
 * - Next.js integration
 * - Custom translation components
 * - Error handling
 * - Server-side rendering
 */

import React, { useState, useCallback } from 'react';
import {
  useLanguage,
  useLanguageContext,
  LanguageProvider,
  LanguageSwitch,
  LanguageLoading,
  Translation,
  SupportedLanguage,
} from '../index';
import { useLanguageOptimization, LanguagePerformanceMonitor } from '../useLanguageOptimization';
import { useNextI18nIntegration, LanguageSEO } from '../useNextI18nIntegration';

// Example 1: Basic Language Hook Usage
export function BasicLanguageExample() {
  const {
    language,
    switchLanguage,
    t,
    formatDate,
    formatCurrency,
    isLoading,
    error,
  } = useLanguage();

  const handleLanguageSwitch = useCallback(async (newLang: SupportedLanguage) => {
    try {
      await switchLanguage(newLang);
      console.log(`Switched to ${newLang}`);
    } catch (err) {
      console.error('Language switch failed:', err);
    }
  }, [switchLanguage]);

  if (error) {
    return <div className="error">Language Error: {error}</div>;
  }

  return (
    <div className="language-example">
      <h2>{t('examples.basic.title')}</h2>

      <div className="current-language">
        <p>Current Language: <strong>{language}</strong></p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>

      <div className="language-switch">
        <button
          onClick={() => handleLanguageSwitch('de')}
          disabled={language === 'de' || isLoading}
        >
          Deutsch
        </button>
        <button
          onClick={() => handleLanguageSwitch('en')}
          disabled={language === 'en' || isLoading}
        >
          English
        </button>
      </div>

      <div className="formatting-examples">
        <h3>{t('examples.formatting.title')}</h3>
        <p>Date: {formatDate(new Date())}</p>
        <p>Currency: {formatCurrency(1234.56)}</p>
        <p>Welcome: {t('common.welcome', { name: 'User' })}</p>
      </div>
    </div>
  );
}

// Example 2: Provider Pattern Usage
export function ProviderExample() {
  return (
    <LanguageProvider
      config={{
        defaultLanguage: 'en',
        autoDetect: true,
        enableMetrics: true,
      }}
    >
      <LanguageLoading fallback={<div>Loading language system...</div>}>
        <ProviderContent />
      </LanguageLoading>
    </LanguageProvider>
  );
}

function ProviderContent() {
  const { t, language, switchLanguage, metrics } = useLanguageContext();

  return (
    <div className="provider-example">
      <h2>{t('examples.provider.title')}</h2>

      <LanguageSwitch
        showFlags={true}
        showNames={true}
        onLanguageChange={(lang) => console.log('Language changed to:', lang)}
      />

      <div className="translations">
        <Translation i18nKey="examples.provider.description" />
        <Translation
          i18nKey="examples.provider.greeting"
          variables={{ name: 'Developer' }}
          fallback="Hello, Developer!"
        />
      </div>

      <div className="performance-info">
        <p>Switch Time: {metrics.switchTime.toFixed(1)}ms</p>
        <p>Cache Hits: {metrics.cacheHits}</p>
      </div>
    </div>
  );
}

// Example 3: Performance Optimization Usage
export function PerformanceOptimizationExample() {
  const {
    isOptimized,
    preloadTranslation,
    getPerformanceReport,
    performanceAlert,
  } = useLanguageOptimization({
    cacheWarmingStrategy: 'predictive',
    preloadDelay: 1000,
  });

  const [report, setReport] = useState<any>(null);

  const handlePreloadAll = useCallback(async () => {
    await Promise.all([
      preloadTranslation('de'),
      preloadTranslation('en'),
    ]);
    console.log('All translations preloaded');
  }, [preloadTranslation]);

  const handleGetReport = useCallback(() => {
    const performanceReport = getPerformanceReport();
    setReport(performanceReport);
  }, [getPerformanceReport]);

  return (
    <div className="performance-example">
      <h2>Performance Optimization Example</h2>

      <div className="optimization-status">
        <p>Optimized: {isOptimized ? 'Yes' : 'No'}</p>
        {performanceAlert && (
          <div className="alert">{performanceAlert}</div>
        )}
      </div>

      <div className="controls">
        <button onClick={handlePreloadAll}>
          Preload All Languages
        </button>
        <button onClick={handleGetReport}>
          Get Performance Report
        </button>
      </div>

      {report && (
        <div className="performance-report">
          <h3>Performance Report</h3>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}

      <LanguagePerformanceMonitor
        showAlerts={true}
        showStats={true}
        onPerformanceIssue={(issue) => console.warn('Performance issue:', issue)}
      />
    </div>
  );
}

// Example 4: Next.js Integration Usage
export function NextJsIntegrationExample() {
  const {
    switchLanguage,
    getLocalizedUrl,
    getAlternateUrls,
    currentLocale,
    isDefaultLocale,
  } = useNextI18nIntegration({
    locales: ['de', 'en'],
    defaultLocale: 'en',
  });

  const alternateUrls = getAlternateUrls();

  const handleRouteWithLanguage = useCallback((path: string) => {
    const localizedPath = getLocalizedUrl(path);
    console.log(`Localized path: ${localizedPath}`);
  }, [getLocalizedUrl]);

  return (
    <div className="nextjs-example">
      <h2>Next.js Integration Example</h2>

      <div className="locale-info">
        <p>Current Locale: {currentLocale}</p>
        <p>Is Default Locale: {isDefaultLocale ? 'Yes' : 'No'}</p>
      </div>

      <div className="url-examples">
        <h3>Localized URLs</h3>
        {Object.entries(alternateUrls).map(([locale, url]) => (
          <p key={locale}>
            {locale.toUpperCase()}: {url}
          </p>
        ))}
      </div>

      <div className="route-controls">
        <button onClick={() => handleRouteWithLanguage('/vacation-planner')}>
          Get Localized Vacation Planner URL
        </button>
        <button onClick={() => switchLanguage('de')}>
          Switch to German (with routing)
        </button>
      </div>

      <LanguageSEO canonicalUrl="https://timebutler-calendar.com" />
    </div>
  );
}

// Example 5: Custom Translation Component
interface CustomTranslationProps {
  children: React.ReactNode;
  language?: SupportedLanguage;
  fallbackLanguage?: SupportedLanguage;
}

export function CustomTranslationProvider({
  children,
  language,
  fallbackLanguage = 'en'
}: CustomTranslationProps) {
  const { switchLanguage, isLoaded } = useLanguageContext();

  React.useEffect(() => {
    if (language && isLoaded) {
      switchLanguage(language);
    }
  }, [language, switchLanguage, isLoaded]);

  return <>{children}</>;
}

// Example 6: Error Boundary for Language Operations
interface LanguageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class LanguageErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  LanguageErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LanguageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Language system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="language-error-boundary">
          <h2>Language System Error</h2>
          <p>Something went wrong with the language system.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Example 7: Advanced Usage with Custom Hooks
export function useAdvancedLanguageFeatures() {
  const language = useLanguageContext();
  const optimization = useLanguageOptimization();
  const nextIntegration = useNextI18nIntegration();

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const switchWithOptimization = useCallback(async (targetLang: SupportedLanguage) => {
    // Start performance tracking
    const endTracking = optimization.optimizeForLanguageSwitch(targetLang);

    try {
      // Preload if not in cache
      await optimization.preloadTranslation(targetLang);

      // Switch with routing
      await nextIntegration.switchLanguage(targetLang);

      console.log('Advanced language switch completed');
    } finally {
      endTracking();
    }
  }, [optimization, nextIntegration]);

  const enableAdvancedMode = useCallback(() => {
    setIsAdvancedMode(true);
    // Preload all languages
    optimization.performPredictivePreloading();
  }, [optimization]);

  return {
    ...language,
    isAdvancedMode,
    enableAdvancedMode,
    switchWithOptimization,
    performanceReport: optimization.getPerformanceReport,
    alternateUrls: nextIntegration.getAlternateUrls,
  };
}

// Example 8: Complete Application Setup
export function LanguageSystemDemo() {
  return (
    <LanguageErrorBoundary>
      <LanguageProvider
        config={{
          defaultLanguage: 'en',
          autoDetect: true,
          enableMetrics: true,
          cacheTimeout: 30 * 60 * 1000, // 30 minutes
        }}
      >
        <LanguageLoading>
          <div className="demo-container">
            <h1>TimeButler Calendar Language System Demo</h1>

            <section>
              <BasicLanguageExample />
            </section>

            <section>
              <PerformanceOptimizationExample />
            </section>

            <section>
              <NextJsIntegrationExample />
            </section>

            <section>
              <CustomTranslationProvider language="de">
                <div>
                  <Translation i18nKey="demo.customProvider" />
                </div>
              </CustomTranslationProvider>
            </section>
          </div>
        </LanguageLoading>
      </LanguageProvider>
    </LanguageErrorBoundary>
  );
}

// Usage in _app.tsx
export function AppWithLanguageSystem({ Component, pageProps }: any) {
  return (
    <LanguageErrorBoundary>
      <LanguageProvider
        serverLanguage={pageProps._locale}
        config={{
          defaultLanguage: 'en',
          autoDetect: true,
          persistPreferences: true,
          enableMetrics: process.env.NODE_ENV === 'development',
        }}
      >
        <LanguageLoading fallback={<div>Loading application...</div>}>
          <Component {...pageProps} />
        </LanguageLoading>
      </LanguageProvider>
    </LanguageErrorBoundary>
  );
}

export default {
  BasicLanguageExample,
  ProviderExample,
  PerformanceOptimizationExample,
  NextJsIntegrationExample,
  CustomTranslationProvider,
  LanguageErrorBoundary,
  useAdvancedLanguageFeatures,
  LanguageSystemDemo,
  AppWithLanguageSystem,
};