/**
 * Test Data Helper
 * Provides comprehensive test data for German vacation planning scenarios
 */

export interface TestUser {
  id: string;
  email: string;
  state: string;
  vacationDays: number;
  language: 'de' | 'en';
  preferences: {
    includeReligiousHolidays: boolean;
    optimizeFor: 'efficiency' | 'total_days_off' | 'balanced' | 'simplicity';
    preferredBridgeLength?: '3_days' | '4_days' | 'flexible';
  };
  accessibility?: {
    screenReader: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
  device?: 'desktop' | 'mobile' | 'tablet';
}

export interface TestHoliday {
  key: string;
  date: string;
  name_de: string;
  name_en: string;
  states: string[];
  bridgeOpportunity: boolean;
  religiousHoliday: boolean;
}

export interface TestBridgeWeekend {
  holiday: string;
  startDate: string;
  endDate: string;
  vacationDaysNeeded: number;
  totalDaysOff: number;
  efficiency: number;
  pattern: 'thursday-friday' | 'monday-tuesday' | 'friday-monday' | 'sandwich';
  states: string[];
}

/**
 * Setup comprehensive test data for German vacation planning
 */
export async function setupHolidayTestData(): Promise<void> {
  console.log('📅 Setting up German holiday test data...');

  const fs = require('fs').promises;
  const path = require('path');

  try {
    const testDataDir = path.join(process.cwd(), 'tests/test-data');
    await fs.mkdir(testDataDir, { recursive: true });

    // Create comprehensive holiday data
    const holidayData = {
      federal_holidays_2025: getFederalHolidays2025(),
      state_holidays_2025: getStateHolidays2025(),
      bridge_opportunities_2025: getBridgeOpportunities2025(),
      test_users: getTestUsers(),
      test_scenarios: getTestScenarios()
    };

    await fs.writeFile(
      path.join(testDataDir, 'complete-holiday-data.json'),
      JSON.stringify(holidayData, null, 2)
    );

    console.log('✅ Holiday test data ready');

  } catch (error) {
    console.warn('⚠️ Holiday test data setup warning:', error.message);
  }
}

/**
 * Get federal holidays for 2025
 */
export function getFederalHolidays2025(): TestHoliday[] {
  return [
    {
      key: 'neujahr',
      date: '2025-01-01',
      name_de: 'Neujahr',
      name_en: 'New Year\'s Day',
      states: ['ALL'],
      bridgeOpportunity: true, // Wednesday, can bridge with Thu/Fri
      religiousHoliday: false
    },
    {
      key: 'karfreitag',
      date: '2025-04-18',
      name_de: 'Karfreitag',
      name_en: 'Good Friday',
      states: ['ALL'],
      bridgeOpportunity: true, // Friday, long weekend possible
      religiousHoliday: true
    },
    {
      key: 'ostermontag',
      date: '2025-04-21',
      name_de: 'Ostermontag',
      name_en: 'Easter Monday',
      states: ['ALL'],
      bridgeOpportunity: false, // Monday, already extends weekend
      religiousHoliday: true
    },
    {
      key: 'tag_der_arbeit',
      date: '2025-05-01',
      name_de: 'Tag der Arbeit',
      name_en: 'Labour Day',
      states: ['ALL'],
      bridgeOpportunity: true, // Thursday, bridge Friday for long weekend
      religiousHoliday: false
    },
    {
      key: 'christi_himmelfahrt',
      date: '2025-05-29',
      name_de: 'Christi Himmelfahrt',
      name_en: 'Ascension Day',
      states: ['ALL'],
      bridgeOpportunity: true, // Thursday, perfect bridge day
      religiousHoliday: true
    },
    {
      key: 'pfingstmontag',
      date: '2025-06-09',
      name_de: 'Pfingstmontag',
      name_en: 'Whit Monday',
      states: ['ALL'],
      bridgeOpportunity: false, // Monday, already extends weekend
      religiousHoliday: true
    },
    {
      key: 'tag_der_deutschen_einheit',
      date: '2025-10-03',
      name_de: 'Tag der Deutschen Einheit',
      name_en: 'German Unity Day',
      states: ['ALL'],
      bridgeOpportunity: true, // Friday, extends weekend
      religiousHoliday: false
    },
    {
      key: 'weihnachtstag',
      date: '2025-12-25',
      name_de: '1. Weihnachtstag',
      name_en: 'Christmas Day',
      states: ['ALL'],
      bridgeOpportunity: false, // Thursday, but Christmas period
      religiousHoliday: true
    },
    {
      key: 'zweiter_weihnachtstag',
      date: '2025-12-26',
      name_de: '2. Weihnachtstag',
      name_en: 'Boxing Day',
      states: ['ALL'],
      bridgeOpportunity: true, // Friday, extends to New Year
      religiousHoliday: true
    }
  ];
}

/**
 * Get state-specific holidays for 2025
 */
export function getStateHolidays2025(): Record<string, TestHoliday[]> {
  return {
    'BY': [ // Bavaria
      {
        key: 'heilige_drei_koenige',
        date: '2025-01-06',
        name_de: 'Heilige Drei Könige',
        name_en: 'Epiphany',
        states: ['BY', 'BW', 'ST'],
        bridgeOpportunity: true,
        religiousHoliday: true
      },
      {
        key: 'fronleichnam',
        date: '2025-06-19',
        name_de: 'Fronleichnam',
        name_en: 'Corpus Christi',
        states: ['BY', 'BW', 'HE', 'NW', 'RP', 'SL'],
        bridgeOpportunity: true,
        religiousHoliday: true
      },
      {
        key: 'mariae_himmelfahrt',
        date: '2025-08-15',
        name_de: 'Mariä Himmelfahrt',
        name_en: 'Assumption of Mary',
        states: ['BY', 'SL'],
        bridgeOpportunity: true,
        religiousHoliday: true
      },
      {
        key: 'allerheiligen',
        date: '2025-11-01',
        name_de: 'Allerheiligen',
        name_en: 'All Saints\' Day',
        states: ['BY', 'BW', 'NW', 'RP', 'SL'],
        bridgeOpportunity: false,
        religiousHoliday: true
      }
    ],
    'BE': [ // Berlin
      {
        key: 'weltfrauentag',
        date: '2025-03-08',
        name_de: 'Internationaler Frauentag',
        name_en: 'International Women\'s Day',
        states: ['BE'],
        bridgeOpportunity: false,
        religiousHoliday: false
      }
    ],
    'HH': [ // Hamburg
      {
        key: 'reformationstag',
        date: '2025-10-31',
        name_de: 'Reformationstag',
        name_en: 'Reformation Day',
        states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'TH'],
        bridgeOpportunity: true,
        religiousHoliday: true
      }
    ],
    'SN': [ // Saxony
      {
        key: 'reformationstag',
        date: '2025-10-31',
        name_de: 'Reformationstag',
        name_en: 'Reformation Day',
        states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'TH'],
        bridgeOpportunity: true,
        religiousHoliday: true
      },
      {
        key: 'buss_und_bettag',
        date: '2025-11-19',
        name_de: 'Buß- und Bettag',
        name_en: 'Day of Repentance and Prayer',
        states: ['SN'],
        bridgeOpportunity: true,
        religiousHoliday: true
      }
    ],
    'NW': [ // North Rhine-Westphalia
      {
        key: 'fronleichnam',
        date: '2025-06-19',
        name_de: 'Fronleichnam',
        name_en: 'Corpus Christi',
        states: ['BY', 'BW', 'HE', 'NW', 'RP', 'SL'],
        bridgeOpportunity: true,
        religiousHoliday: true
      },
      {
        key: 'allerheiligen',
        date: '2025-11-01',
        name_de: 'Allerheiligen',
        name_en: 'All Saints\' Day',
        states: ['BY', 'BW', 'NW', 'RP', 'SL'],
        bridgeOpportunity: false,
        religiousHoliday: true
      }
    ]
  };
}

