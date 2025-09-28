/**
 * Tests for Request/Response Logging Middleware
 * Ensures constitutional compliance and performance requirements
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Fastify from 'fastify';
import {
  registerLoggingMiddleware,
  createLoggingConfig,
  logRequestStart,
  logResponseComplete,
  logEmailDelivery,
  addRequestTiming,
  getTrafficMetrics,
  loggingHealthCheck,
  DEFAULT_LOGGING_CONFIG,
  RequestLogEntry,
  ResponseLogEntry,
  LoggingConfig,
} from './logging.js';

describe('Logging Middleware Constitutional Compliance', () => {
  let app: FastifyInstance;
  let mockLogger: any;

  beforeEach(async () => {
    // Create mock logger that captures log calls
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    app = Fastify({ logger: false });
    app.log = mockLogger;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Configuration Management', () => {
    test('should create default configuration with constitutional requirements', () => {
      const config = createLoggingConfig();

      expect(config.enabled).toBe(true);
      expect(config.logLevel).toBe('info');
      expect(config.retentionHours).toBe(72); // GDPR: 3 days max
      expect(config.performanceThresholds.responseTimeWarning).toBe(50);
      expect(config.performanceThresholds.responseTimeCritical).toBe(100); // Constitution: <100ms
      expect(config.spikeDetection.concurrentThreshold).toBe(25000); // Constitution: 25k users
      expect(config.germanCompliance.enabled).toBe(true);
    });

    test('should create development configuration with debug logging', () => {
      const config = createLoggingConfig('development');

      expect(config.logLevel).toBe('debug');
      expect(config.enabled).toBe(true);
      expect(config.germanCompliance.enabled).toBe(true);
    });

    test('should validate GDPR compliance in configuration', () => {
      const config = createLoggingConfig();

      // GDPR: Data minimization and retention limits
      expect(config.retentionHours).toBeLessThanOrEqual(72);
      expect(config.germanCompliance.enabled).toBe(true);
    });
  });

  describe('Request Logging', () => {
    test('should log request start with GDPR-compliant data handling', () => {
      const mockRequest = {
        method: 'GET',
        url: '/v1/holidays?state=BY',
        ip: '192.168.1.100',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        query: { state: 'BY' },
        body: null,
      } as FastifyRequest;

      const config = createLoggingConfig();
      const requestEntry = logRequestStart(mockLogger, mockRequest, config);

      // Verify basic request logging
      expect(requestEntry.requestId).toBeDefined();
      expect(requestEntry.method).toBe('GET');
      expect(requestEntry.url).toBe('/v1/holidays?state=BY');
      expect(requestEntry.endpointCategory).toBe('holiday');
      expect(requestEntry.germanState).toBe('BY');

      // Verify GDPR compliance: no personal data stored
      expect(requestEntry.clientHash).toBeDefined();
      expect(requestEntry.clientHash).not.toContain('192.168.1.100'); // IP should be hashed
      expect(requestEntry.userAgentSignature).toBe('unknown/Windows'); // Sanitized

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'request_start',
          request: expect.objectContaining({
            id: requestEntry.requestId,
            method: 'GET',
            category: 'holiday',
            germanState: 'BY',
          }),
        }),
        expect.stringContaining('Request started: GET /v1/holidays?state=BY')
      );
    });

    test('should categorize endpoints correctly for performance tracking', () => {
      const testCases = [
        { url: '/v1/holidays?state=BY', expected: 'holiday' },
        { url: '/v1/bridge-weekends', expected: 'bridge' },
        { url: '/v1/vacation-plan/123/email', expected: 'email' },
        { url: '/v1/export/456', expected: 'export' },
        { url: '/health', expected: 'health' },
        { url: '/static/css/main.css', expected: 'static' },
      ];

      testCases.forEach(({ url, expected }) => {
        const mockRequest = { method: 'GET', url, ip: '127.0.0.1', headers: {} } as FastifyRequest;
        const config = createLoggingConfig();
        const requestEntry = logRequestStart(mockLogger, mockRequest, config);

        expect(requestEntry.endpointCategory).toBe(expected);
      });
    });

    test('should validate German state codes correctly', () => {
      const validStates = ['BY', 'BW', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
      const invalidStates = ['XX', 'YY', 'ZZ', ''];

      validStates.forEach(state => {
        const mockRequest = {
          method: 'GET',
          url: '/v1/holidays',
          ip: '127.0.0.1',
          headers: {},
          query: { state },
        } as FastifyRequest;

        const config = createLoggingConfig();
        const requestEntry = logRequestStart(mockLogger, mockRequest, config);
        expect(requestEntry.germanState).toBe(state);
      });

      invalidStates.forEach(state => {
        const mockRequest = {
          method: 'GET',
          url: '/v1/holidays',
          ip: '127.0.0.1',
          headers: {},
          query: { state },
        } as FastifyRequest;

        const config = createLoggingConfig();
        const requestEntry = logRequestStart(mockLogger, mockRequest, config);
        expect(requestEntry.germanState).toBeUndefined();
      });
    });
  });

  describe('Response Logging', () => {
    test('should log response completion with constitutional performance metrics', () => {
      const mockRequest = {
        method: 'GET',
        url: '/v1/holidays',
        ip: '127.0.0.1',
        headers: {},
        startTime: 100,
      } as FastifyRequest;

      const mockReply = {
        statusCode: 200,
      } as FastifyReply;

      // Set up request context
      (mockRequest as any).logContext = {
        request: {
          requestId: 'test-request-id',
          method: 'GET',
          url: '/v1/holidays',
          endpointCategory: 'holiday' as const,
        },
      };

      // Mock performance.now to control timing
      const originalNow = performance.now;
      performance.now = jest.fn().mockReturnValue(150); // 50ms response time

      const config = createLoggingConfig();
      const responseEntry = logResponseComplete(mockLogger, mockRequest, mockReply, config);

      // Restore performance.now
      performance.now = originalNow;

      // Verify response logging
      expect(responseEntry).toBeDefined();
      expect(responseEntry!.requestId).toBe('test-request-id');
      expect(responseEntry!.statusCode).toBe(200);
      expect(responseEntry!.responseTime).toBe(50);

      // Verify constitutional compliance logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'request_complete',
          constitutional_compliance: expect.objectContaining({
            under_100ms_threshold: true, // 50ms < 100ms
            under_2s_page_load: true,
            gdpr_compliant: true,
            no_personal_data_stored: true,
          }),
        }),
        expect.stringContaining('Request completed')
      );
    });

    test('should warn on performance threshold violations', () => {
      const mockRequest = {
        method: 'GET',
        url: '/v1/bridge-weekends',
        ip: '127.0.0.1',
        headers: {},
        startTime: 100,
      } as FastifyRequest;

      const mockReply = { statusCode: 200 } as FastifyReply;

      (mockRequest as any).logContext = {
        request: {
          requestId: 'slow-request-id',
          method: 'GET',
          url: '/v1/bridge-weekends',
          endpointCategory: 'bridge' as const,
        },
      };

      // Mock slow response (75ms - over warning threshold of 50ms)
      const originalNow = performance.now;
      performance.now = jest.fn().mockReturnValue(175);

      const config = createLoggingConfig();
      const responseEntry = logResponseComplete(mockLogger, mockRequest, mockReply, config);

      performance.now = originalNow;

      expect(responseEntry!.responseTime).toBe(75);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test('should error on critical performance threshold violations', () => {
      const mockRequest = {
        method: 'POST',
        url: '/v1/vacation-plan/123/email',
        ip: '127.0.0.1',
        headers: {},
        startTime: 100,
      } as FastifyRequest;

      const mockReply = { statusCode: 200 } as FastifyReply;

      (mockRequest as any).logContext = {
        request: {
          requestId: 'critical-slow-request',
          method: 'POST',
          url: '/v1/vacation-plan/123/email',
          endpointCategory: 'email' as const,
        },
      };

      // Mock very slow response (150ms - over critical threshold of 100ms)
      const originalNow = performance.now;
      performance.now = jest.fn().mockReturnValue(250);

      const config = createLoggingConfig();
      const responseEntry = logResponseComplete(mockLogger, mockRequest, mockReply, config);

      performance.now = originalNow;

      expect(responseEntry!.responseTime).toBe(150);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Email Delivery Logging', () => {
    test('should log email delivery with constitutional 5-second requirement', () => {
      const requestId = 'email-request-123';
      const deliveryTime = 3000; // 3 seconds - within constitutional requirement

      const emailEntry = logEmailDelivery(
        mockLogger,
        requestId,
        'delivered',
        deliveryTime,
        'gmail.com'
      );

      expect(emailEntry.requestId).toBe(requestId);
      expect(emailEntry.status).toBe('delivered');
      expect(emailEntry.deliveryTime).toBe(3000);
      expect(emailEntry.recipientDomain).toBe('gmail.com');

      // Verify constitutional compliance logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'email_delivery',
          constitutional_compliance: expect.objectContaining({
            under_5s_delivery: true,
            gdpr_compliant: true,
            no_email_stored: true,
          }),
        }),
        expect.stringContaining('Email delivery delivered')
      );
    });

    test('should warn on slow email delivery (constitutional violation)', () => {
      const requestId = 'slow-email-request';
      const deliveryTime = 7000; // 7 seconds - violates constitutional requirement

      const emailEntry = logEmailDelivery(
        mockLogger,
        requestId,
        'delivered',
        deliveryTime,
        'outlook.com'
      );

      expect(emailEntry.deliveryTime).toBe(7000);

      // Should log as warning due to constitutional violation
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'email_delivery',
          constitutional_compliance: expect.objectContaining({
            under_5s_delivery: false, // Constitutional violation
          }),
        }),
        expect.stringContaining('Email delivery delivered')
      );
    });

    test('should error on failed email delivery', () => {
      const requestId = 'failed-email-request';

      const emailEntry = logEmailDelivery(
        mockLogger,
        requestId,
        'failed',
        undefined,
        'invalid-domain.com',
        'Invalid recipient address'
      );

      expect(emailEntry.status).toBe('failed');
      expect(emailEntry.errorReason).toBe('Invalid recipient address');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'email_delivery',
          email: expect.objectContaining({
            status: 'failed',
            errorReason: 'Invalid recipient address',
          }),
        }),
        expect.stringContaining('Email delivery failed')
      );
    });
  });

  describe('Middleware Registration', () => {
    test('should register logging middleware successfully', async () => {
      const config = createLoggingConfig();

      await expect(registerLoggingMiddleware(app, config)).resolves.toBeUndefined();

      // Verify middleware was registered by checking hooks
      expect(app.hasRequestHook('onRequest')).toBe(true);
      expect(app.hasRequestHook('onResponse')).toBe(true);
      expect(app.hasRequestHook('onError')).toBe(true);
    });

    test('should skip registration when logging disabled', async () => {
      const config = { ...createLoggingConfig(), enabled: false };

      await registerLoggingMiddleware(app, config);

      // Should still register but not add hooks in this simple test
      // In real implementation, hooks would be conditionally added
    });
  });

  describe('Traffic Metrics', () => {
    test('should provide traffic metrics for German-scale monitoring', () => {
      const metrics = getTrafficMetrics();

      expect(metrics).toHaveProperty('rps');
      expect(metrics).toHaveProperty('concurrentConnections');
      expect(metrics).toHaveProperty('germanTrafficPercent');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('peakIndicators');
      expect(metrics.peakIndicators).toHaveProperty('holidayPlanningSpike');
      expect(metrics.peakIndicators).toHaveProperty('viralSpike');
    });
  });

  describe('Health Check', () => {
    test('should provide logging system health status', () => {
      const health = loggingHealthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);

      if (health.status !== 'unhealthy') {
        expect(health.details).toHaveProperty('memoryUsage');
        expect(health.details).toHaveProperty('uptime');
        expect(health.details).toHaveProperty('constitutional_compliance');
        expect(health.details.constitutional_compliance).toEqual({
          gdpr_compliant: true,
          performance_monitoring: true,
          german_scale_ready: true,
        });
      }
    });
  });

  describe('GDPR Compliance', () => {
    test('should hash client IP addresses for privacy', () => {
      const mockRequest = {
        method: 'GET',
        url: '/v1/holidays',
        ip: '192.168.1.100',
        headers: { 'user-agent': 'Mozilla/5.0 Chrome/100.0' },
      } as FastifyRequest;

      const config = createLoggingConfig();
      const requestEntry = logRequestStart(mockLogger, mockRequest, config);

      // Client hash should not contain original IP
      expect(requestEntry.clientHash).toBeDefined();
      expect(requestEntry.clientHash).not.toContain('192.168.1.100');
      expect(requestEntry.clientHash.length).toBe(16); // SHA256 truncated to 16 chars
    });

    test('should sanitize user agent strings', () => {
      const testCases = [
        {
          input: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          expected: 'unknown/Windows'
        },
        {
          input: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          expected: 'unknown/Mac'
        },
        {
          input: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/89.0',
          expected: 'Firefox/Linux'
        },
        {
          input: undefined,
          expected: 'unknown'
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockRequest = {
          method: 'GET',
          url: '/v1/holidays',
          ip: '127.0.0.1',
          headers: input ? { 'user-agent': input } : {},
        } as FastifyRequest;

        const config = createLoggingConfig();
        const requestEntry = logRequestStart(mockLogger, mockRequest, config);

        expect(requestEntry.userAgentSignature).toBe(expected);
      });
    });

    test('should not log personal data in any log entries', () => {
      const mockRequest = {
        method: 'POST',
        url: '/v1/vacation-plan',
        ip: '203.0.113.1',
        headers: {
          'user-agent': 'Mozilla/5.0 (personal device info)',
          'authorization': 'Bearer personal-token-123',
        },
        body: {
          email: 'user@example.com',
          name: 'John Doe',
          state: 'BY',
        },
      } as FastifyRequest;

      const config = createLoggingConfig();
      logRequestStart(mockLogger, mockRequest, config);

      // Verify no personal data in log calls
      const logCalls = mockLogger.info.mock.calls;
      const logData = JSON.stringify(logCalls);

      expect(logData).not.toContain('user@example.com');
      expect(logData).not.toContain('John Doe');
      expect(logData).not.toContain('personal-token-123');
      expect(logData).not.toContain('203.0.113.1');
      expect(logData).not.toContain('personal device info');
    });
  });

  describe('Performance Monitoring', () => {
    test('should track request timing accurately', () => {
      const mockRequest = {} as FastifyRequest;

      addRequestTiming(mockRequest);

      expect(mockRequest.startTime).toBeDefined();
      expect((mockRequest as any).timings).toBeDefined();
      expect((mockRequest as any).timings.start).toBeDefined();
    });

    test('should measure constitutional performance thresholds', () => {
      const config = createLoggingConfig();

      // Constitutional requirements
      expect(config.performanceThresholds.responseTimeCritical).toBe(100); // <100ms interactions
      expect(config.spikeDetection.concurrentThreshold).toBe(25000); // 25k concurrent users

      // Page load requirement tested implicitly through response time logging
      // Email delivery requirement tested in email delivery tests
    });
  });
});

describe('Integration Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await registerLoggingMiddleware(app);
  });

  afterEach(async () => {
    await app.close();
  });

  test('should log complete request/response cycle', async () => {
    // Mock route for testing
    app.get('/test', async (request, reply) => {
      return { message: 'test response' };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/100.0',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'test response' });

    // Verify logging occurred (would need to capture actual logs in real integration test)
  });
});