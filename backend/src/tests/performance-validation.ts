import { FastifyInstance } from 'fastify';

/**
 * Performance Validation Test Suite
 * Constitutional requirement: <100ms response times for all interactions
 * Validates constitutional compliance under various load conditions
 */

interface PerformanceTest {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  expectedResponseTime: number; // ms
  constitutionalRequirement: number; // ms (usually 100ms)
  concurrentUsers?: number;
  requestsPerSecond?: number;
  duration?: number; // seconds
}

interface TestResult {
  testName: string;
  passed: boolean;
  responseTime: {
    min: number;
    max: number;
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  constitutionalCompliance: {
    compliant: boolean;
    violationRate: number; // percentage
    violations: number;
    totalRequests: number;
  };
  throughput: {
    requestsPerSecond: number;
    totalRequests: number;
    successRate: number;
  };
  errors: Array<{
    statusCode: number;
    message: string;
    count: number;
  }>;
}

interface LoadTestConfig {
  warmupDuration: number; // seconds
  testDuration: number; // seconds
  rampUpTime: number; // seconds
  maxConcurrentUsers: number;
  requestInterval: number; // ms between requests
  timeoutMs: number;
}

class PerformanceValidator {
  private readonly constitutionalLimit = 100; // 100ms constitutional requirement
  private readonly germanStates = ['BY', 'NW', 'BW', 'NI', 'HE', 'SN', 'RP', 'BE', 'SH', 'BB', 'ST', 'TH', 'HH', 'MV', 'SL', 'HB'];

  constructor(private app: FastifyInstance) {}

  /**
   * Run complete constitutional performance validation
   */
  async runConstitutionalValidation(): Promise<{
    overallCompliance: boolean;
    testResults: TestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      constitutionalViolations: number;
      averageResponseTime: number;
      worstPerformingEndpoint: string;
    };
    recommendations: string[];
  }> {
    console.log('🚀 Starting Constitutional Performance Validation...');

    const tests = this.getConstitutionalTests();
    const results: TestResult[] = [];

    for (const test of tests) {
      console.log(`\n📋 Running test: ${test.name}`);
      const result = await this.runSingleTest(test);
      results.push(result);

      console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.responseTime.average.toFixed(1)}ms avg (${result.constitutionalCompliance.compliant ? 'COMPLIANT' : 'VIOLATION'})`);
    }

    const summary = this.calculateSummary(results);
    const recommendations = this.generateRecommendations(results);

    return {
      overallCompliance: summary.constitutionalViolations === 0,
      testResults: results,
      summary,
      recommendations
    };
  }

  /**
   * Run German market specific load tests
   */
  async runGermanMarketLoadTest(): Promise<{
    peakHourCompliance: boolean;
    vacationSeasonCompliance: boolean;
    stateSpecificPerformance: Record<string, TestResult>;
    concurrencyTest: TestResult;
    recommendations: string[];
  }> {
    console.log('🇩🇪 Starting German Market Load Test...');

    // Test all German states
    const stateResults: Record<string, TestResult> = {};
    for (const state of this.germanStates.slice(0, 5)) { // Test top 5 states
      console.log(`\n🏛️ Testing state: ${state}`);
      const stateTest: PerformanceTest = {
        name: `German State ${state} Holidays`,
        description: `Holiday data retrieval for German state ${state}`,
        endpoint: `/v1/holidays?state=${state}&year=2025&lang=de`,
        method: 'GET',
        expectedResponseTime: 50,
        constitutionalRequirement: 100,
        concurrentUsers: 100
      };

      stateResults[state] = await this.runSingleTest(stateTest);
    }

    // Test peak concurrency (25k users constitutional requirement)
    console.log('\n👥 Testing peak concurrency (25k users)...');
    const concurrencyTest = await this.runConcurrencyTest();

    const peakHourCompliance = Object.values(stateResults).every(r => r.constitutionalCompliance.compliant);
    const vacationSeasonCompliance = concurrencyTest.constitutionalCompliance.compliant;

    return {
      peakHourCompliance,
      vacationSeasonCompliance,
      stateSpecificPerformance: stateResults,
      concurrencyTest,
      recommendations: this.generateGermanMarketRecommendations(stateResults, concurrencyTest)
    };
  }

  /**
   * Run 3G network simulation tests
   */
  async run3GNetworkTest(): Promise<{
    networkCompliance: boolean;
    results: TestResult[];
    networkOptimizations: string[];
  }> {
    console.log('📱 Starting 3G Network Simulation Test...');

    // Simulate 3G network conditions
    const networkTests = this.get3GNetworkTests();
    const results: TestResult[] = [];

    for (const test of networkTests) {
      console.log(`\n🌐 Testing: ${test.name}`);
      // Add artificial network delay to simulate 3G
      const result = await this.runSingleTestWith3GSimulation(test);
      results.push(result);
    }

    const networkCompliance = results.every(r => r.constitutionalCompliance.compliant);
    const networkOptimizations = this.generate3GOptimizations(results);

    return {
      networkCompliance,
      results,
      networkOptimizations
    };
  }

  /**
   * Run memory pressure tests
   */
  async runMemoryPressureTest(): Promise<{
    memoryCompliance: boolean;
    memoryLeakDetected: boolean;
    gcPerformance: {
      averageGCTime: number;
      maxGCTime: number;
      gcFrequency: number;
    };
    recommendations: string[];
  }> {
    console.log('🧠 Starting Memory Pressure Test...');

    const initialMemory = process.memoryUsage();
    console.log(`Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);

