import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Performance monitoring middleware
 * Constitutional requirement: <100ms response times
 * Implements comprehensive performance tracking and alerting
 */

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  statusCode?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  isSlowRequest?: boolean;
  cacheHit?: boolean;
  dbQueryTime?: number;
  redisQueryTime?: number;
}

interface PerformanceStats {
  totalRequests: number;
  slowRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  memoryPressure: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsHistory = 10000;
  private readonly slowRequestThreshold = 100; // 100ms constitutional requirement
  private readonly criticalThreshold = 200; // Alert at 200ms
  private stats: PerformanceStats = {
    totalRequests: 0,
    slowRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    throughput: 0,
    memoryPressure: 0
  };

  constructor(private app: FastifyInstance) {
    // Start background stats calculation
    this.startStatsCalculation();
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Record request start metrics
   */
  recordRequestStart(request: FastifyRequest): PerformanceMetrics {
    const startCpuUsage = process.cpuUsage();
    const startMemory = process.memoryUsage();

    const metric: PerformanceMetrics = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      startTime: Date.now(),
      memoryUsage: startMemory,
      cpuUsage: startCpuUsage
    };

    // Store for completion tracking
    (request as any).performanceMetric = metric;

    return metric;
  }

  /**
   * Record request completion metrics
   */
  recordRequestEnd(request: FastifyRequest, reply: FastifyReply): PerformanceMetrics {
    const endTime = Date.now();
    const metric = (request as any).performanceMetric as PerformanceMetrics;

    if (!metric) {
      this.app.log.warn({ requestId: request.id }, 'Performance metric not found for request');
      return this.createDefaultMetric(request, reply, endTime);
    }

    // Calculate final metrics
    metric.endTime = endTime;
    metric.responseTime = endTime - metric.startTime;
    metric.statusCode = reply.statusCode;
    metric.isSlowRequest = metric.responseTime > this.slowRequestThreshold;

    // CPU usage delta
    const endCpuUsage = process.cpuUsage(metric.cpuUsage);
    metric.cpuUsage = endCpuUsage;

    // Memory usage at end
    const endMemory = process.memoryUsage();
    metric.memoryUsage = endMemory;

    // Check for performance violations
    this.checkPerformanceViolations(metric);

    // Store metric
    this.addMetric(metric);

    return metric;
  }

  /**
   * Add database query time to current request
   */
  addDbQueryTime(request: FastifyRequest, queryTime: number): void {
    const metric = (request as any).performanceMetric as PerformanceMetrics;
    if (metric) {
      metric.dbQueryTime = (metric.dbQueryTime || 0) + queryTime;
    }
  }

  /**
   * Add Redis query time to current request
   */
  addRedisQueryTime(request: FastifyRequest, queryTime: number): void {
    const metric = (request as any).performanceMetric as PerformanceMetrics;
    if (metric) {
      metric.redisQueryTime = (metric.redisQueryTime || 0) + queryTime;
    }
  }

  /**
   * Mark cache hit for current request
   */
  markCacheHit(request: FastifyRequest): void {
    const metric = (request as any).performanceMetric as PerformanceMetrics;
    if (metric) {
      metric.cacheHit = true;
    }
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Get recent slow requests
   */
  getSlowRequests(limit = 50): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.isSlowRequest)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, limit);
  }

  /**
   * Check for constitutional performance violations
   */
  private checkPerformanceViolations(metric: PerformanceMetrics): void {
    const { responseTime, requestId, method, url } = metric;

    if (!responseTime) return;

    // Constitutional violation: >100ms response time
    if (responseTime > this.slowRequestThreshold) {
      this.app.log.warn({
        requestId,
        method,
        url,
        responseTime,
        constitutionalViolation: true,
        severity: responseTime > this.criticalThreshold ? 'critical' : 'warning'
      }, 'Constitutional performance requirement violation: Response time >100ms');

      // Critical alert for very slow requests
      if (responseTime > this.criticalThreshold) {
        this.app.log.error({
          requestId,
          method,
          url,
          responseTime,
          memoryUsage: metric.memoryUsage,
          cpuUsage: metric.cpuUsage,
          dbQueryTime: metric.dbQueryTime,
          redisQueryTime: metric.redisQueryTime,
          cacheHit: metric.cacheHit
        }, 'CRITICAL: Response time exceeds 200ms - immediate attention required');
      }
    }

    // Memory pressure warning
    if (metric.memoryUsage && metric.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      this.app.log.warn({
        requestId,
        memoryUsage: metric.memoryUsage,
        heapUsedMB: Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)
      }, 'High memory usage detected');
    }
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Trim old metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Update counters
    this.stats.totalRequests++;
    if (metric.isSlowRequest) {
      this.stats.slowRequests++;
    }
  }

  /**
   * Create default metric for error cases
   */
  private createDefaultMetric(request: FastifyRequest, reply: FastifyReply, endTime: number): PerformanceMetrics {
    return {
      requestId: request.id,
      method: request.method,
      url: request.url,
      startTime: endTime, // Unknown start time
      endTime,
      responseTime: 0,
      statusCode: reply.statusCode,
      isSlowRequest: false
    };
  }

  /**
   * Calculate performance statistics
   */
  private calculateStats(): void {
    const recentMetrics = this.metrics.filter(m =>
      m.endTime && m.endTime > Date.now() - 60000 // Last minute
    );

    if (recentMetrics.length === 0) {
      return;
    }

    const responseTimes = recentMetrics
      .map(m => m.responseTime)
      .filter(rt => rt !== undefined)
      .sort((a, b) => a - b) as number[];

    if (responseTimes.length > 0) {
      // Average response time
      this.stats.averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;

      // Percentiles
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);
      this.stats.p95ResponseTime = responseTimes[p95Index] || 0;
      this.stats.p99ResponseTime = responseTimes[p99Index] || 0;

      // Throughput (requests per second)
      this.stats.throughput = recentMetrics.length / 60;

      // Error rate
      const errorRequests = recentMetrics.filter(m => m.statusCode && m.statusCode >= 400);
      this.stats.errorRate = (errorRequests.length / recentMetrics.length) * 100;
    }

    // Memory pressure
    const memoryUsage = process.memoryUsage();
    this.stats.memoryPressure = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  }

  /**
   * Start background statistics calculation
   */
  private startStatsCalculation(): void {
    setInterval(() => {
      this.calculateStats();
    }, 10000); // Every 10 seconds
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

      // Log memory stats
      this.app.log.debug({
        heapUsedMB,
        heapTotalMB,
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        externalMB: Math.round(memoryUsage.external / 1024 / 1024),
        memoryPressure: this.stats.memoryPressure
      }, 'Memory usage statistics');

      // Alert on high memory usage
      if (heapUsedMB > 1024) { // 1GB
        this.app.log.warn({
          heapUsedMB,
          heapTotalMB,
          memoryPressure: this.stats.memoryPressure
        }, 'High memory usage - consider garbage collection');
      }
    }, 30000); // Every 30 seconds
  }
}

