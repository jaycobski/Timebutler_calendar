"use strict";
/**
 * Custom Error Classes for Timebutler Calendar GDPR Compliance
 *
 * Implements comprehensive error handling for GDPR requirements including:
 * - GDPR violation detection and reporting
 * - Data retention policy enforcement
 * - Validation error handling with bilingual support
 * - Security compliance monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacationBudgetError = exports.StateValidationError = exports.EmailValidationError = exports.ConsentManagementError = exports.SecurityComplianceError = exports.DataRetentionError = exports.GDPRViolationError = exports.ValidationError = void 0;
/**
 * Base validation error class for German market requirements
 */
class ValidationError extends Error {
    constructor(message, code = 'VALIDATION_ERROR', field, language = 'de') {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
        this.field = field;
        this.language = language;
    }
    /**
     * Get localized error message
     */
    getLocalizedMessage() {
        if (this.language === 'en') {
            return this.message;
        }
        // German translations for common validation errors
        const translations = {
            'Invalid state code': 'Ungültiger Bundesland-Code',
            'Invalid email format': 'Ungültiges E-Mail-Format',
            'Invalid vacation budget': 'Ungültiges Urlaubsbudget',
            'Invalid language preference': 'Ungültige Spracheinstellung',
            'Invalid bridge weekend data': 'Ungültige Brückenwochenenddaten',
            'Missing required fields': 'Erforderliche Felder fehlen',
            'Date range invalid': 'Datumsbereich ungültig'
        };
        return translations[this.message] || this.message;
    }
}
exports.ValidationError = ValidationError;
/**
 * GDPR violation error for data protection compliance
 */
class GDPRViolationError extends Error {
    constructor(message, violationType, code = 'GDPR_VIOLATION', article, severity = 'high') {
        super(message);
        this.name = 'GDPRViolationError';
        this.code = code;
        this.violationType = violationType;
        this.article = article;
        this.severity = severity;
    }
    /**
     * Get GDPR article reference if available
     */
    getArticleReference() {
        const articleMap = {
            'consent': 'Article 6 (Lawfulness of processing)',
            'retention': 'Article 5(e) (Storage limitation)',
            'rights': 'Articles 15-22 (Rights of the data subject)',
            'processing': 'Article 5 (Principles of processing)',
            'transfer': 'Chapter V (Transfers of personal data)'
        };
        return this.article || articleMap[this.violationType] || 'GDPR compliance violation';
    }
    /**
     * Check if violation requires immediate action
     */
    requiresImmediateAction() {
        return this.severity === 'critical' || this.severity === 'high';
    }
}
exports.GDPRViolationError = GDPRViolationError;
/**
 * Data retention policy violation error
 */
class DataRetentionError extends Error {
    constructor(message, retentionPeriod, expirationDate, dataType = 'personal_data') {
        super(message);
        this.name = 'DataRetentionError';
        this.retentionPeriod = retentionPeriod;
        this.expirationDate = expirationDate;
        this.dataType = dataType;
    }
    /**
     * Check if data has exceeded retention period
     */
    isExpired() {
        return new Date() > this.expirationDate;
    }
    /**
     * Get days until expiration (negative if expired)
     */
    getDaysUntilExpiration() {
        const now = new Date();
        const diffTime = this.expirationDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
exports.DataRetentionError = DataRetentionError;
/**
 * Security compliance error for encryption and data protection
 */
class SecurityComplianceError extends Error {
    constructor(message, securityLevel, code = 'SECURITY_ERROR') {
        super(message);
        this.name = 'SecurityComplianceError';
        this.securityLevel = securityLevel;
        this.code = code;
    }
}
exports.SecurityComplianceError = SecurityComplianceError;
/**
 * Consent management error for tracking and withdrawal
 */
class ConsentManagementError extends Error {
    constructor(message, consentType, purposes = []) {
        super(message);
        this.name = 'ConsentManagementError';
        this.consentType = consentType;
        this.purposes = purposes;
    }
    /**
     * Check if specific purpose consent is missing
     */
    isPurposeMissing(purpose) {
        return this.consentType === 'missing' && this.purposes.includes(purpose);
    }
}
exports.ConsentManagementError = ConsentManagementError;
/**
 * Email validation error for German market domains
 */
class EmailValidationError extends ValidationError {
    constructor(message, domain, validationRule, language = 'de') {
        super(message, 'EMAIL_VALIDATION_ERROR', 'email', language);
        this.domain = domain;
        this.validationRule = validationRule;
    }
    /**
     * Get domain-specific error message
     */
    getDomainMessage() {
        const messages = {
            de: {
                format: `E-Mail-Format ungültig: ${this.domain}`,
                domain: `Domain nicht unterstützt: ${this.domain}`,
                security: `Sicherheitsvalidierung fehlgeschlagen für: ${this.domain}`
            },
            en: {
                format: `Invalid email format: ${this.domain}`,
                domain: `Domain not supported: ${this.domain}`,
                security: `Security validation failed for: ${this.domain}`
            }
        };
        return messages[this.language][this.validationRule];
    }
}
exports.EmailValidationError = EmailValidationError;
/**
 * State code validation error for German Bundesländer
 */
class StateValidationError extends ValidationError {
    constructor(providedCode, validCodes = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'], language = 'de') {
        const message = language === 'de'
            ? `Ungültiger Bundesland-Code: ${providedCode}`
            : `Invalid state code: ${providedCode}`;
        super(message, 'STATE_VALIDATION_ERROR', 'state_code', language);
        this.providedCode = providedCode;
        this.validCodes = validCodes;
    }
    /**
     * Get suggestions for similar state codes
     */
    getSuggestions() {
        const lower = this.providedCode?.toLowerCase() || '';
        return this.validCodes.filter(code => code.toLowerCase().includes(lower) ||
            lower.includes(code.toLowerCase()));
    }
}
exports.StateValidationError = StateValidationError;
/**
 * Vacation budget validation error for German employment standards
 */
class VacationBudgetError extends ValidationError {
    constructor(providedBudget, minBudget = 20, maxBudget = 50, language = 'de') {
        const message = language === 'de'
            ? `Ungültiges Urlaubsbudget: ${providedBudget} Tage`
            : `Invalid vacation budget: ${providedBudget} days`;
        super(message, 'VACATION_BUDGET_ERROR', 'vacation_days_budget', language);
        this.providedBudget = providedBudget;
        this.minBudget = minBudget;
        this.maxBudget = maxBudget;
        this.recommendedRange = { min: 25, max: 30 }; // Typical German vacation days
    }
    /**
     * Check if budget is within reasonable German employment range
     */
    isWithinGermanStandards() {
        return this.providedBudget >= this.recommendedRange.min &&
            this.providedBudget <= this.recommendedRange.max;
    }
}
exports.VacationBudgetError = VacationBudgetError;
