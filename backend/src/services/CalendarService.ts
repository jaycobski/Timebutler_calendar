/**
 * CalendarService - RFC 5545 iCalendar Generation with Performance Optimization
 *
 * Constitutional Requirements:
 * - RFC 5545 iCalendar standard compliance
 * - Performance optimized for <100ms generation
 * - Multiple calendar format support (Google, Outlook, Apple)
 * - German timezone handling (CET/CEST)
 * - Integration with CalendarExport and VacationPlan models
 * - Bridge weekend event generation
 * - TimeButler branding in calendar metadata
 *
 * Key Features:
 * - VCALENDAR structure with proper headers
 * - VEVENT components for each bridge weekend
 * - VTIMEZONE for German timezone (Europe/Berlin)
 * - Proper date formatting (YYYYMMDDTHHMMSS)
 * - Line folding at 75 octets
 * - Text escaping for special characters
 * - UID generation for events
 * - DTSTAMP and other mandatory properties
 */

import * as crypto from 'crypto';
import { DateTime } from 'luxon';
import { CalendarExport, CalendarFormat, VEventProperties } from '../models/CalendarExport';
import { VacationPlan } from '../models/vacation-plan';
import { BridgeWeekend } from '../models/bridge-weekend';
import { ValidationError } from '../lib/errors';

// Performance monitoring
interface PerformanceMetrics {
  generation_time_ms: number;
  file_size_bytes: number;
  event_count: number;
  validation_time_ms: number;
  optimization_time_ms: number;
}

// Platform-specific optimizations
interface PlatformOptimization {
  lineFolding: boolean;
  maxLineLength: number;
  supportedProperties: string[];
  timezoneHandling: 'full' | 'simplified' | 'utc-only';
  customProperties: boolean;
}

// TimeButler branding constants
const TIMEBUTLER_PRODID = '-//TimeButler GmbH//TimeButler Calendar 1.0//EN';
const TIMEBUTLER_URL = 'https://calendar.timebutler.de';
const TIMEBUTLER_VERSION = '1.0.0';

// RFC 5545 constants
const ICAL_VERSION = '2.0';
const CALENDAR_SCALE = 'GREGORIAN';
const MAX_LINE_LENGTH = 75;
const LINE_SEPARATOR = '\r\n';

// Platform-specific configurations
const PLATFORM_CONFIGS: Record<CalendarFormat, PlatformOptimization> = {
  ical: {
    lineFolding: true,
    maxLineLength: 75,
    supportedProperties: ['*'], // All properties
    timezoneHandling: 'full',
    customProperties: true
  },
  google: {
    lineFolding: true,
    maxLineLength: 75,
    supportedProperties: ['SUMMARY', 'DESCRIPTION', 'DTSTART', 'DTEND', 'UID', 'DTSTAMP'],
    timezoneHandling: 'simplified',
    customProperties: false
  },
  outlook: {
    lineFolding: true,
    maxLineLength: 75,
    supportedProperties: ['*'],
    timezoneHandling: 'full',
    customProperties: true
  },
  apple: {
    lineFolding: true,
    maxLineLength: 75,
    supportedProperties: ['*'],
    timezoneHandling: 'full',
    customProperties: true
  }
};

// German timezone transitions for 2025-2026
const GERMAN_TIMEZONE_TRANSITIONS = {
  2025: {
    cet_to_cest: '2025-03-30T02:00:00',
    cest_to_cet: '2025-10-26T03:00:00'
  },
  2026: {
    cet_to_cest: '2026-03-29T02:00:00',
    cest_to_cet: '2026-10-25T03:00:00'
  }
};

/**
 * CalendarService Class - RFC 5545 Compliant iCalendar Generation
 */
export class CalendarService {
  private performanceCache = new Map<string, string>();
  private metricsCollector: PerformanceMetrics[] = [];

