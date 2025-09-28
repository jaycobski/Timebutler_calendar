/**
 * Performance Monitoring Module for TimeButler Calendar
 * Constitutional requirement: Lighthouse score >90, <2s load on 3G
 * Implements Core Web Vitals tracking and real-user monitoring
 */

// Core Web Vitals types
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number;      // Largest Contentful Paint
  fid?: number;      // First Input Delay
  cls?: number;      // Cumulative Layout Shift
  fcp?: number;      // First Contentful Paint
  ttfb?: number;     // Time to First Byte

  // Additional metrics
  domContentLoaded?: number;
  loadComplete?: number;
  navigationStart?: number;

  // Network information
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };

  // User context
  language: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };

  // Page context
  url: string;
  referrer: string;
  timestamp: number;
}

interface PerformanceBudget {
  lcp: number;       // 2000ms for 3G
  fid: number;       // 100ms constitutional requirement
  cls: number;       // 0.1 constitutional requirement
  fcp: number;       // 1500ms target
  ttfb: number;      // 600ms target
  totalBytes: number; // 200KB constitutional requirement
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private budget: PerformanceBudget;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = {
      language: document.documentElement.lang || 'de',
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
    };

    // Constitutional performance budgets
    this.budget = {
      lcp: 2000,    // <2s on 3G (constitutional)
      fid: 100,     // <100ms interactions (constitutional)
      cls: 0.1,     // <0.1 layout shift (constitutional)
      fcp: 1500,    // <1.5s first paint
      ttfb: 600,    // <600ms server response
      totalBytes: 204800, // <200KB gzipped (constitutional)
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize comprehensive performance monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor resource loading
    this.observeResourceTiming();

    // Monitor network conditions
    this.observeNetworkInformation();

    // Monitor memory usage (if available)
    this.observeMemoryUsage();

    // Send initial metrics after page load
    if (document.readyState === 'complete') {
      this.sendMetrics();
    } else {
      window.addEventListener('load', () => this.sendMetrics());
    }

    // Send metrics on visibility change (user leaving page)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics();
      }
    });
  }

  /**
   * Observe navigation timing metrics
   */
  private observeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.navigationStart = navigation.navigationStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        this.metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }
    }
  }

  /**
   * Observe Core Web Vitals with web-vitals library integration
   */
  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    this.observeLCP();

    // FID - First Input Delay
    this.observeFID();

    // CLS - Cumulative Layout Shift
    this.observeCLS();

    // FCP - First Contentful Paint
    this.observeFCP();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.checkBudgetCompliance('lcp', lastEntry.startTime);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', observer);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.fid = fid;
            this.checkBudgetCompliance('fid', fid);
          }
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', observer);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.metrics.cls = clsValue;
        this.checkBudgetCompliance('cls', clsValue);
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', observer);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.checkBudgetCompliance('fcp', entry.startTime);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.set('fcp', observer);
    }
  }

  /**
   * Observe resource loading performance
   */
  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        // Calculate total bytes transferred
        let totalBytes = 0;
        entries.forEach((entry: any) => {
          if (entry.transferSize) {
            totalBytes += entry.transferSize;
          }
        });

        // Check bundle size budget
        if (totalBytes > 0) {
          this.checkBudgetCompliance('totalBytes', totalBytes);
        }
      });

      observer.observe({ type: 'resource', buffered: true });
      this.observers.set('resource', observer);
    }
  }

  /**
   * Observe network information
   */
  private observeNetworkInformation(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };

      // Listen for network changes
      connection.addEventListener('change', () => {
        this.metrics.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        };
      });
    }
  }

  /**
   * Observe memory usage (Chrome only)
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics = {
        ...this.metrics,
        memory: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        },
      };
    }
  }

  /**
   * Check if metric exceeds performance budget
   */
  private checkBudgetCompliance(metric: keyof PerformanceBudget, value: number): void {
    const budget = this.budget[metric];
    const isWithinBudget = value <= budget;

    if (!isWithinBudget) {
      console.warn(
        `⚡ Performance Budget Exceeded: ${metric} = ${value}ms (budget: ${budget}ms)`,
        {
          metric,
          value,
          budget,
          exceedsBy: value - budget,
          url: window.location.href,
        }
      );

      // Send alert to monitoring service
      this.sendAlert({
        type: 'budget-exceeded',
        metric,
        value,
        budget,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }

  /**
   * Send performance metrics to monitoring service
   */
  private async sendMetrics(): Promise<void> {
    try {
      // Add final navigation timing if available
      if (performance.timing) {
        const timing = performance.timing;
        this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.metrics.loadComplete = timing.loadEventEnd - timing.navigationStart;
      }

      // Send to analytics endpoint
      await fetch('/api/v1/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.metrics,
          session_id: this.getSessionId(),
          page_type: this.getPageType(),
          is_german_user: this.isGermanUser(),
        }),
        keepalive: true, // Ensure metrics are sent even if user navigates away
      });

    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Send performance alert
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      await fetch('/api/v1/alerts/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('tb_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('tb_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Determine page type for segmented analysis
   */
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/' || path === '/de' || path === '/en') return 'home';
    if (path.includes('/bridges')) return 'bridges';
    if (path.includes('/export')) return 'export';
    if (path.includes('/privacy')) return 'privacy';
    return 'other';
  }

  /**
   * Detect if user is likely German (for segmented analysis)
   */
  private isGermanUser(): boolean {
    const lang = navigator.language.toLowerCase();
    const path = window.location.pathname;
    return lang.startsWith('de') || path.startsWith('/de');
  }

  /**
   * Manual performance mark for custom metrics
   */
  public mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Manual performance measure for custom metrics
   */
  public measure(name: string, startMark?: string, endMark?: string): void {
    if ('performance' in window && 'measure' in performance) {
      performance.measure(name, startMark, endMark);
    }
  }

  /**
   * Get current performance metrics snapshot
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Cleanup observers
   */
  public destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types for external use
export type { PerformanceMetrics, WebVitalsMetric, PerformanceBudget };

// Utility function for React components
export function usePerformanceMonitor() {
  return {
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
  };
}