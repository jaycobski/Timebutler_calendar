/**
 * Backend Test Setup - Jest Configuration for TDD Testing
 * Timebutler Calendar MVP - German Holiday Bridge Weekend Optimizer
 *
 * Constitutional Requirements:
 * - >90% test coverage across all metrics
 * - TDD methodology with failing tests first
 * - German market specific testing scenarios
 * - GDPR compliance validation
 * - Performance testing for 25k concurrent users
 */

const { execSync } = require('child_process');
const { createHash } = require('crypto');

// Environment setup for testing
process.env.NODE_ENV = 'test';
process.env.TZ = 'Europe/Berlin'; // German timezone for accurate holiday testing
process.env.LOG_LEVEL = 'silent';

// Test database configuration
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/timebutler_calendar_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6380';

// Mock external services in test environment
process.env.RESEND_API_KEY = 'test_api_key_' + createHash('md5').update('test').digest('hex');
process.env.GERMAN_HOLIDAY_API_KEY = 'test_gov_api_key';
process.env.SENTRY_DSN = '';
process.env.NEWRELIC_ENABLED = 'false';

// Test configuration constants
global.TEST_CONSTANTS = {
  // German market specific constants
  GERMAN_STATES: [
    'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
    'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
  ],

  // Performance testing targets from constitution
  PERFORMANCE_TARGETS: {
    MAX_API_RESPONSE_TIME: 100, // milliseconds
    MAX_EMAIL_DELIVERY_TIME: 5000, // milliseconds
    CONCURRENT_USERS: 25000,
    MAX_BUNDLE_SIZE: 200 * 1024 // 200KB gzipped
  },

  // GDPR compliance testing constants
  GDPR_REQUIREMENTS: {
    DATA_RETENTION_DAYS: 90,
    EXPORT_LINK_VALIDITY_DAYS: 30,
    CONSENT_REQUIRED_FIELDS: ['email', 'state', 'vacation_days'],
    REQUIRED_PRIVACY_NOTICES: ['data_usage', 'retention', 'deletion_rights']
  },

  // German holiday calculation test data
  HOLIDAY_TEST_YEARS: [2025, 2026],

  // Test user scenarios
  TEST_SCENARIOS: {
    BAVARIAN_CATHOLIC_USER: {
      state: 'BY',
      vacation_days: 30,
      preferences: { include_religious: true }
    },
    BERLIN_MINIMAL_USER: {
      state: 'BE',
      vacation_days: 20,
      preferences: { include_religious: false }
    },
    NORTH_RHINE_WESTPHALIA_POWER_USER: {
      state: 'NW',
      vacation_days: 35,
      preferences: { optimize_long_weekends: true }
    }
  }
};

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.generateTestEmail = (domain = 'example.com') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@${domain}`;
};

global.createGermanTestDate = (year, month, day) => {
  // Create date in German timezone (CET/CEST)
  const date = new Date(year, month - 1, day);
  return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
};

// Database setup and cleanup utilities
global.setupTestDatabase = async () => {
  try {
    // Clear test database
    if (process.env.DATABASE_URL?.includes('test')) {
      execSync('npm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Test database migrated successfully');
    }
  } catch (error) {
    console.warn('⚠️ Database setup failed (may not be available in CI):', error.message);
  }
};

global.cleanupTestDatabase = async () => {
  try {
    if (process.env.DATABASE_URL?.includes('test')) {
      execSync('npm run db:rollback', { stdio: 'inherit' });
      console.log('✅ Test database cleaned up');
    }
  } catch (error) {
    console.warn('⚠️ Database cleanup failed:', error.message);
  }
};

// Redis test utilities
global.setupTestRedis = async () => {
  try {
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    await redis.flushdb();
    await redis.quit();
    console.log('✅ Test Redis cleared');
  } catch (error) {
    console.warn('⚠️ Redis setup failed (may not be available in CI):', error.message);
  }
};

// Performance testing utilities
global.measureExecutionTime = async (fn, label = 'Operation') => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds

  console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
};

// German holiday testing utilities
global.validateGermanHoliday = (holiday) => {
  const requiredFields = ['name', 'date', 'state', 'type', 'is_federal'];
  const missingFields = requiredFields.filter(field => !(field in holiday));

  if (missingFields.length > 0) {
    throw new Error(`German holiday missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate German state codes
  if (!global.TEST_CONSTANTS.GERMAN_STATES.includes(holiday.state) && holiday.state !== 'ALL') {
    throw new Error(`Invalid German state code: ${holiday.state}`);
  }

  return true;
};

