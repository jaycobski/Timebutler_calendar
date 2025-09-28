/**
 * Cache Integration Service - Timebutler Calendar Performance Optimization
 * Constitutional Requirement: <2s load times, handle 25k concurrent users
 *
 * Integrates Redis caching with Holiday and BridgeWeekend models:
 * - Transparent caching layer for holiday data operations
 * - Bridge weekend calculation optimization
 * - Intelligent cache warming for German market
 * - Performance monitoring and metrics
 * - Automatic fallback to database on cache miss
 * - GDPR-compliant session management
 * - Rate limiting for API protection
 */

import { getCacheManager, CacheManager, HolidayCache, BridgeWeekendCache } from '../lib/cache';
import Holiday, { HolidayData } from '../models/Holiday';
import { BridgeWeekend, BridgeWeekendData, BridgeWeekendConstraints } from '../models/bridge-weekend';
import { DateTime } from 'luxon';

// Performance metrics tracking
interface ServiceMetrics {
  cacheHits: number;
  cacheMisses: number;
  databaseFallbacks: number;
  averageResponseTime: number;
  totalRequests: number;
  errorCount: number;
  lastReset: string;
}

// German market optimization constants
const POPULAR_GERMAN_STATES = ['BY', 'NW', 'BW', 'NI', 'HE', 'BE']; // Most populous states
const SUPPORTED_YEARS = [2025, 2026];
const PEAK_TRAFFIC_MONTHS = [11, 12, 1]; // Nov, Dec, Jan - vacation planning season

/**
 * Cache Integration Service
 * Provides high-performance cached access to holiday and bridge weekend data
 */
export class CacheIntegrationService {
  private cache: CacheManager;
  private metrics: ServiceMetrics;
  private isWarmed: boolean = false;

  constructor() {
    this.cache = getCacheManager();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize service with cache warming for German market
   */
  async initialize(): Promise<void> {
    try {
      await this.cache.initialize();
      await this.warmCacheForGermanMarket();
      this.isWarmed = true;
      console.log('Cache Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Cache Integration Service:', error);
      throw error;
    }
  }

  /**
   * Holiday Data Operations with Caching
   */

  /**
   * Get holidays by state and year with intelligent caching
   */
  async getHolidaysByState(stateCode: string, year: number): Promise<Holiday[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Try cache first
      const cached = await this.cache.getHolidaysByState(stateCode, year);

      if (cached) {
        this.metrics.cacheHits++;
        this.updateResponseTime(Date.now() - startTime);
        return cached.map(h => Holiday.fromJSON(h as HolidayData));
      }

      // Cache miss - fall back to database
      this.metrics.cacheMisses++;
      this.metrics.databaseFallbacks++;

      const holidays = await Holiday.findByStateAndYear(stateCode, year);

      // Cache the result for future requests
      const cacheData: HolidayCache[] = holidays.map(h => ({
        id: h.id,
        name_de: h.name_de,
        name_en: h.name_en,
        date: h.date,
        type: h.type,
        states: [...h.states],
        is_catholic: h.is_catholic,
        is_protestant: h.is_protestant,
        region: h.region
      }));

      await this.cache.cacheHolidaysByState(stateCode, year, cacheData);

      this.updateResponseTime(Date.now() - startTime);
      return holidays;

    } catch (error) {
      this.metrics.errorCount++;
      console.error(`Error getting holidays for ${stateCode}-${year}:`, error);

      // Fallback to database even on cache errors
      try {
        return await Holiday.findByStateAndYear(stateCode, year);
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        throw new Error('Failed to retrieve holiday data');
      }
    }
  }

  /**
   * Get all holidays for a year with caching
   */
  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Try cache first
      const cached = await this.cache.getHolidaysByYear(year);

      if (cached) {
        this.metrics.cacheHits++;
        this.updateResponseTime(Date.now() - startTime);
        return cached.map(h => Holiday.fromJSON(h as HolidayData));
      }

      // Cache miss - fall back to database
      this.metrics.cacheMisses++;
      this.metrics.databaseFallbacks++;

      const holidays = await Holiday.findByYear(year);

