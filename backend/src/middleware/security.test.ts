/**
 * Unit tests for Security Middleware
 *
 * Tests CORS handling, security headers, GDPR compliance,
 * and German market-specific requirements.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createSecurityConfig,
  handleCORS,
  setSecurityHeaders,
  validateRequest,
  rateLimitingHook,
  responseCleanup
} from './security';
import type { SecurityConfig } from './types';

// Mock Fastify request/reply objects
const createMockRequest = (overrides: any = {}) => ({
  method: 'GET',
  url: '/test',
  headers: {},
  protocol: 'https',
  ip: '127.0.0.1',
  id: 'test-request-id',
  ...overrides
});

const createMockReply = () => {
  const headers: Record<string, string> = {};
  return {
    header: jest.fn((key: string, value: string) => {
      headers[key] = value;
      return mockReply;
    }),
    removeHeader: jest.fn((key: string) => {
      delete headers[key];
      return mockReply;
    }),
    status: jest.fn(() => mockReply),
    send: jest.fn(() => mockReply),
    getHeaders: () => headers,
    _headers: headers
  };
};

let mockReply: any;

beforeEach(() => {
  mockReply = createMockReply();
  jest.clearAllMocks();
});

describe('Security Configuration', () => {
  it('should create default production configuration', () => {
    const config = createSecurityConfig('production');

    expect(config.environment).toBe('production');
    expect(config.headers.hsts.enabled).toBe(true);
    expect(config.headers.csp.enabled).toBe(true);
    expect(config.headers.csp.reportOnly).toBe(false);
    expect(config.compliance.gdprHeaders).toBe(true);
    expect(config.compliance.germanLanguageSupport).toBe(true);
  });

  it('should create development configuration with relaxed security', () => {
    const config = createSecurityConfig('development');

    expect(config.environment).toBe('development');
    expect(config.headers.hsts.enabled).toBe(false);
    expect(config.headers.csp.reportOnly).toBe(true);
    expect(config.cors.origin).toContain('http://localhost:3000');
  });

  it('should include German compliance features', () => {
    const config = createSecurityConfig('production');

    expect(config.compliance.gdprHeaders).toBe(true);
    expect(config.compliance.germanLanguageSupport).toBe(true);
    expect(config.compliance.euCookieCompliance).toBe(true);
    expect(config.compliance.dataMinimization).toBe(true);
  });
});

describe('CORS Handling', () => {
  let config: SecurityConfig;

  beforeEach(() => {
    config = createSecurityConfig('production');
  });

  it('should handle valid origin in production', async () => {
    const request = createMockRequest({
      headers: { origin: 'https://timebutler-calendar.de' }
    });

    const corsHandler = handleCORS(config);
    await corsHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://timebutler-calendar.de'
    );
    expect(mockReply.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true'
    );
  });

  it('should reject invalid origin in production', async () => {
    const request = createMockRequest({
      headers: { origin: 'https://malicious-site.com' }
    });

    const corsHandler = handleCORS(config);
    await corsHandler(request as any, mockReply);

    expect(mockReply.header).not.toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      expect.any(String)
    );
  });

  it('should handle preflight OPTIONS request', async () => {
    const request = createMockRequest({
      method: 'OPTIONS',
      headers: { origin: 'https://timebutler-calendar.de' }
    });

    const corsHandler = handleCORS(config);
    const result = await corsHandler(request as any, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(204);
    expect(result).toBe('');
  });

  it('should allow localhost in development', async () => {
    const devConfig = createSecurityConfig('development');
    const request = createMockRequest({
      headers: { origin: 'http://localhost:3000' }
    });

    const corsHandler = handleCORS(devConfig);
    await corsHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'http://localhost:3000'
    );
  });
});

describe('Security Headers', () => {
  let config: SecurityConfig;

  beforeEach(() => {
    config = createSecurityConfig('production');
  });

  it('should set HSTS header in production over HTTPS', async () => {
    const request = createMockRequest({ protocol: 'https' });

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  });

  it('should not set HSTS header over HTTP in production', async () => {
    const request = createMockRequest({ protocol: 'http' });

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.any(String)
    );
  });

  it('should set Content Security Policy header', async () => {
    const request = createMockRequest();

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    );
  });

  it('should set GDPR compliance headers', async () => {
    const request = createMockRequest();

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith('X-GDPR-Compliant', 'true');
    expect(mockReply.header).toHaveBeenCalledWith('X-Data-Retention', '90-days');
    expect(mockReply.header).toHaveBeenCalledWith(
      'X-Privacy-Policy',
      'https://timebutler.de/privacy'
    );
  });

  it('should set German language support headers', async () => {
    const request = createMockRequest();

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith('X-Supported-Languages', 'de,en');
    expect(mockReply.header).toHaveBeenCalledWith('X-Default-Language', 'de');
  });

  it('should remove sensitive headers', async () => {
    const request = createMockRequest();

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(mockReply.removeHeader).toHaveBeenCalledWith('Server');
  });

  it('should set TimeButler service identification', async () => {
    const request = createMockRequest();

    const headerHandler = setSecurityHeaders(config);
    await headerHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith('X-Service', 'TimeButler-Calendar');
    expect(mockReply.header).toHaveBeenCalledWith('X-Version', '1.0.0');
  });
});

describe('Request Validation', () => {
  let config: SecurityConfig;

  beforeEach(() => {
    config = createSecurityConfig('production');
  });

  it('should reject requests with excessive content length', async () => {
    const request = createMockRequest({
      headers: { 'content-length': '20971520' } // 20MB
    });

    const validationHandler = validateRequest(config);
    await validationHandler(request as any, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(413);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        message: 'Request entity too large',
        statusCode: 413,
        maxSize: '10MB'
      }
    });
  });

  it('should validate host header in production', async () => {
    const request = createMockRequest({
      headers: { host: 'malicious-host.com' }
    });

    const validationHandler = validateRequest(config);
    await validationHandler(request as any, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        message: 'Invalid host header',
        statusCode: 400
      }
    });
  });

  it('should allow valid host in production', async () => {
    const request = createMockRequest({
      headers: { host: 'timebutler-calendar.de' }
    });

    const validationHandler = validateRequest(config);
    await validationHandler(request as any, mockReply);

    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should require GDPR consent for data processing endpoints', async () => {
    const request = createMockRequest({
      url: '/v1/vacation-plan',
      headers: {}
    });

    const validationHandler = validateRequest(config);
    await validationHandler(request as any, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(451);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: {
        message: 'GDPR consent required for data processing',
        statusCode: 451,
        consentRequired: true,
        privacyPolicy: 'https://timebutler.de/privacy'
      }
    });
  });

  it('should allow data processing with valid GDPR consent', async () => {
    const request = createMockRequest({
      url: '/v1/vacation-plan',
      headers: { 'x-gdpr-consent': 'accepted' }
    });

    const validationHandler = validateRequest(config);
    await validationHandler(request as any, mockReply);

    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });
});

describe('Rate Limiting Hook', () => {
  let config: SecurityConfig;

  beforeEach(() => {
    config = createSecurityConfig('production');
  });

  it('should attach rate limiting context to request', async () => {
    const request = createMockRequest({
      url: '/v1/holidays',
      ip: '192.168.1.1'
    });

    const rateLimitHandler = rateLimitingHook(config);
    await rateLimitHandler(request as any, mockReply);

    expect((request as any).rateLimit).toMatchObject({
      identifier: '192.168.1.1',
      endpoint: 'data',
      timestamp: expect.any(Number)
    });
  });

  it('should set rate limiting policy header', async () => {
    const request = createMockRequest({ url: '/v1/email' });

    const rateLimitHandler = rateLimitingHook(config);
    await rateLimitHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith('X-Rate-Limit-Policy', '5/minute');
  });

  it('should categorize endpoints correctly', async () => {
    const testCases = [
      { url: '/health', expected: 'health' },
      { url: '/v1/holidays', expected: 'data' },
      { url: '/v1/bridge-weekends', expected: 'computation' },
      { url: '/v1/vacation-plan', expected: 'user-data' },
      { url: '/v1/export', expected: 'export' },
      { url: '/v1/email', expected: 'email' },
      { url: '/unknown', expected: 'general' }
    ];

    for (const testCase of testCases) {
      const request = createMockRequest({ url: testCase.url });
      const rateLimitHandler = rateLimitingHook(config);
      await rateLimitHandler(request as any, mockReply);

      expect((request as any).rateLimit.endpoint).toBe(testCase.expected);
    }
  });
});

describe('Response Cleanup', () => {
  let config: SecurityConfig;

  beforeEach(() => {
    config = createSecurityConfig('production');
  });

  it('should remove sensitive headers', async () => {
    const request = createMockRequest();

    const cleanupHandler = responseCleanup(config);
    await cleanupHandler(request as any, mockReply);

    expect(mockReply.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(mockReply.removeHeader).toHaveBeenCalledWith('Server');
  });

  it('should add response time header when available', async () => {
    const request = createMockRequest();
    (request as any).startTime = Date.now() - 150; // 150ms ago

    const cleanupHandler = responseCleanup(config);
    await cleanupHandler(request as any, mockReply);

    expect(mockReply.header).toHaveBeenCalledWith(
      'X-Response-Time',
      expect.stringMatching(/\d+ms/)
    );
  });

  it('should enforce data minimization by removing sensitive headers', async () => {
    const request = createMockRequest();
    config.compliance.dataMinimization = true;

    const cleanupHandler = responseCleanup(config);
    await cleanupHandler(request as any, mockReply);

    expect(mockReply.removeHeader).toHaveBeenCalledWith('x-real-ip');
    expect(mockReply.removeHeader).toHaveBeenCalledWith('x-forwarded-for-original');
  });
});

describe('Integration Tests', () => {
  it('should work with complete middleware chain', async () => {
    const config = createSecurityConfig('production');
    const request = createMockRequest({
      method: 'POST',
      url: '/v1/vacation-plan',
      headers: {
        origin: 'https://timebutler-calendar.de',
        'content-length': '1024',
        host: 'timebutler-calendar.de',
        'x-gdpr-consent': 'accepted'
      },
      protocol: 'https'
    });

    // Execute middleware chain
    const corsHandler = handleCORS(config);
    const headersHandler = setSecurityHeaders(config);
    const validationHandler = validateRequest(config);
    const rateLimitHandler = rateLimitingHook(config);
    const cleanupHandler = responseCleanup(config);

    await corsHandler(request as any, mockReply);
    await headersHandler(request as any, mockReply);
    await validationHandler(request as any, mockReply);
    await rateLimitHandler(request as any, mockReply);
    await cleanupHandler(request as any, mockReply);

    // Verify headers were set correctly
    const headers = mockReply._headers;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://timebutler-calendar.de');
    expect(headers['X-GDPR-Compliant']).toBe('true');
    expect(headers['X-Supported-Languages']).toBe('de,en');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');

    // Verify no errors occurred
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();

    // Verify rate limiting context was attached
    expect((request as any).rateLimit).toBeDefined();
    expect((request as any).rateLimit.endpoint).toBe('user-data');
  });
});