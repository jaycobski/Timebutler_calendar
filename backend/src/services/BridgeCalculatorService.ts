/**
 * BridgeCalculatorService - German Holiday Bridge Weekend Optimization Engine
 * Task T028: Implementation of bridge weekend calculation algorithms with <100ms performance
 *
 * Constitutional Requirements:
 * - <100ms response time for bridge calculations
 * - Mathematical precision: efficiency = total_days_off / vacation_days_needed
 * - German holiday optimization patterns (May cluster, Christmas mega-bridge)
 * - Support for all 16 German Bundesländer
 * - Handle Catholic/Protestant regional variations
 * - Edge case handling (overlapping holidays, weekends, year boundaries)
 * - Caching and memoization for performance optimization
 * - Support vacation budget constraints (1-5 days, 6-10 days, 11+ days)
 *
 * German Optimization Patterns:
 * - May Holiday Cluster: May 1, Ascension Day, Pentecost optimization
 * - Christmas/New Year Mega-Bridge: up to 16 days off with 4-5 vacation days
 * - Catholic State Advantages: Corpus Christi, Epiphany, All Saints' Day
 * - Single-day Bridges: Thursday/Friday, Monday/Tuesday patterns
 * - Sandwich Bridges: Wednesday holidays with strategic vacation days
 * - Extended Weekend Patterns: Friday holidays extending weekends
 */

import { DateTime } from 'luxon';
import Redis from 'ioredis';
import { Holiday } from '../models/Holiday';
import { BridgeWeekend, BridgeWeekendData, BridgePattern, BridgeWeekendConstraints } from '../models/bridge-weekend';
import { State } from '../models/State';
import { HolidayService } from './HolidayService';
import { getEnvConfig } from '../config/env';

// Performance optimization interfaces
interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxItems: number;
}

interface PerformanceMetrics {
  calculations: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  lastCalculationTime: number;
  totalResponseTime: number;
}

interface BridgeCalculationOptions {
  maxVacationDays?: number;
  efficiencyThreshold?: number;
  includeReligiousHolidays?: boolean;
  preferLongWeekends?: boolean;
  avoidSchoolHolidays?: boolean;
  includeRegionalHolidays?: boolean;
  performanceTargetMs?: number;
  enableCaching?: boolean;
}

interface OptimalBridgeSelection {
  selectedBridges: BridgeWeekend[];
  totalVacationUsed: number;
  totalDaysOff: number;
  averageEfficiency: number;
  optimizationScore: number;
  unusedVacationDays: number;
  recommendations: string[];
}

interface VacationBudgetStrategy {
  low: { min: 1, max: 5 };      // Conservative strategy
  medium: { min: 6, max: 10 };  // Balanced strategy
  high: { min: 11, max: 20 };   // Aggressive strategy
}

interface GermanOptimizationPattern {
  name: string;
  description_de: string;
  description_en: string;
  holidays: string[];
  minEfficiency: number;
  maxVacationDays: number;
  pattern: BridgePattern;
  states?: string[];
}

