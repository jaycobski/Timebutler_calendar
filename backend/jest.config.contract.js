/**
 * Jest Contract Testing Configuration
 * API specification compliance, request/response validation
 * Ensures backend API matches frontend expectations
 */

const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  displayName: 'Contract Tests - API Specification Compliance',
  testMatch: [
    '<rootDir>/tests/contract/**/*.test.ts',
    '<rootDir>/tests/contract/**/*.spec.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/helpers/contract-test-helpers.ts'
  ],
  collectCoverageFrom: [
    'src/api/**/*.{ts,tsx}',
    'src/schemas/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // API routes must be fully tested
    'src/api/routes/**': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testTimeout: 15000,
  maxWorkers: '50%',
  verbose: true,
  // Contract tests need clean state
  clearMocks: true,
  restoreMocks: true
};