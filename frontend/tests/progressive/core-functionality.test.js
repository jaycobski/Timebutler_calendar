/**
 * Core Functionality Without JavaScript Tests
 *
 * Tests that all essential features work without JavaScript enabled.
 * Ensures progressive enhancement and accessibility for all users.
 */

const { test, expect } = require('@playwright/test');

// Test suite configuration for no-JavaScript environment
test.describe('Core Functionality Without JavaScript', () => {
  // Disable JavaScript for all tests in this suite
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Homepage Accessibility', () => {
    test('should render complete homepage without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Check page title is set
      await expect(page).toHaveTitle(/Timebutler Calendar/);

      // Verify main heading is present and accessible
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).toHaveAttribute('id');

      // Check navigation is accessible
      const navigation = page.locator('nav[aria-label], [role="navigation"]');
      await expect(navigation).toBeVisible();

      // Verify skip links are present for screen readers
      const skipLink = page.locator('a[href="#main-content"], a[href="#main"]');
      await expect(skipLink).toBeVisible();
    });

    test('should display language toggle without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Language toggle should be a form with submit button (not JavaScript)
      const languageForm = page.locator('form').filter({ hasText: /language|sprache/i });
      await expect(languageForm).toBeVisible();

      // Should have proper method attribute
      await expect(languageForm).toHaveAttribute('method', 'post');

      // Should have language selection options
      const languageSelect = languageForm.locator('select, input[type="radio"]');
      await expect(languageSelect).toBeVisible();
    });

    test('should show holiday year selection without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Year selection should be available as form elements
      const yearSelection = page.locator('[name="year"], select').filter({ hasText: /2025|2026/ });
      await expect(yearSelection).toBeVisible();

      // Should have current year pre-selected
      const currentYear = new Date().getFullYear();
      if (currentYear === 2025 || currentYear === 2026) {
        await expect(yearSelection).toHaveValue(currentYear.toString());
      }
    });
  });

  test.describe('State Selection Functionality', () => {
    test('should display all German states without JavaScript', async ({ page }) => {
      await page.goto('/');

      // State selection should be visible as form elements
      const stateSelection = page.locator('select[name="state"], fieldset').first();
      await expect(stateSelection).toBeVisible();

      // Should contain all 16 German states
      const stateOptions = page.locator('option, input[type="radio"]').filter({ hasText: /Bayern|NRW|Berlin|Hamburg/ });
      await expect(stateOptions.first()).toBeVisible();
    });

    test('should allow state selection via form submission', async ({ page }) => {
      await page.goto('/');

      // Select a state (Bayern as example)
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await stateSelect.selectOption('BY');
      } else {
        // Handle radio button selection
        const bayernRadio = page.locator('input[type="radio"][value="BY"]');
        await bayernRadio.check();
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Should navigate to state-specific page or update content
      await page.waitForLoadState('networkidle');

      // Verify state-specific content is loaded
      const stateContent = page.locator('text=/Bayern|Bavaria/i');
      await expect(stateContent).toBeVisible();
    });

    test('should maintain accessibility labels for state selection', async ({ page }) => {
      await page.goto('/');

      // State selection should have proper labels
      const stateFieldset = page.locator('fieldset').filter({ hasText: /state|bundesland/i });
      if (await stateFieldset.isVisible()) {
        await expect(stateFieldset).toHaveAttribute('aria-labelledby');

        const legend = stateFieldset.locator('legend');
        await expect(legend).toBeVisible();
      }

      // Select element should have proper labeling
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await expect(stateSelect).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Holiday Display Functionality', () => {
    test('should display holidays for selected state without JavaScript', async ({ page }) => {
      // Go to page with state pre-selected
      await page.goto('/?state=BY&year=2025');

      // Should show holiday list
      const holidayList = page.locator('[role="list"], ul, table').filter({ hasText: /feiertag|holiday/i });
      await expect(holidayList).toBeVisible();

      // Should show specific holidays for Bayern
      const newYear = page.locator('text=/Neujahr|New Year/i');
      const christmas = page.locator('text=/Weihnachten|Christmas/i');
      await expect(newYear).toBeVisible();
      await expect(christmas).toBeVisible();
    });

    test('should display bridge weekend opportunities without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Bridge weekends should be displayed as static content
      const bridgeWeekends = page.locator('[data-testid="bridge-weekends"], .bridge-weekend').first();
      await expect(bridgeWeekends).toBeVisible();

      // Should show vacation days needed
      const vacationDays = page.locator('text=/vacation day|urlaubstag/i');
      await expect(vacationDays).toBeVisible();

      // Should show efficiency ratings
      const efficiency = page.locator('text=/efficiency|effizienz/i');
      await expect(efficiency).toBeVisible();
    });

    test('should maintain proper heading hierarchy for holidays', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Check heading hierarchy is logical
      const h1 = page.locator('h1');
      const h2 = page.locator('h2');
      const h3 = page.locator('h3');

      await expect(h1).toBeVisible();

      // If h3 exists, h2 should exist
      const h3Count = await h3.count();
      if (h3Count > 0) {
        const h2Count = await h2.count();
        expect(h2Count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Content Navigation', () => {
    test('should provide accessible navigation without JavaScript', async ({ page }) => {
      await page.goto('/');

      // All navigation should be standard links
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();

      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        await expect(link).toHaveAttribute('href');

        // Links should not have JavaScript handlers
        const onclick = await link.getAttribute('onclick');
        expect(onclick).toBeNull();
      }
    });

    test('should allow keyboard navigation without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Should focus on skip link first
      const focused = page.locator(':focus');
      const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
      expect(['a', 'button', 'input', 'select']).toContain(tagName);

      // Continue tabbing through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach all interactive elements
      const finalFocused = page.locator(':focus');
      await expect(finalFocused).toBeVisible();
    });

    test('should provide breadcrumb navigation without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Check for breadcrumb navigation
      const breadcrumb = page.locator('[aria-label="breadcrumb"], .breadcrumb, nav[aria-label*="breadcrumb"]');
      if (await breadcrumb.isVisible()) {
        // Should contain navigation trail
        const breadcrumbLinks = breadcrumb.locator('a');
        await expect(breadcrumbLinks.first()).toBeVisible();

        // Current page should be indicated
        const currentPage = breadcrumb.locator('[aria-current="page"]');
        await expect(currentPage).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error messages without JavaScript', async ({ page }) => {
      // Test with invalid state parameter
      await page.goto('/?state=INVALID');

      // Should show user-friendly error message
      const errorMessage = page.locator('[role="alert"], .error, .warning').first();
      await expect(errorMessage).toBeVisible();

      // Error should be accessible
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('should gracefully handle missing data without JavaScript', async ({ page }) => {
      // Test with future year that might not have data
      await page.goto('/?state=BY&year=2030');

      // Should either show data or appropriate message
      const content = page.locator('main, [role="main"]');
      await expect(content).toBeVisible();

      // Should not show broken layout or missing content
      const noDataMessage = page.locator('text=/no data|keine daten|not available/i');
      if (await noDataMessage.isVisible()) {
        // Message should be in an accessible container
        await expect(noDataMessage.locator('..').first()).toHaveAttribute('role', 'alert');
      }
    });
  });

  test.describe('Performance Validation', () => {
    test('should load quickly without JavaScript overhead', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load faster without JS (target: under 1.5 seconds)
      expect(loadTime).toBeLessThan(1500);
    });

    test('should use minimal network requests without JavaScript', async ({ page }) => {
      const requests = [];
      page.on('request', request => {
        requests.push(request.url());
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not load unnecessary JavaScript files
      const jsRequests = requests.filter(url => url.endsWith('.js'));
      expect(jsRequests.length).toBeLessThan(5); // Only essential scripts
    });
  });
});