      // Cache the result
      const cacheData: HolidayCache[] = holidays.map(h => ({
        id: h.id,
        name_de: h.name_de,
        name_en: h.name_en,
        date: h.date,
        type: h.type,
        states: [...h.states],
        is_catholic: h.is_catholic,
        is_protestant: h.is_protestant,
        region: h.region
      }));

      await this.cache.cacheHolidaysByYear(year, cacheData);

      this.updateResponseTime(Date.now() - startTime);
      return holidays;

    } catch (error) {
      this.metrics.errorCount++;
      console.error(`Error getting holidays for year ${year}:`, error);

      // Fallback to database
      try {
        return await Holiday.findByYear(year);
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        throw new Error('Failed to retrieve holiday data');
      }
    }
  }

  /**
   * Find holiday by ID with caching
   */
  async findHolidayById(id: string): Promise<Holiday | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // For individual holiday lookups, we check if it's in any cached year data
      for (const year of SUPPORTED_YEARS) {
        const cached = await this.cache.getHolidaysByYear(year);
        if (cached) {
          const holiday = cached.find(h => h.id === id);
          if (holiday) {
            this.metrics.cacheHits++;
            this.updateResponseTime(Date.now() - startTime);
            return Holiday.fromJSON(holiday as HolidayData);
          }
        }
      }

      // Not found in cache - fall back to database
      this.metrics.cacheMisses++;
      this.metrics.databaseFallbacks++;

      const holiday = await Holiday.findById(id);
      this.updateResponseTime(Date.now() - startTime);
      return holiday;

    } catch (error) {
      this.metrics.errorCount++;
      console.error(`Error finding holiday ${id}:`, error);

      // Fallback to database
      try {
        return await Holiday.findById(id);
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        return null;
      }
    }
  }

  /**
   * Bridge Weekend Operations with Caching
   */

  /**
   * Calculate bridge weekends with intelligent caching
   */
  async calculateBridgeWeekends(
    stateCode: string,
    year: number,
    constraints: BridgeWeekendConstraints
  ): Promise<BridgeWeekend[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Use maxVacationDays as cache key component
      const maxVacationDays = constraints.maxVacationDays;

      // Try cache first
      const cached = await this.cache.getBridgeWeekends(stateCode, year, maxVacationDays);

      if (cached) {
        this.metrics.cacheHits++;
        this.updateResponseTime(Date.now() - startTime);

        // Apply additional constraints not included in cache key
        return this.filterBridgeWeekendsByConstraints(
          cached.map(b => this.bridgeCacheToModel(b)),
          constraints
        );
      }

      // Cache miss - calculate bridge weekends
      this.metrics.cacheMisses++;
      this.metrics.databaseFallbacks++;

      // Get holidays for the state and year
      const holidays = await this.getHolidaysByState(stateCode, year);

      // Calculate bridge weekends (simplified implementation for example)
      const bridgeWeekends = await this.calculateBridgeWeekendsFromHolidays(
        holidays,
        stateCode,
        constraints
      );

      // Cache the basic calculation (without additional filters)
      const cacheData: BridgeWeekendCache[] = bridgeWeekends.map(b => ({
        id: b.id,
        holiday_id: b.holiday_id,
        state_code: b.state_code,
        start_date: b.start_date,
        end_date: b.end_date,
        vacation_days_needed: b.vacation_days_needed,
        total_days_off: b.total_days_off,
        efficiency: b.efficiency,
        pattern: b.pattern
      }));

      await this.cache.cacheBridgeWeekends(stateCode, year, maxVacationDays, cacheData);

      this.updateResponseTime(Date.now() - startTime);
      return this.filterBridgeWeekendsByConstraints(bridgeWeekends, constraints);

    } catch (error) {
      this.metrics.errorCount++;
      console.error(`Error calculating bridge weekends for ${stateCode}-${year}:`, error);
      throw new Error('Failed to calculate bridge weekends');
    }
  }

  /**
   * Session Management with GDPR Compliance
   */

  /**
   * Store user vacation planning session
   */
  async storeUserSession(sessionId: string, sessionData: any): Promise<void> {
    try {
      // Ensure GDPR compliance - only store necessary data with auto-expiration
      const sanitizedData = {
        preferences: sessionData.preferences,
        selections: sessionData.selections,
        timestamp: Date.now(),
        gdpr_consent: sessionData.gdpr_consent || false
      };

      await this.cache.cacheUserSession(sessionId, sanitizedData);
    } catch (error) {
      console.error('Failed to store user session:', error);
      throw new Error('Session storage failed');
    }
  }

  /**
   * Retrieve user vacation planning session
   */
  async getUserSession(sessionId: string): Promise<any | null> {
    try {
      return await this.cache.getUserSession(sessionId);
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      return null;
    }
  }

  /**
   * Rate Limiting for API Protection
   */

  /**
   * Check if user/IP can make a request
   */
  async checkRateLimit(identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const rateLimitKey = `${endpoint}:${identifier}`;

      // Different limits for different endpoints
      const limits = {
        'holidays': { limit: 100, window: 3600 }, // 100 requests per hour
        'bridges': { limit: 50, window: 3600 },   // 50 requests per hour
        'export': { limit: 10, window: 3600 }     // 10 exports per hour
      };

      const config = limits[endpoint as keyof typeof limits] || limits.holidays;

      const result = await this.cache.checkRateLimit(rateLimitKey, config.limit, config.window);

      return {
        allowed: result.allowed,
        remaining: result.remaining
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow requests if rate limiting fails
      return { allowed: true, remaining: 100 };
    }
  }

  /**
   * Cache Management Operations
   */

  /**
   * Invalidate holiday cache when data changes
   */
  async invalidateHolidayCache(stateCode?: string, year?: number): Promise<void> {
    try {
      await this.cache.invalidateHolidayCache(stateCode, year);

      // Also invalidate related bridge weekend calculations
      if (stateCode && year) {
        await this.cache.invalidateBridgeCache(stateCode, year);
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  /**
   * Pre-warm cache for peak traffic periods
   */
  async warmCacheForGermanMarket(): Promise<void> {
    try {
      console.log('Warming cache for German market...');

      // Pre-warm holiday data for popular states and years
      for (const year of SUPPORTED_YEARS) {
        for (const state of POPULAR_GERMAN_STATES) {
          try {
            await this.getHolidaysByState(state, year);
          } catch (error) {
            console.warn(`Failed to warm cache for ${state}-${year}:`, error);
          }
        }
      }

      // Pre-warm bridge calculations for common vacation day budgets
      const commonVacationDays = [5, 10, 15, 20];

      for (const year of SUPPORTED_YEARS) {
        for (const state of POPULAR_GERMAN_STATES.slice(0, 3)) { // Top 3 states only
          for (const maxDays of commonVacationDays) {
            try {
              await this.calculateBridgeWeekends(state, year, {
                maxVacationDays: maxDays,
                preferLongWeekends: true
              });
            } catch (error) {
              console.warn(`Failed to warm bridge cache for ${state}-${year}-${maxDays}:`, error);
            }
          }
        }
      }

      console.log('Cache warming completed for German market');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  /**
   * Get service performance metrics
   */
  getMetrics(): ServiceMetrics & { cacheMetrics: any } {
    const cacheMetrics = this.cache.getMetrics();

    return {
      ...this.metrics,
      cacheMetrics
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    service: { isHealthy: boolean; uptime: number };
    cache: any;
    metrics: ServiceMetrics;
  }> {
    const cacheHealth = await this.cache.getHealthStatus();

    return {
      service: {
        isHealthy: this.isWarmed && cacheHealth.isHealthy,
        uptime: Date.now() - new Date(this.metrics.lastReset).getTime()
      },
      cache: cacheHealth,
      metrics: this.metrics
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.cache.shutdown();
      console.log('Cache Integration Service shutdown completed');
    } catch (error) {
      console.error('Service shutdown error:', error);
    }
  }

  /**
   * Private Helper Methods
   */

  private bridgeCacheToModel(cache: BridgeWeekendCache): BridgeWeekend {
    return new BridgeWeekend({
      id: cache.id,
      holiday_id: cache.holiday_id,
      state_code: cache.state_code,
      start_date: cache.start_date,
      end_date: cache.end_date,
      vacation_days_needed: cache.vacation_days_needed,
      total_days_off: cache.total_days_off,
      efficiency: cache.efficiency,
      pattern: cache.pattern as any
    });
  }

  private filterBridgeWeekendsByConstraints(
    bridges: BridgeWeekend[],
    constraints: BridgeWeekendConstraints
  ): BridgeWeekend[] {
    return bridges.filter(bridge => {
      // Apply additional constraints not included in cache key
      if (constraints.minimum_efficiency && bridge.efficiency < constraints.minimum_efficiency) {
        return false;
      }

      if (constraints.maxConsecutiveDaysOff && bridge.total_days_off > constraints.maxConsecutiveDaysOff) {
        return false;
      }

      if (constraints.preferLongWeekends && bridge.total_days_off < 4) {
        return false;
      }

      // Check if it conflicts with school holidays
      if (constraints.avoidSchoolHolidays) {
        const bridgeStart = DateTime.fromISO(bridge.start_date);
        const bridgeEnd = DateTime.fromISO(bridge.end_date);

        // Simple check for Bavarian school holidays (could be expanded)
        const isInSchoolHolidays = (bridgeStart.month >= 7 && bridgeStart.month <= 8) ||
                                   (bridgeStart.month === 12);

        if (isInSchoolHolidays) {
          return false;
        }
      }

      return true;
    });
  }

  private async calculateBridgeWeekendsFromHolidays(
    holidays: Holiday[],
    stateCode: string,
    constraints: BridgeWeekendConstraints
  ): Promise<BridgeWeekend[]> {
    // Simplified bridge weekend calculation
    // In production, this would use the full BridgeCalculatorService
    const bridges: BridgeWeekend[] = [];

    for (const holiday of holidays) {
      const holidayDate = DateTime.fromISO(holiday.date);
      const weekday = holidayDate.weekday; // 1=Monday, 7=Sunday

      // Example: Thursday holiday -> add Friday for 4-day weekend
      if (weekday === 4 && constraints.maxVacationDays >= 1) {
        const bridge = new BridgeWeekend({
          id: `bridge-${holiday.id}`,
          holiday_id: holiday.id,
          state_code: stateCode,
          start_date: holiday.date,
          end_date: holidayDate.plus({ days: 3 }).toFormat('yyyy-MM-dd'),
          vacation_days_needed: 1,
          total_days_off: 4,
          efficiency: 4.0,
          pattern: 'thursday-friday'
        });
        bridges.push(bridge);
      }

      // Example: Tuesday holiday -> add Monday for 4-day weekend
      if (weekday === 2 && constraints.maxVacationDays >= 1) {
        const bridge = new BridgeWeekend({
          id: `bridge-${holiday.id}-monday`,
          holiday_id: holiday.id,
          state_code: stateCode,
          start_date: holidayDate.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
          end_date: holidayDate.plus({ days: 2 }).toFormat('yyyy-MM-dd'),
          vacation_days_needed: 1,
          total_days_off: 4,
          efficiency: 4.0,
          pattern: 'monday-tuesday'
        });
        bridges.push(bridge);
      }
    }

    return bridges.sort((a, b) => b.efficiency - a.efficiency);
  }

  private initializeMetrics(): ServiceMetrics {
    return {
      cacheHits: 0,
      cacheMisses: 0,
      databaseFallbacks: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      errorCount: 0,
      lastReset: new Date().toISOString()
    };
  }

  private updateResponseTime(responseTime: number): void {
    if (this.metrics.totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
        this.metrics.totalRequests;
    }
  }
}

/**
 * Global service instance for application-wide use
 */
let globalCacheIntegrationService: CacheIntegrationService | null = null;

/**
 * Get or create global cache integration service
 */
export function getCacheIntegrationService(): CacheIntegrationService {
  if (!globalCacheIntegrationService) {
    globalCacheIntegrationService = new CacheIntegrationService();
  }
  return globalCacheIntegrationService;
}

/**
 * Initialize global cache integration service
 */
export async function initializeCacheIntegrationService(): Promise<CacheIntegrationService> {
  const service = getCacheIntegrationService();
  await service.initialize();
  return service;
}

/**
 * Shutdown global cache integration service
 */
export async function shutdownCacheIntegrationService(): Promise<void> {
  if (globalCacheIntegrationService) {
    await globalCacheIntegrationService.shutdown();
    globalCacheIntegrationService = null;
  }
}

export default CacheIntegrationService;