// Lighthouse CI Configuration for TimeButler Calendar
// Constitutional requirement: Lighthouse score >90 for all metrics
// Performance targets: <2s load on 3G, <200KB gzipped bundles

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000',                    // Home page
        'http://localhost:3000/de',                 // German home
        'http://localhost:3000/en',                 // English home
        'http://localhost:3000/de/bridges',         // Bridge weekends (DE)
        'http://localhost:3000/en/bridges',         // Bridge weekends (EN)
        'http://localhost:3000/de/export',          // Export page (DE)
        'http://localhost:3000/en/export',          // Export page (EN)
        'http://localhost:3000/de/privacy',         // Privacy/GDPR (DE)
        'http://localhost:3000/en/privacy',         // Privacy/GDPR (EN)
      ],
      settings: {
        // Simulate 3G network conditions as per constitutional requirements
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        // Mobile-first testing (German users heavily mobile)
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
        // Comprehensive audits
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: null,
        // Extended timeout for thorough testing
        maxWaitForLoad: 45000,
        // Disable storage reset to test caching strategies
        disableStorageReset: false,
      },
    },
    assert: {
      // Constitutional performance requirements
      assertions: {
        // Overall category scores (constitutional requirement: >90)
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals (Google ranking factors)
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],  // <2s LCP
        'first-input-delay': ['error', { maxNumericValue: 100 }],          // <100ms FID
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],    // <0.1 CLS
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],    // <1.5s FCP

        // Performance budgets (constitutional: <200KB gzipped)
        'total-byte-weight': ['error', { maxNumericValue: 204800 }],       // 200KB
        'modern-image-formats': ['error', { minScore: 0.9 }],
        'uses-webp-images': ['error', { minScore: 0.9 }],
        'efficient-animated-content': ['error', { minScore: 0.9 }],

        // Network efficiency
        'uses-text-compression': ['error', { minScore: 0.9 }],
        'uses-responsive-images': ['error', { minScore: 0.9 }],
        'offscreen-images': ['error', { minScore: 0.9 }],
        'render-blocking-resources': ['error', { maxNumericValue: 500 }],

        // JavaScript optimization
        'unused-javascript': ['error', { maxNumericValue: 20480 }],        // <20KB unused
        'uses-rel-preload': ['error', { minScore: 0.8 }],
        'preload-lcp-image': ['error', { minScore: 0.8 }],

        // Accessibility (WCAG 2.1 Level AA requirement)
        'color-contrast': ['error', { minScore: 1.0 }],
        'heading-order': ['error', { minScore: 1.0 }],
        'html-has-lang': ['error', { minScore: 1.0 }],
        'html-lang-valid': ['error', { minScore: 1.0 }],
        'image-alt': ['error', { minScore: 1.0 }],
        'link-name': ['error', { minScore: 1.0 }],
        'button-name': ['error', { minScore: 1.0 }],
        'form-field-multiple-labels': ['error', { minScore: 1.0 }],
        'label': ['error', { minScore: 1.0 }],

        // German/bilingual specific validations
        'meta-description': ['warn', { minScore: 0.8 }],
        'document-title': ['error', { minScore: 1.0 }],

        // Progressive Web App features
        'service-worker': ['warn', { minScore: 0.8 }],
        'offline-start-url': ['warn', { minScore: 0.8 }],
        'apple-touch-icon': ['error', { minScore: 1.0 }],
        'themed-omnibox': ['error', { minScore: 1.0 }],

        // Security
        'is-on-https': ['error', { minScore: 1.0 }],
        'uses-https': ['error', { minScore: 1.0 }],
        'no-vulnerable-libraries': ['error', { minScore: 1.0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: 'lighthouse-%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: './lighthouse-ci-storage',
      },
    },
  },
  // Performance monitoring configuration
  monitoring: {
    // Synthetic testing schedule
    schedules: {
      // Peak German planning season (December-January)
      peak: {
        interval: '*/15 * * * *',  // Every 15 minutes during peak
        months: [11, 0, 1],        // Nov, Dec, Jan
      },
      // Regular monitoring
      normal: {
        interval: '0 */2 * * *',   // Every 2 hours
        months: [2, 3, 4, 5, 6, 7, 8, 9, 10], // Feb-Oct
      },
    },
    // Performance budgets
    budgets: {
      network: {
        '3g': {
          lcp: 2000,
          fcp: 1500,
          fid: 100,
          cls: 0.1,
        },
        '4g': {
          lcp: 1200,
          fcp: 800,
          fid: 50,
          cls: 0.1,
        },
      },
      bundle: {
        total: 204800,      // 200KB gzipped
        javascript: 102400, // 100KB JS
        css: 51200,         // 50KB CSS
        images: 51200,      // 50KB images
      },
    },
    // Alerting thresholds
    alerts: {
      performance: {
        critical: 85,   // Alert if score drops below 85
        warning: 90,    // Warn if score drops below 90
      },
      availability: {
        uptime: 99.9,   // 99.9% uptime requirement
        errorRate: 0.1, // <0.1% error rate
      },
    },
  },
};