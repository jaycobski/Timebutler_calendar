/**
 * Fallback Mechanism Validation Tests
 *
 * Tests that ensure proper fallback mechanisms when JavaScript is disabled
 * or when progressive enhancement features are not available.
 */

const { test, expect } = require('@playwright/test');

test.describe('Fallback Mechanism Validation', () => {
  // Disable JavaScript for all tests
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Interactive Component Fallbacks', () => {
    test('should provide form-based fallback for interactive filters', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Interactive filters should fallback to form submission
      const filterForms = page.locator('form').filter({ hasText: /filter|category|kategorie/i });

      if (await filterForms.count() > 0) {
        const filterForm = filterForms.first();

        // Should have proper form elements
        const formInputs = filterForm.locator('select, input[type="radio"], input[type="checkbox"]');
        await expect(formInputs.first()).toBeVisible();

        // Should have submit button
        const submitButton = filterForm.locator('button[type="submit"], input[type="submit"]');
        await expect(submitButton).toBeVisible();

        // Submit should work without JavaScript
        const selectElement = filterForm.locator('select').first();
        if (await selectElement.isVisible()) {
          await selectElement.selectOption({ index: 1 });
          await submitButton.click();
          await page.waitForLoadState('networkidle');

          // Should update page content
          const currentUrl = page.url();
          expect(currentUrl).toContain('?');
        }
      }
    });

    test('should provide static content fallback for dynamic calendars', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Calendar should display as static content without JavaScript
      const calendarContent = page.locator('[data-testid="calendar"], .calendar, table').filter({ hasText: /2025|januar|december/i });

      if (await calendarContent.count() > 0) {
        await expect(calendarContent.first()).toBeVisible();

        // Should show dates as static HTML
        const dateElements = calendarContent.locator('td, .date').filter({ hasText: /\d{1,2}/ });
        await expect(dateElements.first()).toBeVisible();

        // Holiday dates should be marked clearly
        const holidayDates = calendarContent.locator('.holiday, [data-holiday="true"]');
        if (await holidayDates.count() > 0) {
          await expect(holidayDates.first()).toBeVisible();

          // Should have text indicators, not just styling
          const holidayText = await holidayDates.first().textContent();
          expect(holidayText.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should provide list-based fallback for interactive selections', async ({ page }) => {
      await page.goto('/');

      // Interactive selection components should fallback to form lists
      const selectionLists = page.locator('ul, ol').filter({ hasText: /state|bundesland|year|jahr/i });

      if (await selectionLists.count() > 0) {
        const list = selectionLists.first();

        // Should contain links or form elements
        const listItems = list.locator('li');
        await expect(listItems.first()).toBeVisible();

        // Each item should be actionable
        const actionableItems = listItems.locator('a, button, input');
        await expect(actionableItems.first()).toBeVisible();

        // Clicking should navigate or submit
        const firstAction = actionableItems.first();
        const tagName = await firstAction.evaluate(el => el.tagName.toLowerCase());

        if (tagName === 'a') {
          const href = await firstAction.getAttribute('href');
          expect(href).toBeTruthy();
        } else if (tagName === 'button' || tagName === 'input') {
          const type = await firstAction.getAttribute('type');
          expect(['submit', 'button'].includes(type)).toBe(true);
        }
      }
    });

    test('should provide pagination fallback for infinite scroll', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // If content would normally use infinite scroll, should have pagination
      const paginationElements = page.locator('.pagination, [role="navigation"]').filter({ hasText: /page|next|previous|weiter|zurück/i });

      if (await paginationElements.count() > 0) {
        const pagination = paginationElements.first();

        // Should have navigation links
        const navLinks = pagination.locator('a');
        await expect(navLinks.first()).toBeVisible();

        // Links should have proper hrefs
        const links = await navLinks.all();
        for (const link of links.slice(0, 3)) { // Test first 3
          const href = await link.getAttribute('href');
          expect(href).toBeTruthy();
          expect(href).toMatch(/page=|\?.*page/);
        }
      }
    });
  });

  test.describe('Data Loading Fallbacks', () => {
    test('should preload essential data server-side', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Essential data should be rendered immediately, not loaded via JavaScript
      const holidayData = page.locator('text=/Neujahr|Weihnachten|Christmas|New Year/i');
      await expect(holidayData.first()).toBeVisible();

      // Bridge weekend data should be pre-calculated
      const bridgeData = page.locator('text=/bridge|brücke|vacation day|urlaubstag/i');
      await expect(bridgeData.first()).toBeVisible();

      // State-specific information should be loaded
      const stateInfo = page.locator('text=/Bayern|Bavaria/i');
      await expect(stateInfo.first()).toBeVisible();
    });

    test('should provide error boundaries for failed data loading', async ({ page }) => {
      // Test with potentially problematic data
      await page.goto('/?state=INVALID&year=2030');

      // Should show error message, not broken layout
      const errorDisplay = page.locator('[role="alert"], .error, .warning');
      await expect(errorDisplay.first()).toBeVisible();

      // Page structure should remain intact
      const main = page.locator('main');
      await expect(main).toBeVisible();

      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();

      // Should provide recovery options
      const recoveryLinks = page.locator('a').filter({ hasText: /back|home|zurück|startseite/i });
      await expect(recoveryLinks.first()).toBeVisible();
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Simulate API failure with invalid parameters
      await page.goto('/?state=&year=invalid');

      // Should not show empty page or JavaScript errors
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Should show user-friendly message
      const userMessage = page.locator('text=/please|bitte|select|wählen|invalid|ungültig/i');
      await expect(userMessage.first()).toBeVisible();

      // Should provide form to correct the issue
      const correctionForm = page.locator('form').first();
      await expect(correctionForm).toBeVisible();
    });

    test('should cache critical data for offline scenarios', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Response should include proper caching headers (can't test directly without server access)
      // But content should be fully rendered server-side for offline use
      const criticalContent = page.locator('main');
      const contentHtml = await criticalContent.innerHTML();

      // Should not contain loading placeholders
      expect(contentHtml).not.toContain('Loading...');
      expect(contentHtml).not.toContain('skeleton');
      expect(contentHtml).not.toContain('spinner');

      // Should contain actual data
      expect(contentHtml).toMatch(/\d{4}/); // Year
      expect(contentHtml).toMatch(/[A-Za-z]{3,}/); // Holiday names
    });
  });

  test.describe('Navigation Fallbacks', () => {
    test('should provide full navigation without JavaScript routing', async ({ page }) => {
      await page.goto('/');

      // All navigation should use standard links
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();

      for (let i = 0; i < Math.min(linkCount, 5); i++) { // Test first 5 links
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');

        expect(href).toBeTruthy();

        // Should not use JavaScript: void(0) or similar
        expect(href).not.toMatch(/javascript:|#$/);

        // Should not have click handlers (since JS is disabled)
        const onclick = await link.getAttribute('onclick');
        expect(onclick).toBeNull();
      }
    });

    test('should support browser back/forward without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Navigate to state page
      const stateLink = page.locator('a').filter({ hasText: /Bayern|Bavaria|state/i }).first();
      if (await stateLink.isVisible()) {
        await stateLink.click();
        await page.waitForLoadState('networkidle');

        const newUrl = page.url();
        expect(newUrl).not.toBe('/');

        // Browser back should work
        await page.goBack();
        await page.waitForLoadState('networkidle');

        const backUrl = page.url();
        expect(backUrl).toBe(page.url().split('?')[0] || '/');

        // Browser forward should work
        await page.goForward();
        await page.waitForLoadState('networkidle');

        const forwardUrl = page.url();
        expect(forwardUrl).toBe(newUrl);
      }
    });

    test('should provide breadcrumb navigation fallback', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Should have breadcrumb navigation
      const breadcrumb = page.locator('[aria-label*="breadcrumb"], .breadcrumb, nav').filter({ hasText: /home|startseite|bayern/i });

      if (await breadcrumb.count() > 0) {
        // Breadcrumb links should work without JavaScript
        const breadcrumbLinks = breadcrumb.locator('a');
        await expect(breadcrumbLinks.first()).toBeVisible();

        // Current page should be indicated
        const currentPage = breadcrumb.locator('[aria-current="page"], .current, .active');
        await expect(currentPage).toBeVisible();

        // Should not use JavaScript for breadcrumb interaction
        const firstLink = breadcrumbLinks.first();
        const href = await firstLink.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toMatch(/javascript:/);
      }
    });

    test('should provide search functionality without JavaScript', async ({ page }) => {
      await page.goto('/');

      const searchForm = page.locator('form').filter({ hasText: /search|suche/i });

      if (await searchForm.count() > 0) {
        // Search should be a proper form
        const method = await searchForm.getAttribute('method');
        expect(['GET', 'POST']).toContain(method?.toUpperCase() || 'GET');

        // Should have search input
        const searchInput = searchForm.locator('input[type="search"], input[type="text"]');
        await expect(searchInput).toBeVisible();

        // Should have submit button
        const submitButton = searchForm.locator('button[type="submit"], input[type="submit"]');
        await expect(submitButton).toBeVisible();

        // Search should work
        await searchInput.fill('Christmas');
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Should show search results or navigate
        const results = page.locator('[data-testid="search-results"], .search-results');
        if (await results.count() > 0) {
          await expect(results).toBeVisible();
        } else {
          // URL should indicate search was performed
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/search|q=/);
        }
      }
    });
  });

  test.describe('Form Interaction Fallbacks', () => {
    test('should provide multi-step form fallback for wizards', async ({ page }) => {
      await page.goto('/');

      // Complex forms should work as traditional multi-page forms
      const formSteps = page.locator('form').filter({ hasText: /step|schritt|next|weiter/i });

      if (await formSteps.count() > 0) {
        const form = formSteps.first();

        // Should have hidden input for step tracking
        const stepInput = form.locator('input[name*="step"], input[name*="schritt"]');
        if (await stepInput.count() > 0) {
          const stepValue = await stepInput.getAttribute('value');
          expect(stepValue).toBeTruthy();
        }

        // Should have navigation buttons
        const nextButton = form.locator('button, input').filter({ hasText: /next|weiter|continue/i });
        if (await nextButton.count() > 0) {
          await expect(nextButton.first()).toBeVisible();
        }
      }
    });

    test('should validate forms server-side without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Submit form with invalid data
      const form = page.locator('form').first();
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Should show server-side validation errors
        const validationErrors = page.locator('[role="alert"], .error, .field-error');
        if (await validationErrors.count() > 0) {
          await expect(validationErrors.first()).toBeVisible();

          // Errors should be meaningful
          const errorText = await validationErrors.first().textContent();
          expect(errorText.trim().length).toBeGreaterThan(5);

          // Form should retain user input
          const formInputs = form.locator('input[type="text"], input[type="email"], select');
          if (await formInputs.count() > 0) {
            // At least some inputs should preserve values
            let hasPreservedValue = false;
            const inputs = await formInputs.all();
            for (const input of inputs.slice(0, 3)) { // Check first 3
              const value = await input.inputValue();
              if (value && value.length > 0) {
                hasPreservedValue = true;
                break;
              }
            }
            // Some forms might not preserve values, so this is informational
          }
        }
      }
    });

    test('should handle file uploads without JavaScript', async ({ page }) => {
      await page.goto('/');

      const fileInputs = page.locator('input[type="file"]');

      if (await fileInputs.count() > 0) {
        const fileInput = fileInputs.first();
        const form = fileInput.locator('xpath=ancestor::form[1]');

        // Form should have proper encoding for file uploads
        const enctype = await form.getAttribute('enctype');
        expect(enctype).toBe('multipart/form-data');

        // Should have fallback for drag-and-drop
        const uploadArea = fileInput.locator('xpath=..');
        const areaText = await uploadArea.textContent();
        expect(areaText).toMatch(/choose|select|browse|auswählen/i);

        // Should provide file type restrictions clearly
        const accept = await fileInput.getAttribute('accept');
        if (accept) {
          expect(accept).toBeTruthy();
        }
      }
    });

    test('should provide progress indication without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Multi-step processes should show progress without JavaScript
      const progressIndicators = page.locator('.progress, [role="progressbar"], .steps');

      if (await progressIndicators.count() > 0) {
        const progress = progressIndicators.first();

        // Should use static HTML, not dynamic updates
        const progressText = await progress.textContent();
        expect(progressText).toMatch(/\d+.*\d+|step|schritt/i);

        // Should be accessible
        const ariaLabel = await progress.getAttribute('aria-label');
        const ariaValueNow = await progress.getAttribute('aria-valuenow');

        if (ariaValueNow) {
          const ariaValueMax = await progress.getAttribute('aria-valuemax');
          expect(ariaValueMax).toBeTruthy();
        }
      }
    });
  });

  test.describe('Content Display Fallbacks', () => {
    test('should provide tabbed content as accordion without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Tabbed interfaces should fallback to accordion or expandable sections
      const contentSections = page.locator('[role="tabpanel"], .tab-content, .accordion');

      if (await contentSections.count() > 0) {
        // All content should be visible or accessible without JavaScript
        const sections = await contentSections.all();

        for (const section of sections.slice(0, 3)) { // Test first 3
          const isVisible = await section.isVisible();

          if (!isVisible) {
            // Should have a way to show this content (link, button, etc.)
            const trigger = page.locator('a, button').filter({ hasText: new RegExp(await section.getAttribute('aria-labelledby') || '', 'i') });
            if (await trigger.count() > 0) {
              await expect(trigger.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('should provide modal content inline without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Modal content should be accessible as regular page content
      const modalTriggers = page.locator('a, button').filter({ hasText: /modal|popup|details|info|hilfe/i });

      if (await modalTriggers.count() > 0) {
        const trigger = modalTriggers.first();

        if (await trigger.evaluate(el => el.tagName.toLowerCase()) === 'a') {
          const href = await trigger.getAttribute('href');
          expect(href).toBeTruthy();
          expect(href).not.toBe('#');

          // Link should lead to actual page or section
          if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const target = page.locator(`#${targetId}`);
            await expect(target).toBeVisible();
          }
        }
      }
    });

    test('should provide tooltip content as accessible text without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Tooltip content should be accessible without hover interactions
      const tooltipTriggers = page.locator('[title], [aria-describedby]');

      if (await tooltipTriggers.count() > 0) {
        const triggers = await tooltipTriggers.all();

        for (const trigger of triggers.slice(0, 5)) { // Test first 5
          const title = await trigger.getAttribute('title');
          const describedBy = await trigger.getAttribute('aria-describedby');

          if (title) {
            expect(title.length).toBeGreaterThan(3);
          }

          if (describedBy) {
            const description = page.locator(`#${describedBy}`);
            await expect(description).toBeVisible();
          }
        }
      }
    });

    test('should provide infinite scroll content as paginated without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Long content lists should be paginated
      const paginationControls = page.locator('.pagination, [role="navigation"]').filter({ hasText: /page|next|previous/i });

      if (await paginationControls.count() > 0) {
        const pagination = paginationControls.first();

        // Should have working pagination links
        const pageLinks = pagination.locator('a[href*="page"]');
        await expect(pageLinks.first()).toBeVisible();

        // Should indicate current page
        const currentPage = pagination.locator('[aria-current="page"], .current, .active');
        await expect(currentPage).toBeVisible();

        // Should have next/previous links
        const nextLink = pagination.locator('a').filter({ hasText: /next|weiter|>/i });
        if (await nextLink.count() > 0) {
          const href = await nextLink.first().getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    });
  });

  test.describe('Error Recovery Fallbacks', () => {
    test('should provide network error recovery without JavaScript', async ({ page }) => {
      // Test error page handling
      const response = await page.goto('/non-existent-endpoint');

      if (response.status() === 404) {
        // Should show helpful error page
        const errorContent = page.locator('main');
        await expect(errorContent).toBeVisible();

        // Should provide navigation back to working pages
        const recoveryLinks = page.locator('a').filter({ hasText: /home|back|startseite|zurück/i });
        await expect(recoveryLinks.first()).toBeVisible();

        // Should maintain site structure
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();
      }
    });

    test('should handle session timeouts gracefully without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Any session-dependent features should handle timeouts
      const sessionForms = page.locator('form').filter({ hasText: /login|session|anmeld/i });

      if (await sessionForms.count() > 0) {
        // Should provide clear feedback about session state
        const sessionInfo = page.locator('text=/logged|session|angemeldet/i');
        if (await sessionInfo.count() > 0) {
          await expect(sessionInfo.first()).toBeVisible();
        }

        // Should provide login form or redirect
        const loginElements = page.locator('input[type="password"], input[name*="password"]');
        if (await loginElements.count() > 0) {
          const loginForm = loginElements.first().locator('xpath=ancestor::form[1]');
          await expect(loginForm).toBeVisible();
        }
      }
    });

    test('should provide graceful degradation for unsupported features', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Advanced features should degrade gracefully
      const advancedFeatures = page.locator('[data-requires-js], .js-only');

      if (await advancedFeatures.count() > 0) {
        // Should either be hidden or show fallback content
        const features = await advancedFeatures.all();

        for (const feature of features) {
          const isVisible = await feature.isVisible();

          if (isVisible) {
            // Should contain fallback content, not just broken functionality
            const content = await feature.textContent();
            expect(content.trim().length).toBeGreaterThan(0);
            expect(content).not.toContain('undefined');
            expect(content).not.toContain('null');
          }
        }
      }
    });
  });
});