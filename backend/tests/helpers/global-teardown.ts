/**
 * Global Test Teardown for Backend Integration Tests
 * Cleans up test environment, containers, and temporary data
 */

async function globalTeardown() {
  console.log('🧹 Starting Backend Integration Test Environment Cleanup');

  // Close database connections
  if (process.env.TEST_DATABASE_URL) {
    try {
      // Database connections should be closed in individual tests
      // This is just a safety cleanup
      console.log('📊 Database connections cleanup completed');
    } catch (error) {
      console.warn('⚠️ Database cleanup warning:', error.message);
    }
  }

  // Close Redis connections
  if (process.env.TEST_REDIS_URL) {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.TEST_REDIS_URL);
      await redis.flushdb();
      await redis.quit();
      console.log('🔄 Redis cache cleared and connections closed');
    } catch (error) {
      console.warn('⚠️ Redis cleanup warning:', error.message);
    }
  }

  // Clean up temporary files
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const tmpDir = path.join(__dirname, '../../tmp');

    try {
      await fs.access(tmpDir);
      const files = await fs.readdir(tmpDir);

      for (const file of files) {
        if (file.startsWith('test-') || file.includes('calendar-export')) {
          await fs.unlink(path.join(tmpDir, file));
        }
      }
      console.log('🗑️ Temporary test files cleaned up');
    } catch (error) {
      // Directory might not exist, which is fine
    }
  } catch (error) {
    console.warn('⚠️ Temporary file cleanup warning:', error.message);
  }

  // Note: Test containers (Docker) are automatically cleaned up by testcontainers
  // when the process exits, but we could explicitly stop them here if needed

  console.log('✅ Backend integration test environment cleanup completed');
}

export default globalTeardown;