// German-specific optimization patterns
const GERMAN_OPTIMIZATION_PATTERNS: GermanOptimizationPattern[] = [
  {
    name: 'may_cluster',
    description_de: 'Mai-Cluster: Deutschlands wertvollste Urlaubszeit',
    description_en: 'May Cluster: Germany\'s most valuable vacation period',
    holidays: ['tag-der-arbeit', 'christi-himmelfahrt', 'pfingstmontag'],
    minEfficiency: 3.5,
    maxVacationDays: 4,
    pattern: 'sandwich',
    states: undefined // All states
  },
  {
    name: 'christmas_mega_bridge',
    description_de: 'Weihnachts-Mega-Brücke: 16 Tage frei mit nur 4-5 Urlaubstagen',
    description_en: 'Christmas Mega-Bridge: 16 days off with only 4-5 vacation days',
    holidays: ['weihnachtstag', 'zweiter-weihnachtstag', 'neujahr'],
    minEfficiency: 4.0,
    maxVacationDays: 5,
    pattern: 'extend-weekend',
    states: undefined // All states
  },
  {
    name: 'catholic_advantage',
    description_de: 'Katholische Feiertage: Zusätzliche Brückentage-Gelegenheiten',
    description_en: 'Catholic Holidays: Additional bridge weekend opportunities',
    holidays: ['fronleichnam', 'heilige-drei-koenige', 'allerheiligen'],
    minEfficiency: 3.0,
    maxVacationDays: 2,
    pattern: 'thursday-friday',
    states: ['BW', 'BY', 'NW', 'RP', 'SL'] // Catholic-majority states
  },
  {
    name: 'easter_cluster',
    description_de: 'Oster-Wochenende: Natürlich langes Wochenende ohne Urlaubstage',
    description_en: 'Easter Weekend: Natural long weekend without vacation days',
    holidays: ['karfreitag', 'ostermontag'],
    minEfficiency: Infinity,
    maxVacationDays: 0,
    pattern: 'extend-weekend',
    states: undefined // All states
  }
];

// Cache key patterns for performance optimization
const CACHE_KEYS = {
  BRIDGES_BY_STATE: (state: string, year: number) => `bridges:${state}:${year}`,
  OPTIMAL_SELECTION: (state: string, year: number, constraints: string) => `optimal:${state}:${year}:${constraints}`,
  MAY_CLUSTER: (state: string, year: number) => `may_cluster:${state}:${year}`,
  CHRISTMAS_BRIDGE: (state: string, year: number) => `christmas:${state}:${year}`,
  CATHOLIC_BRIDGES: (state: string, year: number) => `catholic:${state}:${year}`,
  PERFORMANCE_CACHE: 'performance:cache'
} as const;

/**
 * BridgeCalculatorService - High-performance German bridge weekend calculation engine
 *
 * Features:
 * - Sub-100ms bridge calculations for any German state
 * - Advanced German holiday optimization patterns
 * - Mathematical precision in efficiency calculations
 * - Comprehensive caching and memoization
 * - Support for vacation budget constraints
 * - Catholic/Protestant regional optimization
 * - Edge case handling for all scenarios
 */
export class BridgeCalculatorService {
  private readonly holidayService: HolidayService;
  private readonly redis: Redis;
  private readonly cacheConfig: CacheConfig;
  private readonly metrics: PerformanceMetrics;

  // In-memory cache for ultra-fast lookups (<1ms)
  private readonly memoryCache = new Map<string, { data: any; expires: number; accessCount: number }>();
  private readonly maxMemoryItems = 1000;

  // Pre-computed optimization patterns cache
  private readonly patternCache = new Map<string, BridgeWeekend[]>();

  constructor(holidayService?: HolidayService, redis?: Redis) {
    const env = getEnvConfig();

    this.holidayService = holidayService || new HolidayService(redis);
    this.redis = redis || new Redis(env.REDIS_URL);

    this.cacheConfig = {
      enabled: true,
      ttl: env.CACHE_TTL_BRIDGES,
      maxItems: 10000
    };

    this.metrics = {
      calculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      lastCalculationTime: 0,
      totalResponseTime: 0
    };

    this.preComputeCommonPatterns();
  }

