/**
 * React Component Test Helpers for Frontend TDD Testing
 * Focus: Component behavior, accessibility, German UI/UX patterns
 * Constitutional Requirements: WCAG 2.1 Level AA compliance
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
// Faker functionality replaced with simple test data generators

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * German Locale Test Context Provider
 * Provides German translations and locale settings for components
 */
interface GermanTestProviderProps {
  children: React.ReactNode;
  language?: 'de' | 'en';
  state?: string;
}

export function GermanTestProvider({
  children,
  language = 'de',
  state = 'BY'
}: GermanTestProviderProps) {
  // Mock useTranslation hook context
  const mockTranslations = {
    de: {
      'common:title': 'Brückentage Optimizer',
      'common:subtitle': 'Maximiere deine freien Tage',
      'common:loading': 'Laden...',
      'common:error': 'Ein Fehler ist aufgetreten',
      'common:submit': 'Absenden',
      'common:cancel': 'Abbrechen',
      'common:close': 'Schließen',
      'states:BW': 'Baden-Württemberg',
      'states:BY': 'Bayern',
      'states:BE': 'Berlin',
      'states:NW': 'Nordrhein-Westfalen',
      'holidays:neujahr': 'Neujahr',
      'holidays:karfreitag': 'Karfreitag',
      'holidays:ostermontag': 'Ostermontag',
      'holidays:tag_der_arbeit': 'Tag der Arbeit',
      'holidays:christi_himmelfahrt': 'Christi Himmelfahrt',
      'holidays:pfingstmontag': 'Pfingstmontag',
      'holidays:tag_der_deutschen_einheit': 'Tag der Deutschen Einheit',
      'holidays:weihnachtstag': '1. Weihnachtstag',
      'holidays:zweiter_weihnachtstag': '2. Weihnachtstag',
      'form:state_label': 'Bundesland',
      'form:vacation_days_label': 'Verfügbare Urlaubstage',
      'form:email_label': 'E-Mail-Adresse',
      'form:required': 'Pflichtfeld',
      'email:subject': 'Ihre optimierte Brückentage-Planung',
      'gdpr:consent': 'Ich stimme der Datenverarbeitung zu',
      'gdpr:privacy_notice': 'Datenschutzerklärung',
      'bridge:efficiency': 'Effizienz',
      'bridge:days_off': 'Freie Tage',
      'bridge:vacation_needed': 'Urlaubstage benötigt'
    },
    en: {
      'common:title': 'Bridge Days Optimizer',
      'common:subtitle': 'Maximize your time off',
      'common:loading': 'Loading...',
      'common:error': 'An error occurred',
      'common:submit': 'Submit',
      'common:cancel': 'Cancel',
      'common:close': 'Close',
      'states:BW': 'Baden-Württemberg',
      'states:BY': 'Bavaria',
      'states:BE': 'Berlin',
      'states:NW': 'North Rhine-Westphalia',
      'holidays:neujahr': 'New Year\'s Day',
      'holidays:karfreitag': 'Good Friday',
      'holidays:ostermontag': 'Easter Monday',
      'holidays:tag_der_arbeit': 'Labour Day',
      'holidays:christi_himmelfahrt': 'Ascension Day',
      'holidays:pfingstmontag': 'Whit Monday',
      'holidays:tag_der_deutschen_einheit': 'German Unity Day',
      'holidays:weihnachtstag': 'Christmas Day',
      'holidays:zweiter_weihnachtstag': 'Boxing Day',
      'form:state_label': 'State',
      'form:vacation_days_label': 'Available vacation days',
      'form:email_label': 'Email address',
      'form:required': 'Required field',
      'email:subject': 'Your optimized bridge days plan',
      'gdpr:consent': 'I consent to data processing',
      'gdpr:privacy_notice': 'Privacy Policy',
      'bridge:efficiency': 'Efficiency',
      'bridge:days_off': 'Days off',
      'bridge:vacation_needed': 'Vacation days needed'
    }
  };

  // Create mock context
  const mockContext = {
    t: (key: string, variables?: Record<string, any>) => {
      let translation = mockTranslations[language][key as keyof typeof mockTranslations.de] || key;

      // Handle variable substitution
      if (variables) {
        Object.entries(variables).forEach(([variable, value]) => {
          translation = translation.replace(`{{${variable}}}`, value);
        });
      }

      return translation;
    },
    lang: language
  };

  return (
    <div data-testid="test-provider" data-language={language} data-state={state}>
      {children}
    </div>
  );
}

