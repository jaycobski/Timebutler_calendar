/**
 * GDPR Consent Record Model for Timebutler Calendar
 *
 * Implements Article 7 GDPR requirements for consent management including:
 * - Explicit consent tracking with versioning
 * - Withdrawal mechanism implementation
 * - Legal basis documentation per Article 6
 * - Data processing purpose limitations per Article 5
 * - Consent validity verification and audit trail
 */

export interface GDPRConsentRecord {
  /** Timestamp when consent was given */
  timestamp: Date;

  /** Hashed IP address for fraud protection (not personal data under GDPR) */
  ip_hash: string;

  /** Hashed user agent for technical security (not personal data) */
  user_agent_hash: string;

  /** Version of consent terms accepted */
  consent_version: string;

  /** Specific purposes for which consent was given */
  purposes: ConsentPurpose[];

  /** Legal basis for processing under Article 6 GDPR */
  legal_basis: LegalBasis;

  /** Source of consent (form identifier, page, etc.) */
  source: string;

  /** Method available for consent withdrawal */
  withdrawal_method: WithdrawalMethod;

  /** Whether consent has been withdrawn */
  withdrawn?: boolean;

  /** Timestamp when consent was withdrawn */
  withdrawal_timestamp?: Date;

  /** Reason for withdrawal (optional) */
  withdrawal_reason?: string;

  /** Audit trail for consent modifications */
  audit_trail?: ConsentAuditEntry[];
}

/**
 * Specific purposes for data processing under GDPR
 * Each purpose must have explicit consent
 */
export type ConsentPurpose =
  | 'vacation_planning'      // Core service: vacation plan generation
  | 'email_delivery'         // Calendar delivery via email
  | 'analytics_anonymous'    // Anonymous usage statistics
  | 'service_improvement'    // Product optimization (optional)
  | 'marketing_timebutler';  // TimeButler promotional content (optional)

/**
 * Legal basis for processing under Article 6 GDPR
 */
export type LegalBasis =
  | 'consent'              // Article 6(1)(a) - Consent of data subject
  | 'contract'             // Article 6(1)(b) - Performance of contract
  | 'legal_obligation'     // Article 6(1)(c) - Legal obligation
  | 'legitimate_interest'; // Article 6(1)(f) - Legitimate interest

/**
 * Methods available for consent withdrawal
 */
export type WithdrawalMethod =
  | 'email_link'           // Link in confirmation email
  | 'website_form'         // Withdrawal form on website
  | 'data_protection_email'; // Contact data protection officer

/**
 * Audit trail entry for consent modifications
 */
export interface ConsentAuditEntry {
  timestamp: Date;
  action: 'given' | 'withdrawn' | 'modified' | 'verified';
  purposes_before?: ConsentPurpose[];
  purposes_after?: ConsentPurpose[];
  source: string;
  ip_hash?: string;
}

/**
 * GDPR consent validation result
 */
export interface ConsentValidationResult {
  valid: boolean;
  issues: string[];
  missing_purposes: ConsentPurpose[];
  expired: boolean;
  withdrawn: boolean;
  current_version: boolean;
}

/**
 * Current consent version and required purposes
 */
export const CURRENT_CONSENT_VERSION = '1.1.0';

export const REQUIRED_CONSENT_PURPOSES: ConsentPurpose[] = [
  'vacation_planning',
  'email_delivery'
];

export const OPTIONAL_CONSENT_PURPOSES: ConsentPurpose[] = [
  'analytics_anonymous',
  'service_improvement',
  'marketing_timebutler'
];

/**
 * GDPR Consent Record Utilities
 */
