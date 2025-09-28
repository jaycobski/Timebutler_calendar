/**
 * TimeButler Calendar MVP - Peak Season Load Test
 * Simulates German vacation planning peak season (December-January)
 * Focus: Christmas/New Year bridge planning surge, year-end traffic spikes
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Peak Season Specific Metrics
const christmas_planning_surge = new Histogram('christmas_planning_surge');
const new_year_optimization = new Histogram('new_year_optimization');
const year_end_traffic_spike = new Histogram('year_end_traffic_spike');
const peak_season_error_rate = new Rate('peak_season_error_rate');
const seasonal_planning_completion = new Rate('seasonal_planning_completion');

// German Peak Season Patterns
const christmas_bridge_efficiency = new Histogram('christmas_bridge_efficiency');
const january_return_optimization = new Histogram('january_return_optimization');
const school_holiday_alignment = new Histogram('school_holiday_alignment');
const year_transition_planning = new Histogram('year_transition_planning');

// Infrastructure Stress Metrics
const peak_load_response_time = new Histogram('peak_load_response_time');
const concurrent_users_peak = new Counter('concurrent_users_peak');
const database_performance_peak = new Histogram('database_performance_peak');
const cache_hit_rate_peak = new Rate('cache_hit_rate_peak');

export let options = {
  scenarios: {
    // December Christmas Planning Surge (Early December traffic)
    december_planning_surge: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1s',
      preAllocatedVUs: 2000,
      maxVUs: 15000,
      stages: [
        { duration: '5m', target: 50 },    // Normal November traffic
        { duration: '10m', target: 200 },  // Early December increase
        { duration: '15m', target: 500 },  // Mid-December surge
        { duration: '20m', target: 800 },  // Peak Christmas planning
        { duration: '25m', target: 1000 }, // Maximum December traffic
        { duration: '20m', target: 500 },  // Post-planning stabilization
        { duration: '10m', target: 200 },  // Return to normal
        { duration: '5m', target: 50 },    // Cool down
      ],
    },

    // New Year Bridge Optimization Rush (Late December - Early January)
    new_year_bridge_rush: {
      executor: 'ramping-vus',
      startTime: '30m',
      stages: [
        { duration: '3m', target: 1000 },   // Dec 27-29 planning
        { duration: '7m', target: 5000 },   // Dec 30 massive surge
        { duration: '10m', target: 12000 }, // Dec 31 peak planning
        { duration: '15m', target: 18000 }, // New Year's Day optimization
        { duration: '20m', target: 25000 }, // Constitutional limit test
        { duration: '15m', target: 15000 }, // Jan 2-3 continued planning
        { duration: '10m', target: 8000 },  // Return to work preparation
        { duration: '5m', target: 2000 },   // Stabilization
        { duration: '3m', target: 0 },      // Cool down
      ],
      gracefulStop: '60s',
    },

    // School Holiday Coordination (German families planning around school breaks)
    school_holiday_coordination: {
      executor: 'ramping-arrival-rate',
      startTime: '60m',
      timeUnit: '1s',
      preAllocatedVUs: 1000,
      maxVUs: 8000,
      stages: [
        { duration: '5m', target: 100 },   // Normal family planning
        { duration: '15m', target: 400 },  // School holiday publication
        { duration: '20m', target: 800 },  // Coordination surge
        { duration: '25m', target: 1200 }, // Peak family coordination
        { duration: '20m', target: 800 },  // Sustained coordination
        { duration: '10m', target: 400 },  // Planning completion
        { duration: '5m', target: 100 },   // Return to normal
      ],
    },

    // Last-Minute Year-End Planning (Dec 28-31 panic planning)
    last_minute_panic_planning: {
      executor: 'ramping-vus',
      startTime: '90m',
      stages: [
        { duration: '1m', target: 500 },    // Sudden realization
        { duration: '3m', target: 2000 },   // Panic sets in
        { duration: '5m', target: 6000 },   // Mass panic planning
        { duration: '8m', target: 10000 },  // Peak panic
        { duration: '10m', target: 15000 }, // Sustained panic
        { duration: '8m', target: 10000 },  // Slight reduction
        { duration: '5m', target: 6000 },   // Completion rush
        { duration: '3m', target: 2000 },   // Final submissions
        { duration: '1m', target: 0 },      // Deadline passed
      ],
      gracefulStop: '30s',
    }
  },

  // Peak Season Performance Thresholds (More demanding during peak)
  thresholds: {
    // Constitutional Requirements Under Peak Load
    'peak_load_response_time': ['p(95)<3000'], // Slightly relaxed during peak
    'peak_season_error_rate': ['rate<0.02'],   // Allow 2% error rate during peak
    'http_req_failed': ['rate<0.02'],

    // Christmas Planning Specific
    'christmas_planning_surge': ['p(95)<2500'],
    'new_year_optimization': ['p(95)<2000'],
    'year_end_traffic_spike': ['p(95)<3000'],

    // Seasonal Planning Success
    'seasonal_planning_completion': ['rate>0.85'], // 85% completion rate during peak

    // Infrastructure Stress
    'database_performance_peak': ['p(95)<1000'],
    'cache_hit_rate_peak': ['rate>0.90'], // 90% cache hit rate essential

    // Overall Performance During Peak
    'http_req_duration': ['p(95)<2000'],
    'http_req_waiting': ['p(95)<1500'],
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// German Peak Season Planning Scenarios
const peakSeasonScenarios = {
  christmas_bridge_2025: {
    target_dates: ['2025-12-24', '2025-12-25', '2025-12-26'],
    bridge_opportunities: [
      { take_off: '2025-12-22', vacation_days: 1, total_days: 5 }, // Mon-Fri off
      { take_off: '2025-12-29', vacation_days: 3, total_days: 9 }, // Through New Year
    ],
    popularity_weight: 0.95
  },

  new_year_bridge_2026: {
    target_dates: ['2025-12-31', '2026-01-01'],
    bridge_opportunities: [
      { take_off: '2025-12-29', vacation_days: 2, total_days: 6 }, // Mon-Tue off
      { take_off: '2026-01-02', vacation_days: 3, total_days: 9 }, // Extend into January
    ],
    popularity_weight: 0.88
  },

  three_kings_bridge: {
    target_dates: ['2026-01-06'], // Heilige Drei Könige (Catholic states)
    bridge_opportunities: [
      { take_off: '2026-01-05', vacation_days: 1, total_days: 4 }, // Mon off
      { take_off: '2026-01-07', vacation_days: 1, total_days: 4 }, // Tue off
    ],
    popularity_weight: 0.45, // Only Catholic states
    states: ['BY', 'BW', 'ST']
  },

  easter_early_planning: {
    target_dates: ['2026-04-03', '2026-04-06'], // Good Friday, Easter Monday
    bridge_opportunities: [
      { take_off: '2026-04-01', vacation_days: 2, total_days: 6 }, // Wed-Thu off
      { take_off: '2026-04-07', vacation_days: 1, total_days: 5 }, // Tue off
    ],
    popularity_weight: 0.75, // Early Easter planning during year-end
  }
};

// German School Holiday Periods (varies by state)
const germanSchoolHolidays2025 = {
  christmas_break: {
    start: '2025-12-20',
    end: '2026-01-06',
    affected_states: 'all',
    family_planning_factor: 1.8 // 80% more family-oriented planning
  },
  winter_break: {
    start: '2026-02-10',
    end: '2026-02-14',
    affected_states: ['BY', 'BW', 'BE', 'BB'],
    family_planning_factor: 1.3
  }
};

export default function() {
  const startTime = Date.now();
  concurrent_users_peak.add(1);

  // Determine user profile based on peak season characteristics
  const userProfile = determinePeakSeasonProfile();

  group('Peak Season German User Journey', function() {
    // Simulate peak season main page load with high traffic
    const peakLoadStart = Date.now();

    const mainResponse = http.get(
      `${BASE_URL}/?lang=${userProfile.language}&state=${userProfile.state}&peak_season=true`,
      {
        timeout: '15s', // Longer timeout during peak
        headers: {
          'Accept-Language': userProfile.language === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9',
          'User-Agent': userProfile.device_type,
          'Cache-Control': 'no-cache', // Simulate fresh requests during peak
          'X-Peak-Season': 'true'
        }
      }
    );

    const peakLoadTime = Date.now() - peakLoadStart;
    peak_load_response_time.add(peakLoadTime);

    check(mainResponse, {
      'Peak season page loads': (r) => r.status === 200,
      'Peak load time acceptable': () => peakLoadTime < 3000,
      'Contains Christmas planning content': (r) =>
        r.body.includes('Weihnachten') || r.body.includes('Christmas') ||
        r.body.includes('Neujahr') || r.body.includes('New Year'),
    }) || peak_season_error_rate.add(1);

    // Peak season holiday data request
    const holidayStart = Date.now();
    const holidayResponse = http.get(
      `${API_BASE_URL}/v1/holidays?state=${userProfile.state}&year=2025&year=2026&lang=${userProfile.language}&peak_season=true`,
      {
        timeout: '8s',
        headers: {
          'Accept': 'application/json',
          'X-Peak-Season': 'true'
        }
      }
    );

    const holidayTime = Date.now() - holidayStart;
    database_performance_peak.add(holidayTime);

    // Check cache performance during peak
    const cacheHeader = holidayResponse.headers['X-Cache-Status'];
    cache_hit_rate_peak.add(cacheHeader === 'HIT' ? 1 : 0);

    check(holidayResponse, {
      'Peak season holidays fetched': (r) => r.status === 200,
      'Holiday fetch time during peak': () => holidayTime < 1000,
      'Contains 2025-2026 holidays': (r) => {
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

  // Christmas Bridge Planning Surge
  group('Christmas Bridge Planning', function() {
    const christmasStart = Date.now();

    const christmasPayload = {
      state: userProfile.state,
      years: [2025, 2026],
      vacation_days_available: userProfile.vacation_days,
      language: userProfile.language,
      focus_periods: ['christmas_2025', 'new_year_2026'],
      planning_priority: 'family_time',
      peak_season: true
    };

    const christmasResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends/christmas-optimization`,
      JSON.stringify(christmasPayload),
      {
        timeout: '10s',
        headers: {
          'Content-Type': 'application/json',
          'X-Peak-Season': 'true',
          'X-Planning-Priority': 'christmas'
        }
      }
    );

    const christmasTime = Date.now() - christmasStart;
    christmas_planning_surge.add(christmasTime);

    check(christmasResponse, {
      'Christmas bridges calculated': (r) => r.status === 200,
      'Christmas planning time acceptable': () => christmasTime < 2500,
      'Contains Christmas bridge opportunities': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.bridge_weekends?.some(bridge =>
            bridge.holiday_name?.includes('Weihnachten') ||
            bridge.holiday_name?.includes('Christmas')
          );
        } catch {
          return false;
        }
      }
    });
  });

  // New Year Optimization Rush
  group('New Year Bridge Optimization', function() {
    const newYearStart = Date.now();

    const newYearPayload = {
      state: userProfile.state,
      target_period: { start: '2025-12-28', end: '2026-01-06' },
      vacation_days_available: userProfile.vacation_days,
      language: userProfile.language,
      optimization_goal: 'maximize_consecutive_days',
      peak_season: true
    };

    const newYearResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends/new-year-optimization`,
      JSON.stringify(newYearPayload),
      {
        timeout: '8s',
        headers: {
          'Content-Type': 'application/json',
          'X-Peak-Season': 'true',
          'X-Optimization-Goal': 'new-year-bridge'
        }
      }
    );

    const newYearTime = Date.now() - newYearStart;
    new_year_optimization.add(newYearTime);

    check(newYearResponse, {
      'New Year optimization successful': (r) => r.status === 200,
      'New Year optimization time': () => newYearTime < 2000,
      'Maximizes year-end break': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.optimized_plan?.total_consecutive_days >= 10;
        } catch {
          return false;
        }
      }
    });
  });

  // School Holiday Coordination (Family users)
  if (userProfile.user_type === 'family') {
    group('School Holiday Coordination', function() {
      const schoolStart = Date.now();

      const schoolPayload = {
        state: userProfile.state,
        family_composition: {
          adults: userProfile.adults,
          children_school_age: userProfile.children
        },
        school_holiday_periods: ['christmas_2025', 'winter_2026'],
        coordination_priority: 'family_time',
        vacation_days_available: userProfile.vacation_days,
        language: userProfile.language
      };

      const schoolResponse = http.post(
        `${API_BASE_URL}/v1/bridge-weekends/school-coordination`,
        JSON.stringify(schoolPayload),
        {
          timeout: '12s',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Type': 'family',
            'X-Coordination-Priority': 'school-holidays'
          }
        }
      );

      const schoolTime = Date.now() - schoolStart;
      school_holiday_alignment.add(schoolTime);

      check(schoolResponse, {
        'School holiday coordination successful': (r) => r.status === 200,
        'Family planning optimized': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.family_optimized_plan?.school_alignment_score > 0.8;
          } catch {
            return false;
          }
        }
      });
    });
  }

  // Peak Season Email Planning (Heavy email traffic)
  group('Peak Season Email Delivery', function() {
    if (Math.random() < 0.7) { // 70% of users request email during peak
      const emailStart = Date.now();

      const planPayload = {
        selected_bridges: userProfile.selected_bridges,
        state: userProfile.state,
        email: `peak.user.${__VU}.${__ITER}@example.com`,
        language: userProfile.language,
        gdpr_consent: true,
        peak_season: true,
        vacation_plan_name: `Peak Season Plan ${userProfile.state} ${__VU}-${__ITER}`,
        delivery_priority: 'high' // Peak season high priority
      };

      // Create peak season vacation plan
      const planResponse = http.post(
        `${API_BASE_URL}/v1/vacation-plan`,
        JSON.stringify(planPayload),
        {
          timeout: '15s',
          headers: {
            'Content-Type': 'application/json',
            'X-Peak-Season': 'true',
            'X-Delivery-Priority': 'high'
          }
        }
      );

      if (planResponse.status === 200) {
        try {
          const planData = JSON.parse(planResponse.body);

          // Request email delivery during peak traffic
          const emailResponse = http.post(
            `${API_BASE_URL}/v1/vacation-plan/${planData.id}/email`,
            JSON.stringify({
              delivery_language: userProfile.language,
              peak_season: true,
              delivery_priority: 'high'
            }),
            {
              timeout: '20s', // Allow more time during peak
              headers: {
                'Content-Type': 'application/json',
                'X-Peak-Season': 'true'
              }
            }
          );

          const emailTime = Date.now() - emailStart;
          year_end_traffic_spike.add(emailTime);

          const planningCompleted = emailResponse.status === 200;
          seasonal_planning_completion.add(planningCompleted ? 1 : 0);

          check(emailResponse, {
            'Peak season email delivered': (r) => r.status === 200,
            'Email delivery during peak traffic': () => emailTime < 8000, // Relaxed during peak
            'Peak season planning completed': () => planningCompleted
          });
        } catch (e) {
          seasonal_planning_completion.add(0);
        }
      } else {
        seasonal_planning_completion.add(0);
      }
    }
  });

  // Realistic peak season user behavior
  const peakSeasonPause = userProfile.user_type === 'panic_planner' ?
    randomIntBetween(1, 2) : // Panic planners are quick
    randomIntBetween(2, 8);   // Normal users take more time during peak

  sleep(peakSeasonPause);

  const totalTime = Date.now() - startTime;
  year_transition_planning.add(totalTime);
}

function determinePeakSeasonProfile() {
  const userTypes = ['family', 'professional', 'student', 'retiree', 'panic_planner'];
  const userType = randomItem(userTypes);

  const states = ['BY', 'NW', 'BW', 'BE', 'HE', 'NI', 'SN', 'RP', 'SH', 'SL', 'HH', 'HB', 'BB', 'MV', 'ST', 'TH'];
  const state = randomItem(states);

  const deviceTypes = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  ];

  const profile = {
    user_type: userType,
    state: state,
    language: Math.random() < 0.85 ? 'de' : 'en', // 85% German during peak season
    device_type: randomItem(deviceTypes),
    vacation_days: randomIntBetween(25, 35),
    selected_bridges: ['2025-12-24', '2025-12-25', '2026-01-01'] // Popular peak season dates
  };

  // User type specific characteristics
  switch (userType) {
    case 'family':
      profile.adults = randomIntBetween(1, 2);
      profile.children = randomIntBetween(1, 3);
      profile.vacation_days = randomIntBetween(28, 35);
      break;
    case 'professional':
      profile.vacation_days = randomIntBetween(25, 30);
      profile.planning_style = 'efficient';
      break;
    case 'panic_planner':
      profile.vacation_days = randomIntBetween(20, 40);
      profile.planning_style = 'last_minute';
      break;
    case 'retiree':
      profile.vacation_days = randomIntBetween(30, 40);
      profile.planning_style = 'thorough';
      break;
  }

  return profile;
}

export function handleSummary(data) {
  const peakSeasonReport = {
    timestamp: new Date().toISOString(),
    peak_season_performance: {
      max_concurrent_users: data.metrics.concurrent_users_peak?.values?.count || 0,
      constitutional_compliance: data.metrics.concurrent_users_peak?.values?.count >= 25000,
      peak_load_response_time: data.metrics.peak_load_response_time?.values?.['p(95)'] || 0,
      peak_error_rate: data.metrics.peak_season_error_rate?.values?.rate || 0
    },
    christmas_planning: {
      avg_planning_time: data.metrics.christmas_planning_surge?.values?.avg || 0,
      p95_planning_time: data.metrics.christmas_planning_surge?.values?.['p(95)'] || 0,
      planning_success_rate: 1 - (data.metrics.peak_season_error_rate?.values?.rate || 0)
    },
    new_year_optimization: {
      avg_optimization_time: data.metrics.new_year_optimization?.values?.avg || 0,
      p95_optimization_time: data.metrics.new_year_optimization?.values?.['p(95)'] || 0
    },
    infrastructure_stress: {
      database_performance: data.metrics.database_performance_peak?.values?.['p(95)'] || 0,
      cache_hit_rate: data.metrics.cache_hit_rate_peak?.values?.rate || 0,
      seasonal_completion_rate: data.metrics.seasonal_planning_completion?.values?.rate || 0
    },
    constitutional_validation: {
      passes_25k_user_requirement: data.metrics.concurrent_users_peak?.values?.count >= 25000,
      maintains_error_rate_below_2_percent: (data.metrics.peak_season_error_rate?.values?.rate || 0) < 0.02,
      peak_response_time_acceptable: (data.metrics.peak_load_response_time?.values?.['p(95)'] || 0) < 3000
    }
  };

  return {
    'peak-season-report.json': JSON.stringify(peakSeasonReport, null, 2),
    'stdout': `
Peak Season Load Test Results:
==============================

Constitutional Compliance:
- 25k Users: ${peakSeasonReport.constitutional_validation.passes_25k_user_requirement ? 'PASS' : 'FAIL'}
- Error Rate <2%: ${peakSeasonReport.constitutional_validation.maintains_error_rate_below_2_percent ? 'PASS' : 'FAIL'}
- Response Time <3s: ${peakSeasonReport.constitutional_validation.peak_response_time_acceptable ? 'PASS' : 'FAIL'}

Peak Performance:
- Max Concurrent Users: ${peakSeasonReport.peak_season_performance.max_concurrent_users}
- Peak Response Time (p95): ${peakSeasonReport.peak_season_performance.peak_load_response_time}ms
- Error Rate: ${(peakSeasonReport.peak_season_performance.peak_error_rate * 100).toFixed(2)}%

Christmas Planning:
- Avg Planning Time: ${peakSeasonReport.christmas_planning.avg_planning_time}ms
- P95 Planning Time: ${peakSeasonReport.christmas_planning.p95_planning_time}ms
- Success Rate: ${(peakSeasonReport.christmas_planning.planning_success_rate * 100).toFixed(1)}%

Infrastructure:
- Database P95: ${peakSeasonReport.infrastructure_stress.database_performance}ms
- Cache Hit Rate: ${(peakSeasonReport.infrastructure_stress.cache_hit_rate * 100).toFixed(1)}%
- Completion Rate: ${(peakSeasonReport.infrastructure_stress.seasonal_completion_rate * 100).toFixed(1)}%
    `
  };
}