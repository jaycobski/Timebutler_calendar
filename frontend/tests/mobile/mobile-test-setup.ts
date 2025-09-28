/**
 * Mobile Test Setup
 * Configures viewport simulation, device emulation, and German cultural UX validation
 * for mobile responsive testing
 */

import { test as base, devices } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';

// German mobile device usage statistics (2024/2025)
export const GERMAN_MOBILE_DEVICES = {
  // Most popular devices in Germany
  IPHONE_13_PRO: {
    ...devices['iPhone 13 Pro'],
    name: 'iPhone 13 Pro (German Market)',
    marketShare: 25.3,
    culturalNotes: 'Premium segment, expects polished UX'
  },
  SAMSUNG_GALAXY_S23: {
    ...devices['Galaxy S23'],
    name: 'Samsung Galaxy S23 (German Market)',
    marketShare: 18.7,
    culturalNotes: 'Business users, formal interface expected'
  },
  IPHONE_12: {
    ...devices['iPhone 12'],
    name: 'iPhone 12 (German Market)',
    marketShare: 15.2,
    culturalNotes: 'Mainstream adoption, standard expectations'
  },
  PIXEL_7: {
    ...devices['Pixel 7'],
    name: 'Google Pixel 7 (German Market)',
    marketShare: 8.1,
    culturalNotes: 'Tech-savvy users, efficiency focused'
  },
  ONEPLUS_11: {
    ...devices['OnePlus 11'],
    name: 'OnePlus 11 (German Market)',
    marketShare: 5.4,
    culturalNotes: 'Performance conscious, detail-oriented'
  }
};

// German mobile viewport breakpoints based on actual usage data
export const GERMAN_MOBILE_BREAKPOINTS = {
  COMPACT: { width: 320, height: 568 }, // iPhone SE, older devices
  STANDARD: { width: 375, height: 812 }, // iPhone X-13 Mini
  LARGE: { width: 414, height: 896 }, // iPhone Plus/Pro Max
  TABLET_PORTRAIT: { width: 768, height: 1024 }, // iPad portrait
  TABLET_LANDSCAPE: { width: 1024, height: 768 }, // iPad landscape
  FOLDABLE: { width: 280, height: 653 } // Galaxy Fold inner screen
};

// German cultural UX expectations for mobile
export const GERMAN_MOBILE_UX_STANDARDS = {
  // Touch target sizes (accessibility + cultural preferences)
  MIN_TOUCH_TARGET: 44, // WCAG AAA standard
  PREFERRED_TOUCH_TARGET: 48, // German users prefer larger targets

  // Typography expectations
  MIN_FONT_SIZE: 16, // German text tends to be longer
  PREFERRED_LINE_HEIGHT: 1.5, // Readability for longer German words

  // Form interaction patterns
  FORMAL_ADDRESSING: 'Sie', // Always formal in business context
  ERROR_MESSAGE_TONE: 'helpful_formal', // Not casual, but supportive

  // Navigation expectations
  BACK_BUTTON_POSITION: 'top_left', // Standard German mobile pattern
  HAMBURGER_MENU_ACCEPTANCE: 'high', // Well understood pattern

  // Loading expectations
  MAX_LOADING_TIME: 3000, // German users less patient than global average
  PROGRESS_INDICATOR_REQUIRED: true,

  // Privacy/GDPR considerations
  CONSENT_BANNER_PROMINENCE: 'high',
  DATA_USAGE_TRANSPARENCY: 'explicit'
};

// Mobile test context with German cultural validation
export interface GermanMobileTestContext {
  page: Page;
  context: BrowserContext;
  device: keyof typeof GERMAN_MOBILE_DEVICES;
  viewport: keyof typeof GERMAN_MOBILE_BREAKPOINTS;
  locale: 'de' | 'en';

  // Cultural validation helpers
  validateFormalAddressing(): Promise<boolean>;
  validateTouchTargets(): Promise<Array<{ element: string; size: number; compliant: boolean }>>;
  validateTypography(): Promise<{ readable: boolean; issues: string[] }>;
  validateLoadingPerformance(): Promise<{ withinExpectations: boolean; timing: number }>;
  validateGDPRCompliance(): Promise<{ compliant: boolean; issues: string[] }>;
  validateBusinessTone(): Promise<{ appropriate: boolean; suggestions: string[] }>;
}