  /**
   * Calculate all possible bridge weekends for a German state and year
   * Primary service method with <100ms performance guarantee
   */
  public async calculateBridgeWeekends(
    stateCode: string,
    year: number,
    options: BridgeCalculationOptions = {}
  ): Promise<BridgeWeekend[]> {
    const startTime = performance.now();
    this.metrics.calculations++;

    try {
      // Validate inputs
      this.validateInputs(stateCode, year);

      // Set default options
      const opts = this.setDefaultOptions(options);

      // Check cache first for performance
      const cacheKey = this.generateCacheKey(stateCode, year, opts);
      const cachedResult = await this.getFromCache(cacheKey);

      if (cachedResult) {
        this.metrics.cacheHits++;
        this.updatePerformanceMetrics(startTime);
        return cachedResult;
      }

      this.metrics.cacheMisses++;

      // Get holidays for the state and year
      const holidays = await this.holidayService.getHolidaysByState(stateCode, year, 'de');

      // Calculate all bridge opportunities using optimized algorithms
      const bridges = await this.calculateAllBridgeOpportunities(holidays, stateCode, year, opts);

      // Apply German-specific optimization patterns
      const optimizedBridges = this.applyGermanOptimizationPatterns(bridges, stateCode, year);

      // Filter and rank by constraints
      const filteredBridges = this.applyConstraints(optimizedBridges, opts);

      // Sort by efficiency (highest first)
      const rankedBridges = this.rankByEfficiency(filteredBridges);

      // Cache the results for performance
      await this.setCache(cacheKey, rankedBridges);

      // Validate performance requirement (<100ms)
      const duration = performance.now() - startTime;
      this.validatePerformance(duration, opts.performanceTargetMs || 100);

      this.updatePerformanceMetrics(startTime);

      return rankedBridges;

    } catch (error) {
      console.error('Error in calculateBridgeWeekends:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal bridge selection based on vacation budget constraints
   * Implements mathematical optimization for maximum vacation ROI
   */
  public async calculateOptimalBridges(
    stateCode: string,
    year: number,
    vacationBudget: number,
    constraints: BridgeWeekendConstraints = { maxVacationDays: vacationBudget }
  ): Promise<OptimalBridgeSelection> {
    const startTime = performance.now();

    try {
      // Get all available bridges
      const allBridges = await this.calculateBridgeWeekends(stateCode, year, {
        maxVacationDays: vacationBudget,
        efficiencyThreshold: constraints.minimum_efficiency || 2.0
      });

      // Apply optimization algorithm based on strategy
      const optimizedSelection = this.optimizeBridgeSelection(allBridges, vacationBudget, constraints);

      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(
        optimizedSelection,
        allBridges,
        vacationBudget,
        stateCode,
        year
      );

      const duration = performance.now() - startTime;
      this.validatePerformance(duration, 100);

      return {
        ...optimizedSelection,
        recommendations
      };

    } catch (error) {
      console.error('Error in calculateOptimalBridges:', error);
      throw error;
    }
  }

  /**
   * German May holiday cluster optimization - the "vacation gold mine"
   * Combines May Day, Ascension Day, and Pentecost for maximum efficiency
   */
  public async calculateMayCluster(stateCode: string, year: number): Promise<BridgeWeekend[]> {
    const cacheKey = CACHE_KEYS.MAY_CLUSTER(stateCode, year);
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      const holidays = await this.holidayService.getHolidaysByState(stateCode, year, 'de');

      // Find May-related holidays
      const mayHolidays = holidays.filter(h => {
        const holidayDate = DateTime.fromISO(h.date, { zone: 'Europe/Berlin' });
        return (
          h.id.includes('tag-der-arbeit') ||     // May 1st
          h.id.includes('christi-himmelfahrt') || // Ascension Day (39 days after Easter)
          h.id.includes('pfingstmontag')          // Whit Monday (50 days after Easter)
        );
      });

      if (mayHolidays.length === 0) {
        return [];
      }

      // Calculate optimal May cluster bridges
      const mayBridges: BridgeWeekend[] = [];

      // Strategy 1: Individual bridges for each holiday
      for (const holiday of mayHolidays) {
        const individualBridges = await this.calculateHolidayBridges(holiday, stateCode, year);
        mayBridges.push(...individualBridges);
      }

      // Strategy 2: Combined mega-bridge if holidays are close together
      const combinedBridge = this.calculateMayMegaBridge(mayHolidays, stateCode, year);
      if (combinedBridge && combinedBridge.efficiency >= 3.5) {
        mayBridges.push(combinedBridge);
      }

      // Sort by efficiency and limit to top options
      const optimizedMayBridges = mayBridges
        .filter(bridge => bridge.efficiency >= 2.5) // Higher threshold for May
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5); // Top 5 May opportunities

      await this.setCache(cacheKey, optimizedMayBridges);
      return optimizedMayBridges;

    } catch (error) {
      console.error('Error calculating May cluster:', error);
      return [];
    }
  }

  /**
   * Calculate Christmas/New Year mega-bridge - up to 16 days off
   * Optimizes the year-end holiday period for maximum vacation ROI
   */
  public async calculateChristmasCluster(stateCode: string, year: number): Promise<BridgeWeekend[]> {
    const cacheKey = CACHE_KEYS.CHRISTMAS_BRIDGE(stateCode, year);
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      const holidays = await this.holidayService.getHolidaysByState(stateCode, year, 'de');

      // Find Christmas and New Year holidays
      const christmasHolidays = holidays.filter(h =>
        h.id.includes('weihnachtstag') || // Christmas Day & Boxing Day
        h.id.includes(`neujahr-${year + 1}`) // New Year's Day (next year)
      );

      if (christmasHolidays.length === 0) {
        return [];
      }

      // Calculate the mega-bridge spanning year boundary
      const megaBridge = this.calculateChristmasMegaBridge(christmasHolidays, stateCode, year);
      const christmasBridges: BridgeWeekend[] = [];

      if (megaBridge) {
        christmasBridges.push(megaBridge);
      }

      // Also calculate individual Christmas week bridges
      for (const holiday of christmasHolidays) {
        const individualBridges = await this.calculateHolidayBridges(holiday, stateCode, year);
        christmasBridges.push(...individualBridges.filter(b => b.efficiency >= 3.0));
      }

      // Sort by total days off (prioritize longer breaks)
      const optimizedChristmasBridges = christmasBridges
        .sort((a, b) => b.total_days_off - a.total_days_off)
        .slice(0, 3); // Top 3 Christmas opportunities

      await this.setCache(cacheKey, optimizedChristmasBridges);
      return optimizedChristmasBridges;

    } catch (error) {
      console.error('Error calculating Christmas cluster:', error);
      return [];
    }
  }

