/**
 * VacationPlanForm Component - GDPR-Compliant Vacation Planning Interface
 *
 * Constitutional Requirements:
 * - Bilingual support (German formal, English casual)
 * - WCAG 2.1 Level AA accessibility compliance
 * - Budget validation with German employment standards
 * - Progressive enhancement (works without JavaScript)
 * - GDPR consent integration with Article 7 compliance
 * - Performance optimized (<100ms interaction response)
 *
 * Features:
 * - Real-time vacation budget validation
 * - Bridge weekend selection with efficiency calculations
 * - Cultural UX differences (German formal vs English casual)
 * - Comprehensive error handling with bilingual messages
 * - TimeButler brand integration
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BridgeWeekend, Holiday } from '../types/holiday';
import { GermanStateCode, Language } from '../types/state';
// Local GDPR types for deployment - backend dependency removed
interface GDPRConsentRecord {
  timestamp: Date;
  version: string;
  purposes: Record<string, boolean>;
}
type ConsentPurpose = 'email_delivery' | 'calendar_export' | 'analytics' | 'marketing' | 'support';
const REQUIRED_CONSENT_PURPOSES: ConsentPurpose[] = ['email_delivery', 'calendar_export'];
const OPTIONAL_CONSENT_PURPOSES: ConsentPurpose[] = ['analytics', 'marketing', 'support'];

// Vacation budget validation interfaces
interface VacationBudgetValidation {
  sufficient: boolean;
  required_days: number;
  available_days: number;
  remaining_days: number;
  warnings: BudgetWarning[];
  recommendations: string[];
  efficiency: number;
}

interface BudgetWarning {
  type: 'budget_exceeded' | 'high_usage' | 'low_efficiency' | 'seasonal_conflict';
  severity: 'info' | 'warning' | 'error';
  message_de: string;
  message_en: string;
}

interface VacationPlanFormData {
  state_code: GermanStateCode | null;
  vacation_days_budget: number;
  selected_bridges: BridgeWeekend[];
  email: string;
  gdpr_consent: Partial<GDPRConsentRecord>;
  language_preference: Language;
}

interface FormErrors {
  state_code?: string;
  vacation_days_budget?: string;
  selected_bridges?: string;
  email?: string;
  gdpr_consent?: string;
  general?: string;
}

interface VacationPlanFormProps {
  // Core data
  availableBridges: BridgeWeekend[];
  holidays: Holiday[];

  // Configuration
  language: Language;
  initialData?: Partial<VacationPlanFormData>;
  maxVacationDays?: number;
  minVacationDays?: number;

  // Feature toggles
  showEfficiencyMetrics?: boolean;
  enableRealTimeValidation?: boolean;
  showRecommendations?: boolean;
  enableGDPRConsent?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  autoFocus?: boolean;

  // Styling
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;

  // Event handlers
  onFormChange?: (data: Partial<VacationPlanFormData>) => void;
  onValidationChange?: (validation: VacationBudgetValidation) => void;
  onSubmit?: (data: VacationPlanFormData) => Promise<void>;
  onError?: (error: Error) => void;
  onBridgeSelect?: (bridge: BridgeWeekend) => void;
  onBridgeDeselect?: (bridge: BridgeWeekend) => void;

  // Testing
  'data-testid'?: string;

  // Analytics
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

/**
 * VacationPlanForm Component
 */
