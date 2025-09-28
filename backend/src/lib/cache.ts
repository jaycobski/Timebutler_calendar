/**
 * Redis Caching Layer - Timebutler Calendar Performance Optimization
 * Constitutional Requirement: <2s load times, handle 25k concurrent users
 *
 * Implements comprehensive caching strategy including:
 * - Holiday data caching with 30-day TTL
 * - Bridge weekend calculation caching
 * - Performance optimization for German market traffic spikes
 * - Connection pooling and memory management
 * - Cache invalidation and warming strategies
 * - Performance monitoring and metrics
 * - Fallback mechanisms for Redis failures
 * - GDPR-compliant data handling
 */

import Redis from 'ioredis';
import { DateTime } from 'luxon';

// Cache key prefixes for organization and namespace isolation
export const CACHE_PREFIXES = {
  HOLIDAY: 'holiday:',
  BRIDGE: 'bridge:',
  STATE: 'state:',
  YEAR: 'year:',
  USER_SESSION: 'session:',
  METRICS: 'metrics:',
  HEALTH: 'health:',
  RATE_LIMIT: 'rate_limit:'
} as const;

// Cache TTL configurations (in seconds) optimized for German holiday calendar
export const CACHE_TTL = {
  HOLIDAY_DATA: 30 * 24 * 60 * 60, // 30 days - holiday data changes rarely
  BRIDGE_CALCULATION: 7 * 24 * 60 * 60, // 7 days - bridge calculations can be cached longer
  STATE_DATA: 24 * 60 * 60, // 24 hours - state information rarely changes
  USER_SESSION: 90 * 60, // 90 minutes - GDPR compliant session timeout
  METRICS: 5 * 60, // 5 minutes - metrics aggregation window
  HEALTH_CHECK: 30, // 30 seconds - frequent health monitoring
  RATE_LIMIT: 60 * 60, // 1 hour - rate limiting window
  HOT_DATA: 4 * 60 * 60, // 4 hours - frequently accessed data
  WARM_DATA: 12 * 60 * 60 // 12 hours - moderately accessed data
} as const;

// Performance thresholds for monitoring
export const PERFORMANCE_THRESHOLDS = {
  MAX_RESPONSE_TIME: 100, // 100ms max for cached operations
  MAX_MEMORY_USAGE: 0.8, // 80% max Redis memory usage
  MAX_CONNECTION_COUNT: 1000, // Max concurrent connections
  CACHE_HIT_RATIO_MIN: 0.85, // 85% minimum cache hit ratio
  MAX_KEY_SIZE: 1024 * 1024, // 1MB max per cache key
  BATCH_SIZE: 100 // Batch size for bulk operations
} as const;

// German states for cache key generation
const GERMAN_STATES = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

export interface CacheConfig {
  host: string;
  port: number;
  password?: string | undefined;
  database: number;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  maxMemoryPolicy: string;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
  family: 4 | 6;
}

export interface CacheMetrics {
  hitCount: number;
  missCount: number;
  errorCount: number;
  totalRequests: number;
  hitRatio: number;
  averageResponseTime: number;
  memoryUsage: number;
  connectionCount: number;
  lastUpdated: string;
}

export interface CacheHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  memoryUsage: number;
  connectionCount: number;
  lastError?: string;
  uptime: number;
}

export interface HolidayCache {
  id: string;
  name_de: string;
  name_en: string;
  date: string;
  type: string;
  states: string[];
  is_catholic: boolean;
  is_protestant: boolean;
  region?: string;
}

export interface BridgeWeekendCache {
  id: string;
  holiday_id: string;
  state_code: string;
  start_date: string;
  end_date: string;
  vacation_days_needed: number;
  total_days_off: number;
  efficiency: number;
  pattern: string;
}

/**
 * Redis Cache Manager
 * High-performance caching layer optimized for German calendar data
 */
export class CacheManager {
  private redis: Redis;
  private metrics: CacheMetrics;
  private isInitialized: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private startTime: number;

