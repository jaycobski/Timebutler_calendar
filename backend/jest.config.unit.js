/**
 * Jest Unit Testing Configuration
 * Focused on holiday calculations, bridge weekend algorithms, and business logic
 * TDD approach with failing tests first
 */

const baseConfig = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...baseConfig,
  displayName: 'Unit Tests - German Holiday Calculations & Bridge Algorithms',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.spec.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/tests/helpers/unit-test-helpers.ts'
  ],
  collectCoverageFrom: [
    'src/models/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/scripts/**',
    '!src/index.ts',
    '!src/server.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 95,  // Higher threshold for unit tests
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Specific thresholds for critical German holiday logic
    'src/lib/holidays/**': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/lib/bridges/**': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testTimeout: 5000, // Unit tests should be fast
  maxWorkers: '75%', // More parallel workers for unit tests
  verbose: true,
  // Focus on deterministic, isolated unit testing
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};