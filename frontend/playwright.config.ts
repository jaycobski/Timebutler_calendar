/**
 * Playwright Configuration for Cross-Browser E2E Testing
 * Constitutional Requirements:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - WCAG 2.1 Level AA accessibility compliance
 * - German market user scenarios
 * - Progressive enhancement validation
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['github'] // GitHub Actions integration
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Collect screenshot on failure
    screenshot: 'only-on-failure',

    // Collect video on failure
    video: 'retain-on-failure',

    // Global timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Locale for German market testing
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',

    // Accept downloads for calendar exports
    acceptDownloads: true,

    // Ignore HTTPS errors in test environment
    ignoreHTTPSErrors: true,

    // Additional context options
    contextOptions: {
      // Reduce motion for accessibility testing
      reducedMotion: 'reduce',

      // Color scheme testing
      colorScheme: 'light',

      // Permissions for testing
      permissions: ['clipboard-read', 'clipboard-write'],

      // Geolocation for German testing
      geolocation: { latitude: 48.1351, longitude: 11.5820 }, // Munich, Germany
    }
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },

    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/,
    },

    // Desktop browsers - German market focus
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    // Mobile browsers - German mobile usage patterns
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
    },

    // Accessibility testing with screen reader simulation
    {
      name: 'accessibility-testing',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        // Screen reader simulation settings
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'active', // High contrast mode
          colorScheme: 'dark' // Test dark mode accessibility
        }
      },
      dependencies: ['setup'],
      testMatch: /.*\.accessibility\.spec\.ts/,
    },

    // Progressive enhancement testing (JavaScript disabled)
    {
      name: 'no-javascript',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        javaScriptEnabled: false // Constitutional requirement: works without JS
      },
      dependencies: ['setup'],
      testMatch: /.*\.progressive-enhancement\.spec\.ts/,
    },

    // Performance testing
    {
      name: 'performance-testing',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
      testMatch: /.*\.performance\.spec\.ts/,
    },

    // German states specific testing
    {
      name: 'german-states-testing',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin'
      },
      dependencies: ['setup'],
      testMatch: /.*\.german-states\.spec\.ts/,
    }
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001'
    }
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/helpers/global-playwright-setup.ts'),
  globalTeardown: require.resolve('./tests/helpers/global-playwright-teardown.ts'),

  // Test output directory
  outputDir: './playwright-test-results',

  // Timeout settings
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000
  },

  // Maximum failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,
});