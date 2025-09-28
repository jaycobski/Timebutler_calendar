/**
 * Mobile Responsive Tests
 * Comprehensive testing for mobile-first responsive design with German cultural UX validation
 * Tests across multiple device sizes and German user behavior patterns
 */

import { expect } from '@playwright/test';
import {
  mobileTest,
  GERMAN_MOBILE_DEVICES,
  GERMAN_MOBILE_BREAKPOINTS,
  MobileTestUtils
} from './mobile-test-setup';

// Test suite for responsive layout across German mobile devices
mobileTest.describe('Mobile Responsive Design - German Cultural UX', () => {

  // Test on most popular German mobile device
  mobileTest('[IPHONE_13_PRO] {STANDARD} Homepage responsive layout', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Validate layout doesn't break on standard iPhone size
    const headerHeight = await page.locator('header').boundingBox();
    expect(headerHeight?.height).toBeGreaterThan(60); // Adequate header for German text

    // Check navigation accessibility
    const navItems = await page.locator('nav a, nav button').all();
    for (const item of navItems) {
      const box = await item.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44); // WCAG touch target
    }

    // Validate German text doesn't overflow
    const typography = await germanMobile.validateTypography();
    expect(typography.readable).toBe(true);
    if (typography.issues.length > 0) {
      console.warn('Typography issues found:', typography.issues);
    }

    // Check formal addressing is maintained
    const formalAddressing = await germanMobile.validateFormalAddressing();
    expect(formalAddressing).toBe(true);
  });

  mobileTest('[SAMSUNG_GALAXY_S23] {LARGE} Holiday selection responsive', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Navigate to holiday selection
    await page.click('[data-testid="state-selector"]');
    await page.selectOption('[data-testid="state-selector"]', 'BY'); // Bavaria

    // Validate state selector works on larger Android screens
    const stateSelector = await page.locator('[data-testid="state-selector"]');
    const selectorBox = await stateSelector.boundingBox();
    expect(selectorBox?.width).toBeGreaterThan(200); // Adequate width for German state names

    // Check holiday cards are properly sized
    const holidayCards = await page.locator('[data-testid^="holiday-card"]').all();
    for (const card of holidayCards) {
      const cardBox = await card.boundingBox();
      expect(cardBox?.height).toBeGreaterThan(100); // Enough space for German holiday names
      expect(cardBox?.width).toBeGreaterThan(280); // Proper card width on large screens
    }

    // Validate German date formatting
    const dateElements = await page.locator('[data-testid$="-date"]').all();
    for (const dateEl of dateElements) {
      const isGermanFormat = await MobileTestUtils.validateGermanDateFormat(
        page,
        `[data-testid="${await dateEl.getAttribute('data-testid')}"]`
      );
      expect(isGermanFormat).toBe(true);
    }
  });

  mobileTest('[IPHONE_12] {COMPACT} Bridge weekend calculation compact view', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Set viewport to compact size
    await page.setViewportSize(GERMAN_MOBILE_BREAKPOINTS.COMPACT);

    // Navigate through compact flow
    await page.click('[data-testid="state-selector"]');
    await page.selectOption('[data-testid="state-selector"]', 'NW'); // North Rhine-Westphalia

    await page.click('[data-testid="calculate-bridges"]');
    await page.waitForSelector('[data-testid="bridge-results"]');

    // Check results are readable on smallest screens
    const resultCards = await page.locator('[data-testid^="bridge-weekend"]').all();
    expect(resultCards.length).toBeGreaterThan(0);

    for (const card of resultCards) {
      const cardBox = await card.boundingBox();

      // Cards should stack vertically on compact screens
      expect(cardBox?.width).toBeGreaterThanOrEqual(280); // Minimum readable width

      // Check text doesn't overflow
      const hasOverflow = await card.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }

    // Validate touch targets are adequate
    const touchTargets = await germanMobile.validateTouchTargets();
    const failedTargets = touchTargets.filter(target => !target.compliant);
    expect(failedTargets.length).toBe(0);
  });

  mobileTest('[PIXEL_7] {STANDARD} Email form validation German UX', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Navigate to email form
    await page.click('[data-testid="state-selector"]');
    await page.selectOption('[data-testid="state-selector"]', 'BE'); // Berlin

    await page.click('[data-testid="calculate-bridges"]');
    await page.waitForSelector('[data-testid="email-form"]');

    // Test form on Pixel (popular among tech-savvy German users)
    const emailInput = page.locator('[data-testid="email-input"]');
    const submitButton = page.locator('[data-testid="submit-email"]');

    // Validate form elements are properly sized
    const emailBox = await emailInput.boundingBox();
    const submitBox = await submitButton.boundingBox();

    expect(emailBox?.height).toBeGreaterThanOrEqual(48); // German UX preference
    expect(submitBox?.height).toBeGreaterThanOrEqual(48);

    // Test German typing simulation
    await MobileTestUtils.simulateGermanTyping(page, '[data-testid="email-input"]', 'test@beispiel.de');

    // Validate error messages are formal and helpful
    await submitButton.click();

    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    if (errorMessage) {
      // Should not contain casual language
      expect(errorMessage).not.toMatch(/hey|hi|cool|awesome/i);
      // Should be helpful and formal
      expect(errorMessage.length).toBeGreaterThan(20); // Detailed German error messages
    }

    // Check business tone validation
    const businessTone = await germanMobile.validateBusinessTone();
    expect(businessTone.appropriate).toBe(true);
  });

  mobileTest('[ONEPLUS_11] {LARGE} Calendar export download flow', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Complete flow to calendar export
    await page.click('[data-testid="state-selector"]');
    await page.selectOption('[data-testid="state-selector"]', 'HH'); // Hamburg

    await page.click('[data-testid="calculate-bridges"]');
    await page.waitForSelector('[data-testid="bridge-results"]');

    // Select some bridge weekends
    const bridgeCards = await page.locator('[data-testid^="bridge-weekend"]').all();
    if (bridgeCards.length > 0) {
      await bridgeCards[0].click();
      if (bridgeCards.length > 1) {
        await bridgeCards[1].click();
      }
    }

    await page.fill('[data-testid="email-input"]', 'test@timebutler.de');
    await page.click('[data-testid="submit-email"]');

    // Validate download flow works on OnePlus (performance-conscious users)
    await page.waitForSelector('[data-testid="download-link"]');

    const downloadLink = page.locator('[data-testid="download-link"]');
    const linkBox = await downloadLink.boundingBox();

    expect(linkBox?.height).toBeGreaterThanOrEqual(48); // Easy to tap
    expect(linkBox?.width).toBeGreaterThan(200); // Clear action button

    // Check GDPR compliance
    const gdprCompliance = await germanMobile.validateGDPRCompliance();
    expect(gdprCompliance.compliant).toBe(true);
  });

  // Tablet responsive tests
  mobileTest('[IPAD] {TABLET_PORTRAIT} Tablet portrait layout', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.setViewportSize(GERMAN_MOBILE_BREAKPOINTS.TABLET_PORTRAIT);
    await page.goto('/');

    // Check layout adapts to tablet portrait
    const container = page.locator('[data-testid="main-container"]');
    const containerBox = await container.boundingBox();

    // Should use more of the available space
    expect(containerBox?.width).toBeGreaterThan(600);

    // Check if cards are displayed in grid on tablet
    const holidayGrid = page.locator('[data-testid="holiday-grid"]');
    const gridComputedStyle = await holidayGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });

    // Should use grid or flex layout for better space utilization
    expect(['grid', 'flex']).toContain(gridComputedStyle);
  });

  mobileTest('[IPAD] {TABLET_LANDSCAPE} Tablet landscape optimization', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.setViewportSize(GERMAN_MOBILE_BREAKPOINTS.TABLET_LANDSCAPE);
    await page.goto('/');

    // Check landscape layout optimization
    const header = page.locator('header');
    const main = page.locator('main');

    const headerBox = await header.boundingBox();
    const mainBox = await main.boundingBox();

    // Header should be optimized for landscape
    expect(headerBox?.height).toBeLessThan(100); // Compact header
    expect(mainBox?.width).toBeGreaterThan(800); // Utilize landscape width

    // Navigation should adapt to landscape
    const navItems = await page.locator('nav a, nav button').all();
    if (navItems.length > 3) {
      // Should display horizontal navigation on landscape
      const firstItem = await navItems[0].boundingBox();
      const secondItem = await navItems[1].boundingBox();

      // Items should be on same horizontal line
      expect(Math.abs((firstItem?.y || 0) - (secondItem?.y || 0))).toBeLessThan(10);
    }
  });

  // Foldable device test
  mobileTest('[GALAXY_FOLD] {FOLDABLE} Foldable device narrow screen', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.setViewportSize(GERMAN_MOBILE_BREAKPOINTS.FOLDABLE);
    await page.goto('/');

    // Test extremely narrow foldable screen
    const container = page.locator('[data-testid="main-container"]');
    const containerBox = await container.boundingBox();

    // Content should still be accessible
    expect(containerBox?.width).toBeLessThan(300);

    // Check text remains readable
    const typography = await germanMobile.validateTypography();
    expect(typography.readable).toBe(true);

    // Touch targets should still be adequate
    const touchTargets = await germanMobile.validateTouchTargets();
    const failedTargets = touchTargets.filter(target => !target.compliant);
    expect(failedTargets.length).toBe(0);

    // Check horizontal scrolling is avoided
    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(bodyOverflow).toBe(false);
  });

  // Performance validation across devices
  mobileTest.describe('Performance validation German UX expectations', () => {

    ['IPHONE_13_PRO', 'SAMSUNG_GALAXY_S23', 'IPHONE_12'].forEach((device) => {
      mobileTest(`[${device}] Loading performance meets German expectations`, async ({ germanMobile }) => {
        const { page } = germanMobile;

        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        // German users expect fast loading (3s max)
        expect(loadTime).toBeLessThan(3000);

        // Validate loading performance
        const performance = await germanMobile.validateLoadingPerformance();
        expect(performance.withinExpectations).toBe(true);
      });
    });
  });

  // German cultural UX validation
  mobileTest.describe('German cultural UX validation', () => {

    mobileTest('Formal addressing maintained across breakpoints', async ({ germanMobile }) => {
      const { page } = germanMobile;

      for (const breakpoint of Object.keys(GERMAN_MOBILE_BREAKPOINTS)) {
        await page.setViewportSize(GERMAN_MOBILE_BREAKPOINTS[breakpoint as keyof typeof GERMAN_MOBILE_BREAKPOINTS]);
        await page.goto('/');

        const formalAddressing = await germanMobile.validateFormalAddressing();
        expect(formalAddressing).toBe(true);
      }
    });

    mobileTest('GDPR compliance maintained on mobile', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const gdprCompliance = await germanMobile.validateGDPRCompliance();
      expect(gdprCompliance.compliant).toBe(true);

      if (gdprCompliance.issues.length > 0) {
        console.warn('GDPR compliance issues:', gdprCompliance.issues);
      }
    });

    mobileTest('Business tone appropriate for German market', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const businessTone = await germanMobile.validateBusinessTone();
      expect(businessTone.appropriate).toBe(true);

      if (businessTone.suggestions.length > 0) {
        console.info('Business tone suggestions:', businessTone.suggestions);
      }
    });
  });

});

// Accessibility-focused mobile tests
mobileTest.describe('Mobile Accessibility - German Standards', () => {

  mobileTest('Touch targets meet German accessibility standards', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    const touchTargets = await germanMobile.validateTouchTargets();
    const failedTargets = touchTargets.filter(target => !target.compliant);

    expect(failedTargets.length).toBe(0);

    // Log targets that are borderline
    const borderlineTargets = touchTargets.filter(target =>
      target.compliant && target.size < 48
    );

    if (borderlineTargets.length > 0) {
      console.info('Borderline touch targets (consider increasing):', borderlineTargets);
    }
  });

  mobileTest('Typography meets German readability standards', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    const typography = await germanMobile.validateTypography();
    expect(typography.readable).toBe(true);

    if (typography.issues.length > 0) {
      console.warn('Typography issues to address:', typography.issues);
    }
  });

  mobileTest('Keyboard navigation works on mobile', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Continue tabbing to ensure logical order
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const lastFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(lastFocused).toBeTruthy();

    // Should be able to interact with focused elements using Enter/Space
    await page.keyboard.press('Enter');
    // Should not throw errors
  });

});