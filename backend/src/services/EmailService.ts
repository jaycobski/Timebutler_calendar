/**
 * EmailService - Resend Integration with Bilingual Templates and GDPR Compliance
 * Task T029: Email service for vacation plan delivery with professional TimeButler branding
 *
 * Constitutional Requirements:
 * - >95% email delivery success rate
 * - <5 seconds from submission to inbox
 * - GDPR Article 6 lawful basis validation
 * - Bilingual support (formal German, casual English)
 * - TimeButler branding without being intrusive
 * - Mobile-responsive HTML templates with plain text fallbacks
 * - Calendar attachment integration (.ics files)
 * - Email delivery tracking and analytics
 *
 * Features:
 * - Resend email service integration
 * - GDPR consent validation before sending
 * - Bilingual email templates with cultural tone adaptation
 * - Professional TimeButler branding
 * - Calendar attachment support
 * - Email bounces and failures handling
 * - Delivery success rate monitoring (>95% requirement)
 * - Analytics for email performance
 */

import { Resend } from 'resend';
import Redis from 'ioredis';
import { DateTime } from 'luxon';
import { VacationPlan, LanguagePreference } from '../models/vacation-plan';
import { CalendarExport } from '../models/CalendarExport';
import { GDPRConsentRecord } from '../models/gdpr-consent-record';
import { BridgeWeekend } from '../models/bridge-weekend';
import {
  ValidationError,
  GDPRViolationError,
  EmailValidationError
} from '../lib/errors';

// Email delivery tracking types
export interface EmailDeliveryRecord {
  id: string;
  vacation_plan_id: string;
  email_address: string; // Hashed for privacy
  language: LanguagePreference;
  status: EmailDeliveryStatus;
  resend_email_id?: string;
  sent_at: Date;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  bounced_at?: Date;
  complaint_at?: Date;
  error_message?: string;
  retry_count: number;
  gdpr_consent_verified: boolean;
}

export type EmailDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'gdpr_blocked';

// Email template data structure
export interface EmailTemplateData {
  vacation_plan: VacationPlan;
  calendar_export: CalendarExport;
  bridge_weekends: BridgeWeekend[];
  total_vacation_days: number;
  total_days_off: number;
  efficiency_score: number;
  withdrawal_link: string;
  timebutler_promotion: TimeButlerPromotion;
}

// TimeButler branding configuration
export interface TimeButlerPromotion {
  primary_message: string;
  secondary_message: string;
  cta_text: string;
  cta_url: string;
  logo_url: string;
  brand_color: string;
}

// Email service configuration
interface EmailServiceConfig {
  resend_api_key: string;
  from_email: string;
  from_name: string;
  reply_to_email: string;
  redis_client: Redis;
  base_url: string;
  delivery_timeout: number;
  max_retries: number;
  success_rate_threshold: number; // 95% minimum
}

// Email analytics for monitoring
interface EmailAnalytics {
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_complaints: number;
  success_rate: number;
  average_delivery_time: number;
  gdpr_blocks: number;
}

/**
 * EmailService Class - Comprehensive Email Delivery with GDPR Compliance
 */
export class EmailService {
  private resend: Resend;
  private redis: Redis;
  private config: EmailServiceConfig;
  private analytics: EmailAnalytics;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.resend = new Resend(config.resend_api_key);
    this.redis = config.redis_client;

    // Initialize analytics
    this.analytics = {
      total_sent: 0,
      total_delivered: 0,
      total_bounced: 0,
      total_complaints: 0,
      success_rate: 100,
      average_delivery_time: 0,
      gdpr_blocks: 0
    };

