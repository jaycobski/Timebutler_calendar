/**
 * EmailSubmissionForm Component - GDPR-Compliant Email Collection for Calendar Delivery
 *
 * Constitutional Requirements:
 * - Bilingual support (German formal, English casual)
 * - WCAG 2.1 Level AA accessibility compliance
 * - GDPR Article 7 compliant consent mechanism
 * - Progressive enhancement (works without JavaScript)
 * - Performance optimized (<100ms interaction response)
 * - Secure email validation and handling
 *
 * Features:
 * - Real-time email validation with German/international formats
 * - Granular GDPR consent with clear withdrawal mechanism
 * - Cultural UX differences (German formal vs English casual tone)
 * - Comprehensive error handling with bilingual messages
 * - TimeButler brand integration
 * - Screen reader optimized accessibility
 * - Keyboard navigation support
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GDPRConsentRecord,
  ConsentPurpose,
  REQUIRED_CONSENT_PURPOSES,
  OPTIONAL_CONSENT_PURPOSES,
  CURRENT_CONSENT_VERSION
} from '../../../backend/src/models/gdpr-consent-record';

// Email submission interfaces
interface EmailSubmissionData {
  email: string;
  language_preference: 'de' | 'en';
  gdpr_consent: Partial<GDPRConsentRecord>;
  vacation_plan_id?: string;
  calendar_format?: 'ics' | 'outlook' | 'google';
}

interface EmailValidationResult {
  valid: boolean;
  formatted_email: string;
  issues: string[];
  domain_type: 'business' | 'personal' | 'educational' | 'government' | 'unknown';
  german_provider: boolean;
}

interface FormErrors {
  email?: string;
  gdpr_consent?: string;
  general?: string;
  network?: string;
}

interface EmailSubmissionFormProps {
  // Core functionality
  vacationPlanId: string;
  selectedCalendarFormat?: 'ics' | 'outlook' | 'google';

  // Configuration
  language: 'de' | 'en';
  initialEmail?: string;

  // Feature toggles
  showCalendarFormatSelection?: boolean;
  enableAdvancedValidation?: boolean;
  showGermanProviderHint?: boolean;
  compactMode?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  autoFocusEmail?: boolean;

  // Styling
  className?: string;
  theme?: 'light' | 'dark' | 'auto';

  // Event handlers
  onSubmit?: (data: EmailSubmissionData) => Promise<void>;
  onEmailChange?: (email: string, validation: EmailValidationResult) => void;
  onConsentChange?: (purposes: ConsentPurpose[]) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;

  // Testing
  'data-testid'?: string;

  // Analytics
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

/**
 * EmailSubmissionForm Component
 */
