/**
 * State Types - German Bundesländer Type Definitions
 * Shared types for StateSelector component and related functionality
 *
 * Matches backend State model for consistency across frontend/backend
 */

export type GermanStateCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type Language = 'de' | 'en';

export type ReligiousMajority = 'catholic' | 'protestant' | 'secular' | 'mixed';

export type HolidayType = 'catholic' | 'protestant' | 'federal' | 'secular';

/**
 * State data interface matching backend State model
 */
export interface StateData {
  code: GermanStateCode;
  name_de: string;
  name_en: string;
  population: number;
  is_catholic_majority: boolean;
  capital: string;
  timezone: string;
}

/**
 * Extended state information for frontend use
 */
export interface StateOption extends StateData {
  is_city_state: boolean;
  religious_majority: ReligiousMajority;
}

/**
 * State selector component props
 */
export interface StateSelectorProps {
  value?: GermanStateCode;
  onChange?: (stateCode: GermanStateCode | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
  'data-testid'?: string;
  defaultSort?: 'alphabetical' | 'population' | 'religious';
  showDetails?: boolean;
  showPopulation?: boolean;
  showReligion?: boolean;
  onAnalytics?: (event: 'open' | 'search' | 'select' | 'clear', data?: any) => void;
}

/**
 * State validation utility
 */
export function isValidGermanStateCode(code: string): code is GermanStateCode {
  const validCodes: GermanStateCode[] = [
    'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
    'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
  ];
  return validCodes.includes(code as GermanStateCode);
}

/**
 * Get state name by language
 */
export function getStateNameByLanguage(
  state: StateOption,
  language: Language = 'de'
): string {
  return language === 'en' ? state.name_en : state.name_de;
}

/**
 * Format population according to locale
 */
export function formatPopulation(population: number, language: Language = 'de'): string {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale).format(population);
}