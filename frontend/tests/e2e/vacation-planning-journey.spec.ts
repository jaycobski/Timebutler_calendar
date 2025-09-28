/**
 * Main Vacation Planning User Journey E2E Tests
 * Constitutional Requirements:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - German user scenarios and workflows
 * - Accessibility validation throughout journey
 * - Bridge weekend optimization flows
 * - Email delivery testing
 * - Performance validation
 */

import { test, expect, Page } from '@playwright/test';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';
import { testEmailTemplate, interceptEmailDelivery } from '../helpers/email-test-helper';
import { measurePerformance } from '../helpers/performance-helper';
import { getTestUsers, getTestScenarios } from '../helpers/test-data-helper';

test.describe('Complete Vacation Planning User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage with German locale
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify page loads correctly
    await expect(page).toHaveTitle(/TimeButler.*Brückentage|TimeButler.*Bridge/);
  });

  test('Bavarian Catholic User - Efficiency Optimization Journey', async ({ page, browserName }) => {
    const testUser = getTestUsers().find(u => u.id === 'bavaria_catholic_efficient')!;
    const testScenario = getTestScenarios().find(s => s.name === 'bavarian_catholic_optimization')!;

    // Start performance measurement
    const performanceStart = Date.now();

    // Step 1: Homepage interaction and state selection
    await test.step('Select Bavaria and verify holiday display', async () => {
      // Find and interact with state selector
      const stateSelector = page.locator('[data-testid="state-selector"]').or(
        page.locator('select[name="state"]')
      ).or(
        page.locator('select').filter({ hasText: 'Bayern' })
      );

      await expect(stateSelector).toBeVisible();
      await stateSelector.selectOption('BY');

      // Verify Bavaria is selected
      await expect(stateSelector).toHaveValue('BY');

      // Verify Bavarian holidays are displayed
      await expect(page.locator('text=Heilige Drei Könige')).toBeVisible();
      await expect(page.locator('text=Fronleichnam')).toBeVisible();
    });

    // Step 2: Set vacation days
    await test.step('Set vacation days to 30', async () => {
      const vacationInput = page.locator('[data-testid="vacation-days-input"]').or(
        page.locator('input[name="vacationDays"]')
      ).or(
        page.locator('input[type="number"]').first()
      );

      await expect(vacationInput).toBeVisible();
      await vacationInput.fill('30');
      await expect(vacationInput).toHaveValue('30');
    });

    // Step 3: Include religious holidays
    await test.step('Enable religious holidays', async () => {
      const religiousHolidaysToggle = page.locator('[data-testid="religious-holidays-toggle"]').or(
        page.locator('input[name="includeReligiousHolidays"]')
      ).or(
        page.locator('input[type="checkbox"]').filter({ hasText: /religiös|religious/i })
      );

      if (await religiousHolidaysToggle.isVisible()) {
        await religiousHolidaysToggle.check();
        await expect(religiousHolidaysToggle).toBeChecked();
      }
    });

    // Step 4: Set optimization preference
    await test.step('Optimize for efficiency', async () => {
      const optimizationSelector = page.locator('[data-testid="optimization-selector"]').or(
        page.locator('select[name="optimizeFor"]')
      ).or(
        page.locator('select').filter({ hasText: /effizienz|efficiency/i })
      );

      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('efficiency');
        await expect(optimizationSelector).toHaveValue('efficiency');
      }
    });

    // Step 5: Generate bridge weekends
    await test.step('Generate and verify bridge weekends', async () => {
      const generateButton = page.locator('[data-testid="generate-bridge-weekends"]').or(
        page.locator('button').filter({ hasText: /berechnen|calculate|generate/i })
      );

      await expect(generateButton).toBeVisible();
      await generateButton.click();

      // Wait for results to load
      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify bridge weekends are displayed
      const bridgeWeekends = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeWeekends.count();

      expect(count).toBeGreaterThanOrEqual(testScenario.expectedResults.minBridgeOpportunities);

      // Verify efficiency optimization
      for (let i = 0; i < Math.min(count, 3); i++) {
        const bridgeItem = bridgeWeekends.nth(i);
        const efficiencyText = await bridgeItem.locator('[data-testid="efficiency-ratio"]').textContent();

        if (efficiencyText) {
          const efficiency = parseFloat(efficiencyText.replace(/[^\d.]/g, ''));
          expect(efficiency).toBeGreaterThan(1.0); // Should be efficient
        }
      }

      // Verify Bavarian holidays are included
      await expect(page.locator('text=Fronleichnam')).toBeVisible();
      await expect(page.locator('text=Allerheiligen')).toBeVisible();
    });

    // Step 6: Email delivery process
    await test.step('Enter email and request calendar delivery', async () => {
      const emailInput = page.locator('[data-testid="email-input"]').or(
        page.locator('input[type="email"]')
      ).or(
        page.locator('input[name="email"]')
      );

      await expect(emailInput).toBeVisible();
      await emailInput.fill(testUser.email);

      // GDPR consent
      const gdprConsent = page.locator('[data-testid="gdpr-consent"]').or(
        page.locator('input[name="gdprConsent"]')
      ).or(
        page.locator('input[type="checkbox"]').filter({ hasText: /dsgvo|gdpr|datenschutz/i })
      );

      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
        await expect(gdprConsent).toBeChecked();
      }

      // Submit vacation plan
      const submitButton = page.locator('[data-testid="submit-vacation-plan"]').or(
        page.locator('button').filter({ hasText: /senden|send|submit/i })
      );

      await expect(submitButton).toBeVisible();
      await submitButton.click();

      // Verify success message
      await expect(page.locator('[data-testid="success-message"]').or(
        page.locator('.success, .confirmation').first()
      )).toBeVisible({ timeout: 15000 });
    });

    // Step 7: Accessibility validation
    await test.step('Validate accessibility compliance', async () => {
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'de-DE',
        reportPath: `accessibility-reports/${browserName}-bavarian-journey.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);
      expect(accessibilityResults.axeReport.wcag_compliance.level_aa).toBe(true);
      expect(accessibilityResults.keyboardTest.passed).toBe(true);
      expect(accessibilityResults.screenReaderTest.passed).toBe(true);
    });

    // Step 8: Performance validation
    await test.step('Validate performance requirements', async () => {
      const performanceMetrics = await measurePerformance(page, {
        simulateSlowNetwork: true,
        testDevice: 'desktop'
      });

      // Constitutional requirements
      expect(performanceMetrics.constitutional_compliance.page_load_under_2s).toBe(true);
      expect(performanceMetrics.constitutional_compliance.interaction_under_100ms).toBe(true);
      expect(performanceMetrics.constitutional_compliance.bundle_under_200kb).toBe(true);

      // Performance budgets
      expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2000);
      expect(performanceMetrics.firstInputDelay).toBeLessThan(100);
      expect(performanceMetrics.cumulativeLayoutShift).toBeLessThan(0.1);
    });

    const performanceEnd = Date.now();
    const totalJourneyTime = performanceEnd - performanceStart;

    // Constitutional requirement: complete journey under reasonable time
    expect(totalJourneyTime).toBeLessThan(30000); // 30 seconds max for complete journey
  });

  test('Berlin Secular User - Maximum Days Off Journey', async ({ page, browserName }) => {
    const testUser = getTestUsers().find(u => u.id === 'berlin_secular_maxdays')!;
    const testScenario = getTestScenarios().find(s => s.name === 'berlin_secular_maximum_days')!;

    await test.step('Complete Berlin user vacation planning', async () => {
      // State selection
      const stateSelector = page.locator('[data-testid="state-selector"]').or(
        page.locator('select[name="state"]')
      );
      await stateSelector.selectOption('BE');

      // Vacation days
      const vacationInput = page.locator('[data-testid="vacation-days-input"]').or(
        page.locator('input[name="vacationDays"]')
      );
      await vacationInput.fill('25');

      // Exclude religious holidays
      const religiousHolidaysToggle = page.locator('[data-testid="religious-holidays-toggle"]').or(
        page.locator('input[name="includeReligiousHolidays"]')
      );

      if (await religiousHolidaysToggle.isVisible() && await religiousHolidaysToggle.isChecked()) {
        await religiousHolidaysToggle.uncheck();
      }

      // Optimize for total days off
      const optimizationSelector = page.locator('[data-testid="optimization-selector"]').or(
        page.locator('select[name="optimizeFor"]')
      );

      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('total_days_off');
      }

      // Generate results
      const generateButton = page.locator('[data-testid="generate-bridge-weekends"]').or(
        page.locator('button').filter({ hasText: /berechnen|calculate/i })
      );
      await generateButton.click();

      // Wait for results
      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify Berlin-specific holidays
      await expect(page.locator('text=Internationaler Frauentag')).toBeVisible();

      // Verify no religious holidays are shown
      await expect(page.locator('text=Fronleichnam')).not.toBeVisible();
      await expect(page.locator('text=Allerheiligen')).not.toBeVisible();

      // Verify optimization for maximum days off
      const totalDaysOffElements = page.locator('[data-testid="total-days-off"]');
      const count = await totalDaysOffElements.count();

      if (count > 0) {
        // Verify results are sorted by total days off (descending)
        const firstTotal = await totalDaysOffElements.first().textContent();
        const secondTotal = await totalDaysOffElements.nth(1).textContent();

        if (firstTotal && secondTotal) {
          const first = parseInt(firstTotal.replace(/\D/g, ''));
          const second = parseInt(secondTotal.replace(/\D/g, ''));
          expect(first).toBeGreaterThanOrEqual(second);
        }
      }

      // Submit plan
      const emailInput = page.locator('[data-testid="email-input"]').or(
        page.locator('input[type="email"]')
      );
      await emailInput.fill(testUser.email);

      const gdprConsent = page.locator('[data-testid="gdpr-consent"]').or(
        page.locator('input[name="gdprConsent"]')
      );
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('[data-testid="submit-vacation-plan"]').or(
        page.locator('button').filter({ hasText: /senden|send/i })
      );
      await submitButton.click();

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Validate Berlin-specific accessibility', async () => {
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'de-DE',
        reportPath: `accessibility-reports/${browserName}-berlin-journey.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);
    });
  });

  test('International English User - Balanced Optimization Journey', async ({ page, browserName }) => {
    const testUser = getTestUsers().find(u => u.id === 'international_balanced')!;

    await test.step('Switch to English and complete journey', async () => {
      // Switch to English language
      const languageToggle = page.locator('[data-testid="language-toggle"]').or(
        page.locator('button').filter({ hasText: /english|en/i })
      ).or(
        page.locator('[lang="en"], [data-lang="en"]')
      );

      if (await languageToggle.isVisible()) {
        await languageToggle.click();

        // Verify English content is displayed
        await expect(page.locator('text=Bridge Days')).toBeVisible();
        await expect(page.locator('text=Vacation Days')).toBeVisible();
      }

      // Complete form in English
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('NW');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('28');

      // Include religious holidays
      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Balanced optimization
      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('balanced');
      }

      // Generate results
      const generateButton = page.locator('button').filter({ hasText: /calculate|generate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify English holiday translations
      await expect(page.locator('text=Corpus Christi')).toBeVisible(); // Fronleichnam
      await expect(page.locator('text=All Saints')).toBeVisible(); // Allerheiligen

      // Submit with English email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUser.email);

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /send|submit/i });
      await submitButton.click();

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Validate English language accessibility', async () => {
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'en-US',
        reportPath: `accessibility-reports/${browserName}-english-journey.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);

      // Verify English language attributes
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('en');
    });
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    await test.step('Test invalid inputs and error handling', async () => {
      // Test with invalid vacation days
      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('-5');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]').or(
        page.locator('.error, .invalid-feedback').first()
      )).toBeVisible();

      // Test with excessive vacation days
      await vacationInput.fill('999');
      await generateButton.click();

      await expect(page.locator('[data-testid="validation-error"]').or(
        page.locator('.error').first()
      )).toBeVisible();

      // Test with valid input
      await vacationInput.fill('25');

      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      await generateButton.click();

      // Should work normally
      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });
    });

    await test.step('Test email validation', async () => {
      // Ensure we have results first
      const bridgeResults = page.locator('[data-testid="bridge-weekend-results"]');
      if (await bridgeResults.count() === 0) {
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();
        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });
      }

      // Test invalid email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('invalid-email');

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      // Should show email validation error
      await expect(page.locator('[data-testid="email-validation-error"]').or(
        page.locator('.error').filter({ hasText: /email/i }).first()
      )).toBeVisible();

      // Test valid email
      await emailInput.fill('test@timebutler.de');

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      await submitButton.click();

      // Should succeed
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test('Cross-Browser Consistency Validation', async ({ page, browserName }) => {
    await test.step(`Validate consistent behavior in ${browserName}`, async () => {
      // Test basic functionality in each browser
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify results are consistent across browsers
      const bridgeWeekends = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeWeekends.count();

      expect(count).toBeGreaterThan(0);

      // Take screenshot for visual regression testing
      await page.screenshot({
        path: `screenshots/${browserName}-vacation-planning-results.png`,
        fullPage: true
      });

      // Verify layout is stable
      const layoutStability = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid="bridge-weekend-item"]');
        return elements.length > 0 &&
               Array.from(elements).every(el => el.getBoundingClientRect().height > 0);
      });

      expect(layoutStability).toBe(true);
    });
  });
});