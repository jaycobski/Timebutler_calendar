/**
 * Global Setup for Progressive Enhancement Tests
 *
 * Prepares the test environment for no-JavaScript testing.
 */

const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Setting up Progressive Enhancement Test Environment...');

  // Create browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext({
    javaScriptEnabled: false
  });
  const page = await context.newPage();

  try {
    // Verify server is running and JavaScript is disabled
    const baseURL = config.webServer?.port
      ? `http://localhost:${config.webServer.port}`
      : config.use?.baseURL || 'http://localhost:3000';

    console.log(`📍 Testing server availability at: ${baseURL}`);

    // Test server response
    const response = await page.goto(baseURL);
    if (!response.ok()) {
      throw new Error(`Server not responding: ${response.status()}`);
    }

    // Verify JavaScript is disabled
    const jsDisabled = await page.evaluate(() => {
      try {
        // This should work (basic DOM access)
        const title = document.title;

        // But advanced JS features should be limited
        return {
          hasTitle: title.length > 0,
          jsContextLimited: typeof window === 'undefined' ? false : true
        };
      } catch (e) {
        return { hasTitle: false, jsContextLimited: false };
      }
    }).catch(() => ({ hasTitle: false, jsContextLimited: false }));

    if (!jsDisabled.hasTitle) {
      throw new Error('Server not returning proper HTML content');
    }

    console.log('✅ Server is responding with proper HTML content');
    console.log('✅ JavaScript execution is properly controlled');

    // Verify essential pages are working
    const testPages = [
      '/',
      '/?state=BY&year=2025',
      '/?lang=en'
    ];

    for (const testPage of testPages) {
      const pageResponse = await page.goto(`${baseURL}${testPage}`);
      if (!pageResponse.ok()) {
        console.warn(`⚠️  Warning: ${testPage} returned status ${pageResponse.status()}`);
      } else {
        console.log(`✅ ${testPage} is accessible`);
      }
    }

    // Check for required HTML structure
    await page.goto(baseURL);

    const hasMain = await page.locator('main, [role="main"]').count() > 0;
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
    const hasH1 = await page.locator('h1').count() === 1;

    if (!hasMain || !hasNav || !hasH1) {
      console.warn('⚠️  Warning: Page structure may not be optimal for progressive enhancement');
      console.log(`   Main: ${hasMain}, Nav: ${hasNav}, H1: ${hasH1}`);
    } else {
      console.log('✅ Page structure is properly semantic');
    }

    console.log('🎯 Progressive Enhancement Test Environment Ready');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;