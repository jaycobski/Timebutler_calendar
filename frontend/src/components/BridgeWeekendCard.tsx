/**
 * BridgeWeekendCard Component - German Bridge Weekend Optimization Display
 * Task T038: ROI calculations and accessible design
 *
 * Features:
 * - Individual bridge weekend opportunity visualization
 * - ROI calculations and efficiency metrics (German vacation mathematics)
 * - Pattern identification (Thursday-Friday, sandwich, etc.)
 * - German vacation optimization display with EUR value estimation
 * - WCAG 2.1 Level AA accessibility compliance
 * - Mobile-responsive card design with interactive selection
 * - Bilingual support (formal German, casual English)
 * - German holiday context and explanations
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  StarIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import useTranslation from 'next-translate/useTranslation';
import { BridgeWeekend, BridgePattern, Holiday } from '../types/holiday';
import { GermanStateCode, Language } from '../types/state';

// Component interfaces
export interface BridgeWeekendCardProps {
  /** Bridge weekend data to display */
  bridge: BridgeWeekend;
  /** Holiday details for context */
  holiday?: Holiday;
  /** Current language for bilingual display */
  language?: Language;
  /** Current user's state for context */
  state?: GermanStateCode;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether the card is disabled for selection */
  disabled?: boolean;
  /** Show detailed ROI calculations */
  showROI?: boolean;
  /** Show efficiency metrics */
  showEfficiency?: boolean;
  /** Show pattern explanations */
  showPattern?: boolean;
  /** Show EUR value estimation */
  showValueEstimation?: boolean;
  /** Enable interactive selection */
  interactive?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Selection callback */
  onSelect?: (bridge: BridgeWeekend) => void;
  /** Details/info callback */
  onShowDetails?: (bridge: BridgeWeekend) => void;
  /** Analytics tracking */
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ROI calculation configuration
interface ROIMetrics {
  efficiency: number;
  totalDaysOff: number;
  vacationDaysNeeded: number;
  weekendDaysIncluded: number;
  holidayDaysIncluded: number;
  valueRatio: number;
  estimatedSavings: number; // in EUR based on average German salary
}

// Average daily value calculation (German worker context)
const AVERAGE_GERMAN_DAILY_SALARY = 156; // EUR/day based on 2025 German average salary
const VACATION_DAY_VALUE_MULTIPLIER = 0.8; // Conservative estimate for vacation day value

/**
 * Calculate comprehensive ROI metrics for German bridge weekends
 */
function calculateROIMetrics(bridge: BridgeWeekend, holiday?: Holiday): ROIMetrics {
  const startDate = new Date(bridge.start_date);
  const endDate = new Date(bridge.end_date);

  // Calculate days breakdown
  let weekendDays = 0;
  let holidayDays = 0;
  let workingDays = 0;

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else if (holiday && date.toISOString().split('T')[0] === holiday.date) {
      holidayDays++;
    } else {
      workingDays++;
    }
  }

  // Calculate financial value
  const vacationDayValue = AVERAGE_GERMAN_DAILY_SALARY * VACATION_DAY_VALUE_MULTIPLIER;
  const estimatedSavings = (bridge.total_days_off - bridge.vacation_days_needed) * vacationDayValue;

  return {
    efficiency: bridge.efficiency,
    totalDaysOff: bridge.total_days_off,
    vacationDaysNeeded: bridge.vacation_days_needed,
    weekendDaysIncluded: weekendDays,
    holidayDaysIncluded: holidayDays,
    valueRatio: bridge.total_days_off / Math.max(bridge.vacation_days_needed, 1),
    estimatedSavings: Math.round(estimatedSavings)
  };
}

/**
 * Get pattern-specific optimization tips and explanations
 */
