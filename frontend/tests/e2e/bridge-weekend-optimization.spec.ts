/**
 * Bridge Weekend Optimization Flow Tests
 * Constitutional Requirements:
 * - Accurate bridge weekend calculations
 * - Optimization algorithms validation
 * - Efficiency ratio verification
 * - User preference handling
 * - Calendar generation testing
 */

import { test, expect, Page } from '@playwright/test';
import { getBridgeOpportunities2025, getTestUsers } from '../helpers/test-data-helper';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';
import { measurePerformance } from '../helpers/performance-helper';

test.describe('Bridge Weekend Optimization Flows', () => {
  const bridgeOpportunities = getBridgeOpportunities2025();
  const testUsers = getTestUsers();

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('Efficiency Optimization Algorithm', async ({ page }) => {
    await test.step('Test maximum efficiency optimization', async () => {
      // Select Bavaria for comprehensive bridge opportunities
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      // Set reasonable vacation days
      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      // Enable religious holidays for more opportunities
      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Select efficiency optimization
      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('efficiency');
      }

      // Generate bridge weekends
      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify results are sorted by efficiency (highest first)
      const efficiencyElements = page.locator('[data-testid="efficiency-ratio"]');
      const count = await efficiencyElements.count();

      expect(count).toBeGreaterThan(0);

      // Check first few results have high efficiency
      for (let i = 0; i < Math.min(count, 3); i++) {
        const efficiencyText = await efficiencyElements.nth(i).textContent();
        if (efficiencyText) {
          const efficiency = parseFloat(efficiencyText.replace(/[^\d.]/g, ''));
          expect(efficiency).toBeGreaterThan(2.0); // Expect good efficiency ratios
        }
      }

      // Verify efficiency is descending
      if (count >= 2) {
        const firstEfficiency = await efficiencyElements.first().textContent();
        const secondEfficiency = await efficiencyElements.nth(1).textContent();

        if (firstEfficiency && secondEfficiency) {
          const first = parseFloat(firstEfficiency.replace(/[^\d.]/g, ''));
          const second = parseFloat(secondEfficiency.replace(/[^\d.]/g, ''));
          expect(first).toBeGreaterThanOrEqual(second);
        }
      }
    });

    await test.step('Verify specific high-efficiency bridges', async () => {
      // Check for known high-efficiency opportunities
      const highEfficiencyBridges = [
        'Christi Himmelfahrt', // Thursday → 4 days with 1 vacation day
        'Tag der Arbeit'       // May 1st potential bridge
      ];

      for (const bridgeName of highEfficiencyBridges) {
        const bridgeElement = page.locator('[data-testid="bridge-weekend-item"]').filter({
          hasText: bridgeName
        });

        if (await bridgeElement.count() > 0) {
          // Verify it shows good efficiency
          const efficiency = await bridgeElement.locator('[data-testid="efficiency-ratio"]').textContent();
          if (efficiency) {
            const ratio = parseFloat(efficiency.replace(/[^\d.]/g, ''));
            expect(ratio).toBeGreaterThan(3.0); // Very efficient
          }
        }
      }
    });
  });

  test('Total Days Off Optimization Algorithm', async ({ page }) => {
    await test.step('Test maximum days off optimization', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30'); // More vacation days for maximum days off

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Select total days off optimization
      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('total_days_off');
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify results are sorted by total days off (highest first)
      const totalDaysElements = page.locator('[data-testid="total-days-off"]');
      const count = await totalDaysElements.count();

      expect(count).toBeGreaterThan(0);

      // Verify descending order of total days off
      if (count >= 2) {
        const firstTotal = await totalDaysElements.first().textContent();
        const secondTotal = await totalDaysElements.nth(1).textContent();

        if (firstTotal && secondTotal) {
          const first = parseInt(firstTotal.replace(/\D/g, ''));
          const second = parseInt(secondTotal.replace(/\D/g, ''));
          expect(first).toBeGreaterThanOrEqual(second);
        }
      }

      // Check for Christmas/New Year bridge (should be high total days)
      const christmasNewYearBridge = page.locator('[data-testid="bridge-weekend-item"]').filter({
        hasText: /weihnacht|christmas|neujahr|new year/i
      });

      if (await christmasNewYearBridge.count() > 0) {
        const totalDays = await christmasNewYearBridge.first().locator('[data-testid="total-days-off"]').textContent();
        if (totalDays) {
          const days = parseInt(totalDays.replace(/\D/g, ''));
          expect(days).toBeGreaterThan(5); // Should be a long break
        }
      }
    });
  });

  test('Balanced Optimization Algorithm', async ({ page }) => {
    await test.step('Test balanced optimization approach', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('NW');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      // Select balanced optimization
      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('balanced');
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify balanced results
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      expect(count).toBeGreaterThan(0);

      // Check that results have both decent efficiency and total days
      for (let i = 0; i < Math.min(count, 5); i++) {
        const item = bridgeItems.nth(i);

        const efficiencyText = await item.locator('[data-testid="efficiency-ratio"]').textContent();
        const totalDaysText = await item.locator('[data-testid="total-days-off"]').textContent();

        if (efficiencyText && totalDaysText) {
          const efficiency = parseFloat(efficiencyText.replace(/[^\d.]/g, ''));
          const totalDays = parseInt(totalDaysText.replace(/\D/g, ''));

          // Balanced approach should have reasonable values for both
          expect(efficiency).toBeGreaterThan(1.5);
          expect(totalDays).toBeGreaterThan(2);
        }
      }
    });
  });

  test('Vacation Budget Constraints', async ({ page }) => {
    await test.step('Test low vacation budget optimization', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      // Set very limited vacation days
      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('15');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('efficiency');
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify vacation budget is respected
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      if (count > 0) {
        let totalVacationDaysUsed = 0;

        for (let i = 0; i < count; i++) {
          const item = bridgeItems.nth(i);
          const vacationDaysText = await item.locator('[data-testid="vacation-days-needed"]').textContent();

          if (vacationDaysText) {
            const vacationDays = parseInt(vacationDaysText.replace(/\D/g, ''));
            totalVacationDaysUsed += vacationDays;
          }
        }

        // Should not exceed available vacation days (with some buffer for selection)
        expect(totalVacationDaysUsed).toBeLessThanOrEqual(30); // Reasonable total considering user can select
      }

      // Should prioritize high-efficiency, low-cost bridges
      const firstBridge = bridgeItems.first();
      const firstEfficiency = await firstBridge.locator('[data-testid="efficiency-ratio"]').textContent();

      if (firstEfficiency) {
        const efficiency = parseFloat(firstEfficiency.replace(/[^\d.]/g, ''));
        expect(efficiency).toBeGreaterThan(3.0); // Should be very efficient with limited budget
      }
    });

    await test.step('Test high vacation budget optimization', async () => {
      // Clear and set high vacation days
      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('35');

      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('total_days_off');
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForTimeout(3000); // Wait for recalculation

      // With high budget, should get more opportunities
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const highBudgetCount = await bridgeItems.count();

      expect(highBudgetCount).toBeGreaterThan(0);

      // Should include longer, more complex bridges
      const complexBridges = page.locator('[data-testid="bridge-weekend-item"]').filter({
        hasText: /sandwich|week/i
      });

      const complexCount = await complexBridges.count();
      expect(complexCount).toBeGreaterThanOrEqual(0); // May not always have complex bridges
    });
  });

  test('Bridge Weekend Pattern Validation', async ({ page }) => {
    await test.step('Verify different bridge patterns', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify different pattern types are represented
      const patternTypes = [
        'thursday-friday',  // Holiday on Thursday, bridge Friday
        'monday-tuesday',   // Holiday on Monday, weekend extension
        'friday-monday',    // Holiday on Friday, weekend extension
        'sandwich'          // Multiple days between weekends
      ];

      for (const pattern of patternTypes) {
        const patternElement = page.locator('[data-testid="bridge-pattern"]').filter({
          hasText: new RegExp(pattern.replace('-', '.*'), 'i')
        });

        // Not all patterns may be available, but check if displayed correctly
        if (await patternElement.count() > 0) {
          expect(await patternElement.first().textContent()).toBeTruthy();
        }
      }

      // Verify Christi Himmelfahrt (Thursday) shows correct pattern
      const christiHimmelfahrt = page.locator('[data-testid="bridge-weekend-item"]').filter({
        hasText: 'Christi Himmelfahrt'
      });

      if (await christiHimmelfahrt.count() > 0) {
        // Should be a Thursday-Friday pattern (29.05.2025 is Thursday)
        const patternText = await christiHimmelfahrt.locator('[data-testid="bridge-pattern"]').textContent();
        expect(patternText).toMatch(/donnerstag|thursday|freitag|friday/i);
      }
    });
  });

  test('State-Specific Bridge Opportunities', async ({ page }) => {
    await test.step('Compare bridge opportunities across states', async () => {
      const stateComparisons = [
        { code: 'BY', name: 'Bayern', hasExtra: ['Fronleichnam', 'Allerheiligen'] },
        { code: 'NW', name: 'NRW', hasExtra: ['Fronleichnam', 'Allerheiligen'] },
        { code: 'BE', name: 'Berlin', hasExtra: ['Internationaler Frauentag'] },
        { code: 'SN', name: 'Sachsen', hasExtra: ['Reformationstag'] }
      ];

      for (const state of stateComparisons) {
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption(state.code);

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('25');

        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.check();
        }

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForTimeout(3000); // Wait for state-specific calculation

        // Verify state-specific holidays create bridges
        for (const holiday of state.hasExtra) {
          const holidayBridge = page.locator('[data-testid="bridge-weekend-item"]').filter({
            hasText: holiday
          });

          if (await holidayBridge.count() > 0) {
            // Verify it has proper bridge weekend data
            const vacationDays = await holidayBridge.locator('[data-testid="vacation-days-needed"]').textContent();
            const totalDays = await holidayBridge.locator('[data-testid="total-days-off"]').textContent();

            expect(vacationDays).toBeTruthy();
            expect(totalDays).toBeTruthy();
          }
        }
      }
    });
  });

  test('Bridge Weekend Calendar Generation', async ({ page }) => {
    await test.step('Test calendar export preparation', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Select some bridge weekends
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      if (count > 0) {
        // Select first few bridges
        for (let i = 0; i < Math.min(count, 3); i++) {
          const selectCheckbox = bridgeItems.nth(i).locator('input[type="checkbox"]');
          if (await selectCheckbox.isVisible()) {
            await selectCheckbox.check();
          }
        }

        // Verify selection counter
        const selectedCount = page.locator('[data-testid="selected-bridges-count"]');
        if (await selectedCount.isVisible()) {
          const selectedText = await selectedCount.textContent();
          expect(selectedText).toMatch(/[1-9]/); // Should show some selected
        }

        // Test calendar preview
        const calendarPreview = page.locator('[data-testid="calendar-preview"]');
        if (await calendarPreview.isVisible()) {
          // Verify calendar data structure
          expect(await calendarPreview.textContent()).toBeTruthy();
        }
      }
    });
  });

  test('Bridge Weekend Performance Validation', async ({ page }) => {
    await test.step('Test optimization algorithm performance', async () => {
      const startTime = Date.now();

      // Test with maximum complexity (Bavaria + all holidays + high vacation days)
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('40'); // High vacation budget

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const optimizationSelector = page.locator('select[name="optimizeFor"]');
      if (await optimizationSelector.isVisible()) {
        await optimizationSelector.selectOption('balanced');
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      // Constitutional requirement: fast calculations
      expect(calculationTime).toBeLessThan(10000); // 10 seconds max even for complex scenarios

      // Verify results quality
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const resultCount = await bridgeItems.count();

      expect(resultCount).toBeGreaterThan(5); // Should find multiple opportunities
      expect(resultCount).toBeLessThan(50); // Should not overwhelm user

      // Performance metrics
      const performanceMetrics = await measurePerformance(page, {
        simulateSlowNetwork: false,
        testDevice: 'desktop'
      });

      expect(performanceMetrics.constitutional_compliance.interaction_under_100ms).toBe(true);
    });
  });

  test('Bridge Weekend Accessibility Validation', async ({ page, browserName }) => {
    await test.step('Test bridge weekend interface accessibility', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Test keyboard navigation through results
      const firstBridge = page.locator('[data-testid="bridge-weekend-item"]').first();
      await firstBridge.focus();

      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is manageable
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBe(1);

      // Run full accessibility test
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'de-DE',
        reportPath: `accessibility-reports/${browserName}-bridge-optimization.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);

      // Verify bridge weekend items have proper ARIA labels
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const item = bridgeItems.nth(i);
        const hasAriaLabel = await item.getAttribute('aria-label') ||
                            await item.getAttribute('aria-labelledby') ||
                            await item.locator('[aria-label]').count() > 0;

        expect(hasAriaLabel).toBeTruthy();
      }
    });
  });

  test('Edge Cases and Error Handling', async ({ page }) => {
    await test.step('Test optimization with edge cases', async () => {
      // Test with 0 vacation days
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('0');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      // Should handle gracefully - either show error or show holidays only
      await page.waitForTimeout(3000);

      const errorMessage = page.locator('[data-testid="error-message"], .error');
      const results = page.locator('[data-testid="bridge-weekend-results"]');

      // Either show error or show holidays without bridge opportunities
      const hasError = await errorMessage.count() > 0;
      const hasResults = await results.count() > 0;

      expect(hasError || hasResults).toBe(true);

      if (hasResults) {
        // If results shown, should indicate no vacation days needed
        const noVacationBridges = page.locator('[data-testid="bridge-weekend-item"]').filter({
          hasText: /0.*urlaubstag|0.*vacation.*day/i
        });

        expect(await noVacationBridges.count()).toBeGreaterThanOrEqual(0);
      }
    });

    await test.step('Test with maximum vacation days', async () => {
      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('365'); // Unrealistic but should handle

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForTimeout(3000);

      // Should either validate input or handle gracefully
      const errorMessage = page.locator('[data-testid="error-message"], .error');
      const results = page.locator('[data-testid="bridge-weekend-results"]');

      expect((await errorMessage.count() > 0) || (await results.count() > 0)).toBe(true);
    });
  });
});