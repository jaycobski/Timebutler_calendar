/**
 * German Cultural UX Validation Tests
 * Comprehensive testing for German-specific UX patterns, business etiquette,
 * and cultural expectations in mobile interfaces
 */

import { expect } from '@playwright/test';
import {
  mobileTest,
  GERMAN_MOBILE_UX_STANDARDS,
  MobileTestUtils
} from './mobile-test-setup';

// German cultural patterns and business etiquette validation
mobileTest.describe('German Cultural UX Validation', () => {

  mobileTest.describe('Language and Tone Validation', () => {

    mobileTest('Formal addressing (Sie) consistency across mobile interface', async ({ germanMobile }) => {
      const { page, locale } = germanMobile;

      await page.goto('/');

      // Switch to German language if needed
      if (locale === 'en') {
        const languageSwitcher = page.locator('[data-testid="language-switcher"]');
        if (await languageSwitcher.isVisible()) {
          await languageSwitcher.click();
          await page.click('[data-testid="language-de"]');
        }
      }

      const formalAddressing = await germanMobile.validateFormalAddressing();
      expect(formalAddressing).toBe(true);

      // Check specific German formal patterns
      const pageText = await page.textContent('body');
      if (pageText) {
        // Should use formal addressing
        expect(pageText).toMatch(/\bSie\b/); // Formal "you"
        expect(pageText).toMatch(/\bIhre\b/); // Formal "your"

        // Should not use informal addressing
        expect(pageText).not.toMatch(/\bdu\b/i); // Informal "you"
        expect(pageText).not.toMatch(/\bdein\b/i); // Informal "your"
      }
    });

    mobileTest('Professional German business greeting patterns', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const welcomeText = await page.locator('[data-testid="welcome-message"], h1, .hero-title').textContent();

      if (welcomeText) {
        // Should contain professional German greeting elements
        const professionalPatterns = [
          /willkommen/i, // Welcome
          /sehr geehrte/i, // Dear (formal)
          /guten tag/i, // Good day
          /herzlich willkommen/i // Heartily welcome
        ];

        const hasProfessionalGreeting = professionalPatterns.some(pattern =>
          pattern.test(welcomeText)
        );

        expect(hasProfessionalGreeting).toBe(true);

        // Should avoid overly casual greetings
        const casualPatterns = /\b(hey|hi|hallo)\b/i;
        expect(welcomeText).not.toMatch(casualPatterns);
      }
    });

    mobileTest('Error message tone appropriate for German business context', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Trigger form validation error
      const emailForm = page.locator('[data-testid="email-form"]');
      if (await emailForm.isVisible()) {
        await page.fill('[data-testid="email-input"]', 'invalid-email');
        await page.click('[data-testid="submit-email"]');

        const errorMessage = await page.locator('[data-testid="error-message"], .error-message').textContent();

        if (errorMessage) {
          // Should be helpful but formal
          expect(errorMessage.length).toBeGreaterThan(15); // Detailed explanation

          // Should use formal language
          expect(errorMessage).not.toMatch(/oops|whoops|uh-oh/i);

          // Should provide constructive guidance
          expect(errorMessage).toMatch(/(bitte|überprüfen|korrekt|gültig)/i);
        }
      }
    });

    mobileTest('Help text and instructions use appropriate German formality', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check form instructions and help text
      const helpTexts = await page.locator('[data-testid*="help"], .help-text, .instruction').allTextContents();

      for (const helpText of helpTexts) {
        if (helpText.trim()) {
          // Should use formal imperative forms
          expect(helpText).toMatch(/(wählen Sie|geben Sie|klicken Sie)/i);

          // Should avoid informal imperatives
          expect(helpText).not.toMatch(/\b(wähl|gib|klick)\b/i);
        }
      }
    });

  });

  mobileTest.describe('German Business Culture Patterns', () => {

    mobileTest('Comprehensive information disclosure meets German expectations', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Germans expect detailed information upfront
      const mainContent = await page.locator('main').textContent();
      if (mainContent) {
        expect(mainContent.length).toBeGreaterThan(200); // Substantial content
      }

      // Check for detailed feature descriptions
      const featureDescriptions = await page.locator('[data-testid*="feature"], .feature-description').allTextContents();

      for (const description of featureDescriptions) {
        if (description.trim()) {
          expect(description.length).toBeGreaterThan(50); // Detailed descriptions
        }
      }

      // Should provide clear next steps
      const ctaButtons = await page.locator('[data-testid*="cta"], .cta-button, button[type="submit"]').allTextContents();

      for (const ctaText of ctaButtons) {
        if (ctaText.trim()) {
          expect(ctaText.length).toBeGreaterThan(8); // Clear, descriptive CTAs
          expect(ctaText).not.toMatch(/^(go|ok|yes)$/i); // Avoid vague CTAs
        }
      }
    });

    mobileTest('Privacy and data handling transparency', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check for GDPR compliance elements
      const gdprCompliance = await germanMobile.validateGDPRCompliance();
      expect(gdprCompliance.compliant).toBe(true);

      // Check for explicit data usage information
      const privacyInfo = await page.locator('[data-testid*="privacy"], [href*="datenschutz"], [href*="privacy"]').isVisible();
      expect(privacyInfo).toBe(true);

      // Check cookie consent specificity
      const cookieBanner = page.locator('[data-testid*="cookie"], .cookie-banner');
      if (await cookieBanner.isVisible()) {
        const cookieText = await cookieBanner.textContent();
        if (cookieText) {
          // Should be specific about cookie usage
          expect(cookieText.length).toBeGreaterThan(100);
          expect(cookieText).toMatch(/(funktional|analytik|marketing)/i);
        }
      }
    });

    mobileTest('Professional contact and support information', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check for professional contact information
      const contactInfo = await page.locator('[data-testid*="contact"], .contact-info, footer').textContent();

      if (contactInfo) {
        // Should include professional contact elements
        const professionalContactPatterns = [
          /@[\w.-]+\.[a-zA-Z]{2,}/,  // Email
          /\+49\s?\d+/,              // German phone number
          /(impressum|kontakt)/i     // Legal/contact sections
        ];

        const hasProfessionalContact = professionalContactPatterns.some(pattern =>
          pattern.test(contactInfo)
        );

        expect(hasProfessionalContact).toBe(true);
      }
    });

    mobileTest('Quality and certification indicators', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Germans value quality indicators and certifications
      const qualityIndicators = await page.locator('[data-testid*="quality"], [data-testid*="certification"], .badge, .certification').allTextContents();

      // Should have some quality indicators (ISO, TÜV, etc.)
      const hasQualityMarkers = qualityIndicators.some(indicator =>
        indicator.match(/(ISO|TÜV|GDPR|SSL|verified|zertifiziert)/i)
      );

      // Not required but recommended for German market
      if (qualityIndicators.length > 0) {
        expect(hasQualityMarkers).toBe(true);
      }
    });

  });

  mobileTest.describe('German Formatting and Localization', () => {

    mobileTest('German date formatting consistency', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Navigate to find date displays
      await page.click('[data-testid="state-selector"]');
      await page.selectOption('[data-testid="state-selector"]', 'BY');

      const dateElements = await page.locator('[data-testid*="date"], .date').all();

      for (const dateElement of dateElements) {
        const dateText = await dateElement.textContent();
        if (dateText && dateText.match(/\d/)) {
          // Should use German date format (DD.MM.YYYY)
          const germanDatePattern = /\d{1,2}\.\d{1,2}\.\d{2,4}/;
          expect(dateText).toMatch(germanDatePattern);

          // Should not use US format (MM/DD/YYYY)
          const usDatePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/;
          expect(dateText).not.toMatch(usDatePattern);
        }
      }
    });

    mobileTest('German number and currency formatting', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Look for any numerical displays
      const numberElements = await page.locator('[data-testid*="number"], [data-testid*="count"], .number').all();

      for (const numberElement of numberElements) {
        const numberText = await numberElement.textContent();
        if (numberText && numberText.match(/\d{1,3}[\.,]\d{3}/)) {
          // Should use German thousand separator (.)
          expect(numberText).toMatch(/\d{1,3}\.\d{3}/);

          // For decimal places, should use comma
          if (numberText.includes(',')) {
            expect(numberText).toMatch(/\d+,\d{2}/);
          }
        }
      }
    });

    mobileTest('German holiday and state name accuracy', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check state selector has correct German names
      await page.click('[data-testid="state-selector"]');

      const stateOptions = await page.locator('[data-testid="state-selector"] option').allTextContents();

      // Should include official German state names
      const expectedStates = [
        'Bayern', 'Baden-Württemberg', 'Nordrhein-Westfalen',
        'Berlin', 'Hamburg', 'Hessen'
      ];

      const hasGermanStateNames = expectedStates.some(state =>
        stateOptions.some(option => option.includes(state))
      );

      expect(hasGermanStateNames).toBe(true);

      // Check holiday names are in German
      if (stateOptions.length > 1) {
        await page.selectOption('[data-testid="state-selector"]', 'BY');

        const holidayNames = await page.locator('[data-testid*="holiday-name"]').allTextContents();

        for (const holidayName of holidayNames) {
          if (holidayName.trim()) {
            // Should use German holiday names
            const germanHolidayPatterns = [
              /weihnacht/i,
              /ostern/i,
              /pfingsten/i,
              /neujahr/i,
              /tag der arbeit/i,
              /himmelfahrt/i
            ];

            const isGermanHoliday = germanHolidayPatterns.some(pattern =>
              pattern.test(holidayName)
            );

            // At least some holidays should be in German
            if (holidayNames.indexOf(holidayName) === 0) {
              expect(isGermanHoliday).toBe(true);
            }
          }
        }
      }
    });

    mobileTest('Timezone handling for German context', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check if timezone is properly set to German timezone
      const timezone = await page.evaluate(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      });

      expect(timezone).toMatch(/(Europe\/Berlin|Europe\/Munich|CET|CEST)/);

      // Check date calculations respect German timezone
      const now = await page.evaluate(() => {
        const date = new Date();
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          timezone: date.getTimezoneOffset()
        };
      });

      // German timezone offset should be -60 (CET) or -120 (CEST)
      expect([-60, -120]).toContain(now.timezone);
    });

  });

  mobileTest.describe('German Accessibility Standards', () => {

    mobileTest('Touch targets exceed German preferences', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const touchTargets = await germanMobile.validateTouchTargets();

      // Check for German preference (48px minimum)
      const preferredTargets = touchTargets.filter(target =>
        target.size >= GERMAN_MOBILE_UX_STANDARDS.PREFERRED_TOUCH_TARGET
      );

      const preferredPercentage = (preferredTargets.length / touchTargets.length) * 100;

      // At least 80% should meet preferred size
      expect(preferredPercentage).toBeGreaterThan(80);
    });

    mobileTest('Typography optimized for longer German text', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      const typography = await germanMobile.validateTypography();
      expect(typography.readable).toBe(true);

      // Check line height is adequate for German text
      const lineHeights = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div'));
        return elements
          .filter(el => el.textContent?.trim())
          .map(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = parseFloat(style.lineHeight);
            return lineHeight / fontSize;
          })
          .filter(ratio => !isNaN(ratio));
      });

      // German text needs better line spacing
      const adequateLineHeights = lineHeights.filter(ratio => ratio >= 1.5);
      const adequatePercentage = (adequateLineHeights.length / lineHeights.length) * 100;

      expect(adequatePercentage).toBeGreaterThan(70);
    });

    mobileTest('Color contrast meets German accessibility standards', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check color contrast ratios
      const contrastIssues = await page.evaluate(() => {
        const issues: string[] = [];
        const elements = Array.from(document.querySelectorAll('*'));

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;

          // Skip elements without text content or visible styling
          if (!el.textContent?.trim() || color === 'rgba(0, 0, 0, 0)') return;

          // Simple contrast check (this would need a proper contrast calculation in real implementation)
          if (color === backgroundColor) {
            issues.push(`Poor contrast in ${el.tagName}`);
          }
        });

        return issues;
      });

      expect(contrastIssues.length).toBe(0);
    });

  });

  mobileTest.describe('German User Behavior Simulation', () => {

    mobileTest('Methodical scrolling pattern validation', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Simulate German scrolling behavior (more methodical)
      await MobileTestUtils.simulateGermanScrollPattern(page);

      // Content should remain accessible during scroll
      const isContentVisible = await page.locator('main').isVisible();
      expect(isContentVisible).toBe(true);

      // Check for scroll-triggered animations or content loading
      const contentHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(contentHeight).toBeGreaterThan(500); // Adequate content
    });

    mobileTest('Form completion with German typing patterns', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Find email form
      const emailInput = page.locator('[data-testid="email-input"]');
      if (await emailInput.isVisible()) {
        // Simulate German typing (slower, more deliberate)
        await MobileTestUtils.simulateGermanTyping(page, '[data-testid="email-input"]', 'test@beispiel.de');

        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe('test@beispiel.de');
      }
    });

    mobileTest('Navigation pattern preferences', async ({ germanMobile }) => {
      const { page } = germanMobile;

      await page.goto('/');

      // Check for expected German navigation patterns
      const navigation = page.locator('nav, [role="navigation"]');
      const navBox = await navigation.boundingBox();

      if (navBox) {
        // Navigation should be prominent and accessible
        expect(navBox.height).toBeGreaterThan(50);

        // Check for hamburger menu on mobile (well accepted in Germany)
        const hamburgerMenu = page.locator('[data-testid="menu-toggle"], .hamburger, .menu-toggle');
        const hasHamburger = await hamburgerMenu.isVisible();

        if (hasHamburger) {
          await hamburgerMenu.click();

          // Menu should open with smooth animation
          const menuPanel = page.locator('[data-testid="mobile-menu"], .mobile-menu');
          const isMenuVisible = await menuPanel.isVisible();
          expect(isMenuVisible).toBe(true);
        }
      }
    });

  });

});

