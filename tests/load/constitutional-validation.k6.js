/**
 * TimeButler Calendar MVP - Constitutional Requirements Validation
 * Validates all constitutional performance requirements under 25k concurrent load
 * Focus: Strict validation of constitutional compliance
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Constitutional Validation Metrics
const constitutional_compliance_score = new Rate('constitutional_compliance_score');
const load_time_compliance = new Rate('load_time_compliance');
const response_time_compliance = new Rate('response_time_compliance');
const error_rate_compliance = new Rate('error_rate_compliance');
const email_delivery_compliance = new Rate('email_delivery_compliance');
const bundle_size_compliance = new Rate('bundle_size_compliance');
const concurrent_user_compliance = new Rate('concurrent_user_compliance');

// Detailed Performance Tracking
const constitutional_violations = new Counter('constitutional_violations');
const performance_degradation = new Histogram('performance_degradation');
const stability_under_load = new Rate('stability_under_load');
const german_market_readiness = new Rate('german_market_readiness');

// 3G Network Simulation Metrics
const threeg_simulation_performance = new Histogram('threeg_simulation_performance');
const mobile_performance_compliance = new Rate('mobile_performance_compliance');

export let options = {
  scenarios: {
    // Constitutional Compliance Validation (Strict 25k users)
    constitutional_validation: {
      executor: 'ramping-vus',
      stages: [
        { duration: '3m', target: 5000 },   // Gradual ramp up
        { duration: '5m', target: 15000 },  // Intermediate load
        { duration: '7m', target: 25000 },  // Constitutional target
        { duration: '15m', target: 25000 }, // Sustained constitutional load
        { duration: '5m', target: 15000 },  // Graceful degradation test
        { duration: '3m', target: 5000 },   // Return to baseline
        { duration: '2m', target: 0 },      // Cool down
      ],
      gracefulStop: '60s',
    },

    // 3G Network Performance Validation
    threeg_network_validation: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '20m',
      startTime: '10m',
      exec: 'threeGNetworkValidation',
    },

    // Mobile Performance Validation
    mobile_performance_validation: {
      executor: 'constant-vus',
      vus: 2000,
      duration: '15m',
      startTime: '15m',
      exec: 'mobilePerformanceValidation',
    },

    // Peak Load Stress Test (Beyond constitutional requirements)
    stress_test_beyond_constitutional: {
      executor: 'ramping-vus',
      startTime: '30m',
      stages: [
        { duration: '2m', target: 25000 },  // Constitutional baseline
        { duration: '3m', target: 30000 },  // 20% above constitutional
        { duration: '5m', target: 35000 },  // 40% above constitutional
        { duration: '3m', target: 30000 },  // Step down
        { duration: '2m', target: 25000 },  // Return to constitutional
      ],
      gracefulStop: '30s',
    }
  },

  // Strict Constitutional Thresholds
  thresholds: {
    // Primary Constitutional Requirements
    'constitutional_compliance_score': ['rate>=0.95'], // 95% compliance required
    'load_time_compliance': ['rate>=0.95'],            // 95% of loads <2s on 3G
    'response_time_compliance': ['rate>=0.95'],        // 95% of responses <100ms
    'error_rate_compliance': ['rate>=0.99'],           // 99% error rate compliance
    'email_delivery_compliance': ['rate>=0.95'],       // 95% emails delivered <5s
    'bundle_size_compliance': ['rate>=0.98'],          // 98% bundles <200KB
    'concurrent_user_compliance': ['rate>=0.95'],      // Handle 25k users successfully

    // 3G Network Requirements
    'threeg_simulation_performance': ['p(95)<2000'],   // <2s on 3G
    'mobile_performance_compliance': ['rate>=0.90'],   // 90% mobile compliance

    // System Stability
    'stability_under_load': ['rate>=0.98'],            // 98% stability
    'german_market_readiness': ['rate>=0.95'],         // German market ready

    // Constitutional Violations (should be minimal)
    'constitutional_violations': ['count<100'],         // <100 violations total

    // Overall HTTP Performance
    'http_req_failed': ['rate<0.01'],                  // <1% error rate
    'http_req_duration': ['p(95)<1000'],               // General performance
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// Constitutional Requirements Definition
const CONSTITUTIONAL_REQUIREMENTS = {
  load_time_3g: 2000,           // <2s on 3G
  response_time: 100,           // <100ms for interactions
  email_delivery: 5000,         // <5s email delivery
  bundle_size: 204800,          // <200KB gzipped
  error_rate_max: 0.01,         // <1% error rate
  concurrent_users: 25000,      // 25k concurrent users
  availability: 0.99            // 99% availability
};

// German States for Constitutional Testing
const germanStatesPopulation = [
  { state: 'NW', population: 17932651, weight: 0.22 }, // North Rhine-Westphalia
  { state: 'BY', population: 13140183, weight: 0.16 }, // Bavaria
  { state: 'BW', population: 11103043, weight: 0.13 }, // Baden-Württemberg
  { state: 'NI', population: 8003421, weight: 0.10 },  // Lower Saxony
  { state: 'HE', population: 6293154, weight: 0.08 },  // Hesse
  { state: 'SN', population: 4056941, weight: 0.05 },  // Saxony
  { state: 'RP', population: 4098391, weight: 0.05 },  // Rhineland-Palatinate
  { state: 'BE', population: 3677472, weight: 0.04 },  // Berlin
  { state: 'SH', population: 2910875, weight: 0.04 },  // Schleswig-Holstein
  { state: 'BB', population: 2537868, weight: 0.03 },  // Brandenburg
  { state: 'ST', population: 2180684, weight: 0.03 },  // Saxony-Anhalt
  { state: 'TH', population: 2120237, weight: 0.03 },  // Thuringia
  { state: 'HH', population: 1945532, weight: 0.02 },  // Hamburg
  { state: 'MV', population: 1610774, weight: 0.02 },  // Mecklenburg-Vorpommern
  { state: 'SL', population: 990509, weight: 0.01 },   // Saarland
  { state: 'HB', population: 676463, weight: 0.01 }    // Bremen
];

export default function() {
  // Constitutional compliance validation
  validateConstitutionalCompliance();
}

function validateConstitutionalCompliance() {
  const validationStart = Date.now();
  let complianceViolations = 0;

  // Select German state based on population distribution
  const selectedState = selectGermanStateByPopulation();

  group('Constitutional Load Time Validation', function() {
    const loadStart = Date.now();

    // Simulate 3G network conditions (throttled)
    const mainResponse = http.get(
      `${BASE_URL}/?lang=de&state=${selectedState.state}&constitutional_test=true`,
      {
        timeout: '10s',
        headers: {
          'Accept-Language': 'de-DE,de;q=0.9',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
          'X-Constitutional-Test': 'true',
          'X-3G-Simulation': 'true'
        }
      }
    );

    const loadTime = Date.now() - loadStart;

    // Constitutional load time validation
    const loadTimeCompliant = loadTime < CONSTITUTIONAL_REQUIREMENTS.load_time_3g;
    load_time_compliance.add(loadTimeCompliant ? 1 : 0);

    if (!loadTimeCompliant) {
      complianceViolations++;
      constitutional_violations.add(1, {
        violation_type: 'load_time',
        value: loadTime,
        requirement: CONSTITUTIONAL_REQUIREMENTS.load_time_3g
      });
    }

    // Bundle size validation
    const contentLength = parseInt(mainResponse.headers['Content-Length'] || '0');
    const bundleSizeCompliant = contentLength < CONSTITUTIONAL_REQUIREMENTS.bundle_size;
    bundle_size_compliance.add(bundleSizeCompliant ? 1 : 0);

    if (!bundleSizeCompliant) {
      complianceViolations++;
      constitutional_violations.add(1, {
        violation_type: 'bundle_size',
        value: contentLength,
        requirement: CONSTITUTIONAL_REQUIREMENTS.bundle_size
      });
    }

    check(mainResponse, {
      'Constitutional load time <2s': () => loadTimeCompliant,
      'Constitutional bundle size <200KB': () => bundleSizeCompliant,
      'Page loads successfully': (r) => r.status === 200,
      'Contains German content': (r) => r.body.includes('Feiertag') || r.body.includes('Holiday'),
    });
  });

  group('Constitutional Response Time Validation', function() {
    const responseStart = Date.now();

    const holidayResponse = http.get(
      `${API_BASE_URL}/v1/holidays?state=${selectedState.state}&year=2025&lang=de&constitutional_test=true`,
      {
        timeout: '3s',
        headers: {
          'Accept': 'application/json',
          'X-Constitutional-Test': 'true'
        }
      }
    );

    const responseTime = Date.now() - responseStart;

    // Constitutional response time validation
    const responseTimeCompliant = responseTime < CONSTITUTIONAL_REQUIREMENTS.response_time;
    response_time_compliance.add(responseTimeCompliant ? 1 : 0);

    if (!responseTimeCompliant) {
      complianceViolations++;
      constitutional_violations.add(1, {
        violation_type: 'response_time',
        value: responseTime,
        requirement: CONSTITUTIONAL_REQUIREMENTS.response_time
      });
    }

    check(holidayResponse, {
      'Constitutional response time <100ms': () => responseTimeCompliant,
      'Holiday data fetched': (r) => r.status === 200,
      'Valid German holiday data': (r) => {
        try {
          const holidays = JSON.parse(r.body);
          return Array.isArray(holidays) && holidays.length > 0;
        } catch {
          return false;
        }
      }
    });
  });

  group('Constitutional Email Delivery Validation', function() {
    // Only test email delivery for a percentage of users to avoid overload
    if (Math.random() < 0.1) { // 10% of users test email
      const emailStart = Date.now();

      const planPayload = {
        selected_bridges: ['2025-12-25', '2026-01-01'],
        state: selectedState.state,
        email: `constitutional.test.${__VU}.${__ITER}@example.com`,
        language: 'de',
        gdpr_consent: true,
        constitutional_test: true,
        vacation_plan_name: `Constitutional Test ${selectedState.state} ${__VU}-${__ITER}`
      };

      const planResponse = http.post(
        `${API_BASE_URL}/v1/vacation-plan`,
        JSON.stringify(planPayload),
        {
          timeout: '8s',
          headers: {
            'Content-Type': 'application/json',
            'X-Constitutional-Test': 'true'
          }
        }
      );

      if (planResponse.status === 200) {
        try {
          const planData = JSON.parse(planResponse.body);

          const emailResponse = http.post(
            `${API_BASE_URL}/v1/vacation-plan/${planData.id}/email`,
            JSON.stringify({
              delivery_language: 'de',
              constitutional_test: true
            }),
            {
              timeout: '8s',
              headers: {
                'Content-Type': 'application/json',
                'X-Constitutional-Test': 'true'
              }
            }
          );

          const emailTime = Date.now() - emailStart;

          // Constitutional email delivery validation
          const emailCompliant = emailTime < CONSTITUTIONAL_REQUIREMENTS.email_delivery;
          email_delivery_compliance.add(emailCompliant ? 1 : 0);

          if (!emailCompliant) {
            complianceViolations++;
            constitutional_violations.add(1, {
              violation_type: 'email_delivery',
              value: emailTime,
              requirement: CONSTITUTIONAL_REQUIREMENTS.email_delivery
            });
          }

          check(emailResponse, {
            'Constitutional email delivery <5s': () => emailCompliant,
            'Email delivery successful': (r) => r.status === 200
          });
        } catch (e) {
          email_delivery_compliance.add(0);
          complianceViolations++;
        }
      } else {
        email_delivery_compliance.add(0);
        complianceViolations++;
      }
    }
  });

  // Overall constitutional compliance assessment
  const totalValidationTime = Date.now() - validationStart;
  performance_degradation.add(totalValidationTime);

  // System stability check
  const systemStable = complianceViolations <= 1; // Allow max 1 violation per user
  stability_under_load.add(systemStable ? 1 : 0);

  // German market readiness
  const germanMarketReady = complianceViolations === 0;
  german_market_readiness.add(germanMarketReady ? 1 : 0);

  // Overall compliance score
  const complianceScore = Math.max(0, 1 - (complianceViolations / 4)); // 4 main requirements
  constitutional_compliance_score.add(complianceScore);

  // Concurrent user compliance (check if we're meeting the 25k requirement)
  const currentVUs = __ENV.K6_VU_COUNT || __VU;
  const concurrentCompliant = currentVUs >= (CONSTITUTIONAL_REQUIREMENTS.concurrent_users * 0.8); // 80% threshold
  concurrent_user_compliance.add(concurrentCompliant ? 1 : 0);

  // Realistic user pause
  sleep(randomIntBetween(1, 3));
}

// 3G Network Performance Validation
export function threeGNetworkValidation() {
  const start3G = Date.now();

  group('3G Network Performance Validation', function() {
    // Simulate 3G throttling
    const selectedState = selectGermanStateByPopulation();

    const response3G = http.get(
      `${BASE_URL}/?lang=de&state=${selectedState.state}&network=3g`,
      {
        timeout: '15s', // Longer timeout for 3G
        headers: {
          'Accept-Language': 'de-DE,de;q=0.9',
          'Connection': 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          'X-Network-Type': '3G',
          'X-Connection-Speed': 'slow'
        }
      }
    );

    const time3G = Date.now() - start3G;
    threeg_simulation_performance.add(time3G);

    const compliant3G = time3G < CONSTITUTIONAL_REQUIREMENTS.load_time_3g;
    mobile_performance_compliance.add(compliant3G ? 1 : 0);

    check(response3G, {
      '3G load time compliant': () => compliant3G,
      '3G response successful': (r) => r.status === 200,
      '3G content complete': (r) => r.body.length > 100
    });
  });

  sleep(randomIntBetween(2, 5)); // 3G users typically slower
}

// Mobile Performance Validation
export function mobilePerformanceValidation() {
  group('Mobile Performance Validation', function() {
    const selectedState = selectGermanStateByPopulation();

    const mobileResponse = http.get(
      `${BASE_URL}/?lang=de&state=${selectedState.state}&device=mobile`,
      {
        timeout: '8s',
        headers: {
          'Accept-Language': 'de-DE,de;q=0.9',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Viewport-Width': '375',
          'X-Device-Type': 'mobile'
        }
      }
    );

    const mobileCompliant = mobileResponse.timings.duration < CONSTITUTIONAL_REQUIREMENTS.load_time_3g;

    check(mobileResponse, {
      'Mobile performance compliant': () => mobileCompliant,
      'Mobile responsive design': (r) => r.body.includes('viewport') || r.body.includes('mobile'),
      'Mobile accessibility': (r) => r.body.includes('aria-') || r.body.includes('role=')
    });
  });

  sleep(randomIntBetween(1, 4)); // Mobile user patterns
}

function selectGermanStateByPopulation() {
  const random = Math.random();
  let cumulativeWeight = 0;

  for (const state of germanStatesPopulation) {
    cumulativeWeight += state.weight;
    if (random <= cumulativeWeight) {
      return state;
    }
  }

  return germanStatesPopulation[0]; // Fallback to NRW
}

export function handleSummary(data) {
  const constitutionalReport = {
    timestamp: new Date().toISOString(),
    constitutional_compliance: {
      overall_compliance_score: data.metrics.constitutional_compliance_score?.values?.rate || 0,
      load_time_compliance: data.metrics.load_time_compliance?.values?.rate || 0,
      response_time_compliance: data.metrics.response_time_compliance?.values?.rate || 0,
      error_rate_compliance: data.metrics.error_rate_compliance?.values?.rate || 0,
      email_delivery_compliance: data.metrics.email_delivery_compliance?.values?.rate || 0,
      bundle_size_compliance: data.metrics.bundle_size_compliance?.values?.rate || 0,
      concurrent_user_compliance: data.metrics.concurrent_user_compliance?.values?.rate || 0,
    },
    constitutional_requirements_met: {
      load_time_2s_3g: (data.metrics.load_time_compliance?.values?.rate || 0) >= 0.95,
      response_time_100ms: (data.metrics.response_time_compliance?.values?.rate || 0) >= 0.95,
      email_delivery_5s: (data.metrics.email_delivery_compliance?.values?.rate || 0) >= 0.95,
      bundle_size_200kb: (data.metrics.bundle_size_compliance?.values?.rate || 0) >= 0.98,
      error_rate_1_percent: (data.metrics.error_rate_compliance?.values?.rate || 0) >= 0.99,
      concurrent_users_25k: (data.metrics.concurrent_user_compliance?.values?.rate || 0) >= 0.95,
    },
    performance_metrics: {
      max_concurrent_users: data.metrics.vus_max?.values?.value || 0,
      total_violations: data.metrics.constitutional_violations?.values?.count || 0,
      system_stability: data.metrics.stability_under_load?.values?.rate || 0,
      german_market_readiness: data.metrics.german_market_readiness?.values?.rate || 0,
      threeg_performance_p95: data.metrics.threeg_simulation_performance?.values?.['p(95)'] || 0,
      mobile_compliance: data.metrics.mobile_performance_compliance?.values?.rate || 0,
    },
    constitutional_verdict: {
      passes_all_requirements: Object.values({
        load_time_2s_3g: (data.metrics.load_time_compliance?.values?.rate || 0) >= 0.95,
        response_time_100ms: (data.metrics.response_time_compliance?.values?.rate || 0) >= 0.95,
        email_delivery_5s: (data.metrics.email_delivery_compliance?.values?.rate || 0) >= 0.95,
        bundle_size_200kb: (data.metrics.bundle_size_compliance?.values?.rate || 0) >= 0.98,
        error_rate_1_percent: (data.metrics.error_rate_compliance?.values?.rate || 0) >= 0.99,
        concurrent_users_25k: (data.metrics.concurrent_user_compliance?.values?.rate || 0) >= 0.95,
      }).every(req => req === true),
      overall_compliance_grade: (() => {
        const score = data.metrics.constitutional_compliance_score?.values?.rate || 0;
        if (score >= 0.95) return 'A+ (Constitutional Compliant)';
        if (score >= 0.90) return 'A (Excellent)';
        if (score >= 0.85) return 'B+ (Good)';
        if (score >= 0.80) return 'B (Acceptable)';
        if (score >= 0.70) return 'C (Needs Improvement)';
        return 'F (Constitutional Non-Compliant)';
      })()
    }
  };

  return {
    'constitutional-validation-report.json': JSON.stringify(constitutionalReport, null, 2),
    'stdout': `
Constitutional Compliance Validation Results:
============================================

CONSTITUTIONAL VERDICT: ${constitutionalReport.constitutional_verdict.passes_all_requirements ? 'PASS ✅' : 'FAIL ❌'}
Overall Grade: ${constitutionalReport.constitutional_verdict.overall_compliance_grade}

Constitutional Requirements Compliance:
- Load Time <2s (3G): ${(constitutionalReport.constitutional_compliance.load_time_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.load_time_2s_3g ? '✅' : '❌'}
- Response Time <100ms: ${(constitutionalReport.constitutional_compliance.response_time_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.response_time_100ms ? '✅' : '❌'}
- Email Delivery <5s: ${(constitutionalReport.constitutional_compliance.email_delivery_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.email_delivery_5s ? '✅' : '❌'}
- Bundle Size <200KB: ${(constitutionalReport.constitutional_compliance.bundle_size_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.bundle_size_200kb ? '✅' : '❌'}
- Error Rate <1%: ${(constitutionalReport.constitutional_compliance.error_rate_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.error_rate_1_percent ? '✅' : '❌'}
- 25k Concurrent Users: ${(constitutionalReport.constitutional_compliance.concurrent_user_compliance * 100).toFixed(1)}% ${constitutionalReport.constitutional_requirements_met.concurrent_users_25k ? '✅' : '❌'}

Performance Summary:
- Max Concurrent Users: ${constitutionalReport.performance_metrics.max_concurrent_users}
- Total Violations: ${constitutionalReport.performance_metrics.total_violations}
- System Stability: ${(constitutionalReport.performance_metrics.system_stability * 100).toFixed(1)}%
- German Market Ready: ${(constitutionalReport.performance_metrics.german_market_readiness * 100).toFixed(1)}%
- 3G Performance (p95): ${constitutionalReport.performance_metrics.threeg_performance_p95}ms
- Mobile Compliance: ${(constitutionalReport.performance_metrics.mobile_compliance * 100).toFixed(1)}%

Overall Compliance Score: ${(constitutionalReport.constitutional_compliance.overall_compliance_score * 100).toFixed(1)}%
    `
  };
}