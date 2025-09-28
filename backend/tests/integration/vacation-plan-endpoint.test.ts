/**
 * Integration Tests for POST /v1/vacation-plans Endpoint
 * Tests GDPR compliance, session management, and vacation plan creation
 */

import { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app';
import {
  CreateVacationPlanRequest,
  VacationPlanResponse
} from '../../src/services/VacationPlanService';

describe('POST /v1/vacation-plans Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GDPR Compliance Tests', () => {
    test('should reject request without GDPR consent', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'test@example.com',
          language: 'de',
          gdprConsent: false // No consent
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.gdprViolation).toBe(true);
      expect(body.error.message).toContain('GDPR consent');
    });

    test('should accept request with valid GDPR consent', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true,
          marketingConsent: false
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; Test)',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      expect(response.statusCode).toBe(201);
      const body: VacationPlanResponse = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.sessionId).toBeDefined();
      expect(body.gdprCompliant).toBe(true);
      expect(body.expiresAt).toBeDefined();
      expect(body.exportUrl).toContain('/v1/exports/');
    });

    test('should validate email format for German market', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'invalid-email',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('E-Mail-Adresse');
    });

    test('should validate German state codes', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'XX' as any, // Invalid state
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('state');
    });
  });

  describe('Bridge Weekend Validation Tests', () => {
    test('should reject empty bridge weekend list', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: [], // Empty array
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('bridge weekend');
    });

    test('should reject too many bridge weekends', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: Array(15).fill('bridge-id'), // Too many
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('Maximum 10');
    });
  });

  describe('Session Management Tests', () => {
    test('should create vacation plan with session tracking', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025', 'bridge-ostern-2025'],
        userPreferences: {
          email: 'session@test.de',
          language: 'de',
          gdprConsent: true,
          marketingConsent: true
        },
        metadata: {
          state: 'NW',
          year: 2025,
          totalVacationDays: 25
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request,
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'x-forwarded-for': '10.0.0.1'
        }
      });

      expect(response.statusCode).toBe(201);
      const body: VacationPlanResponse = JSON.parse(response.body);

      // Verify response structure
      expect(body.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/);
      expect(body.sessionId).toBeDefined();
      expect(body.bridgeWeekends).toHaveLength(2);
      expect(body.summary.totalVacationDays).toBeGreaterThan(0);
      expect(body.summary.efficiency).toBeGreaterThan(0);
      expect(body.exportUrl).toContain(body.id);

      // Verify GDPR compliance
      expect(body.gdprCompliant).toBe(true);

      // Verify dates
      const expiresAt = new Date(body.expiresAt);
      const createdAt = new Date(body.createdAt);
      expect(expiresAt > createdAt).toBe(true);

      // Should expire in approximately 90 days (GDPR retention)
      const daysDiff = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(90, 1);
    });
  });

  describe('Language Support Tests', () => {
    test('should support German language preferences', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-pfingsten-2025'],
        userPreferences: {
          email: 'deutsch@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BW',
          year: 2025,
          totalVacationDays: 28
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(201);
      const body: VacationPlanResponse = JSON.parse(response.body);

      // Holiday names should be in German
      expect(body.bridgeWeekends[0].holidayName).toBeDefined();
      // In actual implementation, this would be German holiday name
    });

    test('should support English language preferences', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-christmas-2025'],
        userPreferences: {
          email: 'english@test.com',
          language: 'en',
          gdprConsent: true
        },
        metadata: {
          state: 'HH',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      expect(response.statusCode).toBe(201);
      const body: VacationPlanResponse = JSON.parse(response.body);

      // Holiday names should be in English
      expect(body.bridgeWeekends[0].holidayName).toBeDefined();
      // In actual implementation, this would be English holiday name
    });
  });

  describe('Performance Tests', () => {
    test('should respond within 2 seconds (constitutional requirement)', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'performance@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const startTime = Date.now();

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      const responseTime = Date.now() - startTime;

      expect(response.statusCode).toBe(201);
      expect(responseTime).toBeLessThan(2000); // < 2 seconds
    });
  });

  describe('Security Tests', () => {
    test('should sanitize and validate all inputs', async () => {
      const request = {
        bridgeWeekendIds: ['<script>alert("xss")</script>'],
        userPreferences: {
          email: 'xss@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        },
        // Additional malicious fields should be ignored
        maliciousField: '<script>alert("hack")</script>',
        __proto__: { admin: true }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request,
        headers: {
          'user-agent': 'Malicious Bot <script>alert("xss")</script>'
        }
      });

      // Should either succeed (with sanitized data) or fail validation
      expect([200, 201, 400]).toContain(response.statusCode);

      if (response.statusCode === 201) {
        const body = JSON.parse(response.body);
        // Ensure response doesn't contain malicious content
        expect(JSON.stringify(body)).not.toContain('<script>');
        expect(JSON.stringify(body)).not.toContain('alert');
      }
    });

    test('should handle SQL injection attempts gracefully', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ["'; DROP TABLE vacation_plans; --"],
        userPreferences: {
          email: "sql'; DROP TABLE users; --@test.de",
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request
      });

      // Should handle gracefully without exposing database errors
      expect([201, 400]).toContain(response.statusCode);
    });
  });

  describe('Data Protection Tests', () => {
    test('should not expose sensitive data in responses', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-neujahr-2025'],
        userPreferences: {
          email: 'privacy@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/vacation-plans',
        payload: request,
        headers: {
          'x-forwarded-for': '192.168.1.100'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);

      // Should not expose raw email, IP addresses, or other sensitive data
      expect(JSON.stringify(body)).not.toContain('privacy@test.de');
      expect(JSON.stringify(body)).not.toContain('192.168.1.100');

      // Should contain encrypted/hashed versions only
      expect(body.id).toBeDefined();
      expect(body.sessionId).toBeDefined();
    });
  });
});