function getPatternOptimization(pattern: BridgePattern, language: Language): {
  title: string;
  description: string;
  tip: string;
  difficulty: 'easy' | 'medium' | 'hard';
} {
  const patterns = {
    de: {
      'thursday-friday': {
        title: 'Donnerstag-Freitag Brücke',
        description: 'Optimal für kurze Erholung mit maximalem Wochenend-Gefühl',
        tip: 'Perfekt für Kurzurlaub oder verlängerte Entspannung',
        difficulty: 'easy' as const
      },
      'monday-tuesday': {
        title: 'Montag-Dienstag Brücke',
        description: 'Idealer Start in entspannte Woche ohne Montags-Blues',
        tip: 'Besonders wertvoll nach stressigen Projektphasen',
        difficulty: 'easy' as const
      },
      'tuesday-friday': {
        title: 'Dienstag-Freitag Brücke',
        description: 'Maximale Urlaubstage für eine komplette Woche Erholung',
        tip: 'Perfekt für echten Urlaub oder wichtige Familienereignisse',
        difficulty: 'medium' as const
      },
      'sandwich': {
        title: 'Sandwich-Brücke',
        description: 'Feiertag zwischen zwei Wochenenden optimal nutzen',
        tip: 'Nur 1-2 Urlaubstage für bis zu 9 Tage Freizeit',
        difficulty: 'easy' as const
      },
      'extend-weekend': {
        title: 'Wochenend-Verlängerung',
        description: 'Kurze Verlängerung für maximale Entspannung',
        tip: 'Ideal für spontane Erholung oder Familienzeit',
        difficulty: 'easy' as const
      }
    },
    en: {
      'thursday-friday': {
        title: 'Thursday-Friday Bridge',
        description: 'Perfect for short breaks with maximum weekend vibes',
        tip: 'Great for quick getaways or extended relaxation',
        difficulty: 'easy' as const
      },
      'monday-tuesday': {
        title: 'Monday-Tuesday Bridge',
        description: 'Beat the Monday blues with a relaxed week start',
        tip: 'Especially valuable after stressful project phases',
        difficulty: 'easy' as const
      },
      'tuesday-friday': {
        title: 'Tuesday-Friday Bridge',
        description: 'Maximum vacation days for a full week of rest',
        tip: 'Perfect for real vacations or important family events',
        difficulty: 'medium' as const
      },
      'sandwich': {
        title: 'Sandwich Bridge',
        description: 'Holiday between two weekends optimally utilized',
        tip: 'Just 1-2 vacation days for up to 9 days of free time',
        difficulty: 'easy' as const
      },
      'extend-weekend': {
        title: 'Weekend Extension',
        description: 'Short extension for maximum relaxation',
        tip: 'Ideal for spontaneous recovery or family time',
        difficulty: 'easy' as const
      }
    }
  };

  return patterns[language]?.[pattern] || patterns.en[pattern];
}

/**
 * Format date for German/English display
 */
function formatDateRange(startDate: string, endDate: string, language: Language): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString(locale, options);
  }

  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
}

/**
 * BridgeWeekendCard Component
 * Displays individual bridge weekend opportunities with German vacation optimization
 */
