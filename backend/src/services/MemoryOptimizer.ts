import { FastifyInstance } from 'fastify';
import v8 from 'v8';

/**
 * Memory Management Optimizer
 * Constitutional requirement: Handle 25k concurrent users with optimal memory usage
 * Implements garbage collection optimization, memory leak detection, and German traffic patterns
 */

interface MemoryMetrics {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  gcCount: number;
  gcDuration: number;
}

interface MemoryThresholds {
  heapWarning: number; // MB
  heapCritical: number; // MB
  gcInterval: number; // ms
  maxMemoryPressure: number; // percentage
}

interface GCStats {
  totalGCs: number;
  totalGCTime: number;
  averageGCTime: number;
  lastGCTime: number;
  lastGCDuration: number;
  memoryFreed: number;
}

class MemoryOptimizer {
  private metrics: MemoryMetrics[] = [];
  private gcStats: GCStats = {
    totalGCs: 0,
    totalGCTime: 0,
    averageGCTime: 0,
    lastGCTime: 0,
    lastGCDuration: 0,
    memoryFreed: 0
  };

  private readonly thresholds: MemoryThresholds = {
    heapWarning: 1024, // 1GB
    heapCritical: 2048, // 2GB
    gcInterval: 300000, // 5 minutes
    maxMemoryPressure: 85 // 85%
  };

  private gcTimer?: NodeJS.Timeout;
  private lastMemoryUsage?: NodeJS.MemoryUsage;
  private objectPools = new Map<string, any[]>();

  constructor(private app: FastifyInstance) {
    this.setupMemoryMonitoring();
    this.setupGCOptimization();
    this.setupObjectPools();
    this.setupMemoryLeakDetection();
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): {
    current: NodeJS.MemoryUsage;
    v8Stats: v8.HeapStatistics;
    gcStats: GCStats;
    thresholds: MemoryThresholds;
    pressure: number;
    healthy: boolean;
  } {
    const memUsage = process.memoryUsage();
    const v8Stats = v8.getHeapStatistics();
    const pressure = this.calculateMemoryPressure(memUsage);

    return {
      current: memUsage,
      v8Stats,
      gcStats: { ...this.gcStats },
      thresholds: this.thresholds,
      pressure,
      healthy: this.isMemoryHealthy(memUsage, pressure)
    };
  }

  /**
   * Force garbage collection if needed
   */
  async forceGCIfNeeded(): Promise<boolean> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const pressure = this.calculateMemoryPressure(memUsage);

    // Force GC if memory pressure is high
    if (pressure > this.thresholds.maxMemoryPressure || heapUsedMB > this.thresholds.heapWarning) {
      return this.performGarbageCollection();
    }