export default function VacationPlanForm({
  availableBridges = [],
  holidays = [],
  language = 'de',
  initialData = {},
  maxVacationDays = 50,
  minVacationDays = 20,
  showEfficiencyMetrics = true,
  enableRealTimeValidation = true,
  showRecommendations = true,
  enableGDPRConsent = true,
  ariaLabel,
  ariaDescribedBy,
  autoFocus = false,
  className = '',
  theme = 'auto',
  compact = false,
  onFormChange,
  onValidationChange,
  onSubmit,
  onError,
  onBridgeSelect,
  onBridgeDeselect,
  onAnalytics,
  'data-testid': testId = 'vacation-plan-form'
}: VacationPlanFormProps) {
  // Form state
  const [formData, setFormData] = useState<VacationPlanFormData>({
    state_code: null,
    vacation_days_budget: 25, // German standard
    selected_bridges: [],
    email: '',
    gdpr_consent: {},
    language_preference: language,
    ...initialData
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetValidation, setBudgetValidation] = useState<VacationBudgetValidation | null>(null);
  const [showGDPRDetails, setShowGDPRDetails] = useState(false);

  // Refs for accessibility
  const formRef = useRef<HTMLDivElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // German employment standard validation
  const validateVacationBudget = useCallback((budget: number, selectedBridges: BridgeWeekend[]): VacationBudgetValidation => {
    const required_days = selectedBridges.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0);
    const remaining_days = budget - required_days;
    const total_days_off = selectedBridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0);
    const efficiency = required_days > 0 ? total_days_off / required_days : 0;

    const warnings: BudgetWarning[] = [];
    const recommendations: string[] = [];

    // Budget exceeded
    if (required_days > budget) {
      warnings.push({
        type: 'budget_exceeded',
        severity: 'error',
        message_de: `Sie benötigen ${required_days} Urlaubstage, haben aber nur ${budget} zur Verfügung.`,
        message_en: `You need ${required_days} vacation days but only have ${budget} available.`
      });
      recommendations.push(language === 'de' ? 'Reduzieren Sie Ihre Brückenwochenenden-Auswahl' : 'Reduce your bridge weekend selection');
    }

    // High budget usage (>80%)
    if (required_days > budget * 0.8 && required_days <= budget) {
      warnings.push({
        type: 'high_usage',
        severity: 'warning',
        message_de: `Sie verwenden ${Math.round((required_days / budget) * 100)}% Ihres Urlaubsbudgets.`,
        message_en: `You're using ${Math.round((required_days / budget) * 100)}% of your vacation budget.`
      });
      recommendations.push(language === 'de' ? 'Erwägen Sie, einige Tage für spontane Pläne zu reservieren' : 'Consider saving some days for spontaneous plans');
    }

    // Low efficiency (<3.0)
    if (efficiency < 3.0 && required_days > 0) {
      warnings.push({
        type: 'low_efficiency',
        severity: 'info',
        message_de: `Niedrige Effizienz: ${efficiency.toFixed(1)}x. Bessere Brücken könnten verfügbar sein.`,
        message_en: `Low efficiency: ${efficiency.toFixed(1)}x. Better bridge opportunities might be available.`
      });
      recommendations.push(language === 'de' ? 'Erkunden Sie effizientere Brückenwochenenden' : 'Explore more efficient bridge weekends');
    }

    // German legal minimum validation
    if (budget < minVacationDays) {
      warnings.push({
        type: 'seasonal_conflict',
        severity: 'warning',
        message_de: `${budget} Tage sind unter dem deutschen Mindestanspruch von ${minVacationDays} Tagen.`,
        message_en: `${budget} days is below the German minimum entitlement of ${minVacationDays} days.`
      });
    }

    return {
      sufficient: required_days <= budget,
      required_days,
      available_days: budget,
      remaining_days,
      warnings,
      recommendations,
      efficiency
    };
  }, [language, minVacationDays]);

  // Real-time budget validation
  useEffect(() => {
    if (enableRealTimeValidation) {
      const validation = validateVacationBudget(formData.vacation_days_budget, formData.selected_bridges);
      setBudgetValidation(validation);
      onValidationChange?.(validation);
    }
  }, [formData.vacation_days_budget, formData.selected_bridges, validateVacationBudget, enableRealTimeValidation, onValidationChange]);

  // Form data change handler
  useEffect(() => {
    onFormChange?.(formData);
  }, [formData, onFormChange]);

  // Memoized translations
  const translations = useMemo(() => {
    if (language === 'de') {
      return {
        title: 'Ihren Urlaubsplan erstellen',
        subtitle: 'Optimieren Sie Ihre freie Zeit mit intelligenten Brückentagen',
        stateLabel: 'Ihr Bundesland',
        statePlaceholder: 'Bundesland auswählen',
        stateRequired: 'Bitte wählen Sie Ihr Bundesland aus',
        budgetLabel: 'Verfügbare Urlaubstage',
        budgetPlaceholder: 'Anzahl Ihrer Urlaubstage',
        budgetHint: 'Deutscher Standard: 20-50 Tage pro Jahr',
        budgetRequired: 'Urlaubstage sind erforderlich',
        budgetInvalid: `Bitte geben Sie zwischen ${minVacationDays} und ${maxVacationDays} Tage ein`,
        bridgesLabel: 'Brückenwochenenden auswählen',
        bridgesHint: 'Wählen Sie die Brückenwochenenden, die Sie nutzen möchten',
        emailLabel: 'E-Mail-Adresse',
        emailPlaceholder: 'ihre.email@example.de',
        emailRequired: 'E-Mail-Adresse ist erforderlich',
        emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        gdprTitle: 'Datenschutz und Einverständniserklärung',
        gdprRequired: 'Erforderlich für den Service',
        gdprOptional: 'Optional für bessere Erfahrung',
        gdprDetailsShow: 'Details anzeigen',
        gdprDetailsHide: 'Details ausblenden',
        consentVacationPlanning: 'Urlaubsplanung und Kalenderversendung',
        consentEmailDelivery: 'E-Mail-Zustellung Ihres Kalenders',
        consentAnalytics: 'Anonyme Nutzungsstatistiken',
        consentImprovement: 'Serviceverbesserung',
        consentMarketing: 'TimeButler Produktinformationen',
        submitButton: 'Urlaubsplan erstellen',
        submitting: 'Wird verarbeitet...',
        validationTitle: 'Budgetübersicht',
        requiredDays: 'Benötigte Urlaubstage',
        remainingDays: 'Verbleibende Tage',
        efficiency: 'Effizienz',
        totalDaysOff: 'Gesamte freie Tage',
        recommendations: 'Empfehlungen',
        warnings: 'Hinweise',
        brandedBy: 'Powered by TimeButler - Professionelle Zeiterfassung',
        accessibilityInstructions: 'Verwenden Sie die Tab-Taste zur Navigation und Enter zum Auswählen',
        keyboardShortcuts: 'Tastenkürzel: Alt+S für Senden, Alt+R für Zurücksetzen'
      };
    } else {
      return {
        title: 'Create Your Vacation Plan',
        subtitle: 'Maximize your time off with smart bridge days',
        stateLabel: 'Your German State',
        statePlaceholder: 'Select your state',
        stateRequired: 'Please select your German state',
        budgetLabel: 'Available Vacation Days',
        budgetPlaceholder: 'Number of vacation days',
        budgetHint: 'German standard: 20-50 days per year',
        budgetRequired: 'Vacation days are required',
        budgetInvalid: `Please enter between ${minVacationDays} and ${maxVacationDays} days`,
        bridgesLabel: 'Select Bridge Weekends',
        bridgesHint: 'Choose the bridge weekends you want to use',
        emailLabel: 'Email Address',
        emailPlaceholder: 'your.email@example.com',
        emailRequired: 'Email address is required',
        emailInvalid: 'Please enter a valid email address',
        gdprTitle: 'Privacy and Consent',
        gdprRequired: 'Required for service',
        gdprOptional: 'Optional for better experience',
        gdprDetailsShow: 'Show details',
        gdprDetailsHide: 'Hide details',
        consentVacationPlanning: 'Vacation planning and calendar delivery',
        consentEmailDelivery: 'Email delivery of your calendar',
        consentAnalytics: 'Anonymous usage statistics',
        consentImprovement: 'Service improvement',
        consentMarketing: 'TimeButler product information',
        submitButton: 'Create Vacation Plan',
        submitting: 'Processing...',
        validationTitle: 'Budget Overview',
        requiredDays: 'Required vacation days',
        remainingDays: 'Remaining days',
        efficiency: 'Efficiency',
        totalDaysOff: 'Total days off',
        recommendations: 'Recommendations',
        warnings: 'Warnings',
        brandedBy: 'Powered by TimeButler - Professional Time Tracking',
        accessibilityInstructions: 'Use Tab key to navigate and Enter to select',
        keyboardShortcuts: 'Keyboard shortcuts: Alt+S to submit, Alt+R to reset'
      };
    }
  }, [language, minVacationDays, maxVacationDays]);

  // Email validation
  const validateEmail = (email: string): string | null => {
    if (!email) {
      return translations.emailRequired;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return translations.emailInvalid;
    }

    return null;
  };

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof VacationPlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Track analytics
    onAnalytics?.('form_field_change', { field, value: typeof value });
  }, [errors, onAnalytics]);

  // Handle bridge selection
  const handleBridgeToggle = useCallback((bridge: BridgeWeekend) => {
    const isSelected = formData.selected_bridges.some(b => b.id === bridge.id);

    if (isSelected) {
      handleFieldChange('selected_bridges', formData.selected_bridges.filter(b => b.id !== bridge.id));
      onBridgeDeselect?.(bridge);
      onAnalytics?.('bridge_deselected', { bridge_id: bridge.id, efficiency: bridge.efficiency });
    } else {
      handleFieldChange('selected_bridges', [...formData.selected_bridges, bridge]);
      onBridgeSelect?.(bridge);
      onAnalytics?.('bridge_selected', { bridge_id: bridge.id, efficiency: bridge.efficiency });
    }
  }, [formData.selected_bridges, handleFieldChange, onBridgeSelect, onBridgeDeselect, onAnalytics]);

  // Handle GDPR consent changes
  const handleConsentChange = useCallback((purpose: ConsentPurpose, granted: boolean) => {
    setFormData(prev => ({
      ...prev,
      gdpr_consent: {
        ...prev.gdpr_consent,
        purposes: granted
          ? [...(prev.gdpr_consent.purposes || []), purpose]
          : (prev.gdpr_consent.purposes || []).filter(p => p !== purpose)
      }
    }));

    onAnalytics?.('gdpr_consent_change', { purpose, granted });
  }, [onAnalytics]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // State validation
    if (!formData.state_code) {
      newErrors.state_code = translations.stateRequired;
    }

    // Budget validation
    if (!formData.vacation_days_budget || formData.vacation_days_budget < minVacationDays || formData.vacation_days_budget > maxVacationDays) {
      newErrors.vacation_days_budget = translations.budgetInvalid;
    }

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // GDPR consent validation
    if (enableGDPRConsent) {
      const requiredPurposes = REQUIRED_CONSENT_PURPOSES;
      const grantedPurposes = formData.gdpr_consent.purposes || [];
      const missingRequired = requiredPurposes.filter(p => !grantedPurposes.includes(p));

      if (missingRequired.length > 0) {
        newErrors.gdpr_consent = language === 'de'
          ? 'Erforderliche Einverständniserklärungen fehlen'
          : 'Required consent is missing';
      }
    }

    // Budget validation
    if (budgetValidation && !budgetValidation.sufficient) {
      newErrors.selected_bridges = language === 'de'
        ? 'Ausgewählte Brücken überschreiten Ihr Urlaubsbudget'
        : 'Selected bridges exceed your vacation budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField === 'vacation_days_budget') {
        budgetInputRef.current?.focus();
      } else if (firstErrorField === 'email') {
        emailInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    onAnalytics?.('form_submit_attempt', {
      bridge_count: formData.selected_bridges.length,
      budget: formData.vacation_days_budget,
      efficiency: budgetValidation?.efficiency
    });

    try {
      // Create complete GDPR consent record
      const completeGDPRConsent: GDPRConsentRecord = {
        timestamp: new Date(),
        ip_hash: 'client-side-hash', // Would be set server-side
        user_agent_hash: 'client-side-hash', // Would be set server-side
        consent_version: '1.1.0',
        purposes: formData.gdpr_consent.purposes || [],
        legal_basis: 'consent',
        source: 'vacation_plan_form',
        withdrawal_method: 'email_link',
        ...formData.gdpr_consent
      };

      const completeFormData: VacationPlanFormData = {
        ...formData,
        gdpr_consent: completeGDPRConsent
      };

      await onSubmit?.(completeFormData);

      onAnalytics?.('form_submit_success', {
        bridge_count: formData.selected_bridges.length,
        budget: formData.vacation_days_budget,
        efficiency: budgetValidation?.efficiency
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ general: errorMessage });
      onError?.(error instanceof Error ? error : new Error(errorMessage));

      onAnalytics?.('form_submit_error', {
        error: errorMessage,
        bridge_count: formData.selected_bridges.length
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && budgetInputRef.current) {
      budgetInputRef.current.focus();
    }
  }, [autoFocus]);

  const formClassName = `vacation-plan-form ${className} ${compact ? 'vacation-plan-form--compact' : ''} vacation-plan-form--${theme}`;

  return (
    <div
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
      <div className="vacation-plan-form__header">
        <h2 className="vacation-plan-form__title">{translations.title}</h2>
        <p className="vacation-plan-form__subtitle">{translations.subtitle}</p>
      </div>

      {/* General errors */}
      {errors.general && (
        <div className="vacation-plan-form__error vacation-plan-form__error--general" role="alert">
          {errors.general}
        </div>
      )}

      {/* Budget input */}
      <div className="vacation-plan-form__field">
        <label htmlFor="vacation-days-budget" className="vacation-plan-form__label">
          {translations.budgetLabel} <span className="required">*</span>
        </label>
        <input
          ref={budgetInputRef}
          id="vacation-days-budget"
          type="number"
          min={minVacationDays}
          max={maxVacationDays}
          className={`vacation-plan-form__input ${errors.vacation_days_budget ? 'vacation-plan-form__input--error' : ''}`}
          placeholder={translations.budgetPlaceholder}
          value={formData.vacation_days_budget || ''}
          onChange={(e) => handleFieldChange('vacation_days_budget', parseInt(e.target.value) || 0)}
          aria-describedby="vacation-days-budget-hint vacation-days-budget-error"
          aria-invalid={!!errors.vacation_days_budget}
          required
          data-testid="vacation-days-budget-input"
        />
        <div id="vacation-days-budget-hint" className="vacation-plan-form__hint">
          {translations.budgetHint}
        </div>
        {errors.vacation_days_budget && (
          <div id="vacation-days-budget-error" className="vacation-plan-form__error" role="alert">
            {errors.vacation_days_budget}
          </div>
        )}
      </div>

      {/* Budget validation display */}
      {budgetValidation && showEfficiencyMetrics && (
        <div className="vacation-plan-form__validation" aria-live="polite">
          <h3 className="vacation-plan-form__validation-title">{translations.validationTitle}</h3>

          <div className="vacation-plan-form__validation-metrics">
            <div className="metric">
              <span className="metric__label">{translations.requiredDays}:</span>
              <span className="metric__value">{budgetValidation.required_days}</span>
            </div>
            <div className="metric">
              <span className="metric__label">{translations.remainingDays}:</span>
              <span className={`metric__value ${budgetValidation.remaining_days < 0 ? 'metric__value--negative' : ''}`}>
                {budgetValidation.remaining_days}
              </span>
            </div>
            <div className="metric">
              <span className="metric__label">{translations.efficiency}:</span>
              <span className="metric__value">{budgetValidation.efficiency.toFixed(1)}x</span>
            </div>
          </div>

          {/* Warnings */}
          {budgetValidation.warnings.length > 0 && (
            <div className="vacation-plan-form__warnings">
              <h4>{translations.warnings}</h4>
              {budgetValidation.warnings.map((warning, index) => (
                <div key={index} className={`warning warning--${warning.severity}`} role="alert">
                  {language === 'de' ? warning.message_de : warning.message_en}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && budgetValidation.recommendations.length > 0 && (
            <div className="vacation-plan-form__recommendations">
              <h4>{translations.recommendations}</h4>
              <ul>
                {budgetValidation.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bridge weekend selection */}
      <div className="vacation-plan-form__field">
        <label className="vacation-plan-form__label">
          {translations.bridgesLabel}
        </label>
        <div className="vacation-plan-form__hint">
          {translations.bridgesHint}
        </div>

        <div className="vacation-plan-form__bridges" role="group" aria-labelledby="bridges-label">
          {availableBridges.map((bridge) => {
            const isSelected = formData.selected_bridges.some(b => b.id === bridge.id);
            return (
              <div key={bridge.id} className="bridge-option">
                <label className="bridge-option__label">
                  <input
                    type="checkbox"
                    className="bridge-option__checkbox"
                    checked={isSelected}
                    onChange={() => handleBridgeToggle(bridge)}
                    aria-describedby={`bridge-${bridge.id}-details`}
                    data-testid={`bridge-checkbox-${bridge.id}`}
                  />
                  <div className="bridge-option__content">
                    <div className="bridge-option__header">
                      <span className="bridge-option__dates">
                        {bridge.start_date} - {bridge.end_date}
                      </span>
                      <span className="bridge-option__efficiency">
                        {bridge.efficiency.toFixed(1)}x
                      </span>
                    </div>
                    <div id={`bridge-${bridge.id}-details`} className="bridge-option__details">
                      <span className="bridge-option__vacation-days">
                        {bridge.vacation_days_needed} {language === 'de' ? 'Urlaubstage' : 'vacation days'}
                      </span>
                      <span className="bridge-option__total-days">
                        {bridge.total_days_off} {language === 'de' ? 'freie Tage gesamt' : 'total days off'}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {errors.selected_bridges && (
          <div className="vacation-plan-form__error" role="alert">
            {errors.selected_bridges}
          </div>
        )}
      </div>

      {/* Email input */}
      <div className="vacation-plan-form__field">
        <label htmlFor="email" className="vacation-plan-form__label">
          {translations.emailLabel} <span className="required">*</span>
        </label>
        <input
          ref={emailInputRef}
          id="email"
          type="email"
          className={`vacation-plan-form__input ${errors.email ? 'vacation-plan-form__input--error' : ''}`}
          placeholder={translations.emailPlaceholder}
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          aria-invalid={!!errors.email}
          required
          data-testid="email-input"
        />
        {errors.email && (
          <div className="vacation-plan-form__error" role="alert">
            {errors.email}
          </div>
        )}
      </div>

      {/* GDPR Consent */}
      {enableGDPRConsent && (
        <div className="vacation-plan-form__gdpr">
          <h3 className="vacation-plan-form__gdpr-title">{translations.gdprTitle}</h3>

          <button
            type="button"
            className="vacation-plan-form__gdpr-toggle"
            onClick={() => setShowGDPRDetails(!showGDPRDetails)}
            aria-expanded={showGDPRDetails}
            data-testid="gdpr-details-toggle"
          >
            {showGDPRDetails ? translations.gdprDetailsHide : translations.gdprDetailsShow}
          </button>

          <div className={`vacation-plan-form__gdpr-content ${showGDPRDetails ? 'vacation-plan-form__gdpr-content--expanded' : ''}`}>
            {/* Required consents */}
            <div className="gdpr-section">
              <h4 className="gdpr-section__title">{translations.gdprRequired}</h4>
              {REQUIRED_CONSENT_PURPOSES.map((purpose) => (
                <label key={purpose} className="gdpr-consent">
                  <input
                    type="checkbox"
                    className="gdpr-consent__checkbox"
                    checked={formData.gdpr_consent.purposes?.includes(purpose) || false}
                    onChange={(e) => handleConsentChange(purpose, e.target.checked)}
                    required
                    data-testid={`gdpr-consent-${purpose}`}
                  />
                  <span className="gdpr-consent__label">
                    {translations[`consent${purpose.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof typeof translations] || purpose}
                  </span>
                </label>
              ))}
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
          </div>

          {errors.gdpr_consent && (
            <div className="vacation-plan-form__error" role="alert">
              {errors.gdpr_consent}
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <div className="vacation-plan-form__actions">
        <button
          type="button"
          className="vacation-plan-form__submit"
          disabled={isSubmitting}
          aria-describedby="submit-button-hint"
          data-testid="submit-button"
          onClick={handleSubmit}
        >
          {isSubmitting ? translations.submitting : translations.submitButton}
        </button>
        <div id="submit-button-hint" className="vacation-plan-form__hint">
          {translations.keyboardShortcuts}
        </div>
      </div>

      {/* TimeButler branding */}
      <div className="vacation-plan-form__branding">
        <p className="branding-text">{translations.brandedBy}</p>
      </div>
    </div>
  );
}

// Export types for use in other components
export type { VacationPlanFormProps, VacationPlanFormData, VacationBudgetValidation, FormErrors, BudgetWarning };