  /**
   * Rank bridges by efficiency with German optimization preferences
   * Implements sophisticated sorting algorithm with multiple criteria
   */
  public rankByEfficiency(bridges: BridgeWeekend[]): BridgeWeekend[] {
    return bridges.sort((a, b) => {
      // Primary sort: Efficiency (handle infinity values)
      if (a.efficiency === Infinity && b.efficiency === Infinity) {
        return b.total_days_off - a.total_days_off; // More days off wins
      }
      if (a.efficiency === Infinity) return -1;
      if (b.efficiency === Infinity) return 1;

      const efficiencyDiff = b.efficiency - a.efficiency;
      if (Math.abs(efficiencyDiff) > 0.1) { // Significant efficiency difference
        return efficiencyDiff;
      }

      // Secondary sort: Total days off (for similar efficiency)
      const daysDiff = b.total_days_off - a.total_days_off;
      if (daysDiff !== 0) {
        return daysDiff;
      }

      // Tertiary sort: Fewer vacation days needed (more budget-friendly)
      return a.vacation_days_needed - b.vacation_days_needed;
    });
  }

  /**
   * Apply vacation budget and preference constraints
   */
  public filterByConstraints(
    bridges: BridgeWeekend[],
    constraints: BridgeWeekendConstraints
  ): BridgeWeekend[] {
    return bridges.filter(bridge => {
      // Maximum vacation days constraint
      if (bridge.vacation_days_needed > constraints.maxVacationDays) {
        return false;
      }

      // Maximum consecutive days off constraint
      if (constraints.maxConsecutiveDaysOff && bridge.total_days_off > constraints.maxConsecutiveDaysOff) {
        return false;
      }

      // Minimum efficiency threshold
      const minEfficiency = constraints.minimum_efficiency || 2.0;
      if (bridge.efficiency < minEfficiency) {
        return false;
      }

      // Prefer long weekends filter
      if (constraints.preferLongWeekends && bridge.total_days_off < 3) {
        return false;
      }

      // School holiday avoidance
      if (constraints.avoidSchoolHolidays && bridge.overlapsWithSchoolHolidays(bridge.state_code)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get service performance metrics for monitoring
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    Object.assign(this.metrics, {
      calculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      lastCalculationTime: 0,
      totalResponseTime: 0
    });
  }

  /**
   * Close connections and cleanup resources
   */
  public async close(): Promise<void> {
    this.memoryCache.clear();
    this.patternCache.clear();
    await this.redis.quit();
    await this.holidayService.close();
  }

  // Private implementation methods

  private validateInputs(stateCode: string, year: number): void {
    if (!stateCode || typeof stateCode !== 'string') {
      throw new Error('Invalid state code: must be a non-empty string');
    }

    const validCode = stateCode.toUpperCase();
    if (!/^[A-Z]{2}$/.test(validCode)) {
      throw new Error('Invalid state code: must be exactly 2 uppercase letters');
    }

    State.validateStateCode(validCode);

    if (year < 2025 || year > 2026) {
      throw new Error('Year must be within range 2025-2026');
    }
  }

  private setDefaultOptions(options: BridgeCalculationOptions): BridgeCalculationOptions {
    return {
      maxVacationDays: 10,
      efficiencyThreshold: 2.0,
      includeReligiousHolidays: true,
      preferLongWeekends: true,
      avoidSchoolHolidays: false,
      includeRegionalHolidays: false,
      performanceTargetMs: 100,
      enableCaching: true,
      ...options
    };
  }

  private generateCacheKey(stateCode: string, year: number, options: BridgeCalculationOptions): string {
    const optionsHash = Buffer.from(JSON.stringify(options)).toString('base64').slice(0, 10);
    return CACHE_KEYS.BRIDGES_BY_STATE(stateCode, year) + `:${optionsHash}`;
  }

  private async calculateAllBridgeOpportunities(
    holidays: Holiday[],
    stateCode: string,
    year: number,
    options: BridgeCalculationOptions
  ): Promise<BridgeWeekend[]> {
    const bridges: BridgeWeekend[] = [];

    for (const holiday of holidays) {
      // Skip holidays that don't qualify
      if (!this.isHolidayEligibleForBridge(holiday, options)) {
        continue;
      }

      // Calculate all possible bridge patterns for this holiday
      const holidayBridges = await this.calculateHolidayBridges(holiday, stateCode, year);
      bridges.push(...holidayBridges);
    }

    // Remove duplicates and overlapping bridges
    return this.deduplicateBridges(bridges);
  }

  private isHolidayEligibleForBridge(holiday: Holiday, options: BridgeCalculationOptions): boolean {
    const holidayDate = DateTime.fromISO(holiday.date, { zone: 'Europe/Berlin' });

    // Skip weekend holidays (no bridge possible)
    if (holidayDate.weekday >= 6) {
      return false;
    }

    // Skip religious holidays if not included
    if (!options.includeReligiousHolidays && (holiday.is_catholic || holiday.is_protestant)) {
      return false;
    }

    return true;
  }

  private async calculateHolidayBridges(holiday: Holiday, stateCode: string, year: number): Promise<BridgeWeekend[]> {
    const holidayDate = DateTime.fromISO(holiday.date, { zone: 'Europe/Berlin' });
    const bridges: BridgeWeekend[] = [];

    try {
      // Determine applicable bridge patterns based on weekday
      const patterns = this.getApplicableBridgePatterns(holidayDate.weekday);

      for (const pattern of patterns) {
        try {
          const bridge = BridgeWeekend.createFromHoliday(holiday, stateCode, pattern);

          // Only include bridges with reasonable efficiency
          if (bridge.efficiency >= 2.0) {
            bridges.push(bridge);
          }
        } catch (error) {
          // Skip invalid bridge patterns
          continue;
        }
      }
    } catch (error) {
      console.warn(`Error calculating bridges for holiday ${holiday.id}:`, error);
    }

    return bridges;
  }

  private getApplicableBridgePatterns(weekday: number): BridgePattern[] {
    const patterns: BridgePattern[] = [];

    switch (weekday) {
      case 1: // Monday
        patterns.push('monday-tuesday');
        break;
      case 2: // Tuesday
        patterns.push('tuesday-friday');
        break;
      case 3: // Wednesday
        patterns.push('sandwich');
        break;
      case 4: // Thursday
        patterns.push('thursday-friday');
        break;
      case 5: // Friday
        patterns.push('extend-weekend');
        break;
      default:
        // Weekend holidays - no patterns applicable
        break;
    }

    return patterns;
  }

  private applyGermanOptimizationPatterns(
    bridges: BridgeWeekend[],
    stateCode: string,
    year: number
  ): BridgeWeekend[] {
    const optimizedBridges = [...bridges];

    // Apply each German optimization pattern
    for (const pattern of GERMAN_OPTIMIZATION_PATTERNS) {
      // Check if pattern applies to this state
      if (pattern.states && !pattern.states.includes(stateCode)) {
        continue;
      }

      // Find bridges that match this pattern
      const patternBridges = bridges.filter(bridge =>
        pattern.holidays.some(holidayKey => bridge.holiday_id.includes(holidayKey))
      );

      if (patternBridges.length > 0) {
        // Apply pattern-specific optimizations
        const optimizedPatternBridges = this.optimizeByPattern(patternBridges, pattern);

        // Replace or add optimized bridges
        optimizedBridges.push(...optimizedPatternBridges);
      }
    }

    return this.deduplicateBridges(optimizedBridges);
  }

  private optimizeByPattern(bridges: BridgeWeekend[], pattern: GermanOptimizationPattern): BridgeWeekend[] {
    // Apply pattern-specific optimization logic
    switch (pattern.name) {
      case 'may_cluster':
        return this.optimizeMayClusterBridges(bridges);
      case 'christmas_mega_bridge':
        return this.optimizeChristmasBridges(bridges);
      case 'catholic_advantage':
        return this.optimizeCatholicBridges(bridges);
      default:
        return bridges;
    }
  }

  private optimizeMayClusterBridges(bridges: BridgeWeekend[]): BridgeWeekend[] {
    // Sort May bridges by efficiency and proximity
    return bridges
      .filter(bridge => bridge.efficiency >= 3.0) // Higher threshold for May
      .sort((a, b) => {
        const efficiencyDiff = b.efficiency - a.efficiency;
        if (Math.abs(efficiencyDiff) > 0.2) {
          return efficiencyDiff;
        }
        // Prefer bridges that create longer continuous periods
        return b.total_days_off - a.total_days_off;
      });
  }

  private optimizeChristmasBridges(bridges: BridgeWeekend[]): BridgeWeekend[] {
    // Prioritize mega-bridges that span year boundary
    return bridges.sort((a, b) => {
      // Prioritize year-spanning bridges
      const aSpansYear = a.start_date.slice(0, 4) !== a.end_date.slice(0, 4);
      const bSpansYear = b.start_date.slice(0, 4) !== b.end_date.slice(0, 4);

      if (aSpansYear && !bSpansYear) return -1;
      if (!aSpansYear && bSpansYear) return 1;

      // Then by total days off
      return b.total_days_off - a.total_days_off;
    });
  }

  private optimizeCatholicBridges(bridges: BridgeWeekend[]): BridgeWeekend[] {
    // Prioritize Catholic holidays that provide unique opportunities
    return bridges.filter(bridge => bridge.efficiency >= 2.5);
  }

  private calculateMayMegaBridge(holidays: Holiday[], stateCode: string, year: number): BridgeWeekend | null {
    if (holidays.length < 2) return null;

    try {
      // Sort holidays by date
      const sortedHolidays = holidays.sort((a, b) => a.date.localeCompare(b.date));

      // Check if holidays are within reasonable range for mega-bridge
      const firstDate = DateTime.fromISO(sortedHolidays[0].date);
      const lastDate = DateTime.fromISO(sortedHolidays[sortedHolidays.length - 1].date);
      const daysBetween = lastDate.diff(firstDate, 'days').days;

      if (daysBetween > 40) { // Too far apart
        return null;
      }

      return BridgeWeekend.createMegaBridge(sortedHolidays, stateCode);
    } catch (error) {
      console.warn('Error creating May mega-bridge:', error);
      return null;
    }
  }

  private calculateChristmasMegaBridge(holidays: Holiday[], stateCode: string, year: number): BridgeWeekend | null {
    try {
      // Create mega-bridge spanning Christmas and New Year
      return BridgeWeekend.createMegaBridge(holidays, stateCode);
    } catch (error) {
      console.warn('Error creating Christmas mega-bridge:', error);
      return null;
    }
  }

  private applyConstraints(bridges: BridgeWeekend[], options: BridgeCalculationOptions): BridgeWeekend[] {
    return bridges.filter(bridge => {
      // Max vacation days constraint
      if (bridge.vacation_days_needed > (options.maxVacationDays || 10)) {
        return false;
      }

      // Efficiency threshold
      if (bridge.efficiency < (options.efficiencyThreshold || 2.0)) {
        return false;
      }

      // Long weekend preference
      if (options.preferLongWeekends && bridge.total_days_off < 3) {
        return false;
      }

      return true;
    });
  }

  private optimizeBridgeSelection(
    bridges: BridgeWeekend[],
    budget: number,
    constraints: BridgeWeekendConstraints
  ): OptimalBridgeSelection {
    // Greedy algorithm optimization for vacation budget
    const selected: BridgeWeekend[] = [];
    let remainingBudget = budget;

    // Sort by efficiency first
    const sortedBridges = this.rankByEfficiency([...bridges]);

    for (const bridge of sortedBridges) {
      if (bridge.vacation_days_needed <= remainingBudget) {
        // Check for overlaps with already selected bridges
        if (!this.hasOverlapWithSelected(bridge, selected)) {
          selected.push(bridge);
          remainingBudget -= bridge.vacation_days_needed;
        }
      }
    }

    const totalDaysOff = selected.reduce((sum, bridge) => sum + bridge.total_days_off, 0);
    const totalVacationUsed = selected.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0);
    const averageEfficiency = selected.length > 0
      ? selected.reduce((sum, bridge) => sum + bridge.efficiency, 0) / selected.length
      : 0;

    return {
      selectedBridges: selected,
      totalVacationUsed,
      totalDaysOff,
      averageEfficiency,
      optimizationScore: this.calculateOptimizationScore(selected, budget),
      unusedVacationDays: budget - totalVacationUsed,
      recommendations: []
    };
  }

  private hasOverlapWithSelected(bridge: BridgeWeekend, selected: BridgeWeekend[]): boolean {
    const bridgeStart = DateTime.fromISO(bridge.start_date);
    const bridgeEnd = DateTime.fromISO(bridge.end_date);

    return selected.some(selectedBridge => {
      const selectedStart = DateTime.fromISO(selectedBridge.start_date);
      const selectedEnd = DateTime.fromISO(selectedBridge.end_date);

      return (bridgeStart <= selectedEnd && bridgeEnd >= selectedStart);
    });
  }

  private calculateOptimizationScore(bridges: BridgeWeekend[], budget: number): number {
    if (bridges.length === 0) return 0;

    const totalDaysOff = bridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0);
    const totalVacationUsed = bridges.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0);
    const budgetUtilization = totalVacationUsed / budget;
    const averageEfficiency = bridges.reduce((sum, bridge) => sum + bridge.efficiency, 0) / bridges.length;

    // Weighted score considering efficiency, budget utilization, and total value
    return (averageEfficiency * 0.4) + (budgetUtilization * 0.3) + (totalDaysOff / budget * 0.3);
  }

