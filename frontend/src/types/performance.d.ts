/**
 * Performance monitoring type definitions for TimeButler Calendar
 */

declare global {
  interface Window {
    __TB_LCP?: number;
    __TB_FCP?: number;
    __TB_Performance?: {
      monitor: typeof import('../lib/performance-monitor').performanceMonitor;
      analytics: typeof import('../lib/rum-analytics').rumAnalytics;
    };
  }

  interface Navigator {
    connection?: {
      effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
      downlink: number;
      rtt: number;
    };
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export {};