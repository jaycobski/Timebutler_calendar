/**
 * Custom Jest Test Sequencer
 * Optimizes test execution order for TDD methodology
 * Runs failing tests first to ensure TDD discipline
 */

const Sequencer = require('@jest/test-sequencer').default;

class TDDSequencer extends Sequencer {
  /**
   * Sort tests to prioritize TDD methodology:
   * 1. Unit tests (fastest, should fail first in TDD)
   * 2. Contract tests (API specification)
   * 3. Integration tests (slower, external dependencies)
   * 4. Load/performance tests (slowest)
   */
  sort(tests) {
    const testOrder = [
      // TDD Phase 1: Unit tests - should fail first
      /\/unit\/.*holiday.*\.test\.ts$/,
      /\/unit\/.*bridge.*\.test\.ts$/,
      /\/unit\/.*calculation.*\.test\.ts$/,
      /\/unit\/.*algorithm.*\.test\.ts$/,
      /\/unit\/.*\.test\.ts$/,

      // TDD Phase 2: Contract tests - API specification
      /\/contract\/.*\.test\.ts$/,

      // TDD Phase 3: Integration tests - user stories
      /\/integration\/.*email.*\.test\.ts$/,
      /\/integration\/.*gdpr.*\.test\.ts$/,
      /\/integration\/.*api.*\.test\.ts$/,
      /\/integration\/.*\.test\.ts$/,

      // TDD Phase 4: Performance and load tests
      /\/load\/.*\.test\.ts$/,
      /\/performance\/.*\.test\.ts$/
    ];

    return tests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;

      // Find priority index for each test
      const priorityA = testOrder.findIndex(pattern => pattern.test(pathA));
      const priorityB = testOrder.findIndex(pattern => pattern.test(pathB));

      // If both tests match patterns, sort by priority
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }

      // If only one matches a pattern, prioritize it
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;

      // For German holiday testing, prioritize critical calculations
      if (pathA.includes('holiday') && !pathB.includes('holiday')) return -1;
      if (pathB.includes('holiday') && !pathA.includes('holiday')) return 1;

      if (pathA.includes('bridge') && !pathB.includes('bridge')) return -1;
      if (pathB.includes('bridge') && !pathA.includes('bridge')) return 1;

      // Sort alphabetically for consistent execution
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = TDDSequencer;