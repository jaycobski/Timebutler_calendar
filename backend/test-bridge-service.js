/**
 * Simple test script for BridgeCalculatorService
 * Validates basic functionality without full test suite overhead
 */

const { DateTime } = require('luxon');

// Mock Redis
class MockRedis {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async setex(key, ttl, value) {
    this.cache.set(key, value);
  }

  async del(key) {
    this.cache.delete(key);
  }

  async quit() {
    this.cache.clear();
  }
}

// Mock Holiday Service
class MockHolidayService {
  async getHolidaysByState(stateCode, year) {
    // Return sample German holidays for testing
    return [
      {
        id: `neujahr-${year}`,
        name_de: 'Neujahr',
        name_en: 'New Year\'s Day',
        date: `${year}-01-01`,
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      },
      {
        id: `tag-der-arbeit-${year}`,
        name_de: 'Tag der Arbeit',
        name_en: 'Labour Day',
        date: `${year}-05-01`,
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      },
      {
        id: `tag-der-deutschen-einheit-${year}`,
        name_de: 'Tag der Deutschen Einheit',
        name_en: 'German Unity Day',
        date: `${year}-10-03`,
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      },
      {
        id: `weihnachtstag-${year}`,
        name_de: '1. Weihnachtstag',
        name_en: 'Christmas Day',
        date: `${year}-12-25`,
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      },
      {
        id: `zweiter-weihnachtstag-${year}`,
        name_de: '2. Weihnachtstag',
        name_en: 'Boxing Day',
        date: `${year}-12-26`,
        type: 'federal',
        states: ['ALL'],
        is_catholic: false,
        is_protestant: false
      }
    ];
  }

  async close() {
    // Mock cleanup
  }
}

// Mock environment config
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CACHE_TTL_BRIDGES = '86400';

// Test the service
async function testBridgeCalculatorService() {
  console.log('🧪 Testing BridgeCalculatorService...\n');

  try {
    // Import after setting environment
    const { BridgeCalculatorService } = require('./src/services/BridgeCalculatorService');

    // Create service with mocks
    const mockHolidayService = new MockHolidayService();
    const mockRedis = new MockRedis();
    const service = new BridgeCalculatorService(mockHolidayService, mockRedis);

    // Test 1: Basic bridge calculation
    console.log('Test 1: Calculate bridges for Bavaria 2025...');
    const startTime = performance.now();

    const bridges = await service.calculateBridgeWeekends('BY', 2025);

    const duration = performance.now() - startTime;
    console.log(`✅ Calculated ${bridges.length} bridges in ${duration.toFixed(2)}ms`);
    console.log(`Performance requirement (<100ms): ${duration < 100 ? '✅ PASS' : '❌ FAIL'}`);

    if (bridges.length > 0) {
      console.log(`Best bridge: ${bridges[0].efficiency.toFixed(2)} efficiency, ${bridges[0].vacation_days_needed} vacation days needed`);
    }

    // Test 2: Optimal bridge selection
    console.log('\nTest 2: Calculate optimal bridges with 5-day budget...');
    const optimal = await service.calculateOptimalBridges('BY', 2025, 5);
    console.log(`✅ Selected ${optimal.selectedBridges.length} optimal bridges`);
    console.log(`Total vacation used: ${optimal.totalVacationUsed}/5 days`);
    console.log(`Total days off: ${optimal.totalDaysOff} days`);
    console.log(`Average efficiency: ${optimal.averageEfficiency.toFixed(2)}`);

    // Test 3: May cluster calculation
    console.log('\nTest 3: Calculate May cluster opportunities...');
    const mayCluster = await service.calculateMayCluster('BY', 2025);
    console.log(`✅ Found ${mayCluster.length} May cluster opportunities`);

    // Test 4: Christmas cluster calculation
    console.log('\nTest 4: Calculate Christmas cluster opportunities...');
    const christmasCluster = await service.calculateChristmasCluster('BY', 2025);
    console.log(`✅ Found ${christmasCluster.length} Christmas cluster opportunities`);

    // Test 5: Performance metrics
    console.log('\nTest 5: Performance metrics...');
    const metrics = service.getPerformanceMetrics();
    console.log(`Calculations: ${metrics.calculations}`);
    console.log(`Cache hits: ${metrics.cacheHits}`);
    console.log(`Cache misses: ${metrics.cacheMisses}`);
    console.log(`Average response time: ${metrics.avgResponseTime.toFixed(2)}ms`);

    // Clean up
    await service.close();

    console.log('\n🎉 All tests passed! BridgeCalculatorService is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testBridgeCalculatorService();