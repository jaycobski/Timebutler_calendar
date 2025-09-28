/**
 * TDD Unit Tests for German Holiday Calculations
 * Constitutional Requirement: 100% accurate German holiday data
 *
 * These tests WILL FAIL initially - this is intentional TDD methodology.
 * Tests define the contract and behavior expectations before implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  testHelpers,
  calculateEaster,
  calculateBussUndBettag,
  GERMAN_FEDERAL_HOLIDAYS,
  GERMAN_STATE_HOLIDAYS
} from '../helpers/unit-test-helpers';

const { HolidayFactory, GermanDateHelper, MockDatabaseHelper } = testHelpers;

describe('German Holiday Calculations - TDD Unit Tests', () => {
  beforeEach(() => {
    MockDatabaseHelper.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    MockDatabaseHelper.clear();
  });

  describe('Easter-based Holiday Calculations', () => {
    // TDD Test 1: These will fail until Easter calculation is implemented
    it('should calculate Easter date correctly for 2025', () => {
      const easter2025 = calculateEaster(2025);
      expect(easter2025).toBe('2025-04-20'); // Easter Sunday 2025
    });

    it('should calculate Easter date correctly for 2026', () => {
      const easter2026 = calculateEaster(2026);
      expect(easter2026).toBe('2026-04-05'); // Easter Sunday 2026
    });

    it('should calculate Good Friday (Karfreitag) correctly', () => {
      const karfreitag2025 = calculateEaster(2025, -2); // 2 days before Easter
      expect(karfreitag2025).toBe('2025-04-18');
    });

    it('should calculate Easter Monday (Ostermontag) correctly', () => {
      const ostermontag2025 = calculateEaster(2025, 1); // 1 day after Easter
      expect(ostermontag2025).toBe('2025-04-21');
    });

    it('should calculate Ascension Day (Christi Himmelfahrt) correctly', () => {
      const himmelfahrt2025 = calculateEaster(2025, 39); // 39 days after Easter
      expect(himmelfahrt2025).toBe('2025-05-29');
    });

    it('should calculate Whit Monday (Pfingstmontag) correctly', () => {
      const pfingstmontag2025 = calculateEaster(2025, 50); // 50 days after Easter
      expect(pfingstmontag2025).toBe('2025-06-09');
    });

    it('should calculate Corpus Christi (Fronleichnam) correctly', () => {
      const fronleichnam2025 = calculateEaster(2025, 60); // 60 days after Easter
      expect(fronleichnam2025).toBe('2025-06-19');
    });

    // Edge case testing
    it('should handle leap year Easter calculations', () => {
      const easter2024 = calculateEaster(2024); // Leap year
      expect(easter2024).toBe('2024-03-31');
    });

    it('should be consistent across multiple years', () => {
      const years = [2023, 2024, 2025, 2026, 2027];
      const easterDates = years.map(year => calculateEaster(year));

      // Each date should be unique and valid
      expect(new Set(easterDates)).toHaveLength(years.length);
      easterDates.forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(date).getFullYear()).toBeGreaterThanOrEqual(2023);
      });
    });
  });

  describe('Buß- und Bettag Calculation', () => {
    // TDD Test: Will fail until implementation exists
    it('should calculate Buß- und Bettag correctly for 2025', () => {
      const bussUndBettag2025 = calculateBussUndBettag(2025);
      expect(bussUndBettag2025).toBe('2025-11-19'); // Wednesday before last Sunday of November
    });

    it('should always be a Wednesday', () => {
      const years = [2024, 2025, 2026, 2027];

      years.forEach(year => {
        const date = calculateBussUndBettag(year);
        const dateObj = new Date(date);
        expect(dateObj.getDay()).toBe(3); // Wednesday = 3
      });
    });

    it('should be in November', () => {
      const years = [2024, 2025, 2026, 2027];

      years.forEach(year => {
        const date = calculateBussUndBettag(year);
        const dateObj = new Date(date);
        expect(dateObj.getMonth()).toBe(10); // November = 10 (0-indexed)
      });
    });
  });

  describe('Federal Holiday Generation', () => {
    // TDD Test: Will fail until HolidayService is implemented
    it('should generate all 9 federal holidays for 2025', () => {
      const holidays = GERMAN_FEDERAL_HOLIDAYS.map(holiday =>
        HolidayFactory.createFederalHoliday(2025, holiday.key)
      );

      expect(holidays).toHaveLength(9);
      holidays.forEach(holiday => {
        expect(holiday).toBeValidGermanHoliday();
        expect(holiday.is_federal).toBe(true);
        expect(holiday.state).toBe('ALL');
        expect(holiday.year).toBe(2025);
      });
    });

    it('should have correct German names for federal holidays', () => {
      const expectedNames = {
        'neujahr': 'Neujahr',
        'karfreitag': 'Karfreitag',
        'ostermontag': 'Ostermontag',
        'tag_der_arbeit': 'Tag der Arbeit',
        'christi_himmelfahrt': 'Christi Himmelfahrt',
        'pfingstmontag': 'Pfingstmontag',
        'tag_der_deutschen_einheit': 'Tag der Deutschen Einheit',
        'weihnachtstag': '1. Weihnachtstag',
        'zweiter_weihnachtstag': '2. Weihnachtstag'
      };

      Object.entries(expectedNames).forEach(([key, expectedName]) => {
        const holiday = HolidayFactory.createFederalHoliday(2025, key);
        expect(holiday.name_de).toBe(expectedName);
        expect(holiday.name_en).toBeTruthy();
      });
    });

    it('should have correct dates for fixed federal holidays', () => {
      const fixedHolidays = {
        'neujahr': '2025-01-01',
        'tag_der_arbeit': '2025-05-01',
        'tag_der_deutschen_einheit': '2025-10-03',
        'weihnachtstag': '2025-12-25',
        'zweiter_weihnachtstag': '2025-12-26'
      };

      Object.entries(fixedHolidays).forEach(([key, expectedDate]) => {
        const holiday = HolidayFactory.createFederalHoliday(2025, key);
        expect(holiday.date).toBe(expectedDate);
      });
    });

    it('should classify holiday types correctly', () => {
      const religiousHolidays = ['karfreitag', 'ostermontag', 'christi_himmelfahrt', 'pfingstmontag', 'weihnachtstag', 'zweiter_weihnachtstag'];
      const secularHolidays = ['neujahr', 'tag_der_arbeit'];
      const nationalHolidays = ['tag_der_deutschen_einheit'];

      religiousHolidays.forEach(key => {
        const holiday = HolidayFactory.createFederalHoliday(2025, key);
        expect(holiday.type).toBe('religious');
      });

      secularHolidays.forEach(key => {
        const holiday = HolidayFactory.createFederalHoliday(2025, key);
        expect(holiday.type).toBe('secular');
      });

      nationalHolidays.forEach(key => {
        const holiday = HolidayFactory.createFederalHoliday(2025, key);
        expect(holiday.type).toBe('national');
      });
    });
  });

  describe('State-specific Holiday Generation', () => {
    // TDD Test: Will fail until state holiday logic is implemented
    describe('Bavaria (BY) - Catholic State', () => {
      it('should generate 4 additional holidays for Bavaria', () => {
        const bavarianHolidays = [
          'heilige_drei_koenige',
          'fronleichnam',
          'mariae_himmelfahrt',
          'allerheiligen'
        ];

        bavarianHolidays.forEach(holidayKey => {
          const holiday = HolidayFactory.createStateHoliday(2025, 'BY', holidayKey);
          expect(holiday).toBeValidGermanHoliday();
          expect(holiday.is_federal).toBe(false);
          expect(holiday.state).toBe('BY');
          expect(holiday.type).toBe('religious');
        });
      });

      it('should have Epiphany (Heilige Drei Könige) on January 6th', () => {
        const holiday = HolidayFactory.createStateHoliday(2025, 'BY', 'heilige_drei_koenige');
        expect(holiday.date).toBe('2025-01-06');
        expect(holiday.name_de).toBe('Heilige Drei Könige');
      });

      it('should have Assumption of Mary (Mariä Himmelfahrt) on August 15th', () => {
        const holiday = HolidayFactory.createStateHoliday(2025, 'BY', 'mariae_himmelfahrt');
        expect(holiday.date).toBe('2025-08-15');
        expect(holiday.name_de).toBe('Mariä Himmelfahrt');
      });

      it('should generate complete year with 13 holidays total', () => {
        const allHolidays = HolidayFactory.createCompleteYearHolidays(2025, 'BY');
        expect(allHolidays).toHaveLength(13); // 9 federal + 4 Bavarian

        const federalCount = allHolidays.filter(h => h.is_federal).length;
        const stateCount = allHolidays.filter(h => !h.is_federal).length;
        expect(federalCount).toBe(9);
        expect(stateCount).toBe(4);
      });
    });

    describe('Berlin (BE) - Secular State', () => {
      it('should have International Women\'s Day on March 8th', () => {
        const holiday = HolidayFactory.createStateHoliday(2025, 'BE', 'internationaler_frauentag');
        expect(holiday.date).toBe('2025-03-08');
        expect(holiday.name_de).toBe('Internationaler Frauentag');
        expect(holiday.type).toBe('secular');
      });

      it('should generate complete year with 10 holidays total', () => {
        const allHolidays = HolidayFactory.createCompleteYearHolidays(2025, 'BE');
        expect(allHolidays).toHaveLength(10); // 9 federal + 1 Berlin-specific
      });
    });

    describe('Saxony (SN) - Protestant State with Buß- und Bettag', () => {
      it('should have Reformation Day on October 31st', () => {
        const holiday = HolidayFactory.createStateHoliday(2025, 'SN', 'reformationstag');
        expect(holiday.date).toBe('2025-10-31');
        expect(holiday.name_de).toBe('Reformationstag');
        expect(holiday.type).toBe('religious');
      });

      it('should have Buß- und Bettag as unique Saxon holiday', () => {
        const holiday = HolidayFactory.createStateHoliday(2025, 'SN', 'buss_und_bettag');
        expect(holiday.date).toBe('2025-11-19');
        expect(holiday.name_de).toBe('Buß- und Bettag');
        expect(holiday.type).toBe('religious');
      });

      it('should generate complete year with 11 holidays total', () => {
        const allHolidays = HolidayFactory.createCompleteYearHolidays(2025, 'SN');
        expect(allHolidays).toHaveLength(11); // 9 federal + 2 Saxon
      });
    });
  });

  describe('Holiday Validation and Data Integrity', () => {
    // TDD Test: Will fail until validation logic is implemented
    it('should reject invalid state codes', () => {
      expect(() => {
        HolidayFactory.createStateHoliday(2025, 'XX', 'heilige_drei_koenige');
      }).toThrow('not valid for state');
    });

    it('should reject holidays not valid for specific states', () => {
      expect(() => {
        HolidayFactory.createStateHoliday(2025, 'BE', 'heilige_drei_koenige');
      }).toThrow('not valid for state BE');
    });

    it('should reject invalid holiday keys', () => {
      expect(() => {
        HolidayFactory.createFederalHoliday(2025, 'invalid_holiday');
      }).toThrow('Unknown federal holiday');
    });

    it('should ensure all holidays are in chronological order', () => {
      const allHolidays = HolidayFactory.createCompleteYearHolidays(2025, 'BY');

      for (let i = 1; i < allHolidays.length; i++) {
        const prevDate = new Date(allHolidays[i - 1].date);
        const currDate = new Date(allHolidays[i].date);
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }
    });

    it('should have unique holiday IDs', () => {
      const allHolidays = HolidayFactory.createCompleteYearHolidays(2025, 'BY');
      const ids = allHolidays.map(h => h.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include timestamps for all holidays', () => {
      const holiday = HolidayFactory.createFederalHoliday(2025, 'neujahr');
      expect(holiday.created_at).toBeTruthy();
      expect(holiday.updated_at).toBeTruthy();
      expect(new Date(holiday.created_at)).toBeInstanceOf(Date);
      expect(new Date(holiday.updated_at)).toBeInstanceOf(Date);
    });
  });

  describe('German Date Utilities', () => {
    // TDD Test: Will fail until GermanDateHelper is implemented
    it('should create dates in German timezone', () => {
      const berlinDate = GermanDateHelper.createBerlinDate(2025, 1, 1, 12, 0);
      expect(berlinDate).toBeInstanceOf(Date);
      expect(berlinDate.getFullYear()).toBe(2025);
    });

    it('should identify German workdays correctly', () => {
      // Monday 2025-01-06 (Epiphany in Bavaria, but check base workday logic)
      expect(GermanDateHelper.isGermanWorkday('2025-01-06')).toBe(true);
      // Saturday
      expect(GermanDateHelper.isGermanWorkday('2025-01-04')).toBe(false);
      // Sunday
      expect(GermanDateHelper.isGermanWorkday('2025-01-05')).toBe(false);
    });

    it('should get correct German week numbers', () => {
      const week1 = GermanDateHelper.getGermanWeekNumber('2025-01-06');
      expect(week1).toBe(2); // First Monday is in week 2 for 2025
    });

    it('should format German dates correctly', () => {
      const formatted = GermanDateHelper.formatGermanDate('2025-01-06', true);
      expect(formatted).toContain('Montag'); // Monday in German
      expect(formatted).toContain('Januar'); // January in German
      expect(formatted).toContain('2025');
    });
  });

  describe('Performance and Memory Requirements', () => {
    // TDD Test: Will fail until performance optimizations are implemented
    it('should calculate all holidays for a state within 10ms', async () => {
      const { result, duration } = await global.measureExecutionTime(
        () => HolidayFactory.createCompleteYearHolidays(2025, 'BY'),
        'Complete year holiday calculation'
      );

      expect(duration).toBeWithinPerformanceTarget(10); // 10ms target
      expect(result).toHaveLength(13);
    });

    it('should handle calculation of 100 years efficiently', async () => {
      const { result, duration } = await global.measureExecutionTime(
        () => {
          const years = Array.from({ length: 100 }, (_, i) => 2025 + i);
          return years.map(year => calculateEaster(year));
        },
        '100 years of Easter calculations'
      );

      expect(duration).toBeWithinPerformanceTarget(100); // 100ms for 100 years
      expect(result).toHaveLength(100);
    });

    it('should not leak memory during extensive calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Calculate holidays for all states and multiple years
      const states = ['BY', 'BE', 'NW', 'BW', 'HE', 'SN', 'TH', 'SH'];
      const years = [2025, 2026, 2027];

      states.forEach(state => {
        years.forEach(year => {
          HolidayFactory.createCompleteYearHolidays(year, state);
        });
      });

      // Force garbage collection if available
      if (global.gc) global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not increase memory by more than 10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Multi-year Consistency', () => {
    // TDD Test: Will fail until multi-year validation is implemented
    it('should maintain consistency across 2025 and 2026', () => {
      const holidays2025 = HolidayFactory.createCompleteYearHolidays(2025, 'BY');
      const holidays2026 = HolidayFactory.createCompleteYearHolidays(2026, 'BY');

      expect(holidays2025).toHaveLength(holidays2026.length);

      holidays2025.forEach((holiday2025, index) => {
        const holiday2026 = holidays2026[index];
        expect(holiday2025.key).toBe(holiday2026.key);
        expect(holiday2025.name_de).toBe(holiday2026.name_de);
        expect(holiday2025.state).toBe(holiday2026.state);
        expect(holiday2025.is_federal).toBe(holiday2026.is_federal);
        expect(holiday2025.type).toBe(holiday2026.type);
      });
    });

    it('should handle edge cases across year boundaries', () => {
      // New Year's Day should always be January 1st
      const newYear2025 = HolidayFactory.createFederalHoliday(2025, 'neujahr');
      const newYear2026 = HolidayFactory.createFederalHoliday(2026, 'neujahr');

      expect(newYear2025.date).toBe('2025-01-01');
      expect(newYear2026.date).toBe('2026-01-01');

      // Christmas should always be December 25th
      const christmas2025 = HolidayFactory.createFederalHoliday(2025, 'weihnachtstag');
      const christmas2026 = HolidayFactory.createFederalHoliday(2026, 'weihnachtstag');

      expect(christmas2025.date).toBe('2025-12-25');
      expect(christmas2026.date).toBe('2026-12-26');
    });
  });

  describe('Integration with German Government Data', () => {
    // TDD Test: Will fail until external API integration is implemented
    it('should validate against known German government holiday dates', () => {
      // These are the official dates that must be correct
      const officialDates2025 = {
        'neujahr': '2025-01-01',
        'karfreitag': '2025-04-18',
        'ostermontag': '2025-04-21',
        'tag_der_arbeit': '2025-05-01',
        'christi_himmelfahrt': '2025-05-29',
        'pfingstmontag': '2025-06-09',
        'tag_der_deutschen_einheit': '2025-10-03',
        'weihnachtstag': '2025-12-25',
        'zweiter_weihnachtstag': '2025-12-26',
        'heilige_drei_koenige': '2025-01-06', // Bavaria
        'fronleichnam': '2025-06-19', // Bavaria
        'mariae_himmelfahrt': '2025-08-15', // Bavaria
        'allerheiligen': '2025-11-01' // Bavaria
      };

      Object.entries(officialDates2025).forEach(([key, expectedDate]) => {
        let holiday;
        if (['heilige_drei_koenige', 'fronleichnam', 'mariae_himmelfahrt', 'allerheiligen'].includes(key)) {
          holiday = HolidayFactory.createStateHoliday(2025, 'BY', key);
        } else {
          holiday = HolidayFactory.createFederalHoliday(2025, key);
        }

        expect(holiday.date).toBe(expectedDate);
      });
    });
  });
});

/**
 * NOTE FOR IMPLEMENTATION:
 *
 * All these tests WILL FAIL initially. This is the correct TDD approach:
 *
 * 1. RED: Tests fail because implementation doesn't exist yet
 * 2. GREEN: Implement minimum code to make tests pass
 * 3. REFACTOR: Improve code quality while keeping tests green
 *
 * Next steps after these tests are created:
 * 1. Implement HolidayService class in src/services/
 * 2. Implement holiday calculation algorithms in src/lib/holidays/
 * 3. Implement date utilities in src/lib/dates/
 * 4. Create database models in src/models/holiday.ts
 *
 * The tests define the exact behavior expected from the implementation.
 */