/**
 * TDD Unit Tests for BridgeWeekend Model
 * Constitutional Requirement: <100ms bridge calculations for German vacation optimization
 *
 * These tests WILL FAIL initially - this is intentional TDD methodology.
 * Tests define the BridgeWeekend model contract and behavior expectations before implementation.
 *
 * German Bridge Weekend Optimization Tested:
 * - May holiday clusters (May 1st, Ascension, Pentecost Monday)
 * - Christmas/New Year mega-bridges (6-16 days off with 2-5 vacation days)
 * - Thursday/Friday patterns (long weekends)
 * - Tuesday/Monday patterns (extended weekends)
 * - Catholic state advantages (Corpus Christi, Epiphany)
 * - Efficiency calculations (days_off / vacation_days >= 2.0 threshold)
 * - School holiday avoidance for families
 * - Performance requirements (<100ms for full year calculation)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BridgeWeekend, BridgePattern } from '../../../src/models/bridge-weekend';
import { Holiday } from '../../../src/models/holiday';
import { testHelpers } from '../../helpers/unit-test-helpers';

const { MockDatabaseHelper, GermanDateHelper, PerformanceHelper } = testHelpers;

// German state codes for testing
const GERMAN_STATES = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

// Catholic states with additional bridge opportunities
const CATHOLIC_STATES = ['BW', 'BY', 'NW', 'RP', 'SL'];

// Bridge pattern types
const BRIDGE_PATTERNS = ['thursday-friday', 'monday-tuesday', 'tuesday-friday', 'sandwich', 'extend-weekend'] as BridgePattern[];

// Sample German holidays for 2025 bridge testing
const SAMPLE_HOLIDAYS_2025 = [
  { id: 'neujahr-2025', date: '2025-01-01', name_de: 'Neujahr', name_en: "New Year's Day" },
  { id: 'tag-der-arbeit-2025', date: '2025-05-01', name_de: 'Tag der Arbeit', name_en: 'Labour Day' }, // Thursday
  { id: 'christi-himmelfahrt-2025', date: '2025-05-29', name_de: 'Christi Himmelfahrt', name_en: 'Ascension Day' }, // Thursday
  { id: 'pfingstmontag-2025', date: '2025-06-09', name_de: 'Pfingstmontag', name_en: 'Whit Monday' }, // Monday
  { id: 'fronleichnam-2025', date: '2025-06-19', name_de: 'Fronleichnam', name_en: 'Corpus Christi' }, // Thursday (Catholic states only)
  { id: 'tag-der-deutschen-einheit-2025', date: '2025-10-03', name_de: 'Tag der Deutschen Einheit', name_en: 'German Unity Day' }, // Friday
  { id: 'heiligabend-2025', date: '2025-12-24', name_de: 'Heiligabend', name_en: 'Christmas Eve' }, // Wednesday
  { id: 'weihnachten-2025', date: '2025-12-25', name_de: '1. Weihnachtsfeiertag', name_en: 'Christmas Day' }, // Thursday
  { id: 'zweiter-weihnachtsfeiertag-2025', date: '2025-12-26', name_de: '2. Weihnachtsfeiertag', name_en: 'Boxing Day' }, // Friday
  { id: 'silvester-2025', date: '2025-12-31', name_de: 'Silvester', name_en: "New Year's Eve" } // Wednesday
];

describe('BridgeWeekend Model - TDD Unit Tests', () => {
  beforeEach(() => {
    MockDatabaseHelper.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    MockDatabaseHelper.clear();
  });

  describe('BridgeWeekend Creation and Validation', () => {
    // TDD Test 1: Basic BridgeWeekend creation will fail until model exists
    it('should create a BridgeWeekend instance with all required properties', () => {
      const bridgeData = {
        id: 'bridge-may-day-2025-by',
        holiday_id: 'tag-der-arbeit-2025',
        state_code: 'BY',
        start_date: '2025-05-01', // Thursday (May Day)
        end_date: '2025-05-04',   // Sunday
        vacation_days_needed: 1,  // Friday off
        total_days_off: 4,        // Thu-Sun
        efficiency: 4.0,          // 4 days off / 1 vacation day
        pattern: 'thursday-friday' as BridgePattern
      };

      expect(() => {
        const bridge = new BridgeWeekend(bridgeData);
        expect(bridge.id).toBe(bridgeData.id);
        expect(bridge.holiday_id).toBe(bridgeData.holiday_id);
        expect(bridge.state_code).toBe(bridgeData.state_code);
        expect(bridge.start_date).toBe(bridgeData.start_date);
        expect(bridge.end_date).toBe(bridgeData.end_date);
        expect(bridge.vacation_days_needed).toBe(bridgeData.vacation_days_needed);
        expect(bridge.total_days_off).toBe(bridgeData.total_days_off);
        expect(bridge.efficiency).toBe(bridgeData.efficiency);
        expect(bridge.pattern).toBe(bridgeData.pattern);
      }).not.toThrow();
    });

    // TDD Test 2: Validation of required fields
    it('should throw error when required fields are missing', () => {
      const incompleteData = {
        holiday_id: 'tag-der-arbeit-2025',
        // Missing required fields
      };

      expect(() => {
        new BridgeWeekend(incompleteData as any);
      }).toThrow('Missing required fields for BridgeWeekend');
    });

    // TDD Test 3: Validation of German state codes
    it('should validate German state codes', () => {
      const invalidStateData = {
        id: 'bridge-test',
        holiday_id: 'test-holiday',
        state_code: 'XX', // Invalid state code
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'thursday-friday' as BridgePattern
      };

      expect(() => {
        new BridgeWeekend(invalidStateData);
      }).toThrow('Invalid German state code: XX');
    });

    // TDD Test 4: Pattern validation
    it('should validate bridge patterns', () => {
      const invalidPatternData = {
        id: 'bridge-test',
        holiday_id: 'test-holiday',
        state_code: 'BY',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'invalid-pattern' as BridgePattern
      };

      expect(() => {
        new BridgeWeekend(invalidPatternData);
      }).toThrow('Invalid bridge pattern: invalid-pattern');
    });
  });

  describe('Efficiency Calculations', () => {
    // TDD Test 5: Efficiency calculation accuracy
    it('should calculate efficiency as total_days_off / vacation_days_needed', () => {
      const testCases = [
        { vacation_days: 1, total_days: 4, expected_efficiency: 4.0 },
        { vacation_days: 2, total_days: 5, expected_efficiency: 2.5 },
        { vacation_days: 1, total_days: 3, expected_efficiency: 3.0 },
        { vacation_days: 3, total_days: 9, expected_efficiency: 3.0 }
      ];

      testCases.forEach(({ vacation_days, total_days, expected_efficiency }) => {
        const bridgeData = {
          id: 'test-bridge',
          holiday_id: 'test-holiday',
          state_code: 'BY',
          start_date: '2025-05-01',
          end_date: '2025-05-04',
          vacation_days_needed: vacation_days,
          total_days_off: total_days,
          efficiency: 0, // Will be calculated
          pattern: 'thursday-friday' as BridgePattern
        };

        const bridge = new BridgeWeekend(bridgeData);
        bridge.calculateEfficiency();
        expect(bridge.efficiency).toBe(expected_efficiency);
      });
    });

    // TDD Test 6: Minimum efficiency threshold (German workers need >2.0 to be worthwhile)
    it('should identify worthwhile bridges with efficiency >= 2.0', () => {
      const lowEfficiencyBridge = new BridgeWeekend({
        id: 'low-efficiency',
        holiday_id: 'test-holiday',
        state_code: 'BY',
        start_date: '2025-05-01',
        end_date: '2025-05-03',
        vacation_days_needed: 2,
        total_days_off: 3,
        efficiency: 1.5,
        pattern: 'sandwich' as BridgePattern
      });

      const highEfficiencyBridge = new BridgeWeekend({
        id: 'high-efficiency',
        holiday_id: 'test-holiday',
        state_code: 'BY',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'thursday-friday' as BridgePattern
      });

      expect(lowEfficiencyBridge.isWorthwhile()).toBe(false);
      expect(highEfficiencyBridge.isWorthwhile()).toBe(true);
    });
  });

  describe('German Bridge Weekend Patterns', () => {
    // TDD Test 7: Thursday-Friday pattern (classic German long weekend)
    it('should create Thursday-Friday pattern for May Day 2025', () => {
      // May 1, 2025 is a Thursday
      const mayDayBridge = BridgeWeekend.createFromHoliday(
        SAMPLE_HOLIDAYS_2025[1], // May Day Thursday
        'BY',
        'thursday-friday'
      );

      expect(mayDayBridge.pattern).toBe('thursday-friday');
      expect(mayDayBridge.start_date).toBe('2025-05-01'); // Thursday
      expect(mayDayBridge.end_date).toBe('2025-05-04');   // Sunday
      expect(mayDayBridge.vacation_days_needed).toBe(1);  // Friday off
      expect(mayDayBridge.total_days_off).toBe(4);        // Thu-Sun
      expect(mayDayBridge.efficiency).toBe(4.0);
    });

    // TDD Test 8: Monday-Tuesday pattern for Whit Monday
    it('should create Monday-Tuesday pattern for Whit Monday 2025', () => {
      // June 9, 2025 is Whit Monday
      const whitMondayBridge = BridgeWeekend.createFromHoliday(
        SAMPLE_HOLIDAYS_2025[4], // Whit Monday
        'BY',
        'monday-tuesday'
      );

      expect(whitMondayBridge.pattern).toBe('monday-tuesday');
      expect(whitMondayBridge.vacation_days_needed).toBe(1); // Tuesday off
      expect(whitMondayBridge.total_days_off).toBe(4);       // Sat-Tue
      expect(whitMondayBridge.efficiency).toBe(4.0);
    });

    // TDD Test 9: Sandwich pattern (holiday between weekends)
    it('should create sandwich pattern for Wednesday holidays', () => {
      // Christmas Eve 2025 is Wednesday - perfect sandwich opportunity
      const christmasEveBridge = BridgeWeekend.createFromHoliday(
        SAMPLE_HOLIDAYS_2025[6], // Christmas Eve Wednesday
        'BY',
        'sandwich'
      );

      expect(christmasEveBridge.pattern).toBe('sandwich');
      expect(christmasEveBridge.vacation_days_needed).toBe(2); // Mon-Tue or Thu-Fri
      expect(christmasEveBridge.total_days_off).toBe(5);       // Sat-Wed or Wed-Sun
      expect(christmasEveBridge.efficiency).toBe(2.5);
    });

    // TDD Test 10: Extended weekend pattern
    it('should create extend-weekend pattern for optimal multi-day bridges', () => {
      // German Unity Day 2025 is Friday - extend the weekend
      const unityDayBridge = BridgeWeekend.createFromHoliday(
        SAMPLE_HOLIDAYS_2025[5], // Unity Day Friday
        'BY',
        'extend-weekend'
      );

      expect(unityDayBridge.pattern).toBe('extend-weekend');
      expect(unityDayBridge.vacation_days_needed).toBe(1); // Thursday off
      expect(unityDayBridge.total_days_off).toBe(4);       // Thu-Sun
      expect(unityDayBridge.efficiency).toBe(4.0);
    });
  });

  describe('German-Specific Holiday Optimizations', () => {
    // TDD Test 11: May holiday cluster optimization (German vacation gold mine)
    it('should optimize May 2025 holiday cluster for maximum efficiency', () => {
      const mayHolidays = [
        SAMPLE_HOLIDAYS_2025[1], // May 1 (Thu)
        SAMPLE_HOLIDAYS_2025[2], // Ascension (Thu, May 29)
        SAMPLE_HOLIDAYS_2025[3]  // Whit Monday (Mon, June 9)
      ];

      const mayCluster = BridgeWeekend.optimizeMayCluster(mayHolidays, 'BY', 5); // 5 vacation days budget

      expect(mayCluster).toBeDefined();
      expect(mayCluster.length).toBeGreaterThan(0);
      expect(mayCluster[0].efficiency).toBeGreaterThan(2.0);
      expect(mayCluster.every(bridge => bridge.vacation_days_needed <= 5)).toBe(true);
    });

    // TDD Test 12: Christmas/New Year mega-bridge (German Christmas market season)
    it('should create Christmas/New Year mega-bridge for maximum time off', () => {
      const christmasHolidays = [
        SAMPLE_HOLIDAYS_2025[6], // Christmas Eve (Wed)
        SAMPLE_HOLIDAYS_2025[7], // Christmas Day (Thu)
        SAMPLE_HOLIDAYS_2025[8], // Boxing Day (Fri)
        SAMPLE_HOLIDAYS_2025[9]  // New Year's Eve (Wed)
      ];

      const megaBridge = BridgeWeekend.createMegaBridge(christmasHolidays, 'BY');

      expect(megaBridge.start_date).toBe('2025-12-20'); // Saturday before Christmas week
      expect(megaBridge.end_date).toBe('2026-01-05');   // Sunday after New Year
      expect(megaBridge.vacation_days_needed).toBeLessThanOrEqual(5); // Max 5 vacation days
      expect(megaBridge.total_days_off).toBeGreaterThanOrEqual(10);    // At least 10 days off
      expect(megaBridge.efficiency).toBeGreaterThan(2.0);
    });

    // TDD Test 13: Catholic state advantages (Corpus Christi, Epiphany)
    it('should create additional bridge opportunities for Catholic states', () => {
      const catholicHoliday = SAMPLE_HOLIDAYS_2025[4]; // Corpus Christi (Thu, June 19)

      // Should create bridge for Catholic states
      const catholicBridge = BridgeWeekend.createFromHoliday(catholicHoliday, 'BY', 'thursday-friday');
      expect(catholicBridge).toBeDefined();
      expect(catholicBridge.efficiency).toBe(4.0);

      // Should not create bridge for Protestant states (holiday doesn't exist)
      expect(() => {
        BridgeWeekend.createFromHoliday(catholicHoliday, 'BE', 'thursday-friday');
      }).toThrow('Holiday not available in state BE');
    });

    // TDD Test 14: State-specific optimization rankings
    it('should rank bridge opportunities by state-specific holidays', () => {
      const bavaria = BridgeWeekend.getBestBridgesForState('BY', 2025, 10); // 10 vacation days
      const berlin = BridgeWeekend.getBestBridgesForState('BE', 2025, 10);

      // Bavaria should have more opportunities due to Catholic holidays
      expect(bavaria.length).toBeGreaterThan(berlin.length);
      expect(bavaria.every(bridge => bridge.state_code === 'BY')).toBe(true);
      expect(berlin.every(bridge => bridge.state_code === 'BE')).toBe(true);

      // Should be sorted by efficiency (best first)
      for (let i = 1; i < bavaria.length; i++) {
        expect(bavaria[i-1].efficiency).toBeGreaterThanOrEqual(bavaria[i].efficiency);
      }
    });
  });

  describe('Constraint Handling and Validation', () => {
    // TDD Test 15: Maximum vacation day constraints
    it('should respect maximum vacation day budgets', () => {
      const bridges5Days = BridgeWeekend.findOptimalBridges('BY', 2025, { maxVacationDays: 5 });
      const bridges10Days = BridgeWeekend.findOptimalBridges('BY', 2025, { maxVacationDays: 10 });

      expect(bridges5Days.every(bridge => bridge.vacation_days_needed <= 5)).toBe(true);
      expect(bridges10Days.every(bridge => bridge.vacation_days_needed <= 10)).toBe(true);
      expect(bridges10Days.length).toBeGreaterThanOrEqual(bridges5Days.length);
    });

    // TDD Test 16: Overlapping holiday handling
    it('should handle overlapping holidays correctly', () => {
      const overlappingHolidays = [
        { id: 'christmas-2025', date: '2025-12-25', name_de: 'Weihnachten' }, // Thursday
        { id: 'boxing-day-2025', date: '2025-12-26', name_de: '2. Weihnachtsfeiertag' } // Friday
      ];

      const bridge = BridgeWeekend.createFromOverlappingHolidays(overlappingHolidays, 'BY');

      expect(bridge.vacation_days_needed).toBe(0); // No vacation days needed - consecutive holidays
      expect(bridge.total_days_off).toBe(4); // Thu-Sun
      expect(bridge.efficiency).toBe(Infinity); // Perfect efficiency - no vacation days used
    });

    // TDD Test 17: Date range validation
    it('should validate start_date comes before end_date', () => {
      const invalidDateData = {
        id: 'invalid-bridge',
        holiday_id: 'test-holiday',
        state_code: 'BY',
        start_date: '2025-05-05',
        end_date: '2025-05-01', // End before start
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'thursday-friday' as BridgePattern
      };

      expect(() => {
        new BridgeWeekend(invalidDateData);
      }).toThrow('start_date must be before end_date');
    });

    // TDD Test 18: School holiday avoidance (family optimization)
    it('should flag bridges that overlap with German school holidays', () => {
      const schoolHolidayBridge = new BridgeWeekend({
        id: 'school-overlap',
        holiday_id: 'summer-holiday',
        state_code: 'BY',
        start_date: '2025-07-28', // Bavarian summer holidays
        end_date: '2025-08-01',
        vacation_days_needed: 3,
        total_days_off: 5,
        efficiency: 1.67,
        pattern: 'extend-weekend' as BridgePattern
      });

      expect(schoolHolidayBridge.overlapsWithSchoolHolidays('BY')).toBe(true);
      expect(schoolHolidayBridge.getFamilyOptimizationScore()).toBeLessThan(1.0); // Penalized for school overlap
    });
  });

  describe('Performance and Optimization', () => {
    // TDD Test 19: Bridge calculation performance (<100ms constitutional requirement)
    it('should calculate all bridges for a state within 100ms', async () => {
      const startTime = performance.now();

      const bridges = await BridgeWeekend.calculateAllBridges('BY', 2025);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Constitutional requirement
      expect(bridges.length).toBeGreaterThan(0);
      expect(bridges.every(bridge => bridge.efficiency > 0)).toBe(true);
    });

    // TDD Test 20: Memory efficiency for large datasets
    it('should handle batch processing for all German states efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const allStateBridges = await Promise.all(
        GERMAN_STATES.map(state => BridgeWeekend.calculateAllBridges(state, 2025))
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not use more than 50MB for all states
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(allStateBridges.length).toBe(GERMAN_STATES.length);
      expect(allStateBridges.every(stateBridges => stateBridges.length > 0)).toBe(true);
    });

    // TDD Test 21: Sorting and ranking algorithms
    it('should sort bridges by efficiency for optimal user experience', () => {
      const unsortedBridges = [
        new BridgeWeekend({
          id: 'low', holiday_id: 'h1', state_code: 'BY', start_date: '2025-05-01', end_date: '2025-05-03',
          vacation_days_needed: 2, total_days_off: 3, efficiency: 1.5, pattern: 'sandwich' as BridgePattern
        }),
        new BridgeWeekend({
          id: 'high', holiday_id: 'h2', state_code: 'BY', start_date: '2025-06-01', end_date: '2025-06-04',
          vacation_days_needed: 1, total_days_off: 4, efficiency: 4.0, pattern: 'thursday-friday' as BridgePattern
        }),
        new BridgeWeekend({
          id: 'medium', holiday_id: 'h3', state_code: 'BY', start_date: '2025-07-01', end_date: '2025-07-05',
          vacation_days_needed: 2, total_days_off: 5, efficiency: 2.5, pattern: 'tuesday-friday' as BridgePattern
        })
      ];

      const sortedBridges = BridgeWeekend.sortByEfficiency(unsortedBridges);

      expect(sortedBridges[0].efficiency).toBe(4.0);
      expect(sortedBridges[1].efficiency).toBe(2.5);
      expect(sortedBridges[2].efficiency).toBe(1.5);
    });

    // TDD Test 22: Caching and memoization
    it('should cache repeated calculations for performance', async () => {
      // First calculation
      const start1 = performance.now();
      const bridges1 = await BridgeWeekend.calculateAllBridges('BY', 2025);
      const time1 = performance.now() - start1;

      // Second calculation (should be cached)
      const start2 = performance.now();
      const bridges2 = await BridgeWeekend.calculateAllBridges('BY', 2025);
      const time2 = performance.now() - start2;

      expect(bridges2).toEqual(bridges1);
      expect(time2).toBeLessThan(time1 * 0.1); // Should be at least 10x faster with caching
    });
  });

  describe('Edge Cases and Error Handling', () => {
    // TDD Test 23: Holiday on weekend handling
    it('should handle holidays that fall on weekends', () => {
      const weekendHoliday = {
        id: 'weekend-holiday',
        date: '2025-01-04', // Saturday
        name_de: 'Wochenend-Feiertag',
        name_en: 'Weekend Holiday'
      };

      expect(() => {
        BridgeWeekend.createFromHoliday(weekendHoliday, 'BY', 'thursday-friday');
      }).toThrow('Cannot create bridge for weekend holiday');
    });

    // TDD Test 24: Leap year considerations
    it('should handle leap year Easter calculations correctly', () => {
      // 2024 is a leap year, affects Easter-dependent holidays
      const easterBridges2024 = BridgeWeekend.calculateAllBridges('BY', 2024);
      const easterBridges2025 = BridgeWeekend.calculateAllBridges('BY', 2025);

      // Should have different Easter dates and therefore different bridge opportunities
      const easterBridge2024 = easterBridges2024.find(b => b.holiday_id.includes('easter'));
      const easterBridge2025 = easterBridges2025.find(b => b.holiday_id.includes('easter'));

      if (easterBridge2024 && easterBridge2025) {
        expect(easterBridge2024.start_date).not.toBe(easterBridge2025.start_date);
      }
    });

    // TDD Test 25: Year boundary edge cases
    it('should handle bridges that cross year boundaries', () => {
      const yearEndBridge = BridgeWeekend.createMegaBridge([
        { id: 'nye-2025', date: '2025-12-31', name_de: 'Silvester' },
        { id: 'neujahr-2026', date: '2026-01-01', name_de: 'Neujahr' }
      ], 'BY');

      expect(yearEndBridge.start_date.startsWith('2025')).toBe(true);
      expect(yearEndBridge.end_date.startsWith('2026')).toBe(true);
      expect(yearEndBridge.total_days_off).toBeGreaterThan(2);
    });
  });

  describe('German Worker Optimization Integration', () => {
    // TDD Test 26: ROI calculation for German vacation context
    it('should calculate ROI based on German vacation standards', () => {
      const bridge = new BridgeWeekend({
        id: 'roi-test',
        holiday_id: 'may-day',
        state_code: 'BY',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'thursday-friday' as BridgePattern
      });

      const roi = bridge.calculateGermanVacationROI({
        annualVacationDays: 30, // German standard
        workingDaysPerWeek: 5,
        valueOfRestDay: 120 // EUR value of a rest day
      });

      expect(roi.efficiency).toBe(4.0);
      expect(roi.vacationDaysUsedPercent).toBe(1/30); // 3.33% of annual vacation
      expect(roi.totalValue).toBe(480); // 4 days * 120 EUR
      expect(roi.valuePerVacationDay).toBe(480); // 480 EUR / 1 vacation day
    });

    // TDD Test 27: Integration with German work culture
    it('should optimize for German work-life balance preferences', () => {
      const preferences = {
        preferLongWeekends: true,
        avoidSchoolHolidays: true,
        maxConsecutiveDaysOff: 10,
        preferMayBridges: true, // Germans love May bridges
        considerCommute: true
      };

      const optimizedBridges = BridgeWeekend.optimizeForGermanWorkCulture('BY', 2025, preferences);

      expect(optimizedBridges.every(bridge => bridge.total_days_off <= 10)).toBe(true);
      expect(optimizedBridges.some(bridge => bridge.start_date.includes('05'))).toBe(true); // May bridges included
      expect(optimizedBridges.every(bridge => !bridge.overlapsWithSchoolHolidays('BY'))).toBe(true);
    });
  });
});

/**
 * Additional Test Data and Helpers
 */
const PERFORMANCE_BENCHMARKS = {
  singleStateCalculation: 100, // ms
  allStatesCalculation: 500,   // ms
  memoryUsagePerState: 5,      // MB
  cacheHitRatio: 0.9          // 90% cache hits
};

const EFFICIENCY_THRESHOLDS = {
  excellent: 4.0,  // 4+ days off per vacation day
  good: 3.0,       // 3+ days off per vacation day
  acceptable: 2.0, // 2+ days off per vacation day
  poor: 1.0        // 1 day off per vacation day (not worth it)
};

// German vacation optimization constants
const GERMAN_WORK_CONSTANTS = {
  standardVacationDays: 30,
  workingDaysPerWeek: 5,
  publicHolidaysPerYear: 10, // Average across all states
  mayHolidayImportance: 1.5, // Germans especially value May bridges
  christmasSeasonImportance: 2.0 // Christmas season is most valuable
};