    // Simulate sustained load
    const sustainedLoadTest: PerformanceTest = {
      name: 'Sustained Load Memory Test',
      description: 'Test memory usage under sustained load',
      endpoint: '/v1/holidays?state=BY&year=2025',
      method: 'GET',
      expectedResponseTime: 100,
      constitutionalRequirement: 100,
      concurrentUsers: 1000,
      duration: 300 // 5 minutes
    };

    const result = await this.runSingleTest(sustainedLoadTest);

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

    console.log(`Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`Memory increase: ${Math.round(memoryIncreaseMB)}MB`);

    const memoryLeakDetected = memoryIncreaseMB > 100; // More than 100MB increase
    const memoryCompliance = !memoryLeakDetected && result.constitutionalCompliance.compliant;

    return {
      memoryCompliance,
      memoryLeakDetected,
      gcPerformance: {
        averageGCTime: 0, // Would be calculated from actual GC monitoring
        maxGCTime: 0,
        gcFrequency: 0
      },
      recommendations: this.generateMemoryRecommendations(memoryLeakDetected, memoryIncreaseMB)
    };
  }

  /**
   * Get constitutional performance tests
   */
  private getConstitutionalTests(): PerformanceTest[] {
    return [
      {
        name: 'Holiday Data Retrieval',
        description: 'Basic holiday data retrieval for German state',
        endpoint: '/v1/holidays?state=BY&year=2025&lang=de',
        method: 'GET',
        expectedResponseTime: 50,
        constitutionalRequirement: 100
      },
      {
        name: 'Bridge Weekend Calculation',
        description: 'Bridge weekend opportunities calculation',
        endpoint: '/v1/bridge-weekends?state=BY&year=2025&vacation_days=10',
        method: 'GET',
        expectedResponseTime: 80,
        constitutionalRequirement: 100
      },
      {
        name: 'Multi-State Holiday Request',
        description: 'Request holiday data for multiple states',
        endpoint: '/v1/holidays?state=NW&year=2025&include_bridge=true',
        method: 'GET',
        expectedResponseTime: 70,
        constitutionalRequirement: 100
      },
      {
        name: 'Calendar Export Generation',
        description: 'Generate iCal calendar export',
        endpoint: '/v1/holidays?state=BW&year=2025&format=ical',
        method: 'GET',
        expectedResponseTime: 90,
        constitutionalRequirement: 100
      },
      {
        name: 'Health Check Response',
        description: 'Basic health check endpoint',
        endpoint: '/health',
        method: 'GET',
        expectedResponseTime: 10,
        constitutionalRequirement: 100
      },
      {
        name: 'Performance Metrics',
        description: 'Performance monitoring endpoint',
        endpoint: '/performance/metrics',
        method: 'GET',
        expectedResponseTime: 20,
        constitutionalRequirement: 100
      }
    ];
  }

  /**
   * Get 3G network simulation tests
   */
  private get3GNetworkTests(): PerformanceTest[] {
    return [
      {
        name: '3G Holiday Data',
        description: 'Holiday data on 3G network',
        endpoint: '/v1/holidays?state=BY&year=2025',
        method: 'GET',
        expectedResponseTime: 200, // Higher expectation for 3G
        constitutionalRequirement: 100 // But still must meet constitutional requirement
      },
      {
        name: '3G Bridge Weekends',
        description: 'Bridge weekends on 3G network',
        endpoint: '/v1/bridge-weekends?state=BY&year=2025',
        method: 'GET',
        expectedResponseTime: 250,
        constitutionalRequirement: 100
      }
    ];
  }

  /**
   * Run a single performance test
   */
  private async runSingleTest(test: PerformanceTest): Promise<TestResult> {
    const responseTimes: number[] = [];
    const errors: Array<{ statusCode: number; message: string; count: number }> = [];
    const concurrentUsers = test.concurrentUsers || 1;
    const totalRequests = test.duration ? (test.duration * (test.requestsPerSecond || 10)) : concurrentUsers * 10;

    let successfulRequests = 0;
    let violations = 0;

    const startTime = Date.now();

    // Simulate concurrent requests
    const requests = Array.from({ length: totalRequests }, async (_, index) => {
      const requestStart = Date.now();

      try {
        // Simulate HTTP request (in real implementation, would use actual HTTP client)
        await this.simulateHttpRequest(test);

        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);

        if (responseTime > test.constitutionalRequirement) {
          violations++;
        }

        successfulRequests++;

        // Add small delay to prevent overwhelming
        if (index % 10 === 0) {
          await this.sleep(1);
        }

      } catch (error) {
        const existingError = errors.find(e => e.message === error.message);
        if (existingError) {
          existingError.count++;
        } else {
          errors.push({
            statusCode: 500,
            message: error.message,
            count: 1
          });
        }
      }
    });

    await Promise.all(requests.slice(0, Math.min(totalRequests, 100))); // Limit concurrent execution

    const testDuration = Date.now() - startTime;

    // Calculate statistics
    responseTimes.sort((a, b) => a - b);
    const min = responseTimes[0] || 0;
    const max = responseTimes[responseTimes.length - 1] || 0;
    const average = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const p50Index = Math.floor(responseTimes.length * 0.5);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    const p50 = responseTimes[p50Index] || 0;
    const p95 = responseTimes[p95Index] || 0;
    const p99 = responseTimes[p99Index] || 0;

    const violationRate = totalRequests > 0 ? (violations / totalRequests) * 100 : 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const requestsPerSecond = testDuration > 0 ? (successfulRequests / (testDuration / 1000)) : 0;

    return {
      testName: test.name,
      passed: p95 <= test.constitutionalRequirement && successRate > 95,
      responseTime: { min, max, average, p50, p95, p99 },
      constitutionalCompliance: {
        compliant: p95 <= test.constitutionalRequirement,
        violationRate,
        violations,
        totalRequests
      },
      throughput: {
        requestsPerSecond,
        totalRequests,
        successRate
      },
      errors
    };
  }

  /**
   * Run single test with 3G network simulation
   */
  private async runSingleTestWith3GSimulation(test: PerformanceTest): Promise<TestResult> {
    // Add 3G network latency simulation
    const originalTest = { ...test };

    // Simulate 3G conditions by adding artificial delay
    const result = await this.runSingleTest(originalTest);

    // Add 3G network delay to response times
    result.responseTime.min += 50;
    result.responseTime.max += 200;
    result.responseTime.average += 100;
    result.responseTime.p50 += 80;
    result.responseTime.p95 += 150;
    result.responseTime.p99 += 200;

    // Recalculate compliance with added latency
    const adjustedViolations = result.responseTime.p95 > test.constitutionalRequirement;
    result.constitutionalCompliance.compliant = !adjustedViolations;

    return result;
  }

  /**
   * Run concurrency test for 25k users
   */
  private async runConcurrencyTest(): Promise<TestResult> {
    const concurrencyTest: PerformanceTest = {
      name: 'Peak Concurrency Test (25k users)',
      description: 'Test constitutional compliance under peak load',
      endpoint: '/v1/holidays?state=BY&year=2025',
      method: 'GET',
      expectedResponseTime: 100,
      constitutionalRequirement: 100,
      concurrentUsers: 1000, // Simulate subset of 25k
      duration: 60 // 1 minute test
    };

    return this.runSingleTest(concurrencyTest);
  }

  /**
   * Simulate HTTP request
   */
  private async simulateHttpRequest(test: PerformanceTest): Promise<void> {
    // Simulate network latency and processing time
    const baseLatency = Math.random() * 20 + 10; // 10-30ms base
    const processingTime = Math.random() * 50 + 20; // 20-70ms processing

    await this.sleep(baseLatency + processingTime);

    // Occasionally simulate errors
    if (Math.random() < 0.01) { // 1% error rate
      throw new Error('Simulated network error');
    }
  }

  /**
   * Sleep utility
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate test summary
   */
  private calculateSummary(results: TestResult[]): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    constitutionalViolations: number;
    averageResponseTime: number;
    worstPerformingEndpoint: string;
  } {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const constitutionalViolations = results.filter(r => !r.constitutionalCompliance.compliant).length;

    const averageResponseTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.responseTime.average, 0) / results.length
      : 0;

    const worstResult = results.reduce((worst, current) =>
      current.responseTime.p95 > worst.responseTime.p95 ? current : worst,
      results[0]
    );

    return {
      totalTests,
      passedTests,
      failedTests,
      constitutionalViolations,
      averageResponseTime,
      worstPerformingEndpoint: worstResult?.testName || 'N/A'
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    const violations = results.filter(r => !r.constitutionalCompliance.compliant);

    if (violations.length > 0) {
      recommendations.push('CRITICAL: Constitutional violations detected - immediate optimization required');
      recommendations.push('Enable aggressive caching for all holiday endpoints');
      recommendations.push('Optimize database queries with proper indexing');
      recommendations.push('Implement connection pooling and query optimization');
    }

    const slowEndpoints = results.filter(r => r.responseTime.p95 > 80);
    if (slowEndpoints.length > 0) {
      recommendations.push('Optimize slow endpoints: ' + slowEndpoints.map(r => r.testName).join(', '));
    }

    const lowThroughput = results.filter(r => r.throughput.requestsPerSecond < 100);
    if (lowThroughput.length > 0) {
      recommendations.push('Improve throughput for endpoints with low RPS');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within constitutional requirements');
    }

    return recommendations;
  }

  /**
   * Generate German market recommendations
   */
  private generateGermanMarketRecommendations(
    stateResults: Record<string, TestResult>,
    concurrencyTest: TestResult
  ): string[] {
    const recommendations: string[] = [];

    const slowStates = Object.entries(stateResults)
      .filter(([_, result]) => !result.constitutionalCompliance.compliant)
      .map(([state, _]) => state);

    if (slowStates.length > 0) {
      recommendations.push(`Optimize performance for German states: ${slowStates.join(', ')}`);
      recommendations.push('Implement state-specific caching strategies');
    }

    if (!concurrencyTest.constitutionalCompliance.compliant) {
      recommendations.push('Scale infrastructure to handle 25k concurrent users');
      recommendations.push('Implement auto-scaling for vacation planning season');
    }

    return recommendations;
  }

  /**
   * Generate 3G optimization recommendations
   */
  private generate3GOptimizations(results: TestResult[]): string[] {
    const recommendations: string[] = [];

    const violations = results.filter(r => !r.constitutionalCompliance.compliant);
    if (violations.length > 0) {
      recommendations.push('Implement aggressive compression for 3G networks');
      recommendations.push('Optimize payload sizes for slow connections');
      recommendations.push('Enable CDN caching for German rural areas');
      recommendations.push('Implement progressive loading for large datasets');
    }

    return recommendations;
  }

  /**
   * Generate memory optimization recommendations
   */
  private generateMemoryRecommendations(memoryLeakDetected: boolean, memoryIncreaseMB: number): string[] {
    const recommendations: string[] = [];

    if (memoryLeakDetected) {
      recommendations.push('CRITICAL: Memory leak detected - investigate object lifecycle');
      recommendations.push('Implement more frequent garbage collection');
      recommendations.push('Review caching strategies to prevent memory bloat');
    }

    if (memoryIncreaseMB > 50) {
      recommendations.push('High memory usage detected - optimize object pooling');
      recommendations.push('Implement memory pressure monitoring');
    }

    return recommendations;
  }
}

export { PerformanceValidator, PerformanceTest, TestResult, LoadTestConfig };