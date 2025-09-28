/**
 * Mobile Interaction Patterns Tests
 * Testing mobile-specific interaction patterns, gestures, and German user behavior
 * Focus on touch interactions, form handling, and navigation patterns
 */

import { expect } from '@playwright/test';
import {
  mobileTest,
  GERMAN_MOBILE_UX_STANDARDS,
  MobileTestUtils
} from './mobile-test-setup';

// Mobile interaction patterns specific to German UX expectations
mobileTest.describe('Mobile Interaction Patterns - German UX', () => {

  mobileTest.describe('Touch Interaction Patterns', () => {

    mobileTest('Touch target sizing meets German accessibility standards', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Validate all interactive elements meet German touch standards
      const touchTargets = await germanMobile.validateTouchTargets();

      // German preference for larger touch targets (48px minimum)
      const adequateTargets = touchTargets.filter(target =>
        target.size >= GERMAN_MOBILE_UX_STANDARDS.PREFERRED_TOUCH_TARGET
      );

      const adequatePercentage = (adequateTargets.length / touchTargets.length) * 100;
      expect(adequatePercentage).toBeGreaterThan(75); // At least 75% should meet preferred size

      // Critical elements must meet minimum standards
      const criticalElements = touchTargets.filter(target =>
        target.element.includes('button') || target.element.includes('submit') ||
        target.element.includes('cta') || target.element.includes('nav')
      );

      for (const element of criticalElements) {
        expect(element.compliant).toBe(true);
        expect(element.size).toBeGreaterThanOrEqual(GERMAN_MOBILE_UX_STANDARDS.MIN_TOUCH_TARGET);
      }
    });

    mobileTest('Touch feedback and visual states', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Test button touch states
      const buttons = await page.locator('button, [role="button"]').all();

      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        // Check for hover/focus states
        await button.hover();
        const hoverStyle = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            transform: style.transform,
            boxShadow: style.boxShadow
          };
        });

        // Should have some visual feedback on hover
        const hasVisualFeedback = hoverStyle.transform !== 'none' ||
                                  hoverStyle.boxShadow !== 'none' ||
                                  hoverStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';

        expect(hasVisualFeedback).toBe(true);

        // Test active state (touch simulation)
        await button.focus();
        await page.keyboard.press('Space');

        // Should not produce console errors
        const errors = await page.evaluate(() => {
          return window.console.error.length || 0;
        });
        expect(errors).toBe(0);
      }
    });

    mobileTest('Swipe gesture handling for carousels/sliders', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Look for carousel or slider elements
      const carousel = page.locator('[data-testid*="carousel"], [data-testid*="slider"], .carousel, .slider');

      if (await carousel.isVisible()) {
        const carouselBox = await carousel.boundingBox();

        if (carouselBox) {
          // Simulate swipe gesture
          await page.mouse.move(carouselBox.x + carouselBox.width / 2, carouselBox.y + carouselBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(carouselBox.x + carouselBox.width / 4, carouselBox.y + carouselBox.height / 2);
          await page.mouse.up();

          // Allow for animation
          await page.waitForTimeout(500);

          // Check if carousel responded to swipe
          const newPosition = await carousel.evaluate(el => {
            return el.scrollLeft || 0;
          });

          // Should have moved (if carousel has content)
          const hasContent = await carousel.locator('> *').count();
          if (hasContent > 1) {
            expect(newPosition).toBeGreaterThan(0);
          }
        }
      }
    });

    mobileTest('Long press handling for context menus', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Test long press on interactive elements
      const interactiveElements = await page.locator('[data-testid^="holiday-card"], .card, button').all();

      if (interactiveElements.length > 0) {
        const element = interactiveElements[0];
        const elementBox = await element.boundingBox();

        if (elementBox) {
          // Simulate long press
          await page.mouse.move(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press duration
          await page.mouse.up();

          // Check for context menu or long press feedback
          const contextMenu = await page.locator('[role="menu"], .context-menu, [data-testid*="context"]').isVisible();

          // Context menu is optional, but no errors should occur
          const consoleErrors = await page.evaluate(() => {
            // @ts-ignore
            return window.__errors__ || [];
          });
          expect(consoleErrors.length).toBe(0);
        }
      }
    });

  });

  mobileTest.describe('Form Interaction Patterns', () => {

    mobileTest('Mobile form field interactions with German patterns', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Find form inputs
      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');

      if (await emailInput.isVisible()) {
        // Test German email typing pattern
        await emailInput.click();

        // Simulate German typing behavior (more deliberate)
        await MobileTestUtils.simulateGermanTyping(page, '[data-testid="email-input"], input[type="email"]', 'max.mustermann@beispiel.de');

        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe('max.mustermann@beispiel.de');

        // Check input validation feedback
        const inputBox = await emailInput.boundingBox();
        expect(inputBox?.height).toBeGreaterThan(40); // German UX preference

        // Test focus states
        const focusStyle = await emailInput.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            borderColor: style.borderColor,
            outline: style.outline,
            boxShadow: style.boxShadow
          };
        });

        // Should have clear focus indication
        const hasFocusState = focusStyle.outline !== 'none' ||
                              focusStyle.boxShadow !== 'none' ||
                              focusStyle.borderColor !== 'rgb(0, 0, 0)';

        expect(hasFocusState).toBe(true);
      }
    });

    mobileTest('Select dropdown interaction on mobile', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const stateSelector = page.locator('[data-testid="state-selector"], select');

      if (await stateSelector.isVisible()) {
        // Test mobile select interaction
        await stateSelector.click();

        // On mobile, native select should open
        const isNativeSelect = await stateSelector.evaluate(el => el.tagName === 'SELECT');

        if (isNativeSelect) {
          // Test selecting German state
          await stateSelector.selectOption('BY'); // Bayern

          const selectedValue = await stateSelector.inputValue();
          expect(selectedValue).toBe('BY');

          // Check that German state names are properly displayed
          const options = await stateSelector.locator('option').allTextContents();
          const hasGermanStates = options.some(option =>
            option.includes('Bayern') || option.includes('Baden-Württemberg') ||
            option.includes('Nordrhein-Westfalen')
          );

          expect(hasGermanStates).toBe(true);
        }
      }
    });

    mobileTest('Form validation error presentation', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Find and submit form with invalid data
      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');
      const submitButton = page.locator('[data-testid="submit-email"], [type="submit"], button[type="submit"]');

      if (await emailInput.isVisible() && await submitButton.isVisible()) {
        // Enter invalid email
        await emailInput.fill('invalid-email');
        await submitButton.click();

        // Check for German-appropriate error messaging
        const errorMessage = await page.locator('[data-testid*="error"], .error, .invalid').textContent();

        if (errorMessage) {
          // Error should be formal and helpful (German business style)
          expect(errorMessage.length).toBeGreaterThan(20); // Detailed explanation
          expect(errorMessage).not.toMatch(/oops|whoops|uh-oh/i); // No casual language

          // Should use formal German addressing if in German
          const pageText = await page.textContent('body');
          if (pageText?.includes('Sie') || pageText?.includes('Ihr')) {
            expect(errorMessage).toMatch(/(bitte|überprüfen|eingabe|korrekt)/i);
          }
        }

        // Error should be visually prominent
        const errorElement = page.locator('[data-testid*="error"], .error, .invalid');
        if (await errorElement.isVisible()) {
          const errorBox = await errorElement.boundingBox();
          expect(errorBox?.height).toBeGreaterThan(20); // Visible error message

          const errorStyle = await errorElement.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              color: style.color,
              backgroundColor: style.backgroundColor,
              border: style.border
            };
          });

          // Should have error styling (red color, border, etc.)
          const hasErrorStyling = errorStyle.color.includes('rgb(') ||
                                  errorStyle.backgroundColor.includes('rgb(') ||
                                  errorStyle.border !== 'none';

          expect(hasErrorStyling).toBe(true);
        }
      }
    });

    mobileTest('Keyboard behavior and input methods', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const emailInput = page.locator('[data-testid="email-input"], input[type="email"]');

      if (await emailInput.isVisible()) {
        await emailInput.click();

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        const nextFocused = await page.evaluate(() => document.activeElement?.tagName);

        // Should move focus to next interactive element
        expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(nextFocused || '');

        // Test German special characters input
        await emailInput.click();
        await emailInput.clear();

        // Type German characters (ä, ö, ü, ß)
        await page.keyboard.type('test@müller-straße.de');
        const germanValue = await emailInput.inputValue();
        expect(germanValue).toContain('ü');
        expect(germanValue).toContain('ß');

        // Test autocomplete attributes
        const autocomplete = await emailInput.getAttribute('autocomplete');
        expect(autocomplete).toBeTruthy(); // Should have autocomplete for better UX
      }
    });

  });

  mobileTest.describe('Navigation Interaction Patterns', () => {

    mobileTest('Mobile navigation menu behavior', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Look for mobile navigation toggle
      const navToggle = page.locator('[data-testid="menu-toggle"], .hamburger, .menu-toggle, [aria-label*="menu"]');

      if (await navToggle.isVisible()) {
        // Test hamburger menu interaction
        await navToggle.click();

        const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, [role="navigation"]');
        const isMenuVisible = await mobileMenu.isVisible();

        expect(isMenuVisible).toBe(true);

        // Check menu accessibility
        const menuItems = await mobileMenu.locator('a, button').all();
        for (const item of menuItems) {
          const itemBox = await item.boundingBox();
          expect(itemBox?.height).toBeGreaterThan(40); // Touch-friendly menu items
        }

        // Test closing menu
        await navToggle.click();
        await page.waitForTimeout(300); // Animation time

        const isMenuClosed = await mobileMenu.isVisible();
        expect(isMenuClosed).toBe(false);
      }
    });

    mobileTest('Scroll behavior and scroll-to-top functionality', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Simulate German methodical scrolling pattern
      await MobileTestUtils.simulateGermanScrollPattern(page);

      const scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeGreaterThan(0);

      // Look for scroll-to-top button
      const scrollToTop = page.locator('[data-testid="scroll-top"], .scroll-top, [aria-label*="top"]');

      if (await scrollToTop.isVisible()) {
        await scrollToTop.click();

        await page.waitForTimeout(500); // Allow scroll animation

        const newScrollPosition = await page.evaluate(() => window.scrollY);
        expect(newScrollPosition).toBeLessThan(scrollPosition);
      }
    });

    mobileTest('Breadcrumb navigation on mobile', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Navigate to deeper page if breadcrumbs exist
      const breadcrumbs = page.locator('[data-testid*="breadcrumb"], .breadcrumb, [aria-label*="breadcrumb"]');

      if (await breadcrumbs.isVisible()) {
        const breadcrumbLinks = await breadcrumbs.locator('a').all();

        for (const link of breadcrumbLinks) {
          const linkBox = await link.boundingBox();
          expect(linkBox?.height).toBeGreaterThan(32); // Touch-friendly breadcrumbs

          // Check German text formatting
          const linkText = await link.textContent();
          if (linkText) {
            expect(linkText.length).toBeGreaterThan(2); // Meaningful breadcrumb text
          }
        }
      }
    });

    mobileTest('Tab navigation and skip links', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Test keyboard navigation
      await page.keyboard.press('Tab');

      // Check for skip links (accessibility requirement)
      const skipLink = page.locator('[data-testid="skip-link"], .skip-link, a[href*="#main"]');

      if (await skipLink.isVisible()) {
        const skipLinkText = await skipLink.textContent();
        if (skipLinkText) {
          // Should be in appropriate language
          const isGerman = skipLinkText.includes('Inhalt') || skipLinkText.includes('springen');
          const isEnglish = skipLinkText.includes('content') || skipLinkText.includes('skip');

          expect(isGerman || isEnglish).toBe(true);
        }
      }

      // Continue tabbing through interactive elements
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);
      expect(initialFocus).toBeTruthy();

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const thirdFocus = await page.evaluate(() => document.activeElement?.tagName);
      expect(thirdFocus).toBeTruthy();

      // Focus should move logically through the page
      expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(thirdFocus || '');
    });

  });

  mobileTest.describe('German-Specific Interaction Patterns', () => {

    mobileTest('Date picker interaction with German format', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Look for date picker elements
      const datePicker = page.locator('[data-testid*="date"], input[type="date"], .date-picker');

      if (await datePicker.isVisible()) {
        await datePicker.click();

        // Check date format expectations
        const dateValue = await datePicker.inputValue();
        if (dateValue) {
          // Should support German date format or be convertible
          const germanDatePattern = /\d{1,2}\.\d{1,2}\.\d{2,4}/;
          const isoDatePattern = /\d{4}-\d{2}-\d{2}/;

          expect(germanDatePattern.test(dateValue) || isoDatePattern.test(dateValue)).toBe(true);
        }

        // Test date selection
        await datePicker.fill('2025-06-15'); // ISO format that should work
        const newValue = await datePicker.inputValue();
        expect(newValue).toBeTruthy();
      }
    });

    mobileTest('Language switcher interaction', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const languageSwitcher = page.locator('[data-testid="language-switcher"], .language-switch, [data-testid*="lang"]');

      if (await languageSwitcher.isVisible()) {
        // Test language switching
        await languageSwitcher.click();

        const germanOption = page.locator('[data-testid="language-de"], [data-lang="de"], [href*="de"]');
        const englishOption = page.locator('[data-testid="language-en"], [data-lang="en"], [href*="en"]');

        if (await germanOption.isVisible()) {
          await germanOption.click();

          // Check if page content changed to German
          await page.waitForTimeout(1000); // Allow for language change

          const pageText = await page.textContent('body');
          const hasGermanContent = pageText?.includes('Sie') || pageText?.includes('Willkommen') ||
                                   pageText?.includes('Bundesland') || pageText?.includes('Feiertag');

          expect(hasGermanContent).toBe(true);
        }

        if (await englishOption.isVisible()) {
          await englishOption.click();

          await page.waitForTimeout(1000);

          const pageText = await page.textContent('body');
          const hasEnglishContent = pageText?.includes('you') || pageText?.includes('Welcome') ||
                                    pageText?.includes('state') || pageText?.includes('holiday');

          expect(hasEnglishContent).toBe(true);
        }
      }
    });

    mobileTest('GDPR consent interaction patterns', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const cookieBanner = page.locator('[data-testid*="cookie"], .cookie-banner, [data-testid*="consent"]');

      if (await cookieBanner.isVisible()) {
        // Check German GDPR compliance patterns
        const bannerText = await cookieBanner.textContent();

        if (bannerText) {
          // Should be comprehensive (German legal requirements)
          expect(bannerText.length).toBeGreaterThan(100);

          // Should mention specific cookie types
          const mentionsCategories = bannerText.includes('funktional') ||
                                     bannerText.includes('analytik') ||
                                     bannerText.includes('marketing') ||
                                     bannerText.includes('functional') ||
                                     bannerText.includes('analytics');

          expect(mentionsCategories).toBe(true);
        }

        // Test consent options
        const acceptButton = cookieBanner.locator('button:has-text("Accept"), button:has-text("Akzeptieren")');
        const rejectButton = cookieBanner.locator('button:has-text("Reject"), button:has-text("Ablehnen")');
        const settingsButton = cookieBanner.locator('button:has-text("Settings"), button:has-text("Einstellungen")');

        if (await settingsButton.isVisible()) {
          await settingsButton.click();

          // Should open detailed settings
          const cookieSettings = page.locator('[data-testid*="cookie-settings"], .cookie-settings');
          const hasDetailedSettings = await cookieSettings.isVisible();

          expect(hasDetailedSettings).toBe(true);
        }

        // Touch targets should be adequate
        if (await acceptButton.isVisible()) {
          const buttonBox = await acceptButton.boundingBox();
          expect(buttonBox?.height).toBeGreaterThan(40);
        }
      }
    });

    mobileTest('German address/location input patterns', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Look for location or address inputs
      const locationInput = page.locator('[data-testid*="location"], [data-testid*="address"], input[name*="address"]');

      if (await locationInput.isVisible()) {
        // Test German address format
        await locationInput.fill('Musterstraße 123, 80331 München');

        const inputValue = await locationInput.inputValue();
        expect(inputValue).toContain('München');

        // Check autocomplete for German addresses
        const autocomplete = await locationInput.getAttribute('autocomplete');
        expect(autocomplete).toMatch(/(address|street|postal|country)/);
      }

      // Test postal code input
      const postalInput = page.locator('[data-testid*="postal"], input[name*="postal"], input[name*="zip"]');

      if (await postalInput.isVisible()) {
        await postalInput.fill('80331'); // Munich postal code

        const postalValue = await postalInput.inputValue();
        expect(postalValue).toMatch(/^\d{5}$/); // German postal code format
      }
    });

  });

  mobileTest.describe('Performance and Responsiveness', () => {

    mobileTest('Touch response time meets German expectations', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const buttons = await page.locator('button, [role="button"]').all();

      for (const button of buttons.slice(0, 3)) {
        const startTime = Date.now();
        await button.click();
        const responseTime = Date.now() - startTime;

        // German users expect immediate visual feedback
        expect(responseTime).toBeLessThan(100);
      }
    });

    mobileTest('Smooth scrolling and animation performance', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Test smooth scrolling
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      });

      await page.waitForTimeout(500);

      const scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeGreaterThan(400); // Should have scrolled smoothly

      // Test animation performance
      const animatedElements = await page.locator('[data-testid*="animated"], .animated, [style*="transition"]').count();

      if (animatedElements > 0) {
        // Animations should not cause layout thrashing
        const performanceEntries = await page.evaluate(() => {
          return performance.getEntriesByType('measure').length;
        });

        // Should not have excessive performance measures indicating problems
        expect(performanceEntries).toBeLessThan(50);
      }
    });

  });

});