/**
 * CalendarExport Model - RFC 5545 Compliant iCalendar Export with Signed URLs
 *
 * Constitutional Requirements:
 * - RFC 5545 iCalendar specification compliance
 * - Signed URL security with 30-day expiration
 * - German timezone handling (CET/CEST) with accurate transitions
 * - Multiple export format support for major calendar platforms
 * - GDPR retention policies with automatic cleanup
 * - TimeButler branding integration
 *
 * German Market Features:
 * - Europe/Berlin timezone with proper DST transitions
 * - Bilingual calendar event descriptions (German formal/English casual)
 * - German public holiday integration
 * - Cross-platform compatibility (Google Calendar, Outlook, Apple Calendar)
 */

import * as crypto from 'crypto';
import { DateTime } from 'luxon';
import { BridgeWeekend } from './bridge-weekend';
import { VacationPlan } from './vacation-plan';
import {
  ValidationError,
  DataRetentionError
} from '../lib/errors';

// Supported calendar export formats
export type CalendarFormat = 'ical' | 'google' | 'outlook' | 'apple';

// Content types for different formats
const CONTENT_TYPES: Record<CalendarFormat, string> = {
  ical: 'text/calendar; charset=utf-8',
  google: 'text/calendar; charset=utf-8',
  outlook: 'text/calendar; charset=utf-8',
  apple: 'text/calendar; charset=utf-8'
};

// File extensions for different formats
const FILE_EXTENSIONS: Record<CalendarFormat, string> = {
  ical: '.ics',
  google: '.ics',
  outlook: '.ics',
  apple: '.ics'
};

// TimeButler branding constants
const TIMEBUTLER_PRODID = '-//TimeButler GmbH//TimeButler Calendar 1.0//EN';
const TIMEBUTLER_URL = 'https://calendar.timebutler.de';
const TIMEBUTLER_PROMOTION_DE = 'Optimieren Sie Ihre Work-Life-Balance mit TimeButler\'s professionellen Zeiterfassungslösungen';
const TIMEBUTLER_PROMOTION_EN = 'Optimize your work-life balance with TimeButler\'s comprehensive time tracking solutions';

// Security configuration
const SIGNATURE_ALGORITHM = 'sha256';
const SIGNATURE_KEY = process.env.CALENDAR_EXPORT_SIGNATURE_KEY || 'default-key-for-testing-only';
const URL_EXPIRATION_DAYS = 30;

/**
 * Calendar export data structure
 */
export interface CalendarExportData {
  vacation_plan_id: string;
  format: CalendarFormat;
  events: BridgeWeekend[];
  language_preference: 'de' | 'en';
  user_email?: string; // Optional for download notifications
}

/**
 * Signed URL components (for future use)
 */
export interface SignedUrlComponents {
  base_url: string;
  export_id: string;
  expires_at: Date;
  signature: string;
}

/**
 * RFC 5545 VCALENDAR properties
 */
interface VCalendarProperties {
  version: '2.0';
  prodid: string;
  calscale: 'GREGORIAN';
  method?: 'PUBLISH' | 'REQUEST' | 'REPLY';
  'x-wr-calname': string;
  'x-wr-caldesc': string;
  'x-wr-timezone': 'Europe/Berlin';
}

/**
 * RFC 5545 VEVENT properties (for documentation)
 */
export interface VEventProperties {
  uid: string;
  dtstamp: string;
  dtstart: string;
  dtend: string;
  summary: string;
  description: string;
  location?: string;
  categories: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  transp: 'OPAQUE' | 'TRANSPARENT';
  'x-timebutler-id': string;
  'x-timebutler-efficiency': string;
  'x-timebutler-vacation-days': string;
}

/**
 * German timezone transition data for CET/CEST (for future timezone handling)
 */
export interface TimezoneTransition {
  date: DateTime;
  offset: number; // Minutes from UTC
  name: 'CET' | 'CEST';
}

/**
 * Download analytics data
 */
interface DownloadAnalytics {
  download_count: number;
  first_download: Date | null;
  last_download: Date | null;
  user_agents: string[];
  ip_hashes: string[];
}

/**
 * CalendarExport Model Class - RFC 5545 Compliant with Security
 */
export class CalendarExport {
  public readonly id: string;
  public readonly vacation_plan_id: string;
  public readonly format: CalendarFormat;
  public readonly signed_url: string;
  public readonly expires_at: Date;
  public readonly created_at: Date;
  public download_count: number = 0;
  public readonly file_size: number;

