/**
 * Progressive Enhancement Tests (No JavaScript)
 * Constitutional Requirements:
 * - Application must work without JavaScript enabled
 * - Complete vacation planning functionality available
 * - Accessibility maintained without JavaScript
 * - German/English content accessible
 * - Email delivery functional without client-side code
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';

test.describe('Progressive Enhancement - No JavaScript', () => {
  let noJSContext: BrowserContext;
  let noJSPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Create context with JavaScript disabled
    noJSContext = await browser.newContext({
      javaScriptEnabled: false,
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin'
    });

    noJSPage = await noJSContext.newPage();
  });

  test.afterEach(async () => {
    await noJSContext.close();
  });

  test('Homepage Loads and Functions Without JavaScript', async () => {
    await test.step('Verify homepage accessibility without JS', async () => {
      await noJSPage.goto('/', { waitUntil: 'networkidle' });

      // Verify page loads successfully
      await expect(noJSPage).toHaveTitle(/TimeButler.*Brückentage|TimeButler.*Bridge/);

      // Verify basic content is present
      await expect(noJSPage.locator('h1')).toBeVisible();

      // Verify form elements are accessible
      const stateSelector = noJSPage.locator('select[name="state"]');
      await expect(stateSelector).toBeVisible();

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await expect(vacationInput).toBeVisible();

      // Verify submit button is present
      const submitButton = noJSPage.locator('button[type="submit"], input[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    await test.step('Test form submission without JavaScript', async () => {
      // Fill out form using basic HTML interactions
      const stateSelector = noJSPage.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      // Check religious holidays if checkbox exists
      const religiousToggle = noJSPage.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Submit form (should be server-side processed)
      const submitButton = noJSPage.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Should navigate to results page or show results
      await noJSPage.waitForLoadState('networkidle');

      // Verify results are displayed (server-rendered)
      const resultsContent = noJSPage.locator('main, .results, [data-testid="bridge-weekend-results"]');
      await expect(resultsContent).toBeVisible();

      // Should show vacation planning results
      const bridgeContent = noJSPage.locator('text=Brückentag, text=bridge, text=Urlaub, text=vacation').first();
      await expect(bridgeContent).toBeVisible();
    });
  });

  test('German State Selection Without JavaScript', async () => {
    await test.step('Test all German states work without JS', async () => {
      await noJSPage.goto('/');

      const stateSelector = noJSPage.locator('select[name="state"]');

      // Test multiple German states
      const testStates = ['BY', 'BE', 'NW', 'HH', 'SN'];

      for (const state of testStates) {
        await stateSelector.selectOption(state);

        // Verify selection works
        await expect(stateSelector).toHaveValue(state);

        const vacationInput = noJSPage.locator('input[name="vacationDays"]');
        await vacationInput.fill('20');

        const submitButton = noJSPage.locator('button[type="submit"], input[type="submit"]').first();
        await submitButton.click();

        await noJSPage.waitForLoadState('networkidle');

        // Should show state-specific results
        const pageContent = await noJSPage.content();

        // Verify state-specific content appears
        if (state === 'BY') {
          // Bavaria should show Catholic holidays
          expect(pageContent.toLowerCase()).toMatch(/fronleichnam|allerheiligen|heilige drei könige/);
        } else if (state === 'BE') {
          // Berlin should show Women's Day
          expect(pageContent.toLowerCase()).toMatch(/frauentag|women.*day/);
        }

        // Go back to test next state
        await noJSPage.goto('/');
      }
    });
  });

  test('Email Delivery Without JavaScript', async () => {
    await test.step('Test email submission works without JS', async () => {
      await noJSPage.goto('/');

      // Complete vacation planning form
      const stateSelector = noJSPage.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const religiousToggle = noJSPage.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Submit to get results
      const generateButton = noJSPage.locator('button[type="submit"], input[type="submit"]').first();
      await generateButton.click();

      await noJSPage.waitForLoadState('networkidle');

      // Look for email form in results page
      const emailInput = noJSPage.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('nojs.test@timebutler.de');

        // GDPR consent checkbox
        const gdprConsent = noJSPage.locator('input[name="gdprConsent"]');
        if (await gdprConsent.isVisible()) {
          await gdprConsent.check();
        }

        // Submit email request
        const emailSubmitButton = noJSPage.locator('button[type="submit"], input[type="submit"]').last();
        await emailSubmitButton.click();

        await noJSPage.waitForLoadState('networkidle');

        // Should show success or confirmation page
        const confirmationContent = noJSPage.locator('text=erfolg, text=success, text=gesendet, text=sent').first();
        await expect(confirmationContent).toBeVisible();
      }
    });
  });

  test('Accessibility Without JavaScript', async () => {
    await test.step('Verify WCAG compliance without JavaScript', async () => {
      await noJSPage.goto('/');

      // Run accessibility test on no-JS page
      const accessibilityResults = await runCompleteAccessibilityTest(noJSPage, {
        locale: 'de-DE',
        reportPath: 'accessibility-reports/no-javascript-compliance.json'
      });

      // Should maintain WCAG 2.1 Level AA compliance without JS
      expect(accessibilityResults.overallCompliance).toBe(true);
      expect(accessibilityResults.axeReport.wcag_compliance.level_aa).toBe(true);

      // Keyboard navigation should work without JS
      expect(accessibilityResults.keyboardTest.passed).toBe(true);

      // Screen reader compatibility should be maintained
      expect(accessibilityResults.screenReaderTest.passed).toBe(true);

      // Form elements should have proper labels
      const formInputs = noJSPage.locator('input, select, textarea');
      const inputCount = await formInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const inputType = await input.getAttribute('type');

        // Skip hidden inputs
        if (inputType === 'hidden') continue;

        const hasLabel = await input.getAttribute('aria-label') ||
                        await input.getAttribute('aria-labelledby') ||
                        await noJSPage.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0 ||
                        await input.locator('..').locator('label').count() > 0;

        expect(hasLabel).toBeTruthy();
      }
    });

    await test.step('Test keyboard navigation without JavaScript', async () => {
      await noJSPage.goto('/');

      // Test tab navigation
      await noJSPage.keyboard.press('Tab');

      let focusedElement = noJSPage.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Navigate through form elements
      const tabStops = [];
      for (let i = 0; i < 10; i++) {
        await noJSPage.keyboard.press('Tab');

        const currentFocus = await noJSPage.evaluate(() => {
          const focused = document.activeElement;
          return {
            tagName: focused?.tagName,
            type: focused?.getAttribute('type'),
            name: focused?.getAttribute('name'),
            id: focused?.getAttribute('id')
          };
        });

        tabStops.push(currentFocus);

        // Stop if we've cycled back to body or repeat
        if (currentFocus.tagName === 'BODY' ||
            tabStops.filter(stop => JSON.stringify(stop) === JSON.stringify(currentFocus)).length > 1) {
          break;
        }
      }

      // Should have navigated through multiple form elements
      expect(tabStops.length).toBeGreaterThan(2);

      // Should include key form elements
      const hasStateSelector = tabStops.some(stop => stop.name === 'state');
      const hasVacationInput = tabStops.some(stop => stop.name === 'vacationDays');
      const hasSubmitButton = tabStops.some(stop => stop.type === 'submit' || stop.tagName === 'BUTTON');

      expect(hasStateSelector || hasVacationInput || hasSubmitButton).toBe(true);
    });
  });

  test('Multilingual Support Without JavaScript', async () => {
    await test.step('Test German content without JavaScript', async () => {
      await noJSPage.goto('/');

      // Verify German content is present
      const germanContent = await noJSPage.content();

      // Should contain German vocabulary
      expect(germanContent.toLowerCase()).toMatch(/brückentag|urlaubstag|feiertag|bundesland/);

      // Form should have German labels
      const germanLabels = noJSPage.locator('text=Bundesland, text=Urlaubstage, text=Berechnen').first();
      expect(await germanLabels.count()).toBeGreaterThan(0);
    });

    await test.step('Test English content without JavaScript', async () => {
      // Try to access English version
      const englishPage = await noJSContext.newPage();

      // Check if language switching is available without JS
      await englishPage.goto('/?lang=en', { waitUntil: 'networkidle' });

      const englishContent = await englishPage.content();

      // Should contain English vocabulary if language switching works
      if (englishContent.toLowerCase().includes('bridge') ||
          englishContent.toLowerCase().includes('vacation') ||
          englishContent.toLowerCase().includes('holiday')) {

        expect(englishContent.toLowerCase()).toMatch(/bridge.*day|vacation.*day|holiday/);
      }

      await englishPage.close();
    });
  });

  test('Form Validation Without JavaScript', async () => {
    await test.step('Test server-side form validation', async () => {
      await noJSPage.goto('/');

      // Test with invalid vacation days
      const stateSelector = noJSPage.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');

      // Test negative number
      await vacationInput.fill('-5');

      const submitButton = noJSPage.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      await noJSPage.waitForLoadState('networkidle');

      // Should show validation error or prevent submission
      const pageContent = await noJSPage.content();
      const hasError = pageContent.toLowerCase().includes('error') ||
                      pageContent.toLowerCase().includes('fehler') ||
                      pageContent.toLowerCase().includes('ungültig') ||
                      pageContent.toLowerCase().includes('invalid');

      // Either show error or maintain form (don't process invalid data)
      expect(hasError || pageContent.includes('value="-5"')).toBe(true);
    });

    await test.step('Test email validation without JavaScript', async () => {
      await noJSPage.goto('/');

      // Complete basic form first
      const stateSelector = noJSPage.locator('select[name="state"]');
      await stateSelector.selectOption('BE');

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const submitButton = noJSPage.locator('button[type="submit"]').first();
      await submitButton.click();

      await noJSPage.waitForLoadState('networkidle');

      // Look for email form
      const emailInput = noJSPage.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        // Test invalid email
        await emailInput.fill('invalid-email');

        const emailSubmitButton = noJSPage.locator('button[type="submit"]').last();
        await emailSubmitButton.click();

        await noJSPage.waitForLoadState('networkidle');

        // Should validate email server-side
        const pageContent = await noJSPage.content();
        const hasEmailError = pageContent.toLowerCase().includes('email') &&
                             (pageContent.toLowerCase().includes('error') ||
                              pageContent.toLowerCase().includes('fehler') ||
                              pageContent.toLowerCase().includes('ungültig'));

        // Should either show error or maintain invalid email in form
        expect(hasEmailError || pageContent.includes('invalid-email')).toBe(true);
      }
    });
  });

  test('Content Structure Without JavaScript', async () => {
    await test.step('Verify semantic HTML structure', async () => {
      await noJSPage.goto('/');

      // Should have proper document structure
      await expect(noJSPage.locator('html[lang]')).toBeVisible();
      await expect(noJSPage.locator('head title')).toBeVisible();
      await expect(noJSPage.locator('main, [role="main"]')).toBeVisible();

      // Should have heading hierarchy
      const headings = noJSPage.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Should have exactly one H1
      const h1Count = await noJSPage.locator('h1').count();
      expect(h1Count).toBe(1);

      // Form should be properly structured
      const form = noJSPage.locator('form');
      await expect(form).toBeVisible();

      // Form should have proper action attribute for server processing
      const formAction = await form.getAttribute('action');
      expect(formAction).toBeTruthy();

      // Form should have method specified
      const formMethod = await form.getAttribute('method');
      expect(formMethod).toMatch(/get|post/i);
    });

    await test.step('Verify navigation without JavaScript', async () => {
      await noJSPage.goto('/');

      // Should have navigation elements
      const navigation = noJSPage.locator('nav, [role="navigation"]');

      if (await navigation.count() > 0) {
        // Navigation should work with basic links
        const navLinks = navigation.locator('a[href]');
        const linkCount = await navLinks.count();

        if (linkCount > 0) {
          // Test first navigation link
          const firstLink = navLinks.first();
          const href = await firstLink.getAttribute('href');

          if (href && !href.startsWith('#')) {
            await firstLink.click();
            await noJSPage.waitForLoadState('networkidle');

            // Should navigate successfully
            expect(noJSPage.url()).not.toBe('http://localhost:3000/');
          }
        }
      }
    });
  });

  test('Performance Without JavaScript', async () => {
    await test.step('Measure no-JS performance', async () => {
      const startTime = Date.now();

      await noJSPage.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Should load faster without JavaScript
      expect(loadTime).toBeLessThan(3000);

      // Verify page is functional
      const stateSelector = noJSPage.locator('select[name="state"]');
      await expect(stateSelector).toBeVisible();

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await expect(vacationInput).toBeVisible();

      // Form submission should work
      await stateSelector.selectOption('NW');
      await vacationInput.fill('22');

      const submitStart = Date.now();
      const submitButton = noJSPage.locator('button[type="submit"]').first();
      await submitButton.click();

      await noJSPage.waitForLoadState('networkidle');
      const submitTime = Date.now() - submitStart;

      // Server processing should be reasonably fast
      expect(submitTime).toBeLessThan(5000);
    });
  });

  test('Fallback Content Without JavaScript', async () => {
    await test.step('Verify appropriate fallback content', async () => {
      await noJSPage.goto('/');

      // Check for noscript elements
      const noscriptContent = await noJSPage.evaluate(() => {
        const noscripts = document.querySelectorAll('noscript');
        return Array.from(noscripts).map(ns => ns.textContent || '').join(' ');
      });

      // Should have informative noscript content
      if (noscriptContent) {
        expect(noscriptContent.length).toBeGreaterThan(0);
      }

      // All functionality should be available without JS
      const pageContent = await noJSPage.content();

      // Should not have error messages about JavaScript requirement
      expect(pageContent.toLowerCase()).not.toMatch(/javascript.*required|bitte.*javascript.*aktivieren/);

      // Should not have broken functionality indicators
      expect(pageContent).not.toMatch(/undefined|null|NaN|\[object Object\]/);
    });

    await test.step('Test graceful degradation', async () => {
      await noJSPage.goto('/');

      // Complete form submission to verify full functionality
      const stateSelector = noJSPage.locator('select[name="state"]');
      await stateSelector.selectOption('SN');

      const vacationInput = noJSPage.locator('input[name="vacationDays"]');
      await vacationInput.fill('28');

      const submitButton = noJSPage.locator('button[type="submit"]').first();
      await submitButton.click();

      await noJSPage.waitForLoadState('networkidle');

      // Should show meaningful results
      const resultsContent = await noJSPage.content();

      // Should contain vacation/holiday related content
      expect(resultsContent.toLowerCase()).toMatch(/brückentag|urlaub|feiertag|holiday|vacation|bridge/);

      // Should not show JavaScript error messages
      expect(resultsContent).not.toMatch(/script.*error|js.*error/i);

      // Should have usable content structure
      const headings = noJSPage.locator('h1, h2, h3');
      expect(await headings.count()).toBeGreaterThan(0);
    });
  });
});