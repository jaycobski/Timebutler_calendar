/**
 * Integration Test Helpers for Backend API Testing
 * Focus: API endpoints, email delivery, database operations, GDPR compliance
 * Constitutional Requirements: Email delivery success rate >95%
 */

import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { faker } from '@faker-js/faker';
import Redis from 'ioredis';
import { Pool } from 'pg';
import nock from 'nock';

/**
 * API Test Client Factory
 * Creates configured test clients for different scenarios
 */
export class ApiTestClient {
  private app: FastifyInstance;
  private client: supertest.SuperTest<supertest.Test>;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.client = supertest(app.server);
  }

  // German user API requests with proper headers
  async getHolidaysForState(state: string, year = 2025, lang = 'de') {
    return this.client
      .get(`/v1/holidays`)
      .query({ state, year, lang })
      .set('Accept-Language', lang === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9')
      .set('User-Agent', 'Timebutler-Calendar-Test/1.0')
      .expect('Content-Type', /json/);
  }

  async calculateBridgeWeekends(data: {
    state: string;
    year?: number;
    vacation_days: number;
    optimize_for?: string;
  }) {
    return this.client
      .post('/v1/bridge-weekends')
      .send({
        year: 2025,
        optimize_for: 'efficiency',
        ...data
      })
      .set('Content-Type', 'application/json')
      .set('Accept-Language', 'de-DE,de;q=0.9')
      .expect('Content-Type', /json/);
  }

  async createVacationPlan(data: {
    state: string;
    vacation_days: number;
    selected_bridges: number[];
    language?: string;
  }) {
    return this.client
      .post('/v1/vacation-plan')
      .send({
        language: 'de',
        ...data
      })
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/);
  }

  async sendVacationPlanEmail(planId: string, emailData: {
    email: string;
    gdpr_consent: boolean;
    privacy_notice_version: string;
    marketing_consent?: boolean;
  }) {
    return this.client
      .post(`/v1/vacation-plan/${planId}/email`)
      .send(emailData)
      .set('Content-Type', 'application/json');
  }

  async downloadCalendarExport(exportId: string, signature: string) {
    return this.client
      .get(`/v1/export/${exportId}`)
      .query({ signed: signature });
  }

  async healthCheck() {
    return this.client
      .get('/health')
      .expect('Content-Type', /json/);
  }
}

/**
 * Database Test Helper
 * Manages test database state and operations
 */
