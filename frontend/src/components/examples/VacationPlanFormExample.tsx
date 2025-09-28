/**
 * VacationPlanForm Examples - Demonstrating Usage Patterns
 *
 * This file provides comprehensive examples of VacationPlanForm component usage
 * including different configurations, language variants, and integration patterns.
 */

import React, { useState, useCallback } from 'react';
import VacationPlanForm, { VacationPlanFormData, VacationBudgetValidation } from '../VacationPlanForm';
import { BridgeWeekend, Holiday } from '../../types/holiday';
import { GermanStateCode } from '../../types/state';
import '../../../styles/VacationPlanForm.css';

// Mock data for examples
const mockHolidays: Holiday[] = [
  {
    id: 'neujahr-2025',
    name_de: 'Neujahr',
    name_en: 'New Year\'s Day',
    date: '2025-01-01',
    type: 'federal',
    states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    is_catholic: false,
    is_protestant: false
  },
  {
    id: 'heilige-drei-koenige-2025',
    name_de: 'Heilige Drei Könige',
    name_en: 'Epiphany',
    date: '2025-01-06',
    type: 'state',
    states: ['BW', 'BY', 'ST'],
    is_catholic: true,
    is_protestant: false
  }
];

const mockBridgeWeekends: BridgeWeekend[] = [
  {
    id: 'bridge-neujahr-2025',
    holiday_id: 'neujahr-2025',
    state_code: 'BY',
    start_date: '2024-12-30',
    end_date: '2025-01-03',
    vacation_days_needed: 2,
    total_days_off: 5,
    efficiency: 2.5,
    pattern: 'thursday-friday'
  },
  {
    id: 'bridge-epiphany-2025',
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
    id: 'bridge-easter-2025',
    holiday_id: 'karfreitag-2025',
    state_code: 'BY',
    start_date: '2025-04-17',
    end_date: '2025-04-22',
    vacation_days_needed: 3,
    total_days_off: 6,
    efficiency: 2.0,
    pattern: 'sandwich'
  },
  {
    id: 'bridge-christmas-2025',
    holiday_id: 'weihnachten-2025',
    state_code: 'BY',
    start_date: '2025-12-22',
    end_date: '2025-12-31',
    vacation_days_needed: 4,
    total_days_off: 10,
    efficiency: 2.5,
    pattern: 'extend-weekend'
  }
];

/**
 * Basic German Form Example
 */
export function BasicGermanExample() {
  const [formData, setFormData] = useState<Partial<VacationPlanFormData>>({});
  const [validation, setValidation] = useState<VacationBudgetValidation | null>(null);

  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Form submitted with data:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Vacation plan created successfully!');
  };

  const handleFormChange = useCallback((data: Partial<VacationPlanFormData>) => {
    setFormData(data);
  }, []);

  const handleValidationChange = useCallback((validation: VacationBudgetValidation) => {
    setValidation(validation);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Basic German Form</h2>
      <p>Standard German vacation planning form with all features enabled.</p>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="de"
        onSubmit={handleSubmit}
        onFormChange={handleFormChange}
        onValidationChange={handleValidationChange}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={true}
        data-testid="basic-german-form"
      />

      {/* Debug information */}
      <details style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9' }}>
        <summary>Debug Information</summary>
        <div style={{ marginTop: '1rem' }}>
          <h4>Current Form Data:</h4>
          <pre>{JSON.stringify(formData, null, 2)}</pre>

          <h4>Current Validation:</h4>
          <pre>{JSON.stringify(validation, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}

/**
 * Basic English Form Example
 */
export function BasicEnglishExample() {
  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Form submitted with data:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Vacation plan created successfully!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Basic English Form</h2>
      <p>English vacation planning form with casual tone and expat-friendly language.</p>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="en"
        onSubmit={handleSubmit}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={true}
        data-testid="basic-english-form"
      />
    </div>
  );
}

/**
 * Compact Form Example
 */
export function CompactFormExample() {
  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Compact form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Urlaubsplan erstellt!');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>Compact Form</h2>
      <p>Space-efficient form for mobile or sidebar placement.</p>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends.slice(0, 2)} // Fewer options
        holidays={mockHolidays}
        language="de"
        compact={true}
        onSubmit={handleSubmit}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={false} // Reduced features for compact mode
        enableGDPRConsent={true}
        data-testid="compact-form"
      />
    </div>
  );
}

/**
 * Pre-filled Form Example
 */
export function PrefilledFormExample() {
  const initialData: Partial<VacationPlanFormData> = {
    vacation_days_budget: 30,
    email: 'max.mustermann@example.de',
    language_preference: 'de',
    selected_bridges: [mockBridgeWeekends[0], mockBridgeWeekends[1]]
  };

  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Pre-filled form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Urlaubsplan aktualisiert!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Pre-filled Form</h2>
      <p>Form with initial data, useful for editing existing vacation plans.</p>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="de"
        initialData={initialData}
        onSubmit={handleSubmit}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={true}
        data-testid="prefilled-form"
      />
    </div>
  );
}

