/**
 * Custom Error Classes for Timebutler Calendar GDPR Compliance
 *
 * Implements comprehensive error handling for GDPR requirements including:
 * - GDPR violation detection and reporting
 * - Data retention policy enforcement
 * - Validation error handling with bilingual support
 * - Security compliance monitoring
 */

/**
 * Base validation error class for German market requirements
 */
export class ValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly language: 'de' | 'en';

  constructor(message: string, code: string = 'VALIDATION_ERROR', field?: string, language: 'de' | 'en' = 'de') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.language = language;
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(): string {
    if (this.language === 'en') {
      return this.message;
    }

    // German translations for common validation errors
    const translations: Record<string, string> = {
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

/**
 * GDPR violation error for data protection compliance
 */
export class GDPRViolationError extends Error {
  public readonly code: string;
  public readonly violationType: 'consent' | 'retention' | 'processing' | 'transfer' | 'rights';
  public readonly article?: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    violationType: 'consent' | 'retention' | 'processing' | 'transfer' | 'rights',
    code: string = 'GDPR_VIOLATION',
    article?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ) {
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
  getArticleReference(): string {
    const articleMap: Record<string, string> = {
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
  requiresImmediateAction(): boolean {
    return this.severity === 'critical' || this.severity === 'high';
  }
}

/**
 * Data retention policy violation error
 */
export class DataRetentionError extends Error {
  public readonly retentionPeriod: number;
  public readonly expirationDate: Date;
  public readonly dataType: string;

  constructor(
    message: string,
    retentionPeriod: number,
    expirationDate: Date,
    dataType: string = 'personal_data'
  ) {
    super(message);
    this.name = 'DataRetentionError';
    this.retentionPeriod = retentionPeriod;
    this.expirationDate = expirationDate;
    this.dataType = dataType;
  }

  /**
   * Check if data has exceeded retention period
   */
  isExpired(): boolean {
    return new Date() > this.expirationDate;
  }

  /**
   * Get days until expiration (negative if expired)
   */
  getDaysUntilExpiration(): number {
    const now = new Date();
    const diffTime = this.expirationDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Security compliance error for encryption and data protection
 */
export class SecurityComplianceError extends Error {
  public readonly securityLevel: 'encryption' | 'access' | 'audit' | 'integrity';
  public readonly code: string;

  constructor(message: string, securityLevel: 'encryption' | 'access' | 'audit' | 'integrity', code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityComplianceError';
    this.securityLevel = securityLevel;
    this.code = code;
  }
}

/**
 * Consent management error for tracking and withdrawal
 */
export class ConsentManagementError extends Error {
  public readonly consentType: 'missing' | 'withdrawn' | 'expired' | 'invalid';
  public readonly purposes: string[];

  constructor(message: string, consentType: 'missing' | 'withdrawn' | 'expired' | 'invalid', purposes: string[] = []) {
    super(message);
    this.name = 'ConsentManagementError';
    this.consentType = consentType;
    this.purposes = purposes;
  }

  /**
   * Check if specific purpose consent is missing
   */
  isPurposeMissing(purpose: string): boolean {
    return this.consentType === 'missing' && this.purposes.includes(purpose);
  }
}

/**
 * Email validation error for German market domains
 */
export class EmailValidationError extends ValidationError {
  public readonly domain: string;
  public readonly validationRule: 'format' | 'domain' | 'security';

  constructor(
    message: string,
    domain: string,
    validationRule: 'format' | 'domain' | 'security',
    language: 'de' | 'en' = 'de'
  ) {
    super(message, 'EMAIL_VALIDATION_ERROR', 'email', language);
    this.domain = domain;
    this.validationRule = validationRule;
  }

  /**
   * Get domain-specific error message
   */
  getDomainMessage(): string {
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

/**
 * State code validation error for German Bundesländer
 */
export class StateValidationError extends ValidationError {
  public readonly providedCode: string;
  public readonly validCodes: string[];

  constructor(
    providedCode: string,
    validCodes: string[] = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    language: 'de' | 'en' = 'de'
  ) {
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
  getSuggestions(): string[] {
    const lower = this.providedCode?.toLowerCase() || '';
    return this.validCodes.filter(code =>
      code.toLowerCase().includes(lower) ||
      lower.includes(code.toLowerCase())
    );
  }
}

/**
 * Vacation budget validation error for German employment standards
 */
export class VacationBudgetError extends ValidationError {
  public readonly providedBudget: number;
  public readonly minBudget: number;
  public readonly maxBudget: number;
  public readonly recommendedRange: { min: number; max: number };

  constructor(
    providedBudget: number,
    minBudget: number = 20,
    maxBudget: number = 50,
    language: 'de' | 'en' = 'de'
  ) {
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
  isWithinGermanStandards(): boolean {
    return this.providedBudget >= this.recommendedRange.min &&
           this.providedBudget <= this.recommendedRange.max;
  }
}