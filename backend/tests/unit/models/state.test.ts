/**
 * TDD Unit Tests for State Model
 * Constitutional Requirement: Accurate data for all 16 German Bundesländer
 *
 * These tests WILL FAIL initially - this is intentional TDD methodology.
 * Tests define the State model contract and behavior expectations before implementation.
 *
 * German State Specifics Tested:
 * - All 16 Bundesländer with accurate administrative data
 * - 2-letter state codes (BW, BY, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH)
 * - Bilingual naming (German formal names + English equivalents)
 * - Religious demographics (Catholic majority vs Protestant/secular majority)
 * - Population data for traffic scaling calculations
 * - Capital cities for regional deployment strategies
 * - Timezone handling (all Germany uses CET/CEST)
 * - City-state identification (BE, HB, HH)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { State } from '../../../src/models/state';
import { testHelpers } from '../../helpers/unit-test-helpers';

const { MockDatabaseHelper, GERMAN_STATES_CONFIG } = testHelpers;

// Complete list of German state codes for validation
const GERMAN_STATE_CODES = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

// Catholic-majority German states (affects holiday calendar)
const CATHOLIC_MAJORITY_STATES = ['BW', 'BY', 'NW', 'RP', 'SL'];

// Protestant-majority German states
const PROTESTANT_MAJORITY_STATES = ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'];

// Mixed/secular states
const MIXED_SECULAR_STATES = ['BE', 'HE'];

// City-states (special administrative cases)
const CITY_STATES = ['BE', 'HB', 'HH'];

// Expected German state data (official administrative information)
const EXPECTED_STATE_DATA = {
  'BW': {
    name_de: 'Baden-Württemberg',
    name_en: 'Baden-Württemberg',
    population: 11100000,
    is_catholic_majority: true,
    capital: 'Stuttgart',
    timezone: 'Europe/Berlin'
  },
  'BY': {
    name_de: 'Bayern',
    name_en: 'Bavaria',
    population: 13124737,
    is_catholic_majority: true,
    capital: 'München',
    timezone: 'Europe/Berlin'
  },
  'BE': {
    name_de: 'Berlin',
    name_en: 'Berlin',
    population: 3677472,
    is_catholic_majority: false,
    capital: 'Berlin',
    timezone: 'Europe/Berlin'
  },
  'BB': {
    name_de: 'Brandenburg',
    name_en: 'Brandenburg',
    population: 2537868,
    is_catholic_majority: false,
    capital: 'Potsdam',
    timezone: 'Europe/Berlin'
  },
  'HB': {
    name_de: 'Bremen',
    name_en: 'Bremen',
    population: 680130,
    is_catholic_majority: false,
    capital: 'Bremen',
    timezone: 'Europe/Berlin'
  },
  'HH': {
    name_de: 'Hamburg',
    name_en: 'Hamburg',
    population: 1906411,
    is_catholic_majority: false,
    capital: 'Hamburg',
    timezone: 'Europe/Berlin'
  },
  'HE': {
    name_de: 'Hessen',
    name_en: 'Hesse',
    population: 6295017,
    is_catholic_majority: false,
    capital: 'Wiesbaden',
    timezone: 'Europe/Berlin'
  },
  'MV': {
    name_de: 'Mecklenburg-Vorpommern',
    name_en: 'Mecklenburg-Western Pomerania',
    population: 1611160,
    is_catholic_majority: false,
    capital: 'Schwerin',
    timezone: 'Europe/Berlin'
  },
  'NI': {
    name_de: 'Niedersachsen',
    name_en: 'Lower Saxony',
    population: 8003421,
    is_catholic_majority: false,
    capital: 'Hannover',
    timezone: 'Europe/Berlin'
  },
  'NW': {
    name_de: 'Nordrhein-Westfalen',
    name_en: 'North Rhine-Westphalia',
    population: 17925570,
    is_catholic_majority: true,
    capital: 'Düsseldorf',
    timezone: 'Europe/Berlin'
  },
  'RP': {
    name_de: 'Rheinland-Pfalz',
    name_en: 'Rhineland-Palatinate',
    population: 4106485,
    is_catholic_majority: true,
    capital: 'Mainz',
    timezone: 'Europe/Berlin'
  },
  'SL': {
    name_de: 'Saarland',
    name_en: 'Saarland',
    population: 986887,
    is_catholic_majority: true,
    capital: 'Saarbrücken',
    timezone: 'Europe/Berlin'
  },
  'SN': {
    name_de: 'Sachsen',
    name_en: 'Saxony',
    population: 4071971,
    is_catholic_majority: false,
    capital: 'Dresden',
    timezone: 'Europe/Berlin'
  },
  'ST': {
    name_de: 'Sachsen-Anhalt',
    name_en: 'Saxony-Anhalt',
    population: 2180684,
    is_catholic_majority: false,
    capital: 'Magdeburg',
    timezone: 'Europe/Berlin'
  },
  'SH': {
    name_de: 'Schleswig-Holstein',
    name_en: 'Schleswig-Holstein',
    population: 2910875,
    is_catholic_majority: false,
    capital: 'Kiel',
    timezone: 'Europe/Berlin'
  },
  'TH': {
    name_de: 'Thüringen',
    name_en: 'Thuringia',
    population: 2120237,
    is_catholic_majority: false,
    capital: 'Erfurt',
    timezone: 'Europe/Berlin'
  }
};

describe('State Model - TDD Unit Tests', () => {
  beforeEach(() => {
    MockDatabaseHelper.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    MockDatabaseHelper.clear();
  });

  describe('State Creation and Validation', () => {
    // TDD Test 1: Basic State creation will fail until model exists
    it('should create a State instance with all required properties', () => {
      const stateData = {
        code: 'BY',
        name_de: 'Bayern',
        name_en: 'Bavaria',
        population: 13124737,
        is_catholic_majority: true,
        capital: 'München',
        timezone: 'Europe/Berlin'
      };

      const state = new State(stateData);

      expect(state).toBeInstanceOf(State);
      expect(state.code).toBe('BY');
      expect(state.name_de).toBe('Bayern');
      expect(state.name_en).toBe('Bavaria');
      expect(state.population).toBe(13124737);
      expect(state.is_catholic_majority).toBe(true);
      expect(state.capital).toBe('München');
      expect(state.timezone).toBe('Europe/Berlin');
    });

    // TDD Test 2: State validation rules
    it('should validate state code format (2 uppercase letters)', () => {
      const validCodes = ['BY', 'BW', 'NW'];
      const invalidCodes = ['by', 'BAY', 'B1', '12', '', null, undefined];

      validCodes.forEach(code => {
        expect(() => {
          new State({
            code,
            name_de: 'Test',
            name_en: 'Test',
            population: 1000000,
            is_catholic_majority: false,
            capital: 'Test',
            timezone: 'Europe/Berlin'
          });
        }).not.toThrow();
      });

      invalidCodes.forEach(code => {
        expect(() => {
          new State({
            code,
            name_de: 'Test',
            name_en: 'Test',
            population: 1000000,
            is_catholic_majority: false,
            capital: 'Test',
            timezone: 'Europe/Berlin'
          });
        }).toThrow(/Invalid state code/);
      });
    });

    // TDD Test 3: Required field validation
    it('should require all mandatory fields', () => {
      const requiredFields = ['code', 'name_de', 'name_en', 'population', 'is_catholic_majority', 'capital', 'timezone'];

      requiredFields.forEach(field => {
        const stateData = {
          code: 'BY',
          name_de: 'Bayern',
          name_en: 'Bavaria',
          population: 13124737,
          is_catholic_majority: true,
          capital: 'München',
          timezone: 'Europe/Berlin'
        };

        delete stateData[field];

        expect(() => {
          new State(stateData);
        }).toThrow(new RegExp(`${field} is required`));
      });
    });

    // TDD Test 4: Population validation
    it('should validate population as positive integer', () => {
      const validPopulations = [1, 1000000, 13124737, 17925570];
      const invalidPopulations = [0, -1, 1.5, 'invalid', null, undefined];

      validPopulations.forEach(population => {
        expect(() => {
          new State({
            code: 'BY',
            name_de: 'Bayern',
            name_en: 'Bavaria',
            population,
            is_catholic_majority: true,
            capital: 'München',
            timezone: 'Europe/Berlin'
          });
        }).not.toThrow();
      });

      invalidPopulations.forEach(population => {
        expect(() => {
          new State({
            code: 'BY',
            name_de: 'Bayern',
            name_en: 'Bavaria',
            population,
            is_catholic_majority: true,
            capital: 'München',
            timezone: 'Europe/Berlin'
          });
        }).toThrow(/Invalid population/);
      });
    });

    // TDD Test 5: Timezone validation (Germany uses Europe/Berlin)
    it('should validate timezone format', () => {
      const validTimezones = ['Europe/Berlin'];
      const invalidTimezones = ['UTC', 'CET', 'CEST', 'Europe/London', 'America/New_York', '', null];

      validTimezones.forEach(timezone => {
        expect(() => {
          new State({
            code: 'BY',
            name_de: 'Bayern',
            name_en: 'Bavaria',
            population: 13124737,
            is_catholic_majority: true,
            capital: 'München',
            timezone
          });
        }).not.toThrow();
      });

      invalidTimezones.forEach(timezone => {
        expect(() => {
          new State({
            code: 'BY',
            name_de: 'Bayern',
            name_en: 'Bavaria',
            population: 13124737,
            is_catholic_majority: true,
            capital: 'München',
            timezone
          });
        }).toThrow(/Invalid timezone/);
      });
    });
  });

  describe('German State Code Validation', () => {
    // TDD Test 6: All 16 German state codes should be valid
    it('should accept all 16 official German state codes', () => {
      GERMAN_STATE_CODES.forEach(code => {
        expect(() => {
          State.validateStateCode(code);
        }).not.toThrow();
      });
    });

    // TDD Test 7: Invalid state codes should be rejected
    it('should reject invalid state codes', () => {
      const invalidCodes = ['XX', 'AA', 'ZZ', 'UK', 'US', '01', 'by', 'bw'];

      invalidCodes.forEach(code => {
        expect(() => {
          State.validateStateCode(code);
        }).toThrow(/Invalid German state code/);
      });
    });

    // TDD Test 8: State code uniqueness
    it('should ensure state codes are unique', () => {
      const codes = new Set(GERMAN_STATE_CODES);
      expect(codes.size).toBe(16);
      expect(GERMAN_STATE_CODES).toHaveLength(16);
    });
  });

  describe('Accurate German State Data', () => {
    // TDD Test 9: Validate all 16 German states data accuracy
    it('should contain accurate data for all 16 German states', () => {
      Object.entries(EXPECTED_STATE_DATA).forEach(([code, expectedData]) => {
        const state = new State({
          code,
          ...expectedData
        });

        expect(state.code).toBe(code);
        expect(state.name_de).toBe(expectedData.name_de);
        expect(state.name_en).toBe(expectedData.name_en);
        expect(state.population).toBe(expectedData.population);
        expect(state.is_catholic_majority).toBe(expectedData.is_catholic_majority);
        expect(state.capital).toBe(expectedData.capital);
        expect(state.timezone).toBe(expectedData.timezone);
      });
    });

    // TDD Test 10: Catholic majority states validation
    it('should correctly identify Catholic majority states', () => {
      CATHOLIC_MAJORITY_STATES.forEach(code => {
        const stateData = EXPECTED_STATE_DATA[code];
        const state = new State({ code, ...stateData });

        expect(state.is_catholic_majority).toBe(true);
        expect(state.getReligiousMajority()).toBe('catholic');
      });
    });

    // TDD Test 11: Protestant/secular majority states validation
    it('should correctly identify Protestant/secular majority states', () => {
      [...PROTESTANT_MAJORITY_STATES, ...MIXED_SECULAR_STATES].forEach(code => {
        const stateData = EXPECTED_STATE_DATA[code];
        const state = new State({ code, ...stateData });

        expect(state.is_catholic_majority).toBe(false);
        expect(['protestant', 'secular', 'mixed']).toContain(state.getReligiousMajority());
      });
    });

    // TDD Test 12: City-state identification
    it('should correctly identify city-states', () => {
      CITY_STATES.forEach(code => {
        const stateData = EXPECTED_STATE_DATA[code];
        const state = new State({ code, ...stateData });

        expect(state.isCityState()).toBe(true);
        // City-states have capital same as state name
        expect(state.capital.toLowerCase()).toContain(state.name_de.toLowerCase().split('-')[0]);
      });
    });

    // TDD Test 13: Population ranges validation
    it('should have realistic population ranges', () => {
      Object.entries(EXPECTED_STATE_DATA).forEach(([code, data]) => {
        const state = new State({ code, ...data });

        // Germany's smallest state (Bremen) ~680k, largest (NRW) ~18M
        expect(state.population).toBeGreaterThan(500000);
        expect(state.population).toBeLessThan(20000000);

        // Specific population validations for major states
        if (code === 'NW') expect(state.population).toBeGreaterThan(17000000); // Most populous
        if (code === 'BY') expect(state.population).toBeGreaterThan(13000000); // Second most populous
        if (code === 'HB') expect(state.population).toBeLessThan(1000000);     // Smallest
      });
    });
  });

  describe('State Utility Methods', () => {
    // TDD Test 14: Get state by code
    it('should retrieve state by code', () => {
      const bavaria = State.findByCode('BY');

      expect(bavaria).toBeInstanceOf(State);
      expect(bavaria.code).toBe('BY');
      expect(bavaria.name_de).toBe('Bayern');
      expect(bavaria.name_en).toBe('Bavaria');
    });

    // TDD Test 15: Get all states
    it('should return all 16 German states', () => {
      const allStates = State.getAllStates();

      expect(allStates).toHaveLength(16);
      expect(allStates.every(state => state instanceof State)).toBe(true);

      const stateCodes = allStates.map(state => state.code).sort();
      expect(stateCodes).toEqual(GERMAN_STATE_CODES.sort());
    });

    // TDD Test 16: Filter states by religious majority
    it('should filter states by religious majority', () => {
      const catholicStates = State.getStatesByReligion('catholic');
      const protestantStates = State.getStatesByReligion('protestant');

      expect(catholicStates).toHaveLength(CATHOLIC_MAJORITY_STATES.length);
      expect(catholicStates.every(state => state.is_catholic_majority)).toBe(true);

      expect(protestantStates.every(state => !state.is_catholic_majority)).toBe(true);
    });

    // TDD Test 17: Get states by population range
    it('should filter states by population range', () => {
      const largeStates = State.getStatesByPopulation({ min: 10000000 });
      const smallStates = State.getStatesByPopulation({ max: 1000000 });

      expect(largeStates.every(state => state.population >= 10000000)).toBe(true);
      expect(smallStates.every(state => state.population <= 1000000)).toBe(true);

      // Should include NRW and Bavaria as large states
      const largeCodes = largeStates.map(s => s.code);
      expect(largeCodes).toContain('NW');
      expect(largeCodes).toContain('BY');
    });

    // TDD Test 18: Holiday capacity estimation
    it('should estimate holiday processing capacity based on population', () => {
      Object.entries(EXPECTED_STATE_DATA).forEach(([code, data]) => {
        const state = new State({ code, ...data });
        const capacity = state.estimateHolidayCapacity();

        expect(capacity).toBeGreaterThan(0);
        expect(typeof capacity).toBe('number');

        // Larger states should have higher capacity needs
        if (code === 'NW') {
          expect(capacity).toBeGreaterThan(state.population * 0.1); // NRW needs high capacity
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    // TDD Test 19: State lookup performance (<10ms)
    it('should perform state lookups in under 10ms', () => {
      const startTime = process.hrtime.bigint();

      // Perform 1000 lookups
      for (let i = 0; i < 1000; i++) {
        const randomCode = GERMAN_STATE_CODES[Math.floor(Math.random() * GERMAN_STATE_CODES.length)];
        State.findByCode(randomCode);
      }

      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1000000;

      expect(executionTimeMs).toBeLessThan(10);
    });

    // TDD Test 20: Memory efficiency for all states
    it('should efficiently store all 16 states in memory', () => {
      const states = State.getAllStates();
      const memoryUsage = process.memoryUsage();

      expect(states).toHaveLength(16);
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Bilingual Support', () => {
    // TDD Test 21: German name accuracy
    it('should have correct German state names', () => {
      const germanNames = {
        'BY': 'Bayern',
        'BW': 'Baden-Württemberg',
        'NW': 'Nordrhein-Westfalen',
        'NI': 'Niedersachsen',
        'HE': 'Hessen',
        'RP': 'Rheinland-Pfalz',
        'SN': 'Sachsen',
        'ST': 'Sachsen-Anhalt',
        'TH': 'Thüringen',
        'SH': 'Schleswig-Holstein',
        'MV': 'Mecklenburg-Vorpommern',
        'SL': 'Saarland',
        'BB': 'Brandenburg',
        'BE': 'Berlin',
        'HB': 'Bremen',
        'HH': 'Hamburg'
      };

      Object.entries(germanNames).forEach(([code, expectedName]) => {
        const state = State.findByCode(code);
        expect(state.name_de).toBe(expectedName);
      });
    });

    // TDD Test 22: English name accuracy
    it('should have correct English state names', () => {
      const englishNames = {
        'BY': 'Bavaria',
        'BW': 'Baden-Württemberg', // Kept in German as commonly used
        'NW': 'North Rhine-Westphalia',
        'NI': 'Lower Saxony',
        'HE': 'Hesse',
        'RP': 'Rhineland-Palatinate',
        'SN': 'Saxony',
        'ST': 'Saxony-Anhalt',
        'TH': 'Thuringia',
        'SH': 'Schleswig-Holstein',
        'MV': 'Mecklenburg-Western Pomerania'
      };

      Object.entries(englishNames).forEach(([code, expectedName]) => {
        const state = State.findByCode(code);
        expect(state.name_en).toBe(expectedName);
      });
    });

    // TDD Test 23: Name localization method
    it('should provide localized names', () => {
      const bavaria = State.findByCode('BY');

      expect(bavaria.getName('de')).toBe('Bayern');
      expect(bavaria.getName('en')).toBe('Bavaria');
      expect(bavaria.getName()).toBe('Bayern'); // Default to German
    });
  });

  describe('Integration with Holiday System', () => {
    // TDD Test 24: State-specific holiday compatibility
    it('should integrate with holiday system for state-specific holidays', () => {
      const bavaria = State.findByCode('BY');
      const berlin = State.findByCode('BE');

      // Bavaria (Catholic majority) should support Catholic holidays
      expect(bavaria.supportsHolidayType('catholic')).toBe(true);
      expect(bavaria.supportsHolidayType('federal')).toBe(true);
      expect(bavaria.supportsHolidayType('protestant')).toBe(false);

      // Berlin (secular) should support different holidays
      expect(berlin.supportsHolidayType('catholic')).toBe(false);
      expect(berlin.supportsHolidayType('federal')).toBe(true);
      expect(berlin.supportsHolidayType('secular')).toBe(true);
    });

    // TDD Test 25: Bridge weekend calculation preparation
    it('should provide data needed for bridge weekend calculations', () => {
      GERMAN_STATE_CODES.forEach(code => {
        const state = State.findByCode(code);

        // Should provide all data needed for holiday calculations
        expect(state.code).toBeDefined();
        expect(state.timezone).toBe('Europe/Berlin');
        expect(typeof state.is_catholic_majority).toBe('boolean');
        expect(state.population).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    // TDD Test 26: Invalid state code handling
    it('should handle invalid state codes gracefully', () => {
      expect(() => State.findByCode('XX')).toThrow(/State not found/);
      expect(() => State.findByCode('')).toThrow(/Invalid state code/);
      expect(() => State.findByCode(null)).toThrow(/Invalid state code/);
      expect(() => State.findByCode(undefined)).toThrow(/Invalid state code/);
    });

    // TDD Test 27: Case sensitivity handling
    it('should handle state code case sensitivity', () => {
      expect(() => State.findByCode('by')).toThrow(/Invalid state code/);
      expect(() => State.findByCode('By')).toThrow(/Invalid state code/);
      expect(() => State.findByCode('bY')).toThrow(/Invalid state code/);

      // Only uppercase should work
      expect(() => State.findByCode('BY')).not.toThrow();
    });

    // TDD Test 28: Data integrity validation
    it('should maintain data integrity across all states', () => {
      const allStates = State.getAllStates();

      allStates.forEach(state => {
        // All required fields should be present
        expect(state.code).toBeDefined();
        expect(state.name_de).toBeDefined();
        expect(state.name_en).toBeDefined();
        expect(state.population).toBeDefined();
        expect(state.capital).toBeDefined();
        expect(state.timezone).toBeDefined();

        // Logical consistency checks
        expect(state.code).toMatch(/^[A-Z]{2}$/);
        expect(state.name_de.length).toBeGreaterThan(0);
        expect(state.name_en.length).toBeGreaterThan(0);
        expect(state.population).toBeGreaterThan(0);
        expect(state.capital.length).toBeGreaterThan(0);
        expect(state.timezone).toBe('Europe/Berlin');
      });
    });
  });

  describe('Constitutional Compliance Validation', () => {
    // TDD Test 29: Performance requirements compliance
    it('should meet constitutional performance requirements', () => {
      // State data should be instantly available (cached)
      const startTime = Date.now();
      const allStates = State.getAllStates();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5); // Less than 5ms
      expect(allStates).toHaveLength(16);
    });

    // TDD Test 30: Data accuracy constitutional requirement
    it('should meet 100% accuracy requirement for German state data', () => {
      // Verify total German population is approximately correct (~83 million)
      const totalPopulation = State.getAllStates()
        .reduce((sum, state) => sum + state.population, 0);

      expect(totalPopulation).toBeGreaterThan(82000000);
      expect(totalPopulation).toBeLessThan(85000000);

      // Verify all states have realistic capitals
      const expectedCapitals = {
        'BY': 'München', 'BW': 'Stuttgart', 'NW': 'Düsseldorf',
        'NI': 'Hannover', 'HE': 'Wiesbaden', 'RP': 'Mainz',
        'SN': 'Dresden', 'ST': 'Magdeburg', 'TH': 'Erfurt',
        'SH': 'Kiel', 'MV': 'Schwerin', 'SL': 'Saarbrücken',
        'BB': 'Potsdam', 'BE': 'Berlin', 'HB': 'Bremen', 'HH': 'Hamburg'
      };

      Object.entries(expectedCapitals).forEach(([code, expectedCapital]) => {
        const state = State.findByCode(code);
        expect(state.capital).toBe(expectedCapital);
      });
    });
  });
});