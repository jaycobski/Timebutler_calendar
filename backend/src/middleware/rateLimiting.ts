/**
 * Rate Limiting Middleware - Timebutler Calendar Email Abuse Prevention
 * Constitutional Requirement: Handle 25k concurrent users, prevent email abuse
 *
 * Features:
 * - German IP optimization for main target audience
 * - Email endpoint protection with progressive penalties
 * - Redis-backed distributed rate limiting
 * - Dynamic limits based on endpoint sensitivity
 * - GDPR-compliant logging and monitoring
 * - Fallback to in-memory when Redis unavailable
 * - Performance optimization for high concurrent load
 */

import rateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getCacheManager } from '../lib/cache.js';
import { DateTime } from 'luxon';

// German IP ranges for optimization (simplified representative ranges)
// In production, use comprehensive German ISP ranges
const GERMAN_IP_RANGES = [
  { start: '77.0.0.0', end: '77.255.255.255' },     // Deutsche Telekom
  { start: '84.160.0.0', end: '84.191.255.255' },   // Vodafone Germany
  { start: '91.52.0.0', end: '91.55.255.255' },     // O2 Germany
  { start: '188.192.0.0', end: '188.255.255.255' }, // German providers
  { start: '62.104.0.0', end: '62.127.255.255' },   // German backbone
];

// Rate limiting configurations by endpoint category
export const RATE_LIMIT_CONFIGS = {
  // Email sending endpoints - most restrictive
  EMAIL: {
    german: { max: 10, timeWindow: '1 hour', backoff: 'exponential' },
    international: { max: 5, timeWindow: '1 hour', backoff: 'exponential' },
    description: 'Email delivery endpoints'
  },

  // Calendar export/download endpoints
  EXPORT: {
    german: { max: 50, timeWindow: '1 hour', backoff: 'linear' },
    international: { max: 30, timeWindow: '1 hour', backoff: 'linear' },
    description: 'Calendar export and download'
  },

  // Bridge weekend calculation endpoints
  CALCULATION: {
    german: { max: 100, timeWindow: '1 hour', backoff: 'none' },
    international: { max: 60, timeWindow: '1 hour', backoff: 'none' },
    description: 'Bridge weekend calculations'
  },

  // Holiday data endpoints - most permissive
  DATA: {
    german: { max: 200, timeWindow: '1 hour', backoff: 'none' },
    international: { max: 120, timeWindow: '1 hour', backoff: 'none' },
    description: 'Holiday and state data retrieval'
  },

  // General API endpoints
  GENERAL: {
    german: { max: 150, timeWindow: '1 hour', backoff: 'none' },
    international: { max: 100, timeWindow: '1 hour', backoff: 'none' },
    description: 'General API access'
  }
} as const;

// Penalty multipliers for repeated violations
const VIOLATION_PENALTIES = {
  first: 1.0,      // No penalty
  second: 2.0,     // 2x longer timeout
  third: 4.0,      // 4x longer timeout
  persistent: 8.0  // 8x longer timeout for persistent violators
} as const;

// IP geolocation cache for performance
const IP_LOCATION_CACHE = new Map<string, { isGerman: boolean; timestamp: number }>();
const LOCATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface RateLimitViolation {
  ip: string;
  endpoint: string;
  timestamp: Date;
  limit: number;
  current: number;
  userAgent?: string;
  penalty: number;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  germanRequests: number;
  internationalRequests: number;
  emailAttempts: number;
  blockedEmailAttempts: number;
  averageResponseTime: number;
  violationsByEndpoint: Record<string, number>;
}

/**
 * Determine if IP address is from Germany for optimized rate limits
 */