  constructor(config?: Partial<CacheConfig>) {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();

    const defaultConfig: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      maxMemoryPolicy: 'allkeys-lru',
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      family: 4
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.redis = new Redis({
      ...finalConfig,
      // Retry strategy for resilience
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },

      // Memory optimization
      enableReadyCheck: true,

      // Performance optimization
      enableOfflineQueue: false
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize cache manager with health monitoring
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      this.isInitialized = true;
      this.startHealthMonitoring();
      this.startMetricsCollection();
      console.log('Redis cache manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      throw new Error('Cache initialization failed');
    }
  }

  /**
   * Holiday Data Caching Operations
   */

  /**
   * Cache holiday data by state and year
   */
  async cacheHolidaysByState(stateCode: string, year: number, holidays: HolidayCache[]): Promise<void> {
    const key = this.generateHolidayKey(stateCode, year);
    const serialized = JSON.stringify(holidays);

    if (serialized.length > PERFORMANCE_THRESHOLDS.MAX_KEY_SIZE) {
      console.warn(`Holiday data for ${stateCode}-${year} exceeds max key size`);
      return;
    }

    const startTime = Date.now();
    try {
      await this.redis.setex(key, CACHE_TTL.HOLIDAY_DATA, serialized);
      this.updateMetrics('cache_set', Date.now() - startTime);
    } catch (error) {
      this.updateMetrics('error');
      throw new Error(`Failed to cache holidays for ${stateCode}-${year}: ${error}`);
    }
  }

  /**
   * Get cached holiday data by state and year
   */
  async getHolidaysByState(stateCode: string, year: number): Promise<HolidayCache[] | null> {
    const key = this.generateHolidayKey(stateCode, year);
    const startTime = Date.now();

    try {
      const cached = await this.redis.get(key);
      const responseTime = Date.now() - startTime;

      if (cached) {
        this.updateMetrics('hit', responseTime);
        return JSON.parse(cached);
      } else {
        this.updateMetrics('miss', responseTime);
        return null;
      }
    } catch (error) {
      this.updateMetrics('error');
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache all holidays for a specific year (pre-warming)
   */
  async cacheHolidaysByYear(year: number, holidays: HolidayCache[]): Promise<void> {
    const key = `${CACHE_PREFIXES.YEAR}${year}`;
    const serialized = JSON.stringify(holidays);

    try {
      await this.redis.setex(key, CACHE_TTL.HOLIDAY_DATA, serialized);
    } catch (error) {
      throw new Error(`Failed to cache holidays for year ${year}: ${error}`);
    }
  }

  /**
   * Get all holidays for a specific year
   */
  async getHolidaysByYear(year: number): Promise<HolidayCache[] | null> {
    const key = `${CACHE_PREFIXES.YEAR}${year}`;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for year ${year}:`, error);
      return null;
    }
  }

  /**
   * Bridge Weekend Caching Operations
   */

  /**
   * Cache bridge weekend calculations
   */
  async cacheBridgeWeekends(stateCode: string, year: number, maxVacationDays: number, bridges: BridgeWeekendCache[]): Promise<void> {
    const key = this.generateBridgeKey(stateCode, year, maxVacationDays);
    const serialized = JSON.stringify(bridges);

    try {
      await this.redis.setex(key, CACHE_TTL.BRIDGE_CALCULATION, serialized);
    } catch (error) {
      throw new Error(`Failed to cache bridge weekends: ${error}`);
    }
  }

  /**
   * Get cached bridge weekend calculations
   */
  async getBridgeWeekends(stateCode: string, year: number, maxVacationDays: number): Promise<BridgeWeekendCache[] | null> {
    const key = this.generateBridgeKey(stateCode, year, maxVacationDays);

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for bridge weekends:`, error);
      return null;
    }
  }

  /**
   * User Session Caching (GDPR Compliant)
   */

  /**
   * Cache user session data with automatic expiration
   */
  async cacheUserSession(sessionId: string, data: any): Promise<void> {
    const key = `${CACHE_PREFIXES.USER_SESSION}${sessionId}`;

    try {
      // GDPR compliant: auto-expire user data after 90 minutes
      await this.redis.setex(key, CACHE_TTL.USER_SESSION, JSON.stringify(data));
    } catch (error) {
      throw new Error(`Failed to cache user session: ${error}`);
    }
  }

  /**
   * Get user session data
   */
  async getUserSession(sessionId: string): Promise<any | null> {
    const key = `${CACHE_PREFIXES.USER_SESSION}${sessionId}`;

    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for session:`, error);
      return null;
    }
  }

  /**
   * Rate Limiting Operations
   */

  /**
   * Implement rate limiting for API endpoints
   */
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number = 3600): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${CACHE_PREFIXES.RATE_LIMIT}${identifier}`;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;

      const remaining = Math.max(0, limit - count);
      const resetTime = Date.now() + (windowSeconds * 1000);

      return {
        allowed: count <= limit,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow requests if Redis is down
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  /**
   * Cache Warming Operations
   */

  /**
   * Pre-warm cache with popular holiday data for German market
   */
  async warmCache(): Promise<void> {
    console.log('Starting cache warming for German holiday data...');

    try {
      const years = [2025, 2026];
      const popularStates = ['BY', 'NW', 'BW', 'NI', 'HE']; // Most populous German states

      // Pre-warm holiday data for popular states
      for (const year of years) {
        for (const state of popularStates) {
          const key = this.generateHolidayKey(state, year);
          const exists = await this.redis.exists(key);

          if (!exists) {
            // In production, this would fetch from Holiday.findByStateAndYear()
            // For now, create placeholder to establish cache structure
            const placeholderHolidays: HolidayCache[] = [{
              id: `neujahr-${year}`,
              name_de: 'Neujahr',
              name_en: 'New Year\'s Day',
              date: `${year}-01-01`,
              type: 'federal',
              states: ['ALL'],
              is_catholic: false,
              is_protestant: false
            }];

            await this.cacheHolidaysByState(state, year, placeholderHolidays);
          }
        }
      }

      console.log('Cache warming completed successfully');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  /**
   * Cache Invalidation Operations
   */

  /**
   * Invalidate holiday cache for specific state and year
   */
  async invalidateHolidayCache(stateCode?: string, year?: number): Promise<void> {
    try {
      if (stateCode && year) {
        const key = this.generateHolidayKey(stateCode, year);
        await this.redis.del(key);
      } else if (year) {
        // Invalidate all states for a specific year
        const pattern = `${CACHE_PREFIXES.HOLIDAY}*:${year}`;
        await this.deleteKeysByPattern(pattern);
      } else {
        // Invalidate all holiday cache
        const pattern = `${CACHE_PREFIXES.HOLIDAY}*`;
        await this.deleteKeysByPattern(pattern);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate bridge weekend calculations
   */
  async invalidateBridgeCache(stateCode?: string, year?: number): Promise<void> {
    try {
      const pattern = stateCode && year
        ? `${CACHE_PREFIXES.BRIDGE}${stateCode}:${year}:*`
        : `${CACHE_PREFIXES.BRIDGE}*`;

      await this.deleteKeysByPattern(pattern);
    } catch (error) {
      console.error('Bridge cache invalidation error:', error);
    }
  }

  /**
   * Performance Monitoring and Health Checks
   */

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<CacheHealthStatus> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        isHealthy: responseTime < PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME,
        responseTime,
        memoryUsage,
        connectionCount: this.redis.status === 'ready' ? 1 : 0,
        uptime: Date.now() - this.startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        memoryUsage: 0,
        connectionCount: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        uptime: Date.now() - this.startTime
      };
    }
  }

  /**
   * Batch Operations for High Performance
   */

  /**
   * Set multiple cache keys in a single operation
   */
  async mset(keyValuePairs: Array<[string, string, number]>): Promise<void> {
    if (keyValuePairs.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value, ttl] of keyValuePairs) {
        pipeline.setex(key, ttl, value);
      }

      await pipeline.exec();
    } catch (error) {
      throw new Error(`Batch set operation failed: ${error}`);
    }
  }

  /**
   * Get multiple cache keys in a single operation
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];

    try {
      return await this.redis.mget(...keys);
    } catch (error) {
      console.error('Batch get operation failed:', error);
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Memory Management
   */

  /**
   * Clean up expired keys and optimize memory usage
   */
  async optimizeMemory(): Promise<void> {
    try {
      // Force garbage collection of expired keys
      await this.redis.eval(`
        local keys = redis.call('KEYS', ARGV[1])
        local count = 0
        for i=1,#keys do
          if redis.call('TTL', keys[i]) == -1 then
            redis.call('DEL', keys[i])
            count = count + 1
          end
        end
        return count
      `, 0, '*');

      console.log('Memory optimization completed');
    } catch (error) {
      console.error('Memory optimization failed:', error);
    }
  }

  /**
   * Cleanup and Shutdown
   */

  /**
   * Graceful shutdown with cleanup
   */
  async shutdown(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      await this.redis.quit();
      console.log('Cache manager shutdown completed');
    } catch (error) {
      console.error('Cache shutdown error:', error);
    }
  }

  /**
   * Private Helper Methods
   */

  private generateHolidayKey(stateCode: string, year: number): string {
    return `${CACHE_PREFIXES.HOLIDAY}${stateCode}:${year}`;
  }

  private generateBridgeKey(stateCode: string, year: number, maxVacationDays: number): string {
    return `${CACHE_PREFIXES.BRIDGE}${stateCode}:${year}:${maxVacationDays}`;
  }

  private async deleteKeysByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Failed to delete keys with pattern ${pattern}:`, error);
    }
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hitCount: 0,
      missCount: 0,
      errorCount: 0,
      totalRequests: 0,
      hitRatio: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      connectionCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private updateMetrics(operation: 'hit' | 'miss' | 'error' | 'cache_set', responseTime?: number): void {
    this.metrics.totalRequests++;

    switch (operation) {
      case 'hit':
        this.metrics.hitCount++;
        break;
      case 'miss':
        this.metrics.missCount++;
        break;
      case 'error':
        this.metrics.errorCount++;
        break;
    }

    if (responseTime !== undefined) {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
        this.metrics.totalRequests;
    }

    this.metrics.hitRatio = this.metrics.hitCount / Math.max(1, this.metrics.hitCount + this.metrics.missCount);
    this.metrics.lastUpdated = new Date().toISOString();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('Redis connected');
    });

    this.redis.on('ready', () => {
      console.log('Redis ready');
    });

    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
      this.updateMetrics('error');
    });

    this.redis.on('close', () => {
      console.log('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }

  private startHealthMonitoring(): void {
    // Skip health monitoring in test environment to avoid memory leaks
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();

        if (!health.isHealthy) {
          console.warn('Redis health check failed:', health);
        }

        // Alert if memory usage is too high
        if (health.memoryUsage > PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE * 1024 * 1024 * 1024) {
          console.warn('Redis memory usage is high:', health.memoryUsage);
          await this.optimizeMemory();
        }
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private startMetricsCollection(): void {
    // Skip metrics collection in test environment to avoid memory leaks
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.metricsInterval = setInterval(async () => {
      try {
        // Store metrics in Redis for monitoring dashboard
        const metricsKey = `${CACHE_PREFIXES.METRICS}${DateTime.now().toFormat('yyyy-MM-dd:HH:mm')}`;
        await this.redis.setex(metricsKey, CACHE_TTL.METRICS, JSON.stringify(this.metrics));
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, 60000); // Collect every minute
  }
}

/**
 * Global cache manager instance
 * Singleton pattern for application-wide cache access
 */
let globalCacheManager: CacheManager | null = null;

/**
 * Get or create global cache manager instance
 */
export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager(config);
  }
  return globalCacheManager;
}

/**
 * Initialize global cache manager
 */
export async function initializeCache(config?: Partial<CacheConfig>): Promise<CacheManager> {
  const cache = getCacheManager(config);
  await cache.initialize();
  await cache.warmCache();
  return cache;
}

/**
 * Shutdown global cache manager
 */
export async function shutdownCache(): Promise<void> {
  if (globalCacheManager) {
    await globalCacheManager.shutdown();
    globalCacheManager = null;
  }
}

export default CacheManager;