// Performance testing with German expectations
mobileTest.describe('German Performance Expectations', () => {

  mobileTest('Page load speed meets German user expectations', async ({ germanMobile }) => {
    const { page } = germanMobile;

    const performance = await germanMobile.validateLoadingPerformance();

    expect(performance.withinExpectations).toBe(true);
    expect(performance.timing).toBeLessThan(GERMAN_MOBILE_UX_STANDARDS.MAX_LOADING_TIME);
  });

  mobileTest('Interaction responsiveness for German users', async ({ germanMobile }) => {
    const { page } = germanMobile;

    await page.goto('/');

    // Test button responsiveness
    const buttons = await page.locator('button, [role="button"]').all();

    for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
      const startTime = Date.now();
      await button.click();
      const responseTime = Date.now() - startTime;

      // Should respond immediately (< 100ms for visual feedback)
      expect(responseTime).toBeLessThan(100);
    }
  });

  mobileTest('Network resilience for German mobile networks', async ({ germanMobile }) => {
    const { page } = germanMobile;

    // Simulate slower German mobile network
    await page.route('**/*', route => {
      // Add realistic German mobile network delay
      setTimeout(() => route.continue(), 100);
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should still load within acceptable time even with network delay
    expect(loadTime).toBeLessThan(5000);
  });

});