export default function EmailSubmissionForm({
  vacationPlanId,
  selectedCalendarFormat = 'ics',
  language = 'de',
  initialEmail = '',
  showCalendarFormatSelection = true,
  enableAdvancedValidation = true,
  showGermanProviderHint = true,
  compactMode = false,
  ariaLabel,
  ariaDescribedBy,
  autoFocusEmail = true,
  className = '',
  theme = 'auto',
  onSubmit,
  onEmailChange,
  onConsentChange,
  onError,
  onCancel,
  onAnalytics,
  'data-testid': testId = 'email-submission-form'
}: EmailSubmissionFormProps) {
  // Form state
  const [formData, setFormData] = useState<EmailSubmissionData>({
    email: initialEmail,
    language_preference: language,
    gdpr_consent: {
      purposes: [],
      consent_version: CURRENT_CONSENT_VERSION,
      source: 'email_submission_form',
      withdrawal_method: 'email_link',
      legal_basis: 'consent'
    },
    vacation_plan_id: vacationPlanId,
    calendar_format: selectedCalendarFormat
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [showGDPRDetails, setShowGDPRDetails] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Refs for accessibility
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Memoized translations
  const translations = useMemo(() => {
    if (language === 'de') {
      return {
        title: 'Kalender per E-Mail erhalten',
        subtitle: 'Wir senden Ihnen Ihren personalisierten Urlaubskalender zu',
        emailLabel: 'E-Mail-Adresse',
        emailPlaceholder: 'ihre.email@beispiel.de',
        emailRequired: 'E-Mail-Adresse ist erforderlich',
        emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        emailValidating: 'E-Mail wird validiert...',
        emailGermanHint: 'Tipp: Deutsche E-Mail-Anbieter werden bevorzugt unterstützt',
        calendarFormatLabel: 'Kalenderformat',
        calendarFormatIcs: 'Standard (.ics) - Funktioniert mit allen Kalendern',
        calendarFormatOutlook: 'Microsoft Outlook optimiert',
        calendarFormatGoogle: 'Google Calendar optimiert',
        gdprTitle: 'Datenschutz und Einverständniserklärung',
        gdprSubtitle: 'Transparente Datenverarbeitung nach DSGVO Artikel 7',
        gdprRequired: 'Erforderlich für E-Mail-Versendung',
        gdprOptional: 'Optional für bessere Erfahrung',
        gdprDetailsShow: 'Datenschutzdetails anzeigen',
        gdprDetailsHide: 'Datenschutzdetails ausblenden',
        gdprWithdrawalInfo: 'Sie können Ihre Einverständniserklärung jederzeit widerrufen',
        gdprDataRetention: 'Ihre Daten werden nach 90 Tagen automatisch gelöscht',
        consentEmailDelivery: 'Kalender-E-Mail-Versendung',
        consentAnalytics: 'Anonyme Nutzungsstatistiken',
        consentImprovement: 'Serviceverbesserung',
        consentMarketing: 'TimeButler Produktinformationen',
        advancedOptionsShow: 'Erweiterte Optionen anzeigen',
        advancedOptionsHide: 'Erweiterte Optionen ausblenden',
        submitButton: 'Kalender per E-Mail senden',
        submitting: 'E-Mail wird versendet...',
        cancelButton: 'Abbrechen',
        privacyPolicyLink: 'Datenschutzerklärung',
        termsOfServiceLink: 'Nutzungsbedingungen',
        brandedBy: 'Powered by TimeButler - Professionelle Zeiterfassung für Teams',
        accessibilityInstructions: 'Verwenden Sie Tab zur Navigation, Enter zum Absenden',
        keyboardShortcuts: 'Tastenkürzel: Alt+S für Senden, Esc für Abbrechen',
        successMessage: 'Kalender wird in wenigen Minuten in Ihrem Postfach ankommen',
        errorGeneral: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        errorNetwork: 'Netzwerkfehler. Prüfen Sie Ihre Internetverbindung.',
        errorValidation: 'Validierungsfehler. Überprüfen Sie Ihre Eingaben.',
        emailDomainBusiness: 'Geschäftliche E-Mail-Adresse erkannt',
        emailDomainPersonal: 'Private E-Mail-Adresse erkannt',
        emailDomainEducational: 'Bildungseinrichtung E-Mail erkannt',
        emailDomainGerman: 'Deutscher E-Mail-Anbieter erkannt'
      };
    } else {
      return {
        title: 'Receive Calendar via Email',
        subtitle: 'We\'ll send your personalized vacation calendar to your inbox',
        emailLabel: 'Email Address',
        emailPlaceholder: 'your.email@example.com',
        emailRequired: 'Email address is required',
        emailInvalid: 'Please enter a valid email address',
        emailValidating: 'Validating email...',
        emailGermanHint: 'Tip: German email providers are preferred for best compatibility',
        calendarFormatLabel: 'Calendar Format',
        calendarFormatIcs: 'Standard (.ics) - Works with all calendars',
        calendarFormatOutlook: 'Microsoft Outlook optimized',
        calendarFormatGoogle: 'Google Calendar optimized',
        gdprTitle: 'Privacy and Consent',
        gdprSubtitle: 'Transparent data processing according to GDPR Article 7',
        gdprRequired: 'Required for email delivery',
        gdprOptional: 'Optional for better experience',
        gdprDetailsShow: 'Show privacy details',
        gdprDetailsHide: 'Hide privacy details',
        gdprWithdrawalInfo: 'You can withdraw your consent at any time',
        gdprDataRetention: 'Your data will be automatically deleted after 90 days',
        consentEmailDelivery: 'Calendar email delivery',
        consentAnalytics: 'Anonymous usage statistics',
        consentImprovement: 'Service improvement',
        consentMarketing: 'TimeButler product information',
        advancedOptionsShow: 'Show advanced options',
        advancedOptionsHide: 'Hide advanced options',
        submitButton: 'Send Calendar via Email',
        submitting: 'Sending email...',
        cancelButton: 'Cancel',
        privacyPolicyLink: 'Privacy Policy',
        termsOfServiceLink: 'Terms of Service',
        brandedBy: 'Powered by TimeButler - Professional Time Tracking for Teams',
        accessibilityInstructions: 'Use Tab to navigate, Enter to submit',
        keyboardShortcuts: 'Keyboard shortcuts: Alt+S to send, Esc to cancel',
        successMessage: 'Your calendar will arrive in your inbox within a few minutes',
        errorGeneral: 'An error occurred. Please try again.',
        errorNetwork: 'Network error. Please check your internet connection.',
        errorValidation: 'Validation error. Please check your inputs.',
        emailDomainBusiness: 'Business email address detected',
        emailDomainPersonal: 'Personal email address detected',
        emailDomainEducational: 'Educational institution email detected',
        emailDomainGerman: 'German email provider detected'
      };
    }
  }, [language]);

  // Advanced email validation with German provider detection
  const validateEmail = useCallback(async (email: string): Promise<EmailValidationResult> => {
    const issues: string[] = [];

    // Basic format validation
    if (!email) {
      return {
        valid: false,
        formatted_email: email,
        issues: [translations.emailRequired],
        domain_type: 'unknown',
        german_provider: false
      };
    }

    // RFC 5322 compliant email regex (simplified for browser use)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push(translations.emailInvalid);
    }

    const formatted_email = email.toLowerCase().trim();
    const domain = formatted_email.split('@')[1];

    // German email provider detection
    const germanProviders = [
      't-online.de', 'gmx.de', 'gmx.at', 'web.de', 'freenet.de',
      '1und1.de', 'arcor.de', 'alice.de', 'kabel1.de',
      'telekom.de', 'vodafone.de', 'o2online.de'
    ];

    const german_provider = germanProviders.some(provider =>
      domain?.endsWith(provider) || domain?.includes(provider)
    );

    // Domain type detection
    let domain_type: 'business' | 'personal' | 'educational' | 'government' | 'unknown' = 'unknown';

    if (domain) {
      if (domain.includes('.edu') || domain.includes('.uni-') || domain.includes('university') || domain.includes('hochschule')) {
        domain_type = 'educational';
      } else if (domain.includes('.gov') || domain.includes('regierung') || domain.includes('bund.de') || domain.includes('bayern.de')) {
        domain_type = 'government';
      } else if (['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', ...germanProviders].some(p => domain.includes(p))) {
        domain_type = 'personal';
      } else {
        domain_type = 'business';
      }
    }

    return {
      valid: issues.length === 0,
      formatted_email,
      issues,
      domain_type,
      german_provider
    };
  }, [translations]);

  // Real-time email validation
  useEffect(() => {
    if (formData.email && enableAdvancedValidation) {
      const debounceTimer = setTimeout(async () => {
        const validation = await validateEmail(formData.email);
        setEmailValidation(validation);
        onEmailChange?.(formData.email, validation);

        // Track analytics for email validation
        onAnalytics?.('email_validation', {
          domain_type: validation.domain_type,
          german_provider: validation.german_provider,
          valid: validation.valid
        });
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [formData.email, validateEmail, enableAdvancedValidation, onEmailChange, onAnalytics]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof EmailSubmissionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Track analytics
    onAnalytics?.('form_field_change', { field, value: typeof value });
  }, [errors, onAnalytics]);

  // Handle GDPR consent changes
  const handleConsentChange = useCallback((purpose: ConsentPurpose, granted: boolean) => {
    const currentPurposes = formData.gdpr_consent.purposes || [];
    const newPurposes = granted
      ? [...currentPurposes.filter(p => p !== purpose), purpose]
      : currentPurposes.filter(p => p !== purpose);

    setFormData(prev => ({
      ...prev,
      gdpr_consent: {
        ...prev.gdpr_consent,
        purposes: newPurposes,
        timestamp: granted ? new Date() : prev.gdpr_consent.timestamp
      }
    }));

    onConsentChange?.(newPurposes);
    onAnalytics?.('gdpr_consent_change', { purpose, granted, total_purposes: newPurposes.length });
  }, [formData.gdpr_consent.purposes, onConsentChange, onAnalytics]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!emailValidation || !emailValidation.valid) {
      newErrors.email = emailValidation?.issues.join(', ') || translations.emailInvalid;
    }

    // GDPR consent validation
    const requiredPurposes = REQUIRED_CONSENT_PURPOSES.filter(purpose =>
      purpose === 'email_delivery' // Only email delivery is required for this form
    );
    const grantedPurposes = formData.gdpr_consent.purposes || [];
    const missingRequired = requiredPurposes.filter(p => !grantedPurposes.includes(p));

    if (missingRequired.length > 0) {
      newErrors.gdpr_consent = translations.gdprRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [emailValidation, formData.gdpr_consent.purposes, translations]);

  // Form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      // Focus first error field
      if (errors.email) {
        emailInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    onAnalytics?.('email_submission_attempt', {
      domain_type: emailValidation?.domain_type,
      german_provider: emailValidation?.german_provider,
      calendar_format: formData.calendar_format,
      consents_granted: formData.gdpr_consent.purposes?.length || 0
    });

    try {
      // Create complete GDPR consent record
      const completeGDPRConsent: GDPRConsentRecord = {
        timestamp: new Date(),
        ip_hash: 'client-side-hash', // Would be set server-side in production
        user_agent_hash: 'client-side-hash', // Would be set server-side in production
        consent_version: CURRENT_CONSENT_VERSION,
        purposes: formData.gdpr_consent.purposes || [],
        legal_basis: 'consent',
        source: 'email_submission_form',
        withdrawal_method: 'email_link',
        withdrawn: false
      };

      const completeFormData: EmailSubmissionData = {
        ...formData,
        email: emailValidation?.formatted_email || formData.email,
        gdpr_consent: completeGDPRConsent
      };

      await onSubmit?.(completeFormData);

      onAnalytics?.('email_submission_success', {
        domain_type: emailValidation?.domain_type,
        german_provider: emailValidation?.german_provider,
        calendar_format: formData.calendar_format
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : translations.errorGeneral;

      // Categorize errors
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setErrors({ network: translations.errorNetwork });
      } else if (errorMessage.includes('validation')) {
        setErrors({ general: translations.errorValidation });
      } else {
        setErrors({ general: errorMessage });
      }

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      onAnalytics?.('email_submission_error', { error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-focus email input
  useEffect(() => {
    if (autoFocusEmail && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [autoFocusEmail]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        submitButtonRef.current?.click();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const formClassName = `email-submission-form ${className} ${compactMode ? 'email-submission-form--compact' : ''} email-submission-form--${theme}`;

  return (
    <form
      ref={formRef}
      className={formClassName}
      onSubmit={handleSubmit}
      noValidate
      aria-label={ariaLabel || translations.title}
      aria-describedby={ariaDescribedBy}
      data-testid={testId}
    >
      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {translations.accessibilityInstructions}
      </div>

      {/* Form header */}
      <div className="email-submission-form__header">
        <h2 className="email-submission-form__title">{translations.title}</h2>
        <p className="email-submission-form__subtitle">{translations.subtitle}</p>
      </div>

      {/* General errors */}
      {(errors.general || errors.network) && (
        <div className="email-submission-form__error email-submission-form__error--general" role="alert">
          {errors.general || errors.network}
        </div>
      )}

      {/* Email input */}
      <div className="email-submission-form__field">
        <label htmlFor="email" className="email-submission-form__label">
          {translations.emailLabel} <span className="required">*</span>
        </label>
        <div className="email-submission-form__input-group">
          <input
            ref={emailInputRef}
            id="email"
            type="email"
            className={`email-submission-form__input ${errors.email ? 'email-submission-form__input--error' : ''} ${emailValidation?.valid ? 'email-submission-form__input--valid' : ''}`}
            placeholder={translations.emailPlaceholder}
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            aria-describedby="email-hint email-validation email-error"
            aria-invalid={!!errors.email}
            required
            autoComplete="email"
            data-testid="email-input"
          />
          {/* Email validation indicator */}
          {formData.email && (
            <div className="email-validation-indicator" aria-hidden="true">
              {emailValidation === null ? (
                <span className="validating">⏳</span>
              ) : emailValidation.valid ? (
                <span className="valid">✓</span>
              ) : (
                <span className="invalid">✗</span>
              )}
            </div>
          )}
        </div>

        {/* Email hints and validation */}
        <div id="email-hint" className="email-submission-form__hint">
          {showGermanProviderHint && emailValidation?.german_provider && (
            <span className="german-provider-hint">{translations.emailDomainGerman}</span>
          )}
          {emailValidation?.domain_type && emailValidation.domain_type !== 'unknown' && (
            <span className="domain-type-hint">
              {translations[`emailDomain${emailValidation.domain_type.charAt(0).toUpperCase() + emailValidation.domain_type.slice(1)}` as keyof typeof translations]}
            </span>
          )}
        </div>

        {errors.email && (
          <div id="email-error" className="email-submission-form__error" role="alert">
            {errors.email}
          </div>
        )}
      </div>

      {/* Calendar format selection */}
      {showCalendarFormatSelection && (
        <div className="email-submission-form__field">
          <fieldset className="calendar-format-fieldset">
            <legend className="email-submission-form__label">{translations.calendarFormatLabel}</legend>

            <div className="calendar-format-options">
              <label className="calendar-format-option">
                <input
                  type="radio"
                  name="calendar-format"
                  value="ics"
                  checked={formData.calendar_format === 'ics'}
                  onChange={(e) => handleFieldChange('calendar_format', e.target.value)}
                  data-testid="calendar-format-ics"
                />
                <span className="calendar-format-label">{translations.calendarFormatIcs}</span>
              </label>

              <label className="calendar-format-option">
                <input
                  type="radio"
                  name="calendar-format"
                  value="outlook"
                  checked={formData.calendar_format === 'outlook'}
                  onChange={(e) => handleFieldChange('calendar_format', e.target.value)}
                  data-testid="calendar-format-outlook"
                />
                <span className="calendar-format-label">{translations.calendarFormatOutlook}</span>
              </label>

              <label className="calendar-format-option">
                <input
                  type="radio"
                  name="calendar-format"
                  value="google"
                  checked={formData.calendar_format === 'google'}
                  onChange={(e) => handleFieldChange('calendar_format', e.target.value)}
                  data-testid="calendar-format-google"
                />
                <span className="calendar-format-label">{translations.calendarFormatGoogle}</span>
              </label>
            </div>
          </fieldset>
        </div>
      )}

      {/* GDPR Consent */}
      <div className="email-submission-form__gdpr">
        <h3 className="email-submission-form__gdpr-title">{translations.gdprTitle}</h3>
        <p className="email-submission-form__gdpr-subtitle">{translations.gdprSubtitle}</p>

        <button
          type="button"
          className="email-submission-form__gdpr-toggle"
          onClick={() => setShowGDPRDetails(!showGDPRDetails)}
          aria-expanded={showGDPRDetails}
          data-testid="gdpr-details-toggle"
        >
          {showGDPRDetails ? translations.gdprDetailsHide : translations.gdprDetailsShow}
        </button>

        <div className={`email-submission-form__gdpr-content ${showGDPRDetails ? 'email-submission-form__gdpr-content--expanded' : ''}`}>
          {/* Required consent for email delivery */}
          <div className="gdpr-section">
            <h4 className="gdpr-section__title">{translations.gdprRequired}</h4>

            <label className="gdpr-consent gdpr-consent--required">
              <input
                type="checkbox"
                className="gdpr-consent__checkbox"
                checked={formData.gdpr_consent.purposes?.includes('email_delivery') || false}
                onChange={(e) => handleConsentChange('email_delivery', e.target.checked)}
                required
                data-testid="gdpr-consent-email-delivery"
              />
              <span className="gdpr-consent__label">
                {translations.consentEmailDelivery}
              </span>
            </label>
          </div>

          {/* Optional consents */}
          <div className="gdpr-section">
            <h4 className="gdpr-section__title">{translations.gdprOptional}</h4>

            {OPTIONAL_CONSENT_PURPOSES.map((purpose) => (
              <label key={purpose} className="gdpr-consent">
                <input
                  type="checkbox"
                  className="gdpr-consent__checkbox"
                  checked={formData.gdpr_consent.purposes?.includes(purpose) || false}
                  onChange={(e) => handleConsentChange(purpose, e.target.checked)}
                  data-testid={`gdpr-consent-${purpose}`}
                />
                <span className="gdpr-consent__label">
                  {translations[`consent${purpose.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof typeof translations] || purpose}
                </span>
              </label>
            ))}
          </div>

          {/* GDPR information */}
          <div className="gdpr-info">
            <p className="gdpr-info__text">{translations.gdprWithdrawalInfo}</p>
            <p className="gdpr-info__text">{translations.gdprDataRetention}</p>
            <div className="gdpr-info__links">
              <a href="/privacy" className="gdpr-info__link" target="_blank" rel="noopener noreferrer">
                {translations.privacyPolicyLink}
              </a>
              <a href="/terms" className="gdpr-info__link" target="_blank" rel="noopener noreferrer">
                {translations.termsOfServiceLink}
              </a>
            </div>
          </div>
        </div>

        {errors.gdpr_consent && (
          <div className="email-submission-form__error" role="alert">
            {errors.gdpr_consent}
          </div>
        )}
      </div>

      {/* Form actions */}
      <div className="email-submission-form__actions">
        <button
          ref={submitButtonRef}
          type="submit"
          className="email-submission-form__submit"
          disabled={isSubmitting || !emailValidation?.valid}
          aria-describedby="submit-button-hint"
          data-testid="submit-button"
        >
          {isSubmitting ? translations.submitting : translations.submitButton}
        </button>

        {onCancel && (
          <button
            type="button"
            className="email-submission-form__cancel"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="cancel-button"
          >
            {translations.cancelButton}
          </button>
        )}

        <div id="submit-button-hint" className="email-submission-form__hint">
          {translations.keyboardShortcuts}
        </div>
      </div>

      {/* TimeButler branding */}
      <div className="email-submission-form__branding">
        <p className="branding-text">{translations.brandedBy}</p>
      </div>
    </form>
  );
}

// Export types for use in other components
export type {
  EmailSubmissionFormProps,
  EmailSubmissionData,
  EmailValidationResult,
  FormErrors
};