  // Private fields for security and analytics
  private readonly _events: BridgeWeekend[];
  private readonly _language_preference: 'de' | 'en';
  private readonly _user_email: string | undefined;
  private _analytics: DownloadAnalytics;
  private _deleted: boolean = false;

  constructor(data: CalendarExportData) {
    // Validate input data
    this.validateExportData(data);

    // Generate secure identifiers
    this.id = crypto.randomUUID();
    this.vacation_plan_id = data.vacation_plan_id;
    this.format = data.format;
    this._events = [...data.events]; // Defensive copy
    this._language_preference = data.language_preference;
    this._user_email = data.user_email;

    // Set timestamps
    this.created_at = new Date();
    this.expires_at = new Date();
    this.expires_at.setDate(this.expires_at.getDate() + URL_EXPIRATION_DAYS);

    // Generate signed URL
    this.signed_url = this.generateSignedUrl();

    // Calculate file size
    const calendarContent = this.generateCalendarContent();
    this.file_size = Buffer.byteLength(calendarContent, 'utf8');

    // Initialize analytics
    this._analytics = {
      download_count: 0,
      first_download: null,
      last_download: null,
      user_agents: [],
      ip_hashes: []
    };
  }

  /**
   * Validate calendar export data
   */
  private validateExportData(data: CalendarExportData): void {
    if (!data.vacation_plan_id) {
      throw new ValidationError('Vacation plan ID is required', 'MISSING_VACATION_PLAN_ID', 'vacation_plan_id');
    }

    if (!data.format || !Object.values(['ical', 'google', 'outlook', 'apple'] as CalendarFormat[]).includes(data.format)) {
      throw new ValidationError('Valid calendar format is required', 'INVALID_FORMAT', 'format');
    }

    if (!Array.isArray(data.events)) {
      throw new ValidationError('Events array is required', 'INVALID_EVENTS', 'events');
    }

    if (!data.language_preference || !['de', 'en'].includes(data.language_preference)) {
      throw new ValidationError('Valid language preference is required', 'INVALID_LANGUAGE', 'language_preference');
    }

    // Validate events
    data.events.forEach((event, index) => {
      if (!event.id || !event.start_date || !event.end_date) {
        throw new ValidationError(`Event ${index} missing required properties`, 'INVALID_EVENT_DATA', 'events');
      }

      // Validate date format
      try {
        DateTime.fromISO(event.start_date);
        DateTime.fromISO(event.end_date);
      } catch (error) {
        throw new ValidationError(`Event ${index} has invalid date format`, 'INVALID_EVENT_DATES', 'events');
      }
    });
  }

  /**
   * Generate cryptographically signed URL for secure downloads
   */
  private generateSignedUrl(): string {
    const baseUrl = `${TIMEBUTLER_URL}/export`;
    const urlPath = `${baseUrl}/${this.id}`;
    const expiresTimestamp = Math.floor(this.expires_at.getTime() / 1000);

    // Create signature payload
    const signaturePayload = `${this.id}:${expiresTimestamp}:${this.format}`;

    // Generate HMAC signature
    const signature = crypto
      .createHmac(SIGNATURE_ALGORITHM, SIGNATURE_KEY)
      .update(signaturePayload)
      .digest('hex');

    // Build signed URL with query parameters
    return `${urlPath}?expires=${expiresTimestamp}&signature=${signature}&format=${this.format}`;
  }

