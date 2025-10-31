/**
 * Next.js App Component - TimeButler Calendar MVP
 * Global application configuration with performance and accessibility optimization
 */

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Import global styles
import '../styles/globals.css';

// Performance monitoring imports
import { performanceMonitor } from '@/lib/performance-monitor';
import { rumAnalytics } from '@/lib/rum-analytics';
import PerformanceReporter from '@/components/PerformanceReporter';

// Performance monitoring
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
    __TB_LCP?: number;
    __TB_FCP?: number;
  }
}

/**
 * Custom App Component
 * Handles global state, performance monitoring, and accessibility setup
 */
function TimeButlerCalendarApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Enhanced performance monitoring and analytics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize constitutional compliance monitoring
      console.log('🚀 TimeButler Calendar - Constitutional performance monitoring enabled');

      // Mark app initialization
      performanceMonitor.mark('app-init-start');

      // Initialize RUM analytics for constitutional compliance monitoring
      rumAnalytics.trackEvent('business', 'app_initialized', undefined, {
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
        constitutionalCompliance: true,
      });

      // Enhanced Core Web Vitals monitoring with constitutional thresholds
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // Log performance metrics with constitutional compliance checking
            if (process.env.NODE_ENV === 'development') {
              console.log('Performance metric:', entry.name, entry.value);
            }

            // Constitutional compliance validation
            let isConstitutionalViolation = false;
            let threshold = 0;

            if (entry.name === 'largest-contentful-paint' && entry.value > 2000) {
              isConstitutionalViolation = true;
              threshold = 2000;
              console.warn('🚨 Constitutional LCP Violation:', entry.value + 'ms > 2000ms');
            } else if (entry.name === 'first-input' && entry.value > 100) {
              isConstitutionalViolation = true;
              threshold = 100;
              console.warn('🚨 Constitutional FID Violation:', entry.value + 'ms > 100ms');
            } else if (entry.name === 'cumulative-layout-shift' && entry.value > 0.1) {
              isConstitutionalViolation = true;
              threshold = 0.1;
              console.warn('🚨 Constitutional CLS Violation:', entry.value + ' > 0.1');
            }

            // Send to RUM analytics with constitutional flag
            rumAnalytics.trackEvent('performance', entry.name.replace(/-/g, '_'), entry.value, {
              constitutional_violation: isConstitutionalViolation,
              threshold,
              page_path: router.asPath,
              user_agent: navigator.userAgent,
              connection: (navigator as any).connection?.effectiveType,
            });

            // Legacy analytics support
            if (process.env.NODE_ENV === 'production' && window.gtag) {
              window.gtag('event', 'web_vital', {
                metric_name: entry.name,
                metric_value: Math.round(entry.value),
                page_path: router.asPath,
                constitutional_compliant: !isConstitutionalViolation,
              });
            }
          });
        });

        // Observe Core Web Vitals with constitutional monitoring
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'cumulative-layout-shift'] });

        // Mark app initialization complete
        performanceMonitor.mark('app-init-complete');
        performanceMonitor.measure('app-initialization', 'app-init-start', 'app-init-complete');

        return () => {
          observer.disconnect();
          // Safely call destroy methods if they exist
          if (performanceMonitor && typeof performanceMonitor.destroy === 'function') {
            performanceMonitor.destroy();
          }
          if (rumAnalytics && typeof rumAnalytics.destroy === 'function') {
            rumAnalytics.destroy();
          }
        };
      } catch (error) {
        console.warn('Performance Observer not supported');
        rumAnalytics.trackEvent('error', 'performance_observer_unsupported', undefined, {
          error: error.message,
          user_agent: navigator.userAgent,
        });
      }
    }
  }, [router.asPath]);

  // Enhanced route change analytics with performance tracking
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      performanceMonitor.mark(`route-change-start-${url}`);
      rumAnalytics.trackEvent('pageview', 'route_change_start', undefined, {
        targetUrl: url,
        sourceUrl: router.asPath,
        timestamp: Date.now(),
      });
    };

    const handleRouteChange = (url: string) => {
      // Mark route change completion
      performanceMonitor.mark(`route-change-complete-${url}`);
      performanceMonitor.measure(
        `route-change-${url}`,
        `route-change-start-${url}`,
        `route-change-complete-${url}`
      );

      // Enhanced page view tracking with constitutional context
      rumAnalytics.trackEvent('pageview', 'page_view', undefined, {
        page_path: url,
        page_title: document.title,
        page_location: window.location.href,
        page_type: getPageType(url),
        is_german_user: url.startsWith('/de') || navigator.language.startsWith('de'),
        constitutional_monitoring: true,
      });

      // Legacy analytics support
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: url,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    };

    const handleRouteChangeError = (err: Error, url: string) => {
      rumAnalytics.trackEvent('error', 'route_change_error', undefined, {
        url,
        error: err.message,
        stack: err.stack,
        source_url: router.asPath,
      });
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router.events, router.asPath]);

  // Accessibility announcements for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      // Announce page changes to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.textContent = `Navigated to ${document.title}`;
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      document.body.appendChild(announcement);

      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {/* Global head elements */}
      <Head>
        {/* Critical performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Font loading with display swap for performance */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme and browser configuration */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="//api.timebutler.de" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Performance monitoring script injection for Core Web Vitals */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize Core Web Vitals tracking immediately for constitutional compliance
              (function() {
                // LCP tracking with constitutional threshold (2s)
                if ('PerformanceObserver' in window) {
                  try {
                    new PerformanceObserver((list) => {
                      const entries = list.getEntries();
                      const lastEntry = entries[entries.length - 1];
                      window.__TB_LCP = lastEntry.startTime;

                      // Constitutional compliance check
                      if (lastEntry.startTime > 2000) {
                        console.warn('🚨 LCP Constitutional Violation:', lastEntry.startTime + 'ms > 2000ms');
                      }
                    }).observe({ type: 'largest-contentful-paint', buffered: true });
                  } catch (e) {}
                }

                // FCP tracking
                if ('PerformanceObserver' in window) {
                  try {
                    new PerformanceObserver((list) => {
                      const entries = list.getEntries();
                      entries.forEach((entry) => {
                        if (entry.name === 'first-contentful-paint') {
                          window.__TB_FCP = entry.startTime;
                        }
                      });
                    }).observe({ type: 'paint', buffered: true });
                  } catch (e) {}
                }

                // Mark navigation start for performance tracking
                if ('performance' in window && 'mark' in performance) {
                  performance.mark('tb-app-start');
                }
              })();
            `,
          }}
        />

        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </Head>

      {/* Global accessibility skip link */}
      <a
        href="#main-content"
        className="skip-nav"
      >
        Zum Hauptinhalt springen / Skip to main content
      </a>

      {/* Main application component */}
      <div id="app-root">
        <Component {...pageProps} />
      </div>

      {/* Performance monitoring overlay (development and staging) */}
      <PerformanceReporter
        developmentMode={
          process.env.NODE_ENV === 'development' ||
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        }
        onAlert={(alert) => {
          // Send critical performance alerts to monitoring
          if (alert.severity === 'critical') {
            rumAnalytics.trackEvent('error', 'critical_performance_alert', alert.value, {
              metric: alert.metric,
              threshold: alert.threshold,
              exceedsBy: alert.value - alert.threshold,
              constitutional: ['lcp', 'fid', 'cls'].includes(alert.metric),
              page: router.asPath,
            });
          }
        }}
      />

      {/* Live region for accessibility announcements */}
      <div
        id="live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Loading indicator for better UX */}
      <div
        id="loading-indicator"
        className="fixed top-0 left-0 w-full h-1 bg-blue-600 z-50 transform -translate-x-full transition-transform duration-300"
        role="progressbar"
        aria-label="Page loading"
        style={{ display: 'none' }}
      />

      {/* Performance optimization: Preload critical resources */}
      {process.env.NODE_ENV === 'production' && (
        <>
          <link rel="preload" href="/images/timebutler-logo.svg" as="image" />
          <link rel="preload" href="/images/hero-background.webp" as="image" />
        </>
      )}

      {/* Development tools */}
      {process.env.NODE_ENV === 'development' && (
        <div
          id="dev-tools"
          className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded text-xs z-50"
          style={{ fontSize: '10px', opacity: 0.7 }}
        >
          <div>Route: {router.asPath}</div>
          <div>Locale: {router.locale}</div>
          <div>Build: {process.env.NODE_ENV}</div>
        </div>
      )}

      {/* Style injection for critical CSS */}
      <style jsx global>{`
        /* Critical above-the-fold styles */
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        /* Loading state styles */
        .loading #loading-indicator {
          display: block !important;
          transform: translateX(0) !important;
        }

        /* High contrast mode adjustments */
        @media (prefers-contrast: high) {
          .skip-nav {
            background: #000 !important;
            color: #fff !important;
            border: 2px solid #fff !important;
          }
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          #loading-indicator {
            transition: none !important;
          }
        }

        /* Print styles */
        @media print {
          #dev-tools,
          #loading-indicator,
          .skip-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Determine page type from URL for analytics segmentation
 */
function getPageType(url: string): string {
  if (url === '/' || url === '/de' || url === '/en') return 'home';
  if (url.includes('/bridges')) return 'bridges';
  if (url.includes('/export')) return 'export';
  if (url.includes('/privacy')) return 'privacy';
  if (url.includes('/legal')) return 'legal';
  return 'other';
}

export default TimeButlerCalendarApp;