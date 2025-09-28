/**
 * Holiday Types - German Holiday System Frontend Types
 * Matches backend Holiday and BridgeWeekend models for consistency
 *
 * Implements comprehensive German holiday system types including:
 * - Holiday display and interaction data
 * - Bridge weekend visualization types
 * - Calendar component props and state
 * - Accessibility and internationalization support
 */

import { GermanStateCode, Language } from './state';

// Holiday type definitions matching backend
export type HolidayType = 'federal' | 'state' | 'regional';
export type HolidayScope = 'federal' | 'state' | 'regional' | 'catholic' | 'protestant';

// Bridge weekend pattern types
export type BridgePattern =
  | 'thursday-friday'   // Thursday holiday + Friday off = 4-day weekend
  | 'monday-tuesday'    // Monday holiday + Tuesday off = 4-day weekend
  | 'tuesday-friday'    // Tuesday holiday + Wed-Fri off = 5-day break
  | 'sandwich'          // Holiday between weekends (Mon-Tue or Thu-Fri off)
  | 'extend-weekend';   // Extend existing weekend with adjacent days

// Calendar view modes
export type CalendarView = 'month' | 'year' | 'quarter';

// Calendar navigation direction
export type NavigationDirection = 'prev' | 'next' | 'today';

/**
 * Core Holiday data structure
 */
export interface Holiday {
  id: string;
  name_de: string;
  name_en: string;
  date: string; // ISO format YYYY-MM-DD
  type: HolidayType;
  states: string[];
  is_catholic: boolean;
  is_protestant: boolean;
  region?: string; // For regional holidays like Augsburg Peace Festival
}

/**
 * Bridge weekend opportunity
 */
export interface BridgeWeekend {
  id: string;
  holiday_id: string;
  state_code: GermanStateCode;
  start_date: string; // ISO format YYYY-MM-DD
  end_date: string;   // ISO format YYYY-MM-DD
  vacation_days_needed: number;
  total_days_off: number;
  efficiency: number; // total_days_off / vacation_days_needed
  pattern: BridgePattern;
}

/**
 * Calendar date cell data
 */
export interface CalendarDate {
  date: Date;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holidays: Holiday[];
  bridgeOpportunities: BridgeWeekend[];
  isSelected: boolean;
  isBridgePotential: boolean;
  vacationDaysNeeded?: number;
}

/**
 * Calendar month data structure
 */
export interface CalendarMonth {
  year: number;
  month: number; // 0-11 (JavaScript Date format)
  name_de: string;
  name_en: string;
  weeks: CalendarWeek[];
  holidays: Holiday[];
  bridgeOpportunities: BridgeWeekend[];
}

/**
 * Calendar week structure
 */
export interface CalendarWeek {
  weekNumber: number;
  dates: CalendarDate[];
}

/**
 * Holiday filter criteria
 */
export interface HolidayFilter {
  states?: GermanStateCode[];
  types?: HolidayType[];
  includeRegional?: boolean;
  includeCatholic?: boolean;
  includeProtestant?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Calendar accessibility configuration
 */
export interface CalendarA11yConfig {
  announceNavigation: boolean;
  announceHolidays: boolean;
  announceBridges: boolean;
  detailedDescriptions: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

/**
 * Calendar performance settings
 */
export interface CalendarPerformanceConfig {
  enableVirtualization: boolean;
  cacheHolidays: boolean;
  cacheBridges: boolean;
  maxCachedMonths: number;
  preloadAdjacentMonths: boolean;
  debounceFilters: number; // milliseconds
}

/**
 * Calendar event handlers
 */
export interface CalendarEventHandlers {
  onDateSelect?: (date: CalendarDate) => void;
  onHolidayClick?: (holiday: Holiday) => void;
  onBridgeClick?: (bridge: BridgeWeekend) => void;
  onMonthChange?: (month: CalendarMonth) => void;
  onViewChange?: (view: CalendarView) => void;
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

/**
 * Calendar loading and error states
 */
export interface CalendarState {
  loading: boolean;
  error: string | null;
  holidays: Holiday[];
  bridges: BridgeWeekend[];
  selectedDate: Date | null;
  currentView: CalendarView;
  currentMonth: CalendarMonth | null;
  focusedDate: Date;
  filterActive: boolean;
}

/**
 * Main HolidayCalendar component props
 */
export interface HolidayCalendarProps {
  // Core functionality
  state?: GermanStateCode;
  language?: Language;
  year?: number;
  initialView?: CalendarView;

  // Feature toggles
  showBridges?: boolean;
  showBridgeEfficiency?: boolean;
  enableBridgeInteraction?: boolean;
  showRegionalHolidays?: boolean;

  // Accessibility
  a11yConfig?: Partial<CalendarA11yConfig>;
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Performance
  performanceConfig?: Partial<CalendarPerformanceConfig>;

  // Styling
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;

  // Event handlers
  onDateSelect?: (date: CalendarDate) => void;
  onHolidayClick?: (holiday: Holiday) => void;
  onBridgeClick?: (bridge: BridgeWeekend) => void;
  onMonthChange?: (month: CalendarMonth) => void;
  onViewChange?: (view: CalendarView) => void;
  onError?: (error: Error) => void;

