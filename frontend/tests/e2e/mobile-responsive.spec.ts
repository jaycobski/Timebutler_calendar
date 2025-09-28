/**
 * Mobile Responsive Testing Scenarios
 * Constitutional Requirements:
 * - Mobile-first responsive design validation
 * - Touch interaction testing
 * - German mobile usage patterns
 * - Accessibility on mobile devices
 * - Performance on mobile networks
 */

import { test, expect, Page, devices } from '@playwright/test';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';
import { measurePerformance } from '../helpers/performance-helper';
import { getTestUsers } from '../helpers/test-data-helper';

test.describe('Mobile Responsive Testing', () => {
  const testUsers = getTestUsers();
  const mobileUser = testUsers.find(u => u.id === 'mobile_user')!;

  // Mobile device configurations for testing
  const mobileDevices = [
    { name: 'iPhone 14', device: devices['iPhone 14'] },
    { name: 'Pixel 7', device: devices['Pixel 7'] },
    { name: 'Galaxy S23', device: devices['Galaxy S8'] }, // Close approximation
    { name: 'iPad Pro', device: devices['iPad Pro'] }
  ];

  test.describe('Core Mobile Functionality', () => {
    test.use({ ...devices['iPhone 14'] });

    test('Mobile Vacation Planning Journey', async ({ page }) => {
      await test.step('Complete mobile vacation planning flow', async () => {
        await page.goto('/', { waitUntil: 'networkidle' });

        // Verify mobile layout
        await expect(page).toHaveTitle(/TimeButler.*Brückentage|TimeButler.*Bridge/);

        // Test mobile navigation
        const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
          page.locator('.mobile-menu, .hamburger-menu, [aria-label*="menu"]')
        );

        if (await mobileMenu.isVisible()) {
          await mobileMenu.tap();
          await page.waitForTimeout(500); // Animation
        }

        // Mobile state selection
        const stateSelector = page.locator('select[name="state"]');
        await expect(stateSelector).toBeVisible();

        // Touch interaction for state selection
        await stateSelector.tap();
        await stateSelector.selectOption('SN');

        // Mobile number input
        const vacationInput = page.locator('input[name="vacationDays"]');
        await expect(vacationInput).toBeVisible();

        // Test mobile keyboard input
        await vacationInput.tap();
        await vacationInput.fill('24');

        // Mobile toggle for religious holidays
        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.tap();
        }

        // Mobile generate button
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await expect(generateButton).toBeVisible();
        await generateButton.tap();

        // Wait for mobile results
        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

        // Verify mobile layout of results
        const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
        const count = await bridgeItems.count();
        expect(count).toBeGreaterThan(0);

        // Test mobile scrolling through results
        if (count > 3) {
          await page.evaluate(() => window.scrollTo(0, window.innerHeight));
          await page.waitForTimeout(500);
        }

        // Mobile selection of bridge weekends
        for (let i = 0; i < Math.min(count, 2); i++) {
          const checkbox = bridgeItems.nth(i).locator('input[type="checkbox"]');
          if (await checkbox.isVisible()) {
            await checkbox.tap();
          }
        }

        // Mobile email input
        const emailInput = page.locator('input[type="email"]');
        await emailInput.tap();
        await emailInput.fill(mobileUser.email);

        // Mobile GDPR consent
        const gdprConsent = page.locator('input[name="gdprConsent"]');
        if (await gdprConsent.isVisible()) {
          await gdprConsent.tap();
        }

        // Mobile submit
        const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
        await submitButton.tap();

        // Verify mobile success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });
      });
    });

    test('Mobile Touch Interaction Validation', async ({ page }) => {
      await test.step('Test mobile-specific touch interactions', async () => {
        await page.goto('/');

        // Test touch targets meet minimum size requirements (44px)
        const interactiveElements = page.locator('button, input, select, a, [role="button"]');
        const count = await interactiveElements.count();

        for (let i = 0; i < Math.min(count, 10); i++) {
          const element = interactiveElements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              // WCAG mobile touch target minimum: 44px
              expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
            }
          }
        }

        // Test swipe gestures if applicable
        const cardElements = page.locator('[data-testid="bridge-weekend-item"]');
        if (await cardElements.first().isVisible()) {
          const firstCard = cardElements.first();
          const box = await firstCard.boundingBox();

          if (box) {
            // Test horizontal swipe
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
            await page.mouse.up();

            // Verify no layout break after swipe
            await expect(firstCard).toBeVisible();
          }
        }

        // Test pinch-to-zoom prevention on form elements
        const formElements = page.locator('input, select, textarea');
        if (await formElements.first().isVisible()) {
          const metaViewport = await page.locator('meta[name="viewport"]').getAttribute('content');
          expect(metaViewport).toMatch(/user-scalable=no|maximum-scale=1/);
        }
      });
    });

    test('Mobile Accessibility Validation', async ({ page, browserName }) => {
      await test.step('Test mobile accessibility compliance', async () => {
        await page.goto('/');

        // Complete basic form for accessibility testing
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('SN');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('24');

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.tap();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        // Run mobile accessibility test
        const accessibilityResults = await runCompleteAccessibilityTest(page, {
          locale: 'de-DE',
          reportPath: `accessibility-reports/${browserName}-mobile.json`
        });

        expect(accessibilityResults.overallCompliance).toBe(true);

        // Mobile-specific accessibility checks
        expect(accessibilityResults.keyboardTest.passed).toBe(true); // Touch devices still need keyboard support
        expect(accessibilityResults.colorContrastTest.passed).toBe(true);

        // Verify mobile screen reader compatibility
        const headingStructure = accessibilityResults.screenReaderTest.headingStructure;
        expect(headingStructure.length).toBeGreaterThan(0);

        // Check mobile navigation landmarks
        const landmarks = accessibilityResults.screenReaderTest.landmarks;
        expect(landmarks.some(l => l.includes('navigation') || l.includes('nav'))).toBe(true);
      });
    });

    test('Mobile Performance Validation', async ({ page }) => {
      await test.step('Test mobile performance requirements', async () => {
        // Simulate mobile 3G network
        await page.route('**/*', async (route) => {
          // Mobile 3G: higher latency, lower bandwidth
          await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 400));
          await route.continue();
        });

        const performanceMetrics = await measurePerformance(page, {
          simulateSlowNetwork: true,
          testDevice: 'mobile',
          waitForInteraction: true
        });

        // Constitutional requirements for mobile
        expect(performanceMetrics.constitutional_compliance.page_load_under_2s).toBe(true);
        expect(performanceMetrics.constitutional_compliance.interaction_under_100ms).toBe(true);

        // Mobile-specific performance budgets
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);
        expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2500);
        expect(performanceMetrics.cumulativeLayoutShift).toBeLessThan(0.1);

        // Mobile bundle size should be optimized
        expect(performanceMetrics.gzippedBundleSize).toBeLessThan(200000); // 200KB constitutional limit
      });
    });
  });

  test.describe('Cross-Device Responsive Testing', () => {
    mobileDevices.forEach(({ name, device }) => {
      test(`${name} Device Compatibility`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
          locale: 'de-DE',
          timezoneId: 'Europe/Berlin'
        });

        const page = await context.newPage();

        await test.step(`Test ${name} layout and functionality`, async () => {
          await page.goto('/');

          // Verify viewport meta tag
          const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
          expect(viewport).toMatch(/width=device-width/);

          // Test responsive breakpoints
          const viewportSize = page.viewportSize();
          expect(viewportSize).toBeTruthy();

          if (viewportSize) {
            if (viewportSize.width < 768) {
              // Mobile layout
              await testMobileLayout(page);
            } else {
              // Tablet layout
              await testTabletLayout(page);
            }
          }

          // Test device-specific interactions
          await testDeviceInteractions(page, name);

          // Take device-specific screenshot
          await page.screenshot({
            path: `screenshots/${name.toLowerCase().replace(' ', '-')}-responsive.png`,
            fullPage: true
          });

          await context.close();
        });
      });
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test.use({ ...devices['iPhone 14'] });

    test('Mobile Calendar Integration', async ({ page }) => {
      await test.step('Test mobile calendar app integration', async () => {
        await page.goto('/');

        // Complete vacation planning
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('BY');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('25');

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.tap();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        // Select bridge weekends
        const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
        const checkbox = bridgeItems.first().locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.tap();
        }

        // Test mobile calendar download
        const downloadButton = page.locator('[data-testid="download-calendar"]').or(
          page.locator('button').filter({ hasText: /download|herunterladen|calendar|kalender/i })
        );

        if (await downloadButton.isVisible()) {
          // Set up download handling
          const downloadPromise = page.waitForEvent('download');
          await downloadButton.tap();

          // Verify download initiated
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.ics$/);
        }
      });
    });

    test('Mobile Form Validation and Input', async ({ page }) => {
      await test.step('Test mobile-optimized form inputs', async () => {
        await page.goto('/');

        // Test mobile number input
        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.tap();

        // Verify mobile keyboard type
        const inputType = await vacationInput.getAttribute('type');
        const inputMode = await vacationInput.getAttribute('inputmode');

        // Should use numeric input for better mobile UX
        expect(inputType === 'number' || inputMode === 'numeric').toBe(true);

        // Test input validation on mobile
        await vacationInput.fill('-5');
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.tap();

        // Should show mobile-friendly error
        const errorMessage = page.locator('[data-testid="validation-error"]').or(
          page.locator('.error').first()
        );
        await expect(errorMessage).toBeVisible();

        // Test email input
        await vacationInput.fill('25');
        await generateButton.tap();
        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        const emailInput = page.locator('input[type="email"]');
        await emailInput.tap();

        // Verify email keyboard on mobile
        const emailInputType = await emailInput.getAttribute('type');
        expect(emailInputType).toBe('email');

        // Test invalid email on mobile
        await emailInput.fill('invalid-email');
        const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
        await submitButton.tap();

        const emailError = page.locator('[data-testid="email-validation-error"]').or(
          page.locator('.error').filter({ hasText: /email/i })
        );
        await expect(emailError).toBeVisible();
      });
    });

    test('Mobile Orientation Handling', async ({ page }) => {
      await test.step('Test landscape and portrait orientations', async () => {
        await page.goto('/');

        // Test portrait orientation (default)
        await testPortraitLayout(page);

        // Simulate landscape orientation
        await page.setViewportSize({ width: 896, height: 414 }); // iPhone landscape
        await page.waitForTimeout(500); // Allow reflow

        await testLandscapeLayout(page);

        // Verify functionality in landscape
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('BY');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('25');

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.tap();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        // Verify results are usable in landscape
        const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
        expect(await bridgeItems.count()).toBeGreaterThan(0);
      });
    });

    test('Mobile Network Conditions', async ({ page }) => {
      await test.step('Test under poor mobile network conditions', async () => {
        // Simulate very slow mobile network
        await page.route('**/*', async (route) => {
          // Simulate slow 2G: 800ms+ latency
          await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 600));
          await route.continue();
        });

        const startTime = Date.now();
        await page.goto('/');

        // Should still load under constitutional requirement
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(5000); // Allow extra time for slow network simulation

        // Verify core functionality works
        const stateSelector = page.locator('select[name="state"]');
        await expect(stateSelector).toBeVisible();

        const vacationInput = page.locator('input[name="vacationDays"]');
        await expect(vacationInput).toBeVisible();

        // Test interaction responsiveness under poor network
        await stateSelector.selectOption('BY');
        await vacationInput.fill('25');

        const interactionStart = Date.now();
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.tap();

        // Should respond quickly to user interaction despite network
        const interactionTime = Date.now() - interactionStart;
        expect(interactionTime).toBeLessThan(200); // Should be immediate
      });
    });
  });

  // Helper functions for device testing
  async function testMobileLayout(page: Page) {
    // Verify mobile-specific layout elements
    const mobileStack = page.locator('[data-testid="mobile-stack"]').or(
      page.locator('.mobile-layout, .stack-mobile')
    );

    // Elements should stack vertically on mobile
    const formElements = page.locator('input, select, button').first();
    if (await formElements.isVisible()) {
      const box = await formElements.boundingBox();
      expect(box?.width).toBeGreaterThan(200); // Should use available width
    }

    // Mobile menu should be present
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
      page.locator('.mobile-menu, .hamburger')
    );

    // May or may not be visible depending on design
    const hasMobileMenu = await mobileMenu.count() > 0;
    expect(hasMobileMenu).toBeTruthy();
  }

  async function testTabletLayout(page: Page) {
    // Verify tablet layout uses more horizontal space
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.isVisible()) {
      const box = await mainContent.boundingBox();
      expect(box?.width).toBeGreaterThan(600); // Tablet should use more width
    }

    // Tablet might show desktop-like navigation
    const navigation = page.locator('nav, [role="navigation"]').first();
    expect(await navigation.isVisible()).toBe(true);
  }

  async function testDeviceInteractions(page: Page, deviceName: string) {
    // Test device-specific interaction patterns
    if (deviceName.includes('iPad')) {
      // Test tablet-specific interactions
      await testTabletInteractions(page);
    } else {
      // Test phone-specific interactions
      await testPhoneInteractions(page);
    }
  }

  async function testTabletInteractions(page: Page) {
    // Tablets might support hover-like interactions
    const interactiveElements = page.locator('button, [role="button"]');
    if (await interactiveElements.first().isVisible()) {
      await interactiveElements.first().hover();
      // Verify no layout changes from hover on tablet
    }
  }

  async function testPhoneInteractions(page: Page) {
    // Phones rely entirely on touch
    const buttons = page.locator('button');
    if (await buttons.first().isVisible()) {
      // Verify tap targets are large enough
      const box = await buttons.first().boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44); // iOS minimum
    }
  }

  async function testPortraitLayout(page: Page) {
    // Verify portrait-specific layout
    const viewportSize = page.viewportSize();
    expect(viewportSize?.height).toBeGreaterThan(viewportSize?.width || 0);

    // Content should stack vertically
    const formContainer = page.locator('form, .form-container').first();
    if (await formContainer.isVisible()) {
      const box = await formContainer.boundingBox();
      expect(box?.height).toBeGreaterThan(300); // Should have vertical space
    }
  }

  async function testLandscapeLayout(page: Page) {
    // Verify landscape-specific layout
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeGreaterThan(viewportSize?.height || 0);

    // Content might use horizontal space more efficiently
    const mainContent = page.locator('main, .main-content').first();
    if (await mainContent.isVisible()) {
      const box = await mainContent.boundingBox();
      expect(box?.width).toBeGreaterThan(600); // Should use landscape width
    }
  }
});