    return false;
  }

  /**
   * Optimize for German traffic patterns
   */
  optimizeForGermanTrafficPatterns(): void {
    const currentMonth = new Date().getMonth() + 1;
    const isHighSeason = currentMonth === 12 || currentMonth === 1; // Dec-Jan vacation planning

    if (isHighSeason) {
      // Adjust thresholds for high traffic season
      this.thresholds.heapWarning = 1536; // 1.5GB
      this.thresholds.heapCritical = 3072; // 3GB
      this.thresholds.gcInterval = 180000; // 3 minutes
      this.thresholds.maxMemoryPressure = 80; // More aggressive

      this.app.log.info({
        season: 'high',
        month: currentMonth,
        thresholds: this.thresholds
      }, 'Memory optimization adjusted for German high season');
    } else {
      // Standard thresholds for normal traffic
      this.thresholds.heapWarning = 1024; // 1GB
      this.thresholds.heapCritical = 2048; // 2GB
      this.thresholds.gcInterval = 300000; // 5 minutes
      this.thresholds.maxMemoryPressure = 85; // Standard

      this.app.log.debug({
        season: 'normal',
        month: currentMonth,
        thresholds: this.thresholds
      }, 'Memory optimization set for normal traffic');
    }
  }

  /**
   * Get object from pool or create new
   */
  getFromPool<T>(poolName: string, factory: () => T): T {
    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }

    const pool = this.objectPools.get(poolName)!;
    const obj = pool.pop();

    if (obj) {
      return obj;
    }

    return factory();
  }

  /**
   * Return object to pool
   */
  returnToPool(poolName: string, obj: any): void {
    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }

    const pool = this.objectPools.get(poolName)!;

    // Limit pool size to prevent memory bloat
    if (pool.length < 100) {
      // Reset object properties if it's an object
      if (typeof obj === 'object' && obj !== null) {
        this.resetObject(obj);
      }
      pool.push(obj);
    }
  }

  /**
   * Clear all object pools
   */
  clearObjectPools(): void {
    for (const [poolName, pool] of this.objectPools) {
      pool.length = 0;
      this.app.log.debug({ poolName }, 'Object pool cleared');
    }
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): {
    recommendations: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    immediateActions: string[];
  } {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const pressure = this.calculateMemoryPressure(memUsage);

    const recommendations: string[] = [];
    const immediateActions: string[] = [];
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (heapUsedMB > this.thresholds.heapCritical) {
      priority = 'critical';
      immediateActions.push('Force garbage collection immediately');
      immediateActions.push('Clear all caches');
      immediateActions.push('Restart application if memory continues to grow');
      recommendations.push('Investigate memory leaks');
      recommendations.push('Reduce cache sizes');
    } else if (heapUsedMB > this.thresholds.heapWarning) {
      priority = 'high';
      immediateActions.push('Force garbage collection');
      recommendations.push('Clear old cache entries');
      recommendations.push('Reduce object pool sizes');
    } else if (pressure > 75) {
      priority = 'medium';
      recommendations.push('Schedule garbage collection');
      recommendations.push('Clear expired cache entries');
    }

    if (this.gcStats.averageGCTime > 100) {
      recommendations.push('Optimize garbage collection frequency');
      recommendations.push('Review object lifecycle management');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is optimal');
    }

    return { recommendations, priority, immediateActions };
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    // Monitor memory every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const v8Stats = v8.getHeapStatistics();

      const metric: MemoryMetrics = {
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        arrayBuffers: memUsage.arrayBuffers,
        gcCount: this.gcStats.totalGCs,
        gcDuration: this.gcStats.lastGCDuration
      };

      this.metrics.push(metric);

      // Keep only last hour of metrics
      const cutoff = Date.now() - (60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

      // Check for memory pressure
      this.checkMemoryPressure(memUsage);

      // Log detailed stats every 5 minutes
      if (this.metrics.length % 10 === 0) {
        this.logDetailedMemoryStats(memUsage, v8Stats);
      }

    }, 30000);
  }

  /**
   * Setup garbage collection optimization
   */
  private setupGCOptimization(): void {
    // Schedule periodic GC
    this.gcTimer = setInterval(() => {
      this.performScheduledGC();
    }, this.thresholds.gcInterval);

    // Monitor GC events if available
    if (global.gc) {
      this.app.log.info('Manual garbage collection available');
    } else {
      this.app.log.warn('Manual garbage collection not available. Start with --expose-gc flag for optimal memory management');
    }
  }

  /**
   * Setup object pools for common objects
   */
  private setupObjectPools(): void {
    // Initialize common object pools
    this.objectPools.set('holidayRequest', []);
    this.objectPools.set('bridgeRequest', []);
    this.objectPools.set('cacheEntry', []);
    this.objectPools.set('queryMetric', []);

    this.app.log.debug({
      pools: Array.from(this.objectPools.keys())
    }, 'Object pools initialized');
  }

  /**
   * Setup memory leak detection
   */
  private setupMemoryLeakDetection(): void {
    let baselineMemory: NodeJS.MemoryUsage | null = null;
    let stableReadings = 0;

    // Check for memory leaks every 10 minutes
    setInterval(() => {
      const memUsage = process.memoryUsage();

      if (!baselineMemory) {
        baselineMemory = memUsage;
        return;
      }

      const heapGrowth = memUsage.heapUsed - baselineMemory.heapUsed;
      const heapGrowthMB = heapGrowth / 1024 / 1024;

      // If heap keeps growing without GC reducing it, potential leak
      if (heapGrowthMB > 100) { // 100MB growth
        this.app.log.warn({
          baselineHeapMB: Math.round(baselineMemory.heapUsed / 1024 / 1024),
          currentHeapMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          growthMB: Math.round(heapGrowthMB),
          stableReadings
        }, 'Potential memory leak detected');

        // Force GC and re-baseline
        this.performGarbageCollection();
        setTimeout(() => {
          baselineMemory = process.memoryUsage();
          stableReadings = 0;
        }, 5000);
      } else if (Math.abs(heapGrowthMB) < 10) {
        // Memory is stable
        stableReadings++;
        if (stableReadings >= 3) {
          // Update baseline after 3 stable readings
          baselineMemory = memUsage;
          stableReadings = 0;
        }
      }
    }, 600000); // Every 10 minutes
  }

  /**
   * Perform garbage collection
   */
  private performGarbageCollection(): boolean {
    if (!global.gc) {
      this.app.log.debug('Garbage collection not available');
      return false;
    }

    const beforeMemory = process.memoryUsage();
    const startTime = Date.now();

    try {
      global.gc();

      const afterMemory = process.memoryUsage();
      const duration = Date.now() - startTime;
      const memoryFreed = beforeMemory.heapUsed - afterMemory.heapUsed;

      // Update GC stats
      this.gcStats.totalGCs++;
      this.gcStats.totalGCTime += duration;
      this.gcStats.averageGCTime = this.gcStats.totalGCTime / this.gcStats.totalGCs;
      this.gcStats.lastGCTime = startTime;
      this.gcStats.lastGCDuration = duration;
      this.gcStats.memoryFreed += memoryFreed;

      this.app.log.debug({
        duration,
        memoryFreedMB: Math.round(memoryFreed / 1024 / 1024),
        heapBeforeMB: Math.round(beforeMemory.heapUsed / 1024 / 1024),
        heapAfterMB: Math.round(afterMemory.heapUsed / 1024 / 1024)
      }, 'Garbage collection completed');

      return true;

    } catch (error) {
      this.app.log.error({ error: error.message }, 'Garbage collection failed');
      return false;
    }
  }

  /**
   * Perform scheduled garbage collection
   */
  private performScheduledGC(): void {
    const memUsage = process.memoryUsage();
    const pressure = this.calculateMemoryPressure(memUsage);

    // Only perform scheduled GC if memory pressure is moderate to high
    if (pressure > 60) {
      this.app.log.debug({
        pressure,
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024)
      }, 'Performing scheduled garbage collection');

      this.performGarbageCollection();
    }
  }

  /**
   * Calculate memory pressure percentage
   */
  private calculateMemoryPressure(memUsage: NodeJS.MemoryUsage): number {
    return (memUsage.heapUsed / memUsage.heapTotal) * 100;
  }

  /**
   * Check if memory usage is healthy
   */
  private isMemoryHealthy(memUsage: NodeJS.MemoryUsage, pressure: number): boolean {
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    return heapUsedMB < this.thresholds.heapWarning && pressure < this.thresholds.maxMemoryPressure;
  }

  /**
   * Check memory pressure and take action
   */
  private checkMemoryPressure(memUsage: NodeJS.MemoryUsage): void {
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const pressure = this.calculateMemoryPressure(memUsage);

    if (heapUsedMB > this.thresholds.heapCritical) {
      this.app.log.error({
        heapUsedMB: Math.round(heapUsedMB),
        pressure: Math.round(pressure),
        threshold: this.thresholds.heapCritical
      }, 'CRITICAL: Memory usage exceeds critical threshold');

      // Emergency GC
      this.performGarbageCollection();
      this.clearObjectPools();

    } else if (heapUsedMB > this.thresholds.heapWarning) {
      this.app.log.warn({
        heapUsedMB: Math.round(heapUsedMB),
        pressure: Math.round(pressure),
        threshold: this.thresholds.heapWarning
      }, 'WARNING: Memory usage exceeds warning threshold');

      // Preemptive GC
      this.performGarbageCollection();
    }
  }

  /**
   * Log detailed memory statistics
   */
  private logDetailedMemoryStats(memUsage: NodeJS.MemoryUsage, v8Stats: v8.HeapStatistics): void {
    this.app.log.info({
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024)
      },
      v8: {
        totalHeapSizeMB: Math.round(v8Stats.total_heap_size / 1024 / 1024),
        usedHeapSizeMB: Math.round(v8Stats.used_heap_size / 1024 / 1024),
        heapSizeLimitMB: Math.round(v8Stats.heap_size_limit / 1024 / 1024)
      },
      gc: {
        totalGCs: this.gcStats.totalGCs,
        averageGCTime: Math.round(this.gcStats.averageGCTime),
        lastGCDuration: this.gcStats.lastGCDuration
      },
      objectPools: {
        totalPools: this.objectPools.size,
        totalObjects: Array.from(this.objectPools.values()).reduce((sum, pool) => sum + pool.length, 0)
      }
    }, 'Detailed memory statistics');
  }

  /**
   * Reset object properties for pool reuse
   */
  private resetObject(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          delete obj[key];
        }
      }
    }
  }
}

export { MemoryOptimizer, MemoryMetrics, MemoryThresholds, GCStats };