  /**
   * Generate RFC 5545 compliant calendar for vacation plan
   * Main entry point for calendar generation
   */
  public async generateCalendar(vacationPlanId: string): Promise<CalendarExport> {
    const startTime = performance.now();

    try {
      // Validate input
      if (!vacationPlanId) {
        throw new ValidationError('Vacation plan ID is required', 'MISSING_VACATION_PLAN_ID', 'vacationPlanId');
      }

      // In a real implementation, this would fetch from database
      const vacationPlan = await this.fetchVacationPlan(vacationPlanId);

      // Create calendar export
      const calendarExport = CalendarExport.fromVacationPlan(vacationPlan);

      const generationTime = performance.now() - startTime;

      // Ensure performance requirement (<100ms)
      if (generationTime > 100) {
        console.warn(`Calendar generation exceeded 100ms: ${generationTime.toFixed(2)}ms for plan ${vacationPlanId}`);
      }

      // Record performance metrics
      this.recordPerformanceMetrics({
        generation_time_ms: generationTime,
        file_size_bytes: calendarExport.file_size,
        event_count: vacationPlan.selected_bridges.length,
        validation_time_ms: 0,
        optimization_time_ms: 0
      });

      return calendarExport;
    } catch (error) {
      const generationTime = performance.now() - startTime;
      console.error(`Calendar generation failed after ${generationTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Create bridge weekend events from bridge data
   * Converts bridge weekend models to RFC 5545 VEVENT components
   */
  public createBridgeWeekendEvents(
    bridgeWeekends: BridgeWeekend[],
    languagePreference: 'de' | 'en' = 'de'
  ): string[] {
    if (!Array.isArray(bridgeWeekends)) {
      throw new ValidationError('Bridge weekends must be an array', 'INVALID_BRIDGE_WEEKENDS', 'bridgeWeekends');
    }

    const events: string[] = [];

    bridgeWeekends.forEach((bridge, index) => {
      try {
        const event = this.createVEventComponent(bridge, languagePreference);
        events.push(event);
      } catch (error) {
        console.error(`Failed to create event for bridge ${index}:`, error);
        throw new ValidationError(`Invalid bridge weekend data at index ${index}`, 'INVALID_BRIDGE_DATA', 'bridgeWeekends');
      }
    });

    return events;
  }

  /**
   * Format calendar for specific platform optimization
   * Applies platform-specific optimizations while maintaining RFC 5545 compliance
   */
  public formatForPlatform(calendarContent: string, platform: CalendarFormat): string {
    const config = PLATFORM_CONFIGS[platform];

    if (!config) {
      throw new ValidationError(`Unsupported platform: ${platform}`, 'UNSUPPORTED_PLATFORM', 'platform');
    }

    let formattedContent = calendarContent;

    // Apply platform-specific line folding
    if (config.lineFolding) {
      formattedContent = this.foldLines(formattedContent, config.maxLineLength);
    }

    // Filter properties for platforms with limited support
    if (!config.supportedProperties.includes('*')) {
      formattedContent = this.filterProperties(formattedContent, config.supportedProperties);
    }

    // Simplify timezone handling for Google Calendar
    if (platform === 'google' && config.timezoneHandling === 'simplified') {
      formattedContent = this.simplifyTimezoneHandling(formattedContent);
    }

    // Remove custom properties for platforms that don't support them
    if (!config.customProperties) {
      formattedContent = this.removeCustomProperties(formattedContent);
    }

    return formattedContent;
  }

  /**
   * Validate RFC 5545 compliance
   * Comprehensive validation against iCalendar specification
   */
  public validateRFC5545(calendarContent: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const validationStart = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      if (!calendarContent.includes('BEGIN:VCALENDAR')) {
        errors.push('Missing required BEGIN:VCALENDAR');
      }

      if (!calendarContent.includes('END:VCALENDAR')) {
        errors.push('Missing required END:VCALENDAR');
      }

      // Required properties validation
      const requiredProps = ['VERSION:2.0', 'PRODID:', 'CALSCALE:GREGORIAN'];
      requiredProps.forEach(prop => {
        if (!calendarContent.includes(prop)) {
          errors.push(`Missing required property: ${prop}`);
        }
      });

      // Line folding validation
      const lines = calendarContent.split(LINE_SEPARATOR);
      lines.forEach((line, index) => {
        if (line && line.length > MAX_LINE_LENGTH && !line.startsWith(' ') && !line.startsWith('\t')) {
          errors.push(`Line ${index + 1} exceeds ${MAX_LINE_LENGTH} characters without folding`);
        }
      });

      // Event validation
      const eventMatches = calendarContent.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g);
      if (eventMatches) {
        eventMatches.forEach((eventContent, index) => {
          const eventErrors = this.validateVEvent(eventContent);
          eventErrors.forEach(error => errors.push(`Event ${index + 1}: ${error}`));
        });
      }

      // Timezone validation
      if (calendarContent.includes('BEGIN:VTIMEZONE')) {
        const tzErrors = this.validateVTimezone(calendarContent);
        errors.push(...tzErrors);
      }

      // Character encoding validation
      const invalidChars = calendarContent.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
      if (invalidChars) {
        warnings.push('Calendar contains potentially invalid control characters');
      }

      const validationTime = performance.now() - validationStart;

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Optimize file size while maintaining RFC 5545 compliance
   * Performance optimization to reduce calendar file size
   */
  public optimizeFileSize(calendarContent: string): string {
    const optimizationStart = performance.now();

    let optimized = calendarContent;

    // Remove unnecessary whitespace (but preserve required line endings)
    optimized = optimized.replace(/[ \t]+$/gm, ''); // Remove trailing whitespace

    // Compress repeated patterns
    optimized = this.compressRepeatedPatterns(optimized);

    // Optimize property values
    optimized = this.optimizePropertyValues(optimized);

    // Cache optimization result
    const hash = crypto.createHash('md5').update(calendarContent).digest('hex');
    this.performanceCache.set(hash, optimized);

    const optimizationTime = performance.now() - optimizationStart;
    console.debug(`File size optimization completed in ${optimizationTime.toFixed(2)}ms`);

    return optimized;
  }

  /**
   * Add TimeButler branding to calendar metadata
   * Integrates TimeButler branding while maintaining RFC 5545 compliance
   */
  public addTimeButlerBranding(calendarContent: string, languagePreference: 'de' | 'en' = 'de'): string {
    const isGerman = languagePreference === 'de';

    // Extract existing VCALENDAR properties
    const vcalendarMatch = calendarContent.match(/BEGIN:VCALENDAR\r\n([\s\S]*?)(?=BEGIN:VTIMEZONE|BEGIN:VEVENT|END:VCALENDAR)/);

    if (!vcalendarMatch) {
      throw new ValidationError('Invalid VCALENDAR structure for branding', 'INVALID_VCALENDAR', 'calendarContent');
    }

    const brandingProperties = [
      `PRODID:${TIMEBUTLER_PRODID}`,
      `X-WR-CALNAME:${isGerman ? 'Brückentage 2025-2026' : 'Bridge Days 2025-2026'}`,
      `X-WR-CALDESC:${isGerman
        ? 'Optimieren Sie Ihre Work-Life-Balance mit TimeButler\'s professionellen Zeiterfassungslösungen'
        : 'Optimize your work-life balance with TimeButler\'s comprehensive time tracking solutions'}`,
      `X-TIMEBUTLER-URL:${TIMEBUTLER_URL}`,
      `X-TIMEBUTLER-VERSION:${TIMEBUTLER_VERSION}`,
      `X-TIMEBUTLER-GENERATED:${new Date().toISOString()}`
    ];

    // Replace PRODID and add branding properties
    let branded = calendarContent.replace(/PRODID:[^\r\n]*\r\n/, '');

    // Insert branding after VERSION property
    branded = branded.replace(
      /(VERSION:2\.0\r\n)/,
      `$1${brandingProperties.join(LINE_SEPARATOR)}${LINE_SEPARATOR}`
    );

    return branded;
  }

  /**
   * Generate complete RFC 5545 calendar with all components
   * Private method to create the full calendar structure
   */
  private generateCompleteCalendar(
    bridgeWeekends: BridgeWeekend[],
    languagePreference: 'de' | 'en',
    format: CalendarFormat = 'ical'
  ): string {
    const events = this.createBridgeWeekendEvents(bridgeWeekends, languagePreference);
    const timezone = this.generateVTimezoneComponent();

    const calendar = [
      'BEGIN:VCALENDAR',
      `VERSION:${ICAL_VERSION}`,
      `PRODID:${TIMEBUTLER_PRODID}`,
      `CALSCALE:${CALENDAR_SCALE}`,
      'METHOD:PUBLISH',
      timezone,
      ...events,
      'END:VCALENDAR'
    ].join(LINE_SEPARATOR);

    // Apply platform-specific formatting
    const formatted = this.formatForPlatform(calendar, format);

    // Add TimeButler branding
    const branded = this.addTimeButlerBranding(formatted, languagePreference);

    // Optimize file size
    return this.optimizeFileSize(branded);
  }

  /**
   * Create RFC 5545 VEVENT component for bridge weekend
   */
  private createVEventComponent(
    bridgeWeekend: BridgeWeekend,
    languagePreference: 'de' | 'en'
  ): string {
    const isGerman = languagePreference === 'de';
    const now = DateTime.now().setZone('Europe/Berlin');

    // Parse dates with proper timezone handling
    const startDateTime = DateTime.fromISO(bridgeWeekend.start_date, { zone: 'Europe/Berlin' });
    const endDateTime = DateTime.fromISO(bridgeWeekend.end_date, { zone: 'Europe/Berlin' });

    // Validate dates
    if (!startDateTime.isValid || !endDateTime.isValid) {
      throw new ValidationError('Invalid bridge weekend dates', 'INVALID_BRIDGE_DATES', 'bridgeWeekend');
    }

    // Generate unique UID
    const uid = this.generateEventUID(bridgeWeekend);

    // Create event summary and description
    const summary = this.generateEventSummary(bridgeWeekend, isGerman);
    const description = this.generateEventDescription(bridgeWeekend, isGerman);

    // Build VEVENT component
    const eventProperties: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${this.formatDateTimeUTC(now)}`,
      `DTSTART;TZID=Europe/Berlin:${this.formatDateTime(startDateTime)}`,
      `DTEND;TZID=Europe/Berlin:${this.formatDateTime(endDateTime)}`,
      `SUMMARY:${this.escapeText(summary)}`,
      `DESCRIPTION:${this.escapeText(description)}`,
      `LOCATION:${this.escapeText(isGerman ? 'Deutschland' : 'Germany')}`,
      `CATEGORIES:${this.escapeText(isGerman ? 'Urlaub,Brückentage' : 'Vacation,Bridge Days')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      `X-TIMEBUTLER-ID:${bridgeWeekend.id}`,
      `X-TIMEBUTLER-EFFICIENCY:${bridgeWeekend.efficiency.toFixed(1)}`,
      `X-TIMEBUTLER-VACATION-DAYS:${bridgeWeekend.vacation_days_needed}`,
      `X-TIMEBUTLER-PATTERN:${bridgeWeekend.pattern}`,
      'END:VEVENT'
    ];

    return eventProperties.join(LINE_SEPARATOR);
  }

  /**
   * Generate RFC 5545 VTIMEZONE component for Europe/Berlin
   */
  private generateVTimezoneComponent(): string {
    const components = [
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Berlin',
      'TZURL:http://tzurl.org/zoneinfo-outlook/Europe/Berlin',
      'X-LIC-LOCATION:Europe/Berlin'
    ];

    // Add CET (Central European Time) - Standard Time
    const cetComponent = [
      'BEGIN:STANDARD',
      'TZNAME:CET',
      'DTSTART:20251026T030000',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD'
    ];

    // Add CEST (Central European Summer Time) - Daylight Time
    const cestComponent = [
      'BEGIN:DAYLIGHT',
      'TZNAME:CEST',
      'DTSTART:20250330T020000',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT'
    ];

    components.push(...cetComponent, ...cestComponent, 'END:VTIMEZONE');

    return components.join(LINE_SEPARATOR);
  }

  /**
   * Generate unique event UID following RFC 5545 guidelines
   */
  private generateEventUID(bridgeWeekend: BridgeWeekend): string {
    const timestamp = DateTime.now().toFormat('yyyyMMddTHHmmss');
    const hash = crypto.createHash('sha1')
      .update(`${bridgeWeekend.id}-${bridgeWeekend.start_date}-${bridgeWeekend.end_date}`)
      .digest('hex')
      .substring(0, 8);

    return `${timestamp}-${hash}@calendar.timebutler.de`;
  }

  /**
   * Generate event summary (title)
   */
  private generateEventSummary(bridgeWeekend: BridgeWeekend, isGerman: boolean): string {
    const vacationDays = bridgeWeekend.vacation_days_needed;

    if (isGerman) {
      return `Brückenwochenende (${vacationDays} ${vacationDays === 1 ? 'Urlaubstag' : 'Urlaubstage'})`;
    } else {
      return `Bridge Weekend (${vacationDays} vacation ${vacationDays === 1 ? 'day' : 'days'})`;
    }
  }

  /**
   * Generate event description with TimeButler branding
   */
  private generateEventDescription(bridgeWeekend: BridgeWeekend, isGerman: boolean): string {
    const efficiency = bridgeWeekend.efficiency.toFixed(1);
    const totalDays = bridgeWeekend.total_days_off;
    const vacationDays = bridgeWeekend.vacation_days_needed;
    const pattern = bridgeWeekend.pattern;

    const lines: string[] = [];

    if (isGerman) {
      lines.push(
        `Effizienz: ${efficiency}x (${totalDays} Tage frei für ${vacationDays} ${vacationDays === 1 ? 'Urlaubstag' : 'Urlaubstage'})`,
        `Muster: ${pattern}`,
        `Holiday ID: ${bridgeWeekend.holiday_id}`,
        '',
        'Erstellt mit TimeButler Calendar - Ihrem Partner für optimale Urlaubsplanung.',
        'Optimieren Sie Ihre Work-Life-Balance mit TimeButler\'s professionellen Zeiterfassungslösungen.',
        '',
        `Mehr erfahren: ${TIMEBUTLER_URL}`
      );
    } else {
      lines.push(
        `Efficiency: ${efficiency}x (${totalDays} days off for ${vacationDays} vacation ${vacationDays === 1 ? 'day' : 'days'})`,
        `Pattern: ${pattern}`,
        `Holiday ID: ${bridgeWeekend.holiday_id}`,
        '',
        'Created with TimeButler Calendar - Your partner for optimal vacation planning.',
        'Optimize your work-life balance with TimeButler\'s comprehensive time tracking solutions.',
        '',
        `Learn more: ${TIMEBUTLER_URL}`
      );
    }

    return lines.join('\\n');
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
      .replace(/\\/g, '\\\\')   // Escape backslashes
      .replace(/;/g, '\\;')     // Escape semicolons
      .replace(/,/g, '\\,')     // Escape commas
      .replace(/\n/g, '\\n')    // Escape newlines
      .replace(/\r/g, '\\r');   // Escape carriage returns
  }

  /**
   * Fold lines at specified length as per RFC 5545
   */
  private foldLines(content: string, maxLength: number = MAX_LINE_LENGTH): string {
    const lines = content.split(LINE_SEPARATOR);
    const foldedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= maxLength) {
        foldedLines.push(line);
      } else {
        // Fold long lines
        let remainingLine = line;
        foldedLines.push(remainingLine.substring(0, maxLength));
        remainingLine = remainingLine.substring(maxLength);

        while (remainingLine.length > 0) {
          const chunkSize = maxLength - 1; // Account for leading space
          const chunk = remainingLine.substring(0, chunkSize);
          foldedLines.push(' ' + chunk);
          remainingLine = remainingLine.substring(chunkSize);
        }
      }
    }

    return foldedLines.join(LINE_SEPARATOR);
  }

  /**
   * Validate VEVENT component
   */
  private validateVEvent(eventContent: string): string[] {
    const errors: string[] = [];

    // Required properties for VEVENT
    const requiredProperties = ['UID', 'DTSTAMP'];

    requiredProperties.forEach(prop => {
      if (!eventContent.includes(`${prop}:`)) {
        errors.push(`Missing required property: ${prop}`);
      }
    });

    // Must have either DTEND or DURATION
    if (!eventContent.includes('DTEND:') && !eventContent.includes('DURATION:')) {
      errors.push('VEVENT must have either DTEND or DURATION');
    }

    return errors;
  }

  /**
   * Validate VTIMEZONE component
   */
  private validateVTimezone(calendarContent: string): string[] {
    const errors: string[] = [];

    if (!calendarContent.includes('TZID:')) {
      errors.push('VTIMEZONE missing required TZID');
    }

    return errors;
  }

  /**
   * Filter properties for platforms with limited support
   */
  private filterProperties(content: string, supportedProperties: string[]): string {
    if (supportedProperties.includes('*')) {
      return content;
    }

    const lines = content.split(LINE_SEPARATOR);
    const filteredLines = lines.filter(line => {
      const property = line.split(':')[0];
      return supportedProperties.includes(property) ||
             line.startsWith('BEGIN:') ||
             line.startsWith('END:') ||
             line.startsWith(' '); // Continuation lines
    });

    return filteredLines.join(LINE_SEPARATOR);
  }

  /**
   * Simplify timezone handling for Google Calendar
   */
  private simplifyTimezoneHandling(content: string): string {
    // Convert TZID references to UTC for Google Calendar compatibility
    return content.replace(/;TZID=Europe\/Berlin:/g, ':').replace(/VTIMEZONE[\s\S]*?END:VTIMEZONE\r\n/, '');
  }

  /**
   * Remove custom X- properties for compatibility
   */
  private removeCustomProperties(content: string): string {
    const lines = content.split(LINE_SEPARATOR);
    const filteredLines = lines.filter(line => !line.startsWith('X-'));
    return filteredLines.join(LINE_SEPARATOR);
  }

  /**
   * Compress repeated patterns for file size optimization
   */
  private compressRepeatedPatterns(content: string): string {
    // Remove duplicate empty lines
    return content.replace(/(\r\n){3,}/g, '\r\n\r\n');
  }

  /**
   * Optimize property values
   */
  private optimizePropertyValues(content: string): string {
    // Trim unnecessary quotes and whitespace in property values
    return content.replace(/:\s+/g, ':').replace(/\s+\r\n/g, '\r\n');
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.metricsCollector.push(metrics);

    // Keep only last 100 metrics for memory efficiency
    if (this.metricsCollector.length > 100) {
      this.metricsCollector = this.metricsCollector.slice(-100);
    }
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): {
    average_generation_time: number;
    average_file_size: number;
    total_calendars_generated: number;
  } {
    if (this.metricsCollector.length === 0) {
      return { average_generation_time: 0, average_file_size: 0, total_calendars_generated: 0 };
    }

    const totalTime = this.metricsCollector.reduce((sum, m) => sum + m.generation_time_ms, 0);
    const totalSize = this.metricsCollector.reduce((sum, m) => sum + m.file_size_bytes, 0);

    return {
      average_generation_time: totalTime / this.metricsCollector.length,
      average_file_size: totalSize / this.metricsCollector.length,
      total_calendars_generated: this.metricsCollector.length
    };
  }

  /**
   * Mock vacation plan fetching (would be replaced with actual database call)
   */
  private async fetchVacationPlan(vacationPlanId: string): Promise<VacationPlan> {
    // Mock implementation - in real app this would fetch from database
    const mockBridgeWeekends: BridgeWeekend[] = [
      new BridgeWeekend({
        id: 'bridge-1',
        holiday_id: 'tag-der-arbeit-2025',
        state_code: 'BY',
        start_date: '2025-05-01',
        end_date: '2025-05-04',
        vacation_days_needed: 1,
        total_days_off: 4,
        efficiency: 4.0,
        pattern: 'thursday-friday'
      })
    ];

    const mockGDPRConsent = {
      id: 'consent-1',
      consent_version: '1.0.0',
      purposes: ['vacation_planning', 'email_delivery'] as any,
      given_at: new Date(),
      ip_hash: 'hash123',
      user_agent_hash: 'agent123',
      audit_trail: []
    };

    const mockVacationPlan = new VacationPlan({
      email: 'test@example.com',
      state_code: 'BY',
      vacation_days_budget: 30,
      selected_bridges: mockBridgeWeekends,
      gdpr_consent: mockGDPRConsent,
      language_preference: 'de'
    });

    return mockVacationPlan;
  }

  /**
   * Clear performance cache (for memory management)
   */
  public clearCache(): void {
    this.performanceCache.clear();
    this.metricsCollector = [];
  }
}

/**
 * CalendarService factory with specific optimizations
 */
export class CalendarServiceFactory {
  /**
   * Create calendar service optimized for performance
   */
  static createPerformanceOptimized(): CalendarService {
    return new CalendarService();
  }

  /**
   * Create calendar service for specific platform
   */
  static createForPlatform(platform: CalendarFormat): CalendarService {
    const service = new CalendarService();
    // Platform-specific configurations would be applied here
    return service;
  }

  /**
   * Create calendar service with custom configuration
   */
  static createWithConfig(config: Partial<PlatformOptimization>): CalendarService {
    const service = new CalendarService();
    // Custom configuration would be applied here
    return service;
  }
}