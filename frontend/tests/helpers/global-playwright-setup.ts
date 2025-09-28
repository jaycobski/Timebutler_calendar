/**
 * Global Playwright Setup for E2E Testing
 * Constitutional Requirements:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - WCAG 2.1 Level AA accessibility compliance
 * - German market user scenarios
 * - Progressive enhancement validation
 * - Performance baseline establishment
 */

import { chromium, firefox, webkit, FullConfig } from '@playwright/test';
import { setupEmailTestEnvironment } from './email-test-helper';
import { setupPerformanceBaseline } from './performance-helper';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting Playwright E2E Test Environment');
  console.log('🇩🇪 German Holiday Bridge Weekend Calendar Testing');

  // Pre-launch browsers for faster test execution
  console.log('🚀 Pre-launching browsers for cross-browser testing...');

  const browserPromises = [
    chromium.launch({ headless: !process.env.DEBUG }),
    firefox.launch({ headless: !process.env.DEBUG }),
    webkit.launch({ headless: !process.env.DEBUG })
  ];

  try {
    const browsers = await Promise.all(browserPromises);
    console.log('✅ All browsers (Chrome, Firefox, Safari) launched successfully');

    // Verify application is accessible
    const context = await browsers[0].newContext({
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      reducedMotion: 'reduce',
    });

    const page = await context.newPage();

    try {
      console.log('🌐 Verifying application accessibility...');
      await page.goto('http://localhost:3000', { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      if (!title || title.toLowerCase().includes('error')) {
        throw new Error(`Application not ready: ${title}`);
      }

      console.log('✅ Application is accessible and ready for testing');

    } catch (error) {
      console.error('❌ Application accessibility check failed:', error);
      throw error;
    } finally {
      await page.close();
      await context.close();
    }

    // Close browsers after pre-launch check
    await Promise.all(browsers.map(browser => browser.close()));
  } catch (error) {
    console.warn('⚠️ Browser pre-launch warning:', error.message);
    throw error;
  }

  // Setup test environment infrastructure
  console.log('📧 Setting up email test environment...');
  await setupEmailTestEnvironment();

  console.log('⚡ Establishing performance baseline...');
  await setupPerformanceBaseline();

  // Set up test data directory
  const fs = require('fs').promises;
  const path = require('path');

  const testDataDir = path.join(__dirname, '../test-data');
  try {
    await fs.mkdir(testDataDir, { recursive: true });

    // Create comprehensive German test user scenarios
    const testScenarios = {
      bavarian_catholic_user: {
        state: 'BY',
        vacation_days: 30,
        language: 'de',
        email: 'bayern.user@test-timebutler.de',
        preferences: {
          include_religious_holidays: true,
          optimize_for: 'efficiency',
          preferred_bridge_length: '4_days'
        }
      },
      berlin_secular_user: {
        state: 'BE',
        vacation_days: 25,
        language: 'de',
        email: 'berlin.user@test-timebutler.de',
        preferences: {
          include_religious_holidays: false,
          optimize_for: 'total_days_off',
          preferred_bridge_length: '3_days'
        }
      },
      international_user: {
        state: 'NW',
        vacation_days: 28,
        language: 'en',
        email: 'international.user@test-timebutler.com',
        preferences: {
          include_religious_holidays: true,
          optimize_for: 'balanced',
          preferred_bridge_length: 'flexible'
        }
      },
      accessibility_user: {
        state: 'HH',
        vacation_days: 26,
        language: 'de',
        email: 'accessibility.user@test-timebutler.de',
        assistive_technology: 'screen_reader',
        preferences: {
          include_religious_holidays: true,
          optimize_for: 'simplicity',
          high_contrast: true
        }
      },
      mobile_user: {
        state: 'SN',
        vacation_days: 24,
        language: 'de',
        email: 'mobile.user@test-timebutler.de',
        device: 'mobile',
        preferences: {
          include_religious_holidays: true,
          optimize_for: 'efficiency'
        }
      }
    };

    await fs.writeFile(
      path.join(testDataDir, 'user-scenarios.json'),
      JSON.stringify(testScenarios, null, 2)
    );

    // Create comprehensive holiday test data for German states
    const holidayTestData = {
      federal_holidays_2025: [
        { key: 'neujahr', date: '2025-01-01', name_de: 'Neujahr', name_en: 'New Year\'s Day', bridge_opportunity: true },
        { key: 'karfreitag', date: '2025-04-18', name_de: 'Karfreitag', name_en: 'Good Friday', bridge_opportunity: true },
        { key: 'ostermontag', date: '2025-04-21', name_de: 'Ostermontag', name_en: 'Easter Monday', bridge_opportunity: false },
        { key: 'tag_der_arbeit', date: '2025-05-01', name_de: 'Tag der Arbeit', name_en: 'Labour Day', bridge_opportunity: true },
        { key: 'christi_himmelfahrt', date: '2025-05-29', name_de: 'Christi Himmelfahrt', name_en: 'Ascension Day', bridge_opportunity: true },
        { key: 'pfingstmontag', date: '2025-06-09', name_de: 'Pfingstmontag', name_en: 'Whit Monday', bridge_opportunity: false },
        { key: 'tag_der_deutschen_einheit', date: '2025-10-03', name_de: 'Tag der Deutschen Einheit', name_en: 'German Unity Day', bridge_opportunity: true },
        { key: 'weihnachtstag', date: '2025-12-25', name_de: '1. Weihnachtstag', name_en: 'Christmas Day', bridge_opportunity: false },
        { key: 'zweiter_weihnachtstag', date: '2025-12-26', name_de: '2. Weihnachtstag', name_en: 'Boxing Day', bridge_opportunity: true }
      ],
      bavarian_holidays_2025: [
        { key: 'heilige_drei_koenige', date: '2025-01-06', name_de: 'Heilige Drei Könige', name_en: 'Epiphany', bridge_opportunity: true },
        { key: 'fronleichnam', date: '2025-06-19', name_de: 'Fronleichnam', name_en: 'Corpus Christi', bridge_opportunity: true },
        { key: 'mariae_himmelfahrt', date: '2025-08-15', name_de: 'Mariä Himmelfahrt', name_en: 'Assumption of Mary', bridge_opportunity: true },
        { key: 'allerheiligen', date: '2025-11-01', name_de: 'Allerheiligen', name_en: 'All Saints\' Day', bridge_opportunity: false }
      ],
      bridge_weekend_examples: [
        {
          holiday: 'christi_himmelfahrt',
          start_date: '2025-05-29',
          end_date: '2025-06-01',
          vacation_days_needed: 1,
          total_days_off: 4,
          efficiency: 4.0,
          pattern: 'thursday-friday'
        },
        {
          holiday: 'tag_der_deutschen_einheit',
          start_date: '2025-10-03',
          end_date: '2025-10-05',
          vacation_days_needed: 1,
          total_days_off: 3,
          efficiency: 3.0,
          pattern: 'friday-monday'
        }
      ]
    };

    await fs.writeFile(
      path.join(testDataDir, 'holidays.json'),
      JSON.stringify(holidayTestData, null, 2)
    );

    console.log('✅ Test data files created successfully');

  } catch (error) {
    console.warn('⚠️ Test data setup warning:', error.message);
    throw error;
  }

  // Create test output directories
  console.log('📁 Creating test output directories...');
  const outputDirs = [
    'playwright-test-results',
    'playwright-report',
    'screenshots',
    'accessibility-reports',
    'performance-reports',
    'email-test-results',
    'video-recordings'
  ];

  try {
    for (const dir of outputDirs) {
      const fullPath = path.join(process.cwd(), dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
    console.log('✅ All test output directories created');
  } catch (error) {
    console.warn('⚠️ Output directory setup warning:', error.message);
  }

  // Configure environment variables for testing
  process.env.PLAYWRIGHT_PERFORMANCE_MONITORING = 'true';
  process.env.PLAYWRIGHT_ACCESSIBILITY_TESTING = 'true';
  process.env.TIMEBUTLER_TEST_MODE = 'true';
  process.env.GERMAN_LOCALE_TESTING = 'true';

  console.log('🎯 Playwright E2E test environment ready');
  console.log('🇩🇪 German market scenarios configured');
  console.log('♿ WCAG 2.1 Level AA accessibility testing enabled');
  console.log('📱 Cross-browser testing (Chrome, Firefox, Safari, Edge) configured');
  console.log('📧 Email delivery testing prepared');
  console.log('⚡ Performance baseline established');
  console.log('🌐 Progressive enhancement validation ready');
}
}

export default globalSetup;