/**
 * Get bridge weekend opportunities for 2025
 */
export function getBridgeOpportunities2025(): TestBridgeWeekend[] {
  return [
    {
      holiday: 'neujahr',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      vacationDaysNeeded: 2, // Thu 2nd, Fri 3rd
      totalDaysOff: 5,
      efficiency: 2.5,
      pattern: 'thursday-friday',
      states: ['ALL']
    },
    {
      holiday: 'tag_der_arbeit',
      startDate: '2025-05-01',
      endDate: '2025-05-04',
      vacationDaysNeeded: 1, // Friday 2nd
      totalDaysOff: 4,
      efficiency: 4.0,
      pattern: 'friday-monday',
      states: ['ALL']
    },
    {
      holiday: 'christi_himmelfahrt',
      startDate: '2025-05-29',
      endDate: '2025-06-01',
      vacationDaysNeeded: 1, // Friday 30th
      totalDaysOff: 4,
      efficiency: 4.0,
      pattern: 'thursday-friday',
      states: ['ALL']
    },
    {
      holiday: 'tag_der_deutschen_einheit',
      startDate: '2025-10-03',
      endDate: '2025-10-05',
      vacationDaysNeeded: 0, // Already Friday
      totalDaysOff: 3,
      efficiency: Infinity,
      pattern: 'friday-monday',
      states: ['ALL']
    },
    {
      holiday: 'fronleichnam',
      startDate: '2025-06-19',
      endDate: '2025-06-22',
      vacationDaysNeeded: 1, // Friday 20th
      totalDaysOff: 4,
      efficiency: 4.0,
      pattern: 'thursday-friday',
      states: ['BY', 'BW', 'HE', 'NW', 'RP', 'SL']
    },
    {
      holiday: 'heilige_drei_koenige',
      startDate: '2025-01-06',
      endDate: '2025-01-12',
      vacationDaysNeeded: 5, // Tue-Fri after Monday holiday
      totalDaysOff: 7,
      efficiency: 1.4,
      pattern: 'monday-tuesday',
      states: ['BY', 'BW', 'ST']
    },
    {
      holiday: 'zweiter_weihnachtstag',
      startDate: '2025-12-25',
      endDate: '2026-01-01',
      vacationDaysNeeded: 3, // Mon 29th, Tue 30th, Wed 31st
      totalDaysOff: 8, // Including New Year
      efficiency: 2.67,
      pattern: 'sandwich',
      states: ['ALL']
    }
  ];
}