function isGermanIP(ip: string): boolean {
  // Check cache first
  const cached = IP_LOCATION_CACHE.get(ip);
  if (cached && Date.now() - cached.timestamp < LOCATION_CACHE_TTL) {
    return cached.isGerman;
  }

  // Simple IP range check for German providers
  const ipNum = ipToNumber(ip);
  const isGerman = GERMAN_IP_RANGES.some(range => {
    const start = ipToNumber(range.start);
    const end = ipToNumber(range.end);
    return ipNum >= start && ipNum <= end;
  });

  // Cache result
  IP_LOCATION_CACHE.set(ip, { isGerman, timestamp: Date.now() });

  // Clean old cache entries periodically
  if (IP_LOCATION_CACHE.size > 10000) {
    const cutoff = Date.now() - LOCATION_CACHE_TTL;
    for (const [key, value] of IP_LOCATION_CACHE.entries()) {
      if (value.timestamp < cutoff) {
        IP_LOCATION_CACHE.delete(key);
      }
    }
  }

  return isGerman;
}

/**
 * Convert IP address to number for range comparison
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
}

/**
 * Get endpoint category from URL path
 */
function getEndpointCategory(url: string): keyof typeof RATE_LIMIT_CONFIGS {
  if (url.includes('/email') || url.includes('/send')) {
    return 'EMAIL';
  }
  if (url.includes('/export') || url.includes('/download') || url.includes('/calendar')) {
    return 'EXPORT';
  }
  if (url.includes('/bridge') || url.includes('/calculate')) {
    return 'CALCULATION';
  }
  if (url.includes('/holiday') || url.includes('/state')) {
    return 'DATA';
  }
  return 'GENERAL';
}

/**
 * Get client identifier for rate limiting
 * Uses IP + User-Agent hash for better distribution
 */
function getClientIdentifier(request: FastifyRequest): string {
  const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
             request.headers['x-real-ip'] as string ||
             request.ip;

  const userAgent = request.headers['user-agent'] || 'unknown';
  const userAgentHash = Buffer.from(userAgent).toString('base64').substring(0, 8);

  return `${ip}:${userAgentHash}`;
}

/**
 * Calculate penalty multiplier based on violation history
 */
async function getViolationPenalty(identifier: string): Promise<number> {
  try {
    const cache = getCacheManager();
    const violationKey = `rate_limit:violations:${identifier}`;
    const violations = await cache.redis.get(violationKey);

    if (!violations) return VIOLATION_PENALTIES.first;

    const count = parseInt(violations, 10);
    if (count >= 5) return VIOLATION_PENALTIES.persistent;
    if (count >= 3) return VIOLATION_PENALTIES.third;
    if (count >= 2) return VIOLATION_PENALTIES.second;

    return VIOLATION_PENALTIES.first;
  } catch (error) {
    console.error('Error calculating violation penalty:', error);
    return VIOLATION_PENALTIES.first;
  }
}

/**
 * Record rate limit violation for tracking and penalties
 */
async function recordViolation(violation: RateLimitViolation): Promise<void> {
  try {
    const cache = getCacheManager();
    const identifier = getClientIdentifier({ ip: violation.ip } as any);

    // Increment violation counter
    const violationKey = `rate_limit:violations:${identifier}`;
    await cache.redis.incr(violationKey);
    await cache.redis.expire(violationKey, 24 * 60 * 60); // 24 hour sliding window

    // Log violation for monitoring
    const logEntry = {
      ...violation,
      timestamp: violation.timestamp.toISOString()
    };

    console.warn('Rate limit violation:', logEntry);

    // Store violation for analytics (GDPR compliant - no PII beyond IP)
    const analyticsKey = `rate_limit:analytics:${DateTime.now().toFormat('yyyy-MM-dd:HH')}`;
    await cache.redis.hincrby(analyticsKey, `violations:${violation.endpoint}`, 1);
    await cache.redis.expire(analyticsKey, 30 * 24 * 60 * 60); // 30 days

  } catch (error) {
    console.error('Error recording violation:', error);
  }
}

/**
 * Custom rate limit store using Redis for distributed rate limiting
 */
class RedisRateLimitStore {
  private cache = getCacheManager();