export class DatabaseTestHelper {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 5, // Limit connections during testing
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  async setup() {
    const client = await this.pool.connect();
    try {
      // Create test data tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_holidays (
          id VARCHAR PRIMARY KEY,
          key VARCHAR NOT NULL,
          name_de VARCHAR NOT NULL,
          name_en VARCHAR NOT NULL,
          date DATE NOT NULL,
          year INTEGER NOT NULL,
          state VARCHAR(2) NOT NULL,
          is_federal BOOLEAN NOT NULL,
          type VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS test_vacation_plans (
          id VARCHAR PRIMARY KEY,
          state VARCHAR(2) NOT NULL,
          vacation_days INTEGER NOT NULL,
          selected_bridges JSONB NOT NULL,
          language VARCHAR(2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          email_sent_at TIMESTAMP,
          export_url VARCHAR
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS test_email_logs (
          id VARCHAR PRIMARY KEY,
          to_email VARCHAR NOT NULL,
          subject VARCHAR NOT NULL,
          status VARCHAR NOT NULL,
          sent_at TIMESTAMP DEFAULT NOW(),
          plan_id VARCHAR REFERENCES test_vacation_plans(id)
        );
      `);

    } finally {
      client.release();
    }
  }

  async cleanup() {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM test_email_logs');
      await client.query('DELETE FROM test_vacation_plans');
      await client.query('DELETE FROM test_holidays');
    } finally {
      client.release();
    }
  }

  async insertHolidays(holidays: any[]) {
    const client = await this.pool.connect();
    try {
      for (const holiday of holidays) {
        await client.query(`
          INSERT INTO test_holidays (id, key, name_de, name_en, date, year, state, is_federal, type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [
          holiday.id, holiday.key, holiday.name_de, holiday.name_en,
          holiday.date, holiday.year, holiday.state, holiday.is_federal, holiday.type
        ]);
      }
    } finally {
      client.release();
    }
  }

  async getHolidaysByState(state: string, year: number) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM test_holidays
        WHERE (state = $1 OR state = 'ALL') AND year = $2
        ORDER BY date
      `, [state, year]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async insertVacationPlan(plan: any) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO test_vacation_plans (id, state, vacation_days, selected_bridges, language)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [plan.id, plan.state, plan.vacation_days, JSON.stringify(plan.selected_bridges), plan.language]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async logEmailSent(emailLog: {
    id: string;
    to_email: string;
    subject: string;
    status: string;
    plan_id: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO test_email_logs (id, to_email, subject, status, plan_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [emailLog.id, emailLog.to_email, emailLog.subject, emailLog.status, emailLog.plan_id]);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

/**
 * Redis Cache Test Helper
 * Manages Redis cache operations during testing
 */
export class CacheTestHelper {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });
  }

  async setup() {
    await this.redis.flushdb();
  }

  async cleanup() {
    await this.redis.flushdb();
  }

  async setHolidayCache(state: string, year: number, holidays: any[]) {
    const key = `holidays:${state}:${year}`;
    await this.redis.setex(key, 86400, JSON.stringify(holidays)); // 24 hour TTL
  }

  async getHolidayCache(state: string, year: number) {
    const key = `holidays:${state}:${year}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setBridgeWeekendCache(cacheKey: string, bridges: any[]) {
    await this.redis.setex(cacheKey, 3600, JSON.stringify(bridges)); // 1 hour TTL
  }

  async incrementEmailCounter(date: string) {
    const key = `email_count:${date}`;
    return await this.redis.incr(key);
  }

  async getRateLimitInfo(ip: string, endpoint: string) {
    const key = `rate_limit:${ip}:${endpoint}`;
    return await this.redis.get(key);
  }

  async close() {
    await this.redis.quit();
  }
}

/**
 * Email Service Test Helper
 * Mocks and validates email delivery
 */
export class EmailTestHelper {
  private static sentEmails: any[] = [];

  static setup() {
    this.sentEmails = [];

    // Mock Resend API
    nock('https://api.resend.com')
      .persist()
      .post('/emails')
      .reply((uri, requestBody: any) => {
        const email = {
          id: faker.string.uuid(),
          to: requestBody.to,
          from: requestBody.from,
          subject: requestBody.subject,
          html: requestBody.html,
          text: requestBody.text,
          sent_at: new Date().toISOString(),
          status: 'sent'
        };

        this.sentEmails.push(email);

        return [200, {
          id: email.id,
          to: email.to,
          created_at: email.sent_at
        }];
      });
  }

  static cleanup() {
    nock.cleanAll();
    this.sentEmails = [];
  }

  static getSentEmails() {
    return [...this.sentEmails];
  }

