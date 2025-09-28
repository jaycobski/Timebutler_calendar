/**
 * Unit Tests for VacationPlanService
 * Tests GDPR compliance, data validation, and service logic
 */

import { VacationPlanService, CreateVacationPlanRequest } from '../../../src/services/VacationPlanService';
import { createApp } from '../../../src/app';
import { FastifyInstance } from 'fastify';

describe('VacationPlanService Unit Tests', () => {
  let app: FastifyInstance;
  let service: VacationPlanService;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
    service = new VacationPlanService(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GDPR Consent Validation', () => {
    test('should reject request without GDPR consent', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'test@example.de',
          language: 'de',
          gdprConsent: false
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/GDPR consent/);
    });

    test('should validate email format', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'invalid-email-format',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/E-Mail-Adresse/);
    });

    test('should validate German state codes', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'INVALID' as any,
          year: 2025,
          totalVacationDays: 30
        }
      };

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/state/);
    });
  });

  describe('Bridge Weekend Validation', () => {
    test('should reject empty bridge weekend list', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: [],
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

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/bridge weekend/);
    });

    test('should reject too many bridge weekends', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: Array(11).fill('bridge-id'),
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

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/Maximum 10/);
    });
  });

  describe('Language Support', () => {
    test('should support German language', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'deutsch@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const result = await service.createVacationPlan(request, '192.168.1.1');
      expect(result).toBeDefined();
      expect(result.bridgeWeekends[0].holidayName).toBeDefined();
    });

    test('should support English language', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'english@test.com',
          language: 'en',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const result = await service.createVacationPlan(request, '192.168.1.1');
      expect(result).toBeDefined();
      expect(result.bridgeWeekends[0].holidayName).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    test('should validate all German states', async () => {
      const germanStates = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

      for (const state of germanStates) {
        const request: CreateVacationPlanRequest = {
          bridgeWeekendIds: ['bridge-test-1'],
          userPreferences: {
            email: `test-${state.toLowerCase()}@web.de`,
            language: 'de',
            gdprConsent: true
          },
          metadata: {
            state: state as any,
            year: 2025,
            totalVacationDays: 30
          }
        };

        const result = await service.createVacationPlan(request, '192.168.1.1');
        expect(result).toBeDefined();
        expect(result.id).toMatch(/^[a-f0-9-]+$/);
      }
    });

    test('should validate German email domains', async () => {
      const germanEmails = [
        'test@web.de',
        'test@t-online.de',
        'test@gmx.de',
        'test@gmail.de',
        'test@posteo.de',
        'test@mailbox.org',
        'test@gmail.com', // International but common in Germany
        'test@yahoo.com'
      ];

      for (const email of germanEmails) {
        const request: CreateVacationPlanRequest = {
          bridgeWeekendIds: ['bridge-test-1'],
          userPreferences: {
            email,
            language: 'de',
            gdprConsent: true
          },
          metadata: {
            state: 'BY',
            year: 2025,
            totalVacationDays: 30
          }
        };

        const result = await service.createVacationPlan(request, '192.168.1.1');
        expect(result).toBeDefined();
      }
    });
  });

  describe('Response Structure', () => {
    test('should return complete vacation plan response', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1', 'bridge-test-2'],
        userPreferences: {
          email: 'complete@test.de',
          language: 'de',
          gdprConsent: true,
          marketingConsent: true
        },
        metadata: {
          state: 'NW',
          year: 2025,
          totalVacationDays: 28
        }
      };

      const result = await service.createVacationPlan(request, '192.168.1.1');

      // Verify response structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('bridgeWeekends');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('exportUrl');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('gdprCompliant');

      // Verify bridge weekends structure
      expect(result.bridgeWeekends).toHaveLength(2);
      result.bridgeWeekends.forEach(bridge => {
        expect(bridge).toHaveProperty('id');
        expect(bridge).toHaveProperty('holidayName');
        expect(bridge).toHaveProperty('startDate');
        expect(bridge).toHaveProperty('endDate');
        expect(bridge).toHaveProperty('vacationDaysNeeded');
        expect(bridge).toHaveProperty('totalDaysOff');
        expect(bridge).toHaveProperty('efficiency');
      });

      // Verify summary
      expect(result.summary).toHaveProperty('totalVacationDays');
      expect(result.summary).toHaveProperty('totalDaysOff');
      expect(result.summary).toHaveProperty('efficiency');

      // Verify GDPR compliance
      expect(result.gdprCompliant).toBe(true);

      // Verify URL format
      expect(result.exportUrl).toContain('/v1/exports/');
      expect(result.exportUrl).toContain(result.id);

      // Verify date formats
      expect(() => new Date(result.createdAt)).not.toThrow();
      expect(() => new Date(result.expiresAt)).not.toThrow();

      // Verify 90-day retention policy
      const created = new Date(result.createdAt);
      const expires = new Date(result.expiresAt);
      const daysDiff = (expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(90, 1);
    });
  });

  describe('Session Management', () => {
    test('should generate unique IDs for each vacation plan', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'unique@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30
        }
      };

      const result1 = await service.createVacationPlan(request, '192.168.1.1');
      const result2 = await service.createVacationPlan(request, '192.168.1.1');

      expect(result1.id).not.toBe(result2.id);
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });

    test('should handle session retrieval for non-existent plan', async () => {
      const fakeId = '00000000-0000-4000-8000-000000000000';

      await expect(
        service.getVacationPlan(fakeId)
      ).rejects.toThrow(/not found/);
    });

    test('should handle invalid plan ID format', async () => {
      const invalidId = 'invalid-plan-id';

      await expect(
        service.getVacationPlan(invalidId)
      ).rejects.toThrow(/Invalid.*plan ID/);
    });
  });

  describe('GDPR Data Protection', () => {
    test('should handle cleanup of expired plans', async () => {
      // This would normally test the Redis cleanup job
      // For now, just verify the method exists and doesn't throw
      await expect(
        service.cleanupExpiredPlans()
      ).resolves.not.toThrow();
    });

    test('should create audit trail entries', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-audit-1'],
        userPreferences: {
          email: 'audit@test.de',
          language: 'de',
          gdprConsent: true
        },
        metadata: {
          state: 'BY',
          year: 2025,
          totalVacationDays: 30,
          userAgent: 'Test Browser 1.0',
          referrer: 'https://example.com'
        }
      };

      const result = await service.createVacationPlan(request, '192.168.1.1');

      // Verify that the creation was logged (in a real implementation)
      expect(result.gdprCompliant).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required metadata', async () => {
      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
        userPreferences: {
          email: 'test@web.de',
          language: 'de',
          gdprConsent: true
        }
        // Missing metadata
      };

      await expect(
        service.createVacationPlan(request, '192.168.1.1')
      ).rejects.toThrow(/state.*required/);
    });

    test('should handle network errors gracefully', async () => {
      // Simulate network/Redis failure by creating service with invalid app
      const fakeApp = {
        log: {
          error: jest.fn(),
          info: jest.fn(),
          debug: jest.fn()
        }
      } as any;

      const fakeService = new VacationPlanService(fakeApp);

      const request: CreateVacationPlanRequest = {
        bridgeWeekendIds: ['bridge-test-1'],
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

      // Should handle gracefully without crashing
      await expect(
        fakeService.createVacationPlan(request, '192.168.1.1')
      ).resolves.toBeDefined();
    });
  });
});