/**
 * Real User Monitoring (RUM) Analytics for TimeButler Calendar
 * Tracks performance in production with constitutional compliance monitoring
 * Provides detailed analytics for German traffic patterns and seasonal spikes
 */

export interface RUMConfig {
  apiEndpoint: string;
  sampleRate: number;
  sessionTimeout: number;
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
  enableLongTaskTiming: boolean;
}

export interface RUMMetrics {
  // Core Web Vitals
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;

  // Navigation timing
  dnsLookup?: number;
  tcpConnect?: number;
  sslConnect?: number;
  serverResponse?: number;
  domParsing?: number;
  resourceLoading?: number;

  // User experience
  timeToInteractive?: number;
  totalBlockingTime?: number;
  speedIndex?: number;

  // Resource metrics
  resourceCount?: number;
  totalTransferSize?: number;
  totalResourceTime?: number;

  // Error tracking
  jsErrors?: number;
  networkErrors?: number;
  performanceErrors?: number;

  // Context
  sessionId: string;
  pageId: string;
  userId?: string;
  timestamp: number;
  url: string;
  referrer: string;
  viewport: { width: number; height: number };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    model?: string;
    os?: string;
    browser?: string;
  };
  network: {
    effectiveType: string;
    rtt?: number;
    downlink?: number;
  };
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone: string;
  };
  userBehavior: {
    isReturning: boolean;
    sessionCount: number;
    language: string;
    isGermanUser: boolean;
    planningSession?: {
      bridgesViewed: number;
      statesSelected: string[];
      exportRequested: boolean;
      emailSent: boolean;
    };
  };
}

export interface RUMEvent {
  type: 'pageview' | 'interaction' | 'error' | 'performance' | 'business';
  name: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  pageId: string;
}

class RUMAnalytics {
  private config: RUMConfig;
  private metrics: Partial<RUMMetrics> = {};
  private events: RUMEvent[] = [];
  private sessionId: string;
  private pageId: string;
  private isEnabled: boolean = false;
  private sendQueue: any[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private errorCount = { js: 0, network: 0, performance: 0 };

  constructor(config: Partial<RUMConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/v1/analytics/rum',
      sampleRate: 1.0, // 100% sampling for constitutional compliance monitoring
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableResourceTiming: true,
      enableUserTiming: true,
      enableLongTaskTiming: true,
      ...config,
    };

    this.sessionId = this.getOrCreateSessionId();
    this.pageId = this.generatePageId();

    this.initialize();
  }

  /**
   * Initialize RUM tracking
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Check if we should sample this user
    if (Math.random() > this.config.sampleRate) return;

    this.isEnabled = true;

    // Initialize metrics collection
    this.collectInitialMetrics();
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();
    this.setupBusinessEventTracking();

    // Send data on page unload
    this.setupUnloadHandlers();

    // Periodic data sending
    this.startPeriodicSending();

    console.log('🔍 RUM Analytics initialized for constitutional compliance monitoring');
  }

  /**
   * Collect initial page metrics
   */
  private collectInitialMetrics(): void {
    this.metrics = {
      sessionId: this.sessionId,
      pageId: this.pageId,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      device: this.detectDevice(),
      network: this.getNetworkInfo(),
      location: this.getLocationInfo(),
      userBehavior: this.getUserBehavior(),
    };

    // Collect navigation timing
    this.collectNavigationTiming();

    // Track initial pageview
    this.trackEvent('pageview', 'page_load', undefined, {
      pageType: this.getPageType(),
      language: document.documentElement.lang,
      isFirstVisit: !localStorage.getItem('tb_returning_user'),
    });

    // Mark as returning user
    localStorage.setItem('tb_returning_user', 'true');
  }