    this.loadAnalyticsFromCache();
  }

  /**
   * Main method: Send vacation plan email with calendar attachment
   */
  async sendVacationPlan(
    vacationPlanId: string,
    email: string,
    language: LanguagePreference = 'de',
    calendarExportId?: string
  ): Promise<string> {
    try {
      // Load vacation plan
      const vacationPlan = await this.getVacationPlan(vacationPlanId);
      if (!vacationPlan) {
        throw new ValidationError('Vacation plan not found', 'VACATION_PLAN_NOT_FOUND', 'vacation_plan_id', language);
      }

      // Validate GDPR consent before sending
      const gdprValid = this.validateGDPRConsent(vacationPlan.gdpr_consent);
      if (!gdprValid.valid) {
        await this.recordEmailDelivery(vacationPlanId, email, language, 'gdpr_blocked', {
          error: `GDPR consent invalid: ${gdprValid.issues.join(', ')}`
        });
        throw new GDPRViolationError(
          'Cannot send email without valid GDPR consent',
          'consent',
          'INVALID_CONSENT_FOR_EMAIL',
          'Article 6(1)(a)',
          'critical'
        );
      }

      // Load calendar export if provided
      let calendarExport: CalendarExport | undefined;
      if (calendarExportId) {
        calendarExport = await this.getCalendarExport(calendarExportId);
      }

      // Generate email content
      const emailContent = await this.generateEmailContent(vacationPlan, language, calendarExport);

      // Prepare attachment if calendar export exists
      let attachment: any = undefined;
      if (calendarExport) {
        attachment = {
          filename: calendarExport.getFilename(),
          content: calendarExport.generateCalendarContent(),
          content_type: calendarExport.getContentType()
        };
      }

      // Send email via Resend
      const resendResult = await this.resend.emails.send({
        from: `${this.config.from_name} <${this.config.from_email}>`,
        to: email,
        reply_to: this.config.reply_to_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: attachment ? [attachment] : undefined,
        tags: [
          {
            name: 'service',
            value: 'vacation-planning'
          },
          {
            name: 'language',
            value: language
          },
          {
            name: 'timebutler_promo',
            value: 'true'
          }
        ]
      });

      // Record successful sending
      const deliveryRecord = await this.recordEmailDelivery(vacationPlanId, email, language, 'sent', {
        resend_email_id: resendResult.data?.id
      });

      // Update analytics
      this.analytics.total_sent++;
      await this.updateAnalyticsCache();

      return deliveryRecord.id;

    } catch (error) {
      // Record failed delivery
      await this.recordEmailDelivery(vacationPlanId, email, language, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Validate GDPR consent for email sending
   */
  validateGDPRConsent(consent: any): { valid: boolean; issues: string[] } {
    try {
      const validation = GDPRConsentRecord.validateConsent(consent);

      if (!validation.valid) {
        return validation;
      }

      // Check specific email delivery consent
      if (!GDPRConsentRecord.allowsPurpose(consent, 'email_delivery')) {
        return {
          valid: false,
          issues: ['Email delivery purpose not consented to']
        };
      }

      return { valid: true, issues: [] };
    } catch (error) {
      return {
        valid: false,
        issues: ['Failed to validate GDPR consent']
      };
    }
  }

  /**
   * Generate bilingual email content with TimeButler branding
   */
  async generateEmailContent(
    vacationPlan: VacationPlan,
    language: LanguagePreference,
    calendarExport?: CalendarExport
  ): Promise<{ subject: string; html: string; text: string }> {

    const templateData: EmailTemplateData = {
      vacation_plan: vacationPlan,
      calendar_export: calendarExport!,
      bridge_weekends: vacationPlan.selected_bridges,
      total_vacation_days: vacationPlan.selected_bridges.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0),
      total_days_off: vacationPlan.selected_bridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0),
      efficiency_score: this.calculateEfficiencyScore(vacationPlan.selected_bridges),
      withdrawal_link: GDPRConsentRecord.generateWithdrawalLink(vacationPlan.session_id, this.config.base_url),
      timebutler_promotion: this.getTimeButlerPromotion(language)
    };

    if (language === 'de') {
      return {
        subject: this.generateGermanSubject(templateData),
        html: this.generateGermanHTMLTemplate(templateData),
        text: this.generateGermanTextTemplate(templateData)
      };
    } else {
      return {
        subject: this.generateEnglishSubject(templateData),
        html: this.generateEnglishHTMLTemplate(templateData),
        text: this.generateEnglishTextTemplate(templateData)
      };
    }
  }

  /**
   * Calculate efficiency score for vacation plan
   */
  private calculateEfficiencyScore(bridges: BridgeWeekend[]): number {
    if (bridges.length === 0) return 0;

    const totalVacationDays = bridges.reduce((sum, bridge) => sum + bridge.vacation_days_needed, 0);
    const totalDaysOff = bridges.reduce((sum, bridge) => sum + bridge.total_days_off, 0);

    return totalVacationDays > 0 ? totalDaysOff / totalVacationDays : 0;
  }

  /**
   * Get TimeButler promotional content by language
   */
  private getTimeButlerPromotion(language: LanguagePreference): TimeButlerPromotion {
    if (language === 'de') {
      return {
        primary_message: 'Optimieren Sie Ihre Work-Life-Balance',
        secondary_message: 'TimeButler hilft Ihnen dabei, Ihre Zeit professionell zu verwalten und mehr aus Ihren Urlaubstagen herauszuholen.',
        cta_text: 'Mehr erfahren',
        cta_url: 'https://timebutler.de/zeiterfassung',
        logo_url: 'https://timebutler.de/assets/logo-email.png',
        brand_color: '#0066CC'
      };
    } else {
      return {
        primary_message: 'Optimize Your Work-Life Balance',
        secondary_message: 'TimeButler helps you professionally manage your time and get the most out of your vacation days.',
        cta_text: 'Learn More',
        cta_url: 'https://timebutler.de/en/time-tracking',
        logo_url: 'https://timebutler.de/assets/logo-email-en.png',
        brand_color: '#0066CC'
      };
    }
  }

  /**
   * Generate German email subject
   */
  private generateGermanSubject(data: EmailTemplateData): string {
    const bridgeCount = data.bridge_weekends.length;
    const daysOff = data.total_days_off;

    return `Ihre ${bridgeCount} Brückentage: ${daysOff} freie Tage geplant ✈️`;
  }

  /**
   * Generate English email subject
   */
  private generateEnglishSubject(data: EmailTemplateData): string {
    const bridgeCount = data.bridge_weekends.length;
    const daysOff = data.total_days_off;

    return `Your ${bridgeCount} Bridge Days: ${daysOff} days off planned ✈️`;
  }

  /**
   * Generate German HTML email template
   */
  private generateGermanHTMLTemplate(data: EmailTemplateData): string {
    const efficiency = data.efficiency_score.toFixed(1);
    const attachmentNote = data.calendar_export ?
      '<p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0066CC; margin: 20px 0;">📅 <strong>Ihr Kalender ist angehängt!</strong> Importieren Sie die .ics-Datei in Ihren Kalender (Google, Outlook, Apple).</p>' :
      '';

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihre Brückentage von TimeButler</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0066CC 0%, #004499 100%); color: white; padding: 30px; text-align: center; }
        .logo { max-width: 120px; height: auto; margin-bottom: 15px; }
        .content { padding: 30px; }
        .bridge-summary { background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .bridge-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .efficiency-badge { background-color: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; }
        .timebutler-promo { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #0066CC 0%, #004499 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9em; color: #666; border-top: 1px solid #e0e0e0; }
        .gdpr-notice { font-size: 0.8em; color: #888; margin-top: 15px; }
        @media only screen and (max-width: 480px) {
            .container { margin: 10px; }
            .content, .header { padding: 20px; }
            .bridge-item { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${data.timebutler_promotion.logo_url}" alt="TimeButler" class="logo">
            <h1>Ihre optimalen Brückentage</h1>
            <p>Maximieren Sie Ihren Urlaub mit strategischer Planung</p>
        </div>

        <div class="content">
            <div class="bridge-summary">
                <h2>🎉 Ihr Urlaubsoptimierung</h2>
                <p><strong>${data.total_vacation_days} Urlaubstage</strong> werden zu <strong>${data.total_days_off} freien Tagen</strong></p>
                <p>Effizienz: <span class="efficiency-badge">${efficiency}x</span></p>
            </div>

            ${attachmentNote}

            <h3>Ihre ${data.bridge_weekends.length} Brückenwochenenden:</h3>

            ${data.bridge_weekends.map((bridge, index) => `
            <div class="bridge-item">
                <h4>Brückenwochenende #${index + 1}</h4>
                <p><strong>Zeitraum:</strong> ${this.formatGermanDate(bridge.start_date)} - ${this.formatGermanDate(bridge.end_date)}</p>
                <p><strong>Urlaubstage benötigt:</strong> ${bridge.vacation_days_needed}</p>
                <p><strong>Gesamte freie Tage:</strong> ${bridge.total_days_off}</p>
                <p><strong>Muster:</strong> ${this.translatePattern(bridge.pattern, 'de')}</p>
                <p><strong>Effizienz:</strong> ${bridge.efficiency.toFixed(1)}x</p>
            </div>
            `).join('')}

            <div class="timebutler-promo">
                <h3>${data.timebutler_promotion.primary_message}</h3>
                <p>${data.timebutler_promotion.secondary_message}</p>
                <a href="${data.timebutler_promotion.cta_url}" class="cta-button">${data.timebutler_promotion.cta_text}</a>
                <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                    TimeButler - Ihre professionelle Zeiterfassungslösung für optimale Work-Life-Balance
                </p>
            </div>

            <p>Wir wünschen Ihnen erholsame Urlaubstage!</p>
            <p><strong>Ihr TimeButler Team</strong></p>
        </div>

        <div class="footer">
            <div class="gdpr-notice">
                <p>Diese E-Mail wurde auf Basis Ihrer Einwilligung gemäß DSGVO Art. 6 Abs. 1 lit. a versendet.</p>
                <p><a href="${data.withdrawal_link}" style="color: #0066CC;">Einwilligung widerrufen</a> |
                   <a href="https://timebutler.de/datenschutz" style="color: #0066CC;">Datenschutzerklärung</a></p>
                <p style="margin-top: 10px;">TimeButler GmbH | Musterstraße 123 | 80331 München</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate English HTML email template
   */
  private generateEnglishHTMLTemplate(data: EmailTemplateData): string {
    const efficiency = data.efficiency_score.toFixed(1);
    const attachmentNote = data.calendar_export ?
      '<p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0066CC; margin: 20px 0;">📅 <strong>Your calendar is attached!</strong> Import the .ics file into your calendar (Google, Outlook, Apple).</p>' :
      '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Bridge Days from TimeButler</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0066CC 0%, #004499 100%); color: white; padding: 30px; text-align: center; }
        .logo { max-width: 120px; height: auto; margin-bottom: 15px; }
        .content { padding: 30px; }
        .bridge-summary { background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .bridge-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .efficiency-badge { background-color: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; }
        .timebutler-promo { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #0066CC 0%, #004499 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 0.9em; color: #666; border-top: 1px solid #e0e0e0; }
        .gdpr-notice { font-size: 0.8em; color: #888; margin-top: 15px; }
        @media only screen and (max-width: 480px) {
            .container { margin: 10px; }
            .content, .header { padding: 20px; }
            .bridge-item { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${data.timebutler_promotion.logo_url}" alt="TimeButler" class="logo">
            <h1>Your Optimal Bridge Days</h1>
            <p>Maximize your vacation with strategic planning</p>
        </div>

        <div class="content">
            <div class="bridge-summary">
                <h2>🎉 Your Vacation Optimization</h2>
                <p><strong>${data.total_vacation_days} vacation days</strong> become <strong>${data.total_days_off} days off</strong></p>
                <p>Efficiency: <span class="efficiency-badge">${efficiency}x</span></p>
            </div>

            ${attachmentNote}

            <h3>Your ${data.bridge_weekends.length} Bridge Weekends:</h3>

            ${data.bridge_weekends.map((bridge, index) => `
            <div class="bridge-item">
                <h4>Bridge Weekend #${index + 1}</h4>
                <p><strong>Period:</strong> ${this.formatEnglishDate(bridge.start_date)} - ${this.formatEnglishDate(bridge.end_date)}</p>
                <p><strong>Vacation days needed:</strong> ${bridge.vacation_days_needed}</p>
                <p><strong>Total days off:</strong> ${bridge.total_days_off}</p>
                <p><strong>Pattern:</strong> ${this.translatePattern(bridge.pattern, 'en')}</p>
                <p><strong>Efficiency:</strong> ${bridge.efficiency.toFixed(1)}x</p>
            </div>
            `).join('')}

            <div class="timebutler-promo">
                <h3>${data.timebutler_promotion.primary_message}</h3>
                <p>${data.timebutler_promotion.secondary_message}</p>
                <a href="${data.timebutler_promotion.cta_url}" class="cta-button">${data.timebutler_promotion.cta_text}</a>
                <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                    TimeButler - Your professional time tracking solution for optimal work-life balance
                </p>
            </div>

            <p>We wish you relaxing vacation days!</p>
            <p><strong>Your TimeButler Team</strong></p>
        </div>

        <div class="footer">
            <div class="gdpr-notice">
                <p>This email was sent based on your consent according to GDPR Art. 6 para. 1 lit. a.</p>
                <p><a href="${data.withdrawal_link}" style="color: #0066CC;">Withdraw consent</a> |
                   <a href="https://timebutler.de/en/privacy" style="color: #0066CC;">Privacy Policy</a></p>
                <p style="margin-top: 10px;">TimeButler GmbH | Musterstraße 123 | 80331 Munich, Germany</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate German plain text email template
   */
  private generateGermanTextTemplate(data: EmailTemplateData): string {
    const efficiency = data.efficiency_score.toFixed(1);
    const attachmentNote = data.calendar_export ?
      '\n📅 IHR KALENDER IST ANGEHÄNGT!\nImportieren Sie die .ics-Datei in Ihren Kalender (Google, Outlook, Apple).\n' :
      '';

    return `
IHRE OPTIMALEN BRÜCKENTAGE
Von TimeButler - Ihr Partner für optimale Urlaubsplanung

🎉 IHRE URLAUBSOPTIMIERUNG
${data.total_vacation_days} Urlaubstage werden zu ${data.total_days_off} freien Tagen
Effizienz: ${efficiency}x
${attachmentNote}
IHRE ${data.bridge_weekends.length} BRÜCKENWOCHENENDEN:

${data.bridge_weekends.map((bridge, index) => `
Brückenwochenende #${index + 1}
- Zeitraum: ${this.formatGermanDate(bridge.start_date)} - ${this.formatGermanDate(bridge.end_date)}
- Urlaubstage benötigt: ${bridge.vacation_days_needed}
- Gesamte freie Tage: ${bridge.total_days_off}
- Muster: ${this.translatePattern(bridge.pattern, 'de')}
- Effizienz: ${bridge.efficiency.toFixed(1)}x
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.timebutler_promotion.primary_message}

${data.timebutler_promotion.secondary_message}

Mehr erfahren: ${data.timebutler_promotion.cta_url}

TimeButler - Ihre professionelle Zeiterfassungslösung für optimale Work-Life-Balance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wir wünschen Ihnen erholsame Urlaubstage!
Ihr TimeButler Team

DATENSCHUTZ & WIDERRUF:
Diese E-Mail wurde auf Basis Ihrer Einwilligung gemäß DSGVO Art. 6 Abs. 1 lit. a versendet.

Einwilligung widerrufen: ${data.withdrawal_link}
Datenschutzerklärung: https://timebutler.de/datenschutz

TimeButler GmbH
Musterstraße 123
80331 München
`;
  }

  /**
   * Generate English plain text email template
   */
  private generateEnglishTextTemplate(data: EmailTemplateData): string {
    const efficiency = data.efficiency_score.toFixed(1);
    const attachmentNote = data.calendar_export ?
      '\n📅 YOUR CALENDAR IS ATTACHED!\nImport the .ics file into your calendar (Google, Outlook, Apple).\n' :
      '';

    return `
YOUR OPTIMAL BRIDGE DAYS
From TimeButler - Your partner for optimal vacation planning

🎉 YOUR VACATION OPTIMIZATION
${data.total_vacation_days} vacation days become ${data.total_days_off} days off
Efficiency: ${efficiency}x
${attachmentNote}
YOUR ${data.bridge_weekends.length} BRIDGE WEEKENDS:

${data.bridge_weekends.map((bridge, index) => `
Bridge Weekend #${index + 1}
- Period: ${this.formatEnglishDate(bridge.start_date)} - ${this.formatEnglishDate(bridge.end_date)}
- Vacation days needed: ${bridge.vacation_days_needed}
- Total days off: ${bridge.total_days_off}
- Pattern: ${this.translatePattern(bridge.pattern, 'en')}
- Efficiency: ${bridge.efficiency.toFixed(1)}x
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.timebutler_promotion.primary_message}

${data.timebutler_promotion.secondary_message}

Learn more: ${data.timebutler_promotion.cta_url}

TimeButler - Your professional time tracking solution for optimal work-life balance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We wish you relaxing vacation days!
Your TimeButler Team

PRIVACY & WITHDRAWAL:
This email was sent based on your consent according to GDPR Art. 6 para. 1 lit. a.

Withdraw consent: ${data.withdrawal_link}
Privacy Policy: https://timebutler.de/en/privacy

TimeButler GmbH
Musterstraße 123
80331 Munich, Germany
`;
  }

  /**
   * Record email delivery for tracking and analytics
   */
  private async recordEmailDelivery(
    vacationPlanId: string,
    email: string,
    language: LanguagePreference,
    status: EmailDeliveryStatus,
    metadata: any = {}
  ): Promise<EmailDeliveryRecord> {
    const deliveryId = crypto.randomUUID();

    // Hash email for privacy
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16);

    const record: EmailDeliveryRecord = {
      id: deliveryId,
      vacation_plan_id: vacationPlanId,
      email_address: emailHash,
      language,
      status,
      resend_email_id: metadata.resend_email_id,
      sent_at: new Date(),
      delivered_at: metadata.delivered_at,
      opened_at: metadata.opened_at,
      clicked_at: metadata.clicked_at,
      bounced_at: metadata.bounced_at,
      complaint_at: metadata.complaint_at,
      error_message: metadata.error,
      retry_count: 0,
      gdpr_consent_verified: status !== 'gdpr_blocked'
    };

    // Store in Redis with 90-day TTL (matching vacation plan retention)
    const ttl = 90 * 24 * 60 * 60; // 90 days in seconds
    await this.redis.setex(`email_delivery:${deliveryId}`, ttl, JSON.stringify(record));

    return record;
  }

  /**
   * Track email delivery status updates from webhooks
   */
  async trackEmailDelivery(emailId: string, status: EmailDeliveryStatus, metadata: any = {}): Promise<void> {
    // Find delivery record by Resend email ID
    const keys = await this.redis.keys('email_delivery:*');

    for (const key of keys) {
      const recordData = await this.redis.get(key);
      if (recordData) {
        const record: EmailDeliveryRecord = JSON.parse(recordData);
        if (record.resend_email_id === emailId) {
          // Update status and timestamp
          record.status = status;

          switch (status) {
            case 'delivered':
              record.delivered_at = new Date();
              this.analytics.total_delivered++;
              break;
            case 'opened':
              record.opened_at = new Date();
              break;
            case 'clicked':
              record.clicked_at = new Date();
              break;
            case 'bounced':
              record.bounced_at = new Date();
              this.analytics.total_bounced++;
              break;
            case 'complained':
              record.complaint_at = new Date();
              this.analytics.total_complaints++;
              break;
          }

          record.error_message = metadata.error;

          // Update record in Redis
          const ttl = await this.redis.ttl(key);
          await this.redis.setex(key, Math.max(ttl, 60), JSON.stringify(record));

          // Update analytics
          await this.updateAnalyticsCache();
          break;
        }
      }
    }
  }

  /**
   * Get current email delivery analytics
   */
  async getEmailAnalytics(): Promise<EmailAnalytics> {
    await this.loadAnalyticsFromCache();

    // Calculate success rate
    if (this.analytics.total_sent > 0) {
      this.analytics.success_rate = (this.analytics.total_delivered / this.analytics.total_sent) * 100;
    }

    return { ...this.analytics };
  }

  /**
   * Send test email for service verification
   */
  async sendTestEmail(toEmail: string, language: LanguagePreference = 'de'): Promise<boolean> {
    try {
      const subject = language === 'de' ?
        'TimeButler Kalender - Test E-Mail' :
        'TimeButler Calendar - Test Email';

      const html = language === 'de' ? `
        <h2>TimeButler Kalender Test</h2>
        <p>Diese Test-E-Mail bestätigt, dass der E-Mail-Service korrekt funktioniert.</p>
        <p>Powered by TimeButler - Ihre professionelle Zeiterfassungslösung</p>
      ` : `
        <h2>TimeButler Calendar Test</h2>
        <p>This test email confirms that the email service is working correctly.</p>
        <p>Powered by TimeButler - Your professional time tracking solution</p>
      `;

      const text = language === 'de' ?
        'TimeButler Kalender Test\n\nDiese Test-E-Mail bestätigt, dass der E-Mail-Service korrekt funktioniert.\n\nPowered by TimeButler - Ihre professionelle Zeiterfassungslösung' :
        'TimeButler Calendar Test\n\nThis test email confirms that the email service is working correctly.\n\nPowered by TimeButler - Your professional time tracking solution';

      const result = await this.resend.emails.send({
        from: `${this.config.from_name} <${this.config.from_email}>`,
        to: toEmail,
        subject: subject,
        html: html,
        text: text,
        tags: [
          {
            name: 'type',
            value: 'test'
          },
          {
            name: 'language',
            value: language
          }
        ]
      });

      return !!result.data?.id;
    } catch (error) {
      console.error('Test email failed:', error);
      return false;
    }
  }

  /**
   * Helper methods for date formatting and translation
   */
  private formatGermanDate(dateString: string): string {
    const date = DateTime.fromISO(dateString).setZone('Europe/Berlin');
    return date.toFormat('dd.MM.yyyy');
  }

  private formatEnglishDate(dateString: string): string {
    const date = DateTime.fromISO(dateString).setZone('Europe/Berlin');
    return date.toFormat('MMM dd, yyyy');
  }

  private translatePattern(pattern: string, language: LanguagePreference): string {
    const patterns: Record<string, Record<LanguagePreference, string>> = {
      'thursday-friday': {
        'de': 'Donnerstag-Freitag',
        'en': 'Thursday-Friday'
      },
      'monday-tuesday': {
        'de': 'Montag-Dienstag',
        'en': 'Monday-Tuesday'
      },
      'sandwich': {
        'de': 'Sandwich-Muster',
        'en': 'Sandwich Pattern'
      }
    };

    return patterns[pattern]?.[language] || pattern;
  }

  /**
   * Load analytics from cache
   */
  private async loadAnalyticsFromCache(): Promise<void> {
    try {
      const analyticsData = await this.redis.get('email_analytics');
      if (analyticsData) {
        this.analytics = { ...this.analytics, ...JSON.parse(analyticsData) };
      }
    } catch (error) {
      console.warn('Failed to load analytics from cache:', error);
    }
  }

  /**
   * Update analytics in cache
   */
  private async updateAnalyticsCache(): Promise<void> {
    try {
      await this.redis.setex('email_analytics', 24 * 60 * 60, JSON.stringify(this.analytics)); // 24 hour TTL
    } catch (error) {
      console.warn('Failed to update analytics cache:', error);
    }
  }

  /**
   * Placeholder methods for data access (to be implemented with actual data layer)
   */
  private async getVacationPlan(id: string): Promise<VacationPlan | null> {
    // In production, this would query the database
    // For now, return null to indicate not implemented
    return null;
  }

  private async getCalendarExport(id: string): Promise<CalendarExport | null> {
    // In production, this would query the database
    // For now, return null to indicate not implemented
    return null;
  }
}

/**
 * EmailService Factory for easy configuration
 */
export class EmailServiceFactory {
  /**
   * Create EmailService with production configuration
   */
  static createProductionService(redisClient: Redis): EmailService {
    const config: EmailServiceConfig = {
      resend_api_key: process.env.RESEND_API_KEY || '',
      from_email: process.env.EMAIL_FROM || 'calendar@timebutler.de',
      from_name: process.env.EMAIL_FROM_NAME || 'TimeButler Calendar',
      reply_to_email: process.env.EMAIL_REPLY_TO || 'support@timebutler.de',
      redis_client: redisClient,
      base_url: process.env.BASE_URL || 'https://calendar.timebutler.de',
      delivery_timeout: 30000, // 30 seconds
      max_retries: 3,
      success_rate_threshold: 95 // 95% minimum success rate
    };

    return new EmailService(config);
  }

  /**
   * Create EmailService with development configuration
   */
  static createDevelopmentService(redisClient: Redis): EmailService {
    const config: EmailServiceConfig = {
      resend_api_key: process.env.RESEND_API_KEY || 'test-key',
      from_email: 'test@timebutler.de',
      from_name: 'TimeButler Calendar (Test)',
      reply_to_email: 'test-support@timebutler.de',
      redis_client: redisClient,
      base_url: 'http://localhost:3000',
      delivery_timeout: 10000, // 10 seconds
      max_retries: 1,
      success_rate_threshold: 90 // 90% for development
    };

    return new EmailService(config);
  }
}

// Add crypto import at the top with other imports
const crypto = require('crypto');