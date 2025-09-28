/**
 * Comprehensive API Endpoint Integration Tests
 * Timebutler Calendar MVP - Task T013
 *
 * Tests all 6 API endpoints from OpenAPI specifications:
 * - GET /v1/holidays - Holiday data by state and year
 * - POST /v1/bridge-weekends - Bridge weekend calculations
 * - POST /v1/vacation-plan - Vacation planning session creation
 * - POST /v1/vacation-plan/{id}/email - Email delivery
 * - GET /v1/export/{id} - Calendar file download
 * - GET /health - Health check
 *
 * German Market Requirements:
 * - Bilingual support (Accept-Language: de/en)
 * - GDPR compliance (consent headers, data retention)
 * - German state code validation (16 Bundesländer)
 * - CET/CEST timezone handling
 * - Performance targets (<100ms response times)
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { testHelpers } from '../../helpers/integration-test-helpers';
import { GermanStates } from '../../helpers/german-states-data';

// These tests will FAIL initially - the API endpoints don't exist yet
// This is intentional TDD approach - tests define the contract first

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const PERFORMANCE_THRESHOLD_MS = 100;
const EMAIL_DELIVERY_TIMEOUT_MS = 5000;

describe('API Endpoints Integration Tests', () => {
  let app: any;
  let testSessionId: string;
  let testExportId: string;

  beforeAll(async () => {
    // Initialize test environment - will fail until backend exists
    app = await testHelpers.createTestApp();
    await testHelpers.setupTestDatabase();
    await testHelpers.setupEmailService();
  });

  afterAll(async () => {
    await testHelpers.cleanupTestEnvironment();
  });

  beforeEach(async () => {
    await testHelpers.resetTestData();
  });

  afterEach(async () => {
    await testHelpers.cleanupTestSession();
  });

  describe('GET /v1/holidays - Holiday Data Endpoint', () => {
    const performanceTests: Array<{ state: string; stateName: string }> = [
      { state: 'BY', stateName: 'Bayern' },
      { state: 'BW', stateName: 'Baden-Württemberg' },
      { state: 'NW', stateName: 'Nordrhein-Westfalen' },
      { state: 'HE', stateName: 'Hessen' },
      { state: 'BE', stateName: 'Berlin' }
    ];

    describe('Request Validation', () => {
      it('should require state parameter', async () => {
        const startTime = Date.now();

        const response = await request(app)
          .get('/v1/holidays')
          .expect(400);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('state parameter is required')
        });
      });

      it('should validate German state code format', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=INVALID')
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_STATE',
          message: expect.stringContaining('State code \'INVALID\' is not a valid German Bundesland')
        });
      });

      it('should reject unknown state codes', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=XY')
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'STATE_NOT_FOUND',
          message: expect.stringContaining('State code \'XY\' is not a valid German Bundesland')
        });
      });

      it('should validate year parameter range', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=BY&year=2024')
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_YEAR',
          message: expect.stringContaining('Year must be 2025 or 2026')
        });
      });

      it('should validate language parameter', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=BY&lang=fr')
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_LANGUAGE',
          message: expect.stringContaining('Language must be \'de\' or \'en\'')
        });
      });
    });

    describe('Successful Responses', () => {
      performanceTests.forEach(({ state, stateName }) => {
        it(`should return holidays for ${stateName} (${state}) within performance threshold`, async () => {
          const startTime = Date.now();

          const response = await request(app)
            .get(`/v1/holidays?state=${state}&year=2025&lang=de`)
            .expect(200)
            .expect('Content-Type', /json/);

          const responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

          expect(response.body).toMatchObject({
            holidays: expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^[a-z0-9-]+$/),
                date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                name_de: expect.any(String),
                name_en: expect.any(String),
                type: expect.stringMatching(/^(federal|state|regional)$/),
                states: expect.arrayContaining([state])
              })
            ]),
            state_info: expect.objectContaining({
              code: state,
              name_de: expect.any(String),
              name_en: expect.any(String),
              population: expect.any(Number),
              dominant_religion: expect.stringMatching(/^(catholic|protestant|mixed)$/)
            })
          });
        });
      });

      it('should support English language responses', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=BY&year=2025&lang=en')
          .set('Accept-Language', 'en')
          .expect(200);

        expect(response.body.holidays[0]).toMatchObject({
          name_en: expect.any(String)
        });

        expect(response.body.state_info).toMatchObject({
          name_en: 'Bavaria'
        });
      });

      it('should handle CET/CEST timezone correctly for German holidays', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=BY&year=2025&lang=de')
          .expect(200);

        // All German holidays should be in correct timezone context
        response.body.holidays.forEach((holiday: any) => {
          expect(holiday.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          // Date should be valid in German timezone context
          const date = new Date(holiday.date);
          expect(date).toBeInstanceOf(Date);
          expect(date.getFullYear()).toBe(2025);
        });
      });

      it('should include GDPR compliance headers', async () => {
        const response = await request(app)
          .get('/v1/holidays?state=BY&year=2025')
          .expect(200);

        expect(response.headers).toMatchObject({
          'x-gdpr-compliant': 'true',
          'x-data-retention': expect.stringContaining('30-days'),
          'cache-control': expect.stringContaining('public')
        });
      });
    });

    describe('Caching Behavior', () => {
      it('should return cached responses for repeated requests', async () => {
        // First request
        const response1 = await request(app)
          .get('/v1/holidays?state=BY&year=2025')
          .expect(200);

        // Second request should be faster (cached)
        const startTime = Date.now();
        const response2 = await request(app)
          .get('/v1/holidays?state=BY&year=2025')
          .expect(200);
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(50); // Cache should be very fast
        expect(response2.body).toEqual(response1.body);
        expect(response2.headers['x-cache']).toBe('HIT');
      });
    });
  });

  describe('POST /v1/bridge-weekends - Bridge Weekend Calculations', () => {
    const validRequest = {
      state: 'BY',
      vacation_days: 25,
      years: [2025, 2026],
      max_vacation_per_bridge: 3
    };

    describe('Request Validation', () => {
      it('should require all mandatory fields', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('state and vacation_days are required')
        });
      });

      it('should validate state parameter format', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, state: 'INVALID' })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_STATE',
          message: expect.stringContaining('State code must be valid German Bundesland')
        });
      });

      it('should validate vacation days range', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, vacation_days: 60 })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('vacation_days must be between 0 and 50')
        });
      });

      it('should validate max vacation per bridge range', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, max_vacation_per_bridge: 10 })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('max_vacation_per_bridge must be between 1 and 4')
        });
      });

      it('should validate years array', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, years: [2024, 2027] })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('Years must be 2025 or 2026')
        });
      });
    });

    describe('Successful Responses', () => {
      it('should calculate bridge weekends within performance threshold', async () => {
        const startTime = Date.now();

        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send(validRequest)
          .expect(200)
          .expect('Content-Type', /json/);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

        expect(response.body).toMatchObject({
          recommendations: expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringMatching(/^bridge-[a-z0-9-]+$/),
              holiday_id: expect.any(String),
              holiday_name: expect.any(String),
              start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
              end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
              vacation_days_needed: expect.any(Number),
              total_days_off: expect.any(Number),
              efficiency: expect.any(Number),
              pattern: expect.stringMatching(/^(thursday-friday|monday-tuesday|sandwich)$/),
              calendar_dates: expect.arrayContaining([
                expect.objectContaining({
                  date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                  type: expect.stringMatching(/^(holiday|vacation|weekend)$/),
                  name: expect.any(String)
                })
              ])
            })
          ]),
          total_opportunities: expect.any(Number),
          vacation_budget: expect.objectContaining({
            available: 25,
            used: 0,
            remaining: 25
          })
        });
      });

      it('should rank recommendations by efficiency', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send(validRequest)
          .expect(200);

        const recommendations = response.body.recommendations;
        expect(recommendations.length).toBeGreaterThan(1);

        // Check that efficiency is in descending order
        for (let i = 1; i < recommendations.length; i++) {
          expect(recommendations[i - 1].efficiency).toBeGreaterThanOrEqual(
            recommendations[i].efficiency
          );
        }
      });

      it('should respect max vacation per bridge limit', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, max_vacation_per_bridge: 2 })
          .expect(200);

        response.body.recommendations.forEach((bridge: any) => {
          expect(bridge.vacation_days_needed).toBeLessThanOrEqual(2);
        });
      });

      it('should handle bilingual responses', async () => {
        const responseDE = await request(app)
          .post('/v1/bridge-weekends')
          .set('Accept-Language', 'de')
          .send(validRequest)
          .expect(200);

        const responseEN = await request(app)
          .post('/v1/bridge-weekends')
          .set('Accept-Language', 'en')
          .send(validRequest)
          .expect(200);

        expect(responseDE.body.recommendations[0].holiday_name).toMatch(/[äöüÄÖÜß]/);
        expect(responseEN.body.recommendations[0].holiday_name).not.toMatch(/[äöüÄÖÜß]/);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero vacation days', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, vacation_days: 0 })
          .expect(200);

        expect(response.body.recommendations).toHaveLength(0);
        expect(response.body.vacation_budget.available).toBe(0);
      });

      it('should handle invalid state for bridge calculation', async () => {
        const response = await request(app)
          .post('/v1/bridge-weekends')
          .send({ ...validRequest, state: 'XX' })
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'STATE_NOT_FOUND'
        });
      });
    });
  });

  describe('POST /v1/vacation-plan - Vacation Plan Creation', () => {
    const validPlanRequest = {
      state: 'BY',
      vacation_days_available: 25,
      selected_bridges: ['bridge-christi-himmelfahrt-2025', 'bridge-tag-der-einheit-2025'],
      language: 'de'
    };

    describe('Request Validation', () => {
      it('should require all mandatory fields', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('state, vacation_days_available, selected_bridges, and language are required')
        });
      });

      it('should validate selected bridges array', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({ ...validPlanRequest, selected_bridges: [] })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('At least one bridge weekend must be selected')
        });
      });

      it('should limit maximum selected bridges', async () => {
        const tooManyBridges = Array(15).fill('bridge-test');

        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({ ...validPlanRequest, selected_bridges: tooManyBridges })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('Maximum 10 bridge weekends allowed')
        });
      });

      it('should validate vacation days range', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({ ...validPlanRequest, vacation_days_available: -5 })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('vacation_days_available must be between 0 and 50')
        });
      });

      it('should validate language parameter', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({ ...validPlanRequest, language: 'fr' })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('Language must be \'de\' or \'en\'')
        });
      });
    });

    describe('Vacation Budget Validation', () => {
      it('should reject when vacation budget exceeded', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({
            ...validPlanRequest,
            vacation_days_available: 2,
            selected_bridges: ['bridge-christi-himmelfahrt-2025', 'bridge-tag-der-einheit-2025'] // Assume these need 4+ days
          })
          .expect(422);

        expect(response.body).toMatchObject({
          error: 'VACATION_BUDGET_EXCEEDED',
          message: expect.stringContaining('Selected bridges require more vacation days than available')
        });
      });
    });

    describe('Successful Responses', () => {
      it('should create vacation plan within performance threshold', async () => {
        const startTime = Date.now();

        const response = await request(app)
          .post('/v1/vacation-plan')
          .send(validPlanRequest)
          .expect(201)
          .expect('Content-Type', /json/);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

        testSessionId = response.body.session_id;

        expect(response.body).toMatchObject({
          session_id: expect.stringMatching(/^sess_[a-f0-9]{32}$/),
          vacation_plan: expect.objectContaining({
            session_id: testSessionId,
            state_code: 'BY',
            vacation_days_available: 25,
            vacation_days_used: expect.any(Number),
            language: 'de',
            selected_bridges: validPlanRequest.selected_bridges,
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
          }),
          summary: expect.objectContaining({
            total_vacation_days_used: expect.any(Number),
            total_days_off_gained: expect.any(Number),
            overall_efficiency: expect.any(Number),
            bridge_weekends: expect.arrayContaining([
              expect.objectContaining({
                holiday_name: expect.any(String),
                dates: expect.stringMatching(/\d{1,2}\s\w+\s-\s\d{1,2}\s\w+\s\d{4}/),
                vacation_days: expect.any(Number),
                total_days: expect.any(Number)
              })
            ])
          })
        });
      });

      it('should include GDPR compliance headers and metadata', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send(validPlanRequest)
          .expect(201);

        expect(response.headers).toMatchObject({
          'x-gdpr-compliant': 'true',
          'x-data-retention': expect.stringContaining('90-days'),
          'x-session-expires': expect.any(String)
        });
      });

      it('should calculate efficiency correctly', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send(validPlanRequest)
          .expect(201);

        const summary = response.body.summary;
        const expectedEfficiency = summary.total_days_off_gained / summary.total_vacation_days_used;

        expect(summary.overall_efficiency).toBeCloseTo(expectedEfficiency, 2);
        expect(summary.overall_efficiency).toBeGreaterThanOrEqual(1.0);
      });
    });
  });

  describe('POST /v1/vacation-plan/{session_id}/email - Email Delivery', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test vacation plan first
      const planResponse = await request(app)
        .post('/v1/vacation-plan')
        .send({
          state: 'BY',
          vacation_days_available: 25,
          selected_bridges: ['bridge-christi-himmelfahrt-2025'],
          language: 'de'
        })
        .expect(201);

      sessionId = planResponse.body.session_id;
    });

    describe('Request Validation', () => {
      it('should require email and GDPR consent', async () => {
        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'VALIDATION_ERROR',
          message: expect.stringContaining('email and gdpr_consent are required')
        });
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'invalid-email',
            gdpr_consent: true
          })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_EMAIL',
          message: expect.stringContaining('Valid email address required')
        });
      });

      it('should require explicit GDPR consent', async () => {
        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'user@example.com',
            gdpr_consent: false
          })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'GDPR_CONSENT_REQUIRED',
          message: expect.stringContaining('GDPR consent must be explicitly granted')
        });
      });

      it('should validate session exists', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan/sess_nonexistent/email')
          .send({
            email: 'user@example.com',
            gdpr_consent: true
          })
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'SESSION_NOT_FOUND',
          message: expect.stringContaining('Vacation plan session not found or expired')
        });
      });
    });

    describe('Successful Email Delivery', () => {
      it('should send email within performance threshold', async () => {
        const startTime = Date.now();

        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'user@example.com',
            gdpr_consent: true,
            gdpr_timestamp: new Date().toISOString()
          })
          .expect(200)
          .expect('Content-Type', /json/);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(EMAIL_DELIVERY_TIMEOUT_MS);

        expect(response.body).toMatchObject({
          status: 'email_sent',
          email_id: expect.stringMatching(/^email_[a-f0-9]+$/),
          delivery_time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          export_links: expect.arrayContaining([
            expect.objectContaining({
              export_id: expect.stringMatching(/^[a-f0-9-]{36}$/),
              format: expect.stringMatching(/^(ical|google|outlook)$/),
              download_url: expect.stringContaining('/v1/export/'),
              expires_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
              file_size: expect.any(Number)
            })
          ])
        });

        // Store export ID for download tests
        testExportId = response.body.export_links[0].export_id;
      });

      it('should include GDPR compliance headers', async () => {
        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'user@example.com',
            gdpr_consent: true,
            gdpr_timestamp: new Date().toISOString()
          })
          .expect(200);

        expect(response.headers).toMatchObject({
          'x-gdpr-compliant': 'true',
          'x-email-retention': expect.stringContaining('90-days'),
          'x-export-expires': expect.any(String)
        });
      });

      it('should prevent duplicate email delivery', async () => {
        // Send first email
        await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'user@example.com',
            gdpr_consent: true
          })
          .expect(200);

        // Attempt second email
        const response = await request(app)
          .post(`/v1/vacation-plan/${sessionId}/email`)
          .send({
            email: 'user@example.com',
            gdpr_consent: true
          })
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'EMAIL_ALREADY_SENT',
          message: expect.stringContaining('Email has already been sent for this vacation plan')
        });
      });
    });

    describe('Rate Limiting', () => {
      it('should enforce rate limits for email delivery', async () => {
        // Simulate multiple rapid requests (implementation-specific)
        const requests = Array(6).fill(null).map((_, i) =>
          request(app)
            .post(`/v1/vacation-plan/${sessionId}/email`)
            .send({
              email: `user${i}@example.com`,
              gdpr_consent: true
            })
        );

        const responses = await Promise.allSettled(requests);
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && result.value.status === 429
        );

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /v1/export/{export_id} - Calendar Download', () => {
    let exportId: string;

    beforeEach(async () => {
      // Create vacation plan and send email to get export ID
      const planResponse = await request(app)
        .post('/v1/vacation-plan')
        .send({
          state: 'BY',
          vacation_days_available: 25,
          selected_bridges: ['bridge-christi-himmelfahrt-2025'],
          language: 'de'
        })
        .expect(201);

      const emailResponse = await request(app)
        .post(`/v1/vacation-plan/${planResponse.body.session_id}/email`)
        .send({
          email: 'user@example.com',
          gdpr_consent: true
        })
        .expect(200);

      exportId = emailResponse.body.export_links[0].export_id;
    });

    describe('Request Validation', () => {
      it('should validate export ID format', async () => {
        const response = await request(app)
          .get('/v1/export/invalid-id')
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_EXPORT_ID',
          message: expect.stringContaining('Export ID must be a valid UUID')
        });
      });

      it('should validate export exists', async () => {
        const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';

        const response = await request(app)
          .get(`/v1/export/${fakeUuid}`)
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'EXPORT_NOT_FOUND',
          message: expect.stringContaining('Calendar export not found or expired')
        });
      });

      it('should validate format parameter', async () => {
        const response = await request(app)
          .get(`/v1/export/${exportId}?format=invalid`)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'INVALID_FORMAT',
          message: expect.stringContaining('Format must be ical, google, or outlook')
        });
      });
    });

    describe('Successful Downloads', () => {
      const formats = ['ical', 'google', 'outlook'];

      formats.forEach(format => {
        it(`should download ${format} calendar within performance threshold`, async () => {
          const startTime = Date.now();

          const response = await request(app)
            .get(`/v1/export/${exportId}?format=${format}`)
            .expect(200)
            .expect('Content-Type', 'text/calendar');

          const responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

          expect(response.headers).toMatchObject({
            'content-disposition': expect.stringContaining('attachment; filename='),
            'cache-control': expect.stringContaining('private, max-age=3600')
          });

          // Validate iCal format structure
          expect(response.text).toContain('BEGIN:VCALENDAR');
          expect(response.text).toContain('END:VCALENDAR');
          expect(response.text).toContain('PRODID:TimeButler Calendar');
          expect(response.text).toContain('VERSION:2.0');
        });
      });

      it('should include proper calendar event structure', async () => {
        const response = await request(app)
          .get(`/v1/export/${exportId}`)
          .expect(200);

        // Validate calendar contains vacation events
        expect(response.text).toContain('BEGIN:VEVENT');
        expect(response.text).toContain('END:VEVENT');
        expect(response.text).toContain('SUMMARY:');
        expect(response.text).toContain('DTSTART:');
        expect(response.text).toContain('DTEND:');
        expect(response.text).toContain('DESCRIPTION:');
      });

      it('should handle German timezone correctly in calendar exports', async () => {
        const response = await request(app)
          .get(`/v1/export/${exportId}`)
          .expect(200);

        // Should include timezone information for German events
        expect(response.text).toMatch(/TZID:(Europe\/Berlin|CET|CEST)/);
      });
    });

    describe('Expiration Handling', () => {
      it('should return 410 for expired exports', async () => {
        // This test would require manipulating export expiration
        // Implementation would depend on how expiration is handled

        // Mock scenario - export expired after 30 days
        const expiredExportId = 'expired-uuid-here';

        const response = await request(app)
          .get(`/v1/export/${expiredExportId}`)
          .expect(410);

        expect(response.body).toMatchObject({
          error: 'EXPORT_EXPIRED',
          message: expect.stringContaining('Calendar export link has expired')
        });
      });
    });
  });

  describe('GET /health - Health Check Endpoint', () => {
    describe('System Health', () => {
      it('should return health status within performance threshold', async () => {
        const startTime = Date.now();

        const response = await request(app)
          .get('/health')
          .expect(200)
          .expect('Content-Type', /json/);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          services: expect.objectContaining({
            email: expect.stringMatching(/^(healthy|degraded|down)$/),
            database: expect.stringMatching(/^(healthy|degraded|down)$/),
            cache: expect.stringMatching(/^(healthy|degraded|down)$/)
          })
        });
      });

      it('should not require authentication', async () => {
        // Health endpoint should be publicly accessible
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
      });

      it('should include service-specific health checks', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        // Email service health is critical for core functionality
        expect(['healthy', 'degraded', 'down']).toContain(response.body.services.email);

        // Database and cache should also be monitored
        expect(['healthy', 'degraded', 'down']).toContain(response.body.services.database);
        expect(['healthy', 'degraded', 'down']).toContain(response.body.services.cache);
      });
    });

    describe('Degraded Service Scenarios', () => {
      it('should handle email service degradation gracefully', async () => {
        // This would require mocking email service failures
        // The health endpoint should still respond but indicate degraded status

        // Mock email service being down
        await testHelpers.mockEmailServiceDown();

        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.services.email).toBe('down');
        expect(response.body.status).toBe('degraded'); // Overall status degrades
      });
    });
  });

  describe('Cross-Endpoint Integration', () => {
    describe('Full User Journey', () => {
      it('should complete full vacation planning workflow', async () => {
        // 1. Get holidays for Bayern
        const holidaysResponse = await request(app)
          .get('/v1/holidays?state=BY&year=2025&lang=de')
          .expect(200);

        expect(holidaysResponse.body.holidays).toBeDefined();

        // 2. Calculate bridge weekends
        const bridgesResponse = await request(app)
          .post('/v1/bridge-weekends')
          .send({
            state: 'BY',
            vacation_days: 25,
            years: [2025],
            max_vacation_per_bridge: 3
          })
          .expect(200);

        expect(bridgesResponse.body.recommendations).toBeDefined();
        const selectedBridges = bridgesResponse.body.recommendations.slice(0, 2).map((b: any) => b.id);

        // 3. Create vacation plan
        const planResponse = await request(app)
          .post('/v1/vacation-plan')
          .send({
            state: 'BY',
            vacation_days_available: 25,
            selected_bridges: selectedBridges,
            language: 'de'
          })
          .expect(201);

        expect(planResponse.body.session_id).toBeDefined();

        // 4. Send email with calendar
        const emailResponse = await request(app)
          .post(`/v1/vacation-plan/${planResponse.body.session_id}/email`)
          .send({
            email: 'integration.test@example.com',
            gdpr_consent: true,
            gdpr_timestamp: new Date().toISOString()
          })
          .expect(200);

        expect(emailResponse.body.export_links).toBeDefined();

        // 5. Download calendar
        const exportId = emailResponse.body.export_links[0].export_id;
        const downloadResponse = await request(app)
          .get(`/v1/export/${exportId}`)
          .expect(200);

        expect(downloadResponse.text).toContain('BEGIN:VCALENDAR');

        // 6. Check system health
        await request(app)
          .get('/health')
          .expect(200);
      });
    });

    describe('Performance Under Load', () => {
      it('should maintain performance with concurrent requests', async () => {
        const concurrentRequests = 10;
        const requests = Array(concurrentRequests).fill(null).map((_, i) =>
          request(app)
            .get(`/v1/holidays?state=BY&year=2025&lang=de`)
        );

        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const totalTime = Date.now() - startTime;

        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        const avgResponseTime = totalTime / concurrentRequests;
        expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2); // Allow some overhead for concurrency
      });
    });
  });

  describe('GDPR Compliance Validation', () => {
    describe('Data Processing Consent', () => {
      it('should track GDPR consent timestamps', async () => {
        const consentTime = new Date().toISOString();

        const planResponse = await request(app)
          .post('/v1/vacation-plan')
          .send({
            state: 'BY',
            vacation_days_available: 25,
            selected_bridges: ['bridge-christi-himmelfahrt-2025'],
            language: 'de'
          })
          .expect(201);

        const response = await request(app)
          .post(`/v1/vacation-plan/${planResponse.body.session_id}/email`)
          .send({
            email: 'gdpr.test@example.com',
            gdpr_consent: true,
            gdpr_timestamp: consentTime
          })
          .expect(200);

        // Consent should be tracked in response headers
        expect(response.headers['x-gdpr-consent-recorded']).toBe('true');
        expect(response.headers['x-gdpr-consent-timestamp']).toBeDefined();
      });

      it('should include data retention information in all responses', async () => {
        const endpoints = [
          { method: 'get', path: '/v1/holidays?state=BY&year=2025' },
          { method: 'get', path: '/health' }
        ];

        for (const endpoint of endpoints) {
          const response = await request(app)[endpoint.method](endpoint.path);

          expect(response.headers).toMatchObject({
            'x-gdpr-compliant': 'true',
            'x-data-retention': expect.any(String)
          });
        }
      });
    });

    describe('Data Minimization', () => {
      it('should not store unnecessary personal data', async () => {
        const response = await request(app)
          .post('/v1/vacation-plan')
          .send({
            state: 'BY',
            vacation_days_available: 25,
            selected_bridges: ['bridge-christi-himmelfahrt-2025'],
            language: 'de'
          })
          .expect(201);

        // Response should not contain any personal identifiers
        expect(response.body.vacation_plan).not.toHaveProperty('ip_address');
        expect(response.body.vacation_plan).not.toHaveProperty('user_agent');
        expect(response.body.vacation_plan).not.toHaveProperty('fingerprint');
      });
    });
  });

  describe('German State Validation', () => {
    const germanStates = [
      'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
      'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
    ];

    describe('Complete State Coverage', () => {
      germanStates.forEach(stateCode => {
        it(`should handle holidays for state ${stateCode}`, async () => {
          const response = await request(app)
            .get(`/v1/holidays?state=${stateCode}&year=2025`)
            .expect(200);

          expect(response.body.state_info.code).toBe(stateCode);
          expect(response.body.holidays).toBeDefined();
        });
      });
    });

    describe('Religious Holiday Variations', () => {
      const catholicStates = ['BW', 'BY', 'NW', 'RP', 'SL'];
      const protestantStates = ['SH', 'MV', 'ST', 'TH'];

      catholicStates.forEach(state => {
        it(`should include Catholic holidays for ${state}`, async () => {
          const response = await request(app)
            .get(`/v1/holidays?state=${state}&year=2025`)
            .expect(200);

          const catholicHolidays = response.body.holidays.filter((h: any) =>
            h.religious === 'catholic'
          );

          expect(catholicHolidays.length).toBeGreaterThan(0);
        });
      });

      protestantStates.forEach(state => {
        it(`should handle Protestant regions for ${state}`, async () => {
          const response = await request(app)
            .get(`/v1/holidays?state=${state}&year=2025`)
            .expect(200);

          // Should return holidays appropriate for Protestant regions
          expect(response.body.holidays).toBeDefined();
        });
      });
    });
  });
});