  /**
   * Setup performance observers for Core Web Vitals
   */
  private setupPerformanceObservers(): void {
    // Largest Contentful Paint
    this.observeLCP();

    // First Input Delay
    this.observeFID();

    // Cumulative Layout Shift
    this.observeCLS();

    // First Contentful Paint
    this.observeFCP();

    // Resource timing
    if (this.config.enableResourceTiming) {
      this.observeResourceTiming();
    }

    // Long tasks
    if (this.config.enableLongTaskTiming) {
      this.observeLongTasks();
    }

    // User timing marks
    if (this.config.enableUserTiming) {
      this.observeUserTiming();
    }
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

        // Check constitutional compliance (<2s on 3G)
        if (lastEntry.startTime > 2000) {
          this.trackPerformanceViolation('lcp', lastEntry.startTime, 2000);
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', observer);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
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

            // Check constitutional compliance (<100ms)
            if (fid > 100) {
              this.trackPerformanceViolation('fid', fid, 100);
            }
          }
        });
      });

      try {
        observer.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', observer);
      } catch (e) {
        console.warn('FID observer not supported');
      }
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

        // Check constitutional compliance (<0.1)
        if (clsValue > 0.1) {
          this.trackPerformanceViolation('cls', clsValue, 0.1);
        }
      });

      try {
        observer.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', observer);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
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
          }
        });
      });

      try {
        observer.observe({ type: 'paint', buffered: true });
        this.observers.set('fcp', observer);
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        let totalSize = 0;
        let totalTime = 0;
        let resourceCount = 0;

        entries.forEach((entry: any) => {
          if (entry.transferSize) {
            totalSize += entry.transferSize;
            totalTime += entry.duration;
            resourceCount++;
          }
        });

        this.metrics.resourceCount = (this.metrics.resourceCount || 0) + resourceCount;
        this.metrics.totalTransferSize = (this.metrics.totalTransferSize || 0) + totalSize;
        this.metrics.totalResourceTime = (this.metrics.totalResourceTime || 0) + totalTime;

        // Check bundle size budget (constitutional: <200KB)
        if (this.metrics.totalTransferSize > 204800) {
          this.trackPerformanceViolation('bundleSize', this.metrics.totalTransferSize, 204800);
        }
      });

      try {
        observer.observe({ type: 'resource', buffered: true });
        this.observers.set('resource', observer);
      } catch (e) {
        console.warn('Resource timing observer not supported');
      }
    }
  }

  /**
   * Observe long tasks (blocking main thread)
   */
  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          // Long task detected (>50ms)
          this.trackEvent('performance', 'long_task', entry.duration, {
            name: entry.name,
            startTime: entry.startTime,
          });

          // Accumulate total blocking time
          this.metrics.totalBlockingTime = (this.metrics.totalBlockingTime || 0) + Math.max(0, entry.duration - 50);
        });
      });

      try {
        observer.observe({ type: 'longtask', buffered: true });
        this.observers.set('longtask', observer);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  /**
   * Observe user timing marks and measures
   */
  private observeUserTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          this.trackEvent('performance', 'user_timing', entry.duration || entry.startTime, {
            name: entry.name,
            entryType: entry.entryType,
          });
        });
      });

      try {
        observer.observe({ type: 'mark', buffered: true });
        observer.observe({ type: 'measure', buffered: true });
        this.observers.set('usertiming', observer);
      } catch (e) {
        console.warn('User timing observer not supported');
      }
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.errorCount.js++;
      this.trackEvent('error', 'javascript_error', undefined, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount.js++;
      this.trackEvent('error', 'unhandled_rejection', undefined, {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.errorCount.network++;
        this.trackEvent('error', 'resource_error', undefined, {
          tagName: (event.target as Element).tagName,
          source: (event.target as any).src || (event.target as any).href,
        });
      }
    }, true);
  }

  /**
   * Setup user interaction tracking
   */
  private setupUserInteractionTracking(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('[data-track]')) {
        const label = target.textContent?.trim() || target.getAttribute('aria-label') || 'unknown';
        this.trackEvent('interaction', 'click', undefined, {
          element: target.tagName.toLowerCase(),
          label,
          url: (target as any).href,
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('interaction', 'form_submit', undefined, {
        action: form.action,
        method: form.method,
        elements: form.elements.length,
      });
    });
  }

  /**
   * Setup business event tracking (German vacation planning specific)
   */
  private setupBusinessEventTracking(): void {
    // Bridge weekend interactions
    document.addEventListener('click', (event) => {
      const target = event.target as Element;

      // Track bridge weekend selections
      if (target.closest('[data-bridge-id]')) {
        const bridgeId = target.closest('[data-bridge-id]')?.getAttribute('data-bridge-id');
        this.trackEvent('business', 'bridge_selected', undefined, { bridgeId });
      }

      // Track state selections
      if (target.closest('[data-state]')) {
        const state = target.closest('[data-state]')?.getAttribute('data-state');
        this.trackEvent('business', 'state_selected', undefined, { state });
      }

      // Track language switches
      if (target.closest('[data-lang-switch]')) {
        const lang = target.closest('[data-lang-switch]')?.getAttribute('data-lang');
        this.trackEvent('business', 'language_switched', undefined, { lang });
      }
    });
  }

  /**
   * Setup data sending on page unload
   */
  private setupUnloadHandlers(): void {
    // Send data when user leaves page
    const sendBeforeUnload = () => {
      this.sendQueuedData(true); // Use sendBeacon for reliability
    };

    window.addEventListener('beforeunload', sendBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendBeforeUnload();
      }
    });
  }

  /**
   * Start periodic data sending
   */
  private startPeriodicSending(): void {
    // Send data every 30 seconds for real-time monitoring
    setInterval(() => {
      this.sendQueuedData();
    }, 30000);
  }

  /**
   * Track performance violation against constitutional requirements
   */
  private trackPerformanceViolation(metric: string, value: number, threshold: number): void {
    this.errorCount.performance++;

    this.trackEvent('performance', 'constitutional_violation', value, {
      metric,
      threshold,
      exceedsBy: value - threshold,
      severity: value > threshold * 1.5 ? 'critical' : 'warning',
    });

    console.warn(`🚨 Constitutional Performance Violation: ${metric} = ${value} (threshold: ${threshold})`);
  }

  /**
   * Track custom event
   */
  public trackEvent(type: RUMEvent['type'], name: string, value?: number, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: RUMEvent = {
      type,
      name,
      value,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageId: this.pageId,
    };

    this.events.push(event);

    // Immediate send for critical events
    if (type === 'error' || (type === 'performance' && name === 'constitutional_violation')) {
      this.sendQueuedData();
    }
  }

  /**
   * Send queued data to analytics endpoint
   */
  private async sendQueuedData(useBeacon = false): Promise<void> {
    if (!this.isEnabled || this.sendQueue.length === 0 && this.events.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      pageId: this.pageId,
      timestamp: Date.now(),
      metrics: this.metrics,
      events: [...this.events],
      errorCounts: this.errorCount,
    };

    // Clear events after copying
    this.events = [];

    try {
      if (useBeacon && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon(
          this.config.apiEndpoint,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } else {
        // Regular fetch with keepalive
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('Failed to send RUM data:', error);
      // Re-queue events for retry
      this.events.unshift(...payload.events);
    }
  }

  /**
   * Collect navigation timing
   */
  private collectNavigationTiming(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const navigation = performance.navigation;

    this.metrics.dnsLookup = timing.domainLookupEnd - timing.domainLookupStart;
    this.metrics.tcpConnect = timing.connectEnd - timing.connectStart;
    this.metrics.sslConnect = timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0;
    this.metrics.serverResponse = timing.responseEnd - timing.requestStart;
    this.metrics.domParsing = timing.domContentLoadedEventEnd - timing.domLoading;
    this.metrics.resourceLoading = timing.loadEventEnd - timing.domContentLoadedEventEnd;
    this.metrics.ttfb = timing.responseStart - timing.requestStart;
  }

  /**
   * Detect device type and capabilities
   */
  private detectDevice() {
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;

    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (width <= 768) type = 'mobile';
    else if (width <= 1024) type = 'tablet';

    return {
      type,
      model: this.getDeviceModel(userAgent),
      os: this.getOS(userAgent),
      browser: this.getBrowser(userAgent),
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo() {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      rtt: connection?.rtt,
      downlink: connection?.downlink,
    };
  }

  /**
   * Get location information
   */
  private getLocationInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Country/region detection would require IP geolocation service
    };
  }

  /**
   * Get user behavior information
   */
  private getUserBehavior() {
    const sessionCount = parseInt(localStorage.getItem('tb_session_count') || '0') + 1;
    localStorage.setItem('tb_session_count', sessionCount.toString());

    return {
      isReturning: sessionCount > 1,
      sessionCount,
      language: navigator.language,
      isGermanUser: navigator.language.startsWith('de') || window.location.pathname.startsWith('/de'),
    };
  }

  // Utility methods
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('tb_rum_session');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('tb_rum_session', sessionId);
    }
    return sessionId;
  }

  private generatePageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/' || path === '/de' || path === '/en') return 'home';
    if (path.includes('/bridges')) return 'bridges';
    if (path.includes('/export')) return 'export';
    if (path.includes('/privacy')) return 'privacy';
    return 'other';
  }

  private getDeviceModel(userAgent: string): string | undefined {
    // Simplified device detection
    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Android/.test(userAgent)) return 'Android';
    return undefined;
  }

  private getOS(userAgent: string): string | undefined {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac OS/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS/.test(userAgent)) return 'iOS';
    return undefined;
  }

  private getBrowser(userAgent: string): string | undefined {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return undefined;
  }

  /**
   * Cleanup observers and stop tracking
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.sendQueuedData(true);
    this.isEnabled = false;
  }
}

// Export singleton instance
export const rumAnalytics = new RUMAnalytics();

// Export for custom configuration
export { RUMAnalytics };