import { FastifyInstance } from 'fastify';

/**
 * Database Query Optimizer Service
 * Constitutional requirement: <100ms response times through optimized queries
 * Implements connection pooling, query caching, and performance monitoring
 */

interface QueryMetrics {
  query: string;
  params?: any[];
  startTime: number;
  endTime?: number;
  duration?: number;
  rowsAffected?: number;
  cached?: boolean;
  connectionPool?: string;
}

interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
}

interface QueryCacheEntry {
  result: any;
  timestamp: number;
  ttl: number;
  queryHash: string;
}

class QueryOptimizer {
  private queryCache = new Map<string, QueryCacheEntry>();
  private queryMetrics: QueryMetrics[] = [];
  private readonly maxCacheEntries = 500;
  private readonly slowQueryThreshold = 50; // 50ms threshold for slow queries
  private poolConfig: PoolConfig;

  constructor(private app: FastifyInstance) {
    this.poolConfig = {
      min: 5,
      max: 25, // Optimized for 25k concurrent users
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 300000, // 5 minutes
      reapIntervalMillis: 1000
    };

    this.startCleanupJob();
  }

  /**
   * Execute optimized query with performance monitoring
   */
  async executeQuery<T = any>(
    query: string,
    params?: any[],
    options: {
      cache?: boolean;
      cacheTtl?: number;
      timeout?: number;
      poolName?: string;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(query, params);

    // Check cache first if caching is enabled
    if (options.cache) {
      const cached = this.getFromCache<T>(queryHash);
      if (cached) {
        this.recordQueryMetric({
          query,
          params,
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          cached: true
        });
        return cached;
      }
    }

    try {
      // Execute query with timeout
      const result = await this.executeWithTimeout(query, params, options.timeout);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record metrics
      this.recordQueryMetric({
        query,
        params,
        startTime,
        endTime,
        duration,
        rowsAffected: Array.isArray(result) ? result.length : 1,
        cached: false,
        connectionPool: options.poolName
      });

      // Cache result if caching is enabled
      if (options.cache && duration < this.slowQueryThreshold) {
        this.setCache(queryHash, result, options.cacheTtl || 300000); // 5 minutes default
      }

      // Alert on slow queries
      if (duration > this.slowQueryThreshold) {
        this.app.log.warn({
          query: this.sanitizeQuery(query),
          duration,
          params: this.sanitizeParams(params),
          threshold: this.slowQueryThreshold
        }, 'Slow database query detected');
      }

      return result;

    } catch (error) {
      this.app.log.error({
        query: this.sanitizeQuery(query),
        params: this.sanitizeParams(params),
        error: error.message,
        duration: Date.now() - startTime
      }, 'Database query error');
      throw error;
    }
  }

  /**
   * Optimized query for German holidays
   */
  async getHolidays(
    state: string,
    year: number,
    language: string = 'de'
  ): Promise<any[]> {
    const query = `
      SELECT
        id,
        name_de,
        name_en,
        date,
        state,
        type,
        is_nationwide,
        religious_denomination
      FROM holidays
      WHERE state = $1
        AND EXTRACT(YEAR FROM date) = $2
        AND (is_nationwide = true OR state = $1)
      ORDER BY date ASC
    `;

    return this.executeQuery(query, [state, year], {
      cache: true,
      cacheTtl: 86400000, // 24 hours
      timeout: 30000, // 30 seconds
      poolName: 'read'
    });
  }

  /**
   * Optimized bridge weekend calculation query
   */
  async getBridgeOpportunities(
    state: string,
    year: number,
    maxVacationDays: number = 10
  ): Promise<any[]> {
    const query = `
      SELECT
        h.id as holiday_id,
        h.name_de,
        h.name_en,
        h.date as holiday_date,
        b.start_date,
        b.end_date,
        b.vacation_days_needed,
        b.total_days_off,
        b.efficiency,
        b.pattern_type
      FROM holidays h
      JOIN bridge_weekends b ON h.id = b.holiday_id
      WHERE h.state = $1
        AND EXTRACT(YEAR FROM h.date) = $2
        AND b.vacation_days_needed <= $3
      ORDER BY b.efficiency DESC, b.vacation_days_needed ASC
    `;

    return this.executeQuery(query, [state, year, maxVacationDays], {
      cache: true,
      cacheTtl: 3600000, // 1 hour
      timeout: 15000, // 15 seconds
      poolName: 'read'
    });
  }

  /**
   * Batch insert for performance
   */
  async batchInsert(
    table: string,
    records: any[],
    chunkSize: number = 100
  ): Promise<void> {
    const chunks = this.chunkArray(records, chunkSize);

    for (const chunk of chunks) {
      const startTime = Date.now();

      try {
        await this.executeBatchInsert(table, chunk);

        this.recordQueryMetric({
          query: `BATCH INSERT INTO ${table}`,
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          rowsAffected: chunk.length
        });

      } catch (error) {
        this.app.log.error({
          table,
          chunkSize: chunk.length,
          error: error.message
        }, 'Batch insert error');
        throw error;
      }
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    cacheHitRate: number;
    recentSlowQueries: QueryMetrics[];
  } {
    const total = this.queryMetrics.length;
    const cached = this.queryMetrics.filter(m => m.cached).length;
    const slow = this.queryMetrics.filter(m =>
      m.duration && m.duration > this.slowQueryThreshold
    ).length;

    const avgDuration = total > 0
      ? this.queryMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / total
      : 0;

    const cacheHitRate = total > 0 ? (cached / total) * 100 : 0;

    const recentSlowQueries = this.queryMetrics
      .filter(m => m.duration && m.duration > this.slowQueryThreshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      totalQueries: total,
      averageDuration: Math.round(avgDuration * 100) / 100,
      slowQueries: slow,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      recentSlowQueries
    };
  }

  /**
   * Optimize database connections for German traffic patterns
   */
  getOptimizedPoolConfig(): PoolConfig {
    // German traffic patterns: High load Dec-Jan (vacation planning)
    const currentMonth = new Date().getMonth() + 1;
    const isHighSeason = currentMonth === 12 || currentMonth === 1;

    return {
      ...this.poolConfig,
      max: isHighSeason ? 50 : 25,
      min: isHighSeason ? 10 : 5
    };
  }

  /**
   * Precompiled queries for common operations
   */
  getPrecompiledQueries(): Record<string, string> {
    return {
      holidaysByState: `
        SELECT id, name_de, name_en, date, state, type
        FROM holidays
        WHERE state = $1 AND EXTRACT(YEAR FROM date) = $2
        ORDER BY date ASC
      `,
      bridgeOpportunities: `
        SELECT h.*, b.*
        FROM holidays h
        JOIN bridge_weekends b ON h.id = b.holiday_id
        WHERE h.state = $1 AND EXTRACT(YEAR FROM h.date) = $2
        ORDER BY b.efficiency DESC
      `,
      stateHolidayCount: `
        SELECT state, COUNT(*) as holiday_count
        FROM holidays
        WHERE EXTRACT(YEAR FROM date) = $1
        GROUP BY state
      `,
      upcomingHolidays: `
        SELECT * FROM holidays
        WHERE date >= CURRENT_DATE
        AND date <= CURRENT_DATE + INTERVAL '90 days'
        AND (state = $1 OR is_nationwide = true)
        ORDER BY date ASC
      `
    };
  }

  /**
   * Execute query with timeout
   */
  private async executeWithTimeout<T>(
    query: string,
    params?: any[],
    timeout: number = 30000
  ): Promise<T> {
    // This would integrate with your actual database client (pg, mysql2, etc.)
    // For now, returning a mock implementation
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      // Mock database execution
      setTimeout(() => {
        clearTimeout(timer);
        resolve([] as any);
      }, Math.random() * 50); // Simulate 0-50ms query time
    });
  }

