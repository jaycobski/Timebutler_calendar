"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDPRConsentRecord = exports.OPTIONAL_CONSENT_PURPOSES = exports.REQUIRED_CONSENT_PURPOSES = exports.CURRENT_CONSENT_VERSION = void 0;
/**
 * Current consent version and required purposes
 */
exports.CURRENT_CONSENT_VERSION = '1.1.0';
exports.REQUIRED_CONSENT_PURPOSES = [
    'vacation_planning',
    'email_delivery'
];
exports.OPTIONAL_CONSENT_PURPOSES = [
    'analytics_anonymous',
    'service_improvement',
    'marketing_timebutler'
];
/**
 * GDPR Consent Record Utilities
 */
class GDPRConsentRecord {
    /**
     * Validate consent record completeness and compliance
     */
    static validateConsent(consent) {
        const issues = [];
        const missing_purposes = [];
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
        const current_version = consent.consent_version === exports.CURRENT_CONSENT_VERSION;
        if (!current_version) {
            issues.push(`Outdated consent version: ${consent.consent_version}`);
        }
        // Check required purposes
        const purposes = consent.purposes || [];
        exports.REQUIRED_CONSENT_PURPOSES.forEach(required => {
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
    static createConsentRecord(purposes, ipHash, userAgentHash, source, legalBasis = 'consent') {
        const timestamp = new Date();
        const auditEntry = {
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
            consent_version: exports.CURRENT_CONSENT_VERSION,
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
    static withdrawConsent(consent, reason, ipHash) {
        const withdrawalTimestamp = new Date();
        const auditEntry = {
            timestamp: withdrawalTimestamp,
            action: 'withdrawn',
            purposes_before: consent.purposes,
            purposes_after: [],
            source: 'withdrawal_request',
            ip_hash: ipHash
        };
        return {
            ...consent,
            withdrawn: true,
            withdrawal_timestamp: withdrawalTimestamp,
            withdrawal_reason: reason,
            audit_trail: [
                ...(consent.audit_trail || []),
                auditEntry
            ]
        };
    }
    /**
     * Check if consent allows specific purpose
     */
    static allowsPurpose(consent, purpose) {
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
    static getConsentSummary(consent) {
        const validation = this.validateConsent(consent);
        let status;
        if (validation.withdrawn) {
            status = 'withdrawn';
        }
        else if (validation.expired) {
            status = 'expired';
        }
        else if (!validation.valid) {
            status = 'invalid';
        }
        else {
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
    static generateWithdrawalLink(sessionId, baseUrl = 'https://calendar.timebutler.de') {
        // In production, this would include proper token generation and security
        return `${baseUrl}/gdpr/withdraw?session=${encodeURIComponent(sessionId)}`;
    }
    /**
     * Hash sensitive data for storage (IP, user agent)
     */
    static hashSensitiveData(data) {
        // In production, use proper cryptographic hashing with salt
        // This is a simplified version for testing
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
exports.GDPRConsentRecord = GDPRConsentRecord;
