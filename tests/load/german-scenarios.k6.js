/**
 * TimeButler Calendar MVP - German User Scenarios Load Test
 * Simulates realistic German vacation planning behavior patterns
 * Focus: Regional differences, language preferences, seasonal patterns
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// German Market Specific Metrics
const bavarian_user_performance = new Histogram('bavarian_user_performance');
const nrw_user_performance = new Histogram('nrw_user_performance');
const berlin_user_performance = new Histogram('berlin_user_performance');
const language_switch_time = new Histogram('language_switch_time');
const state_holiday_accuracy = new Rate('state_holiday_accuracy');
const regional_load_distribution = new Counter('regional_load_distribution');

// German Vacation Planning Patterns
const easter_bridge_requests = new Counter('easter_bridge_requests');
const christmas_bridge_requests = new Counter('christmas_bridge_requests');
const autumn_bridge_requests = new Counter('autumn_bridge_requests');
const long_weekend_optimization = new Histogram('long_weekend_optimization');

export let options = {
  scenarios: {
    // Bavarian Users (Catholic holidays, Oktoberfest planning)
    bavarian_users: {
      executor: 'ramping-vus',
      exec: 'bavarianUserScenario',
      stages: [
        { duration: '2m', target: 500 },
        { duration: '10m', target: 2000 },
        { duration: '15m', target: 3000 }, // Bavaria has ~13M population
        { duration: '10m', target: 2000 },
        { duration: '3m', target: 0 },
      ],
      gracefulStop: '30s',
    },

    // North Rhine-Westphalia Users (Industrial region, Protestant/Catholic mix)
    nrw_users: {
      executor: 'ramping-vus',
      exec: 'nrwUserScenario',
      startTime: '5m',
      stages: [
        { duration: '2m', target: 600 },
        { duration: '10m', target: 2500 },
        { duration: '15m', target: 3500 }, // NRW has ~18M population
        { duration: '10m', target: 2500 },
        { duration: '3m', target: 0 },
      ],
      gracefulStop: '30s',
    },

    // Berlin Users (International, tech-savvy, English preference)
    berlin_international_users: {
      executor: 'ramping-vus',
      exec: 'berlinUserScenario',
      startTime: '10m',
      stages: [
        { duration: '2m', target: 200 },
        { duration: '10m', target: 800 },
        { duration: '15m', target: 1200 }, // Berlin has ~3.7M population
        { duration: '10m', target: 800 },
        { duration: '3m', target: 0 },
      ],
      gracefulStop: '30s',
    },

    // Mobile German Users (Smartphone vacation planning)
    mobile_german_users: {
      executor: 'ramping-vus',
      exec: 'mobileGermanUserScenario',
      startTime: '15m',
      stages: [
        { duration: '3m', target: 1000 },
        { duration: '12m', target: 4000 },
        { duration: '15m', target: 6000 }, // 70% mobile usage in Germany
        { duration: '10m', target: 4000 },
        { duration: '5m', target: 0 },
      ],
      gracefulStop: '30s',
    },

    // Rural/Smaller States Users (Lower internet speed, traditional patterns)
    rural_german_users: {
      executor: 'ramping-vus',
      exec: 'ruralGermanUserScenario',
      startTime: '20m',
      stages: [
        { duration: '5m', target: 300 },
        { duration: '15m', target: 1000 },
        { duration: '20m', target: 1500 }, // Rural areas, slower adoption
        { duration: '10m', target: 1000 },
        { duration: '5m', target: 0 },
      ],
      gracefulStop: '30s',
    }
  },

  thresholds: {
    // Regional Performance Requirements
    'bavarian_user_performance': ['p(95)<2000'],
    'nrw_user_performance': ['p(95)<2000'],
    'berlin_user_performance': ['p(95)<1500'], // Tech-savvy users expect faster

    // Language Switching Performance
    'language_switch_time': ['p(95)<300'],

    // Regional Holiday Accuracy
    'state_holiday_accuracy': ['rate>0.99'], // 99% accuracy for state-specific holidays

    // Vacation Planning Patterns
    'long_weekend_optimization': ['p(95)<500'],

    // Overall Performance
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// German States with Regional Characteristics
const germanRegions = {
  bavaria: {
    states: ['BY'],
    characteristics: ['catholic', 'traditional', 'oktoberfest', 'alpine'],
    vacation_preferences: ['easter_long', 'christmas_extended', 'oktoberfest'],
    avg_vacation_days: 32,
    language_preference: 'de',
    mobile_usage: 0.65
  },
  nrw: {
    states: ['NW'],
    characteristics: ['industrial', 'mixed_religion', 'urban', 'practical'],
    vacation_preferences: ['summer_break', 'autumn_bridges', 'christmas'],
    avg_vacation_days: 29,
    language_preference: 'de',
    mobile_usage: 0.72
  },
  berlin: {
    states: ['BE'],
    characteristics: ['international', 'tech_savvy', 'startup_culture', 'diverse'],
    vacation_preferences: ['flexible_working', 'long_weekends', 'international_holidays'],
    avg_vacation_days: 27,
    language_preference: 'mixed', // 60% German, 40% English
    mobile_usage: 0.78
  },
  northern: {
    states: ['HH', 'HB', 'SH', 'NI', 'MV'],
    characteristics: ['protestant', 'maritime', 'practical', 'reserved'],
    vacation_preferences: ['summer_holidays', 'reformation_day', 'easter'],
    avg_vacation_days: 30,
    language_preference: 'de',
    mobile_usage: 0.68
  },
  eastern: {
    states: ['BB', 'ST', 'SN', 'TH'],
    characteristics: ['rural', 'traditional', 'family_oriented', 'economic_conscious'],
    vacation_preferences: ['reformation_day', 'christmas', 'summer_break'],
    avg_vacation_days: 28,
    language_preference: 'de',
    mobile_usage: 0.62
  },
  southwestern: {
    states: ['BW', 'RP', 'SL', 'HE'],
    characteristics: ['economic_strong', 'mixed_religion', 'efficient', 'wine_culture'],
    vacation_preferences: ['easter', 'corpus_christi', 'wine_harvest', 'christmas'],
    avg_vacation_days: 31,
    language_preference: 'de',
    mobile_usage: 0.70
  }
};

// Common German Vacation Planning Patterns
const germanVacationPatterns = {
  easter_optimization: {
    typical_dates: ['2025-04-18', '2025-04-21'], // Good Friday to Easter Monday
    vacation_days_used: [1, 2], // Bridge Friday or Tuesday
    popularity: 0.85
  },
  christmas_extended: {
    typical_dates: ['2025-12-24', '2025-12-25', '2025-12-26', '2025-01-01'],
    vacation_days_used: [3, 4, 5], // Bridge between Christmas and New Year
    popularity: 0.92
  },
  long_summer_break: {
    typical_dates: ['2025-07-01', '2025-08-31'], // School holiday period
    vacation_days_used: [10, 15, 20],
    popularity: 0.78
  },
  ascension_day_bridge: {
    typical_dates: ['2025-05-29'], // Ascension Day (Himmelfahrt)
    vacation_days_used: [1], // Bridge Friday
    popularity: 0.67
  },
  reformation_day_north: {
    typical_dates: ['2025-10-31'], // Reformation Day in Northern states
    vacation_days_used: [1, 2],
    popularity: 0.45 // Only in Protestant states
  }
};

// Bavarian User Scenario (Catholic holidays, traditional patterns)
export function bavarianUserScenario() {
  const startTime = Date.now();
  regional_load_distribution.add(1, { region: 'bavaria' });

  const userProfile = {
    state: 'BY',
    language: 'de',
    vacation_days: randomIntBetween(28, 35),
    interests: ['oktoberfest', 'alpine_hiking', 'traditional_festivals'],
    device: Math.random() < 0.35 ? 'mobile' : 'desktop'
  };

  group('Bavarian User Journey', function() {
    // Load main page with Bavarian context
    const mainResponse = http.get(`${BASE_URL}/?lang=de&state=BY`, {
      headers: {
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.1',
        'User-Agent': userProfile.device === 'mobile'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    check(mainResponse, {
      'Bavarian main page loads': (r) => r.status === 200,
      'Contains Bavarian holidays': (r) => r.body.includes('Bayern') || r.body.includes('Heilige Drei Könige'),
    });

    // Fetch Bavarian holidays (including Catholic-specific ones)
    const holidayResponse = http.get(`${API_BASE_URL}/v1/holidays?state=BY&year=2025&lang=de`);

    check(holidayResponse, {
      'Bavarian holidays fetched': (r) => r.status === 200,
      'Contains Catholic holidays': (r) => {
        try {
          const holidays = JSON.parse(r.body);
          const catholicHolidays = holidays.filter(h =>
            h.name.includes('Heilige Drei Könige') ||
            h.name.includes('Fronleichnam') ||
            h.name.includes('Allerheiligen')
          );
          state_holiday_accuracy.add(catholicHolidays.length >= 3 ? 1 : 0);
          return catholicHolidays.length >= 3;
        } catch {
          state_holiday_accuracy.add(0);
          return false;
        }
      }
    });

    // Calculate bridges focusing on Catholic holidays
    const bridgePayload = {
      state: 'BY',
      year: 2025,
      vacation_days_available: userProfile.vacation_days,
      language: 'de',
      preferences: ['easter_optimization', 'corpus_christi', 'christmas_extended']
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(bridgePayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (bridgeResponse.status === 200) {
      easter_bridge_requests.add(1);
    }

    sleep(randomIntBetween(2, 5)); // Bavarian users take time to consider options
  });

  const totalTime = Date.now() - startTime;
  bavarian_user_performance.add(totalTime);
}

// NRW User Scenario (Industrial region, practical approach)
export function nrwUserScenario() {
  const startTime = Date.now();
  regional_load_distribution.add(1, { region: 'nrw' });

  const userProfile = {
    state: 'NW',
    language: 'de',
    vacation_days: randomIntBetween(26, 32),
    interests: ['efficiency', 'family_time', 'industrial_heritage'],
    device: Math.random() < 0.28 ? 'mobile' : 'desktop'
  };

  group('NRW User Journey', function() {
    // Load with NRW context
    const mainResponse = http.get(`${BASE_URL}/?lang=de&state=NW`);

    check(mainResponse, {
      'NRW main page loads': (r) => r.status === 200,
      'Contains NRW context': (r) => r.body.includes('Nordrhein-Westfalen') || r.body.includes('NRW'),
    });

    // Fetch NRW holidays (mixed Protestant/Catholic)
    const holidayResponse = http.get(`${API_BASE_URL}/v1/holidays?state=NW&year=2025&lang=de`);

    check(holidayResponse, {
      'NRW holidays accurate': (r) => {
        if (r.status !== 200) return false;
        try {
          const holidays = JSON.parse(r.body);
          // NRW has both Protestant and Catholic holidays
          const mixedHolidays = holidays.filter(h =>
            h.name.includes('Fronleichnam') || // Catholic
            h.name.includes('Allerheiligen') || // Catholic
            h.name.includes('Reformationstag') // Protestant (not in NRW, but should be absent)
          );
          state_holiday_accuracy.add(mixedHolidays.length >= 2 ? 1 : 0);
          return mixedHolidays.length >= 2;
        } catch {
          state_holiday_accuracy.add(0);
          return false;
        }
      }
    });

    // Practical bridge weekend calculation
    const bridgePayload = {
      state: 'NW',
      year: 2025,
      vacation_days_available: userProfile.vacation_days,
      language: 'de',
      preferences: ['efficiency_focused', 'family_oriented', 'long_weekends']
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(bridgePayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (bridgeResponse.status === 200) {
      autumn_bridge_requests.add(1);
    }

    sleep(randomIntBetween(1, 3)); // NRW users are efficient
  });

  const totalTime = Date.now() - startTime;
  nrw_user_performance.add(totalTime);
}

// Berlin International User Scenario (English/German mix, tech-savvy)
export function berlinUserScenario() {
  const startTime = Date.now();
  regional_load_distribution.add(1, { region: 'berlin' });

  const userProfile = {
    state: 'BE',
    language: Math.random() < 0.6 ? 'de' : 'en', // 60% German, 40% English
    vacation_days: randomIntBetween(25, 30),
    interests: ['tech_events', 'international_culture', 'flexible_working'],
    device: Math.random() < 0.22 ? 'mobile' : 'desktop'
  };

  group('Berlin International User Journey', function() {
    // Load with language preference
    const mainResponse = http.get(`${BASE_URL}/?lang=${userProfile.language}&state=BE`);

    check(mainResponse, {
      'Berlin main page loads': (r) => r.status === 200,
      'Correct language displayed': (r) => {
        if (userProfile.language === 'en') {
          return r.body.includes('Holiday') && r.body.includes('Berlin');
        } else {
          return r.body.includes('Feiertag') && r.body.includes('Berlin');
        }
      },
    });

    // Test language switching (common in Berlin)
    if (userProfile.language === 'de') {
      const langSwitchStart = Date.now();
      const englishResponse = http.get(`${BASE_URL}/?lang=en&state=BE`);
      const switchTime = Date.now() - langSwitchStart;
      language_switch_time.add(switchTime);

      check(englishResponse, {
        'Language switch successful': (r) => r.status === 200,
        'English content displayed': (r) => r.body.includes('Holiday'),
        'Language switch fast': () => switchTime < 300
      });
    }

    // Fetch Berlin holidays
    const holidayResponse = http.get(`${API_BASE_URL}/v1/holidays?state=BE&year=2025&lang=${userProfile.language}`);

    check(holidayResponse, {
      'Berlin holidays accurate': (r) => {
        if (r.status !== 200) return false;
        try {
          const holidays = JSON.parse(r.body);
          // Berlin specific: International Women's Day
          const berlinSpecific = holidays.filter(h =>
            h.name.includes('Frauentag') || h.name.includes('Women')
          );
          state_holiday_accuracy.add(berlinSpecific.length >= 1 ? 1 : 0);
          return berlinSpecific.length >= 1;
        } catch {
          state_holiday_accuracy.add(0);
          return false;
        }
      }
    });

    // Tech-savvy optimization request
    const optimizationStart = Date.now();
    const bridgePayload = {
      state: 'BE',
      year: 2025,
      vacation_days_available: userProfile.vacation_days,
      language: userProfile.language,
      preferences: ['long_weekends', 'international_holidays', 'flexible_working']
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(bridgePayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const optimizationTime = Date.now() - optimizationStart;
    long_weekend_optimization.add(optimizationTime);

    sleep(randomIntBetween(1, 2)); // Tech-savvy users are quick
  });

  const totalTime = Date.now() - startTime;
  berlin_user_performance.add(totalTime);
}

// Mobile German User Scenario (Smartphone usage patterns)
export function mobileGermanUserScenario() {
  const region = randomItem(['bavaria', 'nrw', 'berlin', 'northern', 'eastern', 'southwestern']);
  const regionData = germanRegions[region];
  const selectedState = randomItem(regionData.states);

  regional_load_distribution.add(1, { region: 'mobile_' + region });

  const userProfile = {
    state: selectedState,
    language: regionData.language_preference === 'mixed' ?
      (Math.random() < 0.6 ? 'de' : 'en') : 'de',
    vacation_days: randomIntBetween(regionData.avg_vacation_days - 3, regionData.avg_vacation_days + 3),
    device: 'mobile'
  };

  group('Mobile German User Journey', function() {
    // Mobile-optimized request
    const mobileResponse = http.get(`${BASE_URL}/?lang=${userProfile.language}&state=${selectedState}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': userProfile.language === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Viewport-Width': '375'
      }
    });

    check(mobileResponse, {
      'Mobile page loads successfully': (r) => r.status === 200,
      'Mobile-optimized content': (r) => r.body.includes('viewport') || r.body.includes('mobile'),
    });

    // Quick mobile interaction pattern
    const quickBridgePayload = {
      state: selectedState,
      year: 2025,
      vacation_days_available: userProfile.vacation_days,
      language: userProfile.language,
      mobile_optimized: true
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(quickBridgePayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(bridgeResponse, {
      'Mobile bridge calculation': (r) => r.status === 200
    });

    sleep(randomIntBetween(1, 2)); // Mobile users want quick results
  });
}

// Rural German User Scenario (Slower connections, traditional patterns)
export function ruralGermanUserScenario() {
  const ruralStates = ['MV', 'BB', 'ST', 'TH', 'SH']; // More rural states
  const selectedState = randomItem(ruralStates);

  regional_load_distribution.add(1, { region: 'rural' });

  const userProfile = {
    state: selectedState,
    language: 'de',
    vacation_days: randomIntBetween(26, 32),
    connection_speed: 'slow', // Simulate rural internet
    device: Math.random() < 0.38 ? 'mobile' : 'desktop'
  };

  group('Rural German User Journey', function() {
    // Simulate slower connection with timeout
    const ruralResponse = http.get(`${BASE_URL}/?lang=de&state=${selectedState}`, {
      timeout: '8s', // Longer timeout for rural connections
      headers: {
        'Accept-Language': 'de-DE,de;q=0.9',
        'Connection': 'slow'
      }
    });

    check(ruralResponse, {
      'Rural page loads (slower connection)': (r) => r.status === 200,
      'Resilient to slow connections': (r) => r.timings.duration < 8000
    });

    // Traditional holiday preferences
    const traditionalBridgePayload = {
      state: selectedState,
      year: 2025,
      vacation_days_available: userProfile.vacation_days,
      language: 'de',
      preferences: ['traditional_holidays', 'family_time', 'christmas_extended']
    };

    const bridgeResponse = http.post(
      `${API_BASE_URL}/v1/bridge-weekends`,
      JSON.stringify(traditionalBridgePayload),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (bridgeResponse.status === 200) {
      christmas_bridge_requests.add(1);
    }

    sleep(randomIntBetween(3, 6)); // Rural users take more time to browse
  });
}

export function handleSummary(data) {
  const germanMarketReport = {
    timestamp: new Date().toISOString(),
    regional_performance: {
      bavaria: {
        avg_performance: data.metrics.bavarian_user_performance?.values?.avg || 0,
        p95_performance: data.metrics.bavarian_user_performance?.values?.['p(95)'] || 0,
        user_count: data.metrics.regional_load_distribution?.values?.count || 0
      },
      nrw: {
        avg_performance: data.metrics.nrw_user_performance?.values?.avg || 0,
        p95_performance: data.metrics.nrw_user_performance?.values?.['p(95)'] || 0
      },
      berlin: {
        avg_performance: data.metrics.berlin_user_performance?.values?.avg || 0,
        p95_performance: data.metrics.berlin_user_performance?.values?.['p(95)'] || 0,
        language_switch_performance: data.metrics.language_switch_time?.values?.['p(95)'] || 0
      }
    },
    vacation_patterns: {
      easter_requests: data.metrics.easter_bridge_requests?.values?.count || 0,
      christmas_requests: data.metrics.christmas_bridge_requests?.values?.count || 0,
      autumn_requests: data.metrics.autumn_bridge_requests?.values?.count || 0
    },
    holiday_accuracy: {
      state_specific_accuracy: data.metrics.state_holiday_accuracy?.values?.rate || 0
    }
  };

  return {
    'german-market-report.json': JSON.stringify(germanMarketReport, null, 2),
    'stdout': `
German Market Load Test Results:
================================

Regional Performance:
- Bavaria: ${germanMarketReport.regional_performance.bavaria.p95_performance}ms (p95)
- NRW: ${germanMarketReport.regional_performance.nrw.p95_performance}ms (p95)
- Berlin: ${germanMarketReport.regional_performance.berlin.p95_performance}ms (p95)

Holiday Accuracy: ${(germanMarketReport.holiday_accuracy.state_specific_accuracy * 100).toFixed(1)}%

Vacation Planning Patterns:
- Easter bridges: ${germanMarketReport.vacation_patterns.easter_requests}
- Christmas bridges: ${germanMarketReport.vacation_patterns.christmas_requests}
- Autumn bridges: ${germanMarketReport.vacation_patterns.autumn_requests}
    `
  };
}