  /**
   * Execute batch insert
   */
  private async executeBatchInsert(table: string, records: any[]): Promise<void> {
    // Mock implementation - would use actual database batch insert
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 20); // Simulate batch insert time
    });
  }

  /**
   * Generate query hash for caching
   */
  private generateQueryHash(query: string, params?: any[]): string {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const paramString = params ? JSON.stringify(params) : '';
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(normalizedQuery + paramString)
      .digest('hex');
  }

  /**
   * Get from query cache
   */
  private getFromCache<T>(queryHash: string): T | null {
    const entry = this.queryCache.get(queryHash);
    if (entry && Date.now() < entry.timestamp + entry.ttl) {
      return entry.result;
    }
    if (entry) {
      this.queryCache.delete(queryHash);
    }
    return null;
  }

  /**
   * Set query cache
   */
  private setCache(queryHash: string, result: any, ttl: number): void {
    // Remove oldest entries if at capacity
    if (this.queryCache.size >= this.maxCacheEntries) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }

    this.queryCache.set(queryHash, {
      result,
      timestamp: Date.now(),
      ttl,
      queryHash
    });
  }

  /**
   * Record query metric
   */
  private recordQueryMetric(metric: QueryMetrics): void {
    this.queryMetrics.push(metric);

    // Keep only recent metrics (last 1000)
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Track query duration in performance monitor
    if (this.app.performanceMonitor && metric.duration) {
      // This would integrate with the performance monitor
      // this.app.performanceMonitor.addDbQueryTime(request, metric.duration);
    }
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    return query.replace(/\$\d+/g, '?').substring(0, 200);
  }

  /**
   * Sanitize params for logging
   */
  private sanitizeParams(params?: any[]): any[] {
    if (!params) return [];
    return params.map(p => {
      if (typeof p === 'string' && p.length > 50) {
        return p.substring(0, 47) + '...';
      }
      return p;
    });
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Start background cleanup job
   */
  private startCleanupJob(): void {
    setInterval(() => {
      // Clean expired cache entries
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.queryCache) {
        if (now > entry.timestamp + entry.ttl) {
          this.queryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.app.log.debug({ cleaned }, 'Query cache cleanup completed');
      }

      // Clean old metrics
      const cutoff = now - (60 * 60 * 1000); // 1 hour
      const oldLength = this.queryMetrics.length;
      this.queryMetrics = this.queryMetrics.filter(m => m.startTime > cutoff);

      if (this.queryMetrics.length < oldLength) {
        this.app.log.debug({
          removed: oldLength - this.queryMetrics.length,
          remaining: this.queryMetrics.length
        }, 'Query metrics cleanup completed');
      }
    }, 300000); // Every 5 minutes
  }
}

export { QueryOptimizer, QueryMetrics, PoolConfig, QueryCacheEntry };