/**
 * Performance monitoring plugin
 */
async function performancePlugin(fastify: FastifyInstance): Promise<void> {
  const monitor = new PerformanceMonitor(fastify);

  // Add performance monitor to fastify instance
  fastify.decorate('performanceMonitor', monitor);

  // Request start hook
  fastify.addHook('onRequest', async (request) => {
    monitor.recordRequestStart(request);
  });

  // Response end hook
  fastify.addHook('onResponse', async (request, reply) => {
    const metric = monitor.recordRequestEnd(request, reply);

    // Add performance headers
    reply.header('X-Response-Time', metric.responseTime?.toString() || '0');
    reply.header('X-Performance-Score', metric.isSlowRequest ? 'SLOW' : 'FAST');
  });

  // Performance metrics endpoint
  fastify.get('/performance/metrics', {
    schema: {
      description: 'Get performance metrics and statistics',
      tags: ['performance'],
      response: {
        200: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                slowRequests: { type: 'number' },
                averageResponseTime: { type: 'number' },
                p95ResponseTime: { type: 'number' },
                p99ResponseTime: { type: 'number' },
                errorRate: { type: 'number' },
                throughput: { type: 'number' },
                memoryPressure: { type: 'number' }
              }
            },
            constitutional: {
              type: 'object',
              properties: {
                responseTimeTarget: { type: 'number' },
                compliance: { type: 'boolean' },
                violationRate: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async () => {
    const stats = monitor.getStats();
    const violationRate = stats.totalRequests > 0 ? (stats.slowRequests / stats.totalRequests) * 100 : 0;

    return {
      stats,
      constitutional: {
        responseTimeTarget: 100, // ms
        compliance: stats.p95ResponseTime <= 100,
        violationRate
      }
    };
  });

  // Slow requests endpoint
  fastify.get('/performance/slow-requests', {
    schema: {
      description: 'Get recent slow requests for analysis',
      tags: ['performance'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50, minimum: 1, maximum: 200 }
        }
      }
    }
  }, async (request) => {
    const { limit = 50 } = request.query as { limit?: number };
    return monitor.getSlowRequests(limit);
  });

  // Performance health check
  fastify.get('/performance/health', async () => {
    const stats = monitor.getStats();
    const isHealthy = stats.p95ResponseTime <= 100 && stats.errorRate < 5;

    return {
      healthy: isHealthy,
      responseTime: {
        average: stats.averageResponseTime,
        p95: stats.p95ResponseTime,
        p99: stats.p99ResponseTime,
        target: 100,
        compliance: stats.p95ResponseTime <= 100
      },
      throughput: stats.throughput,
      errorRate: stats.errorRate,
      memoryPressure: stats.memoryPressure
    };
  });
}

// Extend Fastify instance type
declare module 'fastify' {
  interface FastifyInstance {
    performanceMonitor: PerformanceMonitor;
  }
}

export default fp(performancePlugin, {
  name: 'performance-monitoring',
  dependencies: []
});

export { PerformanceMonitor, PerformanceMetrics, PerformanceStats };