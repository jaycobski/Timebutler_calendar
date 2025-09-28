/**
 * EmailSubmissionForm Component Tests
 *
 * Test Coverage:
 * - GDPR compliance and consent mechanisms
 * - Email validation (German providers, domain types)
 * - Accessibility (WCAG 2.1 Level AA)
 * - Bilingual support (German formal, English casual)
 * - Error handling and validation
 * - User interactions and form submission
 * - Keyboard navigation and screen reader support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmailSubmissionForm, {
  EmailSubmissionFormProps,
  EmailSubmissionData,
  EmailValidationResult
} from '../EmailSubmissionForm';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock GDPR consent record
jest.mock('../../../../backend/src/models/gdpr-consent-record', () => ({
  REQUIRED_CONSENT_PURPOSES: ['email_delivery'],
  OPTIONAL_CONSENT_PURPOSES: ['analytics_anonymous', 'service_improvement', 'marketing_timebutler'],
  CURRENT_CONSENT_VERSION: '1.1.0'
}));

describe('EmailSubmissionForm', () => {
  // Default props for testing
  const defaultProps: EmailSubmissionFormProps = {
    vacationPlanId: 'test-plan-123',
    language: 'de'
  };

  const mockSubmit = jest.fn();
  const mockEmailChange = jest.fn();
  const mockConsentChange = jest.fn();
  const mockError = jest.fn();
  const mockCancel = jest.fn();
  const mockAnalytics = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    test('renders with default German content', () => {
      render(<EmailSubmissionForm {...defaultProps} />);

      expect(screen.getByText('Kalender per E-Mail erhalten')).toBeInTheDocument();
      expect(screen.getByText('Wir senden Ihnen Ihren personalisierten Urlaubskalender zu')).toBeInTheDocument();
      expect(screen.getByLabelText(/E-Mail-Adresse/)).toBeInTheDocument();
      expect(screen.getByText('Datenschutz und Einverständniserklärung')).toBeInTheDocument();
    });

    test('renders with English content when language is en', () => {
      render(<EmailSubmissionForm {...defaultProps} language="en" />);

      expect(screen.getByText('Receive Calendar via Email')).toBeInTheDocument();
      expect(screen.getByText(/We'll send your personalized vacation calendar/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
      expect(screen.getByText('Privacy and Consent')).toBeInTheDocument();
    });

    test('renders with initial email if provided', () => {
      const initialEmail = 'test@example.de';
      render(<EmailSubmissionForm {...defaultProps} initialEmail={initialEmail} />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/) as HTMLInputElement;
      expect(emailInput.value).toBe(initialEmail);
    });

    test('applies compact mode styling when enabled', () => {
      const { container } = render(<EmailSubmissionForm {...defaultProps} compactMode />);

      const form = container.querySelector('.email-submission-form');
      expect(form).toHaveClass('email-submission-form--compact');
    });

    test('shows calendar format selection when enabled', () => {
      render(<EmailSubmissionForm {...defaultProps} showCalendarFormatSelection />);

      expect(screen.getByText('Kalenderformat')).toBeInTheDocument();
      expect(screen.getByText(/Standard \(.ics\)/)).toBeInTheDocument();
      expect(screen.getByText(/Microsoft Outlook optimiert/)).toBeInTheDocument();
      expect(screen.getByText(/Google Calendar optimiert/)).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    test('validates email format correctly', async () => {
      const user = userEvent.setup();
      render(
        <EmailSubmissionForm
          {...defaultProps}
          onEmailChange={mockEmailChange}
          enableAdvancedValidation
        />
      );

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);

      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await waitFor(() => {
        expect(screen.getByText('✗')).toBeInTheDocument();
      });

      // Test valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });

    test('detects German email providers correctly', async () => {
      const user = userEvent.setup();
      render(
        <EmailSubmissionForm
          {...defaultProps}
          onEmailChange={mockEmailChange}
          enableAdvancedValidation
          showGermanProviderHint
        />
      );

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);

      // Test German provider
      await user.type(emailInput, 'test@t-online.de');
      await waitFor(() => {
        expect(mockEmailChange).toHaveBeenCalledWith(
          'test@t-online.de',
          expect.objectContaining({
            german_provider: true,
            domain_type: 'personal'
          })
        );
      });

      // Verify German provider hint is shown
      await waitFor(() => {
        expect(screen.getByText('Deutscher E-Mail-Anbieter erkannt')).toBeInTheDocument();
      });
    });

    test('categorizes email domain types correctly', async () => {
      const user = userEvent.setup();
      render(
        <EmailSubmissionForm
          {...defaultProps}
          onEmailChange={mockEmailChange}
          enableAdvancedValidation
        />
      );

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);

      // Test business domain
      await user.type(emailInput, 'test@company.com');
      await waitFor(() => {
        expect(mockEmailChange).toHaveBeenCalledWith(
          'test@company.com',
          expect.objectContaining({
            domain_type: 'business'
          })
        );
      });

      // Clear and test educational domain
      await user.clear(emailInput);
      await user.type(emailInput, 'student@university.edu');
      await waitFor(() => {
        expect(mockEmailChange).toHaveBeenCalledWith(
          'student@university.edu',
          expect.objectContaining({
            domain_type: 'educational'
          })
        );
      });
    });

    test('shows appropriate validation messages for different email types', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} enableAdvancedValidation />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);

      // Test business email
      await user.type(emailInput, 'john@company.com');
      await waitFor(() => {
        expect(screen.getByText('Geschäftliche E-Mail-Adresse erkannt')).toBeInTheDocument();
      });
    });
  });

  describe('GDPR Consent Management', () => {
    test('shows required and optional consent options', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onConsentChange={mockConsentChange} />);

      // Expand GDPR details
      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      // Check required consent
      expect(screen.getByText('Erforderlich für E-Mail-Versendung')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-consent-email-delivery')).toBeInTheDocument();

      // Check optional consents
      expect(screen.getByText('Optional für bessere Erfahrung')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-consent-analytics_anonymous')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-consent-service_improvement')).toBeInTheDocument();
      expect(screen.getByTestId('gdpr-consent-marketing_timebutler')).toBeInTheDocument();
    });

    test('handles consent changes correctly', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onConsentChange={mockConsentChange} />);

      // Expand GDPR details
      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      // Check required consent
      const emailConsentCheckbox = screen.getByTestId('gdpr-consent-email-delivery') as HTMLInputElement;
      await user.click(emailConsentCheckbox);

      expect(mockConsentChange).toHaveBeenCalledWith(['email_delivery']);

      // Check optional consent
      const analyticsCheckbox = screen.getByTestId('gdpr-consent-analytics_anonymous') as HTMLInputElement;
      await user.click(analyticsCheckbox);

      expect(mockConsentChange).toHaveBeenCalledWith(['email_delivery', 'analytics_anonymous']);
    });

    test('validates required consent before form submission', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} />);

      // Fill email
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      // Try to submit without required consent
      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      // Should show error for missing consent
      await waitFor(() => {
        expect(screen.getByText('Erforderlich für den Service')).toBeInTheDocument();
      });

      // Should not call onSubmit
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    test('shows withdrawal information and links', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} />);

      // Expand GDPR details
      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      // Check withdrawal information
      expect(screen.getByText('Sie können Ihre Einverständniserklärung jederzeit widerrufen')).toBeInTheDocument();
      expect(screen.getByText('Ihre Daten werden nach 90 Tagen automatisch gelöscht')).toBeInTheDocument();

      // Check links
      const privacyLink = screen.getByText('Datenschutzerklärung');
      const termsLink = screen.getByText('Nutzungsbedingungen');

      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(privacyLink).toHaveAttribute('target', '_blank');
      expect(termsLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} />);

      // Fill email
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      // Give required consent
      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      // Submit form
      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          language_preference: 'de',
          vacation_plan_id: 'test-plan-123',
          calendar_format: 'ics',
          gdpr_consent: expect.objectContaining({
            purposes: ['email_delivery'],
            consent_version: '1.1.0',
            legal_basis: 'consent',
            source: 'email_submission_form'
          })
        });
      });
    });

    test('prevents submission with invalid email', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} enableAdvancedValidation />);

      // Fill invalid email
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'invalid-email');

      // Try to submit
      const submitButton = screen.getByText('Kalender per E-Mail senden');

      // Submit button should be disabled with invalid email
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    test('handles form submission errors', async () => {
      const user = userEvent.setup();
      const submitError = new Error('Network error');
      mockSubmit.mockRejectedValueOnce(submitError);

      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} onError={mockError} />);

      // Fill valid form
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      // Submit form
      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      // Wait for error handling
      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(submitError);
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: (value: void) => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockSubmit.mockReturnValueOnce(submitPromise);

      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} />);

      // Fill and submit form
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText('E-Mail wird versendet...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve submission
      resolveSubmit!();
      await waitFor(() => {
        expect(screen.getByText('Kalender per E-Mail senden')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Format Selection', () => {
    test('allows calendar format selection', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} showCalendarFormatSelection />);

      // Check default selection
      const icsOption = screen.getByTestId('calendar-format-ics') as HTMLInputElement;
      expect(icsOption.checked).toBe(true);

      // Select Outlook format
      const outlookOption = screen.getByTestId('calendar-format-outlook');
      await user.click(outlookOption);

      expect((outlookOption as HTMLInputElement).checked).toBe(true);
      expect(icsOption.checked).toBe(false);

      // Select Google format
      const googleOption = screen.getByTestId('calendar-format-google');
      await user.click(googleOption);

      expect((googleOption as HTMLInputElement).checked).toBe(true);
      expect((outlookOption as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<EmailSubmissionForm {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onCancel={mockCancel} />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      const gdprToggle = screen.getByText('Datenschutzdetails anzeigen');
      const submitButton = screen.getByText('Kalender per E-Mail senden');

      // Tab through elements
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(gdprToggle).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    test('supports keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onCancel={mockCancel} onSubmit={mockSubmit} />);

      // Test Escape key for cancel
      await user.keyboard('{Escape}');
      expect(mockCancel).toHaveBeenCalled();
    });

    test('has proper ARIA labels and descriptions', () => {
      render(<EmailSubmissionForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-hint email-validation email-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Kalender per E-Mail erhalten');
    });

    test('announces validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} />);

      // Try to submit empty form
      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      // Error should have role="alert"
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    test('auto-focuses email input when enabled', () => {
      render(<EmailSubmissionForm {...defaultProps} autoFocusEmail />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Analytics and Event Tracking', () => {
    test('tracks form field changes', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onAnalytics={mockAnalytics} />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      expect(mockAnalytics).toHaveBeenCalledWith('form_field_change', {
        field: 'email',
        value: 'string'
      });
    });

    test('tracks GDPR consent changes', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onAnalytics={mockAnalytics} />);

      // Expand GDPR details and check consent
      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      expect(mockAnalytics).toHaveBeenCalledWith('gdpr_consent_change', {
        purpose: 'email_delivery',
        granted: true,
        total_purposes: 1
      });
    });

    test('tracks email validation events', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onAnalytics={mockAnalytics} enableAdvancedValidation />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@t-online.de');

      await waitFor(() => {
        expect(mockAnalytics).toHaveBeenCalledWith('email_validation', {
          domain_type: 'personal',
          german_provider: true,
          valid: true
        });
      });
    });

    test('tracks form submission attempts and results', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} onAnalytics={mockAnalytics} onSubmit={mockSubmit} />);

      // Fill and submit form
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      expect(mockAnalytics).toHaveBeenCalledWith('email_submission_attempt', {
        domain_type: 'business',
        german_provider: false,
        calendar_format: 'ics',
        consents_granted: 1
      });

      await waitFor(() => {
        expect(mockAnalytics).toHaveBeenCalledWith('email_submission_success', {
          domain_type: 'business',
          german_provider: false,
          calendar_format: 'ics'
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('shows appropriate error messages for different error types', async () => {
      const user = userEvent.setup();

      // Test network error
      mockSubmit.mockRejectedValueOnce(new Error('network connection failed'));
      render(<EmailSubmissionForm {...defaultProps} onSubmit={mockSubmit} />);

      // Submit form with network error
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Netzwerkfehler. Prüfen Sie Ihre Internetverbindung.')).toBeInTheDocument();
      });
    });

    test('clears field errors when user makes corrections', async () => {
      const user = userEvent.setup();
      render(<EmailSubmissionForm {...defaultProps} enableAdvancedValidation />);

      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);

      // Enter invalid email to trigger error
      await user.type(emailInput, 'invalid');

      // Clear and enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      // Validation error should be cleared
      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design and Themes', () => {
    test('applies theme classes correctly', () => {
      const { container: lightContainer } = render(
        <EmailSubmissionForm {...defaultProps} theme="light" />
      );
      const { container: darkContainer } = render(
        <EmailSubmissionForm {...defaultProps} theme="dark" />
      );
      const { container: autoContainer } = render(
        <EmailSubmissionForm {...defaultProps} theme="auto" />
      );

      const lightForm = lightContainer.querySelector('.email-submission-form');
      const darkForm = darkContainer.querySelector('.email-submission-form');
      const autoForm = autoContainer.querySelector('.email-submission-form');

      expect(lightForm).toHaveClass('email-submission-form--light');
      expect(darkForm).toHaveClass('email-submission-form--dark');
      expect(autoForm).toHaveClass('email-submission-form--auto');
    });
  });

  describe('Integration with External Systems', () => {
    test('integrates with TimeButler branding', () => {
      render(<EmailSubmissionForm {...defaultProps} />);

      expect(screen.getByText(/Powered by TimeButler - Professionelle Zeiterfassung/)).toBeInTheDocument();
    });

    test('passes vacation plan ID correctly', async () => {
      const user = userEvent.setup();
      const testPlanId = 'vacation-plan-456';
      render(<EmailSubmissionForm {...defaultProps} vacationPlanId={testPlanId} onSubmit={mockSubmit} />);

      // Submit form
      const emailInput = screen.getByLabelText(/E-Mail-Adresse/);
      await user.type(emailInput, 'test@example.com');

      const detailsButton = screen.getByText('Datenschutzdetails anzeigen');
      await user.click(detailsButton);

      const consentCheckbox = screen.getByTestId('gdpr-consent-email-delivery');
      await user.click(consentCheckbox);

      const submitButton = screen.getByText('Kalender per E-Mail senden');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            vacation_plan_id: testPlanId
          })
        );
      });
    });
  });
});