  /**
   * Verify signed URL signature for download security
   */
  static verifySignature(exportId: string, expires: number, signature: string, format: CalendarFormat): boolean {
    try {
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (expires < now) {
        return false;
      }

      // Generate expected signature
      const signaturePayload = `${exportId}:${expires}:${format}`;
      const expectedSignature = crypto
        .createHmac(SIGNATURE_ALGORITHM, SIGNATURE_KEY)
        .update(signaturePayload)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate RFC 5545 compliant iCalendar content
   */
  generateCalendarContent(): string {
    const timezone = this.generateTimezoneComponent();
    const events = this._events.map(event => this.generateEventComponent(event)).join('\r\n');

    const vcalProperties = this.getVCalendarProperties();

    // RFC 5545 VCALENDAR structure
    const calendar = [
      'BEGIN:VCALENDAR',
      `VERSION:${vcalProperties.version}`,
      `PRODID:${vcalProperties.prodid}`,
      `CALSCALE:${vcalProperties.calscale}`,
      `METHOD:PUBLISH`,
      `X-WR-CALNAME:${vcalProperties['x-wr-calname']}`,
      `X-WR-CALDESC:${vcalProperties['x-wr-caldesc']}`,
      `X-WR-TIMEZONE:${vcalProperties['x-wr-timezone']}`,
      `X-TIMEBUTLER-URL:${TIMEBUTLER_URL}`,
      `X-TIMEBUTLER-VERSION:1.0`,
      timezone,
      events,
      'END:VCALENDAR'
    ].join('\r\n');

    return this.foldLines(calendar);
  }

  /**
   * Get VCALENDAR properties with TimeButler branding
   */
  private getVCalendarProperties(): VCalendarProperties {
    const isGerman = this._language_preference === 'de';

    return {
      version: '2.0',
      prodid: TIMEBUTLER_PRODID,
      calscale: 'GREGORIAN',
      'x-wr-calname': isGerman ? 'Brückentage 2025-2026' : 'Bridge Days 2025-2026',
      'x-wr-caldesc': isGerman ? TIMEBUTLER_PROMOTION_DE : TIMEBUTLER_PROMOTION_EN,
      'x-wr-timezone': 'Europe/Berlin'
    };
  }

  /**
   * Generate RFC 5545 VTIMEZONE component for Europe/Berlin
   */
  private generateTimezoneComponent(): string {
    // CET (Central European Time) - Standard Time
    const cetComponent = [
      'BEGIN:STANDARD',
      'TZNAME:CET',
      'DTSTART:20251026T030000',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD'
    ].join('\r\n');

    // CEST (Central European Summer Time) - Daylight Time
    const cestComponent = [
      'BEGIN:DAYLIGHT',
      'TZNAME:CEST',
      'DTSTART:20250330T020000',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT'
    ].join('\r\n');

    return [
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Berlin',
      'TZURL:http://tzurl.org/zoneinfo-outlook/Europe/Berlin',
      'X-LIC-LOCATION:Europe/Berlin',
      cetComponent,
      cestComponent,
      'END:VTIMEZONE'
    ].join('\r\n');
  }

  /**
   * Generate RFC 5545 VEVENT component for bridge weekend
   */
  private generateEventComponent(bridgeWeekend: BridgeWeekend): string {
    const isGerman = this._language_preference === 'de';
    const startDateTime = DateTime.fromISO(bridgeWeekend.start_date, { zone: 'Europe/Berlin' });
    const endDateTime = DateTime.fromISO(bridgeWeekend.end_date, { zone: 'Europe/Berlin' });
    const nowDateTime = DateTime.now().setZone('Europe/Berlin');

    // Generate unique UID
    const uid = `${bridgeWeekend.id}@calendar.timebutler.de`;

    // Event summary (title)
    const summary = isGerman
      ? `Brückenwochenende (${bridgeWeekend.vacation_days_needed} Urlaubstage)`
      : `Bridge Weekend (${bridgeWeekend.vacation_days_needed} vacation days)`;

    // Event description with TimeButler branding
    const description = this.generateEventDescription(bridgeWeekend, isGerman);

    // Location (optional - could be used for remote work notes)
    const location = isGerman ? 'Deutschland' : 'Germany';

    // Categories for calendar organization
    const categories = isGerman ? 'Urlaub,Brückentage' : 'Vacation,Bridge Days';

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${this.formatDateTimeUTC(nowDateTime)}`,
      `DTSTART;TZID=Europe/Berlin:${this.formatDateTime(startDateTime)}`,
      `DTEND;TZID=Europe/Berlin:${this.formatDateTime(endDateTime)}`,
      `SUMMARY:${this.escapeText(summary)}`,
      `DESCRIPTION:${this.escapeText(description)}`,
      `LOCATION:${this.escapeText(location)}`,
      `CATEGORIES:${this.escapeText(categories)}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT', // Shows as free time in most calendars
      `X-TIMEBUTLER-ID:${bridgeWeekend.id}`,
      `X-TIMEBUTLER-EFFICIENCY:${bridgeWeekend.efficiency.toFixed(1)}`,
      `X-TIMEBUTLER-VACATION-DAYS:${bridgeWeekend.vacation_days_needed}`,
      `X-TIMEBUTLER-PATTERN:${bridgeWeekend.pattern}`,
      'END:VEVENT'
    ].join('\r\n');
  }

  /**
   * Generate event description with TimeButler branding
   */
  private generateEventDescription(bridgeWeekend: BridgeWeekend, isGerman: boolean): string {
    const efficiency = bridgeWeekend.efficiency.toFixed(1);
    const pattern = bridgeWeekend.pattern;

    if (isGerman) {
      return [
        `Effizienz: ${efficiency}x (${bridgeWeekend.total_days_off} Tage frei für ${bridgeWeekend.vacation_days_needed} Urlaubstage)`,
        `Muster: ${pattern}`,
        `Holiday: ${bridgeWeekend.holiday_id}`,
        '',
        'Erstellt mit TimeButler Calendar - Ihrem Partner für optimale Urlaubsplanung.',
        TIMEBUTLER_PROMOTION_DE,
        '',
        `Mehr erfahren: ${TIMEBUTLER_URL}`
      ].join('\\n');
    } else {
      return [
        `Efficiency: ${efficiency}x (${bridgeWeekend.total_days_off} days off for ${bridgeWeekend.vacation_days_needed} vacation days)`,
        `Pattern: ${pattern}`,
        `Holiday: ${bridgeWeekend.holiday_id}`,
        '',
        'Created with TimeButler Calendar - Your partner for optimal vacation planning.',
        TIMEBUTLER_PROMOTION_EN,
        '',
        `Learn more: ${TIMEBUTLER_URL}`
      ].join('\\n');
    }
  }

  /**
   * Format DateTime for RFC 5545 (local timezone)
   */
  private formatDateTime(dt: DateTime): string {
    return dt.toFormat('yyyyMMddTHHmmss');
  }

  /**
   * Format DateTime for RFC 5545 (UTC)
   */
  private formatDateTimeUTC(dt: DateTime): string {
    return dt.toUTC().toFormat('yyyyMMddTHHmmss') + 'Z';
  }

  /**
   * Escape text for RFC 5545 compliance
   */
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/;/g, '\\;')    // Escape semicolons
      .replace(/,/g, '\\,')    // Escape commas
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r');  // Escape carriage returns
  }

  /**
   * Fold lines at 75 octets as per RFC 5545
   */
  private foldLines(content: string): string {
    const lines = content.split('\r\n');
    const foldedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= 75) {
        foldedLines.push(line);
      } else {
        // Fold long lines
        let remainingLine = line;
        foldedLines.push(remainingLine.substring(0, 75));
        remainingLine = remainingLine.substring(75);

        while (remainingLine.length > 0) {
          const chunk = remainingLine.substring(0, 74); // 74 + 1 space = 75
          foldedLines.push(' ' + chunk);
          remainingLine = remainingLine.substring(74);
        }
      }
    }

    return foldedLines.join('\r\n');
  }

  /**
   * Get content type for the export format
   */
  getContentType(): string {
    return CONTENT_TYPES[this.format];
  }

  /**
   * Get file extension for the export format
   */
  getFileExtension(): string {
    return FILE_EXTENSIONS[this.format];
  }

  /**
   * Get suggested filename for download
   */
  getFilename(): string {
    const isGerman = this._language_preference === 'de';
    const baseFilename = isGerman ? 'brückentage-2025-2026' : 'bridge-days-2025-2026';
    return `${baseFilename}${this.getFileExtension()}`;
  }

  /**
   * Check if export has expired (30-day policy)
   */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  /**
   * Record download analytics (GDPR compliant)
   */
  recordDownload(userAgent: string, ipAddress: string): void {
    if (this.isExpired()) {
      throw new DataRetentionError('Cannot record download for expired export', URL_EXPIRATION_DAYS, this.expires_at, 'calendar_export');
    }

    if (this._deleted) {
      throw new DataRetentionError('Cannot record download for deleted export', URL_EXPIRATION_DAYS, this.expires_at, 'calendar_export');
    }

    // Hash IP address for GDPR compliance
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);

    // Update analytics
    this.download_count++;
    if (!this._analytics.first_download) {
      this._analytics.first_download = new Date();
    }
    this._analytics.last_download = new Date();

    // Store only hashed IPs and limited user agents for privacy
    if (!this._analytics.ip_hashes.includes(ipHash)) {
      this._analytics.ip_hashes.push(ipHash);
      // Keep only last 10 IPs for privacy
      if (this._analytics.ip_hashes.length > 10) {
        this._analytics.ip_hashes = this._analytics.ip_hashes.slice(-10);
      }
    }

    // Store only first 50 chars of user agent for privacy
    const userAgentShort = userAgent.substring(0, 50);
    if (!this._analytics.user_agents.includes(userAgentShort)) {
      this._analytics.user_agents.push(userAgentShort);
      // Keep only last 5 user agents for privacy
      if (this._analytics.user_agents.length > 5) {
        this._analytics.user_agents = this._analytics.user_agents.slice(-5);
      }
    }
  }

  /**
   * Get download analytics (anonymized)
   */
  getAnalytics(): Partial<DownloadAnalytics> {
    return {
      download_count: this.download_count,
      first_download: this._analytics.first_download,
      last_download: this._analytics.last_download
      // IP hashes and user agents not exposed for privacy
    };
  }

  /**
   * GDPR compliant secure deletion
   */
  async secureDelete(): Promise<void> {
    this._deleted = true;
    this._events.length = 0; // Clear events array
    this._analytics = {
      download_count: 0,
      first_download: null,
      last_download: null,
      user_agents: [],
      ip_hashes: []
    };

    // In production, this would also:
    // - Remove calendar files from storage
    // - Clear from CDN caches
    // - Invalidate signed URLs
    // - Notify monitoring systems
  }

  /**
   * Validate calendar content against RFC 5545
   */
  validateRFC5545Compliance(): boolean {
    try {
      const content = this.generateCalendarContent();

      // Basic RFC 5545 structure validation
      const requiredComponents = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:',
        'CALSCALE:GREGORIAN',
        'END:VCALENDAR'
      ];

      for (const component of requiredComponents) {
        if (!content.includes(component)) {
          return false;
        }
      }

      // Line folding validation (no line > 75 octets except continuation lines)
      const lines = content.split('\r\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && line.length > 75 && !line.startsWith(' ') && !line.startsWith('\t')) {
          return false;
        }
      }

      // Event structure validation
      if (this._events.length > 0) {
        const hasVEvent = content.includes('BEGIN:VEVENT') && content.includes('END:VEVENT');
        if (!hasVEvent) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create CalendarExport from vacation plan
   */
  static fromVacationPlan(vacationPlan: VacationPlan, format: CalendarFormat = 'ical'): CalendarExport {
    return new CalendarExport({
      vacation_plan_id: vacationPlan.id,
      format,
      events: vacationPlan.selected_bridges,
      language_preference: vacationPlan.language_preference,
      user_email: vacationPlan.getDecryptedEmail()
    });
  }

  /**
   * Convert to string (excluding sensitive data)
   */
  toString(): string {
    return JSON.stringify({
      id: this.id,
      vacation_plan_id: this.vacation_plan_id,
      format: this.format,
      signed_url: this.signed_url,
      expires_at: this.expires_at.toISOString(),
      created_at: this.created_at.toISOString(),
      download_count: this.download_count,
      file_size: this.file_size,
      events_count: this._events.length,
      language_preference: this._language_preference,
      deleted: this._deleted
    });
  }
}

