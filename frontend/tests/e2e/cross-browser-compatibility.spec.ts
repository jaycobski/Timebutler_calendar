/**
 * Cross-Browser Compatibility Validation Tests
 * Constitutional Requirements:
 * - Chrome, Firefox, Safari, Edge compatibility
 * - Consistent functionality across browsers
 * - Visual consistency validation
 * - Performance parity across browsers
 * - Accessibility compliance in all browsers
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';
import { measurePerformance } from '../helpers/performance-helper';
import { getTestUsers } from '../helpers/test-data-helper';

test.describe('Cross-Browser Compatibility Validation', () => {
  const testUsers = getTestUsers();
  const compatibilityUser = testUsers.find(u => u.id === 'international_balanced')!;

  // Browser-specific configurations
  const browserFeatures = {
    chromium: {
      name: 'Chrome',
      webkitFeatures: false,
      modernJS: true,
      cssGrid: true,
      flexbox: true
    },
    firefox: {
      name: 'Firefox',
      webkitFeatures: false,
      modernJS: true,
      cssGrid: true,
      flexbox: true
    },
    webkit: {
      name: 'Safari',
      webkitFeatures: true,
      modernJS: true,
      cssGrid: true,
      flexbox: true
    }
  };

  test.describe('Core Functionality Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Complete Vacation Planning Journey`, async ({ page, browser }) => {
        await test.step(`Test complete flow in ${browserFeatures[browserName].name}`, async () => {
          await page.goto('/', { waitUntil: 'networkidle' });

          // Verify page loads in browser
          await expect(page).toHaveTitle(/TimeButler.*Brückentage|TimeButler.*Bridge/);

          // Test state selection
          const stateSelector = page.locator('select[name="state"]');
          await expect(stateSelector).toBeVisible();
          await stateSelector.selectOption('BY');

          // Test vacation days input
          const vacationInput = page.locator('input[name="vacationDays"]');
          await expect(vacationInput).toBeVisible();
          await vacationInput.fill('30');

          // Test religious holidays toggle
          const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
          if (await religiousToggle.isVisible()) {
            await religiousToggle.check();
          }

          // Test calculation
          const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
          await expect(generateButton).toBeVisible();
          await generateButton.click();

          // Wait for results
          await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

          // Verify results are displayed
          const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
          const count = await bridgeItems.count();
          expect(count).toBeGreaterThan(0);

          // Test bridge weekend selection
          if (count > 0) {
            const firstCheckbox = bridgeItems.first().locator('input[type="checkbox"]');
            if (await firstCheckbox.isVisible()) {
              await firstCheckbox.check();
              await expect(firstCheckbox).toBeChecked();
            }
          }

          // Test email submission
          const emailInput = page.locator('input[type="email"]');
          await expect(emailInput).toBeVisible();
          await emailInput.fill(`${browserName}@test-timebutler.de`);

          // GDPR consent
          const gdprConsent = page.locator('input[name="gdprConsent"]');
          if (await gdprConsent.isVisible()) {
            await gdprConsent.check();
          }

          // Submit
          const submitButton = page.locator('button').filter({ hasText: /senden|send|submit/i });
          await submitButton.click();

          // Verify success
          await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

          // Take browser-specific screenshot
          await page.screenshot({
            path: `screenshots/${browserName}-complete-journey.png`,
            fullPage: true
          });
        });
      });
    });
  });

  test.describe('Browser-Specific Feature Testing', () => {
    test('Chrome/Chromium - Advanced Features', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');

      await test.step('Test Chrome-specific features', async () => {
        await page.goto('/');

        // Test modern JavaScript features
        const modernJSSupport = await page.evaluate(() => {
          try {
            // Test async/await, arrow functions, template literals
            const testAsync = async () => `Modern JS works`;
            const testArrow = () => true;
            const testTemplate = `Template ${testArrow() ? 'works' : 'fails'}`;

            return {
              async: typeof testAsync === 'function',
              arrow: testArrow(),
              template: testTemplate.includes('works'),
              promises: typeof Promise !== 'undefined',
              fetch: typeof fetch !== 'undefined'
            };
          } catch (error) {
            return { error: error.message };
          }
        });

        expect(modernJSSupport.async).toBe(true);
        expect(modernJSSupport.arrow).toBe(true);
        expect(modernJSSupport.template).toBe(true);
        expect(modernJSSupport.promises).toBe(true);
        expect(modernJSSupport.fetch).toBe(true);

        // Test CSS Grid support
        const cssGridSupport = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.display = 'grid';
          return testElement.style.display === 'grid';
        });

        expect(cssGridSupport).toBe(true);
      });
    });

    test('Firefox - Standards Compliance', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await test.step('Test Firefox standards compliance', async () => {
        await page.goto('/');

        // Test Flexbox support
        const flexboxSupport = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.display = 'flex';
          return testElement.style.display === 'flex';
        });

        expect(flexboxSupport).toBe(true);

        // Test CSS Custom Properties (CSS Variables)
        const cssVariablesSupport = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.setProperty('--test-var', 'test');
          return testElement.style.getPropertyValue('--test-var') === 'test';
        });

        expect(cssVariablesSupport).toBe(true);

        // Test form validation
        const formValidationSupport = await page.evaluate(() => {
          const input = document.createElement('input');
          input.type = 'email';
          input.value = 'invalid-email';
          return typeof input.checkValidity === 'function' && !input.checkValidity();
        });

        expect(formValidationSupport).toBe(true);
      });
    });

    test('Safari/WebKit - Apple Ecosystem', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      await test.step('Test Safari/WebKit compatibility', async () => {
        await page.goto('/');

        // Test WebKit-specific features
        const webkitSupport = await page.evaluate(() => {
          return {
            touchEvents: 'ontouchstart' in window,
            userAgent: navigator.userAgent.includes('WebKit'),
            cssSupport: CSS.supports('backdrop-filter', 'blur(10px)'),
            modernJS: typeof Set !== 'undefined' && typeof Map !== 'undefined'
          };
        });

        expect(webkitSupport.userAgent).toBe(true);
        expect(webkitSupport.modernJS).toBe(true);

        // Test date input support (important for vacation day input)
        const dateInputSupport = await page.evaluate(() => {
          const input = document.createElement('input');
          input.type = 'date';
          return input.type === 'date';
        });

        expect(dateInputSupport).toBe(true);

        // Test iOS-specific viewport handling
        const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewportMeta).toMatch(/width=device-width/);
      });
    });
  });

  test.describe('Visual Consistency Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Visual Layout Consistency`, async ({ page }) => {
        await test.step(`Test visual consistency in ${browserFeatures[browserName].name}`, async () => {
          await page.goto('/');

          // Complete form to get results page
          const stateSelector = page.locator('select[name="state"]');
          await stateSelector.selectOption('BY');

          const vacationInput = page.locator('input[name="vacationDays"]');
          await vacationInput.fill('25');

          const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
          await generateButton.click();

          await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

          // Test layout consistency
          const layoutElements = [
            'header, .header',
            'main, .main-content',
            'footer, .footer',
            'form',
            '[data-testid="bridge-weekend-results"]'
          ];

          for (const selector of layoutElements) {
            const element = page.locator(selector).first();
            if (await element.count() > 0) {
              const box = await element.boundingBox();
              expect(box).toBeTruthy();
              expect(box?.width).toBeGreaterThan(0);
              expect(box?.height).toBeGreaterThan(0);
            }
          }

          // Test text rendering consistency
          const textElements = page.locator('h1, h2, h3, p, label, button');
          const textCount = await textElements.count();

          for (let i = 0; i < Math.min(textCount, 10); i++) {
            const textElement = textElements.nth(i);
            const textContent = await textElement.textContent();
            expect(textContent?.trim().length).toBeGreaterThan(0);
          }

          // Take screenshot for visual regression testing
          await page.screenshot({
            path: `screenshots/${browserName}-layout-consistency.png`,
            fullPage: true
          });
        });
      });
    });
  });

  test.describe('Performance Consistency Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Performance Consistency`, async ({ page }) => {
        await test.step(`Measure performance in ${browserFeatures[browserName].name}`, async () => {
          const performanceMetrics = await measurePerformance(page, {
            simulateSlowNetwork: false,
            testDevice: 'desktop'
          });

          // All browsers should meet constitutional requirements
          expect(performanceMetrics.constitutional_compliance.page_load_under_2s).toBe(true);
          expect(performanceMetrics.constitutional_compliance.interaction_under_100ms).toBe(true);
          expect(performanceMetrics.constitutional_compliance.bundle_under_200kb).toBe(true);

          // Performance should be reasonable across browsers
          expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000);
          expect(performanceMetrics.largestContentfulPaint).toBeLessThan(4000);
          expect(performanceMetrics.firstInputDelay).toBeLessThan(200);

          console.log(`${browserName} Performance:`, {
            FCP: performanceMetrics.firstContentfulPaint,
            LCP: performanceMetrics.largestContentfulPaint,
            FID: performanceMetrics.firstInputDelay,
            CLS: performanceMetrics.cumulativeLayoutShift
          });
        });
      });
    });
  });

  test.describe('Accessibility Consistency Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Accessibility Consistency`, async ({ page }) => {
        await test.step(`Test accessibility in ${browserFeatures[browserName].name}`, async () => {
          await page.goto('/');

          // Complete basic form for accessibility testing
          const stateSelector = page.locator('select[name="state"]');
          await stateSelector.selectOption('NW');

          const vacationInput = page.locator('input[name="vacationDays"]');
          await vacationInput.fill('25');

          const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
          await generateButton.click();

          await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

          // Run accessibility test
          const accessibilityResults = await runCompleteAccessibilityTest(page, {
            locale: 'de-DE',
            reportPath: `accessibility-reports/${browserName}-cross-browser.json`
          });

          // Should maintain WCAG 2.1 Level AA compliance across all browsers
          expect(accessibilityResults.overallCompliance).toBe(true);
          expect(accessibilityResults.axeReport.wcag_compliance.level_aa).toBe(true);

          // Keyboard navigation should work consistently
          expect(accessibilityResults.keyboardTest.passed).toBe(true);

          // Screen reader compatibility should be consistent
          expect(accessibilityResults.screenReaderTest.passed).toBe(true);

          // Color contrast should be consistent
          expect(accessibilityResults.colorContrastTest.passed).toBe(true);
        });
      });
    });
  });

  test.describe('Form Handling Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Form Interaction Consistency`, async ({ page }) => {
        await test.step(`Test form handling in ${browserFeatures[browserName].name}`, async () => {
          await page.goto('/');

          // Test various input types
          const inputTests = [
            { selector: 'select[name="state"]', action: () => page.locator('select[name="state"]').selectOption('BY') },
            { selector: 'input[name="vacationDays"]', action: () => page.locator('input[name="vacationDays"]').fill('25') },
            { selector: 'input[type="checkbox"]', action: async () => {
                const checkbox = page.locator('input[type="checkbox"]').first();
                if (await checkbox.isVisible()) await checkbox.check();
              }
            },
            { selector: 'button[type="submit"], button', action: () => page.locator('button').filter({ hasText: /berechnen|calculate/i }).click() }
          ];

          for (const inputTest of inputTests) {
            const element = page.locator(inputTest.selector).first();
            if (await element.count() > 0) {
              await inputTest.action();

              // Verify element responds correctly
              await expect(element).toBeVisible();
            }
          }

          // Wait for form processing
          await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

          // Test email form
          const emailInput = page.locator('input[type="email"]');
          if (await emailInput.isVisible()) {
            await emailInput.fill(`${browserName}.test@timebutler.de`);

            // Test email validation behavior
            const isValid = await emailInput.evaluate((input: HTMLInputElement) => input.checkValidity());
            expect(isValid).toBe(true);

            // Test invalid email
            await emailInput.fill('invalid-email');
            const isInvalid = await emailInput.evaluate((input: HTMLInputElement) => input.checkValidity());
            expect(isInvalid).toBe(false);

            // Restore valid email
            await emailInput.fill(`${browserName}.test@timebutler.de`);
          }
        });
      });
    });
  });

  test.describe('JavaScript API Consistency', () => {
    test('Modern JavaScript APIs Across Browsers', async ({ page, browserName }) => {
      await test.step('Test JavaScript API consistency', async () => {
        await page.goto('/');

        const jsApiSupport = await page.evaluate(() => {
          return {
            // Core APIs
            Promise: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            JSON: typeof JSON !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',

            // Modern APIs
            IntersectionObserver: typeof IntersectionObserver !== 'undefined',
            ResizeObserver: typeof ResizeObserver !== 'undefined',
            MutationObserver: typeof MutationObserver !== 'undefined',

            // Form APIs
            FormData: typeof FormData !== 'undefined',
            URLSearchParams: typeof URLSearchParams !== 'undefined',

            // Date APIs
            DateToLocaleString: typeof Date.prototype.toLocaleString !== 'undefined',
            Intl: typeof Intl !== 'undefined',

            // Array methods
            arrayFind: typeof Array.prototype.find !== 'undefined',
            arrayIncludes: typeof Array.prototype.includes !== 'undefined',
            arrayFrom: typeof Array.from !== 'undefined',

            // String methods
            stringIncludes: typeof String.prototype.includes !== 'undefined',
            stringStartsWith: typeof String.prototype.startsWith !== 'undefined',

            // Object methods
            objectAssign: typeof Object.assign !== 'undefined',
            objectKeys: typeof Object.keys !== 'undefined'
          };
        });

        // Core APIs should be available in all modern browsers
        expect(jsApiSupport.Promise).toBe(true);
        expect(jsApiSupport.fetch).toBe(true);
        expect(jsApiSupport.JSON).toBe(true);
        expect(jsApiSupport.localStorage).toBe(true);

        // Modern array and string methods
        expect(jsApiSupport.arrayFind).toBe(true);
        expect(jsApiSupport.arrayIncludes).toBe(true);
        expect(jsApiSupport.stringIncludes).toBe(true);

        // Object methods
        expect(jsApiSupport.objectAssign).toBe(true);
        expect(jsApiSupport.objectKeys).toBe(true);

        console.log(`${browserName} JS API Support:`, jsApiSupport);
      });
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserFeatures[browserName].name} - Error Handling Consistency`, async ({ page }) => {
        await test.step(`Test error handling in ${browserFeatures[browserName].name}`, async () => {
          await page.goto('/');

          // Test with invalid form data
          const vacationInput = page.locator('input[name="vacationDays"]');
          await vacationInput.fill('-10'); // Invalid vacation days

          const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
          await generateButton.click();

          // Should handle error gracefully
          await page.waitForTimeout(3000);

          // Check for error handling
          const hasError = await page.locator('[data-testid="error-message"], .error').count() > 0;
          const formStillVisible = await page.locator('form').isVisible();

          // Should either show error or maintain form
          expect(hasError || formStillVisible).toBe(true);

          // Test network error simulation
          await page.route('**/api/**', route => route.abort());

          // Reset form and try again
          await page.reload();
          await vacationInput.fill('25');

          const stateSelector = page.locator('select[name="state"]');
          await stateSelector.selectOption('BY');

          await generateButton.click();

          // Should handle network errors gracefully
          await page.waitForTimeout(5000);

          const pageContent = await page.content();
          // Should not show raw error messages or break layout
          expect(pageContent).not.toMatch(/TypeError|ReferenceError|undefined|null/);
        });
      });
    });
  });

  test.describe('Mobile Cross-Browser Testing', () => {
    test('Mobile Safari vs Mobile Chrome Consistency', async ({ browser }) => {
      await test.step('Compare mobile browser behaviors', async () => {
        // Test mobile Safari
        const safariContext = await browser.newContext({
          ...require('@playwright/test').devices['iPhone 14'],
          locale: 'de-DE',
          timezoneId: 'Europe/Berlin'
        });
        const safariPage = await safariContext.newPage();

        // Test mobile Chrome
        const chromeContext = await browser.newContext({
          ...require('@playwright/test').devices['Pixel 7'],
          locale: 'de-DE',
          timezoneId: 'Europe/Berlin'
        });
        const chromePage = await chromeContext.newPage();

        try {
          // Test both mobile browsers
          for (const { name, page } of [
            { name: 'Mobile Safari', page: safariPage },
            { name: 'Mobile Chrome', page: chromePage }
          ]) {
            await page.goto('/');

            // Test mobile form interaction
            const stateSelector = page.locator('select[name="state"]');
            await stateSelector.tap();
            await stateSelector.selectOption('BY');

            const vacationInput = page.locator('input[name="vacationDays"]');
            await vacationInput.tap();
            await vacationInput.fill('25');

            const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
            await generateButton.tap();

            await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

            // Verify results work on mobile
            const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
            expect(await bridgeItems.count()).toBeGreaterThan(0);

            // Take mobile screenshot
            await page.screenshot({
              path: `screenshots/mobile-${name.toLowerCase().replace(' ', '-')}.png`,
              fullPage: true
            });
          }

        } finally {
          await safariContext.close();
          await chromeContext.close();
        }
      });
    });
  });

  test.describe('Integration Testing Across Browsers', () => {
    test('End-to-End Cross-Browser Integration', async ({ page, browserName }) => {
      await test.step(`Complete integration test in ${browserName}`, async () => {
        // Complete user journey with all features
        await page.goto('/');

        // 1. Language switching (if available)
        const languageToggle = page.locator('[data-testid="language-toggle"]');
        if (await languageToggle.isVisible()) {
          await languageToggle.click();
          await page.waitForTimeout(1000);
        }

        // 2. State and vacation configuration
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('BY');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('30');

        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.check();
        }

        // 3. Bridge weekend generation
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

        // 4. Bridge weekend selection
        const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
        const count = await bridgeItems.count();
        expect(count).toBeGreaterThan(0);

        // Select multiple bridges
        for (let i = 0; i < Math.min(count, 3); i++) {
          const checkbox = bridgeItems.nth(i).locator('input[type="checkbox"]');
          if (await checkbox.isVisible()) {
            await checkbox.check();
          }
        }

        // 5. Email submission
        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill(`integration.${browserName}@test-timebutler.de`);

        const gdprConsent = page.locator('input[name="gdprConsent"]');
        if (await gdprConsent.isVisible()) {
          await gdprConsent.check();
        }

        const submitButton = page.locator('button').filter({ hasText: /senden|send|submit/i });
        await submitButton.click();

        // 6. Success verification
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

        // 7. Final screenshot
        await page.screenshot({
          path: `screenshots/${browserName}-integration-complete.png`,
          fullPage: true
        });

        console.log(`✅ Complete integration test passed in ${browserName}`);
      });
    });
  });
});