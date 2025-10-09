/**
 * Vacation Planning Interface - plan.tsx
 *
 * Main planning interface for German bridge weekend optimization
 * Integrates all components with vacation optimization algorithms
 * Provides accessible, progressive enhancement-ready interface
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import { GetStaticProps } from 'next';

// Component imports
import {
  StateSelector,
  HolidayCalendar,
  BridgeWeekendCard,
  VacationPlanForm,
  EmailSubmissionForm,
} from '../components';

// Type imports
import type {
  GermanStateCode,
  Language,
  Holiday,
  BridgeWeekend,
  CalendarDate,
  CalendarMonth,
  CalendarView,
  CalendarA11yConfig,
  CalendarPerformanceConfig,
  BridgePattern,
  DEFAULT_PERFORMANCE_CONFIG,
} from '../types/holiday';

import type {
  VacationPlanFormData,
  VacationBudgetValidation,
  FormErrors,
  BudgetWarning,
} from '../components/VacationPlanForm';

import type {
  EmailSubmissionData,
  EmailValidationResult,
} from '../components/EmailSubmissionForm';

// Hook imports
import {
  useLanguage,
  LanguageProvider,
  useLanguageContext,
} from '../hooks';

// Accessibility providers
import { AccessibilityProvider } from '../hooks/AccessibilityProvider';

// Optimization algorithms
interface VacationOptimizationResult {
  recommended_bridges: BridgeWeekend[];
  efficiency_score: number;
  total_vacation_days: number;
  total_days_off: number;
  coverage_period: {
    start: string;
    end: string;
  };
  optimization_strategy: 'maximize_days' | 'maximize_efficiency' | 'balanced';
}

interface VacationConstraints {
  max_vacation_days: number;
  preferred_months?: number[];
  min_consecutive_days?: number;
  avoid_periods?: Array<{ start: string; end: string }>;
  efficiency_threshold?: number;
}

interface BridgeOpportunityAnalysis {
  holiday: Holiday;
  patterns: Array<{
    pattern: BridgePattern;
    vacation_days_needed: number;
    total_days_off: number;
    efficiency: number;
    start_date: string;
    end_date: string;
    working_days_covered: number;
  }>;
  best_pattern: BridgePattern;
  max_efficiency: number;
}

// German Bridge Weekend Optimization Algorithms
class GermanVacationOptimizer {
  /**
   * Calculate bridge opportunities for a given holiday
   */
  static analyzeBridgeOpportunities(
    holiday: Holiday,
    year: number = new Date().getFullYear()
  ): BridgeOpportunityAnalysis {
    const holidayDate = new Date(holiday.date);
    const dayOfWeek = holidayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const patterns: BridgeOpportunityAnalysis['patterns'] = [];

    // Thursday-Friday Bridge (holiday on Thursday, take Friday off)
    if (dayOfWeek === 4) { // Thursday
      const endDate = new Date(holidayDate);
      endDate.setDate(endDate.getDate() + 3); // Include weekend

      patterns.push({
        pattern: 'thursday-friday',
        vacation_days_needed: 1, // Take Friday off
        total_days_off: 4, // Thu (holiday) + Fri (vacation) + Sat + Sun
        efficiency: 4.0,
        start_date: holiday.date,
        end_date: this.formatDate(endDate),
        working_days_covered: 2, // Thursday and Friday
      });
    }

    // Monday-Tuesday Bridge (holiday on Monday, take Tuesday off)
    if (dayOfWeek === 1) { // Monday
      const startDate = new Date(holidayDate);
      startDate.setDate(startDate.getDate() - 2); // Include weekend
      const endDate = new Date(holidayDate);
      endDate.setDate(endDate.getDate() + 1); // Tuesday

      patterns.push({
        pattern: 'monday-tuesday',
        vacation_days_needed: 1, // Take Tuesday off
        total_days_off: 4, // Sat + Sun + Mon (holiday) + Tue (vacation)
        efficiency: 4.0,
        start_date: this.formatDate(startDate),
        end_date: this.formatDate(endDate),
        working_days_covered: 2, // Monday and Tuesday
      });
    }

    // Tuesday-Friday Bridge (holiday on Tuesday, take Wed-Fri off)
    if (dayOfWeek === 2) { // Tuesday
      const endDate = new Date(holidayDate);
      endDate.setDate(endDate.getDate() + 5); // Include weekend

      patterns.push({
        pattern: 'tuesday-friday',
        vacation_days_needed: 3, // Take Wed, Thu, Fri off
        total_days_off: 6, // Tue (holiday) + Wed-Fri (vacation) + Sat + Sun
        efficiency: 2.0,
        start_date: holiday.date,
        end_date: this.formatDate(endDate),
        working_days_covered: 4, // Tuesday through Friday
      });
    }

    // Sandwich Bridge (holiday between weekends)
    if (dayOfWeek === 2 || dayOfWeek === 4) { // Tuesday or Thursday
      const vacationDays = dayOfWeek === 2 ? 3 : 1; // Tue: take Mon,Wed-Fri; Thu: take Fri
      const totalDays = dayOfWeek === 2 ? 6 : 4;

      patterns.push({
        pattern: 'sandwich',
        vacation_days_needed: vacationDays,
        total_days_off: totalDays,
        efficiency: totalDays / vacationDays,
        start_date: holiday.date,
        end_date: this.formatDate(new Date(holidayDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000)),
        working_days_covered: vacationDays + 1,
      });
    }

    // Weekend Extension (holiday on Friday or Monday)
    if (dayOfWeek === 1 || dayOfWeek === 5) { // Monday or Friday
      const isMonday = dayOfWeek === 1;
      const vacationDays = 1;
      const totalDays = 3;

      patterns.push({
        pattern: 'extend-weekend',
        vacation_days_needed: vacationDays,
        total_days_off: totalDays,
        efficiency: 3.0,
        start_date: holiday.date,
        end_date: this.formatDate(new Date(holidayDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000)),
        working_days_covered: 1,
      });
    }

    // Find best pattern (highest efficiency)
    const bestPattern = patterns.reduce((best, current) =>
      current.efficiency > best.efficiency ? current : best,
      patterns[0]
    );

    return {
      holiday,
      patterns,
      best_pattern: bestPattern?.pattern || 'extend-weekend',
      max_efficiency: bestPattern?.efficiency || 0,
    };
  }

  /**
   * Optimize vacation plan for maximum efficiency
   */
  static optimizeVacationPlan(
    holidays: Holiday[],
    constraints: VacationConstraints,
    state: GermanStateCode,
    year: number = new Date().getFullYear()
  ): VacationOptimizationResult {
    // Filter holidays by state
    const stateHolidays = holidays.filter(holiday =>
      holiday.states.includes(state) || holiday.type === 'federal'
    );

    // Analyze bridge opportunities for each holiday
    const bridgeAnalyses = stateHolidays.map(holiday =>
      this.analyzeBridgeOpportunities(holiday, year)
    );

    // Sort by efficiency (best opportunities first)
    const sortedOpportunities = bridgeAnalyses
      .flatMap(analysis =>
        analysis.patterns.map(pattern => ({
          holiday: analysis.holiday,
          ...pattern,
          analysis,
        }))
      )
      .filter(opportunity =>
        !constraints.efficiency_threshold ||
        opportunity.efficiency >= constraints.efficiency_threshold
      )
      .sort((a, b) => b.efficiency - a.efficiency);

    // Greedy algorithm: select non-overlapping bridges within budget
    const selectedBridges: BridgeWeekend[] = [];
    let remainingVacationDays = constraints.max_vacation_days;
    const usedDates = new Set<string>();

    for (const opportunity of sortedOpportunities) {
      if (opportunity.vacation_days_needed <= remainingVacationDays) {
        // Check for date conflicts
        const dateRange = this.getDateRange(opportunity.start_date, opportunity.end_date);
        const hasConflict = dateRange.some(date => usedDates.has(date));

        if (!hasConflict) {
          // Add bridge to selection
          selectedBridges.push({
            id: `bridge_${opportunity.holiday.id}_${opportunity.pattern}`,
            holiday_id: opportunity.holiday.id,
            state_code: state,
            start_date: opportunity.start_date,
            end_date: opportunity.end_date,
            vacation_days_needed: opportunity.vacation_days_needed,
            total_days_off: opportunity.total_days_off,
            efficiency: opportunity.efficiency,
            pattern: opportunity.pattern,
          });

          // Update remaining budget and used dates
          remainingVacationDays -= opportunity.vacation_days_needed;
          dateRange.forEach(date => usedDates.add(date));
        }
      }
    }

    // Calculate overall metrics
    const totalVacationDays = constraints.max_vacation_days - remainingVacationDays;
    const totalDaysOff = selectedBridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0);
    const efficiencyScore = totalVacationDays > 0 ? totalDaysOff / totalVacationDays : 0;

    // Determine coverage period
    const startDates = selectedBridges.map(b => new Date(b.start_date));
    const endDates = selectedBridges.map(b => new Date(b.end_date));
    const coverageStart = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
    const coverageEnd = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date();

    return {
      recommended_bridges: selectedBridges,
      efficiency_score: Math.round(efficiencyScore * 100) / 100,
      total_vacation_days: totalVacationDays,
      total_days_off: totalDaysOff,
      coverage_period: {
        start: this.formatDate(coverageStart),
        end: this.formatDate(coverageEnd),
      },
      optimization_strategy: this.determineStrategy(constraints, selectedBridges),
    };
  }

  /**
   * Calculate real-time efficiency for current selection
   */
  static calculateRealTimeEfficiency(
    selectedBridges: BridgeWeekend[],
    availableVacationDays: number
  ): {
    efficiency: number;
    totalDaysOff: number;
    vacationDaysUsed: number;
    remainingDays: number;
    canAddMore: boolean;
  } {
    const vacationDaysUsed = selectedBridges.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0);
    const totalDaysOff = selectedBridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0);
    const efficiency = vacationDaysUsed > 0 ? totalDaysOff / vacationDaysUsed : 0;
    const remainingDays = availableVacationDays - vacationDaysUsed;

    return {
      efficiency: Math.round(efficiency * 100) / 100,
      totalDaysOff,
      vacationDaysUsed,
      remainingDays,
      canAddMore: remainingDays > 0,
    };
  }

  // Helper methods
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private static determineStrategy(
    constraints: VacationConstraints,
    bridges: BridgeWeekend[]
  ): VacationOptimizationResult['optimization_strategy'] {
    const avgEfficiency = bridges.reduce((sum, b) => sum + b.efficiency, 0) / bridges.length;

    if (avgEfficiency > 3.5) return 'maximize_efficiency';
    if (bridges.length > 4) return 'maximize_days';
    return 'balanced';
  }
}