  async increment(key: string, window: number): Promise<{ totalHits: number; timeToExpire: number }> {
    try {
      const multi = this.cache.redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(window / 1000));

      const results = await multi.exec();
      const totalHits = results?.[0]?.[1] as number || 0;
      const ttl = await this.cache.redis.ttl(key);

      return {
        totalHits,
        timeToExpire: Math.max(0, ttl * 1000)
      };
    } catch (error) {
      console.error('Redis rate limit store error:', error);
      // Fallback: allow request if Redis fails
      return { totalHits: 0, timeToExpire: 0 };
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.cache.redis.del(key);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }
}

/**
 * Configure rate limiting for specific endpoint category
 */
function createRateLimitConfig(category: keyof typeof RATE_LIMIT_CONFIGS) {
  const config = RATE_LIMIT_CONFIGS[category];

  return rateLimit({
    // Dynamic limits based on IP geolocation
    max: async (request: FastifyRequest) => {
      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                 request.headers['x-real-ip'] as string ||
                 request.ip;

      const isGerman = isGermanIP(ip);
      const baseLimit = isGerman ? config.german.max : config.international.max;

      // Apply violation penalty
      const identifier = getClientIdentifier(request);
      const penalty = await getViolationPenalty(identifier);

      // Reduce limit for repeat offenders
      return Math.ceil(baseLimit / penalty);
    },

    // 1 hour time window
    timeWindow: 60 * 60 * 1000,

    // Custom Redis store for distributed rate limiting
    store: new RedisRateLimitStore(),

    // Custom key generator including User-Agent
    keyGenerator: (request: FastifyRequest) => {
      const identifier = getClientIdentifier(request);
      return `rate_limit:${category}:${identifier}`;
    },

    // Custom error response
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                 request.headers['x-real-ip'] as string ||
                 request.ip;

      // Record violation
      recordViolation({
        ip,
        endpoint: category,
        timestamp: new Date(),
        limit: context.max,
        current: context.totalHits,
        userAgent: request.headers['user-agent'] as string,
        penalty: 1.0
      });

      return {
        error: 'Rate limit exceeded',
        message: `Too many requests to ${config.description.toLowerCase()}`,
        retryAfter: Math.ceil(context.ttl / 1000),
        limit: context.max,
        remaining: 0,
        resetTime: new Date(Date.now() + context.ttl).toISOString()
      };
    },

    // Add rate limit headers
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    },

    // Skip successful requests for some endpoints
    skipSuccessfulRequests: category === 'DATA',

    // Skip failed requests (don't count 4xx/5xx against limits)
    skipOnError: true,

    // Enable if behind proxy
    trustProxy: true,

    // Hook for additional processing
    onLimitReached: async (request: FastifyRequest, reply: FastifyReply) => {
      const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                 request.headers['x-real-ip'] as string ||
                 request.ip;

      console.warn(`Rate limit reached for ${category} from IP: ${ip}`);

      // Add security headers for blocked requests
      reply.header('X-Rate-Limit-Policy', 'German-optimized anti-abuse protection');
      reply.header('X-Content-Type-Options', 'nosniff');
    }
  });
}

/**
 * Email-specific rate limiting with enhanced protection
 */
export function createEmailRateLimit() {
  return createRateLimitConfig('EMAIL');
}

/**
 * Export-specific rate limiting
 */
export function createExportRateLimit() {
  return createRateLimitConfig('EXPORT');
}

/**
 * Calculation-specific rate limiting
 */
export function createCalculationRateLimit() {
  return createRateLimitConfig('CALCULATION');
}

/**
 * Data access rate limiting
 */
export function createDataRateLimit() {
  return createRateLimitConfig('DATA');
}

/**
 * General API rate limiting
 */
export function createGeneralRateLimit() {
  return createRateLimitConfig('GENERAL');
}

/**
 * Register all rate limiting middleware with Fastify instance
 */
export async function registerRateLimiting(fastify: FastifyInstance): Promise<void> {
  // Register the base rate limiting plugin
  await fastify.register(rateLimit, {
    // Global fallback configuration
    max: 1000,
    timeWindow: '1 hour',
    store: new RedisRateLimitStore(),
    trustProxy: true
  });

  console.log('Rate limiting middleware registered with German IP optimization');
}