/**
 * Enhanced Render Function with German Context
 * Automatically provides German test environment
 */
export function renderWithGermanContext(
  ui: React.ReactElement,
  options: {
    language?: 'de' | 'en';
    state?: string;
    user?: any;
  } = {}
) {
  const { language = 'de', state = 'BY', user = userEvent.setup() } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <GermanTestProvider language={language} state={state}>
      {children}
    </GermanTestProvider>
  );

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options })
  };
}

/**
 * Accessibility Test Helper
 * Validates WCAG 2.1 Level AA compliance
 */
export class AccessibilityTestHelper {
  static async validateAccessibility(container: HTMLElement) {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    return results;
  }

  static async testKeyboardNavigation(user: any, container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const navigationResults = {
      totalElements: focusableElements.length,
      accessibleElements: 0,
      keyboardNavigable: true,
      tabOrder: [] as string[]
    };

    // Test Tab navigation through all focusable elements
    for (let i = 0; i < focusableElements.length; i++) {
      await user.tab();
      const activeElement = document.activeElement;

      if (activeElement && focusableElements[i] === activeElement) {
        navigationResults.accessibleElements++;
        navigationResults.tabOrder.push(
          activeElement.getAttribute('data-testid') ||
          activeElement.tagName ||
          'unnamed-element'
        );
      } else {
        navigationResults.keyboardNavigable = false;
      }
    }

    return navigationResults;
  }

  static validateColorContrast(element: HTMLElement) {
    const styles = getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;

    // This is a simplified check - in real implementation,
    // you'd use a proper contrast ratio calculation library
    const hasGoodContrast = backgroundColor !== color &&
                           backgroundColor !== 'transparent' &&
                           color !== 'transparent';

    return {
      hasGoodContrast,
      backgroundColor,
      color,
      // In real implementation, calculate actual contrast ratio
      contrastRatio: hasGoodContrast ? 4.5 : 2.1 // Mock values
    };
  }

  static validateAriaAttributes(element: HTMLElement) {
    const ariaAttributes = {
      hasAriaLabel: element.hasAttribute('aria-label'),
      hasAriaDescribedBy: element.hasAttribute('aria-describedby'),
      hasRole: element.hasAttribute('role'),
      hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
      hasAriaExpanded: element.hasAttribute('aria-expanded'),
      hasAriaHidden: element.hasAttribute('aria-hidden')
    };

    const textContent = element.textContent?.trim();
    const isFormElement = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName);
    const isInteractive = element.hasAttribute('onclick') ||
                         element.hasAttribute('onkeydown') ||
                         ['A', 'BUTTON'].includes(element.tagName);

    return {
      ...ariaAttributes,
      hasAccessibleName: ariaAttributes.hasAriaLabel ||
                        ariaAttributes.hasAriaLabelledBy ||
                        (textContent && textContent.length > 0),
      needsAccessibleName: isFormElement || isInteractive,
      isAccessible: isFormElement || isInteractive ?
        (ariaAttributes.hasAriaLabel || ariaAttributes.hasAriaLabelledBy || textContent) :
        true
    };
  }
}

/**
 * German UI Test Data Factory
 * Generates realistic test data for German user scenarios
 */
export class GermanUITestDataFactory {
  static createBavarianUser() {
    return {
      state: 'BY',
      vacation_days: 30,
      language: 'de',
      email: 'test@example.de',
      preferences: {
        include_religious_holidays: true,
        optimize_for: 'efficiency'
      }
    };
  }

  static createBerlinUser() {
    return {
      state: 'BE',
      vacation_days: 25,
      language: 'de',
      email: 'berlin.user@web.de',
      preferences: {
        include_religious_holidays: false,
        optimize_for: 'total_days_off'
      }
    };
  }

  static createInternationalUser() {
    return {
      state: 'NW',
      vacation_days: 28,
      language: 'en',
      email: 'international.user@gmail.com',
      preferences: {
        include_religious_holidays: true,
        optimize_for: 'efficiency'
      }
    };
  }

