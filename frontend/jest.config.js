/**
 * Frontend Jest Configuration - React/Next.js TDD Testing
 * Timebutler Calendar MVP - German Holiday Bridge Weekend Optimizer
 *
 * Constitutional Requirements:
 * - >90% test coverage requirement
 * - WCAG 2.1 Level AA compliance testing
 * - Cross-browser compatibility validation
 * - German market specific UI/UX testing
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to your Next.js app to load next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  displayName: 'Frontend Tests - React Components & UI',
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/cypress/',
    '<rootDir>/playwright-tests/'
  ],

  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^.+\\.(css|sass|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/pages/_*.{js,jsx,ts,tsx}', // Next.js special pages
    '!src/pages/api/**', // API routes tested in backend
    '!src/test-setup.ts',
    '!src/types/**', // Type definitions
    '!src/**/index.{js,jsx,ts,tsx}' // Re-export files
  ],

  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Critical UI components must have higher coverage
    'src/components/bridge-optimizer/**': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/components/holiday-calendar/**': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Accessibility components must be perfect
    'src/components/accessibility/**': {
      branches: 100,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Transform configuration (simplified)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },

  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json'
  ],

  // Test timeout
  testTimeout: 10000,

  // Parallel execution
  maxWorkers: '50%',

  // Verbose output for TDD
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  bail: false,
  detectOpenHandles: true,
  detectLeaks: false, // Can be memory intensive for frontend tests

  // Environment variables for testing
  setupFiles: [
    '<rootDir>/tests/env-setup.js'
  ]
};

// Export the Jest configuration
module.exports = createJestConfig(customJestConfig);