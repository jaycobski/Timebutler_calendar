/**
 * Jest Integration Testing Configuration
 * API endpoints, email delivery, GDPR compliance, and user story validation
 * Requires external services (database, Redis, email service)
 */

const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests - API Endpoints & Email Delivery',
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.spec.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/helpers/integration-test-helpers.ts'
  ],
  collectCoverageFrom: [
    'src/api/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/middleware/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/scripts/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Email delivery must be rock solid
    'src/services/email/**': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // GDPR compliance is critical
    'src/middleware/gdpr/**': {
      branches: 100,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  testTimeout: 30000, // Longer timeout for external service calls
  maxWorkers: 2, // Limit workers to avoid overwhelming external services
  verbose: true,
  // Run integration tests in sequence to avoid conflicts
  runInBand: false,
  // Additional setup for integration testing
  globalSetup: '<rootDir>/tests/helpers/global-setup.ts',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.ts'
};