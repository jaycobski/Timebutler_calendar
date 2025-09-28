/**
 * German API Client Tests
 * Comprehensive test suite for T050: German government API client implementation
 *
 * Test Coverage:
 * - Multiple API provider support and failover
 * - Circuit breaker functionality
 * - Error handling and categorization
 * - Performance metrics tracking
 * - Data validation and transformation
 * - Fallback data generation
 * - Integration scenarios
 */

import axios from 'axios';
import { GermanApiClient, ApiError, ApiErrorType, CircuitBreakerState, StandardHolidayData } from '../../src/lib/germanAPIs';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment config
jest.mock('../../src/config/env', () => ({
  getEnvConfig: () => ({
    GERMAN_HOLIDAY_API_KEY: 'test-api-key',
    GERMAN_HOLIDAY_API_URL: 'https://feiertage-api.de/api'
  })
}));

describe('GermanApiClient', () => {
  let client: GermanApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup axios.create mock
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create fresh client instance
    client = new GermanApiClient();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Input Validation', () => {
    test('should reject invalid state codes', async () => {
      await expect(client.getHolidays('INVALID', 2025))
        .rejects
        .toThrow('Invalid state code: INVALID');
    });

    test('should reject invalid years', async () => {
      await expect(client.getHolidays('BW', 2024))
        .rejects
        .toThrow('Year must be within range 2025-2026');

      await expect(client.getHolidays('BW', 2027))
        .rejects
        .toThrow('Year must be within range 2025-2026');
    });

    test('should accept valid state codes', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          'Neujahr': { datum: '2025-01-01' },
          'Karfreitag': { datum: '2025-04-18' }
        }
      });

      await expect(client.getHolidays('BW', 2025)).resolves.toBeDefined();
      await expect(client.getHolidays('ALL', 2025)).resolves.toBeDefined();
    });
  });

  describe('Single Provider Success', () => {
    test('should successfully fetch from feiertage-api', async () => {
      const mockResponse = {
        data: {
          'Neujahr': { datum: '2025-01-01' },
          'Karfreitag': { datum: '2025-04-18' },
          'Ostermontag': { datum: '2025-04-21' },
          'Tag der Arbeit': { datum: '2025-05-01' },
          'Christi Himmelfahrt': { datum: '2025-05-29' },
          'Pfingstmontag': { datum: '2025-06-09' },
          'Tag der Deutschen Einheit': { datum: '2025-10-03' },
          '1. Weihnachtstag': { datum: '2025-12-25' },
          '2. Weihnachtstag': { datum: '2025-12-26' }
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const holidays = await client.getHolidays('ALL', 2025);

      expect(holidays).toHaveLength(9);
      expect(holidays[0]).toEqual(expect.objectContaining({
        id: 'neujahr-2025',
        name_de: 'Neujahr',
        name_en: 'New Year\'s Day',
        date: '2025-01-01',
        type: 'federal',
        states: ['ALL']
      }));
    });

    test('should correctly transform state-specific holidays', async () => {
      const mockResponse = {
        data: {
          'Neujahr': { datum: '2025-01-01' },
          'Heilige Drei Könige': { datum: '2025-01-06' },
          'Fronleichnam': { datum: '2025-06-19' }
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const holidays = await client.getHolidays('BW', 2025);

      const epiphany = holidays.find(h => h.id.includes('heilige-drei-koenige'));
      expect(epiphany).toEqual(expect.objectContaining({
        id: 'heilige-drei-koenige-2025',
        name_de: 'Heilige Drei Könige',
        name_en: 'Epiphany',
        type: 'state',
        states: ['BW', 'BY', 'ST'],
        is_catholic: true,
        is_protestant: false
      }));
    });
  });

  describe('Provider Failover', () => {
    test('should try secondary provider when primary fails', async () => {
      // First provider fails
      mockAxiosInstance.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            holidays: [
              {
                name: 'Neujahr',
                date: '2025-01-01',
                states: [],
                type: 'federal'
              }
            ]
          }
        });

      const holidays = await client.getHolidays('ALL', 2025);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(holidays).toHaveLength(1);
    });

    test('should use fallback data when all providers fail', async () => {
      // All providers fail
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const holidays = await client.getHolidays('ALL', 2025);

      // Should return fallback federal holidays
      expect(holidays.length).toBeGreaterThan(8);
      expect(holidays.some(h => h.id.includes('neujahr'))).toBe(true);
      expect(holidays.some(h => h.id.includes('weihnachtstag'))).toBe(true);
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after threshold failures', async () => {
      // Mock multiple failures
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      // Make multiple requests to trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await client.getHolidays('ALL', 2025);
        } catch (error) {
          // Expected to fail and use fallback
        }
      }

      const health = client.getProvidersHealth();
      const feiertageProvider = health['feiertage-api'];

      // Circuit breaker should be open or half-open due to failures
      expect([CircuitBreakerState.OPEN, CircuitBreakerState.HALF_OPEN])
        .toContain(feiertageProvider.circuitBreakerState);
    });

    test('should transition to half-open after recovery timeout', (done) => {
      jest.useFakeTimers();

      // Mock failures to open circuit breaker
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      // Make requests to trigger circuit breaker
      Promise.all([
        client.getHolidays('ALL', 2025).catch(() => {}),
        client.getHolidays('ALL', 2025).catch(() => {}),
        client.getHolidays('ALL', 2025).catch(() => {}),
        client.getHolidays('ALL', 2025).catch(() => {}),
        client.getHolidays('ALL', 2025).catch(() => {}),
        client.getHolidays('ALL', 2025).catch(() => {})
      ]).then(() => {
        // Fast-forward time past recovery timeout
        jest.advanceTimersByTime(65000); // 65 seconds

        // Next request should attempt to use the provider again
        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { 'Neujahr': { datum: '2025-01-01' } }
        });

        client.getHolidays('ALL', 2025).then((holidays) => {
          expect(holidays).toBeDefined();
          done();
        });
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('should categorize timeout errors correctly', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      // Should fall back to next provider or fallback data
      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays).toBeDefined();

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;
      expect(metrics.errors[ApiErrorType.TIMEOUT_ERROR]).toBeGreaterThan(0);
    });

    test('should categorize rate limit errors correctly', async () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Rate limit exceeded',
        isAxiosError: true
      };
      mockAxiosInstance.get.mockRejectedValue(rateLimitError);

      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays).toBeDefined();

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;
      expect(metrics.errors[ApiErrorType.RATE_LIMIT_ERROR]).toBeGreaterThan(0);
    });

    test('should categorize authentication errors correctly', async () => {
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized',
        isAxiosError: true
      };
      mockAxiosInstance.get.mockRejectedValue(authError);

      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays).toBeDefined();

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;
      expect(metrics.errors[ApiErrorType.AUTHENTICATION_ERROR]).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should reject empty response data', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      // Should use fallback data
      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays.length).toBeGreaterThan(0);
    });

    test('should reject malformed holiday data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          'Invalid Holiday': { /* missing datum field */ }
        }
      });

      // Should use fallback data
      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays.length).toBeGreaterThan(0);
    });

    test('should validate date formats', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          'Neujahr': { datum: 'invalid-date' }
        }
      });

      // Should use fallback data
      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays.length).toBeGreaterThan(0);
    });

    test('should validate year consistency', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          'Neujahr': { datum: '2024-01-01' } // Wrong year
        }
      });

      // Should use fallback data
      const holidays = await client.getHolidays('ALL', 2025);
      expect(holidays.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should track request metrics', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      await client.getHolidays('ALL', 2025);

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
    });

    test('should track failure metrics', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await client.getHolidays('ALL', 2025); // Should use fallback

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
    });

    test('should calculate aggregate metrics correctly', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      await client.getHolidays('ALL', 2025);
      await client.getHolidays('BW', 2025);

      const aggregate = client.getAggregateMetrics();

      expect(aggregate.totalRequests).toBeGreaterThan(0);
      expect(aggregate.totalSuccessful).toBeGreaterThan(0);
      expect(aggregate.uptime).toBeGreaterThan(0);
    });

    test('should reset metrics correctly', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      await client.getHolidays('ALL', 2025);
      client.resetMetrics();

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe('Provider Management', () => {
    test('should allow enabling/disabling providers', () => {
      client.setProviderEnabled('feiertage-api', false);

      const health = client.getProvidersHealth();
      expect(health['feiertage-api'].enabled).toBe(false);
    });

    test('should skip disabled providers', async () => {
      client.setProviderEnabled('feiertage-api', false);

      // Mock bundesregierung provider response
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          holidays: [
            {
              name: 'Neujahr',
              date: '2025-01-01',
              states: [],
              type: 'federal'
            }
          ]
        }
      });

      const holidays = await client.getHolidays('ALL', 2025);

      // Should get response from bundesregierung provider
      expect(holidays).toHaveLength(1);
    });
  });

  describe('Fallback Data Generation', () => {
    test('should generate correct federal holidays', async () => {
      // Make all providers fail
      mockAxiosInstance.get.mockRejectedValue(new Error('All providers down'));

      const holidays = await client.getHolidays('ALL', 2025);

      // Check for essential federal holidays
      const holidayIds = holidays.map(h => h.id);
      expect(holidayIds).toContain('neujahr-2025');
      expect(holidayIds).toContain('karfreitag-2025');
      expect(holidayIds).toContain('ostermontag-2025');
      expect(holidayIds).toContain('tag-der-arbeit-2025');
      expect(holidayIds).toContain('christi-himmelfahrt-2025');
      expect(holidayIds).toContain('pfingstmontag-2025');
      expect(holidayIds).toContain('tag-der-deutschen-einheit-2025');
      expect(holidayIds).toContain('weihnachtstag-2025');
      expect(holidayIds).toContain('zweiter-weihnachtstag-2025');
    });

    test('should generate state-specific holidays for Catholic states', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('All providers down'));

      const holidays = await client.getHolidays('BW', 2025);

      const holidayIds = holidays.map(h => h.id);
      expect(holidayIds).toContain('heilige-drei-koenige-2025');
      expect(holidayIds).toContain('fronleichnam-2025');
    });

    test('should generate state-specific holidays for Protestant states', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('All providers down'));

      const holidays = await client.getHolidays('SN', 2025);

      const holidayIds = holidays.map(h => h.id);
      expect(holidayIds).toContain('reformationstag-2025');
    });

    test('should calculate Easter-dependent holidays correctly for 2025', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('All providers down'));

      const holidays = await client.getHolidays('ALL', 2025);

      const easterRelated = holidays.filter(h =>
        ['karfreitag', 'ostermontag', 'christi-himmelfahrt', 'pfingstmontag'].some(name =>
          h.id.includes(name)
        )
      );

      // Check Easter 2025 is April 20
      const karfreitag = holidays.find(h => h.id.includes('karfreitag'));
      const ostermontag = holidays.find(h => h.id.includes('ostermontag'));

      expect(karfreitag?.date).toBe('2025-04-18'); // Good Friday
      expect(ostermontag?.date).toBe('2025-04-21'); // Easter Monday
    });

    test('should calculate Easter-dependent holidays correctly for 2026', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('All providers down'));

      const holidays = await client.getHolidays('ALL', 2026);

      // Check Easter 2026 is April 5
      const karfreitag = holidays.find(h => h.id.includes('karfreitag'));
      const ostermontag = holidays.find(h => h.id.includes('ostermontag'));

      expect(karfreitag?.date).toBe('2026-04-03'); // Good Friday
      expect(ostermontag?.date).toBe('2026-04-06'); // Easter Monday
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle partial provider failures gracefully', async () => {
      // First provider fails, second succeeds
      mockAxiosInstance.get
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          data: {
            holidays: [
              {
                name: 'Neujahr',
                date: '2025-01-01',
                states: [],
                type: 'federal',
                religion: undefined
              }
            ]
          }
        });

      const holidays = await client.getHolidays('ALL', 2025);

      expect(holidays).toBeDefined();
      expect(holidays.length).toBeGreaterThan(0);

      // Check that both providers were attempted
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    test('should maintain performance under load', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      const startTime = Date.now();

      // Make multiple concurrent requests
      await Promise.all([
        client.getHolidays('BW', 2025),
        client.getHolidays('BY', 2025),
        client.getHolidays('BE', 2025),
        client.getHolidays('BB', 2025),
        client.getHolidays('HB', 2025)
      ]);

      const duration = Date.now() - startTime;

      // Should complete all requests quickly (under 1 second for mocked responses)
      expect(duration).toBeLessThan(1000);

      const aggregate = client.getAggregateMetrics();
      expect(aggregate.totalRequests).toBe(5);
      expect(aggregate.totalSuccessful).toBe(5);
    });

    test('should handle provider recovery correctly', async () => {
      // Initial failure
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      const failureResult = await client.getHolidays('ALL', 2025);
      expect(failureResult).toBeDefined(); // Should get fallback data

      // Provider recovers
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      const successResult = await client.getHolidays('ALL', 2025);
      expect(successResult).toBeDefined();

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty holiday responses', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const holidays = await client.getHolidays('ALL', 2025);

      // Should fall back to generated holidays
      expect(holidays.length).toBeGreaterThan(0);
    });

    test('should handle malformed JSON responses', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: 'invalid json' });

      const holidays = await client.getHolidays('ALL', 2025);

      // Should fall back to generated holidays
      expect(holidays.length).toBeGreaterThan(0);
    });

    test('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      const holidays = await client.getHolidays('ALL', 2025);

      expect(holidays.length).toBeGreaterThan(0);

      const health = client.getProvidersHealth();
      const metrics = health['feiertage-api'].metrics;
      expect(metrics.errors[ApiErrorType.TIMEOUT_ERROR]).toBeGreaterThan(0);
    });

    test('should handle concurrent requests efficiently', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { 'Neujahr': { datum: '2025-01-01' } }
      });

      // Make many concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        client.getHolidays('ALL', 2025)
      );

      const results = await Promise.all(requests);

      // All should succeed
      results.forEach(holidays => {
        expect(holidays).toBeDefined();
        expect(holidays.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('API Error Class', () => {
  test('should create error with all properties', () => {
    const originalError = new Error('Original error');
    const apiError = new ApiError(
      'Test error',
      ApiErrorType.NETWORK_ERROR,
      'test-provider',
      500,
      originalError
    );

    expect(apiError.message).toBe('Test error');
    expect(apiError.type).toBe(ApiErrorType.NETWORK_ERROR);
    expect(apiError.provider).toBe('test-provider');
    expect(apiError.statusCode).toBe(500);
    expect(apiError.originalError).toBe(originalError);
    expect(apiError.name).toBe('ApiError');
  });

  test('should create error with minimal properties', () => {
    const apiError = new ApiError(
      'Minimal error',
      ApiErrorType.VALIDATION_ERROR,
      'test-provider'
    );

    expect(apiError.message).toBe('Minimal error');
    expect(apiError.type).toBe(ApiErrorType.VALIDATION_ERROR);
    expect(apiError.provider).toBe('test-provider');
    expect(apiError.statusCode).toBeUndefined();
    expect(apiError.originalError).toBeUndefined();
  });
});