/**
 * Get test users for different scenarios
 */
export function getTestUsers(): TestUser[] {
  return [
    {
      id: 'bavaria_catholic_efficient',
      email: 'bavaria.user@test-timebutler.de',
      state: 'BY',
      vacationDays: 30,
      language: 'de',
      preferences: {
        includeReligiousHolidays: true,
        optimizeFor: 'efficiency',
        preferredBridgeLength: '4_days'
      }
    },
    {
      id: 'berlin_secular_maxdays',
      email: 'berlin.user@test-timebutler.de',
      state: 'BE',
      vacationDays: 25,
      language: 'de',
      preferences: {
        includeReligiousHolidays: false,
        optimizeFor: 'total_days_off',
        preferredBridgeLength: '3_days'
      }
    },
    {
      id: 'international_balanced',
      email: 'international.user@test-timebutler.com',
      state: 'NW',
      vacationDays: 28,
      language: 'en',
      preferences: {
        includeReligiousHolidays: true,
        optimizeFor: 'balanced',
        preferredBridgeLength: 'flexible'
      }
    },
    {
      id: 'accessibility_user',
      email: 'accessibility.user@test-timebutler.de',
      state: 'HH',
      vacationDays: 26,
      language: 'de',
      preferences: {
        includeReligiousHolidays: true,
        optimizeFor: 'simplicity'
      },
      accessibility: {
        screenReader: true,
        highContrast: true,
        reducedMotion: true
      }
    },
    {
      id: 'mobile_user',
      email: 'mobile.user@test-timebutler.de',
      state: 'SN',
      vacationDays: 24,
      language: 'de',
      preferences: {
        includeReligiousHolidays: true,
        optimizeFor: 'efficiency'
      },
      device: 'mobile'
    },
    {
      id: 'low_vacation_user',
      email: 'minimal.user@test-timebutler.de',
      state: 'NW',
      vacationDays: 20,
      language: 'de',
      preferences: {
        includeReligiousHolidays: false,
        optimizeFor: 'efficiency',
        preferredBridgeLength: '3_days'
      }
    }
  ];
}