/**
 * Validation-Only Form Example
 */
export function ValidationOnlyExample() {
  const [validation, setValidation] = useState<VacationBudgetValidation | null>(null);
  const [selectedBridges, setSelectedBridges] = useState<BridgeWeekend[]>([]);

  const handleValidationChange = useCallback((validation: VacationBudgetValidation) => {
    setValidation(validation);
  }, []);

  const handleBridgeSelect = useCallback((bridge: BridgeWeekend) => {
    setSelectedBridges(prev => [...prev, bridge]);
  }, []);

  const handleBridgeDeselect = useCallback((bridge: BridgeWeekend) => {
    setSelectedBridges(prev => prev.filter(b => b.id !== bridge.id));
  }, []);

  const handleSubmit = async (data: VacationPlanFormData) => {
    // No actual submission, just validation
    console.log('Validation complete:', data);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Validation-Only Form</h2>
      <p>Form focused on budget validation and optimization recommendations.</p>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="de"
        onSubmit={handleSubmit}
        onValidationChange={handleValidationChange}
        onBridgeSelect={handleBridgeSelect}
        onBridgeDeselect={handleBridgeDeselect}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={false}
        data-testid="validation-only-form"
      />

      {/* Validation Summary */}
      {validation && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: validation.sufficient ? '#f0f9ff' : '#fef2f2',
          border: `1px solid ${validation.sufficient ? '#0284c7' : '#dc2626'}`,
          borderRadius: '0.5rem'
        }}>
          <h3>Validation Summary</h3>
          <div>
            <strong>Status:</strong> {validation.sufficient ? 'Budget sufficient' : 'Budget exceeded'}
          </div>
          <div>
            <strong>Required Days:</strong> {validation.required_days}
          </div>
          <div>
            <strong>Remaining Days:</strong> {validation.remaining_days}
          </div>
          <div>
            <strong>Efficiency:</strong> {validation.efficiency.toFixed(2)}x
          </div>

          {validation.warnings.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Warnings:</strong>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning.message_de}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.recommendations.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Recommendations:</strong>
              <ul>
                {validation.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dark Theme Example
 */
export function DarkThemeExample() {
  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Dark theme form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Vacation plan created!');
  };

  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: '#f3f4f6',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: '#f3f4f6' }}>Dark Theme Form</h2>
        <p style={{ color: '#9ca3af' }}>Vacation planning form with dark theme support.</p>

        <VacationPlanForm
          availableBridges={mockBridgeWeekends}
          holidays={mockHolidays}
          language="en"
          theme="dark"
          onSubmit={handleSubmit}
          showEfficiencyMetrics={true}
          enableRealTimeValidation={true}
          showRecommendations={true}
          enableGDPRConsent={true}
          data-testid="dark-theme-form"
        />
      </div>
    </div>
  );
}

/**
 * Accessibility Testing Example
 */
