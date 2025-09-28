/**
 * Playwright Configuration for Progressive Enhancement Tests
 *
 * Specialized configuration for testing without JavaScript enabled.
 * Ensures all tests validate progressive enhancement and accessibility.
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/progressive',

  // Test configuration
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', {
      outputFolder: 'test-results/progressive-enhancement-report',
      open: 'never'
    }],
    ['json', {
      outputFile: 'test-results/progressive-enhancement-results.json'
    }],
    ['junit', {
      outputFile: 'test-results/progressive-enhancement-junit.xml'
    }],
    // Console reporter for CI/local development
    process.env.CI ? ['github'] : ['list']
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on test failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Disable JavaScript by default for progressive enhancement tests
    javaScriptEnabled: false,

    // Navigation timeout
    navigationTimeout: 15 * 1000,

    // Action timeout
    actionTimeout: 10 * 1000,

    // Locale for German market testing
    locale: 'de-DE',

    // Timezone
    timezoneId: 'Europe/Berlin',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    },

    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
  },

  // Test project configurations for different scenarios
  projects: [
    {
      name: 'progressive-chromium',
      use: {
        ...devices['Desktop Chrome'],
        javaScriptEnabled: false,
        // Test with German locale
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },

    {
      name: 'progressive-firefox',
      use: {
        ...devices['Desktop Firefox'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },

    {
      name: 'progressive-safari',
      use: {
        ...devices['Desktop Safari'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },

    // Mobile testing without JavaScript
    {
      name: 'progressive-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },

    {
      name: 'progressive-mobile-safari',
      use: {
        ...devices['iPhone 12'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },

    // English locale testing
    {
      name: 'progressive-english',
      use: {
        ...devices['Desktop Chrome'],
        javaScriptEnabled: false,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    },

    // High contrast testing for accessibility
    {
      name: 'progressive-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        // Simulate high contrast mode
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },

    // Slow network simulation
    {
      name: 'progressive-slow-network',
      use: {
        ...devices['Desktop Chrome'],
        javaScriptEnabled: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        // Simulate slow 3G connection
        connectionType: 'slow-3g',
      },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./test-setup/global-setup.js'),
  globalTeardown: require.resolve('./test-setup/global-teardown.js'),

  // Test output directory
  outputDir: 'test-results/progressive-enhancement',

  // Web server configuration for local testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      // Disable JavaScript optimizations for testing
      DISABLE_JS_OPTIMIZATION: 'true',
      // Enable server-side rendering
      FORCE_SSR: 'true',
    },
  },
});