/**
 * Get test scenarios for comprehensive E2E testing
 */
export function getTestScenarios(): Array<{
  name: string;
  description: string;
  user: string;
  expectedResults: {
    minBridgeOpportunities: number;
    maxVacationDaysUsed: number;
    includesStateHolidays: boolean;
    emailDelivered: boolean;
  };
  testSteps: string[];
}> {
  return [
    {
      name: 'bavarian_catholic_optimization',
      description: 'Bavarian user optimizing for maximum efficiency with religious holidays',
      user: 'bavaria_catholic_efficient',
      expectedResults: {
        minBridgeOpportunities: 6,
        maxVacationDaysUsed: 25,
        includesStateHolidays: true,
        emailDelivered: true
      },
      testSteps: [
        'Navigate to homepage',
        'Select Bavaria (BY) as state',
        'Set 30 vacation days',
        'Include religious holidays',
        'Optimize for efficiency',
        'Generate bridge weekends',
        'Verify Bavarian holidays included',
        'Enter email for delivery',
        'Submit vacation plan',
        'Verify email delivery'
      ]
    },
    {
      name: 'berlin_secular_maximum_days',
      description: 'Berlin user maximizing total days off without religious holidays',
      user: 'berlin_secular_maxdays',
      expectedResults: {
        minBridgeOpportunities: 4,
        maxVacationDaysUsed: 25,
        includesStateHolidays: false,
        emailDelivered: true
      },
      testSteps: [
        'Navigate to homepage',
        'Select Berlin (BE) as state',
        'Set 25 vacation days',
        'Exclude religious holidays',
        'Optimize for total days off',
        'Generate bridge weekends',
        'Verify no religious holidays',
        'Verify Berlin Women\'s Day included',
        'Enter email for delivery',
        'Submit vacation plan'
      ]
    },
    {
      name: 'international_english_balanced',
      description: 'International user using English interface with balanced optimization',
      user: 'international_balanced',
      expectedResults: {
        minBridgeOpportunities: 5,
        maxVacationDaysUsed: 28,
        includesStateHolidays: true,
        emailDelivered: true
      },
      testSteps: [
        'Navigate to homepage',
        'Switch to English language',
        'Select North Rhine-Westphalia (NW)',
        'Set 28 vacation days',
        'Include religious holidays',
        'Optimize for balanced approach',
        'Generate bridge weekends',
        'Verify English translations',
        'Verify NW holidays (Fronleichnam, Allerheiligen)',
        'Enter email for delivery',
        'Submit vacation plan'
      ]
    },
    {
      name: 'accessibility_screen_reader',
      description: 'Accessibility user with screen reader simulation',
      user: 'accessibility_user',
      expectedResults: {
        minBridgeOpportunities: 3,
        maxVacationDaysUsed: 26,
        includesStateHolidays: true,
        emailDelivered: true
      },
      testSteps: [
        'Navigate with keyboard only',
        'Test screen reader compatibility',
        'Select Hamburg (HH) with tab navigation',
        'Set 26 vacation days using keyboard',
        'Optimize for simplicity',
        'Generate plan with screen reader',
        'Verify ARIA labels',
        'Test high contrast mode',
        'Submit with keyboard navigation'
      ]
    },
    {
      name: 'mobile_responsive_efficiency',
      description: 'Mobile user testing responsive design and touch interactions',
      user: 'mobile_user',
      expectedResults: {
        minBridgeOpportunities: 4,
        maxVacationDaysUsed: 24,
        includesStateHolidays: true,
        emailDelivered: true
      },
      testSteps: [
        'Navigate on mobile viewport',
        'Test touch interactions',
        'Select Saxony (SN) on mobile',
        'Set 24 vacation days with mobile input',
        'Test mobile calendar view',
        'Verify responsive layout',
        'Generate plan on mobile',
        'Test mobile email input',
        'Submit on mobile device'
      ]
    },
    {
      name: 'low_vacation_budget_optimization',
      description: 'User with limited vacation days optimizing for maximum efficiency',
      user: 'low_vacation_user',
      expectedResults: {
        minBridgeOpportunities: 3,
        maxVacationDaysUsed: 20,
        includesStateHolidays: false,
        emailDelivered: true
      },
      testSteps: [
        'Navigate to homepage',
        'Select North Rhine-Westphalia (NW)',
        'Set only 20 vacation days',
        'Exclude religious holidays to save days',
        'Optimize for maximum efficiency',
        'Generate bridge weekends',
        'Verify high efficiency ratios',
        'Verify vacation budget respected',
        'Submit vacation plan'
      ]
    }
  ];
}