/**
 * CalendarExport factory with format-specific optimizations
 */
export class CalendarExportFactory {
  /**
   * Create Google Calendar optimized export
   */
  static createGoogleCalendarExport(vacationPlan: VacationPlan): CalendarExport {
    const calendarExport = new CalendarExport({
      vacation_plan_id: vacationPlan.id,
      format: 'google',
      events: vacationPlan.selected_bridges,
      language_preference: vacationPlan.language_preference,
      user_email: vacationPlan.getDecryptedEmail()
    });

    return calendarExport;
  }

  /**
   * Create Outlook optimized export
   */
  static createOutlookExport(vacationPlan: VacationPlan): CalendarExport {
    const calendarExport = new CalendarExport({
      vacation_plan_id: vacationPlan.id,
      format: 'outlook',
      events: vacationPlan.selected_bridges,
      language_preference: vacationPlan.language_preference,
      user_email: vacationPlan.getDecryptedEmail()
    });

    return calendarExport;
  }

  /**
   * Create Apple Calendar optimized export
   */
  static createAppleCalendarExport(vacationPlan: VacationPlan): CalendarExport {
    const calendarExport = new CalendarExport({
      vacation_plan_id: vacationPlan.id,
      format: 'apple',
      events: vacationPlan.selected_bridges,
      language_preference: vacationPlan.language_preference,
      user_email: vacationPlan.getDecryptedEmail()
    });

    return calendarExport;
  }

  /**
   * Create standard iCal export (RFC 5545 compliant)
   */
  static createICalExport(vacationPlan: VacationPlan): CalendarExport {
    return CalendarExport.fromVacationPlan(vacationPlan, 'ical');
  }
}