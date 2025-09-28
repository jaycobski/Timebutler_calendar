/**
 * TimeButler Calendar MVP - Database and Redis Performance Testing
 * Tests database and cache performance under 25k concurrent load
 * Focus: Holiday data caching, session management, analytics storage
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Database Performance Metrics
const database_query_time = new Histogram('database_query_time');
const database_connection_time = new Histogram('database_connection_time');
const database_throughput = new Counter('database_throughput');
const database_error_rate = new Rate('database_error_rate');
const database_cpu_usage = new Histogram('database_cpu_usage');

// Redis Cache Performance Metrics
const redis_hit_rate = new Rate('redis_hit_rate');
const redis_miss_rate = new Rate('redis_miss_rate');
const redis_latency = new Histogram('redis_latency');
const redis_memory_usage = new Histogram('redis_memory_usage');
const redis_eviction_rate = new Rate('redis_eviction_rate');
const redis_connection_pool = new Histogram('redis_connection_pool');

// Holiday Data Performance
const holiday_data_fetch_time = new Histogram('holiday_data_fetch_time');
const holiday_cache_efficiency = new Rate('holiday_cache_efficiency');
const state_specific_cache_hit = new Rate('state_specific_cache_hit');
const multi_year_query_performance = new Histogram('multi_year_query_performance');

// Session and Analytics Performance
const session_creation_time = new Histogram('session_creation_time');
const analytics_write_performance = new Histogram('analytics_write_performance');
const gdpr_compliance_query_time = new Histogram('gdpr_compliance_query_time');

// German Market Specific Metrics
const bundesland_query_performance = new Histogram('bundesland_query_performance');
const religious_holiday_cache_hit = new Rate('religious_holiday_cache_hit');
const bridge_calculation_cache_performance = new Histogram('bridge_calculation_cache_performance');

export let options = {
  scenarios: {
    // Database Performance Under Load
    database_performance_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 1000 },   // Warm up database
        { duration: '5m', target: 5000 },   // Moderate load
        { duration: '10m', target: 15000 }, // High load
        { duration: '15m', target: 25000 }, // Constitutional load
        { duration: '20m', target: 25000 }, // Sustained load
        { duration: '10m', target: 15000 }, // Scale down
        { duration: '5m', target: 5000 },   // Cool down
        { duration: '2m', target: 0 },      // Stop
      ],
      gracefulStop: '60s',
    },

    // Redis Cache Performance Test
    redis_cache_performance: {
      executor: 'ramping-vus',
      startTime: '5m',
      stages: [
        { duration: '3m', target: 2000 },   // Cache warm up
        { duration: '7m', target: 8000 },   // Cache stress
        { duration: '15m', target: 20000 }, // Heavy cache usage
        { duration: '20m', target: 30000 }, // Beyond constitutional (cache stress)
        { duration: '10m', target: 20000 }, // Scale down
        { duration: '5m', target: 8000 },   // Return to normal
        { duration: '3m', target: 0 },      // Stop
      ],
      gracefulStop: '30s',
    },

    // Holiday Data Intensive Queries
    holiday_data_intensive: {
      executor: 'constant-arrival-rate',
      startTime: '10m',
      rate: 1000, // 1000 requests per second
      timeUnit: '1s',
      duration: '30m',
      preAllocatedVUs: 2000,
      maxVUs: 10000,
      exec: 'holidayDataIntensiveQueries',
    },

    // Session and Analytics Load
    session_analytics_load: {
      executor: 'constant-vus',
      vus: 3000,
      duration: '25m',
      startTime: '15m',
      exec: 'sessionAndAnalyticsLoad',
    }
  },

  // Database and Cache Performance Thresholds
  thresholds: {
    // Database Performance Requirements
    'database_query_time': ['p(95)<500'],           // Database queries <500ms
    'database_connection_time': ['p(95)<100'],      // Connection time <100ms
    'database_error_rate': ['rate<0.005'],          // <0.5% database errors
    'database_throughput': ['count>100000'],        // >100k queries handled

    // Redis Cache Performance
    'redis_hit_rate': ['rate>0.85'],                // >85% cache hit rate
    'redis_latency': ['p(95)<10'],                  // Redis <10ms latency
    'redis_eviction_rate': ['rate<0.1'],            // <10% eviction rate

    // Holiday Data Performance
    'holiday_data_fetch_time': ['p(95)<200'],       // Holiday fetch <200ms
    'holiday_cache_efficiency': ['rate>0.90'],      // >90% cache efficiency
    'state_specific_cache_hit': ['rate>0.80'],      // >80% state cache hit

    // Session Performance
    'session_creation_time': ['p(95)<100'],         // Session creation <100ms
    'analytics_write_performance': ['p(95)<50'],    // Analytics write <50ms
    'gdpr_compliance_query_time': ['p(95)<200'],    // GDPR queries <200ms

    // German Market Specific
    'bundesland_query_performance': ['p(95)<150'],  // Bundesland queries <150ms
    'religious_holiday_cache_hit': ['rate>0.75'],   // >75% religious holiday cache
    'bridge_calculation_cache_performance': ['p(95)<300'], // Bridge calc <300ms

    // Overall Performance
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<1000'],
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// German States with Database/Cache Characteristics
const germanStatesData = {
  'BY': { population: 13140183, religious_majority: 'catholic', cache_priority: 'high' },
  'NW': { population: 17932651, religious_majority: 'mixed', cache_priority: 'high' },
  'BW': { population: 11103043, religious_majority: 'mixed', cache_priority: 'high' },
  'NI': { population: 8003421, religious_majority: 'protestant', cache_priority: 'medium' },
  'HE': { population: 6293154, religious_majority: 'mixed', cache_priority: 'medium' },
  'SN': { population: 4056941, religious_majority: 'protestant', cache_priority: 'medium' },
  'RP': { population: 4098391, religious_majority: 'mixed', cache_priority: 'medium' },
  'BE': { population: 3677472, religious_majority: 'secular', cache_priority: 'high' },
  'SH': { population: 2910875, religious_majority: 'protestant', cache_priority: 'low' },
  'BB': { population: 2537868, religious_majority: 'secular', cache_priority: 'low' },
  'ST': { population: 2180684, religious_majority: 'protestant', cache_priority: 'low' },
  'TH': { population: 2120237, religious_majority: 'protestant', cache_priority: 'low' },
  'HH': { population: 1945532, religious_majority: 'protestant', cache_priority: 'medium' },
  'MV': { population: 1610774, religious_majority: 'protestant', cache_priority: 'low' },
  'SL': { population: 990509, religious_majority: 'catholic', cache_priority: 'low' },
  'HB': { population: 676463, religious_majority: 'protestant', cache_priority: 'low' }
};

export default function() {
  const selectedState = randomItem(Object.keys(germanStatesData));
  const stateData = germanStatesData[selectedState];

  // Database and cache performance testing
  testDatabasePerformance(selectedState, stateData);
}

function testDatabasePerformance(state, stateData) {
  group('Database Holiday Query Performance', function() {
    const dbQueryStart = Date.now();

    // Test holiday data fetching (primary database operation)
    const holidayResponse = http.get(
      `${API_BASE_URL}/v1/holidays?state=${state}&year=2025&include_religious=true&db_test=true`,
      {
        timeout: '3s',
        headers: {
          'Accept': 'application/json',
          'X-Database-Test': 'true',
          'X-State-Priority': stateData.cache_priority
        }
      }
    );

    const dbQueryTime = Date.now() - dbQueryStart;
    database_query_time.add(dbQueryTime);
    holiday_data_fetch_time.add(dbQueryTime);
    database_throughput.add(1);

    // Check for cache hit indicators
    const cacheStatus = holidayResponse.headers['X-Cache-Status'];
    const isHit = cacheStatus === 'HIT';
    const isMiss = cacheStatus === 'MISS';

    redis_hit_rate.add(isHit ? 1 : 0);
    redis_miss_rate.add(isMiss ? 1 : 0);
    holiday_cache_efficiency.add(isHit ? 1 : 0);

    // State-specific cache performance
    if (stateData.cache_priority === 'high') {
      state_specific_cache_hit.add(isHit ? 1 : 0);
    }

    // Religious holiday cache performance
    if (stateData.religious_majority !== 'secular') {
      religious_holiday_cache_hit.add(isHit ? 1 : 0);
    }

    const dbSuccess = holidayResponse.status === 200;
    database_error_rate.add(dbSuccess ? 0 : 1);

    check(holidayResponse, {
      'Database query successful': () => dbSuccess,
      'Database query time acceptable': () => dbQueryTime < 500,
      'Holiday data complete': (r) => {
        try {
          const holidays = JSON.parse(r.body);
          return Array.isArray(holidays) && holidays.length > 5; // German states have >5 holidays
        } catch {
          return false;
        }
      },
      'Cache performance acceptable': () => dbQueryTime < (isHit ? 50 : 300) // Faster for cache hits
    });
  });

  group('Multi-Year Database Query Performance', function() {
    const multiYearStart = Date.now();

    // Test multi-year queries (complex database operation)
    const multiYearResponse = http.get(
      `${API_BASE_URL}/v1/holidays?state=${state}&year=2025&year=2026&include_bridge_analysis=true`,
      {
        timeout: '5s',
        headers: {
          'Accept': 'application/json',
          'X-Multi-Year-Query': 'true'
        }
      }
    );

    const multiYearTime = Date.now() - multiYearStart;
    multi_year_query_performance.add(multiYearTime);
    database_throughput.add(1);

    check(multiYearResponse, {
      'Multi-year query successful': (r) => r.status === 200,
      'Multi-year query performance': () => multiYearTime < 800,
      'Contains both years data': (r) => {
        try {
          const holidays = JSON.parse(r.body);
          return holidays.some(h => h.date.includes('2025')) &&
                 holidays.some(h => h.date.includes('2026'));
        } catch {
          return false;
        }
      }
    });
  });

  group('Bundesland Specific Query Performance', function() {
    const bundeslandStart = Date.now();

    // Test Bundesland-specific queries
    const bundeslandResponse = http.get(
      `${API_BASE_URL}/v1/states/${state}/holidays/2025?include_regional=true&include_school_holidays=true`,
      {
        timeout: '2s',
        headers: {
          'Accept': 'application/json',
          'X-Bundesland-Query': 'true'
        }
      }
    );

    const bundeslandTime = Date.now() - bundeslandStart;
    bundesland_query_performance.add(bundeslandTime);

    check(bundeslandResponse, {
      'Bundesland query successful': (r) => r.status === 200,
      'Bundesland query performance': () => bundeslandTime < 150,
      'Regional holidays included': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.regional_holidays || data.holidays?.some(h => h.regional === true);
        } catch {
          return false;
        }
      }
    });
  });

  group('Bridge Weekend Cache Performance', function() {
    const bridgeCacheStart = Date.now();

    // Test bridge weekend calculation caching
    const bridgePayload = {
      state: state,
      year: 2025,
      vacation_days_available: randomIntBetween(25, 35),
      cache_test: true
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(bridgePayload),
      {
        timeout: '3s',
        headers: {
          'Content-Type': 'application/json',
          'X-Bridge-Cache-Test': 'true'
        }
      }
    );

    const bridgeCacheTime = Date.now() - bridgeCacheStart;
    bridge_calculation_cache_performance.add(bridgeCacheTime);

    const bridgeCacheStatus = bridgeResponse.headers['X-Cache-Status'];
    const bridgeCacheHit = bridgeCacheStatus === 'HIT';
    redis_hit_rate.add(bridgeCacheHit ? 1 : 0);

    check(bridgeResponse, {
      'Bridge calculation successful': (r) => r.status === 200,
      'Bridge calculation performance': () => bridgeCacheTime < 300,
      'Bridge cache efficiency': () => bridgeCacheHit || bridgeCacheTime < 500 // Fast even on miss
    });
  });

  // Simulate realistic user pause
  sleep(randomIntBetween(1, 3));
}

// Holiday Data Intensive Queries
export function holidayDataIntensiveQueries() {
  const selectedState = randomItem(Object.keys(germanStatesData));

  group('Holiday Data Intensive Operations', function() {
    // Perform multiple holiday-related queries
    const queries = [
      `${API_BASE_URL}/v1/holidays?state=${selectedState}&year=2025`,
      `${API_BASE_URL}/v1/holidays?state=${selectedState}&year=2026`,
      `${API_BASE_URL}/v1/holidays/federal?year=2025`,
      `${API_BASE_URL}/v1/holidays/religious?state=${selectedState}&denomination=catholic`,
      `${API_BASE_URL}/v1/holidays/religious?state=${selectedState}&denomination=protestant`
    ];

    for (const queryUrl of queries) {
      const queryStart = Date.now();

      const response = http.get(queryUrl, {
        timeout: '2s',
        headers: {
          'Accept': 'application/json',
          'X-Intensive-Query': 'true'
        }
      });

      const queryTime = Date.now() - queryStart;
      holiday_data_fetch_time.add(queryTime);
      database_throughput.add(1);

      const cacheHit = response.headers['X-Cache-Status'] === 'HIT';
      redis_hit_rate.add(cacheHit ? 1 : 0);
      holiday_cache_efficiency.add(cacheHit ? 1 : 0);

      check(response, {
        'Intensive query successful': (r) => r.status === 200,
        'Intensive query fast': () => queryTime < 200
      });
    }
  });

  sleep(randomIntBetween(0.5, 2));
}

// Session and Analytics Load Testing
export function sessionAndAnalyticsLoad() {
  group('Session Management Performance', function() {
    const sessionStart = Date.now();

    // Create vacation planning session
    const sessionPayload = {
      user_id: `load_test_${__VU}_${__ITER}`,
      state: randomItem(Object.keys(germanStatesData)),
      language: Math.random() < 0.9 ? 'de' : 'en',
      session_type: 'vacation_planning',
      analytics_consent: true
    };

    const sessionResponse = http.post(
      `${API_BASE_URL}/v1/sessions`,
      JSON.stringify(sessionPayload),
      {
        timeout: '2s',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Test': 'true'
        }
      }
    );

    const sessionTime = Date.now() - sessionStart;
    session_creation_time.add(sessionTime);

    check(sessionResponse, {
      'Session created successfully': (r) => r.status === 200 || r.status === 201,
      'Session creation fast': () => sessionTime < 100
    });
  });

  group('Analytics Write Performance', function() {
    const analyticsStart = Date.now();

    // Write analytics data
    const analyticsPayload = {
      event_type: 'bridge_weekend_calculated',
      user_session: `load_test_${__VU}_${__ITER}`,
      state: randomItem(Object.keys(germanStatesData)),
      calculation_time: randomIntBetween(50, 500),
      bridges_found: randomIntBetween(5, 15),
      timestamp: new Date().toISOString()
    };

    const analyticsResponse = http.post(
      `${API_BASE_URL}/v1/analytics/events`,
      JSON.stringify(analyticsPayload),
      {
        timeout: '1s',
        headers: {
          'Content-Type': 'application/json',
          'X-Analytics-Test': 'true'
        }
      }
    );

    const analyticsTime = Date.now() - analyticsStart;
    analytics_write_performance.add(analyticsTime);

    check(analyticsResponse, {
      'Analytics write successful': (r) => r.status === 200 || r.status === 202,
      'Analytics write fast': () => analyticsTime < 50
    });
  });

  group('GDPR Compliance Query Performance', function() {
    if (Math.random() < 0.05) { // 5% of users check GDPR data
      const gdprStart = Date.now();

      const gdprResponse = http.get(
        `${API_BASE_URL}/v1/gdpr/user-data?user_id=load_test_${__VU}_${__ITER}`,
        {
          timeout: '3s',
          headers: {
            'Accept': 'application/json',
            'X-GDPR-Query': 'true'
          }
        }
      );

      const gdprTime = Date.now() - gdprStart;
      gdpr_compliance_query_time.add(gdprTime);

      check(gdprResponse, {
        'GDPR query successful': (r) => r.status === 200 || r.status === 404, // 404 is valid for new users
        'GDPR query performance': () => gdprTime < 200
      });
    }
  });

  sleep(randomIntBetween(1, 4));
}

export function handleSummary(data) {
  const databaseRedisReport = {
    timestamp: new Date().toISOString(),
    database_performance: {
      avg_query_time: data.metrics.database_query_time?.values?.avg || 0,
      p95_query_time: data.metrics.database_query_time?.values?.['p(95)'] || 0,
      p99_query_time: data.metrics.database_query_time?.values?.['p(99)'] || 0,
      total_queries: data.metrics.database_throughput?.values?.count || 0,
      error_rate: data.metrics.database_error_rate?.values?.rate || 0,
      queries_per_second: (data.metrics.database_throughput?.values?.count || 0) / ((data.state?.testRunDurationMs || 1) / 1000)
    },
    redis_cache_performance: {
      hit_rate: data.metrics.redis_hit_rate?.values?.rate || 0,
      miss_rate: data.metrics.redis_miss_rate?.values?.rate || 0,
      avg_latency: data.metrics.redis_latency?.values?.avg || 0,
      p95_latency: data.metrics.redis_latency?.values?.['p(95)'] || 0,
      eviction_rate: data.metrics.redis_eviction_rate?.values?.rate || 0
    },
    holiday_data_performance: {
      avg_fetch_time: data.metrics.holiday_data_fetch_time?.values?.avg || 0,
      p95_fetch_time: data.metrics.holiday_data_fetch_time?.values?.['p(95)'] || 0,
      cache_efficiency: data.metrics.holiday_cache_efficiency?.values?.rate || 0,
      state_cache_hit_rate: data.metrics.state_specific_cache_hit?.values?.rate || 0,
      religious_cache_hit_rate: data.metrics.religious_holiday_cache_hit?.values?.rate || 0
    },
    german_market_performance: {
      bundesland_query_p95: data.metrics.bundesland_query_performance?.values?.['p(95)'] || 0,
      bridge_calculation_p95: data.metrics.bridge_calculation_cache_performance?.values?.['p(95)'] || 0,
      multi_year_query_p95: data.metrics.multi_year_query_performance?.values?.['p(95)'] || 0
    },
    session_analytics_performance: {
      session_creation_p95: data.metrics.session_creation_time?.values?.['p(95)'] || 0,
      analytics_write_p95: data.metrics.analytics_write_performance?.values?.['p(95)'] || 0,
      gdpr_query_p95: data.metrics.gdpr_compliance_query_time?.values?.['p(95)'] || 0
    },
    performance_compliance: {
      database_query_compliant: (data.metrics.database_query_time?.values?.['p(95)'] || 0) < 500,
      redis_hit_rate_compliant: (data.metrics.redis_hit_rate?.values?.rate || 0) > 0.85,
      holiday_fetch_compliant: (data.metrics.holiday_data_fetch_time?.values?.['p(95)'] || 0) < 200,
      session_performance_compliant: (data.metrics.session_creation_time?.values?.['p(95)'] || 0) < 100,
      bundesland_query_compliant: (data.metrics.bundesland_query_performance?.values?.['p(95)'] || 0) < 150,
      overall_database_health: (data.metrics.database_error_rate?.values?.rate || 0) < 0.005
    }
  };

  return {
    'database-redis-performance-report.json': JSON.stringify(databaseRedisReport, null, 2),
    'stdout': `
Database and Redis Performance Report:
=====================================

Database Performance:
- Average Query Time: ${databaseRedisReport.database_performance.avg_query_time.toFixed(1)}ms
- P95 Query Time: ${databaseRedisReport.database_performance.p95_query_time.toFixed(1)}ms ${databaseRedisReport.performance_compliance.database_query_compliant ? '✅' : '❌'}
- Total Queries: ${databaseRedisReport.database_performance.total_queries}
- Queries/Second: ${databaseRedisReport.database_performance.queries_per_second.toFixed(1)}
- Error Rate: ${(databaseRedisReport.database_performance.error_rate * 100).toFixed(3)}% ${databaseRedisReport.performance_compliance.overall_database_health ? '✅' : '❌'}

Redis Cache Performance:
- Hit Rate: ${(databaseRedisReport.redis_cache_performance.hit_rate * 100).toFixed(1)}% ${databaseRedisReport.performance_compliance.redis_hit_rate_compliant ? '✅' : '❌'}
- Miss Rate: ${(databaseRedisReport.redis_cache_performance.miss_rate * 100).toFixed(1)}%
- Average Latency: ${databaseRedisReport.redis_cache_performance.avg_latency.toFixed(1)}ms
- P95 Latency: ${databaseRedisReport.redis_cache_performance.p95_latency.toFixed(1)}ms

Holiday Data Performance:
- Average Fetch Time: ${databaseRedisReport.holiday_data_performance.avg_fetch_time.toFixed(1)}ms
- P95 Fetch Time: ${databaseRedisReport.holiday_data_performance.p95_fetch_time.toFixed(1)}ms ${databaseRedisReport.performance_compliance.holiday_fetch_compliant ? '✅' : '❌'}
- Cache Efficiency: ${(databaseRedisReport.holiday_data_performance.cache_efficiency * 100).toFixed(1)}%
- State Cache Hit Rate: ${(databaseRedisReport.holiday_data_performance.state_cache_hit_rate * 100).toFixed(1)}%

German Market Specific:
- Bundesland Queries (P95): ${databaseRedisReport.german_market_performance.bundesland_query_p95.toFixed(1)}ms ${databaseRedisReport.performance_compliance.bundesland_query_compliant ? '✅' : '❌'}
- Bridge Calculation (P95): ${databaseRedisReport.german_market_performance.bridge_calculation_p95.toFixed(1)}ms
- Multi-Year Queries (P95): ${databaseRedisReport.german_market_performance.multi_year_query_p95.toFixed(1)}ms

Session & Analytics:
- Session Creation (P95): ${databaseRedisReport.session_analytics_performance.session_creation_p95.toFixed(1)}ms ${databaseRedisReport.performance_compliance.session_performance_compliant ? '✅' : '❌'}
- Analytics Write (P95): ${databaseRedisReport.session_analytics_performance.analytics_write_p95.toFixed(1)}ms
- GDPR Queries (P95): ${databaseRedisReport.session_analytics_performance.gdpr_query_p95.toFixed(1)}ms

Overall Compliance: ${Object.values(databaseRedisReport.performance_compliance).every(c => c === true) ? 'PASS ✅' : 'NEEDS ATTENTION ⚠️'}
    `
  };
}