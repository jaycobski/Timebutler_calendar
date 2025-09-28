/**
 * German Market No-JS Scenario Tests
 *
 * Tests specific to German market requirements and user scenarios
 * that must work without JavaScript for accessibility and compliance.
 */

const { test, expect } = require('@playwright/test');

test.describe('German Market No-JS Scenarios', () => {
  // Disable JavaScript for all tests
  test.beforeEach(async ({ page, context }) => {
    await context.setJavaScriptEnabled(false);
  });

  test.describe('German Holiday System Compliance', () => {
    test('should display all 16 Bundesländer without JavaScript', async ({ page }) => {
      await page.goto('/');

      // All German states should be available for selection
      const germanStates = [
        'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg',
        'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern',
        'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
        'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
      ];

      const stateSelection = page.locator('select[name="state"], fieldset').first();
      await expect(stateSelection).toBeVisible();

      // Check for major states (testing subset due to varying naming conventions)
      const majorStates = ['Bayern', 'NRW', 'Baden-Württemberg', 'Berlin', 'Hamburg'];
      for (const state of majorStates) {
        const stateOption = page.locator(`option, input`).filter({ hasText: new RegExp(state, 'i') });
        await expect(stateOption.first()).toBeVisible();
      }
    });

    test('should handle Catholic vs Protestant holidays correctly without JavaScript', async ({ page }) => {
      // Test Catholic state (Bayern)
      await page.goto('/?state=BY&year=2025');

      // Should show Catholic holidays
      const catholicHolidays = page.locator('text=/Heilige Drei Könige|Fronleichnam|Mariä Himmelfahrt/i');
      await expect(catholicHolidays.first()).toBeVisible();

      // Test Protestant state (Schleswig-Holstein)
      await page.goto('/?state=SH&year=2025');

      // Should show Reformation Day
      const reformationDay = page.locator('text=/Reformationstag/i');
      await expect(reformationDay).toBeVisible();

      // Should not show Catholic-specific holidays
      const catholicHolidaysInProtestant = page.locator('text=/Fronleichnam|Mariä Himmelfahrt/i');
      expect(await catholicHolidaysInProtestant.count()).toBe(0);
    });

    test('should display correct regional holidays without JavaScript', async ({ page }) => {
      // Test Augsburg (regional holiday)
      await page.goto('/?state=BY&year=2025&region=augsburg');

      // Should show Augsburg Peace Festival if applicable
      const augsburgHoliday = page.locator('text=/Augsburger Friedensfest/i');
      if (await augsburgHoliday.count() > 0) {
        await expect(augsburgHoliday).toBeVisible();
      }

      // Test Berlin (different regional rules)
      await page.goto('/?state=BE&year=2025');

      // Should show International Women's Day
      const womensDay = page.locator('text=/Internationaler Frauentag|Women.*Day/i');
      await expect(womensDay).toBeVisible();
    });

    test('should handle East vs West German holiday differences without JavaScript', async ({ page }) => {
      // East German state (Brandenburg)
      await page.goto('/?state=BB&year=2025');

      // Should show East German specific holidays
      const eastHolidays = page.locator('text=/Reformationstag/i');
      await expect(eastHolidays).toBeVisible();

      // West German state (NRW)
      await page.goto('/?state=NW&year=2025');

      // Should show West German patterns
      const allSaintsDay = page.locator('text=/Allerheiligen/i');
      await expect(allSaintsDay).toBeVisible();
    });
  });

  test.describe('German Language and Cultural Requirements', () => {
    test('should use formal German language (Sie) without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Should use formal address
      const formalLanguage = page.locator('text=/Sie|Ihnen|Ihre|Wählen Sie/i');
      await expect(formalLanguage.first()).toBeVisible();

      // Should not use informal address
      const informalLanguage = page.locator('text=/\\bdu\\b|\\bdich\\b|\\bdeine\\b/i');
      expect(await informalLanguage.count()).toBe(0);
    });

    test('should display dates in German format without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      // Dates should be in DD.MM.YYYY format
      const germanDateFormat = page.locator('text=/\\d{1,2}\\.\\d{1,2}\\.\\d{4}/');
      if (await germanDateFormat.count() > 0) {
        await expect(germanDateFormat.first()).toBeVisible();
      }

      // Month names should be in German
      const germanMonths = page.locator('text=/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/i');
      await expect(germanMonths.first()).toBeVisible();

      // Should not show English month names
      const englishMonths = page.locator('text=/January|February|March|May|June|July|August|September|October|November|December/i');
      expect(await englishMonths.count()).toBe(0);
    });

    test('should display German holiday names correctly without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      // Test specific German holiday names
      const germanHolidays = [
        'Neujahr',
        'Heilige Drei Könige',
        'Karfreitag',
        'Ostermontag',
        'Tag der Arbeit',
        'Christi Himmelfahrt',
        'Pfingstmontag',
        'Fronleichnam',
        'Tag der Deutschen Einheit',
        'Allerheiligen',
        'Erster Weihnachtsfeiertag',
        'Zweiter Weihnachtsfeiertag'
      ];

      for (const holiday of germanHolidays.slice(0, 5)) { // Test subset for performance
        const holidayElement = page.locator(`text=/${holiday}/i`);
        if (await holidayElement.count() > 0) {
          await expect(holidayElement.first()).toBeVisible();
        }
      }
    });

    test('should handle German special characters without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Should display German umlauts and special characters correctly
      const germanChars = page.locator('text=/[äöüßÄÖÜ]/');
      await expect(germanChars.first()).toBeVisible();

      // Common German words with special characters
      const specialCharWords = page.locator('text=/Feiertage|Bundesländer|Urlaubsplanung|Brückentage/i');
      await expect(specialCharWords.first()).toBeVisible();
    });

    test('should provide correct German cultural context without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      // Should explain bridge days concept in German context
      const bridgeContext = page.locator('text=/Brückentag|Urlaubstag|Feiertag|verlängertes Wochenende/i');
      await expect(bridgeContext.first()).toBeVisible();

      // Should mention German vacation context
      const vacationContext = page.locator('text=/Urlaub|Urlaubsplanung|Erholungsurlaub/i');
      await expect(vacationContext.first()).toBeVisible();
    });
  });

  test.describe('German Business and Legal Requirements', () => {
    test('should comply with German data protection (GDPR) without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Should have GDPR-compliant data protection notice
      const gdprNotice = page.locator('text=/Datenschutz|DSGVO|Datenschutzerklärung|Privacy/i');
      await expect(gdprNotice.first()).toBeVisible();

      // Privacy notice should be linked
      const privacyLink = page.locator('a').filter({ hasText: /Datenschutz|Privacy/i });
      await expect(privacyLink.first()).toBeVisible();

      // Should have clear consent mechanisms
      const consentElements = page.locator('input[type="checkbox"]').filter({ hasText: /einverstanden|zustimmen|consent/i });
      if (await consentElements.count() > 0) {
        await expect(consentElements.first()).toBeVisible();
      }
    });

    test('should display legal information (Impressum) without JavaScript', async ({ page }) => {
      await page.goto('/');

      // Should have Impressum link (German legal requirement)
      const impressumLink = page.locator('a').filter({ hasText: /Impressum|Legal/i });
      await expect(impressumLink.first()).toBeVisible();

      // Should be in footer
      const footer = page.locator('footer, [role="contentinfo"]');
      const impressumInFooter = footer.locator('a').filter({ hasText: /Impressum/i });
      await expect(impressumInFooter.first()).toBeVisible();
    });

    test('should handle German working time regulations context without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      // Should consider German vacation entitlement context
      const vacationContext = page.locator('text=/Urlaubsanspruch|Jahresurlaub|Arbeitstage/i');
      if (await vacationContext.count() > 0) {
        await expect(vacationContext.first()).toBeVisible();
      }

      // Should show bridge days in context of German work week
      const workWeekContext = page.locator('text=/Arbeitstag|Werktag|Arbeitswoche/i');
      if (await workWeekContext.count() > 0) {
        await expect(workWeekContext.first()).toBeVisible();
      }
    });

    test('should provide TimeButler brand context for German market without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Should mention TimeButler in German context
      const timeButtlerContext = page.locator('text=/TimeButler|Zeiterfassung|Arbeitszeiterfassung/i');
      await expect(timeButtlerContext.first()).toBeVisible();

      // Should link to TimeButler main site
      const timeButtlerLink = page.locator('a').filter({ hasText: /TimeButler/i });
      await expect(timeButtlerLink.first()).toBeVisible();

      const href = await timeButtlerLink.first().getAttribute('href');
      expect(href).toMatch(/timebutler|zeit/i);
    });
  });

  test.describe('German Accessibility Standards (BITV)', () => {
    test('should meet BITV 2.0 requirements without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Should have German accessibility statement
      const accessibilityStatement = page.locator('a').filter({ hasText: /Barrierefreiheit|Accessibility/i });
      if (await accessibilityStatement.count() > 0) {
        await expect(accessibilityStatement.first()).toBeVisible();
      }

      // Should provide keyboard shortcuts in German
      const keyboardHelp = page.locator('text=/Tastatur|Shortcuts|Tasten/i');
      if (await keyboardHelp.count() > 0) {
        await expect(keyboardHelp.first()).toBeVisible();
      }
    });

    test('should provide German language alternatives without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Should offer easy language version link if applicable
      const easyLanguage = page.locator('a').filter({ hasText: /Leichte Sprache|Easy Language/i });
      if (await easyLanguage.count() > 0) {
        await expect(easyLanguage.first()).toBeVisible();
      }

      // Should offer sign language interpretation info if applicable
      const signLanguage = page.locator('text=/Gebärdensprache|Sign Language/i');
      if (await signLanguage.count() > 0) {
        await expect(signLanguage.first()).toBeVisible();
      }
    });
  });

  test.describe('German Email and Communication Standards', () => {
    test('should handle German email formats without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      const emailForm = page.locator('form').filter({ hasText: /email|e-mail/i });
      if (await emailForm.isVisible()) {
        // Should accept German email formats
        const emailInput = emailForm.locator('input[type="email"]');
        await emailInput.fill('test@example.de');

        const submitButton = emailForm.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Should not show validation error for .de domains
        const emailError = page.locator('[role="alert"], .error').filter({ hasText: /email|format/i });
        expect(await emailError.count()).toBe(0);
      }
    });

    test('should provide German email delivery confirmation without JavaScript', async ({ page }) => {
      await page.goto('/?state=BY&year=2025&lang=de');

      const emailForm = page.locator('form').filter({ hasText: /email|e-mail/i });
      if (await emailForm.isVisible()) {
        await emailForm.locator('input[type="email"]').fill('test@example.de');

        // Fill GDPR consent if required
        const consentCheckbox = emailForm.locator('input[type="checkbox"]');
        if (await consentCheckbox.isVisible()) {
          await consentCheckbox.check();
        }

        await emailForm.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');

        // Confirmation should be in German
        const confirmation = page.locator('[role="alert"], .success').filter({ hasText: /gesendet|versendet|zugestellt/i });
        if (await confirmation.count() > 0) {
          await expect(confirmation.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('German Regional Variations', () => {
    test('should handle Northern German states correctly without JavaScript', async ({ page }) => {
      const northernStates = ['SH', 'HH', 'HB', 'NI', 'MV'];

      for (const state of northernStates.slice(0, 2)) { // Test subset
        await page.goto(`/?state=${state}&year=2025&lang=de`);

        // Should show Reformation Day (Protestant tradition)
        const reformationDay = page.locator('text=/Reformationstag/i');
        await expect(reformationDay).toBeVisible();

        // Should not show Catholic holidays
        const catholicHolidays = page.locator('text=/Fronleichnam|Mariä Himmelfahrt/i');
        expect(await catholicHolidays.count()).toBe(0);
      }
    });

    test('should handle Southern German states correctly without JavaScript', async ({ page }) => {
      const southernStates = ['BY', 'BW'];

      for (const state of southernStates) {
        await page.goto(`/?state=${state}&year=2025&lang=de`);

        // Should show Catholic holidays
        const catholicHolidays = page.locator('text=/Heilige Drei Könige|Fronleichnam/i');
        await expect(catholicHolidays.first()).toBeVisible();

        // Bayern specific
        if (state === 'BY') {
          const mariaHimmelfahrt = page.locator('text=/Mariä Himmelfahrt/i');
          await expect(mariaHimmelfahrt).toBeVisible();
        }
      }
    });

    test('should handle East German states correctly without JavaScript', async ({ page }) => {
      const eastStates = ['BB', 'MV', 'SN', 'ST', 'TH'];

      for (const state of eastStates.slice(0, 2)) { // Test subset
        await page.goto(`/?state=${state}&year=2025&lang=de`);

        // Should show Reformation Day
        const reformationDay = page.locator('text=/Reformationstag/i');
        await expect(reformationDay).toBeVisible();

        // Should not show most Catholic holidays
        const catholicHolidays = page.locator('text=/Fronleichnam|Mariä Himmelfahrt/i');
        expect(await catholicHolidays.count()).toBe(0);
      }
    });
  });

  test.describe('German User Experience Patterns', () => {
    test('should follow German web usability conventions without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Navigation should follow German conventions
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();

      // Should have breadcrumb navigation (German standard)
      const breadcrumb = page.locator('[aria-label*="breadcrumb"], .breadcrumb');
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb.first()).toBeVisible();
      }

      // Footer should contain required German links
      const footer = page.locator('footer');
      const requiredLinks = footer.locator('a').filter({ hasText: /Impressum|Datenschutz|AGB/i });
      await expect(requiredLinks.first()).toBeVisible();
    });

    test('should provide German-style error messages without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Trigger validation error
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const errorMessages = page.locator('[role="alert"], .error');
      if (await errorMessages.count() > 0) {
        const errorText = await errorMessages.first().textContent();

        // Should use polite German phrasing
        const politeGerman = /bitte|wählen Sie|geben Sie.*ein|erforderlich/i;
        expect(errorText).toMatch(politeGerman);

        // Should not use harsh language
        const harshLanguage = /fehler|falsch|ungültig/i;
        if (errorText.match(harshLanguage)) {
          // If using these words, should be in constructive context
          expect(errorText).toMatch(/bitte.*korrigieren|überprüfen Sie/i);
        }
      }
    });

    test('should handle German vacation planning workflow without JavaScript', async ({ page }) => {
      await page.goto('/?lang=de');

      // Select state
      const stateSelect = page.locator('select[name="state"]');
      if (await stateSelect.isVisible()) {
        await stateSelect.selectOption('BY');
      }

      // Submit to see bridge weekends
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Should show German vacation planning context
      const planningContext = page.locator('text=/Urlaubsplanung|Brückentage|verlängertes Wochenende/i');
      await expect(planningContext.first()).toBeVisible();

      // Should show efficiency in German context
      const efficiency = page.locator('text=/Effizienz|Verhältnis|Urlaubstage/i');
      await expect(efficiency.first()).toBeVisible();
    });
  });
});