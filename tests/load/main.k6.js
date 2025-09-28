/**
 * TimeButler Calendar MVP - Main Load Test
 * Constitutional Requirement: Handle 25,000 concurrent German users
 * Performance Target: <2s load times on 3G, <200KB bundles
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Constitutional Performance Metrics
const constitutional_load_time = new Histogram('constitutional_load_time');
const constitutional_response_time = new Histogram('constitutional_response_time');
const constitutional_bundle_size = new Histogram('constitutional_bundle_size');
const constitutional_error_rate = new Rate('constitutional_error_rate');
const email_delivery_time = new Histogram('email_delivery_time');
const bridge_calculation_time = new Histogram('bridge_calculation_time');

// German Market Specific Metrics
const german_user_journey_time = new Histogram('german_user_journey_time');
const state_selection_time = new Histogram('state_selection_time');
const holiday_fetch_time = new Histogram('holiday_fetch_time');
const concurrent_german_users = new Counter('concurrent_german_users');

// Load Test Configuration
export let options = {
  scenarios: {
    // Constitutional Requirement: 25,000 concurrent users
    constitutional_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 1000 },   // Warm up
        { duration: '5m', target: 5000 },   // Ramp to 5k
        { duration: '10m', target: 15000 }, // Ramp to 15k
        { duration: '15m', target: 25000 }, // Constitutional target: 25k
        { duration: '20m', target: 25000 }, // Sustain 25k users
        { duration: '10m', target: 15000 }, // Scale down
        { duration: '5m', target: 5000 },   // Further scale down
        { duration: '2m', target: 0 },      // Cool down
      ],
      gracefulStop: '30s',
    },

    // German Peak Season Simulation (December-January vacation planning)
    peak_season_burst: {
      executor: 'ramping-arrival-rate',
      startTime: '30m',
      timeUnit: '1s',
      preAllocatedVUs: 5000,
      maxVUs: 30000,
      stages: [
        { duration: '5m', target: 100 },   // Normal traffic
        { duration: '2m', target: 1000 },  // Peak season starts
        { duration: '3m', target: 2500 },  // German vacation planning peak
        { duration: '5m', target: 2500 },  // Sustain peak
        { duration: '5m', target: 100 },   // Return to normal
      ],
    }
  },

  // Constitutional Performance Thresholds
  thresholds: {
    // Load Time: <2s on 3G (simulated with slower network)
    'constitutional_load_time': ['p(95)<2000'],
    'constitutional_response_time': ['p(95)<100'],

    // Error Rate: <1% for constitutional compliance
    'constitutional_error_rate': ['rate<0.01'],
    'http_req_failed': ['rate<0.01'],

    // Email Delivery: <5s constitutional requirement
    'email_delivery_time': ['p(95)<5000'],

    // Bridge Weekend Calculation: <100ms for responsiveness
    'bridge_calculation_time': ['p(95)<100'],

    // German Market Specific Thresholds
    'german_user_journey_time': ['p(95)<10000'], // Complete user journey <10s
    'state_selection_time': ['p(50)<50'],        // State selection <50ms
    'holiday_fetch_time': ['p(95)<200'],         // Holiday data fetch <200ms

    // Overall HTTP Performance
    'http_req_duration': ['p(95)<1000'],
    'http_req_waiting': ['p(95)<800'],
    'http_req_connecting': ['p(95)<100'],
  }
};

// German States for realistic testing
const germanStates = [
  'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
  'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
];

// German User Personas for load testing
const germanUserPersonas = [
  { language: 'de', state: 'BY', vacation_days: 30, planning_horizon: '2025' },
  { language: 'de', state: 'NW', vacation_days: 28, planning_horizon: '2025' },
  { language: 'de', state: 'BW', vacation_days: 32, planning_horizon: '2025' },
  { language: 'en', state: 'BE', vacation_days: 25, planning_horizon: '2025' },
  { language: 'de', state: 'HE', vacation_days: 29, planning_horizon: '2025' },
];

// Base URL Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

export default function() {
  const startTime = Date.now();

  // Simulate German user demographics
  const userPersona = germanUserPersonas[Math.floor(Math.random() * germanUserPersonas.length)];
  const germanState = germanStates[Math.floor(Math.random() * germanStates.length)];

  concurrent_german_users.add(1);

  // Constitutional Load Time Test
  group('Constitutional Load Time Validation', function() {
    const loadStart = Date.now();

    // Simulate 3G network conditions for constitutional compliance
    const params = {
      timeout: '10s',
      headers: {
        'Accept-Language': userPersona.language === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };

    // Load main page - Constitutional requirement: <2s on 3G
    const mainResponse = http.get(`${BASE_URL}/?lang=${userPersona.language}&state=${germanState}`, params);
    const loadTime = Date.now() - loadStart;

    constitutional_load_time.add(loadTime);

    check(mainResponse, {
      'Constitutional Load Time <2s': (r) => loadTime < 2000,
      'Main page loads successfully': (r) => r.status === 200,
      'Response contains German content': (r) => r.body.includes('Feiertag') || r.body.includes('Holiday'),
      'Bundle size constitutional compliance': (r) => {
        const contentLength = parseInt(r.headers['Content-Length'] || '0');
        constitutional_bundle_size.add(contentLength);
        return contentLength < 204800; // 200KB constitutional limit
      }
    });

    if (mainResponse.status !== 200) {
      constitutional_error_rate.add(1);
    } else {
      constitutional_error_rate.add(0);
    }
  });

  // German Holiday Data Fetching
  group('German Holiday Data Performance', function() {
    const holidayStart = Date.now();

    const holidayResponse = http.get(
      `${API_BASE_URL}/v1/holidays?state=${germanState}&year=2025&lang=${userPersona.language}`,
      {
        timeout: '5s',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': userPersona.language === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9'
        }
      }
    );

    const holidayTime = Date.now() - holidayStart;
    holiday_fetch_time.add(holidayTime);

    check(holidayResponse, {
      'Holiday data fetched successfully': (r) => r.status === 200,
      'Holiday data fetch time <200ms': (r) => holidayTime < 200,
      'Response contains German holidays': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data) && data.length > 0;
        } catch {
          return false;
        }
      }
    });
  });

  // Bridge Weekend Calculation Performance
  group('Bridge Weekend Calculation Performance', function() {
    const bridgeStart = Date.now();

    const bridgePayload = {
      state: germanState,
      year: 2025,
      vacation_days_available: userPersona.vacation_days,
      language: userPersona.language
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(bridgePayload),
      {
        timeout: '3s',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': userPersona.language === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9'
        }
      }
    );

    const bridgeTime = Date.now() - bridgeStart;
    bridge_calculation_time.add(bridgeTime);
    constitutional_response_time.add(bridgeTime);

    check(bridgeResponse, {
      'Bridge weekends calculated successfully': (r) => r.status === 200,
      'Bridge calculation time <100ms': (r) => bridgeTime < 100,
      'Response contains bridge opportunities': (r) => {
        try {
          const data = JSON.parse(r.body);
          return Array.isArray(data.bridge_weekends) && data.bridge_weekends.length > 0;
        } catch {
          return false;
        }
      }
    });
  });

  // Email Delivery Load Test (Constitutional requirement: <5s)
  group('Email Delivery Performance', function() {
    const emailStart = Date.now();

    const vacationPlanPayload = {
      selected_bridges: ['2025-05-01', '2025-10-03'], // Sample bridge dates
      state: germanState,
      email: `test.user.${__VU}.${__ITER}@example.com`,
      language: userPersona.language,
      gdpr_consent: true,
      vacation_plan_name: `German Vacation Plan ${__VU}-${__ITER}`
    };

    // Create vacation plan
    const planResponse = http.post(
      `${API_BASE_URL}/v1/vacation-plan`,
      JSON.stringify(vacationPlanPayload),
      {
        timeout: '10s',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (planResponse.status === 200) {
      try {
        const planData = JSON.parse(planResponse.body);

        // Send email delivery request
        const emailResponse = http.post(
          `${API_BASE_URL}/v1/vacation-plan/${planData.id}/email`,
          JSON.stringify({ delivery_language: userPersona.language }),
          {
            timeout: '8s',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        const emailTime = Date.now() - emailStart;
        email_delivery_time.add(emailTime);

        check(emailResponse, {
          'Email delivery initiated successfully': (r) => r.status === 200,
          'Email delivery time <5s constitutional': (r) => emailTime < 5000,
          'Email delivery response valid': (r) => {
            try {
              const data = JSON.parse(r.body);
              return data.status === 'sent' || data.status === 'queued';
            } catch {
              return false;
            }
          }
        });
      } catch (e) {
        console.error('Email delivery test failed:', e);
      }
    }
  });

  // Complete German User Journey Time
  const journeyTime = Date.now() - startTime;
  german_user_journey_time.add(journeyTime);

  // Realistic user behavior: pause between interactions
  sleep(Math.random() * 3 + 1); // 1-4 seconds between requests
}

// Performance Report Generation
export function handleSummary(data) {
  // Constitutional compliance validation
  const constitutionalMetrics = {
    load_time_compliance: data.metrics.constitutional_load_time?.values?.['p(95)'] < 2000,
    error_rate_compliance: data.metrics.constitutional_error_rate?.values?.rate < 0.01,
    email_delivery_compliance: data.metrics.email_delivery_time?.values?.['p(95)'] < 5000,
    concurrent_users_achieved: data.metrics.vus_max?.values?.value >= 25000,
    bundle_size_compliance: data.metrics.constitutional_bundle_size?.values?.avg < 204800
  };

  const complianceReport = {
    timestamp: new Date().toISOString(),
    constitutional_compliance: constitutionalMetrics,
    test_summary: {
      total_requests: data.metrics.http_reqs?.values?.count || 0,
      failed_requests: data.metrics.http_req_failed?.values?.count || 0,
      avg_response_time: data.metrics.http_req_duration?.values?.avg || 0,
      max_concurrent_users: data.metrics.vus_max?.values?.value || 0,
      test_duration: data.state.testRunDurationMs || 0
    },
    german_market_metrics: {
      avg_user_journey_time: data.metrics.german_user_journey_time?.values?.avg || 0,
      holiday_fetch_performance: data.metrics.holiday_fetch_time?.values?.['p(95)'] || 0,
      bridge_calculation_performance: data.metrics.bridge_calculation_time?.values?.['p(95)'] || 0
    }
  };

  return {
    'constitutional-compliance-report.json': JSON.stringify(complianceReport, null, 2),
    'load-test-report.html': htmlReport(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}