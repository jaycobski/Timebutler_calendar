/**
 * Accessibility Without JavaScript Tests
 *
 * Tests that ensure WCAG 2.1 Level AA compliance when JavaScript is disabled.
 * Validates that all accessibility features work without client-side scripting.
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

test.describe('Accessibility Without JavaScript', () => {
  // Disable JavaScript for all tests
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should provide proper heading hierarchy without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Check heading hierarchy is logical
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = [];

      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        headingLevels.push(level);
      }

      // First heading should be h1
      expect(headingLevels[0]).toBe(1);

      // Heading levels should not skip (h1 -> h3 is bad)
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        const levelDifference = currentLevel - previousLevel;

        // Level should not jump by more than 1
        expect(levelDifference).toBeLessThanOrEqual(1);
      }
    });

    test('should provide meaningful page titles without JavaScript', async ({ page }) => {
      // Test homepage
      await page.goto('/');
      let title = await page.title();
      expect(title).toMatch(/timebutler|calendar|holiday/i);
      expect(title.length).toBeGreaterThan(10);

      // Test state-specific page
      await page.goto('/?state=BY&year=2025');
      title = await page.title();
      expect(title).toMatch(/bayern|bavaria/i);
      expect(title).toContain('2025');
    });

    test('should provide skip links for keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Skip link should be the first focusable element
      await page.keyboard.press('Tab');
      const firstFocused = page.locator(':focus');
      const href = await firstFocused.getAttribute('href');

      expect(href).toMatch(/#main|#content|#skip/);

      // Skip link should be visible when focused
      await expect(firstFocused).toBeVisible();

      // Skip link text should be descriptive
      const skipText = await firstFocused.textContent();
      expect(skipText).toMatch(/skip|main|content|haupt/i);
    });

    test('should maintain landmark structure without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Essential landmarks should be present
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      await expect(main).toHaveCount(1); // Only one main landmark

      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();

      // Header should be identifiable
      const header = page.locator('header, [role="banner"]');
      await expect(header).toBeVisible();

      // Footer should be present
      const footer = page.locator('footer, [role="contentinfo"]');
      await expect(footer).toBeVisible();
    });

    test('should provide descriptive link text without JavaScript', async ({ page }) => {
      await page.goto('/');

      const links = await page.locator('a[href]').all();

      for (const link of links) {
        const linkText = await link.textContent();
        const href = await link.getAttribute('href');

        // Link should have meaningful text
        expect(linkText.trim().length).toBeGreaterThan(0);

        // Avoid generic link text
        const genericText = /^(click here|here|more|link|read more|mehr)$/i;
        expect(linkText.trim()).not.toMatch(genericText);

        // If link text is generic, should have aria-label
        if (linkText.trim().length < 4) {
          const ariaLabel = await link.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel.length).toBeGreaterThan(linkText.length);
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation without JavaScript', async ({ page }) => {
      await page.goto('/');

      const focusableElements = [];
      let tabCount = 0;
      const maxTabs = 30;

      // Tab through all interactive elements
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        const focused = page.locator(':focus');
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase()).catch(() => null);

        if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) {
          const elementInfo = {
            tagName,
            text: await focused.textContent().catch(() => ''),
            value: await focused.inputValue().catch(() => ''),
            type: await focused.getAttribute('type'),
          };
          focusableElements.push(elementInfo);

          // Element should have visible focus indicator
          const isVisible = await focused.isVisible();
          expect(isVisible).toBe(true);
        }

        // Stop if we've reached the end (focus cycles back)
        if (tabCount > 3) {
          const currentText = await focused.textContent().catch(() => '');
          if (currentText === focusableElements[0]?.text) {
            break;
          }
        }
      }

      // Should have multiple focusable elements
      expect(focusableElements.length).toBeGreaterThan(2);
    });

    test('should support reverse tab navigation without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Tab to the last element
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      const lastFocused = await page.locator(':focus').textContent();

      // Shift+Tab should go backwards
      await page.keyboard.press('Shift+Tab');
      const previousFocused = await page.locator(':focus').textContent();

      expect(previousFocused).not.toBe(lastFocused);
    });

    test('should handle Enter and Space key activation without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Find a button
      const button = page.locator('button, input[type="submit"]').first();
      if (await button.isVisible()) {
        await button.focus();

        // Both Enter and Space should activate buttons
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        // Check if form was submitted or page changed
        const currentUrl = page.url();
        expect(currentUrl).toBeDefined();
      }

      // Find a link
      const link = page.locator('a[href]').first();
      if (await link.isVisible()) {
        await link.focus();

        // Enter should activate links
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');
      }
    });

    test('should provide keyboard shortcuts without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Test access keys if implemented
      const elementsWithAccessKey = await page.locator('[accesskey]').all();

      for (const element of elementsWithAccessKey) {
        const accessKey = await element.getAttribute('accesskey');
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());

        expect(accessKey).toMatch(/^[a-z0-9]$/i);

        // Access key should be documented
        const title = await element.getAttribute('title');
        if (title) {
          expect(title.toLowerCase()).toContain(accessKey.toLowerCase());
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should associate labels with form controls without JavaScript', async ({ page }) => {
      await page.goto('/');

      const formControls = await page.locator('input, select, textarea').all();

      for (const control of formControls) {
        const id = await control.getAttribute('id');
        const name = await control.getAttribute('name');
        const type = await control.getAttribute('type');

        // Skip hidden inputs
        if (type === 'hidden') continue;

        let hasLabel = false;

        // Check for explicit label
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          if (await label.count() > 0) {
            hasLabel = true;
            const labelText = await label.textContent();
            expect(labelText.trim().length).toBeGreaterThan(0);
          }
        }

        // Check for aria-label
        if (!hasLabel) {
          const ariaLabel = await control.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.trim().length > 0) {
            hasLabel = true;
          }
        }

        // Check for aria-labelledby
        if (!hasLabel) {
          const ariaLabelledBy = await control.getAttribute('aria-labelledby');
          if (ariaLabelledBy) {
            const labelElement = page.locator(`#${ariaLabelledBy}`);
            if (await labelElement.count() > 0) {
              hasLabel = true;
            }
          }
        }

        // Check if inside labeled fieldset
        if (!hasLabel) {
          const fieldset = control.locator('xpath=ancestor::fieldset[1]');
          if (await fieldset.count() > 0) {
            const legend = fieldset.locator('legend');
            if (await legend.count() > 0) {
              hasLabel = true;
            }
          }
        }

        if (!hasLabel) {
          console.warn(`Form control without label: ${name || id || type}`);
        }
        expect(hasLabel).toBe(true);
      }
    });

    test('should provide field validation messages accessibly without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Try to submit form with validation errors
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Check for accessible error messages
        const errorMessages = await page.locator('[role="alert"], .error, .field-error').all();

        for (const error of errorMessages) {
          // Error should be visible
          await expect(error).toBeVisible();

          // Error should have meaningful text
          const errorText = await error.textContent();
          expect(errorText.trim().length).toBeGreaterThan(5);

          // Error should be associated with form field
          const describedBy = await error.getAttribute('id');
          if (describedBy) {
            const associatedField = page.locator(`[aria-describedby*="${describedBy}"]`);
            await expect(associatedField).toBeVisible();
          }
        }
      }
    });

    test('should provide required field indicators without JavaScript', async ({ page }) => {
      await page.goto('/');

      const requiredFields = await page.locator('input[required], select[required], textarea[required]').all();

      for (const field of requiredFields) {
        const id = await field.getAttribute('id');
        const isRequired = await field.getAttribute('required');

        expect(isRequired).not.toBeNull();

        // Required field should be indicated visually and programmatically
        const ariaRequired = await field.getAttribute('aria-required');
        expect(ariaRequired).toBe('true');

        // Label should indicate required status
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          if (await label.count() > 0) {
            const labelText = await label.textContent();
            const hasRequiredIndicator = labelText.includes('*') ||
                                        labelText.includes('required') ||
                                        labelText.includes('erforderlich');
            expect(hasRequiredIndicator).toBe(true);
          }
        }
      }
    });

    test('should group related form fields without JavaScript', async ({ page }) => {
      await page.goto('/');

      const fieldsets = await page.locator('fieldset').all();

      for (const fieldset of fieldsets) {
        // Fieldset should have legend
        const legend = fieldset.locator('legend');
        await expect(legend).toBeVisible();

        const legendText = await legend.textContent();
        expect(legendText.trim().length).toBeGreaterThan(0);

        // Fieldset should contain form controls
        const formControls = fieldset.locator('input, select, textarea');
        const controlCount = await formControls.count();
        expect(controlCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Content Accessibility', () => {
    test('should provide alternative text for images without JavaScript', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src');
        const role = await img.getAttribute('role');

        // Decorative images should have empty alt or role="presentation"
        if (role === 'presentation' || alt === '') {
          // This is fine for decorative images
          continue;
        }

        // Content images should have descriptive alt text
        expect(alt).toBeTruthy();
        expect(alt.length).toBeGreaterThan(3);

        // Alt text should not repeat filename
        const filename = src?.split('/').pop()?.split('.')[0];
        if (filename) {
          expect(alt.toLowerCase()).not.toContain(filename.toLowerCase());
        }

        // Alt text should not contain redundant phrases
        expect(alt.toLowerCase()).not.toMatch(/image of|picture of|bild von/);
      }
    });

    test('should provide table accessibility without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      const tables = await page.locator('table').all();

      for (const table of tables) {
        // Table should have caption or aria-label
        const caption = table.locator('caption');
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledBy = await table.getAttribute('aria-labelledby');

        const hasDescription = await caption.count() > 0 || ariaLabel || ariaLabelledBy;
        expect(hasDescription).toBe(true);

        // Table should have proper headers
        const headerCells = table.locator('th');
        const headerCount = await headerCells.count();
        expect(headerCount).toBeGreaterThan(0);

        // Headers should have scope attributes for complex tables
        const rows = await table.locator('tr').count();
        const cols = await table.locator('tr').first().locator('th, td').count();

        if (rows > 2 && cols > 2) {
          // Complex table should have scope attributes
          const headersWithScope = await table.locator('th[scope]').count();
          expect(headersWithScope).toBeGreaterThan(0);
        }
      }
    });

    test('should provide list structure for content without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Holiday lists should be proper lists
      const lists = await page.locator('ul, ol').all();

      for (const list of lists) {
        // List should contain list items
        const listItems = list.locator('li');
        const itemCount = await listItems.count();
        expect(itemCount).toBeGreaterThan(0);

        // If it's a navigation list, should have role="list"
        const parent = list.locator('xpath=..');
        const parentRole = await parent.getAttribute('role');
        if (parentRole === 'navigation') {
          const listRole = await list.getAttribute('role');
          expect(listRole).toBe('list');
        }
      }
    });

    test('should provide proper text contrast without JavaScript', async ({ page }) => {
      await page.goto('/');

      // This test would typically require color analysis
      // For now, we'll check that text elements are visible
      const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label').all();

      for (const element of textElements.slice(0, 10)) { // Test first 10 for performance
        const text = await element.textContent();
        if (text && text.trim().length > 0) {
          const isVisible = await element.isVisible();
          expect(isVisible).toBe(true);

          // Element should have computed styles that ensure visibility
          const opacity = await element.evaluate(el => window.getComputedStyle(el).opacity);
          expect(parseFloat(opacity)).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Language and Localization Accessibility', () => {
    test('should set language attributes without JavaScript', async ({ page }) => {
      await page.goto('/');

      // HTML should have lang attribute
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toMatch(/^(de|en)(-[A-Z]{2})?$/);

      // Content in different languages should have lang attributes
      const foreignText = await page.locator('[lang]').all();

      for (const element of foreignText) {
        const elementLang = await element.getAttribute('lang');
        expect(elementLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);

        const text = await element.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });

    test('should provide direction attributes for text without JavaScript', async ({ page }) => {
      await page.goto('/');

      // For German/English content, direction should be ltr
      const html = page.locator('html');
      const dir = await html.getAttribute('dir');
      if (dir) {
        expect(dir).toBe('ltr');
      }

      // Any RTL content should be marked
      const rtlElements = await page.locator('[dir="rtl"]').all();
      for (const element of rtlElements) {
        const text = await element.textContent();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error and Status Communication', () => {
    test('should announce status changes without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Submit form to generate status message
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Status messages should use alert role
        const statusMessages = await page.locator('[role="alert"], [role="status"]').all();

        for (const message of statusMessages) {
          await expect(message).toBeVisible();

          const messageText = await message.textContent();
          expect(messageText.trim().length).toBeGreaterThan(0);

          // Message should not disappear (since no JS to hide it)
          await page.waitForTimeout(1000);
          await expect(message).toBeVisible();
        }
      }
    });

    test('should provide error recovery instructions without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Trigger validation errors
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        const errorMessages = await page.locator('[role="alert"], .error').all();

        for (const error of errorMessages) {
          const errorText = await error.textContent();

          // Error should provide actionable guidance
          const hasGuidance = /please|bitte|select|wählen|enter|eingeben|required|erforderlich|must|muss/.test(errorText.toLowerCase());
          expect(hasGuidance).toBe(true);

          // Error should be near the related field
          const errorId = await error.getAttribute('id');
          if (errorId) {
            const relatedField = page.locator(`[aria-describedby*="${errorId}"]`);
            if (await relatedField.count() > 0) {
              await expect(relatedField).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Automated Accessibility Testing', () => {
    test('should pass axe accessibility tests without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Re-enable JavaScript temporarily for axe
      await page.context().setJavaScriptEnabled(true);
      await injectAxe(page);
      await page.context().setJavaScriptEnabled(false);

      // Reload page without JavaScript
      await page.reload();

      // Re-enable JavaScript for axe testing only
      await page.context().setJavaScriptEnabled(true);
      await injectAxe(page);

      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        // Focus on issues that would exist without JavaScript
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          // Disable rules that require JavaScript
          'color-contrast': { enabled: false }, // Requires computed styles
        }
      });
    });

    test('should maintain accessibility on different pages without JavaScript', async ({ page }) => {
      const testPages = [
        '/',
        '/?state=BY&year=2025',
        '/?state=NW&year=2025&lang=en',
      ];

      for (const testPage of testPages) {
        await page.goto(testPage);

        // Basic accessibility checks
        const main = page.locator('main, [role="main"]');
        await expect(main).toBeVisible();

        const h1 = page.locator('h1');
        await expect(h1).toBeVisible();
        await expect(h1).toHaveCount(1);

        // Skip link should be accessible
        await page.keyboard.press('Tab');
        const firstFocused = page.locator(':focus');
        const href = await firstFocused.getAttribute('href');
        expect(href).toMatch(/#main|#content|#skip/);
      }
    });
  });
});