export class GDPRConsentRecord {
  /**
   * Validate consent record completeness and compliance
   */
  static validateConsent(consent: Partial<GDPRConsentRecord>): ConsentValidationResult {
    const issues: string[] = [];
    const missing_purposes: ConsentPurpose[] = [];

    // Check required fields
    if (!consent.timestamp) {
      issues.push('Missing consent timestamp');
    }

    if (!consent.ip_hash) {
      issues.push('Missing IP hash for fraud protection');
    }

    if (!consent.user_agent_hash) {
      issues.push('Missing user agent hash');
    }

    if (!consent.consent_version) {
      issues.push('Missing consent version');
    }

    if (!consent.purposes || consent.purposes.length === 0) {
      issues.push('Missing consent purposes');
    }

    if (!consent.legal_basis) {
      issues.push('Missing legal basis');
    }

    if (!consent.source) {
      issues.push('Missing consent source');
    }

    if (!consent.withdrawal_method) {
      issues.push('Missing withdrawal method');
    }

    // Check consent version currency
    const current_version = consent.consent_version === CURRENT_CONSENT_VERSION;
    if (!current_version) {
      issues.push(`Outdated consent version: ${consent.consent_version}`);
    }

    // Check required purposes
    const purposes = consent.purposes || [];
    REQUIRED_CONSENT_PURPOSES.forEach(required => {
      if (!purposes.includes(required)) {
        missing_purposes.push(required);
        issues.push(`Missing required consent purpose: ${required}`);
      }
    });

    // Check if consent is withdrawn
    const withdrawn = !!consent.withdrawn;
    if (withdrawn) {
      issues.push('Consent has been withdrawn');
    }

    // Check expiration (consent expires after 2 years per best practices)
    const expired = consent.timestamp ?
      (new Date().getTime() - consent.timestamp.getTime()) > (2 * 365 * 24 * 60 * 60 * 1000) :
      true;

    if (expired) {
      issues.push('Consent has expired (>2 years old)');
    }

    return {
      valid: issues.length === 0,
      issues,
      missing_purposes,
      expired,
      withdrawn,
      current_version
    };
  }

  /**
   * Create new consent record with audit trail
   */
  static createConsentRecord(
    purposes: ConsentPurpose[],
    ipHash: string,
    userAgentHash: string,
    source: string,
    legalBasis: LegalBasis = 'consent'
  ): GDPRConsentRecord {
    const timestamp = new Date();

    const auditEntry: ConsentAuditEntry = {
      timestamp,
      action: 'given',
      purposes_after: purposes,
      source,
      ip_hash: ipHash
    };

    return {
      timestamp,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      consent_version: CURRENT_CONSENT_VERSION,
      purposes,
      legal_basis: legalBasis,
      source,
      withdrawal_method: 'email_link',
      withdrawn: false,
      audit_trail: [auditEntry]
    };
  }

  /**
   * Withdraw consent with audit trail
   */
  static withdrawConsent(
    consent: GDPRConsentRecord,
    reason?: string,
    ipHash?: string
  ): GDPRConsentRecord {
    const withdrawalTimestamp = new Date();

    const auditEntry: ConsentAuditEntry = {
      timestamp: withdrawalTimestamp,
      action: 'withdrawn',
      purposes_before: consent.purposes,
      purposes_after: [],
      source: 'withdrawal_request',
      ...(ipHash && { ip_hash: ipHash })
    };

    return {
      ...consent,
      withdrawn: true,
      withdrawal_timestamp: withdrawalTimestamp,
      ...(reason && { withdrawal_reason: reason }),
      audit_trail: [
        ...(consent.audit_trail || []),
        auditEntry
      ]
    };
  }

  /**
   * Check if consent allows specific purpose
   */
  static allowsPurpose(consent: GDPRConsentRecord, purpose: ConsentPurpose): boolean {
    if (consent.withdrawn) {
      return false;
    }

    const validation = this.validateConsent(consent);
    if (!validation.valid) {
      return false;
    }

    return consent.purposes.includes(purpose);
  }

  /**
   * Get consent summary for data subject access request (Article 15)
   */
  static getConsentSummary(consent: GDPRConsentRecord): {
    status: 'active' | 'withdrawn' | 'expired' | 'invalid';
    purposes: ConsentPurpose[];
    given_date: string;
    version: string;
    withdrawal_available: boolean;
    audit_entries: number;
  } {
    const validation = this.validateConsent(consent);

    let status: 'active' | 'withdrawn' | 'expired' | 'invalid';
    if (validation.withdrawn) {
      status = 'withdrawn';
    } else if (validation.expired) {
      status = 'expired';
    } else if (!validation.valid) {
      status = 'invalid';
    } else {
      status = 'active';
    }

    return {
      status,
      purposes: consent.purposes || [],
      given_date: consent.timestamp?.toISOString() || '',
      version: consent.consent_version || '',
      withdrawal_available: status === 'active',
      audit_entries: consent.audit_trail?.length || 0
    };
  }

  /**
   * Generate withdrawal link for email
   */
  static generateWithdrawalLink(sessionId: string, baseUrl: string = 'https://calendar.timebutler.de'): string {
    // In production, this would include proper token generation and security
    return `${baseUrl}/gdpr/withdraw?session=${encodeURIComponent(sessionId)}`;
  }

  /**
   * Hash sensitive data for storage (IP, user agent)
   */
  static hashSensitiveData(data: string): string {
    // In production, use proper cryptographic hashing with salt
    // This is a simplified version for testing
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}