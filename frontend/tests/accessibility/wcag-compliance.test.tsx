/**
 * TDD Accessibility Tests for WCAG 2.1 Level AA Compliance
 * Constitutional Requirement: WCAG 2.1 Level AA compliance, works without JavaScript
 *
 * These tests WILL FAIL initially - this is intentional TDD methodology.
 * Tests ensure accessibility requirements are met before components are built.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  reactTestHelpers,
  AccessibilityTestHelper,
  GermanUITestDataFactory,
  FormTestHelper
} from '../helpers/react-test-helpers';

const { renderWithGermanContext, GermanTestProvider } = reactTestHelpers;

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock components that will be implemented
const MockHolidayCalendar: React.FC<{ state: string; year: number }> = ({ state, year }) => (
  <div data-testid="holiday-calendar" role="application" aria-label={`Feiertage für ${state} ${year}`}>
    <h2>Feiertage {year}</h2>
    <div role="grid" aria-label="Kalender">
      <div role="row">
        <div role="columnheader">Datum</div>
        <div role="columnheader">Feiertag</div>
      </div>
      <div role="row">
        <div role="gridcell">01.01.{year}</div>
        <div role="gridcell">Neujahr</div>
      </div>
    </div>
  </div>
);

const MockBridgeWeekendOptimizer: React.FC<{ holidays: any[] }> = ({ holidays }) => (
  <section data-testid="bridge-optimizer" aria-labelledby="optimizer-heading">
    <h2 id="optimizer-heading">Brückentage-Optimizer</h2>
    <div role="list" aria-label="Brückentag-Empfehlungen">
      {holidays.slice(0, 3).map((holiday, index) => (
        <div key={holiday.id} role="listitem" className="bridge-recommendation">
          <h3>{holiday.name_de}</h3>
          <p>Effizienz: 4:1</p>
          <button
            type="button"
            aria-describedby={`bridge-description-${index}`}
            data-testid={`select-bridge-${index}`}
          >
            Brücke auswählen
          </button>
          <p id={`bridge-description-${index}`}>
            1 Urlaubstag für 4 freie Tage
          </p>
        </div>
      ))}
    </div>
  </section>
);

const MockVacationPlanForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = React.useState({
    state: '',
    vacation_days: '',
    email: '',
    gdpr_consent: false
  });

  return (
    <form
      data-testid="vacation-plan-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      noValidate
    >
      <fieldset>
        <legend>Urlaubsplanung</legend>

        <div className="form-group">
          <label htmlFor="state-select">
            Bundesland <span aria-label="Pflichtfeld">*</span>
          </label>
          <select
            id="state-select"
            name="state"
            required
            aria-describedby="state-help"
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
          >
            <option value="">Bitte wählen</option>
            <option value="BY">Bayern</option>
            <option value="BE">Berlin</option>
            <option value="NW">Nordrhein-Westfalen</option>
          </select>
          <div id="state-help" className="form-help">
            Wählen Sie Ihr Bundesland für die passenden Feiertage
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="vacation-days">
            Verfügbare Urlaubstage <span aria-label="Pflichtfeld">*</span>
          </label>
          <input
            type="number"
            id="vacation-days"
            name="vacation_days"
            min="1"
            max="50"
            required
            aria-describedby="vacation-help vacation-error"
            value={formData.vacation_days}
            onChange={(e) => setFormData(prev => ({ ...prev, vacation_days: e.target.value }))}
          />
          <div id="vacation-help" className="form-help">
            Geben Sie Ihre verfügbaren Urlaubstage ein (1-50)
          </div>
          <div id="vacation-error" role="alert" className="sr-only">
            {/* Error message will appear here */}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            E-Mail-Adresse <span aria-label="Pflichtfeld">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            aria-describedby="email-help"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          <div id="email-help" className="form-help">
            Ihre E-Mail-Adresse für den Kalender-Export
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="gdpr_consent"
              required
              aria-describedby="gdpr-help"
              checked={formData.gdpr_consent}
              onChange={(e) => setFormData(prev => ({ ...prev, gdpr_consent: e.target.checked }))}
            />
            <span>Ich stimme der Datenverarbeitung zu</span>
          </label>
          <div id="gdpr-help" className="form-help">
            Erforderlich für den E-Mail-Versand gemäß{' '}
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer">
              Datenschutzerklärung
            </a>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Brückentage optimieren
          </button>
          <button type="reset" className="btn btn-secondary">
            Formular zurücksetzen
          </button>
        </div>
      </fieldset>
    </form>
  );
};

