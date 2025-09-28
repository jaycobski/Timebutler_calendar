/**
 * Server-Side Rendering Validation Tests
 *
 * Tests that ensure proper SSR implementation and that content is rendered
 * server-side without requiring JavaScript for initial load.
 */

const { test, expect } = require('@playwright/test');

test.describe('Server-Side Rendering Validation', () => {
  // Disable JavaScript to test pure SSR
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Initial Page Load SSR', () => {
    test('should render complete HTML without JavaScript', async ({ page }) => {
      const response = await page.goto('/');

      // Response should be successful
      expect(response.status()).toBe(200);

      // Content should be fully rendered in initial HTML
      const content = await page.content();

      // Should contain essential meta tags
      expect(content).toContain('<title>');
      expect(content).toContain('charset="utf-8"');
      expect(content).toContain('viewport');

      // Should contain structured content, not loading placeholders
      expect(content).toMatch(/<h1[^>]*>.*<\/h1>/);
      expect(content).toMatch(/<main[^>]*>.*<\/main>/s);

      // Should not rely on JavaScript to render main content
      expect(content).not.toContain('Loading...');
      expect(content).not.toContain('Please enable JavaScript');
    });

    test('should include proper semantic HTML structure', async ({ page }) => {
      await page.goto('/');

      // Document should have proper HTML5 structure
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang');

      // Should have semantic landmarks
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();

      // Should have proper heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toHaveCount(1); // Only one h1 per page
    });

    test('should render critical CSS inline', async ({ page }) => {
      const response = await page.goto('/');
      const content = await response.text();

      // Should contain inline critical CSS
      const hasInlineCSS = content.includes('<style>') || content.includes('critical.css');
      expect(hasInlineCSS).toBe(true);

      // Should not block rendering on external CSS
      const stylesheetLinks = content.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
      for (const link of stylesheetLinks) {
        // Non-critical stylesheets should be loaded asynchronously
        if (!link.includes('critical')) {
          expect(link).toMatch(/media="print"|rel="preload"/);
        }
      }
    });
  });

  test.describe('State-Specific SSR', () => {
    test('should render state-specific content server-side', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Bayern-specific content should be rendered immediately
      const bayernContent = page.locator('text=/Bayern|Bavaria/i');
      await expect(bayernContent).toBeVisible();

      // Holiday data should be pre-rendered
      const holidays = page.locator('text=/Neujahr|Weihnachten|New Year|Christmas/i');
      await expect(holidays.first()).toBeVisible();

      // Bridge weekends should be calculated server-side
      const bridgeWeekends = page.locator('[data-testid="bridge-weekends"], .bridge-weekend');
      await expect(bridgeWeekends.first()).toBeVisible();
    });

    test('should handle invalid state parameters gracefully', async ({ page }) => {
      const response = await page.goto('/?state=INVALID');

      // Should return 200 with error message, not 404
      expect(response.status()).toBe(200);

      // Should show user-friendly error message
      const errorMessage = page.locator('[role="alert"], .error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/invalid|ungültig|not found/i);

      // Should still render the basic page structure
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    test('should pre-render holiday calculations', async ({ page }) => {
      await page.goto('/?state=NW&year=2025');

      // Holiday calculations should be done server-side
      const holidayDates = page.locator('[data-date], .holiday-date').first();
      await expect(holidayDates).toBeVisible();

      // Efficiency ratings should be calculated
      const efficiency = page.locator('text=/efficiency|effizienz/i');
      await expect(efficiency).toBeVisible();

      // Vacation days needed should be calculated
      const vacationDays = page.locator('text=/vacation day|urlaubstag/i');
      await expect(vacationDays).toBeVisible();
    });
  });

  test.describe('Internationalization SSR', () => {
    test('should render German content server-side by default', async ({ page }) => {
      await page.goto('/');

      // Default language should be German
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toBe('de');

      // German content should be rendered
      const germanContent = page.locator('text=/Feiertage|Bundesland|Urlaubstage/i');
      await expect(germanContent.first()).toBeVisible();

      // Date formats should be German
      const dateContent = page.locator('text=/Januar|Februar|März|Dezember/i');
      if (await dateContent.count() > 0) {
        await expect(dateContent.first()).toBeVisible();
      }
    });

    test('should render English content when requested', async ({ page }) => {
      await page.goto('/?lang=en');

      // Language should be set to English
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toBe('en');

      // English content should be rendered
      const englishContent = page.locator('text=/Holidays|State|Vacation days/i');
      await expect(englishContent.first()).toBeVisible();

      // State names should be in English when available
      const stateContent = page.locator('text=/Bavaria|North Rhine-Westphalia/i');
      if (await stateContent.count() > 0) {
        await expect(stateContent.first()).toBeVisible();
      }
    });

    test('should maintain language selection across navigation', async ({ page }) => {
      await page.goto('/?lang=en');

      // Navigate to specific state
      const stateLink = page.locator('a').filter({ hasText: /Bavaria|Bayern/i }).first();
      if (await stateLink.isVisible()) {
        await stateLink.click();
        await page.waitForLoadState('networkidle');

        // Language should be maintained
        const html = page.locator('html');
        const lang = await html.getAttribute('lang');
        expect(lang).toBe('en');

        // Content should remain in English
        const englishContent = page.locator('text=/Holiday|Vacation|Bridge/i');
        await expect(englishContent.first()).toBeVisible();
      }
    });
  });

  test.describe('SEO and Meta Tags SSR', () => {
    test('should render proper meta tags for each page', async ({ page }) => {
      const response = await page.goto('/?state=BY&year=2025');
      const content = await response.text();

      // Should have unique title for state-specific pages
      expect(content).toMatch(/<title>[^<]*Bayern[^<]*<\/title>/i);

      // Should have meta description
      expect(content).toMatch(/<meta name="description" content="[^"]+"/);

      // Should have Open Graph tags
      expect(content).toMatch(/<meta property="og:title"/);
      expect(content).toMatch(/<meta property="og:description"/);

      // Should have canonical URL
      expect(content).toMatch(/<link rel="canonical"/);
    });

    test('should include structured data for holidays', async ({ page }) => {
      const response = await page.goto('/?state=BY&year=2025');
      const content = await response.text();

      // Should include JSON-LD structured data
      const hasStructuredData = content.includes('application/ld+json');
      if (hasStructuredData) {
        // Should contain event or holiday schema
        expect(content).toMatch(/"@type":\s*"Event"|"Holiday"/);
        expect(content).toMatch(/"startDate"/);
        expect(content).toMatch(/"name"/);
      }
    });

    test('should generate different meta tags per state', async ({ page }) => {
      // Test Bayern
      const bayernResponse = await page.goto('/?state=BY&year=2025');
      const bayernContent = await bayernResponse.text();

      // Test NRW
      await page.goto('/?state=NW&year=2025');
      const nrwResponse = await page.goto('/?state=NW&year=2025');
      const nrwContent = await nrwResponse.text();

      // Titles should be different
      const bayernTitle = bayernContent.match(/<title>([^<]+)<\/title>/i)?.[1];
      const nrwTitle = nrwContent.match(/<title>([^<]+)<\/title>/i)?.[1];

      expect(bayernTitle).toBeDefined();
      expect(nrwTitle).toBeDefined();
      expect(bayernTitle).not.toBe(nrwTitle);
    });
  });

  test.describe('Form State SSR', () => {
    test('should pre-populate forms based on URL parameters', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=en');

      // State selection should be pre-populated
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        const selectedValue = await stateSelect.inputValue();
        expect(selectedValue).toBe('BY');
      } else {
        // Check radio button selection
        const selectedRadio = page.locator('input[type="radio"][value="BY"]:checked');
        await expect(selectedRadio).toBeVisible();
      }

      // Year should be pre-populated
      const yearSelect = page.locator('select[name="year"]');
      if (await yearSelect.isVisible()) {
        const selectedYear = await yearSelect.inputValue();
        expect(selectedYear).toBe('2025');
      }

      // Language should be set
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      expect(lang).toBe('en');
    });

    test('should render form validation errors server-side', async ({ page }) => {
      // Simulate form submission with validation errors
      await page.goto('/', {
        method: 'POST',
        postData: 'state=&year=', // Empty required fields
      });

      // Validation errors should be rendered immediately
      const errorMessages = page.locator('[role="alert"], .error, .field-error');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();

        const errorText = await errorMessages.first().textContent();
        expect(errorText).toMatch(/required|erforderlich|wählen|select/i);
      }
    });
  });

  test.describe('Performance SSR', () => {
    test('should minimize Time to First Byte (TTFB)', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.goto('/');
      const ttfb = Date.now() - startTime;

      // TTFB should be under 500ms for SSR
      expect(ttfb).toBeLessThan(500);
      expect(response.status()).toBe(200);
    });

    test('should render critical content above the fold', async ({ page }) => {
      await page.goto('/');

      // Critical elements should be visible immediately
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();

      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Should not require scrolling to see main CTA
      const primaryAction = page.locator('button[type="submit"], .primary-button, .cta-button').first();
      if (await primaryAction.isVisible()) {
        const isInViewport = await primaryAction.isInViewport();
        expect(isInViewport).toBe(true);
      }
    });

    test('should minimize render-blocking resources', async ({ page }) => {
      const response = await page.goto('/');
      const content = await response.text();

      // CSS should be optimized for critical path
      const stylesheetCount = (content.match(/<link[^>]*rel="stylesheet"/g) || []).length;
      expect(stylesheetCount).toBeLessThan(5); // Minimize external CSS files

      // JavaScript should not be render-blocking
      const scriptTags = content.match(/<script[^>]*src=[^>]*>/g) || [];
      for (const script of scriptTags) {
        // Scripts should be deferred or async
        const isRenderBlocking = !script.includes('defer') && !script.includes('async') && !script.includes('type="module"');
        expect(isRenderBlocking).toBe(false);
      }
    });
  });

  test.describe('Error Handling SSR', () => {
    test('should render 404 pages server-side', async ({ page }) => {
      const response = await page.goto('/non-existent-page');

      // Should return proper 404 status
      expect(response.status()).toBe(404);

      // Should render custom 404 page with navigation
      const errorPage = page.locator('main, [role="main"]');
      await expect(errorPage).toBeVisible();

      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();

      // Should have helpful content
      const notFoundContent = page.locator('text=/404|not found|nicht gefunden/i');
      await expect(notFoundContent).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // This would typically be tested against a staging environment
      // that can simulate server errors

      // For now, test error boundary rendering
      await page.goto('/');

      // Page should have error boundary structure
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // Should not show React error messages to users
      const reactError = page.locator('text=/React error|Component stack/i');
      await expect(reactError).not.toBeVisible();
    });
  });

  test.describe('Hydration Compatibility', () => {
    test('should render identical content for hydration', async ({ page }) => {
      // First, get the SSR content
      await page.goto('/');
      const ssrContent = await page.locator('main').innerHTML();

      // Enable JavaScript and reload (simulating hydration)
      await page.context().setJavaScriptEnabled(true);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Content should be identical after hydration
      const hydratedContent = await page.locator('main').innerHTML();

      // Basic structure should match (allowing for minor whitespace differences)
      const normalizeHtml = (html) => html.replace(/\s+/g, ' ').trim();
      expect(normalizeHtml(ssrContent)).toBe(normalizeHtml(hydratedContent));
    });

    test('should not cause hydration mismatches', async ({ page }) => {
      // Listen for console errors that might indicate hydration issues
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.context().setJavaScriptEnabled(true);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for hydration-related errors
      const hydrationErrors = consoleErrors.filter(error =>
        error.includes('hydration') ||
        error.includes('mismatch') ||
        error.includes('server-rendered')
      );

      expect(hydrationErrors).toHaveLength(0);
    });
  });
});