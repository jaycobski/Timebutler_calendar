/**
 * Global Teardown for Progressive Enhancement Tests
 *
 * Cleans up after no-JavaScript testing.
 */

async function globalTeardown(config) {
  console.log('🧹 Cleaning up Progressive Enhancement Test Environment...');

  try {
    // Clean up any test artifacts
    const fs = require('fs').promises;
    const path = require('path');

    // Remove temporary test files if any were created
    const tempDir = path.join(__dirname, '../../../temp-test-files');
    try {
      await fs.rmdir(tempDir, { recursive: true });
      console.log('✅ Cleaned up temporary test files');
    } catch (e) {
      // Directory might not exist, which is fine
    }

    // Log test completion summary
    const testResultsDir = path.join(__dirname, '../../../test-results');
    try {
      const resultsExist = await fs.access(testResultsDir).then(() => true).catch(() => false);
      if (resultsExist) {
        console.log('📊 Test results saved in test-results/ directory');
      }
    } catch (e) {
      // Results directory might not exist yet
    }

    console.log('✅ Progressive Enhancement Test Environment Cleaned Up');

  } catch (error) {
    console.error('❌ Error during teardown:', error.message);
    // Don't throw error during teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;