// Performance monitoring hook
function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    calculationTime: 0,
    bridgeCount: 0,
    lastUpdate: Date.now(),
  });

  const measureCalculation = useCallback((fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    setMetrics(prev => ({
      ...prev,
      calculationTime: end - start,
      lastUpdate: Date.now(),
    }));

    return result;
  }, []);

  return { metrics, measureCalculation };
}

// Main Planning Interface Component
interface PlanningPageProps {
  initialHolidays: Holiday[];
  initialYear: number;
  defaultLanguage: Language;
}

function PlanningPage({ initialHolidays, initialYear, defaultLanguage }: PlanningPageProps) {
  // Core state management
  const [selectedState, setSelectedState] = useState<GermanStateCode | undefined>();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  // Vacation planning state
  const [vacationBudget, setVacationBudget] = useState<number>(25); // Default German vacation days
  const [selectedBridges, setSelectedBridges] = useState<BridgeWeekend[]>([]);
  const [optimizationConstraints, setOptimizationConstraints] = useState<VacationConstraints>({
    max_vacation_days: 25,
    efficiency_threshold: 2.0,
  });

  // Data state
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [availableBridges, setAvailableBridges] = useState<BridgeWeekend[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<VacationOptimizationResult | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Performance monitoring
  const { metrics, measureCalculation } = usePerformanceMonitoring();

  // Accessibility configuration
  const a11yConfig: CalendarA11yConfig = {
    announceNavigation: true,
    announceHolidays: true,
    announceBridges: true,
    detailedDescriptions: true,
    keyboardNavigation: true,
    screenReaderOptimized: true,
    highContrast: false,
    reducedMotion: false,
  };

  // Performance configuration
  const performanceConfig: CalendarPerformanceConfig = {
    enableLazyLoading: true,
    enableVirtualization: true,
    debounceDelay: 150,
    maxConcurrentRequests: 3,
    cacheExpiration: 3600000,
    cacheHolidays: true,
    cacheBridges: true,
    debounceFilters: 200, // Faster for real-time updates
  };

  // Calculate available bridges when state or year changes
  useEffect(() => {
    if (!selectedState) return;

    const calculateBridges = () => {
      setLoading(true);
      try {
        const stateHolidays = holidays.filter(holiday =>
          holiday.states.includes(selectedState) || holiday.type === 'federal'
        );

        const bridgeOpportunities: BridgeWeekend[] = [];

        stateHolidays.forEach(holiday => {
          const analysis = GermanVacationOptimizer.analyzeBridgeOpportunities(holiday, selectedYear);

          analysis.patterns.forEach(pattern => {
            bridgeOpportunities.push({
              id: `bridge_${holiday.id}_${pattern.pattern}`,
              holiday_id: holiday.id,
              state_code: selectedState,
              start_date: pattern.start_date,
              end_date: pattern.end_date,
              vacation_days_needed: pattern.vacation_days_needed,
              total_days_off: pattern.total_days_off,
              efficiency: pattern.efficiency,
              pattern: pattern.pattern,
            });
          });
        });

        setAvailableBridges(bridgeOpportunities.sort((a, b) => b.efficiency - a.efficiency));
      } catch (err) {
        setError('Error calculating bridge opportunities');
        console.error('Bridge calculation error:', err);
      } finally {
        setLoading(false);
      }
    };

    measureCalculation(calculateBridges);
  }, [selectedState, selectedYear, holidays, measureCalculation]);

  // Calculate optimization when constraints change
  useEffect(() => {
    if (!selectedState || availableBridges.length === 0) return;

    const optimizeResults = () => {
      const result = GermanVacationOptimizer.optimizeVacationPlan(
        holidays,
        optimizationConstraints,
        selectedState,
        selectedYear
      );
      setOptimizationResult(result);
    };

    measureCalculation(optimizeResults);
  }, [selectedState, availableBridges, optimizationConstraints, holidays, selectedYear, measureCalculation]);

  // Real-time efficiency calculation
  const currentEfficiency = useMemo(() => {
    return GermanVacationOptimizer.calculateRealTimeEfficiency(
      selectedBridges,
      optimizationConstraints.max_vacation_days
    );
  }, [selectedBridges, optimizationConstraints.max_vacation_days]);

  // Event handlers
  const handleStateChange = useCallback((stateCode: GermanStateCode | undefined) => {
    setSelectedState(stateCode);
    setSelectedBridges([]); // Reset selection when state changes
    setError(null);
  }, []);

  const handleBridgeToggle = useCallback((bridge: BridgeWeekend) => {
    setSelectedBridges(prev => {
      const exists = prev.find(b => b.id === bridge.id);
      if (exists) {
        return prev.filter(b => b.id !== bridge.id);
      } else {
        // Check if we have enough vacation days
        const currentUsage = prev.reduce((sum, b) => sum + b.vacation_days_needed, 0);
        if (currentUsage + bridge.vacation_days_needed <= optimizationConstraints.max_vacation_days) {
          return [...prev, bridge];
        } else {
          setError(`Not enough vacation days. Need ${bridge.vacation_days_needed} more days.`);
          setTimeout(() => setError(null), 3000);
          return prev;
        }
      }
    });
  }, [optimizationConstraints.max_vacation_days]);

  const handleVacationPlanSubmit = useCallback((data: VacationPlanFormData) => {
    setOptimizationConstraints({
      max_vacation_days: data.available_vacation_days,
      preferred_months: data.preferred_months,
      min_consecutive_days: data.min_consecutive_days,
      efficiency_threshold: data.efficiency_threshold || 2.0,
    });
    setVacationBudget(data.available_vacation_days);
  }, []);

  const handleOptimizationApply = useCallback(() => {
    if (optimizationResult) {
      setSelectedBridges(optimizationResult.recommended_bridges);
    }
  }, [optimizationResult]);

  const handleEmailSubmit = useCallback(async (data: EmailSubmissionData) => {
    // TODO: Implement email submission logic
    console.log('Submitting vacation plan via email:', data);
    setShowEmailForm(false);
  }, []);

  // Progressive enhancement: Form submission for non-JS users
  const handleFormSubmission = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    // Fallback form handling for progressive enhancement
  }, []);

  return (
    <AccessibilityProvider>
      <LanguageProvider initialLanguage={currentLanguage}>
        <div className="planning-page">
          <Head>
            <title>
              {currentLanguage === 'de'
                ? 'Urlaubsplanung - Timebutler Kalender'
                : 'Vacation Planning - Timebutler Calendar'
              }
            </title>
            <meta
              name="description"
              content={
                currentLanguage === 'de'
                  ? 'Optimieren Sie Ihre Urlaubstage mit deutschen Feiertagen für maximale Effizienz'
                  : 'Optimize your vacation days with German holidays for maximum efficiency'
              }
            />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
          </Head>

          {/* Skip Navigation for Accessibility */}
          <a
            href="#main-content"
            className="skip-nav"
            aria-label={currentLanguage === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content'}
          >
            {currentLanguage === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content'}
          </a>

          {/* Page Header */}
          <header className="page-header" role="banner">
            <div className="container">
              <h1 className="page-title">
                {currentLanguage === 'de'
                  ? 'Urlaubsplanung für Deutschland'
                  : 'Vacation Planning for Germany'
                }
              </h1>
              <p className="page-subtitle">
                {currentLanguage === 'de'
                  ? 'Maximieren Sie Ihre freien Tage mit intelligenter Brückentag-Optimierung'
                  : 'Maximize your time off with intelligent bridge day optimization'
                }
              </p>

              {/* Language Switch */}
              <div className="language-controls">
                <button
                  onClick={() => setCurrentLanguage('de')}
                  className={`lang-btn ${currentLanguage === 'de' ? 'active' : ''}`}
                  aria-pressed={currentLanguage === 'de'}
                >
                  Deutsch
                </button>
                <button
                  onClick={() => setCurrentLanguage('en')}
                  className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                  aria-pressed={currentLanguage === 'en'}
                >
                  English
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main id="main-content" className="main-content" role="main">
            <div className="container">

              {/* Planning Form */}
              <section className="planning-section" aria-labelledby="planning-title">
                <h2 id="planning-title" className="section-title">
                  {currentLanguage === 'de'
                    ? 'Ihre Urlaubsplanung'
                    : 'Your Vacation Planning'
                  }
                </h2>

                <form onSubmit={handleFormSubmission} className="planning-form">

                  {/* State Selection */}
                  <div className="form-group">
                    <label htmlFor="state-selector" className="form-label">
                      {currentLanguage === 'de'
                        ? 'Wählen Sie Ihr Bundesland'
                        : 'Select Your State'
                      }
                    </label>
                    <StateSelector
                      id="state-selector"
                      value={selectedState}
                      onChange={handleStateChange}
                      required
                      data-testid="state-selector"
                      showDetails
                    />
                  </div>

                  {/* Vacation Budget Form */}
                  <div className="form-group">
                    <VacationPlanForm
                      initialData={{
                        available_vacation_days: vacationBudget,
                        preferred_months: [],
                        efficiency_threshold: 2.0,
                      }}
                      onSubmit={handleVacationPlanSubmit}
                      language={currentLanguage}
                      disabled={!selectedState}
                      data-testid="vacation-plan-form"
                    />
                  </div>

                  {/* Progressive Enhancement: Noscript fallback */}
                  <noscript>
                    <button type="submit" className="btn btn-primary">
                      {currentLanguage === 'de'
                        ? 'Urlaubsplanung berechnen'
                        : 'Calculate Vacation Plan'
                      }
                    </button>
                  </noscript>
                </form>
              </section>

              {/* Error Display */}
              {error && (
                <div className="error-banner" role="alert" aria-live="polite">
                  <strong>
                    {currentLanguage === 'de' ? 'Fehler:' : 'Error:'}
                  </strong> {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="loading-banner" role="status" aria-live="polite">
                  <span className="loading-spinner" aria-hidden="true"></span>
                  {currentLanguage === 'de'
                    ? 'Berechne Urlaubsmöglichkeiten...'
                    : 'Calculating vacation opportunities...'
                  }
                </div>
              )}

              {/* Results Section */}
              {selectedState && !loading && (
                <section className="results-section" aria-labelledby="results-title">
                  <h2 id="results-title" className="section-title">
                    {currentLanguage === 'de'
                      ? 'Ihre Urlaubsmöglichkeiten'
                      : 'Your Vacation Opportunities'
                    }
                  </h2>

                  {/* Current Efficiency Display */}
                  <div className="efficiency-summary" role="region" aria-labelledby="efficiency-title">
                    <h3 id="efficiency-title" className="efficiency-title">
                      {currentLanguage === 'de'
                        ? 'Aktuelle Effizienz'
                        : 'Current Efficiency'
                      }
                    </h3>
                    <div className="efficiency-metrics">
                      <div className="metric">
                        <span className="metric-label">
                          {currentLanguage === 'de' ? 'Effizienz:' : 'Efficiency:'}
                        </span>
                        <span className="metric-value efficiency-score">
                          {currentEfficiency.efficiency.toFixed(1)}x
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">
                          {currentLanguage === 'de' ? 'Freie Tage:' : 'Days Off:'}
                        </span>
                        <span className="metric-value">
                          {currentEfficiency.totalDaysOff}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">
                          {currentLanguage === 'de' ? 'Urlaubstage verwendet:' : 'Vacation Days Used:'}
                        </span>
                        <span className="metric-value">
                          {currentEfficiency.vacationDaysUsed} / {optimizationConstraints.max_vacation_days}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">
                          {currentLanguage === 'de' ? 'Verbleibend:' : 'Remaining:'}
                        </span>
                        <span className="metric-value">
                          {currentEfficiency.remainingDays}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optimization Recommendation */}
                  {optimizationResult && (
                    <div className="optimization-recommendation" role="region" aria-labelledby="optimization-title">
                      <h3 id="optimization-title" className="optimization-title">
                        {currentLanguage === 'de'
                          ? 'Optimierungsempfehlung'
                          : 'Optimization Recommendation'
                        }
                      </h3>
                      <div className="optimization-summary">
                        <p>
                          {currentLanguage === 'de'
                            ? `Empfohlene Strategie: ${optimizationResult.optimization_strategy === 'maximize_efficiency' ? 'Effizienz maximieren' : optimizationResult.optimization_strategy === 'maximize_days' ? 'Tage maximieren' : 'Ausgewogen'}`
                            : `Recommended strategy: ${optimizationResult.optimization_strategy.replace('_', ' ')}`
                          }
                        </p>
                        <p>
                          {currentLanguage === 'de'
                            ? `Mit ${optimizationResult.total_vacation_days} Urlaubstagen erhalten Sie ${optimizationResult.total_days_off} freie Tage (Effizienz: ${optimizationResult.efficiency_score}x)`
                            : `With ${optimizationResult.total_vacation_days} vacation days, you get ${optimizationResult.total_days_off} days off (efficiency: ${optimizationResult.efficiency_score}x)`
                          }
                        </p>
                        <button
                          onClick={handleOptimizationApply}
                          className="btn btn-secondary"
                          type="button"
                        >
                          {currentLanguage === 'de'
                            ? 'Empfehlung anwenden'
                            : 'Apply Recommendation'
                          }
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Calendar View */}
                  <div className="calendar-container" role="region" aria-labelledby="calendar-title">
                    <h3 id="calendar-title" className="calendar-title">
                      {currentLanguage === 'de'
                        ? 'Kalenderansicht'
                        : 'Calendar View'
                      }
                    </h3>
                    <HolidayCalendar
                      state={selectedState}
                      language={currentLanguage}
                      year={selectedYear}
                      initialView={currentView}
                      showBridges={true}
                      showBridgeEfficiency={true}
                      enableBridgeInteraction={true}
                      a11yConfig={a11yConfig}
                      performanceConfig={performanceConfig}
                      onBridgeClick={handleBridgeToggle}
                      onViewChange={setCurrentView}
                      className="vacation-calendar"
                      data-testid="holiday-calendar"
                    />
                  </div>

                  {/* Bridge Weekend Cards */}
                  <div className="bridge-grid" role="region" aria-labelledby="bridges-title">
                    <h3 id="bridges-title" className="bridges-title">
                      {currentLanguage === 'de'
                        ? 'Verfügbare Brückentage'
                        : 'Available Bridge Weekends'
                      }
                    </h3>
                    <div className="bridge-cards">
                      {availableBridges.slice(0, 12).map((bridge) => (
                        <BridgeWeekendCard
                          key={bridge.id}
                          bridge={bridge}
                          language={currentLanguage}
                          showEfficiency={true}
                          showPattern={true}
                          interactive={true}
                          selected={selectedBridges.some(b => b.id === bridge.id)}
                          onClick={() => handleBridgeToggle(bridge)}
                          className={`bridge-card ${selectedBridges.some(b => b.id === bridge.id) ? 'selected' : ''}`}
                          data-testid={`bridge-card-${bridge.id}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      onClick={() => setShowEmailForm(true)}
                      disabled={selectedBridges.length === 0}
                      className="btn btn-primary btn-large"
                      type="button"
                    >
                      {currentLanguage === 'de'
                        ? 'Kalender per E-Mail senden'
                        : 'Send Calendar via Email'
                      }
                    </button>
                  </div>
                </section>
              )}

              {/* Email Submission Modal */}
              {showEmailForm && (
                <div className="modal-overlay" role="dialog" aria-labelledby="email-title" aria-modal="true">
                  <div className="modal-content">
                    <h3 id="email-title" className="modal-title">
                      {currentLanguage === 'de'
                        ? 'Kalender per E-Mail erhalten'
                        : 'Receive Calendar via Email'
                      }
                    </h3>
                    <EmailSubmissionForm
                      onSubmit={handleEmailSubmit}
                      onCancel={() => setShowEmailForm(false)}
                      language={currentLanguage}
                      selectedBridges={selectedBridges}
                      data-testid="email-submission-form"
                    />
                  </div>
                </div>
              )}

              {/* Performance Metrics (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="dev-metrics">
                  <h4>Performance Metrics</h4>
                  <p>Last calculation: {metrics.calculationTime.toFixed(2)}ms</p>
                  <p>Bridges calculated: {availableBridges.length}</p>
                </div>
              )}
            </div>
          </main>

          {/* Footer */}
          <footer className="page-footer" role="contentinfo">
            <div className="container">
              <p className="footer-text">
                {currentLanguage === 'de'
                  ? 'Powered by TimeButler - Ihre Zeiterfassung neu gedacht'
                  : 'Powered by TimeButler - Rethinking Time Tracking'
                }
              </p>
            </div>
          </footer>

          <style jsx>{`
            .planning-page {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              background: #f8fafc;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .skip-nav {
              position: absolute;
              top: -40px;
              left: 6px;
              background: #000;
              color: #fff;
              padding: 8px;
              text-decoration: none;
              z-index: 1000;
              border-radius: 4px;
              font-size: 14px;
            }

            .skip-nav:focus {
              top: 6px;
            }

            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 20px;
            }

            .page-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 2rem 0;
              margin-bottom: 2rem;
            }

            .page-title {
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              line-height: 1.2;
            }

            .page-subtitle {
              font-size: 1.125rem;
              opacity: 0.9;
              margin-bottom: 1.5rem;
              max-width: 600px;
            }

            .language-controls {
              display: flex;
              gap: 0.5rem;
            }

            .lang-btn {
              padding: 0.5rem 1rem;
              border: 2px solid rgba(255, 255, 255, 0.3);
              background: transparent;
              color: white;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s ease;
            }

            .lang-btn:hover {
              background: rgba(255, 255, 255, 0.1);
            }

            .lang-btn.active {
              background: white;
              color: #667eea;
              border-color: white;
            }

            .main-content {
              flex: 1;
              padding-bottom: 3rem;
            }

            .section-title {
              font-size: 1.875rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
              color: #1f2937;
            }

            .planning-section {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              margin-bottom: 2rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .planning-form {
              display: grid;
              gap: 1.5rem;
            }

            .form-group {
              display: grid;
              gap: 0.5rem;
            }

            .form-label {
              font-weight: 600;
              color: #374151;
              font-size: 0.875rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .error-banner {
              background: #fef2f2;
              border: 1px solid #fecaca;
              color: #dc2626;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 1rem;
            }

            .loading-banner {
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              color: #0369a1;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 1rem;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }

            .loading-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid #bae6fd;
              border-top-color: #0369a1;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              to { transform: rotate(360deg); }
            }

            .results-section {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              margin-bottom: 2rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .efficiency-summary {
              background: #f8fafc;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 2rem;
              border: 1px solid #e2e8f0;
            }

            .efficiency-title {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #1f2937;
            }

            .efficiency-metrics {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
            }

            .metric {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.75rem;
              background: white;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }

            .metric-label {
              font-weight: 500;
              color: #6b7280;
              font-size: 0.875rem;
            }

            .metric-value {
              font-weight: 700;
              color: #1f2937;
              font-size: 1rem;
            }

            .efficiency-score {
              color: #059669;
              font-size: 1.125rem;
            }

            .optimization-recommendation {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 2rem;
            }

            .optimization-title {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #047857;
            }

            .optimization-summary p {
              margin-bottom: 0.75rem;
              color: #065f46;
            }

            .calendar-container,
            .bridge-grid {
              margin-bottom: 2rem;
            }

            .calendar-title,
            .bridges-title {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
              color: #1f2937;
            }

            .bridge-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
              gap: 1rem;
            }

            .bridge-card {
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .bridge-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .bridge-card.selected {
              ring: 2px solid #3b82f6;
              transform: translateY(-2px);
            }

            .action-buttons {
              display: flex;
              justify-content: center;
              margin-top: 2rem;
            }

            .btn {
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-weight: 600;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
              font-size: 0.875rem;
            }

            .btn-primary {
              background: #3b82f6;
              color: white;
            }

            .btn-primary:hover:not(:disabled) {
              background: #2563eb;
              transform: translateY(-1px);
            }

            .btn-primary:disabled {
              background: #9ca3af;
              cursor: not-allowed;
            }

            .btn-secondary {
              background: #6b7280;
              color: white;
            }

            .btn-secondary:hover {
              background: #4b5563;
            }

            .btn-large {
              padding: 1rem 2rem;
              font-size: 1rem;
            }

            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              padding: 1rem;
            }

            .modal-content {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              max-width: 500px;
              width: 100%;
              max-height: 90vh;
              overflow-y: auto;
            }

            .modal-title {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
              color: #1f2937;
            }

            .page-footer {
              background: #1f2937;
              color: #9ca3af;
              padding: 2rem 0;
              text-align: center;
            }

            .footer-text {
              margin: 0;
              font-size: 0.875rem;
            }

            .dev-metrics {
              position: fixed;
              bottom: 1rem;
              right: 1rem;
              background: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 8px;
              font-size: 0.75rem;
              font-family: monospace;
              z-index: 100;
            }

            .dev-metrics h4 {
              margin: 0 0 0.5rem 0;
              font-size: 0.875rem;
            }

            .dev-metrics p {
              margin: 0.25rem 0;
            }

            @media (max-width: 768px) {
              .page-title {
                font-size: 2rem;
              }

              .page-subtitle {
                font-size: 1rem;
              }

              .efficiency-metrics {
                grid-template-columns: 1fr;
              }

              .bridge-cards {
                grid-template-columns: 1fr;
              }

              .planning-section,
              .results-section {
                padding: 1.5rem;
              }

              .container {
                padding: 0 16px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .bridge-card,
              .btn,
              .lang-btn,
              .loading-spinner {
                transition: none;
                animation: none;
              }
            }

            @media (prefers-color-scheme: dark) {
              .planning-page {
                background: #0f172a;
                color: #f1f5f9;
              }

              .planning-section,
              .results-section {
                background: #1e293b;
                border-color: #334155;
              }

              .section-title,
              .efficiency-title,
              .calendar-title,
              .bridges-title {
                color: #f1f5f9;
              }

              .form-label {
                color: #cbd5e1;
              }

              .efficiency-summary {
                background: #0f172a;
                border-color: #334155;
              }

              .metric {
                background: #1e293b;
                border-color: #475569;
              }

              .metric-label {
                color: #94a3b8;
              }

              .metric-value {
                color: #f1f5f9;
              }
            }

            /* Focus styles for accessibility */
            .btn:focus,
            .lang-btn:focus {
              outline: 2px solid #3b82f6;
              outline-offset: 2px;
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
              .bridge-card {
                border: 2px solid;
              }

              .btn {
                border: 2px solid;
              }
            }
          `}</style>
        </div>
      </LanguageProvider>
    </AccessibilityProvider>
  );
}

// Static props generation for SSG
export const getStaticProps: GetStaticProps<PlanningPageProps> = async () => {
  // In a real implementation, this would fetch from API
  const currentYear = new Date().getFullYear();

  // Mock holiday data for SSG
  const initialHolidays: Holiday[] = [
    {
      id: 'neujahr-2025',
      name_de: 'Neujahr',
      name_en: 'New Year\'s Day',
      date: '2025-01-01',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    // Add more holidays as needed for initial render
  ];

  return {
    props: {
      initialHolidays,
      initialYear: currentYear,
      defaultLanguage: 'de' as Language,
    }
  };
};

export default PlanningPage;