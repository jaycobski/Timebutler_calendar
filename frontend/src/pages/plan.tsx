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
import { useRouter } from 'next/router';

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
  const router = useRouter();
  
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

  // Read state from URL query parameter on mount
  useEffect(() => {
    if (router.isReady && router.query.state) {
      const stateFromQuery = router.query.state as GermanStateCode;
      // Validate that it's a valid German state code
      const validStates: GermanStateCode[] = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
      if (validStates.includes(stateFromQuery)) {
        setSelectedState(stateFromQuery);
      }
    }
  }, [router.isReady, router.query.state]);

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
    try {
      // TODO: Implement email submission logic to backend
      console.log('Submitting vacation plan via email:', data);
      
      // Redirect to confirmation page with query parameters
      const queryParams = new URLSearchParams({
        email: data.email,
        state: selectedState || '',
        bridges: selectedBridges.length.toString(),
        format: data.calendar_format || 'ics',
      });
      
      await router.push(`/confirmation?${queryParams.toString()}`);
    } catch (error) {
      console.error('Email submission error:', error);
      setError(currentLanguage === 'de' 
        ? 'Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.'
        : 'Error sending email. Please try again.');
      setShowEmailForm(false);
    }
  }, [router, selectedState, selectedBridges, currentLanguage]);

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

          {/* Hero Section - Matching Landing Page */}
          <header className="hero-gradient py-16 lg:py-24" role="banner">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {currentLanguage === 'de' ? (
                    <>
                      Optimieren Sie Ihre{' '}
                      <span className="text-timebutler-600">Urlaubstage</span>{' '}
                      mit intelligenter{' '}
                      <span className="text-timebutler-600">Brückentag-Optimierung</span>
                    </>
                  ) : (
                    <>
                      Optimize Your{' '}
                      <span className="text-timebutler-600">Vacation Days</span>{' '}
                      with Smart{' '}
                      <span className="text-timebutler-600">Bridge Day Optimization</span>
                    </>
                  )}
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                  {currentLanguage === 'de'
                    ? 'Maximieren Sie Ihre freien Tage durch strategische Nutzung deutscher Feiertage und Brückentage'
                    : 'Maximize your time off by strategically using German holidays and bridge days'}
                </p>

                {/* Language Switch */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentLanguage('de')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentLanguage === 'de'
                        ? 'bg-timebutler-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    aria-pressed={currentLanguage === 'de'}
                  >
                    Deutsch
                  </button>
                  <button
                    onClick={() => setCurrentLanguage('en')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentLanguage === 'en'
                        ? 'bg-timebutler-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    aria-pressed={currentLanguage === 'en'}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main id="main-content" className="bg-gray-50 py-12" role="main">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

              {/* Planning Form Section */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8" aria-labelledby="planning-title">
                <h2 id="planning-title" className="text-2xl font-bold text-gray-900 mb-6">
                  {currentLanguage === 'de'
                    ? 'Ihre Urlaubsplanung'
                    : 'Your Vacation Planning'
                  }
                </h2>

                <div className="space-y-6">
                  {/* State Selection */}
                  <div>
                    <label htmlFor="state-selector" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <div>
                    <VacationPlanForm
                      availableBridges={availableBridges}
                      holidays={holidays}
                      initialData={{
                        available_vacation_days: vacationBudget,
                        preferred_months: [],
                        efficiency_threshold: 2.0,
                      }}
                      onSubmit={handleVacationPlanSubmit}
                      language={currentLanguage}
                      data-testid="vacation-plan-form"
                    />
                  </div>
                </div>
              </section>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" role="alert" aria-live="polite">
                  <strong className="font-semibold">
                    {currentLanguage === 'de' ? 'Fehler:' : 'Error:'}
                  </strong> {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-3" role="status" aria-live="polite">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" aria-hidden="true"></div>
                  <span>
                    {currentLanguage === 'de'
                      ? 'Berechne Urlaubsmöglichkeiten...'
                      : 'Calculating vacation opportunities...'
                    }
                  </span>
                </div>
              )}

              {/* Results Section */}
              {selectedState && !loading && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8" aria-labelledby="results-title">
                  <h2 id="results-title" className="text-2xl font-bold text-gray-900 mb-6">
                    {currentLanguage === 'de'
                      ? 'Ihre Urlaubsmöglichkeiten'
                      : 'Your Vacation Opportunities'
                    }
                  </h2>

                  {/* Current Efficiency Display */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200" role="region" aria-labelledby="efficiency-title">
                    <h3 id="efficiency-title" className="text-lg font-semibold text-gray-900 mb-4">
                      {currentLanguage === 'de'
                        ? 'Aktuelle Effizienz'
                        : 'Current Efficiency'
                      }
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">
                          {currentLanguage === 'de' ? 'Effizienz' : 'Efficiency'}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {currentEfficiency.efficiency.toFixed(1)}x
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">
                          {currentLanguage === 'de' ? 'Freie Tage' : 'Days Off'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {currentEfficiency.totalDaysOff}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">
                          {currentLanguage === 'de' ? 'Urlaubstage verwendet' : 'Vacation Days Used'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {currentEfficiency.vacationDaysUsed} / {optimizationConstraints.max_vacation_days}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">
                          {currentLanguage === 'de' ? 'Verbleibend' : 'Remaining'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {currentEfficiency.remainingDays}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimization Recommendation */}
                  {optimizationResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6" role="region" aria-labelledby="optimization-title">
                      <h3 id="optimization-title" className="text-lg font-semibold text-green-900 mb-3">
                        {currentLanguage === 'de'
                          ? 'Optimierungsempfehlung'
                          : 'Optimization Recommendation'
                        }
                      </h3>
                      <div className="space-y-3">
                        <p className="text-green-800">
                          {currentLanguage === 'de'
                            ? `Empfohlene Strategie: ${optimizationResult.optimization_strategy === 'maximize_efficiency' ? 'Effizienz maximieren' : optimizationResult.optimization_strategy === 'maximize_days' ? 'Tage maximieren' : 'Ausgewogen'}`
                            : `Recommended strategy: ${optimizationResult.optimization_strategy.replace('_', ' ')}`
                          }
                        </p>
                        <p className="text-green-800">
                          {currentLanguage === 'de'
                            ? `Mit ${optimizationResult.total_vacation_days} Urlaubstagen erhalten Sie ${optimizationResult.total_days_off} freie Tage (Effizienz: ${optimizationResult.efficiency_score}x)`
                            : `With ${optimizationResult.total_vacation_days} vacation days, you get ${optimizationResult.total_days_off} days off (efficiency: ${optimizationResult.efficiency_score}x)`
                          }
                        </p>
                        <button
                          onClick={handleOptimizationApply}
                          className="btn-secondary mt-4"
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
                  <div className="mb-8" role="region" aria-labelledby="calendar-title">
                    <h3 id="calendar-title" className="text-xl font-semibold text-gray-900 mb-4">
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
                  <div className="mb-8" role="region" aria-labelledby="bridges-title">
                    <h3 id="bridges-title" className="text-xl font-semibold text-gray-900 mb-4">
                      {currentLanguage === 'de'
                        ? 'Verfügbare Brückentage'
                        : 'Available Bridge Weekends'
                      }
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          className={selectedBridges.some(b => b.id === bridge.id) ? 'ring-2 ring-timebutler-500' : ''}
                          data-testid={`bridge-card-${bridge.id}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={() => setShowEmailForm(true)}
                      disabled={selectedBridges.length === 0}
                      className="btn-cta px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
          <footer className="bg-gray-900 text-white py-12" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-gray-400">
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
              background: #f9fafb;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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

  // Mock holiday data for SSG - includes major German holidays for bridge calculation
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
    {
      id: 'tag-der-arbeit-2025',
      name_de: 'Tag der Arbeit',
      name_en: 'Labour Day',
      date: '2025-05-01',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'tag-der-deutschen-einheit-2025',
      name_de: 'Tag der Deutschen Einheit',
      name_en: 'German Unity Day',
      date: '2025-10-03',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'weihnachtstag-2025',
      name_de: '1. Weihnachtstag',
      name_en: 'Christmas Day',
      date: '2025-12-25',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'zweiter-weihnachtstag-2025',
      name_de: '2. Weihnachtstag',
      name_en: 'Boxing Day',
      date: '2025-12-26',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'karfreitag-2025',
      name_de: 'Karfreitag',
      name_en: 'Good Friday',
      date: '2025-04-18',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'ostermontag-2025',
      name_de: 'Ostermontag',
      name_en: 'Easter Monday',
      date: '2025-04-21',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
    {
      id: 'pfingstmontag-2025',
      name_de: 'Pfingstmontag',
      name_en: 'Whit Monday',
      date: '2025-06-09',
      type: 'federal',
      states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
      is_catholic: false,
      is_protestant: false,
    },
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