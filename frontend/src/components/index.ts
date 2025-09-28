/**
 * Component Exports
 * Central export point for all Timebutler Calendar components
 */

// State Selector Components
export { default as StateSelector } from './StateSelector';
export type { StateSelectorProps } from './StateSelector';

// Holiday Calendar Components
export { default as HolidayCalendar } from './HolidayCalendar';
export type { HolidayCalendarProps } from './HolidayCalendar';

// Bridge Weekend Components
export { default as BridgeWeekendCard } from './BridgeWeekendCard';
export type { BridgeWeekendCardProps } from './BridgeWeekendCard';

// Vacation Plan Form Components
export { default as VacationPlanForm } from './VacationPlanForm';
export type {
  VacationPlanFormProps,
  VacationPlanFormData,
  VacationBudgetValidation,
  FormErrors,
  BudgetWarning
} from './VacationPlanForm';

// Email Submission Form Components
export { default as EmailSubmissionForm } from './EmailSubmissionForm';
export type {
  EmailSubmissionFormProps,
  EmailSubmissionData,
  EmailValidationResult,
  FormErrors as EmailFormErrors
} from './EmailSubmissionForm';

// Examples (for development/documentation)
export {
  FormIntegrationExample,
  SimpleExample,
  MultipleSelectorsExample,
  AccessibilityTestExample,
  FullFeaturedExample
} from './examples/StateSelectorExample';

export {
  BasicExample as BridgeWeekendBasicExample,
  ComparisonExample as BridgeWeekendComparisonExample,
  CompactExample as BridgeWeekendCompactExample,
  EnglishExample as BridgeWeekendEnglishExample,
  FeatureToggleExample as BridgeWeekendFeatureToggleExample,
  AccessibilityExample as BridgeWeekendAccessibilityExample,
  FullDemoExample as BridgeWeekendFullDemoExample
} from './examples/BridgeWeekendCardExample';

// Re-export commonly used types
export type {
  GermanStateCode,
  Language,
  ReligiousMajority,
  HolidayType,
  StateData,
  StateOption
} from '../types/state';

export {
  isValidGermanStateCode,
  getStateNameByLanguage,
  formatPopulation
} from '../types/state';

// Re-export holiday types
export type {
  Holiday,
  BridgeWeekend,
  CalendarDate,
  CalendarMonth,
  CalendarView,
  CalendarA11yConfig,
  CalendarPerformanceConfig,
  BridgePattern,
  HolidayScope,
} from '../types/holiday';

export {
  isValidHolidayType,
  isValidBridgePattern,
  isValidCalendarView,
  DEFAULT_A11Y_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  GERMAN_WEEKDAYS,
  GERMAN_MONTHS,
  BRIDGE_PATTERN_TRANSLATIONS,
} from '../types/holiday';