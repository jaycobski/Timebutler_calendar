/**
 * HolidayService - German Government API Integration
 * Task T027: German holiday data service with government API integration
 *
 * Constitutional Requirements:
 * - 100% accurate German holiday data for all 16 Bundesländer
 * - <100ms response times with caching
 * - 30-day TTL caching
 * - Fallback data for API failures
 * - Bilingual support (German/English)
 * - Integration with existing Holiday and State models
 *
 * Features:
 * - Federal and state holiday support
 * - Catholic/Protestant regional variations
 * - Easter-dependent holiday calculations
 * - Redis caching with performance optimization
 * - Comprehensive error handling and fallbacks
 * - Government API integration (feiertage-api.de)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Redis from 'ioredis';
import { DateTime } from 'luxon';
import { Holiday, HolidayData } from '../models/Holiday';
import { State } from '../models/State';
import { getEnvConfig } from '../config/env';

// Types for external API responses
interface ApiHolidayResponse {
  [key: string]: {
    datum: string;
    hinweis?: string;
  };
}

interface GermanHolidayApiResponse {
  [state: string]: ApiHolidayResponse;
}

// Service configuration interface
interface HolidayServiceConfig {
  apiUrl: string;
  apiKey?: string;
  cacheEnabled: boolean;
  cacheTtl: number;
  fallbackEnabled: boolean;
  timeout: number;
}

// Cache key patterns
const CACHE_KEYS = {
  HOLIDAYS_BY_STATE: (state: string, year: number) => `holidays:state:${state}:${year}`,
  FEDERAL_HOLIDAYS: (year: number) => `holidays:federal:${year}`,
  ALL_HOLIDAYS: (year: number) => `holidays:all:${year}`,
  API_HEALTH: 'holidays:api:health',
  FALLBACK_DATA: 'holidays:fallback'
} as const;

// Performance metrics interface
interface ServiceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  apiRequests: number;
  fallbackUsage: number;
  avgResponseTime: number;
  errors: number;
}

/**
 * HolidayService - Core service for German holiday data management
 *
 * Provides high-performance holiday data access with government API integration,
 * intelligent caching, and comprehensive fallback mechanisms.
 */
export class HolidayService {
  private readonly httpClient: AxiosInstance;
  private readonly redis: Redis;
  private readonly config: HolidayServiceConfig;
  private readonly metrics: ServiceMetrics;

  // In-memory cache for ultra-fast lookups
  private readonly memoryCache = new Map<string, { data: any; expires: number }>();
  private readonly maxMemoryItems = 1000; // Prevent memory leaks

