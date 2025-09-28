/**
 * HolidayCalendar Component Examples
 * Comprehensive examples demonstrating all features of the HolidayCalendar component
 *
 * Examples:
 * - Basic calendar with German holidays
 * - Bilingual calendar (German/English)
 * - State-specific holidays with bridge weekends
 * - Accessibility-optimized calendar
 * - Performance-optimized calendar for large datasets
 * - Calendar with custom event handlers
 * - Mobile-responsive calendar
 * - Error handling demonstration
 */

import React, { useState, useCallback } from 'react';
import HolidayCalendar from '../HolidayCalendar';
import type {
  HolidayCalendarProps,
  Holiday,
  BridgeWeekend,
  CalendarDate,
  CalendarMonth,
  CalendarView,
} from '../../types/holiday';
import type { GermanStateCode, Language } from '../../types/state';

/**
 * Basic Holiday Calendar Example
 * Minimal setup showing German holidays
 */
export const BasicExample: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);

  const handleDateSelect = useCallback((date: CalendarDate) => {
    setSelectedDate(date);
    console.log('Selected date:', date.date, 'Holidays:', date.holidays);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic German Holiday Calendar</h3>
      <p className="text-gray-600">
        Shows federal German holidays for the current year with basic functionality.
      </p>

      <HolidayCalendar
        language="de"
        year={2025}
        onDateSelect={handleDateSelect}
        data-testid="basic-holiday-calendar"
      />

      {selectedDate && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium">Selected Date:</h4>
          <p>{selectedDate.date.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          {selectedDate.holidays.length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-medium">Holidays:</h5>
              <ul className="text-sm text-gray-600">
                {selectedDate.holidays.map(holiday => (
                  <li key={holiday.id}>
                    {holiday.name_de} ({holiday.type})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Bilingual Calendar Example
 * Demonstrates German/English language switching
 */
export const BilingualExample: React.FC = () => {
  const [language, setLanguage] = useState<Language>('de');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bilingual Calendar</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setLanguage('de')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              language === 'de'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Deutsch
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <p className="text-gray-600">
        Switch between German (formal) and English (casual) to see bilingual support.
      </p>

      <HolidayCalendar
        language={language}
        year={2025}
        data-testid="bilingual-holiday-calendar"
      />
    </div>
  );
};

/**
 * State-Specific Calendar with Bridge Weekends
 * Shows Bavaria holidays with bridge weekend opportunities
 */
export const BavarianBridgeExample: React.FC = () => {
  const [selectedBridge, setSelectedBridge] = useState<BridgeWeekend | null>(null);

  const handleBridgeClick = useCallback((bridge: BridgeWeekend) => {
    setSelectedBridge(bridge);
    console.log('Bridge selected:', bridge);
  }, []);

  const handleHolidayClick = useCallback((holiday: Holiday) => {
    console.log('Holiday clicked:', holiday);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bavaria with Bridge Weekends</h3>
      <p className="text-gray-600">
        Shows Bavaria-specific holidays and optimal bridge weekend opportunities.
      </p>

      <HolidayCalendar
        state="BY"
        language="en"
        year={2025}
        showBridges={true}
        showBridgeEfficiency={true}
        enableBridgeInteraction={true}
        showRegionalHolidays={true}
        onBridgeClick={handleBridgeClick}
        onHolidayClick={handleHolidayClick}
        data-testid="bavarian-bridge-calendar"
      />

      {selectedBridge && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="font-medium text-yellow-800">Selected Bridge Weekend:</h4>
          <div className="mt-2 text-sm text-yellow-700">
            <p><strong>Pattern:</strong> {selectedBridge.pattern.replace('-', ' ')}</p>
            <p><strong>Period:</strong> {selectedBridge.start_date} to {selectedBridge.end_date}</p>
            <p><strong>Vacation days needed:</strong> {selectedBridge.vacation_days_needed}</p>
            <p><strong>Total days off:</strong> {selectedBridge.total_days_off}</p>
            <p><strong>Efficiency:</strong> {selectedBridge.efficiency.toFixed(1)}x</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Accessibility-Optimized Calendar
 * Demonstrates enhanced accessibility features
 */
export const AccessibilityExample: React.FC = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const handleAnalytics = useCallback((event: string, data?: Record<string, any>) => {
    const announcement = `Analytics: ${event} - ${JSON.stringify(data)}`;
    setAnnouncements(prev => [...prev.slice(-4), announcement]);
  }, []);

  const a11yConfig = {
    announceNavigation: true,
    announceHolidays: true,
    announceBridges: true,
    detailedDescriptions: true,
    keyboardNavigation: true,
    screenReaderOptimized: true,
    highContrast: false,
    reducedMotion: false,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Accessibility-Optimized Calendar</h3>
      <p className="text-gray-600">
        Enhanced accessibility features for screen readers and keyboard navigation.
        Try using Tab, Arrow keys, Home, End, Page Up/Down to navigate.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800">Keyboard Navigation:</h4>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li><strong>Arrow keys:</strong> Navigate between dates</li>
          <li><strong>Home/End:</strong> Start/end of week</li>
          <li><strong>Page Up/Down:</strong> Previous/next month</li>
          <li><strong>Shift + Page Up/Down:</strong> Previous/next year</li>
          <li><strong>Enter/Space:</strong> Select date</li>
        </ul>
      </div>

      <HolidayCalendar
        language="en"
        state="BW"
        year={2025}
        showBridges={true}
        a11yConfig={a11yConfig}
        onAnalytics={handleAnalytics}
        ariaLabel="Accessibility-optimized holiday calendar for Baden-Württemberg"
        data-testid="accessibility-calendar"
      />

      {announcements.length > 0 && (
        <div className="p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-medium">Recent Activity:</h4>
          <ul className="mt-2 space-y-1">
            {announcements.map((announcement, index) => (
              <li key={index} className="text-gray-600">{announcement}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Performance-Optimized Calendar
 * Shows performance configuration options
 */
export const PerformanceExample: React.FC = () => {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    cacheHits?: number;
    renderTime?: number;
  }>({});

  const performanceConfig = {
    enableVirtualization: true,
    cacheHolidays: true,
    cacheBridges: true,
    maxCachedMonths: 24,
    preloadAdjacentMonths: true,
    debounceFilters: 200,
  };

  const handleMonthChange = useCallback((month: CalendarMonth) => {
    // Simulate performance metrics
    setMetrics({
      loadTime: Math.random() * 100 + 50,
      cacheHits: Math.floor(Math.random() * 10),
      renderTime: Math.random() * 20 + 5,
    });
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance-Optimized Calendar</h3>
      <p className="text-gray-600">
        Configured for optimal performance with caching, virtualization, and preloading.
      </p>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-xl font-semibold text-green-700">
            {metrics.loadTime?.toFixed(1) || '0.0'}ms
          </div>
          <div className="text-sm text-green-600">Load Time</div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xl font-semibold text-blue-700">
            {metrics.cacheHits || 0}
          </div>
          <div className="text-sm text-blue-600">Cache Hits</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
          <div className="text-xl font-semibold text-purple-700">
            {metrics.renderTime?.toFixed(1) || '0.0'}ms
          </div>
          <div className="text-sm text-purple-600">Render Time</div>
        </div>
      </div>

      <HolidayCalendar
        language="de"
        state="NW"
        year={2025}
        showBridges={true}
        performanceConfig={performanceConfig}
        onMonthChange={handleMonthChange}
        data-testid="performance-calendar"
      />
    </div>
  );
};

/**
 * Compact Mobile Calendar
 * Optimized for mobile devices
 */
export const MobileExample: React.FC = () => {
  const [view, setView] = useState<CalendarView>('month');

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mobile-Optimized Calendar</h3>
      <p className="text-gray-600">
        Compact layout optimized for mobile devices with touch-friendly controls.
      </p>

      <div className="max-w-md mx-auto">
        <HolidayCalendar
          language="en"
          state="HH" // Hamburg
          year={2025}
          compact={true}
          theme="light"
          showBridges={true}
          initialView="month"
          onViewChange={handleViewChange}
          className="shadow-lg"
          data-testid="mobile-calendar"
        />
      </div>

      <div className="text-center text-sm text-gray-600">
        Current view: <span className="font-medium">{view}</span>
      </div>
    </div>
  );
};

/**
 * Error Handling Example
 * Demonstrates error states and recovery
 */
export const ErrorHandlingExample: React.FC = () => {
  const [simulateError, setSimulateError] = useState(false);
  const [errors, setErrors] = useState<Error[]>([]);

  const handleError = useCallback((error: Error) => {
    setErrors(prev => [...prev, error]);
    console.error('Calendar error:', error);
  }, []);

  // Mock API that fails when simulateError is true
  React.useEffect(() => {
    if (simulateError) {
      // Simulate API failure after a brief delay
      const timer = setTimeout(() => {
        setSimulateError(false); // Reset for retry
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [simulateError]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Error Handling</h3>
        <button
          onClick={() => setSimulateError(true)}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Simulate Error
        </button>
      </div>

      <p className="text-gray-600">
        Demonstrates error handling and recovery mechanisms.
      </p>

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="text-sm font-medium text-red-800">Recent Errors:</h4>
          <ul className="text-sm text-red-700 mt-1">
            {errors.slice(-3).map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
          <button
            onClick={() => setErrors([])}
            className="text-xs text-red-600 hover:text-red-800 mt-2"
          >
            Clear errors
          </button>
        </div>
      )}

      <HolidayCalendar
        language="de"
        state="SN" // Saxony
        year={2025}
        showBridges={true}
        onError={handleError}
        data-testid="error-handling-calendar"
      />
    </div>
  );
};

/**
 * All Examples Container
 * Shows all examples in a single page
 */
export const AllExamples: React.FC = () => {
  return (
    <div className="space-y-12 p-6 max-w-6xl mx-auto">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">HolidayCalendar Examples</h1>
        <p className="text-lg text-gray-600 mt-2">
          Comprehensive examples showcasing all features of the accessible German Holiday Calendar component.
        </p>
      </header>

      <section>
        <BasicExample />
      </section>

      <section>
        <BilingualExample />
      </section>

      <section>
        <BavarianBridgeExample />
      </section>

      <section>
        <AccessibilityExample />
      </section>

      <section>
        <PerformanceExample />
      </section>

      <section>
        <MobileExample />
      </section>

      <section>
        <ErrorHandlingExample />
      </section>
    </div>
  );
};

export default AllExamples;