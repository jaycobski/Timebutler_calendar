/**
 * Email Delivery Testing Scenarios
 * Constitutional Requirements:
 * - Email delivery < 5 seconds from submission to inbox
 * - German/English template validation
 * - Calendar attachment testing
 * - Professional branding verification
 * - GDPR compliance validation
 */

import { test, expect, Page } from '@playwright/test';
import {
  testEmailTemplate,
  interceptEmailDelivery,
  getSentEmails,
  clearSentEmails,
  testEmailDeliveryPerformance
} from '../helpers/email-test-helper';
import { getTestUsers } from '../helpers/test-data-helper';
import { runCompleteAccessibilityTest } from '../helpers/accessibility-helper';

test.describe('Email Delivery Testing', () => {
  const testUsers = getTestUsers();

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Clear any previous emails
    clearSentEmails();
  });

  test.afterEach(() => {
    // Clean up after each test
    clearSentEmails();
  });

  test('German Professional Email Template Delivery', async ({ page }) => {
    const germanUser = testUsers.find(u => u.id === 'bavaria_catholic_efficient')!;

    await test.step('Complete vacation planning flow', async () => {
      // Set up vacation plan
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('30');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Select some bridge weekends
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const checkbox = bridgeItems.nth(i).locator('input[type="checkbox"]');
          if (await checkbox.isVisible()) {
            await checkbox.check();
          }
        }
      }
    });

    await test.step('Submit email request and validate delivery', async () => {
      const emailInput = page.locator('[data-testid="email-input"]').or(
        page.locator('input[type="email"]')
      );
      await emailInput.fill(germanUser.email);

      // GDPR consent
      const gdprConsent = page.locator('[data-testid="gdpr-consent"]').or(
        page.locator('input[name="gdprConsent"]')
      );
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      // Track email submission time
      const submissionStart = Date.now();

      const submitButton = page.locator('[data-testid="submit-vacation-plan"]').or(
        page.locator('button').filter({ hasText: /senden|send/i })
      );
      await submitButton.click();

      // Wait for success confirmation
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

      const submissionEnd = Date.now();
      const deliveryTime = submissionEnd - submissionStart;

      // Constitutional requirement: email delivery < 5 seconds
      expect(deliveryTime).toBeLessThan(5000);

      // Verify email was sent (mock validation)
      const sentEmails = getSentEmails();
      expect(sentEmails.length).toBeGreaterThan(0);

      const germanEmail = sentEmails.find(email => email.to === germanUser.email);
      expect(germanEmail).toBeTruthy();

      if (germanEmail) {
        // Validate German content
        expect(germanEmail.subject).toMatch(/brückentag|urlaubsplan/i);
        expect(germanEmail.html).toMatch(/sehr geehrte|urlaubstag|feiertag/i);
        expect(germanEmail.text).toMatch(/sehr geehrte|urlaubstag|feiertag/i);

        // Validate TimeButler branding
        expect(germanEmail.html).toMatch(/timebutler/i);
        expect(germanEmail.text).toMatch(/timebutler/i);

        // Validate GDPR compliance
        expect(germanEmail.html).toMatch(/dsgvo|90 tag|gelöscht/i);
        expect(germanEmail.text).toMatch(/dsgvo|90 tag|gelöscht/i);

        // Validate calendar attachment
        expect(germanEmail.attachments).toBeTruthy();
        expect(germanEmail.attachments.length).toBeGreaterThan(0);

        const calendarAttachment = germanEmail.attachments.find(att =>
          att.filename?.endsWith('.ics') || att.contentType === 'text/calendar'
        );
        expect(calendarAttachment).toBeTruthy();
      }
    });
  });

  test('English Casual Email Template Delivery', async ({ page }) => {
    const englishUser = testUsers.find(u => u.id === 'international_balanced')!;

    await test.step('Switch to English and complete flow', async () => {
      // Switch language if available
      const languageToggle = page.locator('[data-testid="language-toggle"]').or(
        page.locator('button').filter({ hasText: /english|en/i })
      );

      if (await languageToggle.isVisible()) {
        await languageToggle.click();
        await page.waitForTimeout(1000);
      }

      // Complete vacation planning
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('NW');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('28');

      const generateButton = page.locator('button').filter({ hasText: /calculate|generate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Select bridge weekends
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      if (count > 0) {
        const checkbox = bridgeItems.first().locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.check();
        }
      }
    });

    await test.step('Submit and validate English email', async () => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(englishUser.email);

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /send|submit/i });
      await submitButton.click();

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

      // Validate English email
      const sentEmails = getSentEmails();
      const englishEmail = sentEmails.find(email => email.to === englishUser.email);
      expect(englishEmail).toBeTruthy();

      if (englishEmail) {
        // Validate English content
        expect(englishEmail.subject).toMatch(/bridge.*day|vacation|holiday/i);
        expect(englishEmail.html).toMatch(/hi|dear|vacation|holiday/i);
        expect(englishEmail.text).toMatch(/hi|dear|vacation|holiday/i);

        // Should still have TimeButler branding
        expect(englishEmail.html).toMatch(/timebutler/i);

        // Should have GDPR compliance in English
        expect(englishEmail.html).toMatch(/gdpr|90 day|deleted|data/i);

        // Validate responsive design
        expect(englishEmail.html).toMatch(/viewport.*width=device-width/i);
        expect(englishEmail.html).toMatch(/max-width.*600/i);
      }
    });
  });

  test('Calendar Attachment Validation', async ({ page }) => {
    const testUser = testUsers.find(u => u.id === 'bavaria_catholic_efficient')!;

    await test.step('Generate vacation plan with multiple bridges', async () => {
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const religiousToggle = page.locator('input[name="includeReligiousHolidays"]');
      if (await religiousToggle.isVisible()) {
        await religiousToggle.check();
      }

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Select multiple bridge weekends for comprehensive calendar
      const bridgeItems = page.locator('[data-testid="bridge-weekend-item"]');
      const count = await bridgeItems.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const checkbox = bridgeItems.nth(i).locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
          await checkbox.check();
        }
      }
    });

    await test.step('Submit and validate calendar attachment', async () => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUser.email);

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

      // Validate calendar attachment details
      const sentEmails = getSentEmails();
      const email = sentEmails.find(e => e.to === testUser.email);
      expect(email).toBeTruthy();

      if (email && email.attachments) {
        const calendarAttachment = email.attachments.find(att =>
          att.filename?.endsWith('.ics') || att.contentType === 'text/calendar'
        );

        expect(calendarAttachment).toBeTruthy();

        if (calendarAttachment) {
          // Validate attachment properties
          expect(calendarAttachment.filename).toMatch(/\.ics$/);
          expect(calendarAttachment.contentType).toBe('text/calendar');
          expect(calendarAttachment.size).toBeGreaterThan(100); // Should have meaningful content
          expect(calendarAttachment.size).toBeLessThan(100000); // Should not be excessive

          // Validate iCal content structure (if available in mock)
          if (calendarAttachment.content) {
            expect(calendarAttachment.content).toMatch(/BEGIN:VCALENDAR/);
            expect(calendarAttachment.content).toMatch(/END:VCALENDAR/);
            expect(calendarAttachment.content).toMatch(/BEGIN:VEVENT/);
            expect(calendarAttachment.content).toMatch(/END:VEVENT/);
            expect(calendarAttachment.content).toMatch(/PRODID.*TimeButler/);
          }
        }
      }
    });
  });

  test('Email Validation and Error Handling', async ({ page }) => {
    await test.step('Test invalid email formats', async () => {
      // Complete basic vacation planning first
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        '@missing-local.com',
        'missing-at-sign.com',
        'spaces in@email.com',
        'missing.domain@',
        ''
      ];

      const emailInput = page.locator('input[type="email"]');

      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);

        const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
        await submitButton.click();

        // Should show validation error
        const errorMessage = page.locator('[data-testid="email-validation-error"]').or(
          page.locator('.error').filter({ hasText: /email/i })
        );

        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        // Clear error for next test
        await emailInput.fill('');
      }
    });

    await test.step('Test GDPR consent requirement', async () => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('valid@test.com');

      // Try to submit without GDPR consent
      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible() && await gdprConsent.isChecked()) {
        await gdprConsent.uncheck();
      }

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      // Should show GDPR consent error
      const gdprError = page.locator('[data-testid="gdpr-error"]').or(
        page.locator('.error').filter({ hasText: /dsgvo|gdpr|consent|zustimmung/i })
      );

      if (await gdprError.count() > 0) {
        await expect(gdprError).toBeVisible();
      } else {
        // If no explicit error, should not proceed to success
        const successMessage = page.locator('[data-testid="success-message"]');
        await expect(successMessage).not.toBeVisible({ timeout: 3000 });
      }
    });

    await test.step('Test successful submission after corrections', async () => {
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('valid@test.com');

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      // Should succeed
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test('Email Delivery Performance Testing', async ({ page }) => {
    await test.step('Test delivery performance under load', async () => {
      // Test multiple rapid email submissions
      const testEmails = [
        'performance1@test.com',
        'performance2@test.com',
        'performance3@test.com'
      ];

      for (const email of testEmails) {
        // Quick vacation plan setup
        const stateSelector = page.locator('select[name="state"]');
        await stateSelector.selectOption('BE');

        const vacationInput = page.locator('input[name="vacationDays"]');
        await vacationInput.fill('20');

        const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
        await generateButton.click();

        await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

        // Submit email
        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill(email);

        const gdprConsent = page.locator('input[name="gdprConsent"]');
        if (await gdprConsent.isVisible()) {
          await gdprConsent.check();
        }

        const deliveryStart = Date.now();

        const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
        await submitButton.click();

        await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

        const deliveryEnd = Date.now();
        const deliveryTime = deliveryEnd - deliveryStart;

        // Each delivery should be under constitutional requirement
        expect(deliveryTime).toBeLessThan(5000);

        // Reset for next test
        await page.reload();
      }

      // Verify all emails were delivered
      const sentEmails = getSentEmails();
      expect(sentEmails.length).toBeGreaterThanOrEqual(testEmails.length);

      for (const email of testEmails) {
        const delivered = sentEmails.find(e => e.to === email);
        expect(delivered).toBeTruthy();
      }
    });

    await test.step('Test email performance benchmarks', async () => {
      // Use helper to test systematic performance
      const performanceResults = await testEmailDeliveryPerformance(5);

      // Validate constitutional compliance
      expect(performanceResults.constitutionalCompliance).toBe(true);
      expect(performanceResults.averageDeliveryTime).toBeLessThan(3000); // Well under 5s
      expect(performanceResults.maxDeliveryTime).toBeLessThan(5000); // Constitutional requirement

      // All emails should be successful
      expect(performanceResults.results.every(r => r.delivered)).toBe(true);
    });
  });

  test('Email Template Accessibility', async ({ page, browserName }) => {
    await test.step('Test email form accessibility', async () => {
      // Complete vacation planning
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('BY');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Test email form accessibility
      const accessibilityResults = await runCompleteAccessibilityTest(page, {
        locale: 'de-DE',
        reportPath: `accessibility-reports/${browserName}-email-form.json`
      });

      expect(accessibilityResults.overallCompliance).toBe(true);

      // Verify form elements have proper labels
      const emailInput = page.locator('input[type="email"]');
      const emailLabel = await emailInput.getAttribute('aria-label') ||
                        await page.locator('label[for*="email"]').count() > 0;
      expect(emailLabel).toBeTruthy();

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        const gdprLabel = await gdprConsent.getAttribute('aria-label') ||
                         await page.locator('label[for*="gdpr"], label[for*="consent"]').count() > 0;
        expect(gdprLabel).toBeTruthy();
      }

      // Test keyboard navigation
      await emailInput.focus();
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBe(1);
    });
  });

  test('Cross-Browser Email Functionality', async ({ page, browserName }) => {
    await test.step(`Test email delivery in ${browserName}`, async () => {
      // Complete standard flow
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('NW');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('25');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Select a bridge weekend
      const firstBridge = page.locator('[data-testid="bridge-weekend-item"]').first();
      const checkbox = firstBridge.locator('input[type="checkbox"]');
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }

      // Submit email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(`${browserName.toLowerCase()}@test.com`);

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      // Should work consistently across browsers
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

      // Verify email was sent
      const sentEmails = getSentEmails();
      const browserEmail = sentEmails.find(e => e.to === `${browserName.toLowerCase()}@test.com`);
      expect(browserEmail).toBeTruthy();

      // Take screenshot for visual consistency
      await page.screenshot({
        path: `screenshots/${browserName}-email-success.png`,
        fullPage: false
      });
    });
  });

  test('Email Security and Privacy Validation', async ({ page }) => {
    await test.step('Test email data privacy', async () => {
      const testUser = testUsers.find(u => u.id === 'accessibility_user')!;

      // Complete vacation planning
      const stateSelector = page.locator('select[name="state"]');
      await stateSelector.selectOption('HH');

      const vacationInput = page.locator('input[name="vacationDays"]');
      await vacationInput.fill('26');

      const generateButton = page.locator('button').filter({ hasText: /berechnen|calculate/i });
      await generateButton.click();

      await page.waitForSelector('[data-testid="bridge-weekend-results"]', { timeout: 10000 });

      // Submit email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(testUser.email);

      const gdprConsent = page.locator('input[name="gdprConsent"]');
      if (await gdprConsent.isVisible()) {
        await gdprConsent.check();
      }

      const submitButton = page.locator('button').filter({ hasText: /senden|send/i });
      await submitButton.click();

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 15000 });

      // Verify email contains GDPR compliance
      const sentEmails = getSentEmails();
      const email = sentEmails.find(e => e.to === testUser.email);

      expect(email).toBeTruthy();

      if (email) {
        // Check for GDPR compliance statements
        const htmlContent = email.html.toLowerCase();
        const textContent = email.text.toLowerCase();

        // Should mention data deletion
        expect(htmlContent).toMatch(/90 tag|90 day|gelöscht|deleted/);
        expect(textContent).toMatch(/90 tag|90 day|gelöscht|deleted/);

        // Should mention GDPR/DSGVO
        expect(htmlContent).toMatch(/dsgvo|gdpr/);
        expect(textContent).toMatch(/dsgvo|gdpr/);

        // Should not contain sensitive personal data beyond email
        expect(htmlContent).not.toMatch(/password|ssn|bank|credit/i);
        expect(textContent).not.toMatch(/password|ssn|bank|credit/i);

        // Should have proper unsubscribe or data deletion info
        expect(htmlContent).toMatch(/timebutler\.de|contact|data.*deletion/i);
      }
    });
  });
});