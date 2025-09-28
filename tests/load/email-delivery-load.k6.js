/**
 * TimeButler Calendar MVP - Email Delivery Load Testing
 * Tests email delivery performance under 25k concurrent load
 * Focus: Constitutional requirement of <5s email delivery, German market patterns
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Histogram, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Email Delivery Performance Metrics
const email_delivery_time = new Histogram('email_delivery_time');
const email_delivery_success_rate = new Rate('email_delivery_success_rate');
const email_queue_time = new Histogram('email_queue_time');
const email_processing_time = new Histogram('email_processing_time');
const email_template_render_time = new Histogram('email_template_render_time');

// Constitutional Email Requirements
const constitutional_email_compliance = new Rate('constitutional_email_compliance');
const email_delivery_under_5s = new Rate('email_delivery_under_5s');
const email_delivery_failures = new Counter('email_delivery_failures');

// German Market Email Metrics
const german_email_delivery = new Histogram('german_email_delivery');
const english_email_delivery = new Histogram('english_email_delivery');
const bilingual_template_performance = new Histogram('bilingual_template_performance');
const gdpr_email_compliance = new Rate('gdpr_email_compliance');

// Email Infrastructure Metrics
const smtp_connection_time = new Histogram('smtp_connection_time');
const email_server_throughput = new Counter('email_server_throughput');
const email_rate_limiting = new Rate('email_rate_limiting');
const email_attachment_generation = new Histogram('email_attachment_generation');

// Peak Season Email Metrics
const christmas_email_volume = new Counter('christmas_email_volume');
const new_year_email_rush = new Counter('new_year_email_rush');
const vacation_plan_email_success = new Rate('vacation_plan_email_success');

export let options = {
  scenarios: {
    // Constitutional Email Delivery Test (5s requirement)
    constitutional_email_delivery: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 500 },    // Email system warm up
        { duration: '5m', target: 2000 },   // Moderate email load
        { duration: '10m', target: 5000 },  // High email volume
        { duration: '15m', target: 8000 },  // Peak email delivery
        { duration: '20m', target: 10000 }, // Stress email infrastructure
        { duration: '15m', target: 8000 },  // Sustained peak
        { duration: '10m', target: 5000 },  // Scale down
        { duration: '5m', target: 2000 },   // Cool down
        { duration: '2m', target: 0 },      // Stop
      ],
      gracefulStop: '60s',
    },

    // Peak Season Email Rush (Christmas/New Year)
    peak_season_email_rush: {
      executor: 'ramping-arrival-rate',
      startTime: '15m',
      timeUnit: '1s',
      preAllocatedVUs: 2000,
      maxVUs: 15000,
      stages: [
        { duration: '5m', target: 50 },     // Normal email volume
        { duration: '10m', target: 200 },   // Holiday planning starts
        { duration: '15m', target: 500 },   // Christmas rush
        { duration: '20m', target: 800 },   // Peak email delivery
        { duration: '25m', target: 1000 },  // Constitutional stress test
        { duration: '15m', target: 500 },   // Post-rush stabilization
        { duration: '10m', target: 200 },   // Return to normal
        { duration: '5m', target: 50 },     // Cool down
      ],
    },

    // German Bilingual Email Testing
    german_bilingual_email_test: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '40m',
      startTime: '10m',
      exec: 'germanBilingualEmailTest',
    },

    // Email Infrastructure Stress Test
    email_infrastructure_stress: {
      executor: 'constant-arrival-rate',
      startTime: '25m',
      rate: 100, // 100 emails per second
      timeUnit: '1s',
      duration: '20m',
      preAllocatedVUs: 1000,
      maxVUs: 5000,
      exec: 'emailInfrastructureStress',
    }
  },

  // Email Performance Thresholds
  thresholds: {
    // Constitutional Requirements
    'constitutional_email_compliance': ['rate>=0.95'],     // 95% constitutional compliance
    'email_delivery_under_5s': ['rate>=0.95'],            // 95% delivered <5s
    'email_delivery_time': ['p(95)<5000'],                // Constitutional <5s requirement
    'email_delivery_success_rate': ['rate>=0.98'],        // 98% delivery success

    // Email Infrastructure Performance
    'email_queue_time': ['p(95)<1000'],                   // Queue processing <1s
    'email_processing_time': ['p(95)<2000'],              // Email processing <2s
    'email_template_render_time': ['p(95)<500'],          // Template rendering <500ms
    'smtp_connection_time': ['p(95)<200'],                // SMTP connection <200ms

    // German Market Requirements
    'german_email_delivery': ['p(95)<5000'],              // German emails <5s
    'english_email_delivery': ['p(95)<5000'],             // English emails <5s
    'bilingual_template_performance': ['p(95)<600'],       // Bilingual templates <600ms
    'gdpr_email_compliance': ['rate>=0.99'],              // 99% GDPR compliance

    // Email Volume and Reliability
    'email_server_throughput': ['count>50000'],           // >50k emails processed
    'email_delivery_failures': ['count<500'],             // <500 total failures
    'email_rate_limiting': ['rate<0.05'],                 // <5% rate limited
    'vacation_plan_email_success': ['rate>=0.97'],        // 97% vacation email success

    // Overall Performance
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<2000'],
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

// German Email Templates and Content
const germanEmailTemplates = {
  vacation_plan_de: {
    subject_template: 'Ihr Urlaubsplan für {year} - TimeButler',
    greeting: 'Sehr geehrte Damen und Herren',
    content_type: 'vacation_planning',
    gdpr_required: true,
    language: 'de'
  },
  vacation_plan_en: {
    subject_template: 'Your Vacation Plan for {year} - TimeButler',
    greeting: 'Dear Vacation Planner',
    content_type: 'vacation_planning',
    gdpr_required: true,
    language: 'en'
  },
  bridge_weekend_de: {
    subject_template: 'Optimale Brückenwochenenden {year} - {state}',
    greeting: 'Liebe Urlaubsplaner',
    content_type: 'bridge_optimization',
    gdpr_required: true,
    language: 'de'
  },
  bridge_weekend_en: {
    subject_template: 'Optimal Bridge Weekends {year} - {state}',
    greeting: 'Hello Bridge Weekend Optimizer',
    content_type: 'bridge_optimization',
    gdpr_required: true,
    language: 'en'
  }
};

// German States Email Volume Distribution
const stateEmailVolume = {
  'BY': 0.18, // Bavaria - high volume
  'NW': 0.22, // NRW - highest volume
  'BW': 0.14, // Baden-Württemberg - high volume
  'NI': 0.10, // Lower Saxony
  'HE': 0.08, // Hesse
  'BE': 0.05, // Berlin - international
  'SN': 0.05, // Saxony
  'RP': 0.05, // Rhineland-Palatinate
  'SH': 0.04, // Schleswig-Holstein
  'BB': 0.03, // Brandenburg
  'ST': 0.03, // Saxony-Anhalt
  'TH': 0.03, // Thuringia
  'HH': 0.02, // Hamburg
  'MV': 0.02, // Mecklenburg-Vorpommern
  'SL': 0.01, // Saarland
  'HB': 0.01  // Bremen
};

export default function() {
  const emailDeliveryTest = selectEmailScenario();
  testEmailDelivery(emailDeliveryTest);
}

function selectEmailScenario() {
  const scenarios = ['vacation_plan', 'bridge_weekend', 'holiday_reminder', 'year_end_summary'];
  const scenario = randomItem(scenarios);

  const state = selectStateByEmailVolume();
  const language = Math.random() < 0.87 ? 'de' : 'en'; // 87% German emails

  return {
    scenario: scenario,
    state: state,
    language: language,
    template: language === 'de' ?
      germanEmailTemplates[`${scenario}_de`] || germanEmailTemplates.vacation_plan_de :
      germanEmailTemplates[`${scenario}_en`] || germanEmailTemplates.vacation_plan_en
  };
}

function testEmailDelivery(emailTest) {
  const emailStart = Date.now();

  group('Constitutional Email Delivery Test', function() {
    // Create vacation plan for email delivery
    const planPayload = {
      selected_bridges: generateBridgeWeekends(emailTest.state),
      state: emailTest.state,
      email: `load.test.${__VU}.${__ITER}@example.com`,
      language: emailTest.language,
      gdpr_consent: true,
      email_preferences: {
        format: 'html_with_text_fallback',
        calendar_attachment: true,
        pdf_summary: Math.random() < 0.7 // 70% want PDF
      },
      vacation_plan_name: `Load Test Plan ${emailTest.state} ${__VU}-${__ITER}`,
      constitutional_email_test: true
    };

    const planResponse = http.post(
      `${API_BASE_URL}/v1/vacation-plan`,
      JSON.stringify(planPayload),
      {
        timeout: '8s',
        headers: {
          'Content-Type': 'application/json',
          'X-Email-Load-Test': 'true',
          'X-Constitutional-Test': 'true'
        }
      }
    );

    if (planResponse.status === 200 || planResponse.status === 201) {
      try {
        const planData = JSON.parse(planResponse.body);

        // Request email delivery - Constitutional requirement test
        const emailDeliveryStart = Date.now();

        const emailPayload = {
          delivery_language: emailTest.language,
          template_type: emailTest.scenario,
          include_calendar: true,
          include_pdf_summary: planPayload.email_preferences.pdf_summary,
          gdpr_compliance_required: true,
          constitutional_test: true,
          priority: 'normal'
        };

        const emailResponse = http.post(
          `${API_BASE_URL}/v1/vacation-plan/${planData.id}/email`,
          JSON.stringify(emailPayload),
          {
            timeout: '8s',
            headers: {
              'Content-Type': 'application/json',
              'X-Email-Load-Test': 'true',
              'X-Template-Language': emailTest.language,
              'X-State': emailTest.state
            }
          }
        );

        const totalEmailTime = Date.now() - emailDeliveryStart;
        email_delivery_time.add(totalEmailTime);
        email_server_throughput.add(1);

        // Constitutional compliance check
        const constitutionalCompliant = totalEmailTime < 5000;
        constitutional_email_compliance.add(constitutionalCompliant ? 1 : 0);
        email_delivery_under_5s.add(constitutionalCompliant ? 1 : 0);

        if (!constitutionalCompliant) {
          email_delivery_failures.add(1);
        }

        // Email delivery success validation
        const emailSuccess = emailResponse.status === 200 || emailResponse.status === 202;
        email_delivery_success_rate.add(emailSuccess ? 1 : 0);
        vacation_plan_email_success.add(emailSuccess ? 1 : 0);

        // Language-specific performance tracking
        if (emailTest.language === 'de') {
          german_email_delivery.add(totalEmailTime);
        } else {
          english_email_delivery.add(totalEmailTime);
        }

        // GDPR compliance check
        const gdprCompliant = emailResponse.headers['X-GDPR-Compliant'] === 'true';
        gdpr_email_compliance.add(gdprCompliant ? 1 : 0);

        // Rate limiting check
        const rateLimited = emailResponse.status === 429;
        email_rate_limiting.add(rateLimited ? 1 : 0);

        // Parse email delivery details if available
        if (emailSuccess) {
          try {
            const emailData = JSON.parse(emailResponse.body);

            if (emailData.queue_time) {
              email_queue_time.add(emailData.queue_time);
            }

            if (emailData.processing_time) {
              email_processing_time.add(emailData.processing_time);
            }

            if (emailData.template_render_time) {
              email_template_render_time.add(emailData.template_render_time);
              bilingual_template_performance.add(emailData.template_render_time);
            }

            if (emailData.smtp_connection_time) {
              smtp_connection_time.add(emailData.smtp_connection_time);
            }
          } catch (e) {
            // Email response might not have detailed metrics
          }
        }

        check(emailResponse, {
          'Constitutional email delivery <5s': () => constitutionalCompliant,
          'Email delivery successful': () => emailSuccess,
          'Email not rate limited': () => !rateLimited,
          'GDPR compliant email': () => gdprCompliant,
          'Email contains vacation plan': (r) => {
            try {
              const data = JSON.parse(r.body);
              return data.status === 'sent' || data.status === 'queued';
            } catch {
              return r.status === 200;
            }
          }
        });

        // Track peak season patterns
        if (emailTest.scenario === 'vacation_plan') {
          christmas_email_volume.add(1);
        } else if (emailTest.scenario === 'year_end_summary') {
          new_year_email_rush.add(1);
        }

      } catch (e) {
        email_delivery_failures.add(1);
        email_delivery_success_rate.add(0);
        constitutional_email_compliance.add(0);
      }
    } else {
      email_delivery_failures.add(1);
      email_delivery_success_rate.add(0);
      constitutional_email_compliance.add(0);
    }
  });

  const totalTime = Date.now() - emailStart;

  // Realistic email user behavior
  sleep(randomIntBetween(2, 8)); // Users typically wait before checking email
}

// German Bilingual Email Testing
export function germanBilingualEmailTest() {
  group('German Bilingual Email Performance', function() {
    const state = selectStateByEmailVolume();

    // Test both German and English email templates
    const languages = ['de', 'en'];

    for (const language of languages) {
      const bilingualStart = Date.now();

      const emailPayload = {
        template_test: true,
        language: language,
        state: state,
        content: {
          holiday_count: randomIntBetween(10, 15),
          bridge_opportunities: randomIntBetween(5, 12),
          vacation_days_optimized: randomIntBetween(20, 35)
        },
        gdpr_required: true
      };

      const templateResponse = http.post(
        `${API_BASE_URL}/v1/email/template-test`,
        JSON.stringify(emailPayload),
        {
          timeout: '3s',
          headers: {
            'Content-Type': 'application/json',
            'X-Bilingual-Test': 'true',
            'X-Template-Language': language
          }
        }
      );

      const bilingualTime = Date.now() - bilingualStart;
      bilingual_template_performance.add(bilingualTime);

      if (language === 'de') {
        german_email_delivery.add(bilingualTime);
      } else {
        english_email_delivery.add(bilingualTime);
      }

      check(templateResponse, {
        'Bilingual template renders': (r) => r.status === 200,
        'Template performance acceptable': () => bilingualTime < 600,
        'Contains correct language content': (r) => {
          if (language === 'de') {
            return r.body.includes('Feiertag') || r.body.includes('Urlaubsplan');
          } else {
            return r.body.includes('Holiday') || r.body.includes('Vacation Plan');
          }
        }
      });
    }
  });

  sleep(randomIntBetween(1, 3));
}

// Email Infrastructure Stress Testing
export function emailInfrastructureStress() {
  group('Email Infrastructure Stress Test', function() {
    const state = selectStateByEmailVolume();
    const language = Math.random() < 0.85 ? 'de' : 'en';

    // Rapid email delivery requests
    const stressPayload = {
      email: `stress.test.${__VU}.${__ITER}@example.com`,
      state: state,
      language: language,
      stress_test: true,
      rapid_delivery: true,
      vacation_plan_summary: {
        bridges: generateBridgeWeekends(state),
        total_vacation_days: randomIntBetween(25, 35)
      }
    };

    const stressResponse = http.post(
      `${API_BASE_URL}/v1/email/send-rapid`,
      JSON.stringify(stressPayload),
      {
        timeout: '5s',
        headers: {
          'Content-Type': 'application/json',
          'X-Stress-Test': 'true',
          'X-Rapid-Delivery': 'true'
        }
      }
    );

    const stressSuccess = stressResponse.status === 200 || stressResponse.status === 202;
    email_delivery_success_rate.add(stressSuccess ? 1 : 0);
    email_server_throughput.add(1);

    // Check for rate limiting under stress
    const rateLimited = stressResponse.status === 429;
    email_rate_limiting.add(rateLimited ? 1 : 0);

    check(stressResponse, {
      'Stress test email delivered': () => stressSuccess,
      'Infrastructure handles stress': () => !rateLimited || stressResponse.status === 202
    });
  });

  sleep(randomIntBetween(0.5, 2)); // Rapid stress testing
}

function selectStateByEmailVolume() {
  const random = Math.random();
  let cumulativeVolume = 0;

  for (const [state, volume] of Object.entries(stateEmailVolume)) {
    cumulativeVolume += volume;
    if (random <= cumulativeVolume) {
      return state;
    }
  }

  return 'NW'; // Fallback to NRW (highest volume)
}

function generateBridgeWeekends(state) {
  const commonBridges = [
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-01', // Labor Day
    '2025-05-29', // Ascension Day
    '2025-12-25', // Christmas
    '2025-12-26', // Boxing Day
    '2026-01-01'  // New Year
  ];

  // Add state-specific holidays
  const stateBridges = [...commonBridges];

  if (['BY', 'BW', 'ST'].includes(state)) {
    stateBridges.push('2026-01-06'); // Epiphany
  }

  if (['BY', 'BW', 'HE', 'NW', 'RP', 'SL'].includes(state)) {
    stateBridges.push('2025-06-19'); // Corpus Christi
  }

  return stateBridges.slice(0, randomIntBetween(3, 7));
}

export function handleSummary(data) {
  const emailReport = {
    timestamp: new Date().toISOString(),
    constitutional_email_compliance: {
      overall_compliance: data.metrics.constitutional_email_compliance?.values?.rate || 0,
      delivery_under_5s_rate: data.metrics.email_delivery_under_5s?.values?.rate || 0,
      avg_delivery_time: data.metrics.email_delivery_time?.values?.avg || 0,
      p95_delivery_time: data.metrics.email_delivery_time?.values?.['p(95)'] || 0,
      p99_delivery_time: data.metrics.email_delivery_time?.values?.['p(99)'] || 0,
      total_failures: data.metrics.email_delivery_failures?.values?.count || 0
    },
    email_infrastructure_performance: {
      success_rate: data.metrics.email_delivery_success_rate?.values?.rate || 0,
      total_emails_processed: data.metrics.email_server_throughput?.values?.count || 0,
      emails_per_second: (data.metrics.email_server_throughput?.values?.count || 0) / ((data.state?.testRunDurationMs || 1) / 1000),
      rate_limiting_rate: data.metrics.email_rate_limiting?.values?.rate || 0,
      avg_queue_time: data.metrics.email_queue_time?.values?.avg || 0,
      avg_processing_time: data.metrics.email_processing_time?.values?.avg || 0,
      avg_smtp_connection_time: data.metrics.smtp_connection_time?.values?.avg || 0
    },
    german_market_email_performance: {
      german_email_p95: data.metrics.german_email_delivery?.values?.['p(95)'] || 0,
      english_email_p95: data.metrics.english_email_delivery?.values?.['p(95)'] || 0,
      bilingual_template_p95: data.metrics.bilingual_template_performance?.values?.['p(95)'] || 0,
      gdpr_compliance_rate: data.metrics.gdpr_email_compliance?.values?.rate || 0,
      vacation_plan_success_rate: data.metrics.vacation_plan_email_success?.values?.rate || 0
    },
    peak_season_metrics: {
      christmas_email_volume: data.metrics.christmas_email_volume?.values?.count || 0,
      new_year_email_rush: data.metrics.new_year_email_rush?.values?.count || 0
    },
    constitutional_verdict: {
      meets_5s_requirement: (data.metrics.email_delivery_time?.values?.['p(95)'] || 0) < 5000,
      meets_success_rate: (data.metrics.email_delivery_success_rate?.values?.rate || 0) >= 0.98,
      meets_compliance_rate: (data.metrics.constitutional_email_compliance?.values?.rate || 0) >= 0.95,
      overall_email_constitutional_compliance: (
        (data.metrics.email_delivery_time?.values?.['p(95)'] || 0) < 5000 &&
        (data.metrics.email_delivery_success_rate?.values?.rate || 0) >= 0.98 &&
        (data.metrics.constitutional_email_compliance?.values?.rate || 0) >= 0.95
      )
    }
  };

  return {
    'email-delivery-load-report.json': JSON.stringify(emailReport, null, 2),
    'stdout': `
Email Delivery Load Test Results:
=================================

CONSTITUTIONAL EMAIL COMPLIANCE: ${emailReport.constitutional_verdict.overall_email_constitutional_compliance ? 'PASS ✅' : 'FAIL ❌'}

Constitutional Requirements:
- Email Delivery <5s (P95): ${emailReport.constitutional_email_compliance.p95_delivery_time.toFixed(1)}ms ${emailReport.constitutional_verdict.meets_5s_requirement ? '✅' : '❌'}
- Success Rate ≥98%: ${(emailReport.email_infrastructure_performance.success_rate * 100).toFixed(1)}% ${emailReport.constitutional_verdict.meets_success_rate ? '✅' : '❌'}
- Compliance Rate ≥95%: ${(emailReport.constitutional_email_compliance.overall_compliance * 100).toFixed(1)}% ${emailReport.constitutional_verdict.meets_compliance_rate ? '✅' : '❌'}

Email Performance:
- Average Delivery Time: ${emailReport.constitutional_email_compliance.avg_delivery_time.toFixed(1)}ms
- P95 Delivery Time: ${emailReport.constitutional_email_compliance.p95_delivery_time.toFixed(1)}ms
- P99 Delivery Time: ${emailReport.constitutional_email_compliance.p99_delivery_time.toFixed(1)}ms
- Delivery Success Rate: ${(emailReport.email_infrastructure_performance.success_rate * 100).toFixed(1)}%

Infrastructure Performance:
- Total Emails Processed: ${emailReport.email_infrastructure_performance.total_emails_processed}
- Emails/Second: ${emailReport.email_infrastructure_performance.emails_per_second.toFixed(1)}
- Rate Limiting: ${(emailReport.email_infrastructure_performance.rate_limiting_rate * 100).toFixed(2)}%
- Average Queue Time: ${emailReport.email_infrastructure_performance.avg_queue_time.toFixed(1)}ms
- Average Processing Time: ${emailReport.email_infrastructure_performance.avg_processing_time.toFixed(1)}ms
- SMTP Connection Time: ${emailReport.email_infrastructure_performance.avg_smtp_connection_time.toFixed(1)}ms

German Market Performance:
- German Email Delivery (P95): ${emailReport.german_market_email_performance.german_email_p95.toFixed(1)}ms
- English Email Delivery (P95): ${emailReport.german_market_email_performance.english_email_p95.toFixed(1)}ms
- Bilingual Template Performance (P95): ${emailReport.german_market_email_performance.bilingual_template_p95.toFixed(1)}ms
- GDPR Compliance: ${(emailReport.german_market_email_performance.gdpr_compliance_rate * 100).toFixed(1)}%
- Vacation Plan Email Success: ${(emailReport.german_market_email_performance.vacation_plan_success_rate * 100).toFixed(1)}%

Peak Season Metrics:
- Christmas Email Volume: ${emailReport.peak_season_metrics.christmas_email_volume}
- New Year Email Rush: ${emailReport.peak_season_metrics.new_year_email_rush}

Total Failures: ${emailReport.constitutional_email_compliance.total_failures}
    `
  };
}