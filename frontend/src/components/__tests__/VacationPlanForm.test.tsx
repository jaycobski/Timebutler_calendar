/**
 * VacationPlanForm Component Tests
 *
 * Constitutional Requirements Testing:
 * - WCAG 2.1 Level AA accessibility compliance
 * - German employment law vacation budget validation (20-50 days)
 * - Bilingual UX testing (German formal, English casual)
 * - GDPR consent management validation
 * - Progressive enhancement (form works without JavaScript)
 * - Performance requirements (<100ms interaction response)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import VacationPlanForm, { VacationPlanFormProps, VacationPlanFormData, VacationBudgetValidation } from '../VacationPlanForm';
import { BridgeWeekend } from '../../types/holiday';
import { GermanStateCode } from '../../types/state';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockBridgeWeekends: BridgeWeekend[] = [
  {
    id: 'bridge-1',
    holiday_id: 'neujahr-2025',
    state_code: 'BY',
    start_date: '2025-01-01',
    end_date: '2025-01-03',
    vacation_days_needed: 2,
    total_days_off: 5,
    efficiency: 2.5,
    pattern: 'thursday-friday'
  },
  {
    id: 'bridge-2',
    holiday_id: 'heilige-drei-koenige-2025',
    state_code: 'BY',
    start_date: '2025-01-04',
    end_date: '2025-01-06',
    vacation_days_needed: 1,
    total_days_off: 4,
    efficiency: 4.0,
    pattern: 'monday-tuesday'
  },
  {
    id: 'bridge-3',
    holiday_id: 'karfreitag-2025',
    state_code: 'BY',
    start_date: '2025-04-18',
    end_date: '2025-04-22',
    vacation_days_needed: 3,
    total_days_off: 6,
    efficiency: 2.0,
    pattern: 'sandwich'
  }
];

const defaultProps: VacationPlanFormProps = {
  availableBridges: mockBridgeWeekends,
  holidays: [],
  language: 'de',
  onSubmit: jest.fn(),
  onFormChange: jest.fn(),
  onValidationChange: jest.fn(),
  onBridgeSelect: jest.fn(),
  onBridgeDeselect: jest.fn(),
  onAnalytics: jest.fn()
};

// Test utilities
const renderVacationPlanForm = (props: Partial<VacationPlanFormProps> = {}) => {
  const user = userEvent.setup();
  const mergedProps = { ...defaultProps, ...props };
  const renderResult = render(<VacationPlanForm {...mergedProps} />);

  return {
    user,
    ...renderResult,
    // Helper functions
    getBudgetInput: () => screen.getByTestId('vacation-days-budget-input'),
    getEmailInput: () => screen.getByTestId('email-input'),
    getSubmitButton: () => screen.getByTestId('submit-button'),
    getBridgeCheckbox: (bridgeId: string) => screen.getByTestId(`bridge-checkbox-${bridgeId}`),
    getGDPRToggle: () => screen.getByTestId('gdpr-details-toggle'),
    getGDPRConsent: (purpose: string) => screen.getByTestId(`gdpr-consent-${purpose}`)
  };
};

describe('VacationPlanForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility Compliance (WCAG 2.1 Level AA)', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderVacationPlanForm();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper form labeling', () => {
      renderVacationPlanForm();

      expect(screen.getByLabelText(/verfügbare urlaubstage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail-adresse/i)).toBeInTheDocument();
      expect(screen.getByRole('form')).toHaveAttribute('aria-label');
    });

    test('should provide screen reader instructions', () => {
      renderVacationPlanForm();

      expect(screen.getByText(/verwenden sie die tab-taste/i)).toBeInTheDocument();
      expect(screen.getByText(/verwenden sie die tab-taste/i)).toHaveClass('sr-only');
    });

    test('should support keyboard navigation', async () => {
      const { user } = renderVacationPlanForm();

      // Tab through form elements
      await user.tab();
      expect(screen.getByTestId('vacation-days-budget-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('bridge-checkbox-bridge-1')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('bridge-checkbox-bridge-2')).toHaveFocus();
    });

    test('should have proper focus indicators', async () => {
      const { user, getBudgetInput } = renderVacationPlanForm();
      const budgetInput = getBudgetInput();

      await user.click(budgetInput);
      expect(budgetInput).toHaveFocus();
      expect(budgetInput).toHaveStyle('border-color: var(--vpf-color-border-focus)');
    });

    test('should announce validation errors', async () => {
      const { user, getBudgetInput, getSubmitButton } = renderVacationPlanForm();

      // Leave budget empty and submit
      await user.click(getSubmitButton());

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('German Employment Law Validation', () => {
    test('should enforce minimum 20 vacation days', async () => {
      const { user, getBudgetInput, getSubmitButton } = renderVacationPlanForm();

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '19');
      await user.click(getSubmitButton());

      expect(screen.getByText(/mindestens 20 urlaubstage/i)).toBeInTheDocument();
    });

    test('should enforce maximum 50 vacation days', async () => {
      const { user, getBudgetInput, getSubmitButton } = renderVacationPlanForm();

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '51');
      await user.click(getSubmitButton());

      expect(screen.getByText(/maximal 50 urlaubstage/i)).toBeInTheDocument();
    });

    test('should accept valid German vacation budget range', async () => {
      const { user, getBudgetInput } = renderVacationPlanForm();

      // Test various valid values
      const validValues = [20, 25, 30, 35, 40, 45, 50];

      for (const value of validValues) {
        await user.clear(getBudgetInput());
        await user.type(getBudgetInput(), value.toString());

        // Should not show validation error
        expect(screen.queryByText(/bitte geben sie zwischen/i)).not.toBeInTheDocument();
      }
    });

    test('should calculate budget validation correctly', async () => {
      const mockOnValidationChange = jest.fn();
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        onValidationChange: mockOnValidationChange,
        enableRealTimeValidation: true
      });

      // Set budget to 25 days
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');

      // Select bridges requiring 6 days total (2 + 1 + 3)
      await user.click(getBridgeCheckbox('bridge-1'));
      await user.click(getBridgeCheckbox('bridge-2'));
      await user.click(getBridgeCheckbox('bridge-3'));

      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            sufficient: true,
            required_days: 6,
            available_days: 25,
            remaining_days: 19,
            efficiency: expect.any(Number)
          })
        );
      });
    });

    test('should warn about budget exceeded', async () => {
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        enableRealTimeValidation: true,
        showEfficiencyMetrics: true
      });

      // Set low budget
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '5');

      // Select bridges requiring more days
      await user.click(getBridgeCheckbox('bridge-1'));
      await user.click(getBridgeCheckbox('bridge-3'));

      await waitFor(() => {
        expect(screen.getByText(/sie benötigen \d+ urlaubstage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bilingual UX Support', () => {
    test('should render German interface correctly', () => {
      renderVacationPlanForm({ language: 'de' });

      expect(screen.getByText('Ihren Urlaubsplan erstellen')).toBeInTheDocument();
      expect(screen.getByText('Verfügbare Urlaubstage')).toBeInTheDocument();
      expect(screen.getByText('E-Mail-Adresse')).toBeInTheDocument();
      expect(screen.getByText('Urlaubsplan erstellen')).toBeInTheDocument();
    });

    test('should render English interface correctly', () => {
      renderVacationPlanForm({ language: 'en' });

      expect(screen.getByText('Create Your Vacation Plan')).toBeInTheDocument();
      expect(screen.getByText('Available Vacation Days')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Create Vacation Plan')).toBeInTheDocument();
    });

    test('should use formal German addressing', () => {
      renderVacationPlanForm({ language: 'de' });

      // German formal addressing uses "Sie" and formal language
      expect(screen.getByText(/optimieren sie ihre freie zeit/i)).toBeInTheDocument();
      expect(screen.getByText(/wählen sie die brückenwochenenden/i)).toBeInTheDocument();
    });

    test('should use casual English tone', () => {
      renderVacationPlanForm({ language: 'en' });

      // English uses casual, friendly language
      expect(screen.getByText(/maximize your time off/i)).toBeInTheDocument();
      expect(screen.getByText(/choose the bridge weekends you want/i)).toBeInTheDocument();
    });

    test('should display bridge efficiency in correct language', async () => {
      const { user, getBridgeCheckbox } = renderVacationPlanForm({ language: 'de' });

      // German should show "Urlaubstage" and "freie Tage gesamt"
      expect(screen.getByText('2 Urlaubstage')).toBeInTheDocument();
      expect(screen.getByText('5 freie Tage gesamt')).toBeInTheDocument();
    });

    test('should display bridge efficiency in English', async () => {
      const { user, getBridgeCheckbox } = renderVacationPlanForm({ language: 'en' });

      // English should show "vacation days" and "total days off"
      expect(screen.getByText('2 vacation days')).toBeInTheDocument();
      expect(screen.getByText('5 total days off')).toBeInTheDocument();
    });
  });

  describe('Budget Validation and Feedback', () => {
    test('should display budget metrics when enabled', async () => {
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        enableRealTimeValidation: true,
        showEfficiencyMetrics: true
      });

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '30');
      await user.click(getBridgeCheckbox('bridge-1'));

      await waitFor(() => {
        expect(screen.getByText('Budgetübersicht')).toBeInTheDocument();
        expect(screen.getByText('Benötigte Urlaubstage')).toBeInTheDocument();
        expect(screen.getByText('Verbleibende Tage')).toBeInTheDocument();
        expect(screen.getByText('Effizienz')).toBeInTheDocument();
      });
    });

    test('should show efficiency warnings for low efficiency bridges', async () => {
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        enableRealTimeValidation: true,
        showRecommendations: true
      });

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '30');

      // Select low efficiency bridge (bridge-3 has efficiency 2.0)
      await user.click(getBridgeCheckbox('bridge-3'));

      await waitFor(() => {
        expect(screen.getByText(/niedrige effizienz/i)).toBeInTheDocument();
      });
    });

    test('should show budget usage warnings', async () => {
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        enableRealTimeValidation: true
      });

      // Set budget that will trigger high usage warning
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');

      // Select bridges using >80% of budget
      await user.click(getBridgeCheckbox('bridge-1')); // 2 days
      await user.click(getBridgeCheckbox('bridge-2')); // 1 day
      await user.click(getBridgeCheckbox('bridge-3')); // 3 days
      // Total: 6 days (24% of 25) - not enough for warning

      // Need to trigger >80% usage
      const highUsageBridge: BridgeWeekend = {
        id: 'bridge-high',
        holiday_id: 'test',
        state_code: 'BY',
        start_date: '2025-06-01',
        end_date: '2025-06-10',
        vacation_days_needed: 18, // This would trigger high usage
        total_days_off: 20,
        efficiency: 1.1,
        pattern: 'sandwich'
      };

      const { rerender } = renderVacationPlanForm({
        availableBridges: [...mockBridgeWeekends, highUsageBridge],
        enableRealTimeValidation: true
      });

      const highUsageCheckbox = screen.getByTestId('bridge-checkbox-bridge-high');
      await user.click(highUsageCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/sie verwenden \d+% ihres urlaubsbudgets/i)).toBeInTheDocument();
      });
    });

    test('should provide recommendations', async () => {
      const { user, getBudgetInput, getBridgeCheckbox } = renderVacationPlanForm({
        enableRealTimeValidation: true,
        showRecommendations: true
      });

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');
      await user.click(getBridgeCheckbox('bridge-3')); // Low efficiency bridge

      await waitFor(() => {
        expect(screen.getByText('Empfehlungen')).toBeInTheDocument();
      });
    });
  });

  describe('Bridge Weekend Selection', () => {
    test('should allow bridge selection and deselection', async () => {
      const mockOnBridgeSelect = jest.fn();
      const mockOnBridgeDeselect = jest.fn();
      const { user, getBridgeCheckbox } = renderVacationPlanForm({
        onBridgeSelect: mockOnBridgeSelect,
        onBridgeDeselect: mockOnBridgeDeselect
      });

      const checkbox = getBridgeCheckbox('bridge-1');

      // Select bridge
      await user.click(checkbox);
      expect(mockOnBridgeSelect).toHaveBeenCalledWith(mockBridgeWeekends[0]);
      expect(checkbox).toBeChecked();

      // Deselect bridge
      await user.click(checkbox);
      expect(mockOnBridgeDeselect).toHaveBeenCalledWith(mockBridgeWeekends[0]);
      expect(checkbox).not.toBeChecked();
    });

    test('should display bridge information correctly', () => {
      renderVacationPlanForm();

      // Check first bridge weekend details
      expect(screen.getByText('2025-01-01 - 2025-01-03')).toBeInTheDocument();
      expect(screen.getByText('2.5x')).toBeInTheDocument(); // Efficiency
      expect(screen.getByText('2 Urlaubstage')).toBeInTheDocument();
      expect(screen.getByText('5 freie Tage gesamt')).toBeInTheDocument();
    });

    test('should track form changes when bridges are selected', async () => {
      const mockOnFormChange = jest.fn();
      const { user, getBridgeCheckbox } = renderVacationPlanForm({
        onFormChange: mockOnFormChange
      });

      await user.click(getBridgeCheckbox('bridge-1'));

      expect(mockOnFormChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selected_bridges: [mockBridgeWeekends[0]]
        })
      );
    });

    test('should handle empty bridge list', () => {
      renderVacationPlanForm({ availableBridges: [] });

      // Should still render the bridges section but with no options
      expect(screen.getByText('Brückenwochenenden auswählen')).toBeInTheDocument();
    });
  });

  describe('GDPR Consent Management', () => {
    test('should show GDPR consent section when enabled', () => {
      renderVacationPlanForm({ enableGDPRConsent: true });

      expect(screen.getByText('Datenschutz und Einverständniserklärung')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-details-toggle')).toBeInTheDocument();
    });

    test('should hide GDPR consent section when disabled', () => {
      renderVacationPlanForm({ enableGDPRConsent: false });

      expect(screen.queryByText('Datenschutz und Einverständniserklärung')).not.toBeInTheDocument();
    });

    test('should expand and collapse GDPR details', async () => {
      const { user, getGDPRToggle } = renderVacationPlanForm({ enableGDPRConsent: true });

      const toggle = getGDPRToggle();

      // Initially collapsed
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Expand
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Should show consent options
      expect(screen.getByTestId('gdpr-consent-vacation_planning')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-consent-email_delivery')).toBeInTheDocument();

      // Collapse
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    test('should require mandatory GDPR consents', async () => {
      const { user, getSubmitButton, getGDPRToggle } = renderVacationPlanForm({
        enableGDPRConsent: true
      });

      // Fill required fields
      await user.type(screen.getByTestId('vacation-days-budget-input'), '25');
      await user.type(screen.getByTestId('email-input'), 'test@example.de');

      // Try to submit without GDPR consent
      await user.click(getSubmitButton());

      expect(screen.getByText(/erforderliche einverständniserklärungen fehlen/i)).toBeInTheDocument();
    });

    test('should accept required GDPR consents', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { user, getSubmitButton, getGDPRToggle, getGDPRConsent, getBudgetInput, getEmailInput } = renderVacationPlanForm({
        enableGDPRConsent: true,
        onSubmit: mockOnSubmit
      });

      // Fill form
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');
      await user.type(getEmailInput(), 'test@example.de');

      // Expand GDPR and give required consents
      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('vacation_planning'));
      await user.click(getGDPRConsent('email_delivery'));

      // Submit
      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            gdpr_consent: expect.objectContaining({
              purposes: expect.arrayContaining(['vacation_planning', 'email_delivery'])
            })
          })
        );
      });
    });

    test('should handle optional GDPR consents', async () => {
      const { user, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        enableGDPRConsent: true
      });

      await user.click(getGDPRToggle());

      // Optional consents should be unchecked by default
      expect(getGDPRConsent('analytics_anonymous')).not.toBeChecked();
      expect(getGDPRConsent('service_improvement')).not.toBeChecked();
      expect(getGDPRConsent('marketing_timebutler')).not.toBeChecked();

      // Should be able to check optional consents
      await user.click(getGDPRConsent('analytics_anonymous'));
      expect(getGDPRConsent('analytics_anonymous')).toBeChecked();
    });
  });

  describe('Email Validation', () => {
    test('should require email address', async () => {
      const { user, getSubmitButton } = renderVacationPlanForm();

      await user.click(getSubmitButton());

      expect(screen.getByText(/e-mail-adresse ist erforderlich/i)).toBeInTheDocument();
    });

    test('should validate email format', async () => {
      const { user, getEmailInput, getSubmitButton } = renderVacationPlanForm();

      await user.type(getEmailInput(), 'invalid-email');
      await user.click(getSubmitButton());

      expect(screen.getByText(/bitte geben sie eine gültige e-mail-adresse ein/i)).toBeInTheDocument();
    });

    test('should accept valid email addresses', async () => {
      const { user, getEmailInput } = renderVacationPlanForm();

      const validEmails = [
        'test@example.de',
        'user@gmail.com',
        'person@company.org',
        'name.surname@domain.co.uk'
      ];

      for (const email of validEmails) {
        await user.clear(getEmailInput());
        await user.type(getEmailInput(), email);

        // Should not show validation error
        expect(screen.queryByText(/bitte geben sie eine gültige/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('Form Submission', () => {
    test('should call onSubmit with correct data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { user, getBudgetInput, getEmailInput, getBridgeCheckbox, getSubmitButton, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        onSubmit: mockOnSubmit,
        enableGDPRConsent: true
      });

      // Fill form
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '30');
      await user.type(getEmailInput(), 'test@example.de');
      await user.click(getBridgeCheckbox('bridge-1'));

      // GDPR consent
      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('vacation_planning'));
      await user.click(getGDPRConsent('email_delivery'));

      // Submit
      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          state_code: null, // Not set in this test
          vacation_days_budget: 30,
          selected_bridges: [mockBridgeWeekends[0]],
          email: 'test@example.de',
          gdpr_consent: expect.objectContaining({
            purposes: ['vacation_planning', 'email_delivery'],
            consent_version: '1.1.0',
            legal_basis: 'consent'
          }),
          language_preference: 'de'
        });
      });
    });

    test('should show loading state during submission', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { user, getBudgetInput, getEmailInput, getSubmitButton, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        onSubmit: mockOnSubmit,
        enableGDPRConsent: true
      });

      // Fill form
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');
      await user.type(getEmailInput(), 'test@example.de');

      // GDPR consent
      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('vacation_planning'));
      await user.click(getGDPRConsent('email_delivery'));

      // Submit
      await user.click(getSubmitButton());

      expect(getSubmitButton()).toHaveTextContent('Wird verarbeitet...');
      expect(getSubmitButton()).toBeDisabled();
    });

    test('should handle submission errors', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockOnError = jest.fn();

      const { user, getBudgetInput, getEmailInput, getSubmitButton, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        onSubmit: mockOnSubmit,
        onError: mockOnError,
        enableGDPRConsent: true
      });

      // Fill form
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');
      await user.type(getEmailInput(), 'test@example.de');

      // GDPR consent
      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('vacation_planning'));
      await user.click(getGDPRConsent('email_delivery'));

      // Submit
      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('should prevent submission with validation errors', async () => {
      const mockOnSubmit = jest.fn();
      const { user, getSubmitButton } = renderVacationPlanForm({
        onSubmit: mockOnSubmit
      });

      // Submit empty form
      await user.click(getSubmitButton());

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/bitte geben sie zwischen/i)).toBeInTheDocument();
    });

    test('should focus first error field on validation failure', async () => {
      const { user, getBudgetInput, getSubmitButton } = renderVacationPlanForm();

      // Submit with invalid budget
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '19'); // Below minimum
      await user.click(getSubmitButton());

      expect(getBudgetInput()).toHaveFocus();
    });
  });

  describe('Analytics Integration', () => {
    test('should track form field changes', async () => {
      const mockOnAnalytics = jest.fn();
      const { user, getBudgetInput } = renderVacationPlanForm({
        onAnalytics: mockOnAnalytics
      });

      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '30');

      expect(mockOnAnalytics).toHaveBeenCalledWith('form_field_change', {
        field: 'vacation_days_budget',
        value: 'number'
      });
    });

    test('should track bridge selection analytics', async () => {
      const mockOnAnalytics = jest.fn();
      const { user, getBridgeCheckbox } = renderVacationPlanForm({
        onAnalytics: mockOnAnalytics
      });

      await user.click(getBridgeCheckbox('bridge-1'));

      expect(mockOnAnalytics).toHaveBeenCalledWith('bridge_selected', {
        bridge_id: 'bridge-1',
        efficiency: 2.5
      });
    });

    test('should track form submission analytics', async () => {
      const mockOnAnalytics = jest.fn();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { user, getBudgetInput, getEmailInput, getBridgeCheckbox, getSubmitButton, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        onAnalytics: mockOnAnalytics,
        onSubmit: mockOnSubmit,
        enableGDPRConsent: true
      });

      // Fill and submit form
      await user.clear(getBudgetInput());
      await user.type(getBudgetInput(), '25');
      await user.type(getEmailInput(), 'test@example.de');
      await user.click(getBridgeCheckbox('bridge-1'));

      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('vacation_planning'));
      await user.click(getGDPRConsent('email_delivery'));

      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(mockOnAnalytics).toHaveBeenCalledWith('form_submit_attempt', {
          bridge_count: 1,
          budget: 25,
          efficiency: expect.any(Number)
        });

        expect(mockOnAnalytics).toHaveBeenCalledWith('form_submit_success', {
          bridge_count: 1,
          budget: 25,
          efficiency: expect.any(Number)
        });
      });
    });

    test('should track GDPR consent changes', async () => {
      const mockOnAnalytics = jest.fn();
      const { user, getGDPRToggle, getGDPRConsent } = renderVacationPlanForm({
        onAnalytics: mockOnAnalytics,
        enableGDPRConsent: true
      });

      await user.click(getGDPRToggle());
      await user.click(getGDPRConsent('analytics_anonymous'));

      expect(mockOnAnalytics).toHaveBeenCalledWith('gdpr_consent_change', {
        purpose: 'analytics_anonymous',
        granted: true
      });
    });
  });

  describe('Performance Requirements', () => {
    test('should respond to interactions within 100ms', async () => {
      const { user, getBridgeCheckbox } = renderVacationPlanForm();

      const start = performance.now();
      await user.click(getBridgeCheckbox('bridge-1'));
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    test('should handle rapid consecutive interactions', async () => {
      const { user, getBridgeCheckbox } = renderVacationPlanForm();

      const checkbox = getBridgeCheckbox('bridge-1');

      // Rapid clicks
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      // Should handle all clicks without errors
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('TimeButler Branding', () => {
    test('should display TimeButler branding', () => {
      renderVacationPlanForm();

      expect(screen.getByText(/powered by timebutler/i)).toBeInTheDocument();
    });

    test('should include TimeButler promotion in different languages', () => {
      const { rerender } = renderVacationPlanForm({ language: 'de' });
      expect(screen.getByText(/professionelle zeiterfassung/i)).toBeInTheDocument();

      rerender(<VacationPlanForm {...defaultProps} language="en" />);
      expect(screen.getByText(/professional time tracking/i)).toBeInTheDocument();
    });
  });

  describe('Progressive Enhancement', () => {
    test('should work without JavaScript enhancements', () => {
      // This test ensures the form has proper HTML structure for no-JS environments
      renderVacationPlanForm();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate'); // HTML5 validation disabled for JS validation

      // Required fields should have HTML required attribute as fallback
      expect(screen.getByTestId('vacation-days-budget-input')).toHaveAttribute('required');
      expect(screen.getByTestId('email-input')).toHaveAttribute('required');
    });
  });
});