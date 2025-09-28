/**
 * Global Setup for Mobile Testing
 * Initializes German market testing environment and validates prerequisites
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('\n🇩🇪 Initializing German Mobile Testing Environment...\n');

  // Validate test environment
  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  try {
    // Test application availability
    console.log('📱 Checking application availability...');
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';

    await page.goto(baseURL, { timeout: 30000 });

    console.log('✅ Application is accessible');

    // Validate German locale support
    console.log('🌍 Validating German locale support...');

    const dateFormat = await page.evaluate(() => {
      const date = new Date('2025-01-24');
      return new Intl.DateTimeFormat('de-DE').format(date);
    });

    console.log(`📅 German date format: ${dateFormat}`);

    if (!dateFormat.includes('.')) {
      console.warn('⚠️  Warning: German date format may not be properly configured');
    }

    // Validate number format
    const numberFormat = await page.evaluate(() => {
      return new Intl.NumberFormat('de-DE').format(1234.56);
    });

    console.log(`🔢 German number format: ${numberFormat}`);

    if (!numberFormat.includes(',')) {
      console.warn('⚠️  Warning: German number format may not be properly configured');
    }

    // Test touch capabilities
    console.log('👆 Validating touch capabilities...');

    const touchSupport = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });

    if (touchSupport) {
      console.log('✅ Touch support detected');
    } else {
      console.warn('⚠️  Warning: Touch support may not be properly simulated');
    }

    // Check viewport meta tag
    console.log('📐 Checking responsive design setup...');

    const viewportMeta = await page.$('meta[name="viewport"]');
    if (viewportMeta) {
      const content = await viewportMeta.getAttribute('content');
      console.log(`✅ Viewport meta: ${content}`);
    } else {
      console.warn('⚠️  Warning: No viewport meta tag found');
    }

    // Validate German accessibility features
    console.log('♿ Checking accessibility setup...');

    const langAttribute = await page.getAttribute('html', 'lang');
    console.log(`🗣️  HTML lang attribute: ${langAttribute}`);

    if (langAttribute && (langAttribute.startsWith('de') || langAttribute.startsWith('en'))) {
      console.log('✅ Language attribute properly set');
    } else {
      console.warn('⚠️  Warning: HTML lang attribute may need review');
    }

    // Check for skip links (German accessibility requirement)
    const skipLink = await page.$('a[href*="#main"], a[href*="#content"], .skip-link');
    if (skipLink) {
      console.log('✅ Skip links found (accessibility)');
    } else {
      console.warn('⚠️  Warning: No skip links found (recommended for German accessibility)');
    }

    // Test language switching capability
    console.log('🔄 Testing language switching...');

    const languageSwitcher = await page.$('[data-testid*="language"], [data-testid*="lang"], .language-switch');
    if (languageSwitcher) {
      console.log('✅ Language switcher found');
    } else {
      console.log('ℹ️  Note: No language switcher found (may be implemented differently)');
    }

    // Validate cookie consent (GDPR requirement)
    console.log('🍪 Checking GDPR compliance setup...');

    const cookieBanner = await page.$('[data-testid*="cookie"], .cookie-banner, [data-testid*="consent"]');
    if (cookieBanner) {
      console.log('✅ Cookie consent banner found');
    } else {
      console.warn('⚠️  Warning: No cookie consent banner found (GDPR requirement)');
    }

    // Performance baseline check
    console.log('⚡ Establishing performance baseline...');

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: 0 // Would need more complex measurement
      };
    });

    console.log(`📊 Load time: ${performanceMetrics.loadTime}ms`);
    console.log(`📊 DOM content loaded: ${performanceMetrics.domContentLoaded}ms`);

    if (performanceMetrics.loadTime > 5000) {
      console.warn('⚠️  Warning: Application load time is slower than German user expectations (>5s)');
    }

    // Check for common German business elements
    console.log('🏢 Validating German business context...');

    const pageContent = await page.textContent('body');
    if (pageContent) {
      const hasGermanElements = /\b(sie|ihr|willkommen|feiertag|bundesland|datenschutz|impressum)\b/i.test(pageContent);
      const hasBusinessTone = !/\b(hey|hi|cool|awesome)\b/i.test(pageContent);

      if (hasGermanElements) {
        console.log('✅ German language elements detected');
      }

      if (hasBusinessTone) {
        console.log('✅ Professional business tone maintained');
      } else {
        console.warn('⚠️  Warning: Casual language detected (may not suit German business context)');
      }
    }

    console.log('\n✅ Mobile testing environment validation complete');
    console.log('🚀 Ready to run German mobile UX tests\n');

  } catch (error) {
    console.error('\n❌ Error during mobile testing setup:', error);
    console.error('🔧 Please check application availability and configuration\n');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;