  private generateOptimizationRecommendations(
    selection: OptimalBridgeSelection,
    allBridges: BridgeWeekend[],
    budget: number,
    stateCode: string,
    year: number
  ): string[] {
    const recommendations: string[] = [];

    if (selection.unusedVacationDays > 0) {
      recommendations.push(`Sie haben noch ${selection.unusedVacationDays} ungenutzte Urlaubstage - erwägen Sie weitere Brückentage.`);
    }

    if (selection.averageEfficiency < 3.0) {
      recommendations.push('Niedrige Effizienz - prüfen Sie alternative Jahre oder längere Brückentage.');
    }

    // Check for Catholic state advantages
    const state = State.findByCode(stateCode);
    if (state.is_catholic_majority) {
      recommendations.push('Als katholisches Bundesland haben Sie zusätzliche Brückentage-Möglichkeiten.');
    }

    return recommendations;
  }

  private deduplicateBridges(bridges: BridgeWeekend[]): BridgeWeekend[] {
    const uniqueBridges = new Map<string, BridgeWeekend>();

    bridges.forEach(bridge => {
      const key = `${bridge.start_date}-${bridge.end_date}-${bridge.pattern}`;
      const existing = uniqueBridges.get(key);

      if (!existing || bridge.efficiency > existing.efficiency) {
        uniqueBridges.set(key, bridge);
      }
    });

    return Array.from(uniqueBridges.values());
  }