/**
 * Get German state information for testing
 */
export function getGermanStates(): Array<{
  code: string;
  name_de: string;
  name_en: string;
  population: number;
  religiousHolidays: boolean;
  uniqueHolidays: string[];
}> {
  return [
    {
      code: 'BY',
      name_de: 'Bayern',
      name_en: 'Bavaria',
      population: 13124737,
      religiousHolidays: true,
      uniqueHolidays: ['Heilige Drei Könige', 'Fronleichnam', 'Mariä Himmelfahrt', 'Allerheiligen']
    },
    {
      code: 'BE',
      name_de: 'Berlin',
      name_en: 'Berlin',
      population: 3669491,
      religiousHolidays: false,
      uniqueHolidays: ['Internationaler Frauentag']
    },
    {
      code: 'BW',
      name_de: 'Baden-Württemberg',
      name_en: 'Baden-Württemberg',
      population: 11100394,
      religiousHolidays: true,
      uniqueHolidays: ['Heilige Drei Könige', 'Fronleichnam', 'Allerheiligen']
    },
    {
      code: 'HH',
      name_de: 'Hamburg',
      name_en: 'Hamburg',
      population: 1899160,
      religiousHolidays: false,
      uniqueHolidays: ['Reformationstag']
    },
    {
      code: 'NW',
      name_de: 'Nordrhein-Westfalen',
      name_en: 'North Rhine-Westphalia',
      population: 17947221,
      religiousHolidays: true,
      uniqueHolidays: ['Fronleichnam', 'Allerheiligen']
    },
    {
      code: 'SN',
      name_de: 'Sachsen',
      name_en: 'Saxony',
      population: 4071971,
      religiousHolidays: true,
      uniqueHolidays: ['Reformationstag', 'Buß- und Bettag']
    }
  ];
}

/**
 * Generate random test data for stress testing
 */
export function generateRandomTestData(count: number = 100): TestUser[] {
  const states = ['BY', 'BE', 'BW', 'HH', 'NW', 'SN', 'HE', 'RP', 'SL', 'BB', 'MV', 'NI', 'ST', 'TH', 'HB', 'SH'];
  const optimizations = ['efficiency', 'total_days_off', 'balanced', 'simplicity'] as const;
  const languages = ['de', 'en'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `stress_test_user_${i}`,
    email: `stress.test.${i}@test-timebutler.de`,
    state: states[Math.floor(Math.random() * states.length)],
    vacationDays: Math.floor(Math.random() * 20) + 20, // 20-40 days
    language: languages[Math.floor(Math.random() * languages.length)],
    preferences: {
      includeReligiousHolidays: Math.random() > 0.5,
      optimizeFor: optimizations[Math.floor(Math.random() * optimizations.length)]
    }
  }));
}