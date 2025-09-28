/**
 * Unit Test Helpers for Backend TDD Testing
 * Focus: Holiday calculations, bridge weekend algorithms, business logic
 * Constitutional Requirement: 100% accurate German holiday data
 */

import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';

// German state configuration for testing
export const GERMAN_STATES_CONFIG = {
  'BW': { // Baden-Württemberg
    name: 'Baden-Württemberg',
    population: 11100000,
    religious_majority: 'mixed',
    special_holidays: ['heilige_drei_koenige', 'fronleichnam', 'allerheiligen']
  },
  'BY': { // Bayern (Bavaria)
    name: 'Bayern',
    population: 13124737,
    religious_majority: 'catholic',
    special_holidays: ['heilige_drei_koenige', 'fronleichnam', 'mariae_himmelfahrt', 'allerheiligen']
  },
  'BE': { // Berlin
    name: 'Berlin',
    population: 3677472,
    religious_majority: 'secular',
    special_holidays: ['internationaler_frauentag']
  },
  'BB': { // Brandenburg
    name: 'Brandenburg',
    population: 2537868,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'HB': { // Bremen
    name: 'Bremen',
    population: 680130,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'HH': { // Hamburg
    name: 'Hamburg',
    population: 1945532,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'HE': { // Hessen
    name: 'Hessen',
    population: 6293154,
    religious_majority: 'mixed',
    special_holidays: ['fronleichnam']
  },
  'MV': { // Mecklenburg-Vorpommern
    name: 'Mecklenburg-Vorpommern',
    population: 1610774,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'NI': { // Niedersachsen
    name: 'Niedersachsen',
    population: 8003421,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'NW': { // Nordrhein-Westfalen
    name: 'Nordrhein-Westfalen',
    population: 17925570,
    religious_majority: 'mixed',
    special_holidays: ['fronleichnam', 'allerheiligen']
  },
  'RP': { // Rheinland-Pfalz
    name: 'Rheinland-Pfalz',
    population: 4106485,
    religious_majority: 'mixed',
    special_holidays: ['fronleichnam', 'allerheiligen']
  },
  'SL': { // Saarland
    name: 'Saarland',
    population: 989035,
    religious_majority: 'catholic',
    special_holidays: ['fronleichnam', 'mariae_himmelfahrt', 'allerheiligen']
  },
  'SN': { // Sachsen
    name: 'Sachsen',
    population: 4056094,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag', 'buss_und_bettag']
  },
  'ST': { // Sachsen-Anhalt
    name: 'Sachsen-Anhalt',
    population: 2180684,
    religious_majority: 'protestant',
    special_holidays: ['heilige_drei_koenige', 'reformationstag']
  },
  'SH': { // Schleswig-Holstein
    name: 'Schleswig-Holstein',
    population: 2922005,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag']
  },
  'TH': { // Thüringen
    name: 'Thüringen',
    population: 2120237,
    religious_majority: 'protestant',
    special_holidays: ['reformationstag', 'weltkindertag']
  }
};

// German federal holidays that apply to all states
export const GERMAN_FEDERAL_HOLIDAYS = [
  {
    key: 'neujahr',
    name_de: 'Neujahr',
    name_en: 'New Year\'s Day',
    date_calculation: (year: number) => `${year}-01-01`,
    is_federal: true,
    type: 'secular'
  },
  {
    key: 'karfreitag',
    name_de: 'Karfreitag',
    name_en: 'Good Friday',
    date_calculation: (year: number) => calculateEaster(year, -2),
    is_federal: true,
    type: 'religious'
  },
  {
    key: 'ostermontag',
    name_de: 'Ostermontag',
    name_en: 'Easter Monday',
    date_calculation: (year: number) => calculateEaster(year, 1),
    is_federal: true,
    type: 'religious'
  },
  {
    key: 'tag_der_arbeit',
    name_de: 'Tag der Arbeit',
    name_en: 'Labour Day',
    date_calculation: (year: number) => `${year}-05-01`,
    is_federal: true,
    type: 'secular'
  },
  {
    key: 'christi_himmelfahrt',
    name_de: 'Christi Himmelfahrt',
    name_en: 'Ascension Day',
    date_calculation: (year: number) => calculateEaster(year, 39),
    is_federal: true,
    type: 'religious'
  },
  {
    key: 'pfingstmontag',
    name_de: 'Pfingstmontag',
    name_en: 'Whit Monday',
    date_calculation: (year: number) => calculateEaster(year, 50),
    is_federal: true,
    type: 'religious'
  },
  {
    key: 'tag_der_deutschen_einheit',
    name_de: 'Tag der Deutschen Einheit',
    name_en: 'German Unity Day',
    date_calculation: (year: number) => `${year}-10-03`,
    is_federal: true,
    type: 'national'
  },
  {
    key: 'weihnachtstag',
    name_de: '1. Weihnachtstag',
    name_en: 'Christmas Day',
    date_calculation: (year: number) => `${year}-12-25`,
    is_federal: true,
    type: 'religious'
  },
  {
    key: 'zweiter_weihnachtstag',
    name_de: '2. Weihnachtstag',
    name_en: 'Boxing Day',
    date_calculation: (year: number) => `${year}-12-26`,
    is_federal: true,
    type: 'religious'
  }
];

// State-specific holidays
export const GERMAN_STATE_HOLIDAYS = [
  {
    key: 'heilige_drei_koenige',
    name_de: 'Heilige Drei Könige',
    name_en: 'Epiphany',
    date_calculation: (year: number) => `${year}-01-06`,
    states: ['BW', 'BY', 'ST'],
    type: 'religious'
  },
  {
    key: 'internationaler_frauentag',
    name_de: 'Internationaler Frauentag',
    name_en: 'International Women\'s Day',
    date_calculation: (year: number) => `${year}-03-08`,
    states: ['BE', 'MV'],
    type: 'secular'
  },
  {
    key: 'fronleichnam',
    name_de: 'Fronleichnam',
    name_en: 'Corpus Christi',
    date_calculation: (year: number) => calculateEaster(year, 60),
    states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'],
    type: 'religious'
  },
  {
    key: 'mariae_himmelfahrt',
    name_de: 'Mariä Himmelfahrt',
    name_en: 'Assumption of Mary',
    date_calculation: (year: number) => `${year}-08-15`,
    states: ['BY', 'SL'],
    type: 'religious'
  },
  {
    key: 'weltkindertag',
    name_de: 'Weltkindertag',
    name_en: 'World Children\'s Day',
    date_calculation: (year: number) => `${year}-09-20`,
    states: ['TH'],
    type: 'secular'
  },
  {
    key: 'reformationstag',
    name_de: 'Reformationstag',
    name_en: 'Reformation Day',
    date_calculation: (year: number) => `${year}-10-31`,
    states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'],
    type: 'religious'
  },
  {
    key: 'allerheiligen',
    name_de: 'Allerheiligen',
    name_en: 'All Saints\' Day',
    date_calculation: (year: number) => `${year}-11-01`,
    states: ['BW', 'BY', 'NW', 'RP', 'SL'],
    type: 'religious'
  },
  {
    key: 'buss_und_bettag',
    name_de: 'Buß- und Bettag',
    name_en: 'Day of Repentance and Prayer',
    date_calculation: (year: number) => calculateBussUndBettag(year),
    states: ['SN'],
    type: 'religious'
  }
];

/**
 * Calculate Easter date using the algorithm
 * Returns date in YYYY-MM-DD format with offset days
 */
export function calculateEaster(year: number, offsetDays = 0): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = Math.floor((h + l - 7 * m + 114) / 31);
  const p = (h + l - 7 * m + 114) % 31;

  const easter = DateTime.fromObject({
    year,
    month: n,
    day: p + 1
  }, { zone: 'Europe/Berlin' });

  return easter.plus({ days: offsetDays }).toFormat('yyyy-MM-dd');
}

/**
 * Calculate Buß- und Bettag (Day of Repentance and Prayer)
 * Always the Wednesday before the last Sunday of November
 */
export function calculateBussUndBettag(year: number): string {
  // Find the last Sunday of November
  const lastDayOfNovember = DateTime.fromObject({
    year,
    month: 11,
    day: 30
  }, { zone: 'Europe/Berlin' });

  // Find the last Sunday
  const lastSunday = lastDayOfNovember.minus({ days: lastDayOfNovember.weekday % 7 });

  // Buß- und Bettag is the Wednesday before (4 days before)
  const bussUndBettag = lastSunday.minus({ days: 4 });

  return bussUndBettag.toFormat('yyyy-MM-dd');
}

/**
 * Holiday Factory for TDD Testing
 * Creates holiday objects with consistent structure
 */
export class HolidayFactory {
  static createFederalHoliday(year: number, holidayKey: string) {
    const holiday = GERMAN_FEDERAL_HOLIDAYS.find(h => h.key === holidayKey);
    if (!holiday) {
      throw new Error(`Unknown federal holiday: ${holidayKey}`);
    }

    const date = typeof holiday.date_calculation === 'function'
      ? holiday.date_calculation(year)
      : holiday.date_calculation;

    return {
      id: `${holidayKey}-${year}`,
      key: holiday.key,
      name_de: holiday.name_de,
      name_en: holiday.name_en,
      date,
      year,
      state: 'ALL',
      is_federal: true,
      type: holiday.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static createStateHoliday(year: number, state: string, holidayKey: string) {
    const holiday = GERMAN_STATE_HOLIDAYS.find(h => h.key === holidayKey);
    if (!holiday) {
      throw new Error(`Unknown state holiday: ${holidayKey}`);
    }

    if (!holiday.states.includes(state)) {
      throw new Error(`Holiday ${holidayKey} not valid for state ${state}`);
    }

    const date = typeof holiday.date_calculation === 'function'
      ? holiday.date_calculation(year)
      : holiday.date_calculation;

    return {
      id: `${holidayKey}-${state}-${year}`,
      key: holiday.key,
      name_de: holiday.name_de,
      name_en: holiday.name_en,
      date,
      year,
      state,
      is_federal: false,
      type: holiday.type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static createCompleteYearHolidays(year: number, state: string) {
    const holidays = [];

    // Add federal holidays
    GERMAN_FEDERAL_HOLIDAYS.forEach(holiday => {
      holidays.push(this.createFederalHoliday(year, holiday.key));
    });

    // Add state-specific holidays
    GERMAN_STATE_HOLIDAYS.forEach(holiday => {
      if (holiday.states.includes(state)) {
        holidays.push(this.createStateHoliday(year, state, holiday.key));
      }
    });

    return holidays.sort((a, b) => a.date.localeCompare(b.date));
  }
}

/**
 * Bridge Weekend Factory for Algorithm Testing
 * Creates test data for bridge weekend optimization
 */
export class BridgeWeekendFactory {
  static createOptimalBridge() {
    return {
      id: faker.string.uuid(),
      holiday_id: 'tag_der_arbeit-2025',
      start_date: '2025-05-01',
      end_date: '2025-05-04',
      vacation_days_needed: 1, // Only Friday needed
      total_days_off: 4, // Thursday (holiday), Friday (vacation), Saturday, Sunday
      efficiency: 4.0, // 4 days off for 1 vacation day
      pattern: 'single-bridge' as const,
      quality_score: 100,
      popularity_score: 95,
      created_at: new Date().toISOString()
    };
  }

  static createSandwichBridge() {
    return {
      id: faker.string.uuid(),
      holiday_id: 'christi_himmelfahrt-2025',
      start_date: '2025-05-29', // Thursday (Ascension Day)
      end_date: '2025-06-01',   // Sunday
      vacation_days_needed: 1,  // Only Friday needed
      total_days_off: 4,
      efficiency: 4.0,
      pattern: 'sandwich' as const,
      quality_score: 90,
      popularity_score: 85,
      created_at: new Date().toISOString()
    };
  }

  static createLongWeekendBridge() {
    return {
      id: faker.string.uuid(),
      holiday_id: 'tag_der_deutschen_einheit-2025',
      start_date: '2025-10-03',
      end_date: '2025-10-05',
      vacation_days_needed: 1,
      total_days_off: 3,
      efficiency: 3.0,
      pattern: 'extend-weekend' as const,
      quality_score: 75,
      popularity_score: 70,
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Test Data Generator for German User Scenarios
 */
export class GermanUserDataFactory {
  static createBavarianCatholicUser() {
    return {
      id: faker.string.uuid(),
      state: 'BY',
      vacation_days: 30,
      language: 'de',
      preferences: {
        include_religious_holidays: true,
        optimize_for: 'efficiency',
        max_consecutive_vacation_days: 5,
        prefer_long_weekends: true
      },
      email: faker.internet.email({ provider: 'example.de' }),
      created_at: new Date().toISOString()
    };
  }

  static createBerlinSecularUser() {
    return {
      id: faker.string.uuid(),
      state: 'BE',
      vacation_days: 20,
      language: 'de',
      preferences: {
        include_religious_holidays: false,
        optimize_for: 'total_days_off',
        max_consecutive_vacation_days: 10,
        prefer_long_weekends: false
      },
      email: faker.internet.email({ provider: 'example.com' }),
      created_at: new Date().toISOString()
    };
  }

  static createInternationalUser() {
    return {
      id: faker.string.uuid(),
      state: faker.helpers.arrayElement(['NW', 'BW', 'HE']),
      vacation_days: faker.number.int({ min: 20, max: 35 }),
      language: 'en',
      preferences: {
        include_religious_holidays: faker.datatype.boolean(),
        optimize_for: faker.helpers.arrayElement(['efficiency', 'total_days_off', 'balanced']),
        max_consecutive_vacation_days: faker.number.int({ min: 3, max: 14 }),
        prefer_long_weekends: faker.datatype.boolean()
      },
      email: faker.internet.email(),
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Mock Database Utilities
 * For testing without actual database connections
 */
export class MockDatabaseHelper {
  private static data: Map<string, any[]> = new Map();

  static setup() {
    this.data.clear();
    this.data.set('holidays', []);
    this.data.set('bridge_weekends', []);
    this.data.set('vacation_plans', []);
  }

  static insert(table: string, record: any) {
    const records = this.data.get(table) || [];
    records.push({ ...record, id: record.id || faker.string.uuid() });
    this.data.set(table, records);
    return record;
  }

  static findAll(table: string, filter?: (record: any) => boolean) {
    const records = this.data.get(table) || [];
    return filter ? records.filter(filter) : records;
  }

  static findOne(table: string, id: string) {
    const records = this.data.get(table) || [];
    return records.find(record => record.id === id);
  }

  static update(table: string, id: string, updates: any) {
    const records = this.data.get(table) || [];
    const index = records.findIndex(record => record.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
    }
    return records[index];
  }

  static delete(table: string, id: string) {
    const records = this.data.get(table) || [];
    const filteredRecords = records.filter(record => record.id !== id);
    this.data.set(table, filteredRecords);
  }

  static clear(table?: string) {
    if (table) {
      this.data.set(table, []);
    } else {
      this.data.clear();
    }
  }
}

/**
 * Date Testing Utilities for German Timezone
 */
export class GermanDateHelper {
  static createBerlinDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
    return DateTime.fromObject({
      year, month, day, hour, minute
    }, { zone: 'Europe/Berlin' }).toJSDate();
  }

  static isGermanWorkday(date: string | Date): boolean {
    const dt = DateTime.fromJSDate(typeof date === 'string' ? new Date(date) : date)
      .setZone('Europe/Berlin');

    // Monday = 1, Sunday = 7
    return dt.weekday >= 1 && dt.weekday <= 5;
  }

  static getGermanWeekNumber(date: string | Date): number {
    const dt = DateTime.fromJSDate(typeof date === 'string' ? new Date(date) : date)
      .setZone('Europe/Berlin');

    return dt.weekNumber;
  }

  static formatGermanDate(date: string | Date, includeWeekday = false): string {
    const dt = DateTime.fromJSDate(typeof date === 'string' ? new Date(date) : date)
      .setZone('Europe/Berlin');

    const format = includeWeekday ? 'cccc, dd. LLLL yyyy' : 'dd. LLLL yyyy';
    return dt.setLocale('de-DE').toFormat(format);
  }
}

// Export for use in tests
export const testHelpers = {
  HolidayFactory,
  BridgeWeekendFactory,
  GermanUserDataFactory,
  MockDatabaseHelper,
  GermanDateHelper,
  calculateEaster,
  calculateBussUndBettag,
  GERMAN_STATES_CONFIG,
  GERMAN_FEDERAL_HOLIDAYS,
  GERMAN_STATE_HOLIDAYS
};