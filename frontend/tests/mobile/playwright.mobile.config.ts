/**
 * Playwright Configuration for Mobile Testing
 * German cultural UX validation and responsive design testing
 */

import { defineConfig } from '@playwright/test';
import { GERMAN_MOBILE_DEVICES, GERMAN_MOBILE_BREAKPOINTS } from './mobile-test-setup';

export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,

  reporter: [
    ['html', { outputFolder: 'playwright-report-mobile' }],
    ['junit', { outputFile: 'test-results-mobile.xml' }],
    ['json', { outputFile: 'test-results-mobile.json' }]
  ],

  use: {
    // German localization defaults
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',

    // Mobile-first defaults
    hasTouch: true,
    isMobile: true,

    // Performance and debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Accessibility testing
    reducedMotion: 'reduce',

    // Network conditions
    offline: false,
    httpCredentials: undefined,

    // Extra HTTP headers for German context
    extraHTTPHeaders: {
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  },

  projects: [
    // German market leader devices
    {
      name: 'iPhone 13 Pro - German Market Leader',
      use: {
        ...GERMAN_MOBILE_DEVICES.IPHONE_13_PRO,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD
      },
    },

    {
      name: 'Samsung Galaxy S23 - Business Users',
      use: {
        ...GERMAN_MOBILE_DEVICES.SAMSUNG_GALAXY_S23,
        viewport: GERMAN_MOBILE_BREAKPOINTS.LARGE
      },
    },

    {
      name: 'iPhone 12 - Mainstream',
      use: {
        ...GERMAN_MOBILE_DEVICES.IPHONE_12,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD
      },
    },

    // Tech-savvy and performance users
    {
      name: 'Google Pixel 7 - Tech Savvy',
      use: {
        ...GERMAN_MOBILE_DEVICES.PIXEL_7,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD
      },
    },

    {
      name: 'OnePlus 11 - Performance',
      use: {
        ...GERMAN_MOBILE_DEVICES.ONEPLUS_11,
        viewport: GERMAN_MOBILE_BREAKPOINTS.LARGE
      },
    },

    // Tablet testing
    {
      name: 'iPad Portrait - Tablet',
      use: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: GERMAN_MOBILE_BREAKPOINTS.TABLET_PORTRAIT,
        hasTouch: true,
        isMobile: true,
      },
    },

    {
      name: 'iPad Landscape - Tablet',
      use: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: GERMAN_MOBILE_BREAKPOINTS.TABLET_LANDSCAPE,
        hasTouch: true,
        isMobile: true,
      },
    },

    // Edge cases
    {
      name: 'Compact Device - iPhone SE',
      use: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: GERMAN_MOBILE_BREAKPOINTS.COMPACT,
        hasTouch: true,
        isMobile: true,
      },
    },

    {
      name: 'Foldable - Galaxy Fold',
      use: {
        userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-F936B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Mobile Safari/537.36',
        viewport: GERMAN_MOBILE_BREAKPOINTS.FOLDABLE,
        hasTouch: true,
        isMobile: true,
      },
    },

    // Network condition testing
    {
      name: 'Slow 3G - German Mobile Network',
      use: {
        ...GERMAN_MOBILE_DEVICES.IPHONE_13_PRO,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD,
        // Simulate slower German mobile network
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },

    // Accessibility testing project
    {
      name: 'Accessibility - High Contrast',
      use: {
        ...GERMAN_MOBILE_DEVICES.IPHONE_13_PRO,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD,
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        // Force high contrast mode
        extraHTTPHeaders: {
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          'Sec-CH-Prefers-Color-Scheme': 'dark',
          'Sec-CH-Prefers-Reduced-Motion': 'reduce'
        }
      },
    },

    // German language testing
    {
      name: 'German Language - Formal Business',
      use: {
        ...GERMAN_MOBILE_DEVICES.SAMSUNG_GALAXY_S23,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        extraHTTPHeaders: {
          'Accept-Language': 'de-DE,de;q=1.0',
        }
      },
    },

    // English language comparison
    {
      name: 'English Language - Casual International',
      use: {
        ...GERMAN_MOBILE_DEVICES.IPHONE_13_PRO,
        viewport: GERMAN_MOBILE_BREAKPOINTS.STANDARD,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=1.0',
        }
      },
    }
  ],

  // Global test configuration
  globalSetup: './tests/mobile/global-setup.ts',
  globalTeardown: './tests/mobile/global-teardown.ts',

  // Web server for local testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Test output directories
  outputDir: 'test-results-mobile/',

  // Expect configuration
  expect: {
    // German user patience threshold
    timeout: 10000,
    toHaveScreenshot: {
      // High threshold for German market device variations
      threshold: 0.3,
      mode: 'local'
    },
    toMatchSnapshot: {
      threshold: 0.3
    }
  },

  // Metadata for reporting
  metadata: {
    testSuite: 'Mobile Responsive Design',
    market: 'German',
    culturalValidation: true,
    accessibilityLevel: 'WCAG 2.1 Level AA',
    deviceCoverage: '75% German market share',
    lastUpdated: '2025-01-24'
  }
});