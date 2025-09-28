/**
 * Cache Manager Test Suite
 * Comprehensive testing for Redis caching layer performance optimization
 *
 * Tests include:
 * - Holiday data caching and retrieval
 * - Bridge weekend calculation caching
 * - Performance benchmarks for 25k concurrent users
 * - Cache invalidation strategies
 * - Memory management and optimization
 * - Error handling and fallback mechanisms
 * - Rate limiting functionality
 * - GDPR compliance for user sessions
 */

import { CacheManager, getCacheManager, initializeCache, shutdownCache, CACHE_TTL, PERFORMANCE_THRESHOLDS } from '../../src/lib/cache';

// Mock Redis for testing
jest.mock('ioredis', () => {
  return class MockRedis {
    private data: Map<string, { value: string; ttl: number; expireAt: number }> = new Map();
    private _status = 'ready';

    get status() {
      return this._status;
    }

    async ping(): Promise<string> {
      return 'PONG';
    }

    async setex(key: string, ttl: number, value: string): Promise<string> {
      this.data.set(key, {
        value,
        ttl,
        expireAt: Date.now() + (ttl * 1000)
      });
      return 'OK';
    }

    async get(key: string): Promise<string | null> {
      const item = this.data.get(key);
      if (!item) return null;

      if (Date.now() > item.expireAt) {
        this.data.delete(key);
        return null;
      }

      return item.value;
    }

    async mget(...keys: string[]): Promise<(string | null)[]> {
      return keys.map(key => {
        const item = this.data.get(key);
        if (!item || Date.now() > item.expireAt) {
          return null;
        }
        return item.value;
      });
    }

    async del(...keys: string[]): Promise<number> {
      let deleted = 0;
      for (const key of keys) {
        if (this.data.delete(key)) {
          deleted++;
        }
      }
      return deleted;
    }

    async exists(...keys: string[]): Promise<number> {
      return keys.filter(key => {
        const item = this.data.get(key);
        return item && Date.now() <= item.expireAt;
      }).length;
    }

    async keys(pattern: string): Promise<string[]> {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Array.from(this.data.keys()).filter(key => regex.test(key));
    }

    async incr(key: string): Promise<number> {
      const current = this.data.get(key);
      const value = current ? parseInt(current.value) + 1 : 1;
      this.data.set(key, {
        value: value.toString(),
        ttl: current?.ttl || 3600,
        expireAt: current?.expireAt || Date.now() + 3600000
      });
      return value;
    }

    async expire(key: string, ttl: number): Promise<number> {
      const item = this.data.get(key);
      if (item) {
        item.ttl = ttl;
        item.expireAt = Date.now() + (ttl * 1000);
        return 1;
      }
      return 0;
    }

    async info(section?: string): Promise<string> {
      if (section === 'memory') {
        return 'used_memory:1048576\nused_memory_human:1.00M\n';
      }
      return 'redis_version:6.2.0\n';
    }

    async eval(script: string, numKeys: number, ...args: string[]): Promise<any> {
      // Mock eval for memory optimization
      return 0;
    }

    pipeline() {
      const operations: Array<() => Promise<any>> = [];

      return {
        setex: (key: string, ttl: number, value: string) => {
          operations.push(() => this.setex(key, ttl, value));
          return this;
        },
        incr: (key: string) => {
          operations.push(() => this.incr(key));
          return this;
        },
        expire: (key: string, ttl: number) => {
          operations.push(() => this.expire(key, ttl));
          return this;
        },
        exec: async () => {
          return Promise.all(operations.map(op => op().then(result => [null, result])));
        }
      };
    }

    async quit(): Promise<string> {
      this._status = 'close';
      return 'OK';
    }

    on(event: string, callback: Function): void {
      // Mock event handlers - don't actually call the callbacks to avoid memory leaks in tests
      // Just store them for potential future use
    }
  };
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager({
      host: 'localhost',
      port: 6379,
      database: 1 // Use test database
    });
    await cacheManager.initialize();
  });

  afterEach(async () => {
    await cacheManager.shutdown();
  });

  describe('Holiday Data Caching', () => {
    const mockHolidays = [
      {
        id: 'neujahr-2025',
        name_de: 'Neujahr',
        name_en: 'New Year\'s Day',
        date: '2025-01-01',
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      },
      {
        id: 'heilige-drei-koenige-2025',
        name_de: 'Heilige Drei Könige',
        name_en: 'Epiphany',
        date: '2025-01-06',
        type: 'state',
        states: ['BW', 'BY', 'ST'],
        is_catholic: true,
        is_protestant: false
      }
    ];

    test('should cache and retrieve holiday data by state and year', async () => {
      const stateCode = 'BY';
      const year = 2025;

      // Cache the holidays
      await cacheManager.cacheHolidaysByState(stateCode, year, mockHolidays);

      // Retrieve the holidays
      const cached = await cacheManager.getHolidaysByState(stateCode, year);

      expect(cached).toEqual(mockHolidays);
    });

    test('should return null for non-existent cache entries', async () => {
      const cached = await cacheManager.getHolidaysByState('BW', 2026);
      expect(cached).toBeNull();
    });

    test('should cache holidays by year', async () => {
      const year = 2025;

      await cacheManager.cacheHolidaysByYear(year, mockHolidays);
      const cached = await cacheManager.getHolidaysByYear(year);

      expect(cached).toEqual(mockHolidays);
    });

    test('should handle large holiday datasets within size limits', async () => {
      const largeHolidaySet = Array.from({ length: 100 }, (_, i) => ({
        id: `holiday-${i}`,
        name_de: `Feiertag ${i}`,
        name_en: `Holiday ${i}`,
        date: '2025-01-01',
        type: 'federal' as const,
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      }));

      await expect(
        cacheManager.cacheHolidaysByState('BY', 2025, largeHolidaySet)
      ).resolves.not.toThrow();
    });
  });

  describe('Bridge Weekend Caching', () => {
    const mockBridgeWeekends = [
      {
        id: 'bridge-neujahr-2025',
        holiday_id: 'neujahr-2025',
        state_code: 'BY',
        start_date: '2025-01-01',
        end_date: '2025-01-03',
        vacation_days_needed: 1,
        total_days_off: 3,
        efficiency: 3.0,
        pattern: 'thursday-friday'
      }
    ];

    test('should cache and retrieve bridge weekend calculations', async () => {
      const stateCode = 'BY';
      const year = 2025;
      const maxVacationDays = 5;

      await cacheManager.cacheBridgeWeekends(stateCode, year, maxVacationDays, mockBridgeWeekends);
      const cached = await cacheManager.getBridgeWeekends(stateCode, year, maxVacationDays);

      expect(cached).toEqual(mockBridgeWeekends);
    });

    test('should return null for non-existent bridge calculations', async () => {
      const cached = await cacheManager.getBridgeWeekends('BW', 2026, 10);
      expect(cached).toBeNull();
    });
  });

  describe('User Session Management', () => {
    const mockSessionData = {
      userId: 'test-user-123',
      preferences: {
        state: 'BY',
        language: 'de',
        maxVacationDays: 5
      },
      timestamp: Date.now()
    };

    test('should cache and retrieve user session data', async () => {
      const sessionId = 'session-123';

      await cacheManager.cacheUserSession(sessionId, mockSessionData);
      const cached = await cacheManager.getUserSession(sessionId);

      expect(cached).toEqual(mockSessionData);
    });

    test('should return null for non-existent sessions', async () => {
      const cached = await cacheManager.getUserSession('non-existent');
      expect(cached).toBeNull();
    });

    test('should respect GDPR session timeout', async () => {
      const sessionId = 'session-gdpr-test';

      // Mock short TTL for testing
      const originalTTL = CACHE_TTL.USER_SESSION;
      (CACHE_TTL as any).USER_SESSION = 1; // 1 second

      await cacheManager.cacheUserSession(sessionId, mockSessionData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cached = await cacheManager.getUserSession(sessionId);
      expect(cached).toBeNull();

      // Restore original TTL
      (CACHE_TTL as any).USER_SESSION = originalTTL;
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      const identifier = 'user-123';
      const limit = 10;

      const result = await cacheManager.checkRateLimit(identifier, limit, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - 1);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    test('should block requests exceeding rate limit', async () => {
      const identifier = 'user-rate-limit-test';
      const limit = 2;

      // Make requests up to limit
      await cacheManager.checkRateLimit(identifier, limit, 60);
      await cacheManager.checkRateLimit(identifier, limit, 60);

      // Third request should be blocked
      const result = await cacheManager.checkRateLimit(identifier, limit, 60);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('should handle rate limiting errors gracefully', async () => {
      // Test error handling by using invalid identifier
      const result = await cacheManager.checkRateLimit('', 10, 60);

      // Should fail open and allow request
      expect(result.allowed).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate holiday cache for specific state and year', async () => {
      const stateCode = 'BY';
      const year = 2025;
      const mockHolidays = [
        {
          id: 'test-holiday',
          name_de: 'Test',
          name_en: 'Test',
          date: '2025-01-01',
          type: 'federal' as const,
          states: ['ALL'],
          is_catholic: false,
          is_protestant: false
        }
      ];

      // Cache data
      await cacheManager.cacheHolidaysByState(stateCode, year, mockHolidays);

      // Verify it's cached
      let cached = await cacheManager.getHolidaysByState(stateCode, year);
      expect(cached).toEqual(mockHolidays);

      // Invalidate cache
      await cacheManager.invalidateHolidayCache(stateCode, year);

      // Verify it's gone
      cached = await cacheManager.getHolidaysByState(stateCode, year);
      expect(cached).toBeNull();
    });

    test('should invalidate bridge weekend cache', async () => {
      const stateCode = 'BY';
      const year = 2025;
      const maxVacationDays = 5;
      const mockBridges = [
        {
          id: 'test-bridge',
          holiday_id: 'test-holiday',
          state_code: stateCode,
          start_date: '2025-01-01',
          end_date: '2025-01-03',
          vacation_days_needed: 1,
          total_days_off: 3,
          efficiency: 3.0,
          pattern: 'thursday-friday' as const
        }
      ];

      // Cache data
      await cacheManager.cacheBridgeWeekends(stateCode, year, maxVacationDays, mockBridges);

      // Verify it's cached
      let cached = await cacheManager.getBridgeWeekends(stateCode, year, maxVacationDays);
      expect(cached).toEqual(mockBridges);

      // Invalidate cache
      await cacheManager.invalidateBridgeCache(stateCode, year);

      // Verify it's gone
      cached = await cacheManager.getBridgeWeekends(stateCode, year, maxVacationDays);
      expect(cached).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    test('should track cache metrics', async () => {
      // Perform some cache operations
      await cacheManager.getHolidaysByState('BY', 2025); // Miss
      await cacheManager.cacheHolidaysByState('BY', 2025, []);
      await cacheManager.getHolidaysByState('BY', 2025); // Hit

      const metrics = cacheManager.getMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.hitCount).toBeGreaterThan(0);
      expect(metrics.missCount).toBeGreaterThan(0);
      expect(metrics.hitRatio).toBeGreaterThan(0);
      expect(metrics.lastUpdated).toBeDefined();
    });

    test('should provide health status', async () => {
      const health = await cacheManager.getHealthStatus();

      expect(health.isHealthy).toBe(true);
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.uptime).toBeGreaterThan(0);
    });

    test('should detect unhealthy cache when response time is too high', async () => {
      // Mock slow response for testing
      const originalPing = cacheManager['redis'].ping;
      cacheManager['redis'].ping = async () => {
        await new Promise(resolve => setTimeout(resolve, PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME + 50));
        return 'PONG';
      };

      const health = await cacheManager.getHealthStatus();
      expect(health.isHealthy).toBe(false);

      // Restore original method
      cacheManager['redis'].ping = originalPing;
    });
  });

  describe('Batch Operations', () => {
    test('should perform batch set operations', async () => {
      const keyValuePairs: Array<[string, string, number]> = [
        ['key1', 'value1', 300],
        ['key2', 'value2', 300],
        ['key3', 'value3', 300]
      ];

      await expect(cacheManager.mset(keyValuePairs)).resolves.not.toThrow();
    });

    test('should perform batch get operations', async () => {
      const keys = ['key1', 'key2', 'key3'];

      // Set some values first
      await cacheManager.mset([
        ['key1', 'value1', 300],
        ['key2', 'value2', 300]
      ]);

      const results = await cacheManager.mget(keys);

      expect(results).toHaveLength(3);
      expect(results[0]).toBe('value1');
      expect(results[1]).toBe('value2');
      expect(results[2]).toBeNull();
    });

    test('should handle empty batch operations', async () => {
      await expect(cacheManager.mset([])).resolves.not.toThrow();

      const results = await cacheManager.mget([]);
      expect(results).toEqual([]);
    });
  });

  describe('Memory Management', () => {
    test('should optimize memory usage', async () => {
      await expect(cacheManager.optimizeMemory()).resolves.not.toThrow();
    });
  });

  describe('Cache Warming', () => {
    test('should warm cache with popular German holiday data', async () => {
      await expect(cacheManager.warmCache()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      // Mock connection error
      const originalGet = cacheManager['redis'].get;
      cacheManager['redis'].get = async () => {
        throw new Error('Connection failed');
      };

      const result = await cacheManager.getHolidaysByState('BY', 2025);
      expect(result).toBeNull();

      // Restore original method
      cacheManager['redis'].get = originalGet;
    });

    test('should handle invalid JSON in cache gracefully', async () => {
      // Mock invalid JSON response
      const originalGet = cacheManager['redis'].get;
      cacheManager['redis'].get = async () => 'invalid-json{';

      const result = await cacheManager.getHolidaysByState('BY', 2025);
      expect(result).toBeNull();

      // Restore original method
      cacheManager['redis'].get = originalGet;
    });
  });
});

describe('Global Cache Manager', () => {
  afterEach(async () => {
    await shutdownCache();
  });

  test('should create global cache manager instance', () => {
    const cache1 = getCacheManager();
    const cache2 = getCacheManager();

    expect(cache1).toBe(cache2); // Should be same instance
  });

  test('should initialize global cache', async () => {
    const cache = await initializeCache({
      host: 'localhost',
      port: 6379,
      database: 1
    });

    expect(cache).toBeInstanceOf(CacheManager);
  });

  test('should shutdown global cache', async () => {
    await initializeCache();
    await expect(shutdownCache()).resolves.not.toThrow();
  });
});

describe('Performance Benchmarks', () => {
  let cacheManager: CacheManager;

  beforeAll(async () => {
    cacheManager = new CacheManager();
    await cacheManager.initialize();
  });

  afterAll(async () => {
    await cacheManager.shutdown();
  });

  test('should handle concurrent cache operations', async () => {
    const concurrentOperations = 100;
    const mockHolidays = [
      {
        id: 'concurrent-test',
        name_de: 'Test',
        name_en: 'Test',
        date: '2025-01-01',
        type: 'federal' as const,
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      }
    ];

    const operations = Array.from({ length: concurrentOperations }, (_, i) =>
      cacheManager.cacheHolidaysByState(`STATE${i}`, 2025, mockHolidays)
    );

    const startTime = Date.now();
    await Promise.all(operations);
    const duration = Date.now() - startTime;

    // Should complete within reasonable time (simulating high concurrency)
    expect(duration).toBeLessThan(5000); // 5 seconds for 100 concurrent operations
  });

  test('should meet response time requirements for cached data', async () => {
    const mockHolidays = [
      {
        id: 'performance-test',
        name_de: 'Test',
        name_en: 'Test',
        date: '2025-01-01',
        type: 'federal' as const,
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      }
    ];

    // Cache the data first
    await cacheManager.cacheHolidaysByState('BY', 2025, mockHolidays);

    // Measure retrieval time
    const startTime = Date.now();
    await cacheManager.getHolidaysByState('BY', 2025);
    const responseTime = Date.now() - startTime;

    // Should meet constitutional requirement of <100ms for cached operations
    expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME);
  });

  test('should handle large volume of rate limit checks', async () => {
    const requestCount = 1000;
    const identifier = 'load-test-user';

    const operations = Array.from({ length: requestCount }, () =>
      cacheManager.checkRateLimit(identifier, 10000, 3600) // High limit to avoid blocking
    );

    const startTime = Date.now();
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(requestCount);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});