  static createHolidaysList(state: string = 'BY', year: number = 2025) {
    const federalHolidays = [
      { key: 'neujahr', name: 'Neujahr', date: '2025-01-01', is_federal: true },
      { key: 'karfreitag', name: 'Karfreitag', date: '2025-04-18', is_federal: true },
      { key: 'ostermontag', name: 'Ostermontag', date: '2025-04-21', is_federal: true },
      { key: 'tag_der_arbeit', name: 'Tag der Arbeit', date: '2025-05-01', is_federal: true },
      { key: 'christi_himmelfahrt', name: 'Christi Himmelfahrt', date: '2025-05-29', is_federal: true },
      { key: 'pfingstmontag', name: 'Pfingstmontag', date: '2025-06-09', is_federal: true },
      { key: 'tag_der_deutschen_einheit', name: 'Tag der Deutschen Einheit', date: '2025-10-03', is_federal: true },
      { key: 'weihnachtstag', name: '1. Weihnachtstag', date: '2025-12-25', is_federal: true },
      { key: 'zweiter_weihnachtstag', name: '2. Weihnachtstag', date: '2025-12-26', is_federal: true }
    ];

    const stateSpecificHolidays: Record<string, any[]> = {
      'BY': [
        { key: 'heilige_drei_koenige', name: 'Heilige Drei Könige', date: '2025-01-06', is_federal: false },
        { key: 'fronleichnam', name: 'Fronleichnam', date: '2025-06-19', is_federal: false },
        { key: 'mariae_himmelfahrt', name: 'Mariä Himmelfahrt', date: '2025-08-15', is_federal: false },
        { key: 'allerheiligen', name: 'Allerheiligen', date: '2025-11-01', is_federal: false }
      ],
      'BE': [
        { key: 'internationaler_frauentag', name: 'Internationaler Frauentag', date: '2025-03-08', is_federal: false }
      ],
      'NW': [
        { key: 'fronleichnam', name: 'Fronleichnam', date: '2025-06-19', is_federal: false },
        { key: 'allerheiligen', name: 'Allerheiligen', date: '2025-11-01', is_federal: false }
      ]
    };

    const allHolidays = [
      ...federalHolidays,
      ...(stateSpecificHolidays[state] || [])
    ];

    return allHolidays.map(holiday => ({
      ...holiday,
      id: `${holiday.key}-${state}-${year}`,
      year,
      state: holiday.is_federal ? 'ALL' : state,
      type: holiday.key.includes('weihnacht') || holiday.key.includes('ostern') ||
            holiday.key.includes('himmelfahrt') ? 'religious' :
            holiday.key.includes('arbeit') || holiday.key === 'neujahr' ? 'secular' : 'national'
    }));
  }

  static createBridgeWeekends() {
    return [
      {
        id: '1',
        holiday_id: 'tag_der_arbeit-2025',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'single-bridge',
        quality_score: 100,
        popularity_score: 95
      },
      {
        id: '2',
        holiday_id: 'christi_himmelfahrt-2025',
        start_date: '2025-05-29',
        end_date: '2025-06-01',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'sandwich',
        quality_score: 90,
        popularity_score: 85
      },
      {
        id: '3',
        holiday_id: 'tag_der_deutschen_einheit-2025',
        start_date: '2025-10-03',
        end_date: '2025-10-05',
        vacation_days_needed: 1,
        total_days_off: 3,
        efficiency: 3.0,
        pattern: 'extend-weekend',
        quality_score: 75,
        popularity_score: 70
      }
    ];
  }
}

/**
 * Form Testing Helper
 * Specialized utilities for testing German forms with GDPR compliance
 */
export class FormTestHelper {
  static async fillGermanStateForm(user: any, container: HTMLElement, data: {
    state: string;
    vacation_days: number;
    email?: string;
  }) {
    // Find and fill state selector
    const stateSelect = within(container).getByRole('combobox', { name: /bundesland|state/i });
    await user.selectOptions(stateSelect, data.state);

    // Find and fill vacation days input
    const vacationInput = within(container).getByRole('spinbutton', { name: /urlaubstage|vacation days/i });
    await user.clear(vacationInput);
    await user.type(vacationInput, data.vacation_days.toString());

    // Fill email if provided
    if (data.email) {
      const emailInput = within(container).getByRole('textbox', { name: /e-mail/i });
      await user.clear(emailInput);
      await user.type(emailInput, data.email);
    }

    return { stateSelect, vacationInput };
  }