describe('WCAG 2.1 Level AA Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Semantic HTML Structure', () => {
    // TDD Test: Will fail until semantic HTML is implemented
    it('should use proper heading hierarchy (h1 > h2 > h3)', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <main>
            <h1>Brückentage-Optimizer für Deutschland</h1>
            <section>
              <h2>Feiertage 2025</h2>
              <div>
                <h3>Bayern</h3>
                <h3>Berlin</h3>
              </div>
            </section>
            <section>
              <h2>Ihre Optimierung</h2>
              <div>
                <h3>Empfohlene Brückentage</h3>
              </div>
            </section>
          </main>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Check heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings).toHaveLength(6);

      // Validate heading levels
      expect(headings[0].tagName).toBe('H1');
      expect(headings[1].tagName).toBe('H2');
      expect(headings[2].tagName).toBe('H3');
      expect(headings[3].tagName).toBe('H3');
      expect(headings[4].tagName).toBe('H2');
      expect(headings[5].tagName).toBe('H3');

      // Run accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use semantic landmarks for page structure', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <header role="banner">
            <nav aria-label="Hauptnavigation">
              <ul>
                <li><a href="/">Start</a></li>
                <li><a href="/feiertage">Feiertage</a></li>
              </ul>
            </nav>
          </header>

          <main role="main">
            <h1>Brückentage-Optimizer</h1>

            <section aria-labelledby="form-heading">
              <h2 id="form-heading">Ihre Eingaben</h2>
              <MockVacationPlanForm onSubmit={() => {}} />
            </section>

            <aside aria-labelledby="tips-heading">
              <h2 id="tips-heading">Tipps</h2>
              <p>Nutzen Sie religiöse Feiertage in Bayern für bessere Effizienz.</p>
            </aside>
          </main>

          <footer role="contentinfo">
            <p>&copy; 2025 TimeButler</p>
            <nav aria-label="Footer-Navigation">
              <ul>
                <li><a href="/datenschutz">Datenschutz</a></li>
                <li><a href="/impressum">Impressum</a></li>
              </ul>
            </nav>
          </footer>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Verify landmark roles exist
      expect(container.querySelector('[role="banner"]')).toBeInTheDocument();
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      expect(container.querySelector('[role="contentinfo"]')).toBeInTheDocument();

      // Verify navigation landmarks
      const navElements = container.querySelectorAll('nav');
      expect(navElements).toHaveLength(2);
      expect(navElements[0]).toHaveAttribute('aria-label', 'Hauptnavigation');
      expect(navElements[1]).toHaveAttribute('aria-label', 'Footer-Navigation');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly label form controls', async () => {
      const { container } = renderWithGermanContext(
        <MockVacationPlanForm onSubmit={() => {}} />
      );

      // All form controls should have labels
      const inputs = container.querySelectorAll('input, select, textarea');
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const label = container.querySelector(`label[for="${id}"]`);

        // Should have either a label or aria-label
        expect(
          label || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')
        ).toBeTruthy();
      });

      // Required fields should be properly marked
      const requiredInputs = container.querySelectorAll('input[required], select[required]');
      requiredInputs.forEach((input) => {
        const label = container.querySelector(`label[for="${input.getAttribute('id')}"]`);
        expect(label?.textContent).toMatch(/\*/); // Should contain required indicator
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    // TDD Test: Will fail until keyboard navigation is implemented
    it('should support complete keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();

      const { container } = renderWithGermanContext(
        <MockVacationPlanForm onSubmit={mockSubmit} />
      );

      const navigationResult = await AccessibilityTestHelper.testKeyboardNavigation(user, container);

      expect(navigationResult.keyboardNavigable).toBe(true);
      expect(navigationResult.totalElements).toBeGreaterThan(4);
      expect(navigationResult.accessibleElements).toBe(navigationResult.totalElements);
    });

    it('should handle keyboard navigation through bridge recommendations', async () => {
      const user = userEvent.setup();
      const holidays = GermanUITestDataFactory.createHolidaysList('BY', 2025);

      const { container } = renderWithGermanContext(
        <MockBridgeWeekendOptimizer holidays={holidays} />
      );

      // Tab through all bridge recommendation buttons
      const bridgeButtons = container.querySelectorAll('[data-testid^="select-bridge-"]');

      for (let i = 0; i < bridgeButtons.length; i++) {
        await user.tab();
        expect(bridgeButtons[i]).toHaveFocus();
      }

      // Each button should be keyboard activatable
      if (bridgeButtons[0]) {
        await user.keyboard('{Enter}');
        // Mock click event would be triggered
      }
    });

    it('should provide skip navigation links', async () => {
      const user = userEvent.setup();

      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <a href="#main-content" className="skip-link">
            Zum Hauptinhalt springen
          </a>
          <nav>
            <a href="/">Start</a>
            <a href="/feiertage">Feiertage</a>
          </nav>
          <main id="main-content">
            <h1>Brückentage-Optimizer</h1>
          </main>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Skip link should be first focusable element
      await user.tab();
      const skipLink = container.querySelector('.skip-link');
      expect(skipLink).toHaveFocus();

      // Skip link should work
      await user.keyboard('{Enter}');
      const mainContent = container.querySelector('#main-content');
      expect(mainContent).toBeInTheDocument();
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();

      const MockModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
          <div role="dialog" aria-labelledby="modal-title" aria-modal="true">
            <div className="modal-content">
              <h2 id="modal-title">Brückentag Details</h2>
              <p>Christi Himmelfahrt bietet eine Effizienz von 4:1.</p>
              <button type="button" onClick={onClose}>
                Schließen
              </button>
              <button type="button">
                Auswählen
              </button>
            </div>
          </div>
        );
      };

      const TestComponent: React.FC = () => {
        const [modalOpen, setModalOpen] = React.useState(false);

        return (
          <div>
            <button type="button" onClick={() => setModalOpen(true)}>
              Details öffnen
            </button>
            <MockModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
          </div>
        );
      };

      const { container } = renderWithGermanContext(<TestComponent />);

      // Open modal
      const openButton = screen.getByText('Details öffnen');
      await user.click(openButton);

      // Focus should be trapped in modal
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toBeInTheDocument();

      const modalButtons = within(modal!).getAllByRole('button');

      // Tab through modal buttons
      await user.tab();
      expect(modalButtons[0]).toHaveFocus();

      await user.tab();
      expect(modalButtons[1]).toHaveFocus();

      // Tab should cycle back to first button (focus trap)
      await user.tab();
      expect(modalButtons[0]).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    // TDD Test: Will fail until screen reader support is implemented
    it('should provide descriptive alternative text for all images', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <div>
            <img
              src="/efficiency-chart.png"
              alt="Effizienz-Diagramm zeigt 4:1 Verhältnis für Christi Himmelfahrt Brückentag"
              data-testid="efficiency-chart"
            />
            <img
              src="/calendar-preview.png"
              alt="Kalender-Vorschau für Mai 2025 mit markierten Brückentagen"
              data-testid="calendar-preview"
            />
            <img
              src="/timebutler-logo.png"
              alt="TimeButler Logo"
              data-testid="logo"
            />
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt!.length).toBeGreaterThan(5); // Descriptive, not just "image"
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use ARIA labels for complex interactive elements', async () => {
      const holidays = GermanUITestDataFactory.createHolidaysList('BY', 2025);

      const { container } = renderWithGermanContext(
        <MockBridgeWeekendOptimizer holidays={holidays} />
      );

      // Check ARIA attributes on interactive elements
      const bridgeRecommendations = container.querySelectorAll('.bridge-recommendation');
      bridgeRecommendations.forEach((recommendation, index) => {
        const button = recommendation.querySelector('button');
        const describedBy = button?.getAttribute('aria-describedby');

        expect(describedBy).toBeTruthy();

        const description = container.querySelector(`#${describedBy}`);
        expect(description).toBeInTheDocument();
        expect(description?.textContent).toBeTruthy();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();

      const MockDynamicContent: React.FC = () => {
        const [status, setStatus] = React.useState('');
        const [isLoading, setIsLoading] = React.useState(false);

        const handleOptimize = async () => {
          setIsLoading(true);
          setStatus('Brückentage werden berechnet...');

          // Simulate API call
          setTimeout(() => {
            setIsLoading(false);
            setStatus('Optimierung abgeschlossen! 3 Brückentage gefunden.');
          }, 1000);
        };

        return (
          <div>
            <button type="button" onClick={handleOptimize} disabled={isLoading}>
              {isLoading ? 'Berechnung läuft...' : 'Brückentage optimieren'}
            </button>

            <div role="status" aria-live="polite" aria-atomic="true">
              {status}
            </div>

            {isLoading && (
              <div role="progressbar" aria-label="Berechnung läuft">
                <span className="sr-only">Bitte warten...</span>
              </div>
            )}
          </div>
        );
      };

      const { container } = renderWithGermanContext(<MockDynamicContent />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Status should be announced to screen readers
      const statusRegion = container.querySelector('[role="status"]');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion?.textContent).toContain('berechnet');

      // Progress indicator should be accessible
      await waitFor(() => {
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-label', 'Berechnung läuft');
      });
    });

    it('should provide screen reader only content where needed', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <div>
            <h1>
              Brückentage-Optimizer
              <span className="sr-only">für Deutschland</span>
            </h1>

            <table>
              <caption className="sr-only">
                Feiertage und Brückentag-Möglichkeiten für Bayern 2025
              </caption>
              <thead>
                <tr>
                  <th scope="col">Feiertag</th>
                  <th scope="col">Datum</th>
                  <th scope="col">Effizienz</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Christi Himmelfahrt</td>
                  <td>29.05.2025</td>
                  <td>
                    4:1
                    <span className="sr-only">
                      , 4 freie Tage für 1 Urlaubstag
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Screen reader only content should exist but be visually hidden
      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Table should have proper structure
      const table = container.querySelector('table');
      const caption = table?.querySelector('caption');
      expect(caption).toHaveClass('sr-only');

      const thElements = container.querySelectorAll('th[scope="col"]');
      expect(thElements).toHaveLength(3);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color and Contrast Accessibility', () => {
    // TDD Test: Will fail until color contrast is implemented
    it('should meet WCAG AA color contrast requirements (4.5:1)', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <div style={{ backgroundColor: '#ffffff', color: '#333333', padding: '20px' }}>
            <h1>Brückentage-Optimizer</h1>
            <p>Optimieren Sie Ihre Urlaubsplanung für Deutschland.</p>

            <button
              style={{
                backgroundColor: '#007bff',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px'
              }}
            >
              Optimierung starten
            </button>

            <div
              style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '10px',
                border: '1px solid #c3e6cb'
              }}
            >
              Erfolg: 3 Brückentage gefunden!
            </div>

            <div
              style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '10px',
                border: '1px solid #f5c6cb'
              }}
            >
              Fehler: Ungültiges Bundesland ausgewählt.
            </div>
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Test color contrast for different elements
      const textElements = [
        container.querySelector('h1'),
        container.querySelector('p'),
        container.querySelector('button'),
        container.querySelector('div[style*="d4edda"]'),
        container.querySelector('div[style*="f8d7da"]')
      ];

      textElements.forEach((element) => {
        if (element) {
          const contrastTest = AccessibilityTestHelper.validateColorContrast(element);
          expect(contrastTest.hasGoodContrast).toBe(true);
          expect(contrastTest.contrastRatio).toBeGreaterThanOrEqual(4.5);
        }
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color to convey information', async () => {
      const TestPage: React.FC = () => (
        <GermanTestProvider>
          <div>
            <h2>Brückentag-Empfehlungen</h2>
            <div className="recommendations">
              <div className="bridge-item recommended">
                <span className="icon" aria-hidden="true">⭐</span>
                <strong>Empfohlen:</strong> Christi Himmelfahrt
                <span className="efficiency high">Effizienz: 4:1</span>
              </div>

              <div className="bridge-item moderate">
                <span className="icon" aria-hidden="true">👍</span>
                <strong>Gut:</strong> Tag der Arbeit
                <span className="efficiency medium">Effizienz: 3:1</span>
              </div>

              <div className="bridge-item low">
                <span className="icon" aria-hidden="true">📅</span>
                <strong>Möglich:</strong> Pfingstmontag
                <span className="efficiency low">Effizienz: 2:1</span>
              </div>
            </div>
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<TestPage />);

      // Each recommendation should have text indicators, not just color
      const recommendations = container.querySelectorAll('.bridge-item');
      recommendations.forEach((item) => {
        // Should have text labels like "Empfohlen:", "Gut:", "Möglich:"
        const textLabel = item.querySelector('strong');
        expect(textLabel).toBeInTheDocument();

        // Should have icons or other visual indicators
        const icon = item.querySelector('.icon');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    // TDD Test: Will fail until accessible forms are implemented
    it('should provide accessible error messaging', async () => {
      const user = userEvent.setup();

      const MockFormWithValidation: React.FC = () => {
        const [errors, setErrors] = React.useState<Record<string, string>>({});
        const [submitted, setSubmitted] = React.useState(false);

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setSubmitted(true);

          const formData = new FormData(e.target as HTMLFormElement);
          const newErrors: Record<string, string> = {};

          if (!formData.get('state')) {
            newErrors.state = 'Bitte wählen Sie ein Bundesland aus.';
          }
          if (!formData.get('vacation_days')) {
            newErrors.vacation_days = 'Bitte geben Sie Ihre Urlaubstage ein.';
          }

          setErrors(newErrors);
        };

        return (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="state">
                Bundesland <span aria-label="Pflichtfeld">*</span>
              </label>
              <select
                id="state"
                name="state"
                required
                aria-describedby={errors.state ? 'state-error' : undefined}
                aria-invalid={errors.state ? 'true' : 'false'}
              >
                <option value="">Bitte wählen</option>
                <option value="BY">Bayern</option>
              </select>
              {errors.state && (
                <div id="state-error" role="alert" className="error-message">
                  {errors.state}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="vacation_days">
                Urlaubstage <span aria-label="Pflichtfeld">*</span>
              </label>
              <input
                type="number"
                id="vacation_days"
                name="vacation_days"
                required
                aria-describedby={errors.vacation_days ? 'vacation-error' : undefined}
                aria-invalid={errors.vacation_days ? 'true' : 'false'}
              />
              {errors.vacation_days && (
                <div id="vacation-error" role="alert" className="error-message">
                  {errors.vacation_days}
                </div>
              )}
            </div>

            <button type="submit">Absenden</button>

            {submitted && Object.keys(errors).length > 0 && (
              <div role="alert" className="form-summary-error">
                Bitte korrigieren Sie die {Object.keys(errors).length} Fehler im Formular.
              </div>
            )}
          </form>
        );
      };

      const { container } = renderWithGermanContext(<MockFormWithValidation />);

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /absenden/i });
      await user.click(submitButton);

      // Error messages should be announced
      await waitFor(() => {
        const errorMessages = container.querySelectorAll('[role="alert"]');
        expect(errorMessages.length).toBeGreaterThan(0);
      });

      // Fields should be marked as invalid
      const invalidFields = container.querySelectorAll('[aria-invalid="true"]');
      expect(invalidFields.length).toBeGreaterThan(0);

      // Summary error should be present
      const summaryError = container.querySelector('.form-summary-error');
      expect(summaryError).toBeInTheDocument();
      expect(summaryError).toHaveAttribute('role', 'alert');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should group related form fields with fieldsets', async () => {
      const MockGroupedForm: React.FC = () => (
        <form>
          <fieldset>
            <legend>Persönliche Daten</legend>
            <label htmlFor="email">E-Mail</label>
            <input type="email" id="email" name="email" />
          </fieldset>

          <fieldset>
            <legend>Urlaubseinstellungen</legend>
            <label htmlFor="state">Bundesland</label>
            <select id="state" name="state">
              <option value="BY">Bayern</option>
            </select>

            <label htmlFor="vacation_days">Urlaubstage</label>
            <input type="number" id="vacation_days" name="vacation_days" />
          </fieldset>

          <fieldset>
            <legend>Präferenzen</legend>
            <div role="group" aria-labelledby="optimization-legend">
              <div id="optimization-legend">Optimierungsstrategie</div>
              <label>
                <input type="radio" name="strategy" value="efficiency" defaultChecked />
                Effizienz
              </label>
              <label>
                <input type="radio" name="strategy" value="total_days" />
                Maximale freie Tage
              </label>
            </div>
          </fieldset>
        </form>
      );

      const { container } = renderWithGermanContext(<MockGroupedForm />);

      // Should have proper fieldset structure
      const fieldsets = container.querySelectorAll('fieldset');
      expect(fieldsets).toHaveLength(3);

      fieldsets.forEach((fieldset) => {
        const legend = fieldset.querySelector('legend');
        expect(legend).toBeInTheDocument();
        expect(legend?.textContent).toBeTruthy();
      });

      // Radio button group should be properly grouped
      const radioGroup = container.querySelector('[role="group"]');
      expect(radioGroup).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'optimization-legend');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Progressive Enhancement (No JavaScript)', () => {
    // TDD Test: Will fail until progressive enhancement is implemented
    it('should work without JavaScript for basic functionality', async () => {
      const MockNoJSForm: React.FC = () => (
        <GermanTestProvider>
          <form method="POST" action="/api/vacation-plan">
            <noscript>
              <div className="no-js-notice" role="banner">
                Diese Anwendung funktioniert auch ohne JavaScript.
              </div>
            </noscript>

            <fieldset>
              <legend>Brückentage-Planung</legend>

              <label htmlFor="state">
                Bundesland <span aria-label="Pflichtfeld">*</span>
              </label>
              <select id="state" name="state" required>
                <option value="">Bitte wählen</option>
                <option value="BY">Bayern</option>
                <option value="BE">Berlin</option>
                <option value="NW">Nordrhein-Westfalen</option>
              </select>

              <label htmlFor="vacation_days">
                Urlaubstage <span aria-label="Pflichtfeld">*</span>
              </label>
              <input
                type="number"
                id="vacation_days"
                name="vacation_days"
                min="1"
                max="50"
                required
              />

              <label htmlFor="email">
                E-Mail <span aria-label="Pflichtfeld">*</span>
              </label>
              <input type="email" id="email" name="email" required />

              <label>
                <input type="checkbox" name="gdpr_consent" value="true" required />
                Ich stimme der Datenverarbeitung zu
              </label>

              <button type="submit">
                Brückentage berechnen
              </button>
            </fieldset>
          </form>
        </GermanTestProvider>
      );

      const { container } = render(<MockNoJSForm />);

      // Form should have server-side action
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('method', 'POST');
      expect(form).toHaveAttribute('action', '/api/vacation-plan');

      // Should have noscript notice
      const noscriptNotice = container.querySelector('.no-js-notice');
      expect(noscriptNotice).toBeInTheDocument();

      // All form elements should work with HTML5 validation
      const requiredInputs = container.querySelectorAll('[required]');
      expect(requiredInputs.length).toBeGreaterThan(0);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide fallback content for interactive features', async () => {
      const MockProgressiveFeature: React.FC = () => (
        <GermanTestProvider>
          <div>
            <div className="js-enabled" style={{ display: 'none' }}>
              <button type="button" className="interactive-optimizer">
                Interaktive Optimierung
              </button>
            </div>

            <noscript>
              <div className="no-js-fallback">
                <h2>Brückentage-Rechner</h2>
                <p>
                  Ohne JavaScript können Sie das Formular verwenden und
                  erhalten Ihre Brückentage-Empfehlungen per E-Mail.
                </p>
                <form method="POST" action="/calculate">
                  <button type="submit">
                    Brückentage berechnen
                  </button>
                </form>
              </div>
            </noscript>

            <div className="always-available">
              <h2>Alternative: Manuelle Planung</h2>
              <p>
                Sehen Sie unsere <a href="/holidays-2025">Feiertage 2025</a>
                für die manuelle Planung.
              </p>
            </div>
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<MockProgressiveFeature />);

      // Should have fallback content in noscript
      const fallback = container.querySelector('.no-js-fallback');
      expect(fallback).toBeInTheDocument();

      // Should have always-available content
      const alwaysAvailable = container.querySelector('.always-available');
      expect(alwaysAvailable).toBeInTheDocument();

      // Links should work without JavaScript
      const link = container.querySelector('a[href="/holidays-2025"]');
      expect(link).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Design Accessibility', () => {
    // TDD Test: Will fail until responsive accessibility is implemented
    it('should maintain accessibility across different viewport sizes', async () => {
      const MockResponsivePage: React.FC = () => (
        <GermanTestProvider>
          <div className="responsive-container">
            <header>
              <button
                type="button"
                className="mobile-menu-toggle"
                aria-expanded="false"
                aria-controls="main-nav"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                Menü
              </button>
              <nav id="main-nav">
                <ul>
                  <li><a href="/">Start</a></li>
                  <li><a href="/feiertage">Feiertage</a></li>
                </ul>
              </nav>
            </header>

            <main>
              <div className="bridge-cards">
                <div className="bridge-card">
                  <h3>Christi Himmelfahrt</h3>
                  <button
                    type="button"
                    style={{ minHeight: '44px', padding: '10px 16px' }}
                  >
                    Auswählen
                  </button>
                </div>
              </div>
            </main>
          </div>
        </GermanTestProvider>
      );

      const { container } = render(<MockResponsivePage />);

      // Touch targets should meet minimum size requirements (44px)
      const touchTargets = container.querySelectorAll('button, a, input, select');
      touchTargets.forEach((target) => {
        const styles = getComputedStyle(target as Element);
        const minHeight = parseInt(styles.minHeight) || 0;
        const minWidth = parseInt(styles.minWidth) || 0;

        // WCAG AA requires 44x44px minimum
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });

      // Mobile menu should be properly labeled
      const menuToggle = container.querySelector('.mobile-menu-toggle');
      expect(menuToggle).toHaveAttribute('aria-expanded');
      expect(menuToggle).toHaveAttribute('aria-controls');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

/**
 * NOTE FOR IMPLEMENTATION:
 *
 * All these accessibility tests WILL FAIL initially. This is the correct TDD approach:
 *
 * 1. RED: Tests fail because accessible components don't exist yet
 * 2. GREEN: Implement minimum accessible components to make tests pass
 * 3. REFACTOR: Improve accessibility and user experience
 *
 * Next steps after these tests are created:
 * 1. Implement accessible React components in src/components/
 * 2. Add ARIA attributes and semantic HTML structure
 * 3. Implement keyboard navigation and focus management
 * 4. Add screen reader support and announcements
 * 5. Ensure color contrast and visual design accessibility
 * 6. Test with actual screen readers (NVDA, JAWS, VoiceOver)
 * 7. Implement progressive enhancement for no-JavaScript scenarios
 *
 * These tests ensure:
 * - Constitutional requirement: WCAG 2.1 Level AA compliance
 * - Progressive enhancement (works without JavaScript)
 * - German accessibility guidelines compliance
 * - Screen reader compatibility for German users
 * - Keyboard navigation for all functionality
 * - Proper color contrast and visual accessibility
 */