export function AccessibilityTestExample() {
  const [analyticsEvents, setAnalyticsEvents] = useState<Array<{ event: string; data?: any }>>([]);

  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Accessible form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Urlaubsplan erstellt! Screen reader optimiert.');
  };

  const handleAnalytics = useCallback((event: string, data?: Record<string, any>) => {
    setAnalyticsEvents(prev => [...prev.slice(-9), { event, data }]); // Keep last 10 events
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Accessibility Test Form</h2>
      <p>
        Form with enhanced accessibility features. Try navigating with Tab/Shift+Tab,
        using a screen reader, or testing with high contrast mode.
      </p>

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '0.5rem' }}>
        <h3>Accessibility Features:</h3>
        <ul>
          <li>WCAG 2.1 Level AA compliance</li>
          <li>Screen reader optimized labels and descriptions</li>
          <li>Keyboard navigation support</li>
          <li>High contrast mode support</li>
          <li>Focus management and error announcements</li>
          <li>Semantic HTML structure</li>
        </ul>
      </div>

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="de"
        onSubmit={handleSubmit}
        onAnalytics={handleAnalytics}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={true}
        autoFocus={true}
        ariaLabel="Barrierefreies Urlaubsplanungsformular"
        ariaDescribedBy="accessibility-instructions"
        data-testid="accessibility-test-form"
      />

      <div id="accessibility-instructions" style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p>Dieses Formular ist für Screenreader optimiert und unterstützt Tastaturnavigation.</p>
      </div>

      {/* Analytics Events Log */}
      {analyticsEvents.length > 0 && (
        <details style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9' }}>
          <summary>Analytics Events ({analyticsEvents.length})</summary>
          <div style={{ marginTop: '1rem', maxHeight: '200px', overflow: 'auto' }}>
            {analyticsEvents.map((event, index) => (
              <div key={index} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                <strong>{event.event}</strong>
                {event.data && <span>: {JSON.stringify(event.data)}</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Error Handling Example
 */
export function ErrorHandlingExample() {
  const [shouldFail, setShouldFail] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const handleSubmit = async (data: VacationPlanFormData) => {
    if (shouldFail) {
      throw new Error('Simulated network error - please try again later');
    }

    console.log('Success form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Urlaubsplan erfolgreich erstellt!');
  };

  const handleError = useCallback((error: Error) => {
    setLastError(error);
    console.error('Form error:', error);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Error Handling Example</h2>
      <p>Demonstrates error handling and recovery patterns.</p>

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shouldFail}
            onChange={(e) => setShouldFail(e.target.checked)}
          />
          Simulate submission error
        </label>
      </div>

      {lastError && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: '#fef2f2',
          border: '1px solid #dc2626',
          borderRadius: '0.5rem',
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {lastError.message}
          <button
            onClick={() => setLastError(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid #dc2626',
              color: '#dc2626',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <VacationPlanForm
        availableBridges={mockBridgeWeekends}
        holidays={mockHolidays}
        language="de"
        onSubmit={handleSubmit}
        onError={handleError}
        showEfficiencyMetrics={true}
        enableRealTimeValidation={true}
        showRecommendations={true}
        enableGDPRConsent={true}
        data-testid="error-handling-form"
      />
    </div>
  );
}

/**
 * Full Demo Example with All Features
 */
export function FullDemoExample() {
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [compact, setCompact] = useState(false);
  const [formData, setFormData] = useState<Partial<VacationPlanFormData>>({});
  const [validation, setValidation] = useState<VacationBudgetValidation | null>(null);

  const handleSubmit = async (data: VacationPlanFormData) => {
    console.log('Full demo form submitted:', data);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const message = language === 'de'
      ? 'Ihr Urlaubsplan wurde erfolgreich erstellt und per E-Mail versendet!'
      : 'Your vacation plan has been created and sent via email!';
    alert(message);
  };

  const handleFormChange = useCallback((data: Partial<VacationPlanFormData>) => {
    setFormData(data);
  }, []);

  const handleValidationChange = useCallback((validation: VacationBudgetValidation) => {
    setValidation(validation);
  }, []);

  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2>Complete Vacation Plan Form Demo</h2>
        <p>Full-featured form with all customization options available.</p>

        {/* Control Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: theme === 'dark' ? '#374151' : '#f9f9f9',
          borderRadius: '0.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Language / Sprache:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'de' | 'en')}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="de">Deutsch (Formal)</option>
              <option value="en">English (Casual)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Theme:
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
              />
              Compact Mode
            </label>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '2fr 1fr', gap: '2rem' }}>
          <VacationPlanForm
            availableBridges={mockBridgeWeekends}
            holidays={mockHolidays}
            language={language}
            theme={theme}
            compact={compact}
            onSubmit={handleSubmit}
            onFormChange={handleFormChange}
            onValidationChange={handleValidationChange}
            showEfficiencyMetrics={true}
            enableRealTimeValidation={true}
            showRecommendations={true}
            enableGDPRConsent={true}
            data-testid="full-demo-form"
          />

          {/* Info Panel */}
          {!compact && (
            <div style={{
              padding: '1rem',
              background: theme === 'dark' ? '#374151' : '#f9f9f9',
              borderRadius: '0.5rem',
              height: 'fit-content'
            }}>
              <h3>Form State</h3>

              <div style={{ marginBottom: '1rem' }}>
                <h4>Configuration:</h4>
                <ul style={{ fontSize: '0.875rem' }}>
                  <li>Language: {language === 'de' ? 'German (Formal)' : 'English (Casual)'}</li>
                  <li>Theme: {theme}</li>
                  <li>Compact: {compact ? 'Yes' : 'No'}</li>
                </ul>
              </div>

              {validation && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4>Budget Status:</h4>
                  <div style={{
                    padding: '0.5rem',
                    background: validation.sufficient ? '#dcfce7' : '#fecaca',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>Required: {validation.required_days} days</div>
                    <div>Remaining: {validation.remaining_days} days</div>
                    <div>Efficiency: {validation.efficiency.toFixed(2)}x</div>
                  </div>
                </div>
              )}

              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Form Data</summary>
                <pre style={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export all examples
export {
  BasicGermanExample as BasicExample,
  BasicEnglishExample as EnglishExample,
  CompactFormExample as CompactExample,
  PrefilledFormExample as PrefilledExample,
  ValidationOnlyExample as ValidationExample,
  DarkThemeExample as DarkThemeExample,
  AccessibilityTestExample as AccessibilityExample,
  ErrorHandlingExample as ErrorExample,
  FullDemoExample as FullExample
};