  static getLastSentEmail() {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  static findEmailByRecipient(email: string) {
    return this.sentEmails.find(sent => sent.to.includes(email));
  }

  static validateEmailContent(email: any, expectedContent: {
    subject?: string;
    recipientCount?: number;
    containsText?: string[];
    attachmentCount?: number;
  }) {
    const validations = {
      hasSubject: expectedContent.subject ? email.subject.includes(expectedContent.subject) : true,
      hasCorrectRecipientCount: expectedContent.recipientCount ?
        Array.isArray(email.to) ? email.to.length === expectedContent.recipientCount : true : true,
      containsRequiredText: expectedContent.containsText ?
        expectedContent.containsText.every(text =>
          email.html?.includes(text) || email.text?.includes(text)
        ) : true,
      hasAttachments: expectedContent.attachmentCount ?
        (email.attachments?.length || 0) === expectedContent.attachmentCount : true
    };

    return validations;
  }

  static validateGDPRCompliance(email: any) {
    const html = email.html || '';
    const text = email.text || '';

    return {
      hasUnsubscribeLink: html.includes('unsubscribe') || text.includes('unsubscribe'),
      hasPrivacyNotice: html.includes('Datenschutz') || html.includes('privacy') ||
                       text.includes('Datenschutz') || text.includes('privacy'),
      hasDataRetentionInfo: html.includes('90 Tage') || html.includes('90 days') ||
                           text.includes('90 Tage') || text.includes('90 days'),
      hasConsentReminder: html.includes('eingewilligt') || html.includes('consented') ||
                         text.includes('eingewilligt') || text.includes('consented')
    };
  }
}

/**
 * GDPR Compliance Test Helper
 * Validates data handling and user rights
 */
export class GDPRTestHelper {
  static validateConsentData(data: any) {
    const required = [
      'gdpr_consent',
      'privacy_notice_version',
      'consent_timestamp'
    ];

    const validations = {
      hasRequiredFields: required.every(field => field in data),
      hasExplicitConsent: data.gdpr_consent === true,
      hasTimestamp: data.consent_timestamp && !isNaN(new Date(data.consent_timestamp).getTime()),
      hasValidPrivacyVersion: data.privacy_notice_version && typeof data.privacy_notice_version === 'string'
    };

    return validations;
  }

  static validateDataMinimization(userData: any) {
    const allowedFields = [
      'id', 'state', 'vacation_days', 'selected_bridges', 'language', 'email',
      'gdpr_consent', 'privacy_notice_version', 'consent_timestamp',
      'created_at', 'updated_at'
    ];

    const unnecessaryFields = Object.keys(userData).filter(
      field => !allowedFields.includes(field)
    );

    return {
      isMinimized: unnecessaryFields.length === 0,
      unnecessaryFields
    };
  }

  static validateDataRetention(createdAt: string, retentionDays = 90) {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    return {
      withinRetentionPeriod: daysDiff <= retentionDays,
      daysSinceCreation: daysDiff,
      shouldBeDeleted: daysDiff > retentionDays
    };
  }

  static generateGDPRCompliantUserData() {
    return {
      id: faker.string.uuid(),
      state: faker.helpers.arrayElement(['BY', 'BE', 'NW', 'BW']),
      vacation_days: faker.number.int({ min: 20, max: 35 }),
      selected_bridges: [1, 3, 5],
      language: faker.helpers.arrayElement(['de', 'en']),
      email: faker.internet.email({ provider: 'example.de' }),
      gdpr_consent: true,
      privacy_notice_version: '1.0',
      consent_timestamp: new Date().toISOString(),
      marketing_consent: faker.datatype.boolean(),
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Performance Test Helper
 * Monitors API performance during integration tests
 */
export class PerformanceTestHelper {
  private static metrics: Array<{
    endpoint: string;
    method: string;
    duration: number;
    timestamp: Date;
  }> = [];

  static startTiming() {
    return process.hrtime.bigint();
  }

  static endTiming(start: bigint, endpoint: string, method: string) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    this.metrics.push({
      endpoint,
      method,
      duration,
      timestamp: new Date()
    });

    return duration;
  }

  static getMetrics() {
    return [...this.metrics];
  }

  static getAverageResponseTime(endpoint?: string) {
    const filteredMetrics = endpoint
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / filteredMetrics.length;
  }

  static getP95ResponseTime(endpoint?: string) {
    const filteredMetrics = endpoint
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const sorted = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[p95Index] || 0;
  }

  static validatePerformanceTargets() {
    const avgResponseTime = this.getAverageResponseTime();
    const p95ResponseTime = this.getP95ResponseTime();

    return {
      meetsAverageTarget: avgResponseTime <= 100, // Constitutional: <100ms
      meetsP95Target: p95ResponseTime <= 200,     // Allow higher P95
      averageResponseTime: avgResponseTime,
      p95ResponseTime: p95ResponseTime,
      totalRequests: this.metrics.length
    };
  }

  static reset() {
    this.metrics = [];
  }
}

// Export all helpers
export const integrationTestHelpers = {
  ApiTestClient,
  DatabaseTestHelper,
  CacheTestHelper,
  EmailTestHelper,
  GDPRTestHelper,
  PerformanceTestHelper
};