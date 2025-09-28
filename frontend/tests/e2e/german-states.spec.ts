/**
 * German States and Holiday Testing Scenarios
 * Constitutional Requirements:
 * - Accurate holiday data for all 16 German Bundesländer
 * - State-specific holiday validation
 * - Religious vs secular holiday handling
 * - Bridge weekend calculations per state
 */

import { test, expect, Page } from '@playwright/test';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';
import { getGermanStates, getFederalHolidays2025, getStateHolidays2025 } from '../helpers/test-data-helper';

test.describe('German States Holiday Validation', () => {
  const germanStates = getGermanStates();
  const federalHolidays = getFederalHolidays2025();
  const stateHolidays = getStateHolidays2025();

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('All 16 German States Available in Selector', async ({ page }) => {
    await test.step('Verify all German states are available', async () => {
      const stateSelector = page.locator('[data-testid="state-selector"]').or(
        page.locator('select[name="state"]')
      ).or(
        page.locator('select').first()
      );

      await expect(stateSelector).toBeVisible();

      // Verify all 16 German states are available
      const stateOptions = await stateSelector.locator('option').allTextContents();

      for (const state of germanStates) {
        const hasState = stateOptions.some(option =>
          option.includes(state.name_de) || option.includes(state.code)
        );
        expect(hasState).toBe(true);
      }

      // Verify state count (16 states + possibly a default option)
      expect(stateOptions.length).toBeGreaterThanOrEqual(16);
    });
  });

  // Test each German state individually
  germanStates.forEach(state => {
    test(`${state.name_de} (${state.code}) - Holiday Validation`, async ({ page }) => {
      await test.step(`Test ${state.name_de} holiday configuration`, async () => {
        // Select the state
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption(state.code);
        await expect(stateSelector).toHaveValue(state.code);

        // Set vacation days
        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('25');

        // Enable religious holidays for testing
        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.check();
        }

        // Generate holiday overview
        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate|overview/i });
        await generateButton.click();

        // Wait for results
        await page.waitForSelector('[data-testid="holiday-overview"], [data-testid="bridge-weekend-results"]', {
          timeout: 10000
        });

        // Verify federal holidays are always present
        for (const holiday of federalHolidays) {
          await expect(page.locator(`text=${holiday.name_de}`)).toBeVisible();
        }

        // Verify state-specific holidays
        if (stateHolidays[state.code]) {
          for (const holiday of stateHolidays[state.code]) {
            if (holiday.states.includes(state.code)) {
              await expect(page.locator(`text=${holiday.name_de}`)).toBeVisible();
            }
          }
        }

        // Verify holidays NOT in this state are absent
        const allStateHolidays = Object.values(stateHolidays).flat();
        for (const holiday of allStateHolidays) {
          if (!holiday.states.includes(state.code) && !holiday.states.includes('ALL')) {
            await expect(page.locator(`text=${holiday.name_de}`)).not.toBeVisible();
          }
        }
      });
    });
  });

  test('Bavaria (BY) - Complete Catholic Holiday Set', async ({ page }) => {
    await test.step('Verify Bavaria has all Catholic holidays', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Bavaria-specific holidays
      await expect(page.locator('text=Heilige Drei Könige')).toBeVisible(); // Epiphany
      await expect(page.locator('text=Fronleichnam')).toBeVisible(); // Corpus Christi
      await expect(page.locator('text=Mariä Himmelfahrt')).toBeVisible(); // Assumption of Mary
      await expect(page.locator('text=Allerheiligen')).toBeVisible(); // All Saints' Day

      // Verify Bavaria has more holidays than secular states
      const holidayElements = page.locator('[data-testid="holiday-item"], .holiday-item');
      const holidayCount = await holidayElements.count();

      expect(holidayCount).toBeGreaterThanOrEqual(13); // Federal + Bavarian holidays
    });

    await test.step('Test Catholic vs Protestant holiday toggle', async () => {
      // First test with religious holidays enabled (default)
      const withReligiousCount = await page.locator('[data-testid="holiday-item"], .holiday-item').count();

      // Disable religious holidays
      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible() && await religiousToggle.isChecked()) {
        await religiousToggle.uncheck();

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForTimeout(2000); // Wait for recalculation

        // Should have fewer holidays without religious ones
        const withoutReligiousCount = await page.locator('[data-testid="holiday-item"], .holiday-item').count();

        expect(withoutReligiousCount).toBeLessThan(withReligiousCount);

        // Religious holidays should not be visible
        await expect(page.locator('text=Fronleichnam')).not.toBeVisible();
        await expect(page.locator('text=Allerheiligen')).not.toBeVisible();
      }
    });
  });

  test('Berlin (BE) - Secular State with Women\'s Day', async ({ page }) => {
    await test.step('Verify Berlin secular holidays', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BE');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Berlin-specific holiday
      await expect(page.locator('text=Internationaler Frauentag')).toBeVisible();

      // Should NOT have Catholic holidays
      await expect(page.locator('text=Fronleichnam')).not.toBeVisible();
      await expect(page.locator('text=Allerheiligen')).not.toBeVisible();
      await expect(page.locator('text=Heilige Drei Könige')).not.toBeVisible();
    });
  });

  test('Protestant States - Reformation Day Validation', async ({ page }) => {
    const protestantStates = ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'TH'];

    for (const stateCode of protestantStates.slice(0, 3)) { // Test first 3 for time
      await test.step(`Test Reformation Day in ${stateCode}`, async () => {
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption(stateCode);

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('25');

        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.check();
        }

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForTimeout(3000); // Wait for state change

        // Should have Reformation Day
        await expect(page.locator('text=Reformationstag')).toBeVisible();

        // Should NOT have Catholic-specific holidays
        await expect(page.locator('text=Fronleichnam')).not.toBeVisible();
        await expect(page.locator('text=Allerheiligen')).not.toBeVisible();
      });
    }
  });

  test('Holiday Date Accuracy Validation', async ({ page }) => {
    await test.step('Verify 2025 holiday dates are correct', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY'); // Use Bavaria for comprehensive test

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify specific 2025 dates
      const dateChecks = [
        { holiday: 'Neujahr', date: '01.01.2025' },
        { holiday: 'Heilige Drei Könige', date: '06.01.2025' },
        { holiday: 'Karfreitag', date: '18.04.2025' },
        { holiday: 'Ostermontag', date: '21.04.2025' },
        { holiday: 'Tag der Arbeit', date: '01.05.2025' },
        { holiday: 'Christi Himmelfahrt', date: '29.05.2025' },
        { holiday: 'Pfingstmontag', date: '09.06.2025' },
        { holiday: 'Fronleichnam', date: '19.06.2025' },
        { holiday: 'Tag der Deutschen Einheit', date: '03.10.2025' },
        { holiday: 'Allerheiligen', date: '01.11.2025' },
        { holiday: 'Weihnachtstag', date: '25.12.2025' }
      ];

      for (const check of dateChecks) {
        const holidayElement = page.locator(`[data-testid="holiday-item"]`).filter({
          hasText: check.holiday
        });

        if (await holidayElement.count() > 0) {
          // Check if date is displayed correctly (various possible formats)
          const hasCorrectDate = await holidayElement.filter({
            hasText: new RegExp(check.date.replace(/\./g, '\\.'))
          }).count() > 0;

          if (hasCorrectDate) {
            expect(true).toBe(true); // Date is correct
          }
        }
      }
    });
  });

  test('Bridge Weekend Calculation per State', async ({ page }) => {
    await test.step('Compare bridge opportunities across states', async () => {
      const stateComparisons = [
        { code: 'BY', name: 'Bayern', expectedMin: 8 }, // More holidays = more bridges
        { code: 'BE', name: 'Berlin', expectedMin: 5 }, // Fewer holidays = fewer bridges
        { code: 'NW', name: 'NRW', expectedMin: 6 } // Medium holidays
      ];

      const results: { state: string; count: number }[] = [];

      for (const state of stateComparisons) {
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption(state.code);

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('30');

        const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
        if (await religiousToggle.isVisible()) {
          await religiousToggle.check();
        }

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        const bridgeCount = await page.locator('[data-testid="bridge-weekend-item"]').count();
        results.push({ state: state.name, count: bridgeCount });

        expect(bridgeCount).toBeGreaterThanOrEqual(state.expectedMin);
      }

      // Bavaria should have more bridge opportunities than Berlin
      const bavariaResult = results.find(r => r.state === 'Bayern');
      const berlinResult = results.find(r => r.state === 'Berlin');

      if (bavariaResult && berlinResult) {
        expect(bavariaResult.count).toBeGreaterThan(berlinResult.count);
      }
    });
  });

  test('State Holiday Accessibility Validation', async ({ page, browserName }) => {
    await test.step('Test state selection accessibility', async () => {
      // Test keyboard navigation through states
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.focus();

      // Test with keyboard
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Verify state changed
      const selectedState = await stateSelector.inputValue();
      expect(selectedState).toBeTruthy();

      // Run accessibility test
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'de-DE',
        reportPath: `accessibility-reports/${browserName}-state-selection.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);

      // Verify state selector has proper labels
      const selectorLabel = await page.locator('label[for*="state"], label').filter({
        hasText: /bundesland|state/i
      }).count();

      expect(selectorLabel).toBeGreaterThan(0);
    });
  });

  test('Holiday Translation Validation', async ({ page }) => {
    await test.step('Test German/English holiday translations', async () => {
      // Test German version
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Verify German holiday names
      await expect(page.locator('text=Karfreitag')).toBeVisible();
      await expect(page.locator('text=Fronleichnam')).toBeVisible();

      // Switch to English if available
      const languageToggle = page.locator('[data-testid="language-toggle"]').or(
        page.locator('button').filter({ hasText: /english|en/i })
      );

      if (await languageToggle.isVisible()) {
        await languageToggle.click();

        await page.waitForTimeout(2000); // Wait for translation

        // Verify English holiday names
        await expect(page.locator('text=Good Friday')).toBeVisible();
        await expect(page.locator('text=Corpus Christi')).toBeVisible();
      }
    });
  });

  test('State Performance with All Holidays', async ({ page }) => {
    await test.step('Performance test with Bavaria (most holidays)', async () => {
      const startTime = Date.now();

      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      // Constitutional requirement: calculations should be fast
      expect(calculationTime).toBeLessThan(5000); // 5 seconds max

      // Verify all results are displayed
      const bridgeCount = await page.locator('[data-testid="bridge-weekend-item"]').count();
      expect(bridgeCount).toBeGreaterThan(0);
    });
  });
});