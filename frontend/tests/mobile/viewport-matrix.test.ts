/**
 * Viewport Matrix Tests
 * Comprehensive testing across all mobile viewport combinations with
 * German device market data and cultural UX validation
 */

import { expect } from '@playwright/test';
import {
  mobileTest,
  GERMAN_MOBILE_DEVICES,
  GERMAN_MOBILE_BREAKPOINTS,
  MobileTestUtils
} from './mobile-test-setup';

// Cross-device matrix testing for German mobile market
mobileTest.describe('Viewport Matrix Testing - German Mobile Market', () => {

  // Create test matrix combining devices and breakpoints
  const deviceNames = Object.keys(GERMAN_MOBILE_DEVICES) as Array<keyof typeof GERMAN_MOBILE_DEVICES>;
  const breakpointNames = Object.keys(GERMAN_MOBILE_BREAKPOINTS) as Array<keyof typeof GERMAN_MOBILE_BREAKPOINTS>;

  // Core functionality matrix - test critical flows across all device combinations
  mobileTest.describe('Core Functionality Matrix', () => {

    deviceNames.forEach(deviceName => {
      breakpointNames.forEach(breakpointName => {
        const device = GERMAN_MOBILE_DEVICES[deviceName];
        const breakpoint = GERMAN_MOBILE_BREAKPOINTS[breakpointName];

        mobileTest(`[${deviceName}] {${breakpointName}} - Homepage loads correctly`, async ({ page, context }) => {
          // Set device characteristics
          await page.setViewportSize(breakpoint);
          await page.setUserAgent(device.userAgent);

          await page.goto('/');
          await page.waitForLoadState('networkidle');

          // Basic layout checks
          const header = await page.locator('header').isVisible();
          const main = await page.locator('main').isVisible();
          const footer = await page.locator('footer').isVisible();

          expect(header).toBe(true);
          expect(main).toBe(true);
          expect(footer).toBe(true);

          // Check no horizontal overflow
          const hasHorizontalOverflow = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
          });
          expect(hasHorizontalOverflow).toBe(false);

          // Validate content is readable
          const mainContent = await page.locator('main').textContent();
          expect(mainContent?.length).toBeGreaterThan(50);
        });

        // Only test holiday selection on key devices to avoid redundancy
        if (['IPHONE_13_PRO', 'SAMSUNG_GALAXY_S23', 'PIXEL_7'].includes(deviceName)) {
          mobileTest(`[${deviceName}] {${breakpointName}} - Holiday selection flow`, async ({ page }) => {
            await page.setViewportSize(breakpoint);
            await page.setUserAgent(device.userAgent);

            await page.goto('/');

            // State selection
            const stateSelector = page.locator('[data-testid="state-selector"]');
            if (await stateSelector.isVisible()) {
              await stateSelector.click();
              await page.selectOption('[data-testid="state-selector"]', 'BY');

              // Verify holiday data loads
              const holidayCards = await page.locator('[data-testid^="holiday-card"]').count();
              expect(holidayCards).toBeGreaterThan(0);

              // Check touch targets are adequate for device
              const firstCard = page.locator('[data-testid^="holiday-card"]').first();
              const cardBox = await firstCard.boundingBox();

              expect(cardBox?.height).toBeGreaterThan(80); // Minimum touch-friendly size
              expect(cardBox?.width).toBeGreaterThan(200); // Readable card width
            }
          });
        }

        // Test email form only on representative devices
        if (['IPHONE_13_PRO', 'SAMSUNG_GALAXY_S23'].includes(deviceName) &&
            ['STANDARD', 'LARGE'].includes(breakpointName)) {
          mobileTest(`[${deviceName}] {${breakpointName}} - Email form interaction`, async ({ page }) => {
            await page.setViewportSize(breakpoint);
            await page.setUserAgent(device.userAgent);

            await page.goto('/');

            // Navigate to email form
            const emailForm = page.locator('[data-testid="email-form"]');
            if (await emailForm.isVisible()) {
              const emailInput = page.locator('[data-testid="email-input"]');
              const submitButton = page.locator('[data-testid="submit-email"]');

              // Check form elements are properly sized for device
              const inputBox = await emailInput.boundingBox();
              const buttonBox = await submitButton.boundingBox();

              expect(inputBox?.height).toBeGreaterThan(40);
              expect(buttonBox?.height).toBeGreaterThan(44); // WCAG touch target

              // Test input interaction
              await emailInput.fill('test@beispiel.de');
              const inputValue = await emailInput.inputValue();
              expect(inputValue).toBe('test@beispiel.de');
            }
          });
        }

      });
    });

  });

  // German market specific viewport testing
  mobileTest.describe('German Market Device Priorities', () => {

    // Test most popular German devices more thoroughly
    const popularGermanDevices = ['IPHONE_13_PRO', 'SAMSUNG_GALAXY_S23', 'IPHONE_12'] as const;

    popularGermanDevices.forEach(deviceName => {
      const device = GERMAN_MOBILE_DEVICES[deviceName];

      mobileTest(`[${deviceName}] Market leader comprehensive test (${device.marketShare}% market share)`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 }); // Standard mobile size
        await page.setUserAgent(device.userAgent);

        // Add device-specific context
        await page.addInitScript((deviceInfo) => {
          window.__DEVICE_INFO__ = deviceInfo;
        }, {
          name: device.name,
          marketShare: device.marketShare,
          culturalNotes: device.culturalNotes
        });

        await page.goto('/');

        // Comprehensive flow test for popular devices
        await page.click('[data-testid="state-selector"]');
        await page.selectOption('[data-testid="state-selector"]', 'NW'); // Most populous state

        await page.click('[data-testid="calculate-bridges"]');
        await page.waitForSelector('[data-testid="bridge-results"]', { timeout: 5000 });

        // Verify results display correctly
        const bridgeCards = await page.locator('[data-testid^="bridge-weekend"]').count();
        expect(bridgeCards).toBeGreaterThan(0);

        // Check performance on popular devices
        const performanceMetrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
          };
        });

        // Popular devices should have excellent performance
        expect(performanceMetrics.loadTime).toBeLessThan(2000);
      });

    });

  });

  // Breakpoint-specific behavior testing
  mobileTest.describe('Breakpoint Behavior Validation', () => {

    Object.entries(GERMAN_MOBILE_BREAKPOINTS).forEach(([breakpointName, viewport]) => {

      mobileTest(`{${breakpointName}} Layout adaptation (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        // Check layout adapts appropriately to breakpoint
        const containerWidth = await page.evaluate(() => {
          const container = document.querySelector('[data-testid="main-container"]') || document.querySelector('main');
          return container?.getBoundingClientRect().width || 0;
        });

        // Container should utilize available space appropriately
        expect(containerWidth).toBeGreaterThan(viewport.width * 0.8); // At least 80% utilization
        expect(containerWidth).toBeLessThanOrEqual(viewport.width); // No overflow

        // Check navigation pattern for breakpoint
        if (viewport.width < 768) {
          // Mobile navigation
          const mobileNav = await page.locator('[data-testid="mobile-nav"], .mobile-nav, [data-testid="menu-toggle"]').isVisible();
          // Should have mobile navigation pattern for small screens
          if (await page.locator('nav').isVisible()) {
            expect(mobileNav).toBe(true);
          }
        } else {
          // Desktop/tablet navigation
          const desktopNav = await page.locator('nav a').count();
          if (desktopNav > 0) {
            // Should show horizontal navigation on larger screens
            const firstNavLink = page.locator('nav a').first();
            const navBox = await firstNavLink.boundingBox();
            expect(navBox?.width).toBeGreaterThan(60); // Adequate link size
          }
        }

        // Typography should adapt to screen size
        const headingSize = await page.evaluate(() => {
          const heading = document.querySelector('h1');
          return heading ? parseFloat(window.getComputedStyle(heading).fontSize) : 0;
        });

        if (viewport.width < 480) {
          expect(headingSize).toBeGreaterThan(18); // Readable on small screens
          expect(headingSize).toBeLessThan(32); // Not too large for small screens
        } else {
          expect(headingSize).toBeGreaterThan(20); // Larger on bigger screens
        }

      });

    });

  });

  // Edge case viewport testing
  mobileTest.describe('Edge Case Viewport Handling', () => {

    mobileTest('Extremely narrow viewport (foldable inner screen)', async ({ page }) => {
      await page.setViewportSize({ width: 280, height: 653 }); // Galaxy Fold inner
      await page.goto('/');

      // Content should remain accessible
      const contentWidth = await page.evaluate(() => {
        return Math.max(
          document.body.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
          document.documentElement.offsetWidth
        );
      });

      expect(contentWidth).toBeLessThanOrEqual(280); // No horizontal overflow

      // Check critical elements are still usable
      const criticalButtons = await page.locator('button, [role="button"]').all();
      for (const button of criticalButtons.slice(0, 3)) {
        const buttonBox = await button.boundingBox();
        expect(buttonBox?.width).toBeGreaterThan(80); // Still tappable
      }
    });

    mobileTest('Very wide tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 }); // iPad landscape
      await page.goto('/');

      // Should utilize extra width effectively
      const containerWidth = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="main-container"]') || document.querySelector('main');
        return container?.getBoundingClientRect().width || 0;
      });

      expect(containerWidth).toBeGreaterThan(600); // Good space utilization

      // Content should be organized for wide screen
      const holidayCards = await page.locator('[data-testid^="holiday-card"]').all();
      if (holidayCards.length > 2) {
        const firstCardBox = await holidayCards[0].boundingBox();
        const secondCardBox = await holidayCards[1].boundingBox();

        // Cards should be arranged side by side on wide screens
        const areSideBySide = Math.abs((firstCardBox?.y || 0) - (secondCardBox?.y || 0)) < 50;
        expect(areSideBySide).toBe(true);
      }
    });

    mobileTest('Square viewport (unusual aspect ratio)', async ({ page }) => {
      await page.setViewportSize({ width: 500, height: 500 }); // Square viewport
      await page.goto('/');

      // Layout should handle unusual aspect ratio gracefully
      const hasVerticalOverflow = await page.evaluate(() => {
        return document.body.scrollHeight > window.innerHeight;
      });

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false); // No horizontal overflow
      // Vertical overflow is acceptable for square viewports
    });

  });

  // Orientation change testing
  mobileTest.describe('Orientation Change Handling', () => {

    mobileTest('Portrait to landscape transition', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      // Capture initial state
      const portraitLayout = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const main = document.querySelector('main');
        return {
          navHeight: nav?.getBoundingClientRect().height || 0,
          mainWidth: main?.getBoundingClientRect().width || 0
        };
      });

      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.waitForTimeout(500); // Allow layout to settle

      const landscapeLayout = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const main = document.querySelector('main');
        return {
          navHeight: nav?.getBoundingClientRect().height || 0,
          mainWidth: main?.getBoundingClientRect().width || 0
        };
      });

      // Layout should adapt to orientation change
      expect(landscapeLayout.mainWidth).toBeGreaterThan(portraitLayout.mainWidth);

      // Navigation might become more compact in landscape
      if (portraitLayout.navHeight > 0 && landscapeLayout.navHeight > 0) {
        expect(landscapeLayout.navHeight).toBeLessThanOrEqual(portraitLayout.navHeight + 10);
      }
    });

    mobileTest('Landscape to portrait transition', async ({ page }) => {
      // Start in landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.goto('/');

      // Switch to portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);

      // Ensure no layout breaks during transition
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasOverflow).toBe(false);

      // Critical elements should remain accessible
      const mainContent = await page.locator('main').isVisible();
      const navigation = await page.locator('nav, [role="navigation"]').isVisible();

      expect(mainContent).toBe(true);
      expect(navigation).toBe(true);
    });

  });

});

// Device-specific cultural behavior testing
mobileTest.describe('Device-Specific German Cultural Behavior', () => {

  mobileTest('iPhone users (premium expectations) - detailed validation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13 Pro
    await page.setUserAgent(GERMAN_MOBILE_DEVICES.IPHONE_13_PRO.userAgent);

    await page.goto('/');

    // iPhone users expect polished animations
    const hasTransitions = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' || style.animation !== 'none';
      });
    });

    expect(hasTransitions).toBe(true);

    // Check for high-quality visual elements
    const images = await page.locator('img').all();
    for (const img of images) {
      const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
      if (naturalWidth > 0) {
        expect(naturalWidth).toBeGreaterThan(200); // High-resolution expectations
      }
    }
  });

  mobileTest('Android users (business focus) - efficiency validation', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 }); // Galaxy S23
    await page.setUserAgent(GERMAN_MOBILE_DEVICES.SAMSUNG_GALAXY_S23.userAgent);

    await page.goto('/');

    // Android business users expect efficient workflows
    const actionButtons = await page.locator('button, [role="button"]').all();

    for (const button of actionButtons) {
      const buttonText = await button.textContent();
      if (buttonText && buttonText.trim()) {
        // Button text should be clear and action-oriented
        expect(buttonText.length).toBeGreaterThan(5); // Not too terse
        expect(buttonText.length).toBeLessThan(30); // Not too verbose
      }
    }

    // Check for efficient form design
    const formInputs = await page.locator('input, select, textarea').all();
    for (const input of formInputs) {
      const inputBox = await input.boundingBox();
      expect(inputBox?.height).toBeGreaterThan(40); // Easy to interact with
    }
  });

  mobileTest('Pixel users (tech-savvy) - advanced feature validation', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 }); // Pixel 7
    await page.setUserAgent(GERMAN_MOBILE_DEVICES.PIXEL_7.userAgent);

    await page.goto('/');

    // Tech-savvy users expect advanced features
    const advancedFeatures = await page.evaluate(() => {
      return {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasLocalStorage: typeof localStorage !== 'undefined',
        hasSessionStorage: typeof sessionStorage !== 'undefined',
        hasGeolocation: 'geolocation' in navigator
      };
    });

    // Should support modern web features
    expect(advancedFeatures.hasServiceWorker).toBe(true);
    expect(advancedFeatures.hasLocalStorage).toBe(true);

    // Check for keyboard shortcuts or advanced interactions
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy(); // Keyboard navigation works
  });

});

// Performance matrix across devices
mobileTest.describe('Performance Matrix - German Device Expectations', () => {

  const performanceCriticalDevices = ['IPHONE_13_PRO', 'SAMSUNG_GALAXY_S23', 'IPHONE_12'] as const;

  performanceCriticalDevices.forEach(deviceName => {
    const device = GERMAN_MOBILE_DEVICES[deviceName];

    mobileTest(`[${deviceName}] Performance expectations (${device.marketShare}% market share)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.setUserAgent(device.userAgent);

      // Measure critical performance metrics
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Performance expectations based on device tier
      const expectedLoadTime = device.marketShare > 20 ? 2000 : 3000; // Premium devices get stricter requirements
      expect(loadTime).toBeLessThan(expectedLoadTime);

      // Check interaction responsiveness
      const interactionStart = Date.now();
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.click();
        const interactionTime = Date.now() - interactionStart;
        expect(interactionTime).toBeLessThan(100); // Immediate response expected
      }

      // Memory usage check for lower-end devices
      const memoryInfo = await page.evaluate(() => {
        // @ts-ignore - performance.memory is not in standard types
        return (performance as any).memory || {};
      });

      if (memoryInfo.usedJSHeapSize) {
        // Should not use excessive memory
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB limit
      }
    });

  });

});