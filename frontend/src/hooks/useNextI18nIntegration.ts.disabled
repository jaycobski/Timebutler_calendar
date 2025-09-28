/**
 * Next.js i18n Integration Hook
 *
 * Seamless integration with Next.js internationalization features:
 * - Next.js router locale handling
 * - Server-side rendering support
 * - Static generation with i18n
 * - Dynamic routing with language prefixes
 * - Next-translate integration
 * - Middleware support for language detection
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { SupportedLanguage } from '../types/language';
import { useLanguageContext } from './LanguageProvider';

// Next.js i18n configuration
interface NextI18nConfig {
  locales: SupportedLanguage[];
  defaultLocale: SupportedLanguage;
  localeDetection: boolean;
  trailingSlash: boolean;
  localePath: string;
}

// Route handling utilities
interface RouteInfo {
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
  locale?: SupportedLanguage;
}

// URL generation options
interface UrlOptions {
  locale?: SupportedLanguage;
  preserveQuery?: boolean;
  shallow?: boolean;
}

const DEFAULT_CONFIG: NextI18nConfig = {
  locales: ['de', 'en'],
  defaultLocale: 'en',
  localeDetection: true,
  trailingSlash: false,
  localePath: '/locales',
};

export function useNextI18nIntegration(config: Partial<NextI18nConfig> = {}) {
  const router = useRouter();
  const languageContext = useLanguageContext();
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // State for SSR/hydration handling
  const [isHydrated, setIsHydrated] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    pathname: '/',
    query: {},
    asPath: '/',
  });

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
    setRouteInfo({
      pathname: router.pathname,
      query: router.query,
      asPath: router.asPath,
      locale: router.locale as SupportedLanguage,
    });
  }, [router.pathname, router.query, router.asPath, router.locale]);

  // Sync Next.js locale with language context
  useEffect(() => {
    if (!isHydrated) return;

    const nextLocale = router.locale as SupportedLanguage;
    const currentLanguage = languageContext.language;

    // If Next.js locale differs from language context, sync them
    if (nextLocale && nextLocale !== currentLanguage) {
      if (finalConfig.locales.includes(nextLocale)) {
        languageContext.switchLanguage(nextLocale, { updateUrl: false });
      }
    }
  }, [
    router.locale,
    languageContext.language,
    languageContext.switchLanguage,
    finalConfig.locales,
    isHydrated,
  ]);

  // Language switching with Next.js router integration
  const switchLanguageWithRouter = useCallback(async (
    newLanguage: SupportedLanguage,
    options: UrlOptions = {}
  ) => {
    if (!finalConfig.locales.includes(newLanguage)) {
      throw new Error(`Language ${newLanguage} is not supported`);
    }

    try {
      // Update language context first
      await languageContext.switchLanguage(newLanguage, { updateUrl: false });

      // Build the new URL
      let newPath = router.asPath;
      let query = { ...router.query };

      if (options.preserveQuery !== false) {
        // Remove locale from query if it exists
        delete query.locale;
      } else {
        query = {};
      }

      // Handle locale routing
      const targetLocale = options.locale || newLanguage;

      // Push new route with locale
      await router.push(
        {
          pathname: router.pathname,
          query,
        },
        router.asPath,
        {
          locale: targetLocale,
          shallow: options.shallow || false,
        }
      );

    } catch (error) {
      console.error('Failed to switch language with router:', error);
      throw error;
    }
  }, [
    router,
    languageContext.switchLanguage,
    finalConfig.locales,
  ]);

  // Get localized URL for a given path
  const getLocalizedUrl = useCallback((
    path: string,
    locale?: SupportedLanguage,
    options: UrlOptions = {}
  ): string => {
    const targetLocale = locale || languageContext.language;

    // If it's the default locale and locale detection is enabled, don't prefix
    if (targetLocale === finalConfig.defaultLocale && finalConfig.localeDetection) {
      return path;
    }

    // Add locale prefix
    const localizedPath = `/${targetLocale}${path.startsWith('/') ? path : `/${path}`}`;

    // Handle query parameters if needed
    if (options.preserveQuery && Object.keys(router.query).length > 0) {
      const queryString = new URLSearchParams(
        router.query as Record<string, string>
      ).toString();
      return `${localizedPath}?${queryString}`;
    }

    return localizedPath;
  }, [
    languageContext.language,
    finalConfig.defaultLocale,
    finalConfig.localeDetection,
    router.query,
  ]);

  // Get alternate language URLs for SEO
  const getAlternateUrls = useCallback((): Record<SupportedLanguage, string> => {
    const currentPath = router.asPath;
    const alternates: Record<SupportedLanguage, string> = {} as any;

    finalConfig.locales.forEach(locale => {
      alternates[locale] = getLocalizedUrl(currentPath, locale);
    });

    return alternates;
  }, [router.asPath, finalConfig.locales, getLocalizedUrl]);

  // Language detection from browser with Next.js integration
  const detectBrowserLanguageForNext = useCallback((): SupportedLanguage => {
    if (typeof window === 'undefined') {
      return finalConfig.defaultLocale;
    }

    // Use Next.js detected locale first
    if (router.locale && finalConfig.locales.includes(router.locale as SupportedLanguage)) {
      return router.locale as SupportedLanguage;
    }

    // Fallback to browser detection
    const browserLanguages = navigator.languages || [navigator.language];
    for (const browserLang of browserLanguages) {
      const lang = browserLang.split('-')[0] as SupportedLanguage;
      if (finalConfig.locales.includes(lang)) {
        return lang;
      }
    }

    return finalConfig.defaultLocale;
  }, [router.locale, finalConfig.locales, finalConfig.defaultLocale]);

  // SSR/SSG helpers
  const getStaticPropsWithI18n = useCallback((
    locale: SupportedLanguage,
    getStaticPropsCallback?: (context: any) => Promise<any>
  ) => {
    return async (context: any) => {
      // Set up locale context
      const localeContext = {
        ...context,
        locale,
        locales: finalConfig.locales,
        defaultLocale: finalConfig.defaultLocale,
      };

      // Load translations for SSR
      let translations = {};
      try {
        const translationModule = await import(`../i18n/${locale}.json`);
        translations = translationModule.default || translationModule;
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}:`, error);
      }

      // Call custom getStaticProps if provided
      let customProps = {};
      if (getStaticPropsCallback) {
        const result = await getStaticPropsCallback(localeContext);
        customProps = result.props || {};
      }

      return {
        props: {
          ...customProps,
          _translations: translations,
          _locale: locale,
          _nextI18nConfig: finalConfig,
        },
      };
    };
  }, [finalConfig]);

  // Server-side props helper
  const getServerSidePropsWithI18n = useCallback((
    getServerSidePropsCallback?: (context: any) => Promise<any>
  ) => {
    return async (context: any) => {
      const { locale = finalConfig.defaultLocale } = context;

      // Load translations for SSR
      let translations = {};
      try {
        const translationModule = await import(`../i18n/${locale}.json`);
        translations = translationModule.default || translationModule;
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}:`, error);
      }

      // Call custom getServerSideProps if provided
      let customProps = {};
      if (getServerSidePropsCallback) {
        const result = await getServerSidePropsCallback(context);
        customProps = result.props || {};
      }

      return {
        props: {
          ...customProps,
          _translations: translations,
          _locale: locale,
          _nextI18nConfig: finalConfig,
        },
      };
    };
  }, [finalConfig]);

  // Route change handling for language sync
  useEffect(() => {
    const handleRouteChange = (url: string, { locale }: { locale?: string }) => {
      if (locale && locale !== languageContext.language) {
        languageContext.switchLanguage(locale as SupportedLanguage, { updateUrl: false });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, languageContext.language, languageContext.switchLanguage]);

  // Generate hreflang attributes for SEO
  const getHrefLangAttributes = useCallback((): Array<{ hrefLang: string; href: string }> => {
    const alternates = getAlternateUrls();
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://timebutler-calendar.com'; // Fallback for SSR

    return Object.entries(alternates).map(([locale, path]) => ({
      hrefLang: locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : locale,
      href: `${baseUrl}${path}`,
    }));
  }, [getAlternateUrls]);

  // Middleware configuration helper
  const getMiddlewareConfig = useCallback(() => ({
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - public files (public folder)
       */
      '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
    config: finalConfig,
  }), [finalConfig]);

  return {
    // State
    isHydrated,
    routeInfo,
    currentLocale: router.locale as SupportedLanguage,
    availableLocales: finalConfig.locales,

    // Language switching
    switchLanguage: switchLanguageWithRouter,
    detectBrowserLanguage: detectBrowserLanguageForNext,

    // URL handling
    getLocalizedUrl,
    getAlternateUrls,
    getHrefLangAttributes,

    // SSR/SSG helpers
    getStaticPropsWithI18n,
    getServerSidePropsWithI18n,
    getMiddlewareConfig,

    // Utilities
    isDefaultLocale: languageContext.language === finalConfig.defaultLocale,
    needsLocalePrefix: languageContext.language !== finalConfig.defaultLocale || !finalConfig.localeDetection,
    config: finalConfig,
  };
}

// Next.js page wrapper with i18n
export function withNextI18n<P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<NextI18nConfig>
) {
  const WrappedComponent = (props: P & { _locale?: SupportedLanguage; _translations?: any }) => {
    const { _locale, _translations, ...componentProps } = props;
    const integration = useNextI18nIntegration(config);

    // Initialize translations if provided via SSR
    useEffect(() => {
      if (_translations && _locale) {
        // Could integrate with translation cache here
        console.log(`SSR translations loaded for ${_locale}`);
      }
    }, [_locale, _translations]);

    return <Component {...(componentProps as P)} />;
  };

  WrappedComponent.displayName = `withNextI18n(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// SEO component for language alternates
interface LanguageSEOProps {
  canonicalUrl?: string;
}

export function LanguageSEO({ canonicalUrl }: LanguageSEOProps) {
  const { getHrefLangAttributes, routeInfo } = useNextI18nIntegration();
  const hrefLangs = getHrefLangAttributes();

  return (
    <>
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {hrefLangs.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={hrefLangs[0]?.href} />
    </>
  );
}

export default useNextI18nIntegration;