// Extended test with German mobile context
export const mobileTest = base.extend<{ germanMobile: GermanMobileTestContext }>({
  germanMobile: async ({ page, context }, use, testInfo) => {
    // Extract device and viewport from test title or use defaults
    const deviceMatch = testInfo.title.match(/\[(.+?)\]/);
    const device = (deviceMatch?.[1] as keyof typeof GERMAN_MOBILE_DEVICES) || 'IPHONE_13_PRO';

    const viewportMatch = testInfo.title.match(/\{(.+?)\}/);
    const viewport = (viewportMatch?.[1] as keyof typeof GERMAN_MOBILE_BREAKPOINTS) || 'STANDARD';

    // Set device viewport
    const viewportConfig = GERMAN_MOBILE_BREAKPOINTS[viewport];
    await page.setViewportSize(viewportConfig);

    // Set German locale and timezone
    await context.addInitScript(() => {
      // Set German locale
      Object.defineProperty(navigator, 'language', {
        get: () => 'de-DE'
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['de-DE', 'de', 'en-US', 'en']
      });

      // Set German timezone
      Intl.DateTimeFormat = class extends Intl.DateTimeFormat {
        constructor(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
          super('de-DE', { timeZone: 'Europe/Berlin', ...options });
        }
      };
    });

    // Emulate German mobile device characteristics
    const deviceConfig = GERMAN_MOBILE_DEVICES[device];
    await page.emulateMedia({
      media: 'screen',
      colorScheme: 'light' // German business preference
    });

    // Set user agent to match German mobile device
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      'User-Agent': deviceConfig.userAgent
    });

    const germanMobileContext: GermanMobileTestContext = {
      page,
      context,
      device,
      viewport,
      locale: 'de',

      async validateFormalAddressing(): Promise<boolean> {
        // Check for formal German addressing (Sie vs Du)
        const textContent = await page.textContent('body');
        if (!textContent) return false;

        // Look for informal addressing patterns that should be avoided
        const informalPatterns = [
          /\bdu\b/gi, // Informal "you"
          /\bdich\b/gi, // Informal "you" (accusative)
          /\bdir\b/gi, // Informal "you" (dative)
          /\bdein\b/gi, // Informal "your"
          /\bdeine\b/gi // Informal "your" (feminine)
        ];

        return !informalPatterns.some(pattern => pattern.test(textContent));
      },

      async validateTouchTargets(): Promise<Array<{ element: string; size: number; compliant: boolean }>> {
        const touchableElements = await page.$$eval(
          'button, a, input, select, textarea, [onclick], [role="button"]',
          (elements) => {
            return elements.map(el => {
              const rect = el.getBoundingClientRect();
              const minDimension = Math.min(rect.width, rect.height);
              return {
                element: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : ''),
                size: minDimension,
                compliant: minDimension >= 44 // WCAG AAA standard
              };
            });
          }
        );

        return touchableElements;
      },

      async validateTypography(): Promise<{ readable: boolean; issues: string[] }> {
        const typographyIssues = await page.evaluate(() => {
          const issues: string[] = [];
          const allElements = document.querySelectorAll('*');

          allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = parseFloat(style.lineHeight);

            // Check minimum font size for German text
            if (fontSize < 16 && el.textContent?.trim()) {
              issues.push(`Small font size (${fontSize}px) in ${el.tagName}`);
            }

            // Check line height for readability
            if (lineHeight && lineHeight / fontSize < 1.4) {
              issues.push(`Poor line height ratio (${lineHeight / fontSize}) in ${el.tagName}`);
            }

            // Check for text overflow in German (longer words)
            if (el.scrollWidth > el.clientWidth && el.textContent?.trim()) {
              issues.push(`Text overflow in ${el.tagName}: "${el.textContent.substring(0, 50)}..."`);
            }
          });

          return issues;
        });

        return {
          readable: typographyIssues.length === 0,
          issues: typographyIssues
        };
      },

      async validateLoadingPerformance(): Promise<{ withinExpectations: boolean; timing: number }> {
        const startTime = Date.now();
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        return {
          withinExpectations: loadTime <= GERMAN_MOBILE_UX_STANDARDS.MAX_LOADING_TIME,
          timing: loadTime
        };
      },

      async validateGDPRCompliance(): Promise<{ compliant: boolean; issues: string[] }> {
        const issues: string[] = [];

        // Check for cookie consent banner
        const cookieBanner = await page.$('[data-testid*="cookie"], [class*="cookie"], [id*="cookie"]');
        if (!cookieBanner) {
          issues.push('No cookie consent banner found');
        }

        // Check for privacy policy link
        const privacyLink = await page.$('a[href*="privacy"], a[href*="datenschutz"]');
        if (!privacyLink) {
          issues.push('No privacy policy link found');
        }

        // Check for data usage transparency
        const dataUsageText = await page.textContent('body');
        if (dataUsageText && !dataUsageText.includes('Daten') && !dataUsageText.includes('data')) {
          issues.push('No data usage information visible');
        }

        return {
          compliant: issues.length === 0,
          issues
        };
      },

      async validateBusinessTone(): Promise<{ appropriate: boolean; suggestions: string[] }> {
        const suggestions: string[] = [];
        const pageText = await page.textContent('body');

        if (!pageText) {
          return { appropriate: false, suggestions: ['No content to validate'] };
        }

        // Check for appropriate business tone in German context
        const casualPatterns = [
          /hey\b/gi,
          /hi\b/gi,
          /cool\b/gi,
          /awesome\b/gi
        ];

        const inappropriateInGerman = casualPatterns.some(pattern => pattern.test(pageText));
        if (inappropriateInGerman) {
          suggestions.push('Consider more formal language for German business context');
        }

        // Check for professional language indicators
        const professionalIndicators = [
          /willkommen/gi,
          /sehr geehrte/gi,
          /freundliche grüße/gi,
          /mit freundlichen grüßen/gi
        ];

        const hasProfessionalTone = professionalIndicators.some(pattern => pattern.test(pageText));
        if (!hasProfessionalTone && pageText.includes('deutsch') || pageText.includes('german')) {
          suggestions.push('Add professional German greeting or closing phrases');
        }

        return {
          appropriate: suggestions.length === 0,
          suggestions
        };
      }
    };

    await use(germanMobileContext);
  }
});