// GDPR compliance testing utilities
global.validateGDPRCompliance = (data) => {
  const checks = {
    hasConsentTimestamp: !!data.consent_timestamp,
    hasPrivacyNoticeVersion: !!data.privacy_notice_version,
    hasDataRetentionInfo: !!data.retention_info,
    emailOptInExplicit: data.email_consent === true,
    noUnnecessaryData: !data.password && !data.phone && !data.address
  };

  const failed = Object.entries(checks)
    .filter(([_, passed]) => !passed)
    .map(([check]) => check);

  if (failed.length > 0) {
    throw new Error(`GDPR compliance failures: ${failed.join(', ')}`);
  }

  return true;
};

// Mock external services for consistent testing
global.mockExternalServices = () => {
  // Mock German government holiday API
  jest.mock('axios', () => ({
    get: jest.fn(() => Promise.resolve({
      data: {
        holidays: [
          {
            name: 'Neujahr',
            date: '2025-01-01',
            state: 'ALL',
            type: 'federal',
            is_federal: true
          },
          {
            name: 'Heilige Drei Könige',
            date: '2025-01-06',
            state: 'BW',
            type: 'religious',
            is_federal: false
          }
        ]
      }
    }))
  }));

  // Mock Resend email service
  jest.mock('resend', () => ({
    Resend: jest.fn(() => ({
      emails: {
        send: jest.fn(() => Promise.resolve({
          id: 'test-email-id',
          to: 'test@example.com',
          created_at: new Date().toISOString()
        }))
      }
    }))
  }));
};

// Setup hooks for all tests
beforeAll(async () => {
  console.log('🚀 Starting TDD Test Suite - Timebutler Calendar MVP');
  console.log('📍 Testing German Holiday Bridge Weekend Optimizer');
  console.log('🎯 Constitutional Requirement: >90% Coverage');

  await setupTestDatabase();
  await setupTestRedis();
  global.mockExternalServices();
});

afterAll(async () => {
  await cleanupTestDatabase();
  console.log('✅ TDD Test Suite Completed');
});

beforeEach(() => {
  // Clear all mocks before each test for clean TDD state
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup any test-specific state
  jest.restoreAllMocks();
});

// Custom Jest matchers for German holiday testing
expect.extend({
  toBeValidGermanHoliday(received) {
    try {
      global.validateGermanHoliday(received);
      return {
        message: () => `Expected ${received} not to be a valid German holiday`,
        pass: true
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be a valid German holiday: ${error.message}`,
        pass: false
      };
    }
  },

  toBeGDPRCompliant(received) {
    try {
      global.validateGDPRCompliance(received);
      return {
        message: () => `Expected ${received} not to be GDPR compliant`,
        pass: true
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be GDPR compliant: ${error.message}`,
        pass: false
      };
    }
  },

  toBeWithinPerformanceTarget(received, target) {
    const pass = received <= target;
    return {
      message: () => pass
        ? `Expected ${received}ms to exceed performance target of ${target}ms`
        : `Expected ${received}ms to be within performance target of ${target}ms`,
      pass
    };
  }
});

console.log('✅ Backend test environment configured for TDD methodology');
console.log('🇩🇪 German market testing utilities loaded');
console.log('📊 Performance monitoring enabled');
console.log('🔒 GDPR compliance validation ready');