export default function BridgeWeekendCard({
  bridge,
  holiday,
  language = 'de',
  state: _state,
  selected = false,
  disabled = false,
  showROI = true,
  showEfficiency = true,
  showPattern = true,
  showValueEstimation = true,
  interactive = true,
  compact = false,
  className,
  onSelect,
  onShowDetails,
  onAnalytics,
  'data-testid': testId = 'bridge-weekend-card'
}: BridgeWeekendCardProps) {
  // Translation hook for bilingual support
  const { t: _t } = useTranslation('bridge-weekend-card');
  const isGerman = language === 'de';

  // Component state
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  // Calculate ROI metrics
  const roiMetrics = useMemo(() => calculateROIMetrics(bridge, holiday), [bridge, holiday]);

  // Get pattern optimization info
  const patternInfo = useMemo(() => getPatternOptimization(bridge.pattern, language), [bridge.pattern, language]);

  // Format date range
  const dateRangeFormatted = useMemo(() => formatDateRange(bridge.start_date, bridge.end_date, language), [bridge.start_date, bridge.end_date, language]);

  /**
   * Handle card selection
   */
  const handleSelect = useCallback(() => {
    if (disabled || !interactive) return;

    onSelect?.(bridge);
    onAnalytics?.('bridge_card_select', {
      bridgeId: bridge.id,
      pattern: bridge.pattern,
      efficiency: bridge.efficiency,
      vacationDays: bridge.vacation_days_needed
    });
  }, [bridge, disabled, interactive, onSelect, onAnalytics]);

  /**
   * Handle details toggle
   */
  const handleToggleDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailedInfo(prev => !prev);

    onShowDetails?.(bridge);
    onAnalytics?.('bridge_card_details', {
      bridgeId: bridge.id,
      expanded: !showDetailedInfo
    });
  }, [bridge, showDetailedInfo, onShowDetails, onAnalytics]);

  /**
   * Get efficiency color and label based on German vacation standards
   */
  const getEfficiencyDisplay = useCallback(() => {
    const efficiency = roiMetrics.efficiency;

    if (efficiency >= 4.0) {
      return {
        color: 'text-green-700 bg-green-50 border-green-200',
        label: isGerman ? 'Exzellent' : 'Excellent',
        icon: StarSolidIcon,
        description: isGerman ? 'Maximaler Urlaubswert' : 'Maximum vacation value'
      };
    } else if (efficiency >= 3.0) {
      return {
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        label: isGerman ? 'Sehr gut' : 'Very Good',
        icon: StarSolidIcon,
        description: isGerman ? 'Hoher Urlaubswert' : 'High vacation value'
      };
    } else if (efficiency >= 2.0) {
      return {
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
        label: isGerman ? 'Gut' : 'Good',
        icon: StarIcon,
        description: isGerman ? 'Solider Urlaubswert' : 'Solid vacation value'
      };
    } else {
      return {
        color: 'text-gray-700 bg-gray-50 border-gray-200',
        label: isGerman ? 'Standard' : 'Standard',
        icon: StarIcon,
        description: isGerman ? 'Grundlegender Urlaubswert' : 'Basic vacation value'
      };
    }
  }, [roiMetrics.efficiency, isGerman]);

  const efficiencyDisplay = getEfficiencyDisplay();

  // Component CSS classes
  const cardClasses = clsx(
    'relative block w-full',
    'border rounded-lg shadow-sm transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    {
      // Selection states
      'border-blue-500 bg-blue-50 shadow-md': selected,
      'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md': !selected && !disabled && interactive,
      'border-gray-200 bg-white': !interactive || disabled,

      // Disabled state
      'opacity-60 cursor-not-allowed': disabled,
      'cursor-pointer': interactive && !disabled,

      // Size variants
      'p-3': compact,
      'p-4': !compact
    },
    className
  );

  const titleClasses = clsx(
    'font-semibold',
    {
      'text-sm': compact,
      'text-base': !compact
    }
  );

  const metricClasses = clsx(
    'text-gray-600',
    {
      'text-xs': compact,
      'text-sm': !compact
    }
  );

  return (
    <div
      className={cardClasses}
      onClick={handleSelect}
      role={interactive ? 'button' : 'article'}
      tabIndex={interactive && !disabled ? 0 : -1}
      aria-selected={selected}
      aria-disabled={disabled}
      aria-describedby={`${testId}-description`}
      onKeyDown={(e) => {
        if (interactive && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleSelect();
        }
      }}
      data-testid={testId}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Pattern Title and Holiday */}
          <h3 className={titleClasses}>
            {showPattern && (
              <span className="text-gray-900">
                {patternInfo.title}
              </span>
            )}
            {holiday && (
              <span className={clsx('block text-blue-600 mt-1', {
                'text-xs font-normal': compact,
                'text-sm font-medium': !compact
              })}>
                {isGerman ? holiday.name_de : holiday.name_en}
              </span>
            )}
          </h3>

          {/* Date Range */}
          <p className={clsx(metricClasses, 'mt-1')}>
            <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
            {dateRangeFormatted}
          </p>
        </div>

        {/* Efficiency Badge */}
        {showEfficiency && (
          <div className={clsx(
            'flex-shrink-0 ml-3 px-2 py-1 rounded-full border',
            'flex items-center text-xs font-medium',
            efficiencyDisplay.color
          )}>
            <efficiencyDisplay.icon className="h-3 w-3 mr-1" />
            {roiMetrics.efficiency.toFixed(1)}x
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        {/* Vacation Days Needed */}
        <div className="text-center">
          <p className={clsx('font-semibold text-gray-900', {
            'text-lg': !compact,
            'text-base': compact
          })}>
            {roiMetrics.vacationDaysNeeded}
          </p>
          <p className={clsx(metricClasses)}>
            {isGerman ? 'Urlaubstage' : 'Vacation Days'}
          </p>
        </div>

        {/* Total Days Off */}
        <div className="text-center">
          <p className={clsx('font-semibold text-green-600', {
            'text-lg': !compact,
            'text-base': compact
          })}>
            {roiMetrics.totalDaysOff}
          </p>
          <p className={clsx(metricClasses)}>
            {isGerman ? 'Freie Tage' : 'Days Off'}
          </p>
        </div>

        {/* ROI Value */}
        {showROI && showValueEstimation && (
          <div className="text-center">
            <p className={clsx('font-semibold text-blue-600', {
              'text-lg': !compact,
              'text-base': compact
            })}>
              {roiMetrics.estimatedSavings > 0 ? `+${roiMetrics.estimatedSavings}€` : '–'}
            </p>
            <p className={clsx(metricClasses)}>
              {isGerman ? 'Wert' : 'Value'}
            </p>
          </div>
        )}
      </div>

      {/* Pattern Description */}
      {showPattern && !compact && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {patternInfo.description}
          </p>
          {patternInfo.tip && (
            <p className="text-xs text-blue-600 mt-1">
              💡 {patternInfo.tip}
            </p>
          )}
        </div>
      )}

      {/* Detailed Information (Expandable) */}
      {!compact && (
        <div className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={handleToggleDetails}
            className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700"
            aria-expanded={showDetailedInfo}
            aria-controls={`${testId}-details`}
          >
            <span>{isGerman ? 'Details anzeigen' : 'Show details'}</span>
            <InformationCircleIcon
              className={clsx('h-4 w-4 transition-transform', {
                'rotate-180': showDetailedInfo
              })}
            />
          </button>

          {showDetailedInfo && (
            <div id={`${testId}-details`} className="mt-3 space-y-2">
              {/* Breakdown */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>{isGerman ? 'Wochenendtage:' : 'Weekend days:'}</span>
                  <span>{roiMetrics.weekendDaysIncluded}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isGerman ? 'Feiertage:' : 'Holidays:'}</span>
                  <span>{roiMetrics.holidayDaysIncluded}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isGerman ? 'Urlaubstage:' : 'Vacation days:'}</span>
                  <span>{roiMetrics.vacationDaysNeeded}</span>
                </div>
              </div>

              {/* Pattern Difficulty */}
              <div className="flex items-center justify-between text-xs">
                <span>{isGerman ? 'Schwierigkeit:' : 'Difficulty:'}</span>
                <span className={clsx('px-2 py-1 rounded-full text-xs', {
                  'bg-green-100 text-green-800': patternInfo.difficulty === 'easy',
                  'bg-yellow-100 text-yellow-800': patternInfo.difficulty === 'medium',
                  'bg-red-100 text-red-800': patternInfo.difficulty === 'hard'
                })}>
                  {isGerman
                    ? (patternInfo.difficulty === 'easy' ? 'Einfach' :
                       patternInfo.difficulty === 'medium' ? 'Mittel' : 'Schwer')
                    : patternInfo.difficulty.charAt(0).toUpperCase() + patternInfo.difficulty.slice(1)
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selection Indicator */}
      {selected && interactive && (
        <div className="absolute top-2 right-2">
          <CheckCircleIcon className="h-5 w-5 text-blue-600" />
        </div>
      )}

      {/* Hidden description for screen readers */}
      <div id={`${testId}-description`} className="sr-only">
        {isGerman
          ? `Brückenwochenende ${patternInfo.title}: ${roiMetrics.vacationDaysNeeded} Urlaubstage für ${roiMetrics.totalDaysOff} freie Tage. Effizienz: ${roiMetrics.efficiency.toFixed(1)} mal. ${patternInfo.description}`
          : `Bridge weekend ${patternInfo.title}: ${roiMetrics.vacationDaysNeeded} vacation days for ${roiMetrics.totalDaysOff} days off. Efficiency: ${roiMetrics.efficiency.toFixed(1)}x. ${patternInfo.description}`
        }
      </div>
    </div>
  );
}