  constructor(redis?: Redis) {
    const env = getEnvConfig();

    this.config = {
      apiUrl: env.GERMAN_HOLIDAY_API_URL,
      apiKey: env.GERMAN_HOLIDAY_API_KEY,
      cacheEnabled: true,
      cacheTtl: env.CACHE_TTL_HOLIDAYS,
      fallbackEnabled: true,
      timeout: 5000 // 5 second timeout
    };

    // Initialize HTTP client with optimizations
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TimeButler-Calendar/1.0'
      },
      // Connection optimization
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 300
    });

    // Add request interceptor for API key
    if (this.config.apiKey) {
      this.httpClient.interceptors.request.use((config) => {
        config.headers['X-API-Key'] = this.config.apiKey;
        return config;
      });
    }

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Holiday API error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );

    // Initialize Redis connection
    this.redis = redis || new Redis(env.REDIS_URL);

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiRequests: 0,
      fallbackUsage: 0,
      avgResponseTime: 0,
      errors: 0
    };
  }

  /**
   * Get holidays for a specific German state and year
   * Primary service method with full caching and fallback support
   */
  public async getHolidaysByState(stateCode: string, year: number, language: 'de' | 'en' = 'de'): Promise<Holiday[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Validate inputs
      this.validateStateCode(stateCode);
      this.validateYear(year);

      const cacheKey = CACHE_KEYS.HOLIDAYS_BY_STATE(stateCode, year);

      // Try memory cache first (ultra-fast)
      const memoryResult = this.getFromMemoryCache(cacheKey);
      if (memoryResult) {
        this.metrics.cacheHits++;
        this.updateResponseTime(startTime);
        return this.transformToHolidayModels(memoryResult, language);
      }

      // Try Redis cache
      const cachedData = await this.getFromRedisCache(cacheKey);
      if (cachedData) {
        this.metrics.cacheHits++;
        this.setMemoryCache(cacheKey, cachedData);
        this.updateResponseTime(startTime);
        return this.transformToHolidayModels(cachedData, language);
      }

      this.metrics.cacheMisses++;

      // Fetch from API with fallback
      const holidayData = await this.fetchHolidaysWithFallback(stateCode, year);

      // Cache the results
      await this.setCacheData(cacheKey, holidayData);
      this.setMemoryCache(cacheKey, holidayData);

      this.updateResponseTime(startTime);
      return this.transformToHolidayModels(holidayData, language);

    } catch (error) {
      this.metrics.errors++;
      console.error('Error in getHolidaysByState:', error);

      // Return fallback data on critical errors
      return this.getFallbackHolidays(stateCode, year, language);
    }
  }

  /**
   * Get federal holidays (applicable to all German states)
   */
  public async getFederalHolidays(year: number, language: 'de' | 'en' = 'de'): Promise<Holiday[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      this.validateYear(year);

      const cacheKey = CACHE_KEYS.FEDERAL_HOLIDAYS(year);

      // Check caches
      const memoryResult = this.getFromMemoryCache(cacheKey);
      if (memoryResult) {
        this.metrics.cacheHits++;
        this.updateResponseTime(startTime);
        return this.transformToHolidayModels(memoryResult, language);
      }

      const cachedData = await this.getFromRedisCache(cacheKey);
      if (cachedData) {
        this.metrics.cacheHits++;
        this.setMemoryCache(cacheKey, cachedData);
        this.updateResponseTime(startTime);
        return this.transformToHolidayModels(cachedData, language);
      }

      this.metrics.cacheMisses++;

      // Federal holidays are the same across all states, so use 'ALL'
      const holidayData = await this.fetchHolidaysWithFallback('ALL', year);
      const federalHolidays = holidayData.filter((h: HolidayData) => h.type === 'federal');

      await this.setCacheData(cacheKey, federalHolidays);
      this.setMemoryCache(cacheKey, federalHolidays);

      this.updateResponseTime(startTime);
      return this.transformToHolidayModels(federalHolidays, language);

    } catch (error) {
      this.metrics.errors++;
      console.error('Error in getFederalHolidays:', error);
      return this.getFallbackFederalHolidays(year, language);
    }
  }

  /**
   * Refresh cache for specific state and year
   * Useful for manual cache invalidation
   */
  public async refreshCache(stateCode: string, year: number): Promise<void> {
    try {
      this.validateStateCode(stateCode);
      this.validateYear(year);

      const cacheKey = CACHE_KEYS.HOLIDAYS_BY_STATE(stateCode, year);

      // Clear existing caches
      this.clearMemoryCache(cacheKey);
      await this.clearRedisCache(cacheKey);

      // Force fetch from API
      const freshData = await this.fetchFromApi(stateCode, year);

      // Update caches
      await this.setCacheData(cacheKey, freshData);
      this.setMemoryCache(cacheKey, freshData);

      console.log(`Cache refreshed for ${stateCode}/${year}`);
    } catch (error) {
      console.error('Error refreshing cache:', error);
      throw error;
    }
  }

  /**
   * Validate holiday data accuracy against expected patterns
   * Used for data quality assurance
   */
  public async validateData(stateCode: string, year: number): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const holidays = await this.getHolidaysByState(stateCode, year);

      // Check federal holidays are present
      const federalExpected = [
        'neujahr', 'karfreitag', 'ostermontag', 'tag-der-arbeit',
        'christi-himmelfahrt', 'pfingstmontag', 'tag-der-deutschen-einheit',
        'weihnachtstag', 'zweiter-weihnachtstag'
      ];

      for (const expectedId of federalExpected) {
        if (!holidays.some(h => h.id.includes(expectedId))) {
          errors.push(`Missing federal holiday: ${expectedId}`);
        }
      }

      // Validate Easter calculations
      const easter = Holiday.calculateEaster(year);
      const easterDate = DateTime.fromISO(easter);

      const karfreitag = holidays.find(h => h.id.includes('karfreitag'));
      if (karfreitag) {
        const expectedKarfreitag = easterDate.minus({ days: 2 }).toFormat('yyyy-MM-dd');
        if (karfreitag.date !== expectedKarfreitag) {
          errors.push(`Incorrect Karfreitag date: expected ${expectedKarfreitag}, got ${karfreitag.date}`);
        }
      }

      // State-specific validation
      const state = State.findByCode(stateCode);

      // Catholic states should have Fronleichnam
      if (state.is_catholic_majority) {
        if (!holidays.some(h => h.id.includes('fronleichnam'))) {
          warnings.push(`Catholic state ${stateCode} missing Fronleichnam`);
        }
      }

      // Protestant states should have Reformationstag
      if (!state.is_catholic_majority && !['BE', 'HE'].includes(stateCode)) {
        if (!holidays.some(h => h.id.includes('reformationstag'))) {
          warnings.push(`Protestant state ${stateCode} missing Reformationstag`);
        }
      }

    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get service performance metrics
   */
  public getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset service metrics
   */
  public resetMetrics(): void {
    Object.assign(this.metrics, {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiRequests: 0,
      fallbackUsage: 0,
      avgResponseTime: 0,
      errors: 0
    });
  }

  /**
   * Close connections and cleanup
   */
  public async close(): Promise<void> {
    this.memoryCache.clear();
    await this.redis.quit();
  }

  // Private helper methods

  private validateStateCode(stateCode: string): void {
    if (stateCode !== 'ALL') {
      State.validateStateCode(stateCode);
    }
  }

  private validateYear(year: number): void {
    if (year < 2025 || year > 2026) {
      throw new Error('Year must be within range 2025-2026');
    }
  }

  private async fetchHolidaysWithFallback(stateCode: string, year: number): Promise<HolidayData[]> {
    try {
      return await this.fetchFromApi(stateCode, year);
    } catch (error) {
      console.warn('API fetch failed, using fallback data:', error);
      this.metrics.fallbackUsage++;
      return this.generateFallbackData(stateCode, year);
    }
  }

  private async fetchFromApi(stateCode: string, year: number): Promise<HolidayData[]> {
    this.metrics.apiRequests++;

    try {
      // Use the German holiday API
      const endpoint = `/${year}/${stateCode === 'ALL' ? '' : stateCode}`;
      const response = await this.httpClient.get<GermanHolidayApiResponse>(endpoint);

      return this.transformApiResponse(response.data, stateCode, year);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Holiday API error: ${error.response?.status} ${error.message}`);
      }
      throw error;
    }
  }

  private transformApiResponse(apiData: GermanHolidayApiResponse, stateCode: string, year: number): HolidayData[] {
    const holidays: HolidayData[] = [];

    // Handle different response formats based on whether we requested all states or specific state
    const stateData = stateCode === 'ALL' ? apiData : { [stateCode]: apiData };

    for (const [state, stateHolidays] of Object.entries(stateData)) {
      for (const [holidayName, holidayInfo] of Object.entries(stateHolidays)) {
        // Map German holiday names to our standardized format
        const holidayId = this.mapHolidayNameToId(holidayName, year);
        const { name_de, name_en } = this.getHolidayNames(holidayName);

        holidays.push({
          id: holidayId,
          name_de,
          name_en,
          date: holidayInfo.datum,
          type: this.determineHolidayType(holidayName, state),
          states: this.determineHolidayStates(holidayName, state),
          is_catholic: this.isCatholicHoliday(holidayName),
          is_protestant: this.isProtestantHoliday(holidayName),
          region: undefined // API doesn't provide regional info
        });
      }
    }

    return holidays;
  }

  private mapHolidayNameToId(name: string, year: number): string {
    const mapping: Record<string, string> = {
      'Neujahr': `neujahr-${year}`,
      'Heilige Drei Könige': `heilige-drei-koenige-${year}`,
      'Karfreitag': `karfreitag-${year}`,
      'Ostermontag': `ostermontag-${year}`,
      'Tag der Arbeit': `tag-der-arbeit-${year}`,
      'Christi Himmelfahrt': `christi-himmelfahrt-${year}`,
      'Pfingstmontag': `pfingstmontag-${year}`,
      'Fronleichnam': `fronleichnam-${year}`,
      'Tag der Deutschen Einheit': `tag-der-deutschen-einheit-${year}`,
      'Reformationstag': `reformationstag-${year}`,
      'Allerheiligen': `allerheiligen-${year}`,
      'Buß- und Bettag': `buss-und-bettag-${year}`,
      '1. Weihnachtstag': `weihnachtstag-${year}`,
      '2. Weihnachtstag': `zweiter-weihnachtstag-${year}`
    };

    return mapping[name] || `unknown-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`;
  }

  private getHolidayNames(germanName: string): { name_de: string; name_en: string } {
    const translations: Record<string, string> = {
      'Neujahr': 'New Year\'s Day',
      'Heilige Drei Könige': 'Epiphany',
      'Karfreitag': 'Good Friday',
      'Ostermontag': 'Easter Monday',
      'Tag der Arbeit': 'Labour Day',
      'Christi Himmelfahrt': 'Ascension Day',
      'Pfingstmontag': 'Whit Monday',
      'Fronleichnam': 'Corpus Christi',
      'Tag der Deutschen Einheit': 'German Unity Day',
      'Reformationstag': 'Reformation Day',
      'Allerheiligen': 'All Saints\' Day',
      'Buß- und Bettag': 'Prayer and Repentance Day',
      '1. Weihnachtstag': 'Christmas Day',
      '2. Weihnachtstag': 'Boxing Day'
    };

    return {
      name_de: germanName,
      name_en: translations[germanName] || germanName
    };
  }

  private determineHolidayType(holidayName: string, state: string): 'federal' | 'state' | 'regional' {
    const federalHolidays = [
      'Neujahr', 'Karfreitag', 'Ostermontag', 'Tag der Arbeit',
      'Christi Himmelfahrt', 'Pfingstmontag', 'Tag der Deutschen Einheit',
      '1. Weihnachtstag', '2. Weihnachtstag'
    ];

    return federalHolidays.includes(holidayName) ? 'federal' : 'state';
  }

  private determineHolidayStates(holidayName: string, currentState: string): string[] {
    const federalHolidays = [
      'Neujahr', 'Karfreitag', 'Ostermontag', 'Tag der Arbeit',
      'Christi Himmelfahrt', 'Pfingstmontag', 'Tag der Deutschen Einheit',
      '1. Weihnachtstag', '2. Weihnachtstag'
    ];

    if (federalHolidays.includes(holidayName)) {
      return ['ALL'];
    }

    // State-specific holiday mappings
    const stateHolidays: Record<string, string[]> = {
      'Heilige Drei Könige': ['BW', 'BY', 'ST'],
      'Fronleichnam': ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'],
      'Allerheiligen': ['BW', 'BY', 'NW', 'RP', 'SL'],
      'Reformationstag': ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'],
      'Buß- und Bettag': ['SN']
    };

    return stateHolidays[holidayName] || [currentState];
  }

  private isCatholicHoliday(holidayName: string): boolean {
    const catholicHolidays = ['Heilige Drei Könige', 'Fronleichnam', 'Allerheiligen'];
    return catholicHolidays.includes(holidayName);
  }

  private isProtestantHoliday(holidayName: string): boolean {
    const protestantHolidays = ['Reformationstag', 'Buß- und Bettag'];
    return protestantHolidays.includes(holidayName);
  }

  private generateFallbackData(stateCode: string, year: number): HolidayData[] {
    // Use the existing Holiday model's mock database for fallback
    return Holiday.createMockDatabase().then(holidays =>
      holidays.filter(h =>
        h.date.startsWith(year.toString()) &&
        (stateCode === 'ALL' || h.states.includes('ALL') || h.states.includes(stateCode))
      ).map(h => h.toJSON())
    ).catch(() => []);
  }

  private async getFallbackHolidays(stateCode: string, year: number, language: 'de' | 'en'): Promise<Holiday[]> {
    try {
      const fallbackData = await this.generateFallbackData(stateCode, year);
      return this.transformToHolidayModels(fallbackData, language);
    } catch {
      return [];
    }
  }

  private async getFallbackFederalHolidays(year: number, language: 'de' | 'en'): Promise<Holiday[]> {
    return this.getFallbackHolidays('ALL', year, language);
  }

  private transformToHolidayModels(data: HolidayData[], language: 'de' | 'en' = 'de'): Holiday[] {
    return data.map(holidayData => Holiday.fromJSON(holidayData));
  }

  // Cache management methods

  private getFromMemoryCache(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (item && item.expires > Date.now()) {
      return item.data;
    }
    if (item) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  private setMemoryCache(key: string, data: any): void {
    // Prevent memory cache from growing too large
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (this.config.cacheTtl * 1000)
    });
  }

  private clearMemoryCache(key: string): void {
    this.memoryCache.delete(key);
  }

  private async getFromRedisCache(key: string): Promise<any | null> {
    if (!this.config.cacheEnabled) return null;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Redis cache get error:', error);
      return null;
    }
  }

  private async setCacheData(key: string, data: any): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      await this.redis.setex(key, this.config.cacheTtl, JSON.stringify(data));
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }
  }

  private async clearRedisCache(key: string): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Redis cache clear error:', error);
    }
  }

  private updateResponseTime(startTime: number): void {
    const duration = Date.now() - startTime;
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + duration) /
      this.metrics.totalRequests;
  }
}

export default HolidayService;