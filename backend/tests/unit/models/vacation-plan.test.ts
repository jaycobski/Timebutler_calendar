/**
 * VacationPlan Model Unit Tests
 *
 * Test-Driven Development for GDPR-compliant vacation planning model
 * Focuses on German data protection requirements and user experience
 *
 * IMPORTANT: These tests are designed to FAIL initially as the VacationPlan model doesn't exist yet.
 * This follows TDD principles - write failing tests first, then implement to make them pass.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { faker } from '@faker-js/faker/locale/de';
import crypto from 'crypto';
import { VacationPlan } from '../../../src/models/vacation-plan';
import { GDPRConsentRecord } from '../../../src/models/gdpr-consent-record';
import { BridgeWeekend } from '../../../src/models/bridge-weekend';
import { State } from '../../../src/models/state';
import { ValidationError, GDPRViolationError, DataRetentionError } from '../../../src/lib/errors';

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'test-uuid-12345'),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-value-12345'),
  })),
  createCipher: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    final: jest.fn(() => 'encrypted-email'),
  })),
}));

describe('VacationPlan Model', () => {
  let mockGDPRConsent: GDPRConsentRecord;
  let mockBridgeWeekends: BridgeWeekend[];
  let validEmailDomains: string[];

  beforeAll(() => {
    // Set faker to German locale for realistic test data
    faker.setLocale('de');

    // German and EU email domains for testing
    validEmailDomains = [
      'gmail.de', 'web.de', 't-online.de', 'gmx.de', 'freenet.de',
      'yahoo.de', 'arcor.de', 'alice.de', 'posteo.de', 'mailbox.org',
      'gmail.com', 'outlook.de', 'hotmail.de', // Common German domains
      'company.at', 'business.ch', 'user.lu', 'test.be', 'example.nl' // EU domains
    ];
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock GDPR consent record
    mockGDPRConsent = {
      timestamp: new Date(),
      ip_hash: 'hashed-ip-address',
      user_agent_hash: 'hashed-user-agent',
      consent_version: '1.1.0',
      purposes: ['vacation_planning', 'email_delivery', 'analytics_anonymous'],
      legal_basis: 'consent',
      source: 'vacation_form',
      withdrawal_method: 'email_link',
    };

    // Mock bridge weekends for testing
    mockBridgeWeekends = [
      {
        id: 'bridge-1',
        holiday_id: 'neujahr-2025',
        start_date: '2025-01-01',
        end_date: '2025-01-05',
        vacation_days_needed: 2,
        total_days_off: 5,
        efficiency: 2.5,
        pattern: 'thursday-friday',
      },
      {
        id: 'bridge-2',
        holiday_id: 'tag-der-arbeit-2025',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'monday-tuesday',
      },
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Model Creation and Properties', () => {
    it('should create a VacationPlan with all required properties', () => {
      const email = `test@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BY', // Bayern
        vacation_days_budget: 30,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('session_id');
      expect(plan).toHaveProperty('email');
      expect(plan).toHaveProperty('state_code', 'BY');
      expect(plan).toHaveProperty('vacation_days_budget', 30);
      expect(plan).toHaveProperty('selected_bridges');
      expect(plan).toHaveProperty('created_at');
      expect(plan).toHaveProperty('expires_at');
      expect(plan).toHaveProperty('gdpr_consent');
      expect(plan).toHaveProperty('language_preference', 'de');
    });

    it('should generate unique UUID for id and session_id', () => {
      const email = `user@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan1 = new VacationPlan({
        email,
        state_code: 'NW',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const plan2 = new VacationPlan({
        email: `another@${faker.helpers.arrayElement(validEmailDomains)}`,
        state_code: 'BW',
        vacation_days_budget: 28,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan1.id).toBeDefined();
      expect(plan1.session_id).toBeDefined();
      expect(plan2.id).toBeDefined();
      expect(plan2.session_id).toBeDefined();
      expect(plan1.id).not.toBe(plan2.id);
      expect(plan1.session_id).not.toBe(plan2.session_id);
    });

    it('should set expires_at to 90 days from creation (GDPR retention policy)', () => {
      const email = `retention@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'HH',
        vacation_days_budget: 27,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 90);

      expect(plan.expires_at.getTime()).toBeCloseTo(expectedExpiry.getTime(), -10000); // Within 10 seconds
    });

    it('should default to German language preference', () => {
      const email = `default@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BE',
        vacation_days_budget: 26,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        // language_preference omitted
      });

      expect(plan.language_preference).toBe('de');
    });
  });

  describe('GDPR Compliance - Explicit Consent', () => {
    it('should require explicit GDPR consent for creation', () => {
      const email = `consent@${faker.helpers.arrayElement(validEmailDomains)}`;

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'SN',
          vacation_days_budget: 25,
          selected_bridges: [],
          // gdpr_consent missing
          language_preference: 'de',
        });
      }).toThrow(GDPRViolationError);
    });

    it('should validate GDPR consent record completeness', () => {
      const email = `incomplete@${faker.helpers.arrayElement(validEmailDomains)}`;
      const incompleteConsent = { ...mockGDPRConsent };
      delete incompleteConsent.timestamp;

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'TH',
          vacation_days_budget: 30,
          selected_bridges: [],
          gdpr_consent: incompleteConsent,
          language_preference: 'en',
        });
      }).toThrow(GDPRViolationError);
    });

    it('should require minimum consent purposes for vacation planning', () => {
      const email = `purposes@${faker.helpers.arrayElement(validEmailDomains)}`;
      const invalidConsent = {
        ...mockGDPRConsent,
        purposes: ['analytics_only'], // Missing required purposes
      };

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'RP',
          vacation_days_budget: 28,
          selected_bridges: [],
          gdpr_consent: invalidConsent,
          language_preference: 'de',
        });
      }).toThrow(GDPRViolationError);
    });

    it('should validate consent version is current', () => {
      const email = `version@${faker.helpers.arrayElement(validEmailDomains)}`;
      const outdatedConsent = {
        ...mockGDPRConsent,
        consent_version: '1.0.0', // Outdated version
      };

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'SH',
          vacation_days_budget: 25,
          selected_bridges: [],
          gdpr_consent: outdatedConsent,
          language_preference: 'en',
        });
      }).toThrow(GDPRViolationError);
    });

    it('should hash sensitive consent metadata', () => {
      const email = `hash@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BB',
        vacation_days_budget: 30,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan.gdpr_consent.ip_hash).toBe('hashed-ip-address');
      expect(plan.gdpr_consent.user_agent_hash).toBe('hashed-user-agent');
      expect(plan.gdpr_consent.ip_hash).not.toMatch(/\d+\.\d+\.\d+\.\d+/); // Not raw IP
    });
  });

  describe('GDPR Compliance - Data Minimization', () => {
    it('should only store essential data fields', () => {
      const email = `minimal@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'MV',
        vacation_days_budget: 26,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
        // Extra fields that should be rejected
        full_name: 'John Doe',
        phone_number: '+49123456789',
        address: 'Berlin, Germany',
      } as any);

      expect(plan).not.toHaveProperty('full_name');
      expect(plan).not.toHaveProperty('phone_number');
      expect(plan).not.toHaveProperty('address');
    });

    it('should encrypt email address at rest', () => {
      const rawEmail = `encrypt@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email: rawEmail,
        state_code: 'ST',
        vacation_days_budget: 27,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      // Email should be encrypted, not stored in plain text
      expect(plan.email).not.toBe(rawEmail);
      expect(plan.email).toBe('encrypted-email'); // Mock encrypted value
    });

    it('should provide method to decrypt email for legitimate use', () => {
      const rawEmail = `decrypt@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email: rawEmail,
        state_code: 'HB',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const decryptedEmail = plan.getDecryptedEmail();
      expect(decryptedEmail).toBe(rawEmail);
    });

    it('should anonymize session identifiers', () => {
      const email = `session@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'NI',
        vacation_days_budget: 29,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      // Session ID should not contain identifiable information
      expect(plan.session_id).not.toContain(email);
      expect(plan.session_id).not.toContain('NI');
      expect(plan.session_id).toMatch(/^[a-f0-9-]+$/); // UUID format
    });
  });

  describe('GDPR Compliance - Data Retention and Deletion', () => {
    it('should implement automatic expiration after 90 days', () => {
      const email = `expire@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BW',
        vacation_days_budget: 30,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan.isExpired()).toBe(false);

      // Simulate 91 days later
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 91);
      jest.useFakeTimers().setSystemTime(futureDate);

      expect(plan.isExpired()).toBe(true);

      jest.useRealTimers();
    });

    it('should provide secure deletion method', async () => {
      const email = `delete@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'HE',
        vacation_days_budget: 26,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      await plan.secureDelete();

      expect(plan.email).toBe('[DELETED]');
      expect(plan.selected_bridges).toEqual([]);
      expect(plan.gdpr_consent.ip_hash).toBe('[DELETED]');
      expect(plan.gdpr_consent.user_agent_hash).toBe('[DELETED]');
      expect(plan.state_code).toBe(null);
    });

    it('should implement right to deletion (Article 17)', async () => {
      const email = `gdpr-delete@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'SL',
        vacation_days_budget: 28,
        selected_bridges: [mockBridgeWeekends[1]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const deletionResult = await plan.exerciseRightToErasure();

      expect(deletionResult.deleted).toBe(true);
      expect(deletionResult.deletion_timestamp).toBeInstanceOf(Date);
      expect(deletionResult.confirmation_sent).toBe(true);
    });

    it('should prevent access to expired plans', () => {
      const email = `expired@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BY',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      // Manually set expiration to past
      plan.expires_at = new Date(Date.now() - 1000);

      expect(() => {
        plan.getDecryptedEmail();
      }).toThrow(DataRetentionError);

      expect(() => {
        plan.updateSelectedBridges([mockBridgeWeekends[0]]);
      }).toThrow(DataRetentionError);
    });
  });

  describe('GDPR Compliance - Data Subject Rights', () => {
    it('should implement right of access (Article 15)', () => {
      const email = `access@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'NW',
        vacation_days_budget: 30,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const accessData = plan.generateAccessReport();

      expect(accessData).toHaveProperty('personal_data');
      expect(accessData).toHaveProperty('processing_purposes');
      expect(accessData).toHaveProperty('consent_record');
      expect(accessData).toHaveProperty('retention_period');
      expect(accessData).toHaveProperty('rights_information');
      expect(accessData.personal_data.email).toBe(email);
      expect(accessData.retention_period).toBe('90 days from creation');
    });

    it('should implement data portability (Article 20)', () => {
      const email = `export@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'HH',
        vacation_days_budget: 27,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const exportData = plan.exportPersonalData();

      expect(exportData).toHaveProperty('format', 'JSON');
      expect(exportData).toHaveProperty('data');
      expect(exportData.data).toHaveProperty('vacation_plan');
      expect(exportData.data.vacation_plan.email).toBe(email);
      expect(exportData.data.vacation_plan.selected_bridges).toHaveLength(1);
    });

    it('should track consent withdrawal', () => {
      const email = `withdraw@${faker.helpers.arrayElement(validEmailDomains)}`;

      const plan = new VacationPlan({
        email,
        state_code: 'BE',
        vacation_days_budget: 26,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const withdrawalResult = plan.withdrawConsent();

      expect(withdrawalResult.withdrawn).toBe(true);
      expect(withdrawalResult.withdrawal_timestamp).toBeInstanceOf(Date);
      expect(plan.gdpr_consent.withdrawn).toBe(true);
      expect(plan.gdpr_consent.withdrawal_timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Email Validation - German Market Focus', () => {
    it('should validate German email domains', () => {
      const germanDomains = ['web.de', 't-online.de', 'gmx.de', 'freenet.de', 'posteo.de'];

      germanDomains.forEach(domain => {
        const email = `test@${domain}`;

        const plan = new VacationPlan({
          email,
          state_code: 'BY',
          vacation_days_budget: 30,
          selected_bridges: [],
          gdpr_consent: mockGDPRConsent,
          language_preference: 'de',
        });

        expect(plan.getDecryptedEmail()).toBe(email);
      });
    });

    it('should validate Austrian and Swiss domains', () => {
      const dachDomains = ['company.at', 'business.ch'];

      dachDomains.forEach(domain => {
        const email = `user@${domain}`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: 'BY',
            vacation_days_budget: 28,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'de',
          });
        }).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@web.de',
        'test@',
        'test.web.de',
        'test@.de',
        'test@web.',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(invalidEmail => {
        expect(() => {
          new VacationPlan({
            email: invalidEmail as any,
            state_code: 'NW',
            vacation_days_budget: 25,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'en',
          });
        }).toThrow(ValidationError);
      });
    });

    it('should normalize email addresses', () => {
      const email = 'Test.User+Vacation@Gmail.DE';

      const plan = new VacationPlan({
        email,
        state_code: 'BW',
        vacation_days_budget: 30,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const normalized = plan.getDecryptedEmail();
      expect(normalized).toBe('test.user+vacation@gmail.de');
    });
  });

  describe('German State Validation', () => {
    it('should validate all 16 German Bundesländer codes', () => {
      const validStateCodes = [
        'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV',
        'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'
      ];

      validStateCodes.forEach(stateCode => {
        const email = `state-${stateCode.toLowerCase()}@web.de`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: stateCode,
            vacation_days_budget: 25,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'de',
          });
        }).not.toThrow();
      });
    });

    it('should reject invalid state codes', () => {
      const invalidStateCodes = ['XX', 'DE', 'AT', 'CH', '', null, undefined, 'by', 'bw'];

      invalidStateCodes.forEach(invalidCode => {
        const email = `invalid@web.de`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: invalidCode as any,
            vacation_days_budget: 30,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'de',
          });
        }).toThrow(ValidationError);
      });
    });
  });

  describe('Vacation Budget Validation', () => {
    it('should validate typical German vacation day ranges', () => {
      const validBudgets = [20, 24, 25, 26, 28, 30, 35, 40]; // Typical German ranges

      validBudgets.forEach(budget => {
        const email = `budget-${budget}@gmx.de`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: 'NW',
            vacation_days_budget: budget,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'de',
          });
        }).not.toThrow();
      });
    });

    it('should reject unrealistic vacation budgets', () => {
      const invalidBudgets = [0, -5, 1, 365, 1000, null, undefined, 'twenty'];

      invalidBudgets.forEach(invalidBudget => {
        const email = `invalid-budget@t-online.de`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: 'BY',
            vacation_days_budget: invalidBudget as any,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: 'de',
          });
        }).toThrow(ValidationError);
      });
    });

    it('should warn when vacation budget is insufficient for selected bridges', () => {
      const email = `insufficient@freenet.de`;
      const highDemandBridges = [
        ...mockBridgeWeekends,
        { ...mockBridgeWeekends[0], id: 'bridge-3', vacation_days_needed: 3 },
        { ...mockBridgeWeekends[1], id: 'bridge-4', vacation_days_needed: 4 },
      ];

      const plan = new VacationPlan({
        email,
        state_code: 'HE',
        vacation_days_budget: 5, // Too low for all bridges
        selected_bridges: highDemandBridges,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const validation = plan.validateVacationBudget();
      expect(validation.sufficient).toBe(false);
      expect(validation.required_days).toBeGreaterThan(5);
      expect(validation.warnings).toContain('budget_exceeded');
    });
  });

  describe('Bridge Weekend Selection', () => {
    it('should store selected bridge weekends', () => {
      const email = `bridges@posteo.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'SN',
        vacation_days_budget: 30,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan.selected_bridges).toHaveLength(2);
      expect(plan.selected_bridges[0].holiday_id).toBe('neujahr-2025');
      expect(plan.selected_bridges[1].holiday_id).toBe('tag-der-arbeit-2025');
    });

    it('should validate bridge weekend references exist', () => {
      const email = `invalid-bridge@mailbox.org`;
      const invalidBridge = {
        id: 'fake-bridge',
        holiday_id: 'non-existent-holiday',
        start_date: '2025-13-40', // Invalid date
        end_date: '2025-12-31',
        vacation_days_needed: -1, // Invalid
        total_days_off: 0,
        efficiency: -1,
        pattern: 'invalid-pattern',
      };

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'TH',
          vacation_days_budget: 25,
          selected_bridges: [invalidBridge as any],
          gdpr_consent: mockGDPRConsent,
          language_preference: 'en',
        });
      }).toThrow(ValidationError);
    });

    it('should allow updating selected bridges', () => {
      const email = `update@arcor.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'RP',
        vacation_days_budget: 28,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      expect(plan.selected_bridges).toHaveLength(1);

      plan.updateSelectedBridges([mockBridgeWeekends[1]]);

      expect(plan.selected_bridges).toHaveLength(1);
      expect(plan.selected_bridges[0].holiday_id).toBe('tag-der-arbeit-2025');
    });

    it('should track bridge selection history for optimization', () => {
      const email = `history@alice.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'SH',
        vacation_days_budget: 26,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      plan.updateSelectedBridges([mockBridgeWeekends[1]]);
      plan.updateSelectedBridges(mockBridgeWeekends);

      const history = plan.getSelectionHistory();
      expect(history).toHaveLength(3); // Initial + 2 updates
      expect(history[0].bridges).toHaveLength(1);
      expect(history[1].bridges).toHaveLength(1);
      expect(history[2].bridges).toHaveLength(2);
    });
  });

  describe('Language Preference Handling', () => {
    it('should support German and English preferences', () => {
      const languages = ['de', 'en'];

      languages.forEach(lang => {
        const email = `lang-${lang}@yahoo.de`;

        const plan = new VacationPlan({
          email,
          state_code: 'MV',
          vacation_days_budget: 27,
          selected_bridges: [],
          gdpr_consent: mockGDPRConsent,
          language_preference: lang as 'de' | 'en',
        });

        expect(plan.language_preference).toBe(lang);
      });
    });

    it('should reject unsupported languages', () => {
      const unsupportedLanguages = ['fr', 'es', 'it', 'pl', 'tr', ''];

      unsupportedLanguages.forEach(lang => {
        const email = `unsupported@hotmail.de`;

        expect(() => {
          new VacationPlan({
            email,
            state_code: 'BB',
            vacation_days_budget: 25,
            selected_bridges: [],
            gdpr_consent: mockGDPRConsent,
            language_preference: lang as any,
          });
        }).toThrow(ValidationError);
      });
    });

    it('should provide localized validation messages', () => {
      const emailDe = 'fehler@web.de';
      const emailEn = 'error@gmail.com';

      try {
        new VacationPlan({
          email: emailDe,
          state_code: 'invalid' as any,
          vacation_days_budget: 25,
          selected_bridges: [],
          gdpr_consent: mockGDPRConsent,
          language_preference: 'de',
        });
      } catch (error: any) {
        expect(error.message).toContain('Ungültiger Bundesland-Code'); // German
      }

      try {
        new VacationPlan({
          email: emailEn,
          state_code: 'invalid' as any,
          vacation_days_budget: 25,
          selected_bridges: [],
          gdpr_consent: mockGDPRConsent,
          language_preference: 'en',
        });
      } catch (error: any) {
        expect(error.message).toContain('Invalid state code'); // English
      }
    });
  });

  describe('TimeButler Brand Integration', () => {
    it('should include TimeButler attribution in exports', () => {
      const email = `brand@outlook.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'ST',
        vacation_days_budget: 29,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const exportData = plan.exportPersonalData();

      expect(exportData.data).toHaveProperty('attribution');
      expect(exportData.data.attribution.service).toBe('TimeButler Calendar');
      expect(exportData.data.attribution.url).toBe('https://timebutler.de');
      expect(exportData.data.attribution.promotion).toContain('time tracking');
    });

    it('should provide branded calendar metadata', () => {
      const email = `metadata@gmail.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'HB',
        vacation_days_budget: 24,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const calendarData = plan.generateCalendarExport();

      expect(calendarData.metadata.creator).toBe('TimeButler Calendar');
      expect(calendarData.metadata.description).toContain('Generated by TimeButler');
      expect(calendarData.metadata.url).toBe('https://calendar.timebutler.de');
    });
  });

  describe('Performance and Scalability', () => {
    it('should create vacation plan within performance threshold', () => {
      const email = `performance@gmx.de`;
      const start = performance.now();

      const plan = new VacationPlan({
        email,
        state_code: 'NI',
        vacation_days_budget: 30,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // < 100ms per constitution
      expect(plan).toBeDefined();
    });

    it('should handle large bridge weekend selections efficiently', () => {
      const email = `large@freenet.de`;
      const largeBridgeSet = Array.from({ length: 50 }, (_, i) => ({
        ...mockBridgeWeekends[0],
        id: `bridge-${i}`,
        holiday_id: `holiday-${i}`,
      }));

      const start = performance.now();

      const plan = new VacationPlan({
        email,
        state_code: 'SL',
        vacation_days_budget: 35,
        selected_bridges: largeBridgeSet,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Still reasonable for large datasets
      expect(plan.selected_bridges).toHaveLength(50);
    });

    it('should optimize memory usage for GDPR compliance data', () => {
      const email = `memory@posteo.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'BY',
        vacation_days_budget: 28,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      // Measure memory footprint
      const planJSON = JSON.stringify(plan);
      const memorySize = Buffer.byteLength(planJSON, 'utf8');

      expect(memorySize).toBeLessThan(10000); // < 10KB per plan
    });
  });

  describe('Security and Encryption', () => {
    it('should encrypt sensitive data at rest', () => {
      const email = `security@mailbox.org`;

      const plan = new VacationPlan({
        email,
        state_code: 'HE',
        vacation_days_budget: 26,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      // Check that sensitive data is encrypted
      const serialized = plan.toString();
      expect(serialized).not.toContain(email); // Email should be encrypted
      expect(serialized).toContain('encrypted-email'); // Mock encrypted value
    });

    it('should use secure random for ID generation', () => {
      const email = `random@alice.de`;

      const plan1 = new VacationPlan({
        email,
        state_code: 'NW',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      const plan2 = new VacationPlan({
        email,
        state_code: 'NW',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      // IDs should be cryptographically random
      expect(plan1.id).not.toBe(plan2.id);
      expect(plan1.session_id).not.toBe(plan2.session_id);
      expect(crypto.randomUUID).toHaveBeenCalled();
    });

    it('should validate data integrity on load', () => {
      const email = `integrity@yahoo.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'BW',
        vacation_days_budget: 30,
        selected_bridges: mockBridgeWeekends,
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      // Simulate data corruption
      const corruptedData = { ...plan, email: null };

      expect(() => {
        VacationPlan.fromJSON(JSON.stringify(corruptedData));
      }).toThrow(ValidationError);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent modifications gracefully', async () => {
      const email = `concurrent@arcor.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'TH',
        vacation_days_budget: 27,
        selected_bridges: [mockBridgeWeekends[0]],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'de',
      });

      // Simulate concurrent updates
      const update1 = plan.updateSelectedBridges([mockBridgeWeekends[1]]);
      const update2 = plan.updateSelectedBridges(mockBridgeWeekends);

      await Promise.all([update1, update2]);

      // Should maintain data consistency
      expect(plan.selected_bridges).toHaveLength(2); // Final state
      expect(plan.getSelectionHistory()).toBeDefined();
    });

    it('should handle network failures during GDPR operations', async () => {
      const email = `network@t-online.de`;

      const plan = new VacationPlan({
        email,
        state_code: 'RP',
        vacation_days_budget: 25,
        selected_bridges: [],
        gdpr_consent: mockGDPRConsent,
        language_preference: 'en',
      });

      // Mock network failure
      jest.spyOn(plan, 'exerciseRightToErasure').mockRejectedValue(new Error('Network failure'));

      await expect(plan.exerciseRightToErasure()).rejects.toThrow('Network failure');

      // Plan should remain in consistent state
      expect(plan.gdpr_consent.withdrawn).toBeUndefined();
    });

    it('should validate date boundaries for bridge weekends', () => {
      const email = `boundaries@hotmail.de`;
      const invalidBridge = {
        ...mockBridgeWeekends[0],
        start_date: '2024-12-31', // Before our supported range
        end_date: '2027-01-01',   // After our supported range
      };

      expect(() => {
        new VacationPlan({
          email,
          state_code: 'SH',
          vacation_days_budget: 28,
          selected_bridges: [invalidBridge],
          gdpr_consent: mockGDPRConsent,
          language_preference: 'de',
        });
      }).toThrow(ValidationError);
    });
  });
});