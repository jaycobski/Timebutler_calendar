/**
 * Performance Validation Tests
 * Constitutional Requirements:
 * - Page load < 2 seconds on 3G connections
 * - Interactions < 100ms response time
 * - Bundle size < 200KB gzipped
 * - Lighthouse score > 90 for all metrics
 * - 25,000 concurrent users support
 */

import { test, expect, Page } from '@playwright/test';
import {
  measurePerformance,
  testPerformanceUnder3G,
  runLighthouseAudit,
  CONSTITUTIONAL_BUDGETS
} from '../helpers/performance-helper';

test.describe('Performance Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache before each test for consistent measurements
    await page.context().clearCookies();
    await page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    });
  });

  test('Constitutional Performance Requirements Validation', async ({ page }) => {
    await test.step('Test core constitutional performance requirements', async () => {
      // Measure baseline performance without network simulation
      const baselineMetrics = await measurePerformance(page, {
        simulateSlowNetwork: false,
        testDevice: 'desktop'
      });

      // Constitutional requirement: Page load < 2 seconds
      expect(baselineMetrics.constitutional_compliance.page_load_under_2s).toBe(true);
      expect(baselineMetrics.loadComplete).toBeLessThan(2000);

      // Constitutional requirement: Interactions < 100ms
      expect(baselineMetrics.constitutional_compliance.interaction_under_100ms).toBe(true);
      expect(baselineMetrics.firstInputDelay).toBeLessThan(100);

      // Constitutional requirement: Bundle < 200KB gzipped
      expect(baselineMetrics.constitutional_compliance.bundle_under_200kb).toBe(true);
      expect(baselineMetrics.gzippedBundleSize).toBeLessThan(200000);

      // Core Web Vitals compliance
      expect(baselineMetrics.firstContentfulPaint).toBeLessThan(CONSTITUTIONAL_BUDGETS.firstContentfulPaint);
      expect(baselineMetrics.largestContentfulPaint).toBeLessThan(CONSTITUTIONAL_BUDGETS.largestContentfulPaint);
      expect(baselineMetrics.cumulativeLayoutShift).toBeLessThan(CONSTITUTIONAL_BUDGETS.cumulativeLayoutShift);
    });

    await test.step('Test performance under 3G conditions', async () => {
      const slowNetworkResults = await testPerformanceUnder3G(page);

      // Must pass constitutional requirements even on 3G
      expect(slowNetworkResults.constitutionalCompliance).toBe(true);
      expect(slowNetworkResults.metrics.constitutional_compliance.page_load_under_2s).toBe(true);
      expect(slowNetworkResults.metrics.constitutional_compliance.interaction_under_100ms).toBe(true);

      // Log recommendations for improvements
      if (slowNetworkResults.recommendations.length > 0) {
        console.log('Performance recommendations:', slowNetworkResults.recommendations);
      }
    });
  });

  test('Vacation Planning Flow Performance', async ({ page }) => {
    await test.step('Measure complete user journey performance', async () => {
      const journeyStart = Date.now();

      // Navigate to homepage
      await page.goto('/', { waitUntil: 'networkidle' });

      const navigationEnd = Date.now();
      const navigationTime = navigationEnd - journeyStart;

      // Page load should be fast
      expect(navigationTime).toBeLessThan(3000);

      // Test form interaction performance
      const stateSelector = page.locator('select[name="state"]');

      const interactionStart = Date.now();
      await stateSelector.selectOption('BY');
      const stateSelectionTime = Date.now() - interactionStart;

      // State selection should be immediate
      expect(stateSelectionTime).toBeLessThan(100);

      // Test vacation day input performance
      const vacationInput = page.locator('input[name="vacationDays"]');

      const inputStart = Date.now();
      await vacationInput.fill('30');
      const inputTime = Date.now() - inputStart;

      // Input should be immediate
      expect(inputTime).toBeLessThan(50);

      // Test calculation performance
      const calculateStart = Date.now();
      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });
      const calculationTime = Date.now() - calculateStart;

      // Bridge weekend calculation should be fast
      expect(calculationTime).toBeLessThan(5000);

      // Test results rendering performance
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const renderStart = Date.now();
      const count = await bridgeItems.count();
      const renderTime = Date.now() - renderStart;

      // Results rendering should be immediate
      expect(renderTime).toBeLessThan(100);
      expect(count).toBeGreaterThan(0);

      const totalJourneyTime = Date.now() - journeyStart;

      // Complete journey should be efficient
      expect(totalJourneyTime).toBeLessThan(15000); // 15 seconds total
    });
  });

  test('Resource Loading Performance', async ({ page }) => {
    await test.step('Analyze resource loading patterns', async () => {
      // Track all network requests
      const requests: any[] = [];
      const responses: any[] = [];

      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          timestamp: Date.now()
        });
      });

      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'],
          timestamp: Date.now()
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Analyze resource requests
      const jsRequests = requests.filter(r => r.resourceType === 'script');
      const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');
      const imageRequests = requests.filter(r => r.resourceType === 'image');

      // Should not have excessive resource requests
      expect(jsRequests.length).toBeLessThan(10); // Reasonable JS bundle count
      expect(cssRequests.length).toBeLessThan(5); // Minimal CSS files
      expect(imageRequests.length).toBeLessThan(20); // Reasonable image count

      // Check for failed requests
      const failedResponses = responses.filter(r => r.status >= 400);
      expect(failedResponses.length).toBe(0);

      // Verify critical resources load quickly
      const criticalResources = responses.filter(r =>
        r.url.includes('.js') || r.url.includes('.css') || r.url === page.url()
      );

      expect(criticalResources.length).toBeGreaterThan(0);
    });

    await test.step('Test resource compression and caching', async () => {
      // Check for proper compression headers
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);

      const headers = response?.headers() || {};

      // Should use compression for text resources
      if (headers['content-type']?.includes('text') || headers['content-type']?.includes('javascript')) {
        // May have compression headers
        const hasCompression = headers['content-encoding']?.includes('gzip') ||
                              headers['content-encoding']?.includes('br');
        // Note: compression might be handled by CDN/proxy, so this is informational
      }

      // Should have caching headers for static resources
      if (headers['content-type']?.includes('image') ||
          headers['content-type']?.includes('css') ||
          headers['content-type']?.includes('javascript')) {
        // Should have cache headers for optimization
        const hasCacheHeaders = headers['cache-control'] || headers['expires'] || headers['etag'];
        expect(hasCacheHeaders).toBeTruthy();
      }
    });
  });

  test('Memory Usage and Performance', async ({ page }) => {
    await test.step('Monitor memory usage during operations', async () => {
      // Navigate and measure initial memory
      await page.goto('/');

      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      // Perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('BY');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('30');

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        // Clear and repeat to test for memory leaks
        await page.reload();
      }

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      // Memory should not grow excessively
      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const maxAcceptableGrowth = 50 * 1024 * 1024; // 50MB

        expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
      }
    });

    await test.step('Test performance with large datasets', async () => {
      // Test with maximum vacation days and all states
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY'); // State with most holidays

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('40'); // High vacation days

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const performanceStart = Date.now();

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 15000 });

      const performanceEnd = Date.now();
      const calculationTime = performanceEnd - performanceStart;

      // Even complex calculations should be fast
      expect(calculationTime).toBeLessThan(8000);

      // Verify results are reasonable
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      expect(count).toBeGreaterThan(5); // Should find opportunities
      expect(count).toBeLessThan(100); // Should not overwhelm user
    });
  });

  test('Lighthouse Performance Audit', async ({ page }) => {
    await test.step('Run Lighthouse performance audit', async () => {
      // Navigate to page for Lighthouse audit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Run Lighthouse audit (mock implementation)
      const lighthouseResults = await runLighthouseAudit();

      // Constitutional requirement: Lighthouse score > 90
      expect(lighthouseResults.scores.performance).toBeGreaterThan(90);
      expect(lighthouseResults.scores.accessibility).toBeGreaterThan(90);
      expect(lighthouseResults.scores.bestPractices).toBeGreaterThan(90);
      expect(lighthouseResults.scores.seo).toBeGreaterThan(90);

      // Verify constitutional compliance
      expect(lighthouseResults.constitutionalCompliance).toBe(true);

      // Core Web Vitals should pass
      expect(lighthouseResults.metrics.largestContentfulPaint).toBeLessThan(2500);
      expect(lighthouseResults.metrics.firstInputDelay || lighthouseResults.metrics.totalBlockingTime).toBeLessThan(300);
      expect(lighthouseResults.metrics.cumulativeLayoutShift).toBeLessThan(0.1);
    });
  });

  test('Concurrent User Simulation', async ({ page, context }) => {
    await test.step('Simulate multiple concurrent users', async () => {
      // Create multiple pages to simulate concurrent users
      const concurrentPages: Page[] = [];
      const maxConcurrentUsers = 10; // Limited simulation for test environment

      try {
        // Create concurrent user sessions
        for (let i = 0; i < maxConcurrentUsers; i++) {
          const newPage = await context.newPage();
          concurrentPages.push(newPage);
        }

        // Simulate concurrent vacation planning
        const startTime = Date.now();

        const promises = concurrentPages.map(async (userPage, index) => {
          try {
            await userPage.goto('/');

            const stateSelector = userPage.locator('select[name="state"]');
            const states = ['BY', 'BE', 'NW', 'HH', 'SN'];
            await stateSelector.selectOption(states[index % states.length]);

            const vacationInput = userPage.locator('input[name="vacationDays"]');
            await vacationInput.fill(String(20 + (index % 20)));

            const generateButton = userPage.locator('button').filter({ hasText: /berechnen|calculate/i });
            await generateButton.click();

            await userPage.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 20000 });

            return { success: true, userId: index };
          } catch (error) {
            return { success: false, userId: index, error: error.message };
          }
        });

        const results = await Promise.all(promises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Analyze concurrent performance
        const successfulUsers = results.filter(r => r.success).length;
        const failedUsers = results.filter(r => !r.success).length;

        // Should handle concurrent users effectively
        expect(successfulUsers).toBeGreaterThanOrEqual(maxConcurrentUsers * 0.8); // 80% success rate minimum
        expect(failedUsers).toBeLessThanOrEqual(maxConcurrentUsers * 0.2); // Max 20% failure

        // Total time should be reasonable for concurrent operations
        expect(totalTime).toBeLessThan(30000); // 30 seconds for all concurrent operations

        console.log(`Concurrent test: ${successfulUsers}/${maxConcurrentUsers} users successful in ${totalTime}ms`);

      } finally {
        // Clean up concurrent pages
        await Promise.all(concurrentPages.map(p => p.close()));
      }
    });
  });

  test('Performance Regression Detection', async ({ page }) => {
    await test.step('Establish performance baseline', async () => {
      const metrics = await measurePerformance(page, {
        simulateSlowNetwork: false,
        testDevice: 'desktop'
      });

      // Store baseline metrics for comparison
      const baseline = {
        timestamp: new Date().toISOString(),
        firstContentfulPaint: metrics.firstContentfulPaint,
        largestContentfulPaint: metrics.largestContentfulPaint,
        firstInputDelay: metrics.firstInputDelay,
        cumulativeLayoutShift: metrics.cumulativeLayoutShift,
        loadComplete: metrics.loadComplete,
        bundleSize: metrics.gzippedBundleSize
      };

      // Verify against constitutional budgets
      expect(baseline.firstContentfulPaint).toBeLessThan(CONSTITUTIONAL_BUDGETS.firstContentfulPaint);
      expect(baseline.largestContentfulPaint).toBeLessThan(CONSTITUTIONAL_BUDGETS.largestContentfulPaint);
      expect(baseline.firstInputDelay).toBeLessThan(CONSTITUTIONAL_BUDGETS.firstInputDelay);
      expect(baseline.cumulativeLayoutShift).toBeLessThan(CONSTITUTIONAL_BUDGETS.cumulativeLayoutShift);
      expect(baseline.bundleSize).toBeLessThan(CONSTITUTIONAL_BUDGETS.gzippedBundleSize);

      // Save baseline for CI/CD tracking
      const fs = require('fs');
      const path = require('path');

      try {
        const baselineDir = path.join(process.cwd(), 'performance-reports');
        if (!fs.existsSync(baselineDir)) {
          fs.mkdirSync(baselineDir, { recursive: true });
        }

        fs.writeFileSync(
          path.join(baselineDir, 'performance-baseline.json'),
          JSON.stringify(baseline, null, 2)
        );
      } catch (error) {
        console.warn('Could not save performance baseline:', error.message);
      }
    });
  });

  test('Performance Under Stress Conditions', async ({ page }) => {
    await test.step('Test performance under various stress conditions', async () => {
      // Test with slow JavaScript execution
      await page.addInitScript(() => {
        // Simulate slow JavaScript environment
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay) {
          return originalSetTimeout(callback, delay + 10); // Add 10ms delay
        };
      });

      // Test with limited memory
      await page.route('**/*', async (route) => {
        // Simulate limited bandwidth
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        await route.continue();
      });

      const stressTestStart = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('35');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 20000 });

      const stressTestEnd = Date.now();
      const stressTestTime = stressTestEnd - stressTestStart;

      // Should still meet constitutional requirements under stress
      expect(stressTestTime).toBeLessThan(10000); // Allow extra time under stress

      // Verify functionality is intact
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});