/**
 * TDD Unit Tests for Holiday Model
 * Constitutional Requirement: 100% accurate German holiday data for all 16 Bundesländer
 *
 * These tests WILL FAIL initially - this is intentional TDD methodology.
 * Tests define the Holiday model contract and behavior expectations before implementation.
 *
 * German Holiday Specifics Tested:
 * - All 16 Bundesländer variations (BW, BY, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH)
 * - Federal vs State vs Regional holiday types
 * - Catholic vs Protestant state differences
 * - Easter calculation accuracy (Gauss algorithm)
 * - Moving holidays (Buß- und Bettag in Saxony)
 * - Special cases (Augsburg Peace Festival)
 * - Timezone handling (CET/CEST transitions)
 * - Performance requirements (<10ms lookup)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Holiday } from '../../../src/models/holiday';
import { testHelpers } from '../../helpers/unit-test-helpers';

const { MockDatabaseHelper, GermanDateHelper } = testHelpers;

// German state codes for validation
const GERMAN_STATES = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

// Catholic-majority German states
const CATHOLIC_STATES = ['BW', 'BY', 'NW', 'RP', 'SL'];

// Protestant-majority German states
const PROTESTANT_STATES = ['BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'];

describe('Holiday Model - TDD Unit Tests', () => {
  beforeEach(() => {
    MockDatabaseHelper.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    MockDatabaseHelper.clear();
  });

  describe('Holiday Creation and Validation', () => {
    // TDD Test 1: Basic Holiday creation will fail until model exists
    it('should create a Holiday instance with all required properties', () => {
      const holidayData = {
        id: 'neujahr-2025',
        name_de: 'Neujahr',
        name_en: 'New Year\'s Day',
        date: '2025-01-01',
        type: 'federal' as const,
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      };

      const holiday = new Holiday(holidayData);

      expect(holiday.id).toBe('neujahr-2025');
      expect(holiday.name_de).toBe('Neujahr');
      expect(holiday.name_en).toBe('New Year\'s Day');
      expect(holiday.date).toBe('2025-01-01');
      expect(holiday.type).toBe('federal');
      expect(holiday.states).toEqual(['ALL']);
      expect(holiday.is_catholic).toBe(false);
      expect(holiday.is_protestant).toBe(false);
    });

    // TDD Test 2: Validation will fail until validation logic exists
    it('should validate required properties on creation', () => {
      expect(() => {
        new Holiday({
          // Missing required properties
        } as any);
      }).toThrow('Holiday validation failed: missing required properties');
    });

    it('should validate German state codes', () => {
      expect(() => {
        new Holiday({
          id: 'invalid-state-holiday',
          name_de: 'Test Holiday',
          name_en: 'Test Holiday',
          date: '2025-01-01',
          type: 'state',
          states: ['XX'], // Invalid state code
          is_catholic: false,
          is_protestant: false
        });
      }).toThrow('Invalid German state code: XX');
    });

    it('should validate date format and range', () => {
      // Invalid date format
      expect(() => {
        new Holiday({
          id: 'invalid-date',
          name_de: 'Test Holiday',
          name_en: 'Test Holiday',
          date: '01/01/2025', // Wrong format
          type: 'federal',
          states: ['ALL'],
          is_catholic: false,
          is_protestant: false
        });
      }).toThrow('Invalid date format. Expected ISO format YYYY-MM-DD');

      // Date outside valid range
      expect(() => {
        new Holiday({
          id: 'out-of-range',
          name_de: 'Test Holiday',
          name_en: 'Test Holiday',
          date: '2027-01-01', // Outside 2025-2026 range
          type: 'federal',
          states: ['ALL'],
          is_catholic: false,
          is_protestant: false
        });
      }).toThrow('Date must be within range 2025-2026');
    });

    it('should validate holiday type enum', () => {
      expect(() => {
        new Holiday({
          id: 'invalid-type',
          name_de: 'Test Holiday',
          name_en: 'Test Holiday',
          date: '2025-01-01',
          type: 'invalid' as any,
          states: ['ALL'],
          is_catholic: false,
          is_protestant: false
        });
      }).toThrow('Invalid holiday type. Must be: federal, state, or regional');
    });
  });

  describe('German Federal Holidays 2025-2026', () => {
    const federalHolidays2025 = [
      { id: 'neujahr-2025', name_de: 'Neujahr', name_en: 'New Year\'s Day', date: '2025-01-01' },
      { id: 'karfreitag-2025', name_de: 'Karfreitag', name_en: 'Good Friday', date: '2025-04-18' },
      { id: 'ostermontag-2025', name_de: 'Ostermontag', name_en: 'Easter Monday', date: '2025-04-21' },
      { id: 'tag-der-arbeit-2025', name_de: 'Tag der Arbeit', name_en: 'Labour Day', date: '2025-05-01' },
      { id: 'christi-himmelfahrt-2025', name_de: 'Christi Himmelfahrt', name_en: 'Ascension Day', date: '2025-05-29' },
      { id: 'pfingstmontag-2025', name_de: 'Pfingstmontag', name_en: 'Whit Monday', date: '2025-06-09' },
      { id: 'tag-der-deutschen-einheit-2025', name_de: 'Tag der Deutschen Einheit', name_en: 'German Unity Day', date: '2025-10-03' },
      { id: 'weihnachtstag-2025', name_de: '1. Weihnachtstag', name_en: 'Christmas Day', date: '2025-12-25' },
      { id: 'zweiter-weihnachtstag-2025', name_de: '2. Weihnachtstag', name_en: 'Boxing Day', date: '2025-12-26' }
    ];

    federalHolidays2025.forEach(({ id, name_de, name_en, date }) => {
      it(`should create federal holiday: ${name_de} (${date})`, () => {
        const holiday = Holiday.createFederal({
          id,
          name_de,
          name_en,
          date
        });

        expect(holiday.type).toBe('federal');
        expect(holiday.states).toEqual(['ALL']);
        expect(holiday.date).toBe(date);
        expect(holiday.name_de).toBe(name_de);
        expect(holiday.name_en).toBe(name_en);
      });
    });

    // Test 2026 federal holidays
    const federalHolidays2026 = [
      { id: 'neujahr-2026', name_de: 'Neujahr', name_en: 'New Year\'s Day', date: '2026-01-01' },
      { id: 'karfreitag-2026', name_de: 'Karfreitag', name_en: 'Good Friday', date: '2026-03-27' },
      { id: 'ostermontag-2026', name_de: 'Ostermontag', name_en: 'Easter Monday', date: '2026-03-30' },
      { id: 'tag-der-arbeit-2026', name_de: 'Tag der Arbeit', name_en: 'Labour Day', date: '2026-05-01' },
      { id: 'christi-himmelfahrt-2026', name_de: 'Christi Himmelfahrt', name_en: 'Ascension Day', date: '2026-05-07' },
      { id: 'pfingstmontag-2026', name_de: 'Pfingstmontag', name_en: 'Whit Monday', date: '2026-05-18' }
    ];

    federalHolidays2026.forEach(({ id, name_de, name_en, date }) => {
      it(`should create 2026 federal holiday: ${name_de} (${date})`, () => {
        const holiday = Holiday.createFederal({
          id,
          name_de,
          name_en,
          date
        });

        expect(holiday.date).toBe(date);
        expect(holiday.type).toBe('federal');
      });
    });
  });

  describe('German State-Specific Holidays', () => {
    // TDD Test: Bavaria (BY) - Catholic state with most holidays
    it('should create Epiphany (Heilige Drei Könige) for Bavaria, Baden-Württemberg, Saxony-Anhalt', () => {
      const epiphany = Holiday.createState({
        id: 'heilige-drei-koenige-2025',
        name_de: 'Heilige Drei Könige',
        name_en: 'Epiphany',
        date: '2025-01-06',
        states: ['BW', 'BY', 'ST']
      });

      expect(epiphany.type).toBe('state');
      expect(epiphany.states).toEqual(['BW', 'BY', 'ST']);
      expect(epiphany.is_catholic).toBe(true);
    });

    it('should create Corpus Christi (Fronleichnam) for Catholic states', () => {
      const fronleichnam = Holiday.createState({
        id: 'fronleichnam-2025',
        name_de: 'Fronleichnam',
        name_en: 'Corpus Christi',
        date: '2025-06-19',
        states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'] // Catholic states
      });

      expect(fronleichnam.is_catholic).toBe(true);
      expect(fronleichnam.states).toEqual(['BW', 'BY', 'HE', 'NW', 'RP', 'SL']);
    });

    it('should create All Saints Day (Allerheiligen) for Catholic states', () => {
      const allerheiligen = Holiday.createState({
        id: 'allerheiligen-2025',
        name_de: 'Allerheiligen',
        name_en: 'All Saints\' Day',
        date: '2025-11-01',
        states: ['BW', 'BY', 'NW', 'RP', 'SL']
      });

      expect(allerheiligen.is_catholic).toBe(true);
      expect(allerheiligen.date).toBe('2025-11-01');
    });

    it('should create Reformation Day (Reformationstag) for Protestant states', () => {
      const reformationstag = Holiday.createState({
        id: 'reformationstag-2025',
        name_de: 'Reformationstag',
        name_en: 'Reformation Day',
        date: '2025-10-31',
        states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH']
      });

      expect(reformationstag.is_protestant).toBe(true);
      expect(reformationstag.states).toContain('SN');
    });

    it('should create Prayer and Repentance Day (Buß- und Bettag) only for Saxony', () => {
      const bussUndBettag = Holiday.createState({
        id: 'buss-und-bettag-2025',
        name_de: 'Buß- und Bettag',
        name_en: 'Prayer and Repentance Day',
        date: '2025-11-19', // Wednesday before November 23rd
        states: ['SN']
      });

      expect(bussUndBettag.states).toEqual(['SN']);
      expect(bussUndBettag.is_protestant).toBe(true);
    });
  });

  describe('Regional/Local Holidays', () => {
    it('should create Augsburg Peace Festival (regional to Augsburg city)', () => {
      const augsburgPeace = Holiday.createRegional({
        id: 'augsburger-friedensfest-2025',
        name_de: 'Augsburger Friedensfest',
        name_en: 'Augsburg Peace Festival',
        date: '2025-08-08',
        states: ['BY'],
        region: 'Augsburg'
      });

      expect(augsburgPeace.type).toBe('regional');
      expect(augsburgPeace.region).toBe('Augsburg');
      expect(augsburgPeace.states).toEqual(['BY']);
    });
  });

  describe('Easter-based Holiday Calculations', () => {
    it('should calculate Easter date using Gauss algorithm for 2025', () => {
      const easterDate = Holiday.calculateEaster(2025);
      expect(easterDate).toBe('2025-04-20'); // Easter Sunday 2025
    });

    it('should calculate Easter date using Gauss algorithm for 2026', () => {
      const easterDate = Holiday.calculateEaster(2026);
      expect(easterDate).toBe('2026-04-05'); // Easter Sunday 2026
    });

    it('should calculate Easter-dependent holidays correctly', () => {
      const easterDependentHolidays = Holiday.calculateEasterDependentHolidays(2025);

      expect(easterDependentHolidays).toHaveProperty('karfreitag', '2025-04-18');
      expect(easterDependentHolidays).toHaveProperty('ostermontag', '2025-04-21');
      expect(easterDependentHolidays).toHaveProperty('christi_himmelfahrt', '2025-05-29');
      expect(easterDependentHolidays).toHaveProperty('pfingstmontag', '2025-06-09');
      expect(easterDependentHolidays).toHaveProperty('fronleichnam', '2025-06-19');
    });

    it('should handle leap year Easter calculations correctly', () => {
      // Test edge case years
      const easter2024 = Holiday.calculateEaster(2024); // Leap year
      expect(easter2024).toBe('2024-03-31');
    });
  });

  describe('Moving Holiday Calculations', () => {
    it('should calculate Buß- und Bettag correctly (Wednesday before November 23)', () => {
      const bussUndBettag2025 = Holiday.calculateBussUndBettag(2025);
      expect(bussUndBettag2025).toBe('2025-11-19'); // Wednesday

      const bussUndBettag2026 = Holiday.calculateBussUndBettag(2026);
      expect(bussUndBettag2026).toBe('2026-11-18'); // Wednesday
    });
  });

  describe('Timezone Handling (CET/CEST)', () => {
    it('should handle timezone transitions correctly', () => {
      // Test dates around DST changes
      const springHoliday = new Holiday({
        id: 'spring-test',
        name_de: 'Frühlingstest',
        name_en: 'Spring Test',
        date: '2025-03-30', // Around DST change
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      });

      expect(springHoliday.getDateInTimezone('Europe/Berlin')).toBeDefined();
    });

    it('should maintain date consistency across timezone changes', () => {
      const holiday = new Holiday({
        id: 'timezone-test',
        name_de: 'Zeitzonentest',
        name_en: 'Timezone Test',
        date: '2025-10-26', // DST change date
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      });

      const berlinDate = holiday.getDateInTimezone('Europe/Berlin');
      expect(berlinDate.getDate()).toBe(26);
      expect(berlinDate.getMonth()).toBe(9); // October (0-indexed)
    });
  });

  describe('Performance Requirements', () => {
    it('should perform holiday lookup in less than 10ms', async () => {
      const holidays = await Holiday.createMockDatabase(100); // 100 holidays

      const { duration } = await global.measureExecutionTime(async () => {
        return Holiday.findById('neujahr-2025');
      }, 'Holiday lookup');

      expect(duration).toBeWithinPerformanceTarget(10);
    });

    it('should handle batch operations efficiently', async () => {
      const stateHolidays = GERMAN_STATES;

      const { duration } = await global.measureExecutionTime(async () => {
        return Holiday.findByStateAndYear('BY', 2025);
      }, 'State holidays batch lookup');

      expect(duration).toBeWithinPerformanceTarget(50);
    });

    it('should cache frequently accessed holidays', async () => {
      // First call - database access
      const first = await Holiday.findById('neujahr-2025');

      // Second call - should be cached
      const { duration } = await global.measureExecutionTime(async () => {
        return Holiday.findById('neujahr-2025');
      }, 'Cached holiday lookup');

      expect(duration).toBeWithinPerformanceTarget(1); // Should be < 1ms from cache
    });
  });

  describe('Data Query Methods', () => {
    it('should find holidays by state code', async () => {
      const bavarianHolidays = await Holiday.findByState('BY');

      expect(bavarianHolidays).toBeInstanceOf(Array);
      expect(bavarianHolidays.length).toBeGreaterThan(10); // Bavaria has many holidays

      // Should include federal holidays
      const federalInBavaria = bavarianHolidays.filter(h => h.type === 'federal');
      expect(federalInBavaria.length).toBeGreaterThanOrEqual(9);

      // Should include state-specific holidays
      const stateSpecific = bavarianHolidays.filter(h => h.type === 'state');
      expect(stateSpecific.length).toBeGreaterThanOrEqual(4);
    });

    it('should find holidays by year', async () => {
      const holidays2025 = await Holiday.findByYear(2025);
      const holidays2026 = await Holiday.findByYear(2026);

      expect(holidays2025).toBeInstanceOf(Array);
      expect(holidays2026).toBeInstanceOf(Array);
      expect(holidays2025.length).toBeGreaterThan(0);
      expect(holidays2026.length).toBeGreaterThan(0);
    });

    it('should find holidays by state and year combination', async () => {
      const berlinHolidays2025 = await Holiday.findByStateAndYear('BE', 2025);

      // Berlin has minimal holidays (mostly federal)
      expect(berlinHolidays2025.length).toBeGreaterThanOrEqual(9);

      // Should not include Catholic holidays
      const catholicHolidays = berlinHolidays2025.filter(h => h.is_catholic);
      expect(catholicHolidays.length).toBe(0);
    });

    it('should find holidays by religious denomination', async () => {
      const catholicHolidays = await Holiday.findByCatholic(true);
      const protestantHolidays = await Holiday.findByProtestant(true);

      expect(catholicHolidays.every(h => h.is_catholic)).toBe(true);
      expect(protestantHolidays.every(h => h.is_protestant)).toBe(true);

      // Should not overlap (holidays are either Catholic, Protestant, or neither)
      const overlap = catholicHolidays.filter(ch =>
        protestantHolidays.some(ph => ph.id === ch.id)
      );
      expect(overlap.length).toBe(0);
    });
  });

  describe('Holiday Validation and Edge Cases', () => {
    it('should validate all German states have correct number of holidays', async () => {
      for (const state of GERMAN_STATES) {
        const holidays = await Holiday.findByStateAndYear(state, 2025);

        // Minimum federal holidays
        expect(holidays.length).toBeGreaterThanOrEqual(9);

        // Catholic states should have more holidays
        if (CATHOLIC_STATES.includes(state)) {
          expect(holidays.length).toBeGreaterThanOrEqual(12);
        }

        // Protestant states with Reformation Day
        if (state === 'SN') { // Saxony has Buß- und Bettag
          const bussUndBettag = holidays.find(h => h.name_de === 'Buß- und Bettag');
          expect(bussUndBettag).toBeDefined();
        }
      }
    });

    it('should ensure no duplicate holidays within same state', async () => {
      for (const state of GERMAN_STATES) {
        const holidays = await Holiday.findByStateAndYear(state, 2025);
        const dates = holidays.map(h => h.date);
        const uniqueDates = [...new Set(dates)];

        expect(dates.length).toBe(uniqueDates.length);
      }
    });

    it('should validate holiday names are properly bilingual', async () => {
      const allHolidays = await Holiday.findByYear(2025);

      for (const holiday of allHolidays) {
        expect(holiday.name_de).toBeDefined();
        expect(holiday.name_en).toBeDefined();
        expect(holiday.name_de.length).toBeGreaterThan(0);
        expect(holiday.name_en.length).toBeGreaterThan(0);
        expect(holiday.name_de).not.toBe(holiday.name_en); // Should be different languages
      }
    });

    it('should handle invalid state codes gracefully', async () => {
      await expect(Holiday.findByState('XX')).rejects.toThrow('Invalid German state code: XX');
    });

    it('should handle out-of-range years gracefully', async () => {
      await expect(Holiday.findByYear(2024)).rejects.toThrow('Year must be within range 2025-2026');
      await expect(Holiday.findByYear(2027)).rejects.toThrow('Year must be within range 2025-2026');
    });
  });

  describe('Holiday Serialization and JSON Support', () => {
    it('should serialize to JSON correctly', () => {
      const holiday = new Holiday({
        id: 'test-holiday',
        name_de: 'Testheiertag',
        name_en: 'Test Holiday',
        date: '2025-01-01',
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      });

      const json = JSON.stringify(holiday);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('test-holiday');
      expect(parsed.name_de).toBe('Testheiertag');
      expect(parsed.states).toEqual(['ALL']);
    });

    it('should create Holiday from JSON data', () => {
      const jsonData = {
        id: 'from-json',
        name_de: 'JSON Feiertag',
        name_en: 'JSON Holiday',
        date: '2025-12-31',
        type: 'state',
        states: ['BY'],
        is_catholic: true,
        is_protestant: false
      };

      const holiday = Holiday.fromJSON(jsonData);

      expect(holiday.id).toBe('from-json');
      expect(holiday.is_catholic).toBe(true);
      expect(holiday.states).toEqual(['BY']);
    });
  });

  describe('German Cultural and Legal Compliance', () => {
    it('should respect German labor law holiday definitions', async () => {
      const federalHolidays = await Holiday.findByType('federal');

      // All federal holidays must be recognized nationwide
      for (const holiday of federalHolidays) {
        expect(holiday.states).toEqual(['ALL']);
      }
    });

    it('should maintain historical accuracy for German holidays', async () => {
      // German Unity Day must be October 3rd
      const unityDay = await Holiday.findById('tag-der-deutschen-einheit-2025');
      expect(unityDay.date).toBe('2025-10-03');
      expect(unityDay.name_en).toBe('German Unity Day');
    });

    it('should correctly categorize religious vs secular holidays', async () => {
      const catholicHolidays = await Holiday.findByCatholic(true);
      const protestantHolidays = await Holiday.findByProtestant(true);
      const secularHolidays = await Holiday.findByReligious(false);

      // Catholic holidays should include Corpus Christi, All Saints
      const corpusChristi = catholicHolidays.find(h => h.name_de === 'Fronleichnam');
      expect(corpusChristi).toBeDefined();

      // Protestant holidays should include Reformation Day
      const reformationDay = protestantHolidays.find(h => h.name_de === 'Reformationstag');
      expect(reformationDay).toBeDefined();

      // Secular holidays should include Labor Day, Unity Day
      const laborDay = secularHolidays.find(h => h.name_de === 'Tag der Arbeit');
      expect(laborDay).toBeDefined();
    });
  });
});