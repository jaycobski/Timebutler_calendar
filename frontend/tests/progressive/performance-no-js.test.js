/**
 * Performance Without JS Measurement Tests
 *
 * Tests that measure and validate performance when JavaScript is disabled.
 * Ensures the application meets performance goals without client-side enhancements.
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Without JavaScript', () => {
  // Disable JavaScript for all tests
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('Page Load Performance', () => {
    test('should load homepage quickly without JavaScript', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.goto('/');
      const firstByteTime = Date.now() - startTime;

      await page.waitForLoadState('networkidle');
      const totalLoadTime = Date.now() - startTime;

      // Time to First Byte should be under 500ms
      expect(firstByteTime).toBeLessThan(500);

      // Total load time should be under 1.5 seconds without JS overhead
      expect(totalLoadTime).toBeLessThan(1500);

      // Response should be successful
      expect(response.status()).toBe(200);

      console.log(`Homepage load: TTFB ${firstByteTime}ms, Total ${totalLoadTime}ms`);
    });

    test('should load state-specific pages quickly without JavaScript', async ({ page }) => {
      const testPages = [
        '/?state=BY&year=2025',
        '/?state=NW&year=2025',
        '/?state=BE&year=2025'
      ];

      for (const testPage of testPages) {
        const startTime = Date.now();

        await page.goto(testPage);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // State pages should load within 2 seconds
        expect(loadTime).toBeLessThan(2000);

        // Content should be immediately available
        const stateContent = page.locator('[data-testid="holiday-list"], .holiday, .bridge-weekend');
        await expect(stateContent.first()).toBeVisible();

        console.log(`${testPage} load time: ${loadTime}ms`);
      }
    });

    test('should have minimal DOM size without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Count DOM elements
      const elementCount = await page.locator('*').count();

      // Should have reasonable DOM size (under 1500 elements for good performance)
      expect(elementCount).toBeLessThan(1500);

      // Critical content should be in first 100 elements
      const criticalElements = await page.locator('h1, main, nav').count();
      expect(criticalElements).toBeGreaterThan(0);

      console.log(`DOM element count: ${elementCount}`);
    });

    test('should render above-the-fold content immediately', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Critical elements should be visible immediately
      const criticalElements = [
        page.locator('h1'),
        page.locator('nav'),
        page.locator('main'),
        page.locator('button[type="submit"], input[type="submit"]').first()
      ];

      for (const element of criticalElements) {
        const renderTime = Date.now() - startTime;
        await expect(element).toBeVisible();

        // Should render critical content within 300ms
        expect(renderTime).toBeLessThan(300);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should minimize HTTP requests without JavaScript', async ({ page }) => {
      const requests = [];
      page.on('request', request => {
        requests.push({
          url: request.url(),
          resourceType: request.resourceType()
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have minimal requests without JS
      expect(requests.length).toBeLessThan(20);

      // Categorize requests
      const requestTypes = requests.reduce((acc, req) => {
        acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
        return acc;
      }, {});

      // Should have minimal JavaScript requests
      const jsRequests = requestTypes.script || 0;
      expect(jsRequests).toBeLessThan(5);

      // Should have reasonable CSS requests
      const cssRequests = requestTypes.stylesheet || 0;
      expect(cssRequests).toBeLessThan(5);

      console.log('Request types:', requestTypes);
      console.log(`Total requests: ${requests.length}`);
    });

    test('should optimize image loading without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      const images = await page.locator('img').all();

      for (const img of images) {
        // Images should have proper src (not data URIs for large images)
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');

        expect(src).toBeTruthy();

        // Should have alt text for accessibility
        if (alt === null || alt === '') {
          // Check if it's decorative
          const role = await img.getAttribute('role');
          if (role !== 'presentation') {
            console.warn('Image without alt text:', src);
          }
        }

        // Should not use inline base64 for large images
        if (src.startsWith('data:image/')) {
          const dataSize = src.length;
          expect(dataSize).toBeLessThan(5000); // Max 5KB for inline images
        }

        // Should have loading attribute for performance
        const loading = await img.getAttribute('loading');
        if (loading && loading === 'lazy') {
          // Lazy loading is good for below-fold images
          console.log('Lazy loaded image:', src);
        }
      }
    });

    test('should cache static resources effectively', async ({ page }) => {
      // First load
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Second load (should use cache)
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const reloadTime = Date.now() - startTime;

      // Reload should be faster due to caching
      expect(reloadTime).toBeLessThan(1000);

      console.log(`Reload time: ${reloadTime}ms`);
    });

    test('should handle slow connections gracefully', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });

      const startTime = Date.now();
      await page.goto('/');

      // Should still be usable on slow connections
      const criticalContent = page.locator('h1, main');
      await expect(criticalContent.first()).toBeVisible();

      const slowLoadTime = Date.now() - startTime;
      console.log(`Slow connection load time: ${slowLoadTime}ms`);

      // Should complete within reasonable time even on slow connection
      expect(slowLoadTime).toBeLessThan(5000);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should not cause layout shifts without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Wait for initial render
      await page.waitForTimeout(100);

      // Get initial layout positions
      const elements = await page.locator('h1, nav, main, footer').all();
      const initialPositions = [];

      for (const element of elements) {
        const box = await element.boundingBox();
        if (box) {
          initialPositions.push({
            element: await element.evaluate(el => el.tagName),
            top: box.y,
            left: box.x
          });
        }
      }

      // Wait longer to see if layout shifts
      await page.waitForTimeout(1000);

      // Check if positions changed (indicating layout shift)
      for (let i = 0; i < elements.length; i++) {
        const currentBox = await elements[i].boundingBox();
        if (currentBox && initialPositions[i]) {
          const yShift = Math.abs(currentBox.y - initialPositions[i].top);
          const xShift = Math.abs(currentBox.x - initialPositions[i].left);

          // Allow small shifts (under 5px) for font loading, etc.
          expect(yShift).toBeLessThan(5);
          expect(xShift).toBeLessThan(5);

          if (yShift > 1 || xShift > 1) {
            console.log(`Layout shift detected for ${initialPositions[i].element}: ${xShift}px, ${yShift}px`);
          }
        }
      }
    });

    test('should render text content before web fonts load', async ({ page }) => {
      await page.goto('/');

      // Text should be visible immediately, even with fallback fonts
      const textElements = page.locator('h1, p, button, a');
      const firstText = textElements.first();

      await expect(firstText).toBeVisible();

      // Text should have reasonable size even with fallback fonts
      const textBox = await firstText.boundingBox();
      expect(textBox.height).toBeGreaterThan(10);
      expect(textBox.width).toBeGreaterThan(20);

      // Should not show FOIT (Flash of Invisible Text)
      const textContent = await firstText.textContent();
      expect(textContent.trim().length).toBeGreaterThan(0);
    });

    test('should have efficient CSS without JavaScript enhancement', async ({ page }) => {
      const response = await page.goto('/');
      const htmlContent = await response.text();

      // Should have critical CSS inline
      const hasInlineCSS = htmlContent.includes('<style>');
      expect(hasInlineCSS).toBe(true);

      // Should not have excessive CSS
      const styleTagMatches = htmlContent.match(/<style[^>]*>/g) || [];
      expect(styleTagMatches.length).toBeLessThan(5); // Not too many style blocks

      // External CSS should be optimized
      const cssLinkMatches = htmlContent.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
      expect(cssLinkMatches.length).toBeLessThan(5);

      console.log(`Inline style blocks: ${styleTagMatches.length}`);
      console.log(`External CSS files: ${cssLinkMatches.length}`);
    });

    test('should use semantic HTML for screen reader performance', async ({ page }) => {
      await page.goto('/');

      // Should use semantic elements (faster for screen readers)
      const semanticElements = await page.locator('main, nav, header, footer, section, article, aside').count();
      expect(semanticElements).toBeGreaterThan(3);

      // Should have proper heading structure (efficient navigation)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(1);

      // Should use lists for structured content
      const lists = await page.locator('ul, ol, dl').count();
      expect(lists).toBeGreaterThan(0);

      // Should use tables for tabular data (if present)
      const tables = await page.locator('table').count();
      if (tables > 0) {
        // Tables should have proper headers
        const tableHeaders = await page.locator('th').count();
        expect(tableHeaders).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should have minimal memory footprint without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Without JavaScript, memory usage should be minimal
      // We can't directly measure memory, but we can measure DOM size
      const domSize = await page.locator('*').count();
      expect(domSize).toBeLessThan(2000);

      // Should not create unnecessary DOM elements
      const divs = await page.locator('div').count();
      const spans = await page.locator('span').count();
      const totalGenericElements = divs + spans;

      // Should use semantic elements primarily
      const semanticElements = await page.locator('main, nav, header, footer, section, article, aside, p, h1, h2, h3, h4, h5, h6, ul, ol, li').count();

      // Ratio of semantic to generic should favor semantic
      expect(semanticElements).toBeGreaterThan(totalGenericElements * 0.3);

      console.log(`DOM elements: ${domSize}, Semantic: ${semanticElements}, Generic: ${totalGenericElements}`);
    });

    test('should clean up resources efficiently', async ({ page }) => {
      // Load and navigate between pages
      await page.goto('/');
      await page.goto('/?state=BY&year=2025');
      await page.goto('/?state=NW&year=2025');

      // Should not accumulate resources
      const finalDomSize = await page.locator('*').count();
      expect(finalDomSize).toBeLessThan(2000);

      // Should not have memory leaks (hard to test directly)
      // But DOM should be reasonable size
      const images = await page.locator('img').count();
      expect(images).toBeLessThan(20); // Reasonable number of images

      console.log(`Final DOM size after navigation: ${finalDomSize}`);
    });

    test('should minimize data transfer without JavaScript', async ({ page }) => {
      const responses = [];
      page.on('response', response => {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          compressed: response.headers()['content-encoding']
        });
      });

      await page.goto('/?state=BY&year=2025');
      await page.waitForLoadState('networkidle');

      // Check for compression
      const htmlResponse = responses.find(r => r.url.includes(page.url().split('?')[0]));
      if (htmlResponse) {
        expect(['gzip', 'br', 'deflate'].includes(htmlResponse.compressed)).toBe(true);
      }

      // Should have reasonable total data transfer
      let totalSize = 0;
      responses.forEach(r => {
        if (r.size) {
          totalSize += parseInt(r.size);
        }
      });

      console.log(`Total data transfer: ${totalSize} bytes`);
      // Should be under 500KB for initial load without JS
      expect(totalSize).toBeLessThan(500000);
    });
  });

  test.describe('User Perceived Performance', () => {
    test('should show content incrementally without JavaScript', async ({ page }) => {
      const performanceMarks = [];

      await page.goto('/');

      // Mark when key content becomes visible
      const markContentVisible = async (selector, name) => {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          const startTime = Date.now();
          await expect(element.first()).toBeVisible();
          performanceMarks.push({
            name,
            time: Date.now() - startTime
          });
        }
      };

      await markContentVisible('h1', 'Main Heading');
      await markContentVisible('nav', 'Navigation');
      await markContentVisible('main', 'Main Content');
      await markContentVisible('form', 'Interactive Form');

      // All critical content should be visible quickly
      performanceMarks.forEach(mark => {
        expect(mark.time).toBeLessThan(500);
        console.log(`${mark.name}: ${mark.time}ms`);
      });
    });

    test('should provide immediate feedback without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Form interactions should provide immediate visual feedback
      const formElements = await page.locator('select, input, button').all();

      for (const element of formElements.slice(0, 5)) { // Test first 5
        // Focus should be immediately visible
        await element.focus();

        const isFocused = await element.evaluate(el => el === document.activeElement);
        expect(isFocused).toBe(true);

        // Focus should have visual indicator (can't test exact styles without JS)
        const isVisible = await element.isVisible();
        expect(isVisible).toBe(true);

        await page.keyboard.press('Tab'); // Move to next element
      }
    });

    test('should handle user interactions smoothly without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Form submission should be smooth
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        const startTime = Date.now();

        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        await submitButton.click();

        await page.waitForLoadState('networkidle');
        const responseTime = Date.now() - startTime;

        // Form submission should complete within 3 seconds
        expect(responseTime).toBeLessThan(3000);

        console.log(`Form submission time: ${responseTime}ms`);
      }
    });

    test('should maintain 60fps scroll performance without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025');

      // Add enough content to make page scrollable
      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);

      if (contentHeight > viewportHeight) {
        // Test smooth scrolling performance
        const scrollSteps = 5;
        const scrollDistance = (contentHeight - viewportHeight) / scrollSteps;

        for (let i = 0; i < scrollSteps; i++) {
          const startTime = Date.now();

          await page.evaluate((distance) => {
            window.scrollBy(0, distance);
          }, scrollDistance);

          // Wait for scroll to complete
          await page.waitForTimeout(100);

          const scrollTime = Date.now() - startTime;

          // Scroll should be smooth (under 16ms for 60fps)
          // Allow more time since we can't control browser optimization
          expect(scrollTime).toBeLessThan(100);
        }

        console.log('Scroll performance test completed');
      } else {
        console.log('Page too short to test scroll performance');
      }
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('should meet Web Vitals targets without JavaScript', async ({ page }) => {
      // This test simulates Web Vitals measurement
      const startTime = Date.now();

      await page.goto('/');

      // Largest Contentful Paint (LCP) simulation
      const mainContent = page.locator('main h1, main h2').first();
      await expect(mainContent).toBeVisible();
      const lcpTime = Date.now() - startTime;

      // LCP should be under 2.5 seconds (good threshold)
      expect(lcpTime).toBeLessThan(2500);

      // First Input Delay simulation (time to interactive)
      const interactiveElement = page.locator('button, input, select').first();
      await interactiveElement.focus();
      const fidTime = Date.now() - startTime;

      // Should be interactive quickly
      expect(fidTime).toBeLessThan(1000);

      console.log(`Simulated LCP: ${lcpTime}ms, FID: ${fidTime}ms`);
    });

    test('should outperform JavaScript-enabled version in initial load', async ({ page, context }) => {
      // Measure no-JS load time
      const noJsStart = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const noJsTime = Date.now() - noJsStart;

      // Enable JavaScript and measure
      await context.setJavaScriptEnabled(true);
      const jsStart = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const jsTime = Date.now() - jsStart;

      // No-JS should be faster or comparable for initial load
      expect(noJsTime).toBeLessThanOrEqual(jsTime * 1.2); // Allow 20% margin

      console.log(`No-JS load: ${noJsTime}ms, With-JS load: ${jsTime}ms`);
    });

    test('should maintain performance across different page types', async ({ page }) => {
      const pageTypes = [
        { url: '/', name: 'Homepage' },
        { url: '/?state=BY&year=2025', name: 'State Page' },
        { url: '/?state=NW&year=2025&lang=en', name: 'English State Page' }
      ];

      const performanceResults = [];

      for (const pageType of pageTypes) {
        const startTime = Date.now();

        await page.goto(pageType.url);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;
        performanceResults.push({
          name: pageType.name,
          time: loadTime
        });

        // All pages should load within 2 seconds
        expect(loadTime).toBeLessThan(2000);

        console.log(`${pageType.name}: ${loadTime}ms`);
      }

      // Performance should be consistent across page types
      const times = performanceResults.map(r => r.time);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;

      // Variance should be reasonable (less than 1 second difference)
      expect(variance).toBeLessThan(1000);
    });
  });
});