  private validatePerformance(duration: number, targetMs: number): void {
    if (duration > targetMs) {
      console.warn(`Performance warning: Bridge calculation took ${duration.toFixed(2)}ms, target was ${targetMs}ms`);

      // Implement performance degradation strategies
      if (duration > targetMs * 2) {
        console.error(`Performance critical: Bridge calculation exceeded 2x target (${duration.toFixed(2)}ms)`);
      }
    }
  }

  private updatePerformanceMetrics(startTime: number): void {
    const duration = performance.now() - startTime;
    this.metrics.lastCalculationTime = duration;
    this.metrics.totalResponseTime += duration;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.calculations;
  }

  private async preComputeCommonPatterns(): Promise<void> {
    // Pre-compute common German bridge patterns for performance
    // This runs asynchronously during service initialization

    try {
      const commonStates = ['BY', 'BW', 'NW', 'HE']; // Most populous states
      const years = [2025, 2026];

      for (const state of commonStates) {
        for (const year of years) {
          // Pre-compute May clusters
          const mayClusterKey = CACHE_KEYS.MAY_CLUSTER(state, year);
          if (!await this.getFromCache(mayClusterKey)) {
            await this.calculateMayCluster(state, year);
          }
        }
      }
    } catch (error) {
      console.warn('Error pre-computing patterns:', error);
    }
  }

  // Cache management methods

  private async getFromCache(key: string): Promise<any> {
    try {
      // Try memory cache first (fastest)
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && memoryItem.expires > Date.now()) {
        memoryItem.accessCount++;
        return memoryItem.data;
      }

      // Try Redis cache
      if (this.cacheConfig.enabled) {
        const cached = await this.redis.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          this.setMemoryCache(key, data);
          return data;
        }
      }

      return null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any): Promise<void> {
    try {
      // Set memory cache
      this.setMemoryCache(key, data);

      // Set Redis cache
      if (this.cacheConfig.enabled) {
        await this.redis.setex(key, this.cacheConfig.ttl, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  private setMemoryCache(key: string, data: any): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryItems) {
      // Find least recently used item
      let lruKey = '';
      let minAccessCount = Infinity;

      for (const [k, v] of this.memoryCache) {
        if (v.accessCount < minAccessCount) {
          minAccessCount = v.accessCount;
          lruKey = k;
        }
      }

      if (lruKey) {
        this.memoryCache.delete(lruKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (this.cacheConfig.ttl * 1000),
      accessCount: 1
    });
  }
}

export default BridgeCalculatorService;