import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'crypto';

/**
 * High-performance caching middleware
 * Constitutional requirement: Sub-100ms response times through aggressive caching
 * Implements multi-layer caching strategy for German holiday data
 */

interface CacheConfig {
  redisUrl?: string;
  defaultTtl: number;
  holidayTtl: number; // 30 days for holiday data
  bridgeTtl: number; // 24 hours for bridge calculations
  memoryCache: boolean;
  compressionEnabled: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  etag: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  memoryUsage: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  private redisClient?: any; // Redis client will be injected
  private readonly maxMemoryEntries = 1000;
  private readonly compressionThreshold = 1024; // Compress responses > 1KB

  constructor(
    private config: CacheConfig,
    private app: FastifyInstance
  ) {
    // Start cache cleanup job
    this.startCleanupJob();
    // Start stats calculation
    this.startStatsCalculation();
  }

  /**
   * Set Redis client (injected after Redis plugin registration)
   */
  setRedisClient(client: any): void {
    this.redisClient = client;
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(request: FastifyRequest): string {
    const { method, url } = request;
    const queryString = request.url.includes('?') ? request.url.split('?')[1] : '';
    const acceptLang = request.headers['accept-language'] || 'de';

    // Include relevant headers in cache key
    const cacheKeyData = {
      method,
      path: url.split('?')[0],
      query: queryString,
      lang: acceptLang.split(',')[0], // Primary language
    };

    const keyString = JSON.stringify(cacheKeyData);
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  /**
   * Get from cache (memory first, then Redis)
   */
  async get(key: string): Promise<any> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.stats.hits++;
      this.app.log.debug({ key, source: 'memory' }, 'Cache hit (memory)');
      return this.deserializeData(memoryEntry);
    }

    // Try Redis cache
    if (this.redisClient) {
      try {
        const redisData = await this.redisClient.get(key);
        if (redisData) {
          const entry: CacheEntry = JSON.parse(redisData);
          if (!this.isExpired(entry)) {
            // Store in memory cache for faster subsequent access
            this.setMemoryCache(key, entry);
            this.stats.hits++;
            this.app.log.debug({ key, source: 'redis' }, 'Cache hit (Redis)');
            return this.deserializeData(entry);
          } else {
            // Expired, remove from Redis
            await this.redisClient.del(key);
          }
        }
      } catch (error) {
        this.app.log.warn({ error, key }, 'Redis cache read error');
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cache entry (both memory and Redis)
   */
  async set(key: string, data: any, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.config.defaultTtl;
    const etag = this.generateETag(data);

    const entry: CacheEntry = {
      data: this.serializeData(data),
      timestamp: Date.now(),
      ttl: actualTtl,
      etag,
      compressed: this.shouldCompress(data)
    };

    // Set in memory cache
    this.setMemoryCache(key, entry);

    // Set in Redis cache
    if (this.redisClient) {
      try {
        await this.redisClient.setex(key, Math.floor(actualTtl / 1000), JSON.stringify(entry));
        this.app.log.debug({ key, ttl: actualTtl }, 'Cache set (Redis)');
      } catch (error) {
        this.app.log.warn({ error, key }, 'Redis cache write error');
      }
    }

    this.stats.sets++;
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        this.app.log.warn({ error, key }, 'Redis cache delete error');
      }
    }

    this.stats.deletes++;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (error) {
        this.app.log.warn({ error }, 'Redis cache clear error');
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.memoryUsage = this.calculateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Cache middleware for specific routes
   */
  createCacheMiddleware(ttl?: number) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip caching for non-GET requests
      if (request.method !== 'GET') {
        return;
      }

      const cacheKey = this.generateCacheKey(request);

      // Try to get from cache
      const cachedData = await this.get(cacheKey);
      if (cachedData) {
        // Mark performance monitor about cache hit
        if ((request as any).performanceMetric) {
          this.app.performanceMonitor?.markCacheHit(request);
        }

        // Set ETag header
        if (cachedData.etag) {
          reply.header('ETag', cachedData.etag);

          // Check if client has cached version
          const clientETag = request.headers['if-none-match'];
          if (clientETag === cachedData.etag) {
            return reply.status(304).send();
          }
        }

        // Set cache headers
        reply.header('X-Cache-Status', 'HIT');
        reply.header('Cache-Control', 'public, max-age=1800'); // 30 minutes client cache

        return reply.send(cachedData.data);
      }

      // Cache miss - continue to route handler
      reply.header('X-Cache-Status', 'MISS');

      // Hook to cache response
      reply.addHook('onSend', async (request, reply, payload) => {
        if (reply.statusCode === 200 && payload) {
          const actualTtl = ttl || this.getTtlForRoute(request.url);
          await this.set(cacheKey, payload, actualTtl);
        }
        return payload;
      });
    };
  }

  /**
   * Preload cache with holiday data
   */
  async preloadHolidayData(holidayData: any[]): Promise<void> {
    this.app.log.info('Preloading holiday data cache');

    const states = ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
    const years = [2025, 2026];
    const languages = ['de', 'en'];

    for (const state of states) {
      for (const year of years) {
        for (const lang of languages) {
          const cacheKey = this.generateHolidayCacheKey(state, year, lang);
          const stateHolidays = holidayData.filter(h =>
            h.state === state &&
            new Date(h.date).getFullYear() === year
          );

          await this.set(cacheKey, stateHolidays, this.config.holidayTtl);
        }
      }
    }

    this.app.log.info({
      states: states.length,
      years: years.length,
      languages: languages.length,
      totalCacheEntries: states.length * years.length * languages.length
    }, 'Holiday data preloading completed');
  }

  /**
   * Generate holiday cache key
   */
  private generateHolidayCacheKey(state: string, year: number, lang: string): string {
    return crypto.createHash('sha256')
      .update(`holidays:${state}:${year}:${lang}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Set memory cache with LRU eviction
   */
  private setMemoryCache(key: string, entry: CacheEntry): void {
    // Remove oldest entries if at capacity
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  /**
   * Serialize data for caching
   */
  private serializeData(data: any): any {
    if (this.config.compressionEnabled && this.shouldCompress(data)) {
      // TODO: Implement compression (gzip/brotli)
      return data;
    }
    return data;
  }

  /**
   * Deserialize cached data
   */
  private deserializeData(entry: CacheEntry): any {
    if (entry.compressed) {
      // TODO: Implement decompression
      return entry.data;
    }
    return entry.data;
  }

  /**
   * Check if data should be compressed
   */
  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length > this.compressionThreshold;
  }

  /**
   * Generate ETag for data
   */
  private generateETag(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').substring(0, 8);
  }

  /**
   * Get TTL based on route
   */
  private getTtlForRoute(url: string): number {
    if (url.includes('/holidays')) {
      return this.config.holidayTtl;
    }
    if (url.includes('/bridge-weekends')) {
      return this.config.bridgeTtl;
    }
    return this.config.defaultTtl;
  }

  /**
   * Calculate memory usage of cache
   */
  private calculateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.memoryCache) {
      size += key.length + JSON.stringify(entry).length;
    }
    return size;
  }

  /**
   * Start background cleanup job
   */
  private startCleanupJob(): void {
    setInterval(() => {
      const beforeSize = this.memoryCache.size;
      let cleaned = 0;

      for (const [key, entry] of this.memoryCache) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.app.log.debug({
          beforeSize,
          afterSize: this.memoryCache.size,
          cleaned
        }, 'Cache cleanup completed');
      }
    }, 60000); // Every minute
  }

  /**
   * Start stats calculation
   */
  private startStatsCalculation(): void {
    setInterval(() => {
      const stats = this.getStats();
      this.app.log.debug({
        hitRate: Math.round(stats.hitRate * 100) / 100,
        hits: stats.hits,
        misses: stats.misses,
        memoryUsageKB: Math.round(stats.memoryUsage / 1024)
      }, 'Cache statistics');
    }, 30000); // Every 30 seconds
  }
}

/**
 * Caching plugin configuration
 */
const defaultConfig: CacheConfig = {
  defaultTtl: 300000, // 5 minutes
  holidayTtl: 2592000000, // 30 days
  bridgeTtl: 86400000, // 24 hours
  memoryCache: true,
  compressionEnabled: true
};

/**
 * Caching plugin
 */
async function cachingPlugin(fastify: FastifyInstance, options: Partial<CacheConfig> = {}): Promise<void> {
  const config = { ...defaultConfig, ...options };
  const cacheManager = new CacheManager(config, fastify);

  // Add cache manager to fastify instance
  fastify.decorate('cacheManager', cacheManager);

  // Cache statistics endpoint
  fastify.get('/cache/stats', {
    schema: {
      description: 'Get cache statistics',
      tags: ['cache'],
      response: {
        200: {
          type: 'object',
          properties: {
            hitRate: { type: 'number' },
            hits: { type: 'number' },
            misses: { type: 'number' },
            sets: { type: 'number' },
            deletes: { type: 'number' },
            memoryUsage: { type: 'number' },
            memoryEntries: { type: 'number' }
          }
        }
      }
    }
  }, async () => {
    const stats = cacheManager.getStats();
    return {
      ...stats,
      memoryEntries: cacheManager['memoryCache'].size
    };
  });

  // Cache control endpoints
  fastify.delete('/cache/clear', async () => {
    await cacheManager.clear();
    return { cleared: true, timestamp: new Date().toISOString() };
  });

  fastify.delete('/cache/:key', async (request) => {
    const { key } = request.params as { key: string };
    await cacheManager.delete(key);
    return { deleted: key, timestamp: new Date().toISOString() };
  });

  // Preload endpoint for holiday data
  fastify.post('/cache/preload/holidays', {
    schema: {
      description: 'Preload holiday data cache',
      tags: ['cache'],
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            date: { type: 'string' },
            name: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {
    const holidayData = request.body as any[];
    await cacheManager.preloadHolidayData(holidayData);
    return { preloaded: holidayData.length, timestamp: new Date().toISOString() };
  });
}

// Extend Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    cacheManager: CacheManager;
  }
}

export default fp(cachingPlugin, {
  name: 'caching',
  dependencies: []
});

export { CacheManager, CacheConfig, CacheEntry, CacheStats };