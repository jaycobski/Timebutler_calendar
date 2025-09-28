/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/unit/models/vacation-plan.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true
      },
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};