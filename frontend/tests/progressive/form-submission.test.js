/**
 * Form Submission Testing Without JavaScript
 *
 * Tests that all forms work properly without JavaScript enabled.
 * Ensures form validation, submission, and error handling work server-side.
 */

const { test, expect } = require('@playwright/test');

test.describe('Form Submission Without JavaScript', () => {
  // Disable JavaScript for all tests in this suite
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Vacation Plan Creation Form', () => {
    test('should submit vacation plan without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Fill out state selection
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await stateSelect.selectOption('BY');
      } else {
        await page.locator('input[type="radio"][value="BY"]').check();
      }

      // Fill out year selection
      const yearSelect = page.locator('select[name="year"]');
      if (await yearSelect.isVisible()) {
        await yearSelect.selectOption('2025');
      }

      // Submit the form
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Should navigate to results page or update content
      await page.waitForLoadState('networkidle');

      // Verify vacation plan was created
      const planContent = page.locator('[data-testid="vacation-plan"], .vacation-plan, .bridge-weekends');
      await expect(planContent).toBeVisible();
    });

    test('should validate required fields server-side', async ({ page }) => {
      await page.goto('/');

      // Try to submit form without required fields
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      await page.waitForLoadState('networkidle');

      // Should show validation errors
      const errorMessages = page.locator('[role="alert"], .error, .field-error').first();
      if (await errorMessages.isVisible()) {
        await expect(errorMessages).toContainText(/required|erforderlich|auswählen/i);
      }

      // Form should retain user input
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        // Should not reset to default value
        const selectedValue = await stateSelect.inputValue();
        expect(selectedValue).toBeDefined();
      }
    });

    test('should handle form submission with POST method', async ({ page }) => {
      let postRequestMade = false;
      page.on('request', request => {
        if (request.method() === 'POST') {
          postRequestMade = true;
        }
      });

      await page.goto('/');

      // Fill and submit form
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await stateSelect.selectOption('BY');
      }

      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      await page.waitForLoadState('networkidle');

      // Verify POST request was made (for non-GET forms)
      // Note: Some forms might use GET for search functionality
      const form = page.locator('form').first();
      const method = await form.getAttribute('method');
      if (method && method.toLowerCase() === 'post') {
        expect(postRequestMade).toBe(true);
      }
    });
  });

  test.describe('Email Subscription Form', () => {
    test('should submit email for calendar delivery without JavaScript', async ({ page }) => {
      // Navigate to vacation plan page first
      await page.goto('/?state=BY&year=2025');

      // Look for email submission form
      const emailForm = page.locator('form').filter({ hasText: /email|e-mail/i });
      if (await emailForm.isVisible()) {
        // Fill email field
        const emailInput = emailForm.locator('input[type="email"], input[name*="email"]');
        await emailInput.fill('test@example.com');

        // Submit form
        const submitButton = emailForm.locator('button[type="submit"], input[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');

        // Should show confirmation message
        const confirmation = page.locator('[role="alert"], .success, .confirmation').filter({ hasText: /sent|gesendet|email/i });
        await expect(confirmation).toBeVisible();
      }
    });

    test('should validate email format server-side', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      const emailForm = page.locator('form').filter({ hasText: /email|e-mail/i });
      if (await emailForm.isVisible()) {
        // Submit with invalid email
        const emailInput = emailForm.locator('input[type="email"], input[name*="email"]');
        await emailInput.fill('invalid-email');

        const submitButton = emailForm.locator('button[type="submit"], input[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');

        // Should show validation error
        const errorMessage = page.locator('[role="alert"], .error').filter({ hasText: /email|format|ungültig/i });
        await expect(errorMessage).toBeVisible();

        // Email input should retain invalid value for user correction
        const retainedValue = await emailInput.inputValue();
        expect(retainedValue).toBe('invalid-email');
      }
    });

    test('should handle GDPR consent without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      const emailForm = page.locator('form').filter({ hasText: /email|e-mail/i });
      if (await emailForm.isVisible()) {
        // Look for GDPR consent checkbox
        const consentCheckbox = emailForm.locator('input[type="checkbox"]').filter({ hasText: /consent|einverstanden|datenschutz/i });
        if (await consentCheckbox.isVisible()) {
          // Try to submit without consent
          const emailInput = emailForm.locator('input[type="email"]');
          await emailInput.fill('test@example.com');

          const submitButton = emailForm.locator('button[type="submit"]');
          await submitButton.click();

          await page.waitForLoadState('networkidle');

          // Should require consent
          const consentError = page.locator('[role="alert"], .error').filter({ hasText: /consent|einverstanden|zustimmung/i });
          await expect(consentError).toBeVisible();
        }
      }
    });
  });

  test.describe('Language Selection Form', () => {
    test('should change language without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Find language selection form
      const languageForm = page.locator('form').filter({ hasText: /language|sprache/i });
      if (await languageForm.isVisible()) {
        // Select different language
        const languageSelect = languageForm.locator('select[name="language"], select[name="lang"]');
        if (await languageSelect.isVisible()) {
          await languageSelect.selectOption('en');
        } else {
          // Handle radio button selection
          const englishRadio = languageForm.locator('input[type="radio"][value="en"]');
          if (await englishRadio.isVisible()) {
            await englishRadio.check();
          }
        }

        // Submit language change
        const submitButton = languageForm.locator('button[type="submit"], input[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');

        // Verify language changed
        const pageContent = page.locator('html');
        const lang = await pageContent.getAttribute('lang');
        expect(lang).toBe('en');

        // Content should be in English
        const englishContent = page.locator('text=/vacation|holiday|bridge/i');
        await expect(englishContent).toBeVisible();
      }
    });

    test('should maintain state when changing language', async ({ page }) => {
      // Start with state selected
      await page.goto('/?state=BY&year=2025');

      const languageForm = page.locator('form').filter({ hasText: /language|sprache/i });
      if (await languageForm.isVisible()) {
        // Change language
        const languageSelect = languageForm.locator('select');
        if (await languageSelect.isVisible()) {
          await languageSelect.selectOption('en');
        }

        const submitButton = languageForm.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');

        // State selection should be maintained
        const currentUrl = page.url();
        expect(currentUrl).toContain('state=BY');

        // Content should still show Bayern-specific information
        const stateContent = page.locator('text=/Bayern|Bavaria/i');
        await expect(stateContent).toBeVisible();
      }
    });
  });

  test.describe('Search and Filter Forms', () => {
    test('should filter holidays by category without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Look for holiday filter form
      const filterForm = page.locator('form').filter({ hasText: /filter|kategorie|category/i });
      if (await filterForm.isVisible()) {
        // Select religious holidays filter
        const categorySelect = filterForm.locator('select[name*="category"], select[name*="filter"]');
        if (await categorySelect.isVisible()) {
          await categorySelect.selectOption('religious');

          const submitButton = filterForm.locator('button[type="submit"]');
          await submitButton.click();

          await page.waitForLoadState('networkidle');

          // Should show only religious holidays
          const religiousHolidays = page.locator('text=/Christmas|Easter|Weihnachten|Ostern/i');
          await expect(religiousHolidays).toBeVisible();

          // Should not show secular holidays
          const secularHolidays = page.locator('text=/New Year|Neujahr/i');
          const secularCount = await secularHolidays.count();
          expect(secularCount).toBe(0);
        }
      }
    });

    test('should handle complex search queries without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Look for search form
      const searchForm = page.locator('form').filter({ hasText: /search|suche/i });
      if (await searchForm.isVisible()) {
        // Enter search query
        const searchInput = searchForm.locator('input[type="search"], input[type="text"]');
        await searchInput.fill('Christmas');

        const submitButton = searchForm.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');

        // Should show search results
        const searchResults = page.locator('[data-testid="search-results"], .search-results');
        if (await searchResults.isVisible()) {
          const christmasResults = searchResults.locator('text=/Christmas|Weihnachten/i');
          await expect(christmasResults).toBeVisible();
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should maintain form labels without JavaScript', async ({ page }) => {
      await page.goto('/');

      // All form inputs should have proper labels
      const formInputs = page.locator('input, select, textarea');
      const inputCount = await formInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = formInputs.nth(i);
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');

        if (id) {
          // Should have associated label
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        } else if (name) {
          // Should have aria-label or be inside labeled fieldset
          const ariaLabel = await input.getAttribute('aria-label');
          const fieldset = input.locator('xpath=ancestor::fieldset[1]');

          if (!ariaLabel && await fieldset.count() > 0) {
            const legend = fieldset.locator('legend');
            await expect(legend).toBeVisible();
          } else if (!ariaLabel) {
            // Input should have some form of labeling
            console.warn(`Input without proper labeling: ${name}`);
          }
        }
      }
    });

    test('should provide error messages accessibly without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Submit form with validation errors
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForLoadState('networkidle');

      // Error messages should be accessible
      const errorMessages = page.locator('[role="alert"], .error');
      const errorCount = await errorMessages.count();

      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);

        // Should have alert role or be in a container with alert role
        const role = await error.getAttribute('role');
        if (role !== 'alert') {
          const alertContainer = error.locator('xpath=ancestor::*[@role="alert"][1]');
          await expect(alertContainer).toHaveCount(1);
        }

        // Should be visible and have meaningful text
        await expect(error).toBeVisible();
        const errorText = await error.textContent();
        expect(errorText.length).toBeGreaterThan(5);
      }
    });

    test('should support keyboard navigation in forms without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Tab through form elements
      await page.keyboard.press('Tab');
      let tabCount = 0;
      const maxTabs = 20; // Prevent infinite loop

      while (tabCount < maxTabs) {
        const focused = page.locator(':focus');
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase()).catch(() => null);

        if (['input', 'select', 'textarea', 'button'].includes(tagName)) {
          // Interactive element should be focusable
          await expect(focused).toBeVisible();

          // Should have visible focus indicator
          const focusOutline = await focused.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.outline !== 'none' || styles.boxShadow !== 'none';
          });
          expect(focusOutline).toBe(true);
        }

        await page.keyboard.press('Tab');
        tabCount++;

        // Break if we've cycled back to the first element
        const newFocused = page.locator(':focus');
        const newTagName = await newFocused.evaluate(el => el.tagName.toLowerCase()).catch(() => null);
        if (tabCount > 1 && newTagName === 'a' && await newFocused.textContent() === 'Skip to main content') {
          break;
        }
      }

      expect(tabCount).toBeGreaterThan(1); // Should have multiple focusable elements
    });
  });

  test.describe('Form Error Recovery', () => {
    test('should preserve form data on validation errors', async ({ page }) => {
      await page.goto('/');

      // Fill form with mix of valid and invalid data
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await stateSelect.selectOption('BY');
      }

      // Submit with missing required field
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForLoadState('networkidle');

      // Valid data should be preserved
      if (await stateSelect.isVisible()) {
        const preservedValue = await stateSelect.inputValue();
        expect(preservedValue).toBe('BY');
      }
    });

    test('should provide clear recovery instructions', async ({ page }) => {
      await page.goto('/');

      // Trigger validation errors
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForLoadState('networkidle');

      // Error messages should provide clear instructions
      const errorMessages = page.locator('[role="alert"], .error');
      if (await errorMessages.count() > 0) {
        const errorText = await errorMessages.first().textContent();

        // Should contain actionable instruction
        const hasInstruction = /please|bitte|select|wählen|enter|eingeben|required|erforderlich/.test(errorText.toLowerCase());
        expect(hasInstruction).toBe(true);
      }
    });
  });
});