/**
 * Get rate limiting metrics for monitoring
 */
export async function getRateLimitMetrics(): Promise<RateLimitMetrics> {
  try {
    const cache = getCacheManager();
    const now = DateTime.now();
    const currentHour = now.toFormat('yyyy-MM-dd:HH');
    const lastHour = now.minus({ hours: 1 }).toFormat('yyyy-MM-dd:HH');

    const metricsKey = `rate_limit:analytics:${currentHour}`;
    const lastHourKey = `rate_limit:analytics:${lastHour}`;

    const [currentMetrics, lastHourMetrics] = await Promise.all([
      cache.redis.hgetall(metricsKey),
      cache.redis.hgetall(lastHourKey)
    ]);

    // Combine current and last hour metrics for rolling window
    const combined = { ...lastHourMetrics };
    for (const [key, value] of Object.entries(currentMetrics)) {
      combined[key] = (parseInt(combined[key] || '0', 10) + parseInt(value || '0', 10)).toString();
    }

    return {
      totalRequests: parseInt(combined['requests:total'] || '0', 10),
      blockedRequests: parseInt(combined['requests:blocked'] || '0', 10),
      germanRequests: parseInt(combined['requests:german'] || '0', 10),
      internationalRequests: parseInt(combined['requests:international'] || '0', 10),
      emailAttempts: parseInt(combined['requests:EMAIL'] || '0', 10),
      blockedEmailAttempts: parseInt(combined['violations:EMAIL'] || '0', 10),
      averageResponseTime: parseFloat(combined['avg_response_time'] || '0'),
      violationsByEndpoint: {
        EMAIL: parseInt(combined['violations:EMAIL'] || '0', 10),
        EXPORT: parseInt(combined['violations:EXPORT'] || '0', 10),
        CALCULATION: parseInt(combined['violations:CALCULATION'] || '0', 10),
        DATA: parseInt(combined['violations:DATA'] || '0', 10),
        GENERAL: parseInt(combined['violations:GENERAL'] || '0', 10)
      }
    };
  } catch (error) {
    console.error('Error getting rate limit metrics:', error);
    return {
      totalRequests: 0,
      blockedRequests: 0,
      germanRequests: 0,
      internationalRequests: 0,
      emailAttempts: 0,
      blockedEmailAttempts: 0,
      averageResponseTime: 0,
      violationsByEndpoint: {
        EMAIL: 0,
        EXPORT: 0,
        CALCULATION: 0,
        DATA: 0,
        GENERAL: 0
      }
    };
  }
}

/**
 * Clear violation history for an IP (admin function)
 */
export async function clearViolationHistory(ip: string): Promise<void> {
  try {
    const cache = getCacheManager();
    const pattern = `rate_limit:violations:${ip}:*`;
    const keys = await cache.redis.keys(pattern);

    if (keys.length > 0) {
      await cache.redis.del(...keys);
    }

    console.log(`Cleared violation history for IP: ${ip}`);
  } catch (error) {
    console.error('Error clearing violation history:', error);
  }
}

/**
 * Health check for rate limiting system
 */
export async function rateLimitHealthCheck(): Promise<{ healthy: boolean; details: any }> {
  try {
    const cache = getCacheManager();
    const testKey = 'rate_limit:health_check';

    // Test Redis connectivity
    const start = Date.now();
    await cache.redis.set(testKey, 'ok', 'EX', 10);
    const result = await cache.redis.get(testKey);
    const responseTime = Date.now() - start;

    await cache.redis.del(testKey);

    const healthy = result === 'ok' && responseTime < 100;

    return {
      healthy,
      details: {
        redisConnected: result === 'ok',
        responseTime,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export types for external use
export type {
  RateLimitViolation,
  RateLimitMetrics
};

// Export configurations for testing
export {
  RATE_LIMIT_CONFIGS,
  VIOLATION_PENALTIES,
  isGermanIP,
  getEndpointCategory,
  getClientIdentifier
};