  // Testing
  'data-testid'?: string;

  // Analytics
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

/**
 * Calendar navigation props
 */
export interface CalendarNavigationProps {
  currentMonth: CalendarMonth;
  view: CalendarView;
  language: Language;
  onNavigate: (direction: NavigationDirection) => void;
  onViewChange: (view: CalendarView) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Holiday display props for individual holiday rendering
 */
export interface HolidayDisplayProps {
  holiday: Holiday;
  language: Language;
  compact?: boolean;
  showBadge?: boolean;
  showScope?: boolean;
  onClick?: (holiday: Holiday) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Bridge weekend display props
 */
export interface BridgeWeekendDisplayProps {
  bridge: BridgeWeekend;
  language: Language;
  showEfficiency?: boolean;
  showPattern?: boolean;
  interactive?: boolean;
  onClick?: (bridge: BridgeWeekend) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Calendar grid props for the main calendar table
 */
export interface CalendarGridProps {
  month: CalendarMonth;
  language: Language;
  state?: GermanStateCode;
  showBridges?: boolean;
  a11yConfig: CalendarA11yConfig;
  onDateSelect?: (date: CalendarDate) => void;
  onHolidayClick?: (holiday: Holiday) => void;
  onBridgeClick?: (bridge: BridgeWeekend) => void;
  className?: string;
}

/**
 * Calendar utilities for date formatting and calculations
 */
export interface CalendarUtils {
  formatDate: (date: Date, language: Language, format?: 'short' | 'long' | 'numeric') => string;
  formatHolidayName: (holiday: Holiday, language: Language) => string;
  formatBridgeDescription: (bridge: BridgeWeekend, language: Language) => string;
  getWeekdays: (language: Language, format?: 'short' | 'long') => string[];
  getMonthNames: (language: Language, format?: 'short' | 'long') => string[];
  isGermanWorkingDay: (date: Date, holidays: Holiday[]) => boolean;
  calculateBridgeEfficiency: (bridge: BridgeWeekend) => string;
}

/**
 * Holiday API response format
 */
export interface HolidayApiResponse {
  holidays: Holiday[];
  bridges?: BridgeWeekend[];
  total: number;
  state?: GermanStateCode;
  year: number;
  cached?: boolean;
  generated_at: string;
}

/**
 * Bridge weekend calculation request
 */
export interface BridgeCalculationRequest {
  state: GermanStateCode;
  year: number;
  maxVacationDays?: number;
  includeSchoolHolidays?: boolean;
  minEfficiency?: number;
}

/**
 * Calendar theme configuration
 */
export interface CalendarTheme {
  colors: {
    background: string;
    text: string;
    border: string;
    holiday: string;
    bridge: string;
    weekend: string;
    today: string;
    selected: string;
    focus: string;
  };
  spacing: {
    cell: string;
    gap: string;
    padding: string;
  };
  typography: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  accessibility: {
    focusRing: string;
    highContrast: boolean;
  };
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG: CalendarA11yConfig = {
  announceNavigation: true,
  announceHolidays: true,
  announceBridges: true,
  detailedDescriptions: true,
  keyboardNavigation: true,
  screenReaderOptimized: true,
  highContrast: false,
  reducedMotion: false,
};

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: CalendarPerformanceConfig = {
  enableVirtualization: false, // Off for smaller datasets
  cacheHolidays: true,
  cacheBridges: true,
  maxCachedMonths: 12,
  preloadAdjacentMonths: true,
  debounceFilters: 300,
};

/**
 * German weekday names in both languages
 */
export const GERMAN_WEEKDAYS = {
  de: {
    short: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    long: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  },
  en: {
    short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    long: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
};

/**
 * German month names in both languages
 */
export const GERMAN_MONTHS = {
  de: {
    short: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    long: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  },
  en: {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

/**
 * Bridge pattern translations
 */
export const BRIDGE_PATTERN_TRANSLATIONS = {
  de: {
    'thursday-friday': 'Donnerstag-Freitag Brücke',
    'monday-tuesday': 'Montag-Dienstag Brücke',
    'tuesday-friday': 'Dienstag-Freitag Brücke',
    'sandwich': 'Sandwich-Brücke',
    'extend-weekend': 'Wochenend-Verlängerung',
  },
  en: {
    'thursday-friday': 'Thursday-Friday Bridge',
    'monday-tuesday': 'Monday-Tuesday Bridge',
    'tuesday-friday': 'Tuesday-Friday Bridge',
    'sandwich': 'Sandwich Bridge',
    'extend-weekend': 'Weekend Extension',
  },
};

/**
 * Validation functions for holiday types
 */
export function isValidHolidayType(type: string): type is HolidayType {
  return ['federal', 'state', 'regional'].includes(type);
}

export function isValidBridgePattern(pattern: string): pattern is BridgePattern {
  return ['thursday-friday', 'monday-tuesday', 'tuesday-friday', 'sandwich', 'extend-weekend'].includes(pattern);
}

export function isValidCalendarView(view: string): view is CalendarView {
  return ['month', 'year', 'quarter'].includes(view);
}