  static async submitFormWithGDPRConsent(user: any, container: HTMLElement) {
    // Find and check GDPR consent checkbox
    const consentCheckbox = within(container).getByRole('checkbox', {
      name: /datenverarbeitung|data processing|einwilligung|consent/i
    });
    await user.check(consentCheckbox);

    // Find and click submit button
    const submitButton = within(container).getByRole('button', {
      name: /absenden|submit|senden|send/i
    });
    await user.click(submitButton);

    return { consentCheckbox, submitButton };
  }

  static validateFormErrors(container: HTMLElement) {
    const errorMessages = container.querySelectorAll('[role="alert"], .error-message, [data-testid*="error"]');
    const fieldErrors = Array.from(errorMessages).map(error => ({
      element: error,
      message: error.textContent?.trim(),
      field: error.getAttribute('data-field') ||
             error.closest('[data-field]')?.getAttribute('data-field') ||
             'unknown'
    }));

    return {
      hasErrors: errorMessages.length > 0,
      errorCount: errorMessages.length,
      errors: fieldErrors
    };
  }

  static validateGDPRCompliance(container: HTMLElement) {
    const consentCheckbox = container.querySelector('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]');
    const privacyLink = container.querySelector('a[href*="privacy"], a[href*="datenschutz"]');
    const requiredNotices = container.querySelectorAll('[data-testid*="gdpr"], [data-testid*="privacy"]');

    return {
      hasConsentCheckbox: !!consentCheckbox,
      hasPrivacyLink: !!privacyLink,
      hasRequiredNotices: requiredNotices.length > 0,
      consentIsRequired: consentCheckbox?.hasAttribute('required'),
      privacyLinkUrl: privacyLink?.getAttribute('href')
    };
  }
}

/**
 * Performance Testing Helper
 * Monitors component rendering performance
 */
export class ComponentPerformanceHelper {
  static measureRenderTime<T extends Record<string, any>>(
    renderFunction: () => T,
    label: string = 'Component render'
  ): T & { renderTime: number } {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();
    const renderTime = end - start;

    console.log(`⏱️ ${label}: ${renderTime.toFixed(2)}ms`);

    return { ...result, renderTime };
  }

  static async measureAsyncOperation<T>(
    operation: () => Promise<T>,
    label: string = 'Async operation'
  ): Promise<T & { operationTime: number }> {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    const operationTime = end - start;

    console.log(`⏱️ ${label}: ${operationTime.toFixed(2)}ms`);

    return { ...result, operationTime };
  }

  static validatePerformanceTarget(actualTime: number, targetTime: number) {
    return {
      meetsTarget: actualTime <= targetTime,
      actualTime,
      targetTime,
      performanceRatio: actualTime / targetTime
    };
  }
}

/**
 * Mock API Helper
 * Provides mock API responses for component testing
 */
export class MockAPIHelper {
  static createSuccessfulHolidayResponse(state: string = 'BY', year: number = 2025) {
    return {
      holidays: GermanUITestDataFactory.createHolidaysList(state, year),
      meta: {
        state,
        year,
        total_count: 13,
        federal_count: 9,
        state_count: 4
      }
    };
  }

  static createSuccessfulBridgeWeekendResponse() {
    return {
      bridge_weekends: GermanUITestDataFactory.createBridgeWeekends(),
      optimization: {
        strategy: 'efficiency',
        total_vacation_days_available: 30,
        total_vacation_days_used: 8,
        total_days_off_achieved: 25,
        efficiency_rating: 'excellent'
      },
      session_id: 'test-session-uuid-12345'
    };
  }

  static createErrorResponse(code: string = 'VALIDATION_ERROR', message: string = 'Invalid input') {
    return {
      error: {
        code,
        message,
        details: `Test error: ${message}`,
        validation_errors: [
          {
            field: 'state',
            message: 'Invalid state code'
          }
        ]
      },
      timestamp: new Date().toISOString(),
      path: '/v1/test-endpoint'
    };
  }

  static setupMockAPI() {
    // This would typically use MSW (Mock Service Worker) or similar
    // For now, we'll just set up fetch mocks
    global.fetch = jest.fn();

    return {
      mockSuccessfulResponse: (data: any) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => data
        });
      },
      mockErrorResponse: (status: number, data: any) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status,
          json: async () => data
        });
      },
      mockNetworkError: () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      }
    };
  }
}

// Export all helpers
export const reactTestHelpers = {
  GermanTestProvider,
  renderWithGermanContext,
  AccessibilityTestHelper,
  GermanUITestDataFactory,
  FormTestHelper,
  ComponentPerformanceHelper,
  MockAPIHelper
};