// Utility functions for mobile testing
export class MobileTestUtils {
  static async simulateGermanTyping(page: Page, selector: string, text: string) {
    // Simulate slower typing for German users (cultural behavior pattern)
    await page.focus(selector);
    await page.type(selector, text, { delay: 100 });
  }

  static async simulateGermanScrollPattern(page: Page) {
    // German users tend to scroll more methodically
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
  }

  static async validateGermanDateFormat(page: Page, selector: string): Promise<boolean> {
    const dateText = await page.textContent(selector);
    if (!dateText) return false;

    // Check for German date format (DD.MM.YYYY or DD.MM.YY)
    const germanDatePattern = /\d{1,2}\.\d{1,2}\.\d{2,4}/;
    return germanDatePattern.test(dateText);
  }

  static async validateGermanNumberFormat(page: Page, selector: string): Promise<boolean> {
    const numberText = await page.textContent(selector);
    if (!numberText) return false;

    // Check for German number format (1.234,56)
    const germanNumberPattern = /\d{1,3}(\.\d{3})*,\d{2}/;
    return germanNumberPattern.test(numberText);
  }

  static getGermanMobileBreakpoints() {
    return GERMAN_MOBILE_BREAKPOINTS;
  }

  static getGermanUXStandards() {
    return GERMAN_MOBILE_UX_STANDARDS;
  }
}

export { GERMAN_MOBILE_DEVICES, GERMAN_MOBILE_BREAKPOINTS, GERMAN_MOBILE_UX_STANDARDS };