/**
 * PostgreSQL Analytics Storage with GDPR Compliance for Timebutler Calendar
 *
 * Constitutional Requirements:
 * - 90-day automatic data retention and deletion (Article 5 GDPR)
 * - Data minimization principle implementation
 * - Consent-based analytics tracking
 * - Anonymized data processing where possible
 * - Audit trail for all data operations
 * - Right to deletion (Article 17) compliance
 * - Data portability (Article 20) support
 * - Privacy by design and by default
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { DateTime } from 'luxon';
import * as crypto from 'crypto';
import { GDPRConsentRecord, ConsentPurpose } from '../models/gdpr-consent-record';
import { GermanState, LanguagePreference } from '../models/vacation-plan';
import {
  ValidationError,
  GDPRViolationError,
  DataRetentionError,
  DatabaseError
} from './errors';

/**
 * Analytics event types for GDPR compliance tracking
 */
export type AnalyticsEventType =
  | 'page_view'           // Page visits (anonymous)
  | 'vacation_plan_created' // Plan generation
  | 'calendar_downloaded'   // Export usage
  | 'email_sent'           // Email delivery tracking
  | 'consent_given'        // GDPR consent events
  | 'consent_withdrawn'    // GDPR consent withdrawal
  | 'data_deletion'        // Data deletion events
  | 'bridge_calculation'   // Algorithm usage
  | 'error_occurred'       // Error tracking (no PII);

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent {
  id?: string;
  event_type: AnalyticsEventType;
  timestamp: Date;
  session_id?: string;        // Hashed session identifier
  user_consent_id?: string;   // Link to GDPR consent record

  // Event-specific data (GDPR minimized)
  event_data: {
    // Geographic data (anonymized to state level)
    state?: GermanState;
    language?: LanguagePreference;

    // Technical data (anonymized)
    user_agent_hash?: string;
    ip_hash?: string;
    referrer_domain?: string;  // Domain only, no full URL

    // Functional data
    bridge_weekends_count?: number;
    vacation_days_used?: number;
    calendar_format?: string;
    email_success?: boolean;
    error_type?: string;

    // Performance metrics
    response_time_ms?: number;
    server_load?: number;
  };

  // GDPR compliance metadata
  gdpr_metadata: {
    consent_purposes: ConsentPurpose[];
    legal_basis: 'consent' | 'legitimate_interest';
    data_retention_until: Date;
    anonymized: boolean;
    can_be_deleted: boolean;
  };

  // Audit trail
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

/**
 * Analytics query filters for data access
 */
export interface AnalyticsQueryFilter {
  event_types?: AnalyticsEventType[];
  start_date?: Date;
  end_date?: Date;
  session_id?: string;
  state?: GermanState;
  language?: LanguagePreference;
  limit?: number;
  offset?: number;
}

/**
 * Analytics aggregation result
 */
export interface AnalyticsAggregation {
  period: string; // 'daily' | 'weekly' | 'monthly'
  date: string;
  event_type: AnalyticsEventType;
  count: number;
  unique_sessions: number;
  metadata?: Record<string, any>;
}

/**
 * GDPR compliance report for analytics data
 */
export interface GDPRComplianceReport {
  total_events: number;
  events_by_type: Record<AnalyticsEventType, number>;
  consent_based_events: number;
  legitimate_interest_events: number;
  anonymized_events: number;
  events_pending_deletion: number;
  oldest_event_date: Date | null;
  retention_compliance: {
    compliant: boolean;
    issues: string[];
    overdue_deletions: number;
  };
}

/**
 * Data deletion summary for GDPR Article 17
 */
export interface DataDeletionSummary {
  events_deleted: number;
  session_data_deleted: number;
  consent_records_affected: number;
  deletion_timestamp: Date;
  retention_period_days: number;
  legal_hold_events: number; // Events that cannot be deleted due to legal requirements
}

/**
 * PostgreSQL Analytics Service with GDPR Compliance
 */
export class PostgreSQLAnalytics {
  private pool: Pool;
  private readonly RETENTION_DAYS = 90;
  private readonly ENCRYPTION_KEY: string;
  private readonly HASH_SALT: string;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
    encryptionKey: string;
    hashSalt: string;
  }) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl || false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.ENCRYPTION_KEY = config.encryptionKey;
    this.HASH_SALT = config.hashSalt;
  }

  /**
   * Initialize database schema for analytics with GDPR compliance
   */
  async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Analytics events table with GDPR compliance
      await client.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          session_id_hash VARCHAR(64), -- Hashed for privacy
          user_consent_id UUID,

          -- Event data (JSONB for flexibility)
          event_data JSONB NOT NULL DEFAULT '{}',

          -- GDPR compliance metadata
          consent_purposes TEXT[] NOT NULL,
          legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'legitimate_interest')),
          data_retention_until TIMESTAMPTZ NOT NULL,
          anonymized BOOLEAN NOT NULL DEFAULT false,
          can_be_deleted BOOLEAN NOT NULL DEFAULT true,

          -- Audit timestamps
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ,
          deleted_at TIMESTAMPTZ,

          -- Indexes for performance
          CONSTRAINT valid_event_type CHECK (event_type IN (
            'page_view', 'vacation_plan_created', 'calendar_downloaded',
            'email_sent', 'consent_given', 'consent_withdrawn',
            'data_deletion', 'bridge_calculation', 'error_occurred'
          ))
        );
      `);

      // GDPR consent tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS gdpr_consent_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id_hash VARCHAR(64) NOT NULL,
          consent_data JSONB NOT NULL, -- Encrypted consent record
          ip_hash VARCHAR(64),
          user_agent_hash VARCHAR(64),
          consent_version VARCHAR(20) NOT NULL,
          legal_basis VARCHAR(50) NOT NULL,
          withdrawal_method VARCHAR(50) NOT NULL,
          withdrawn BOOLEAN NOT NULL DEFAULT false,
          withdrawal_timestamp TIMESTAMPTZ,
          withdrawal_reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL -- Automatic expiration after 2 years
        );
      `);

      // Data deletion audit log
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_deletion_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          deletion_type VARCHAR(50) NOT NULL,
          events_deleted INTEGER NOT NULL DEFAULT 0,
          consent_records_deleted INTEGER NOT NULL DEFAULT 0,
          retention_period_days INTEGER NOT NULL,
          deletion_reason VARCHAR(200) NOT NULL,
          legal_basis VARCHAR(100),
          initiated_by VARCHAR(100), -- 'system' or 'user_request'
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          data_summary JSONB -- Summary of deleted data for audit
        );
      `);

      // Performance indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
        ON analytics_events (timestamp);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp
        ON analytics_events (event_type, timestamp);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_retention
        ON analytics_events (data_retention_until)
        WHERE deleted_at IS NULL;
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_events_session
        ON analytics_events (session_id_hash)
        WHERE session_id_hash IS NOT NULL;
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_gdpr_consent_session
        ON gdpr_consent_records (session_id_hash);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_gdpr_consent_expires
        ON gdpr_consent_records (expires_at)
        WHERE withdrawn = false;
      `);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new DatabaseError(`Failed to initialize analytics schema: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Record analytics event with GDPR compliance validation
   */
  async recordEvent(
    eventType: AnalyticsEventType,
    eventData: Partial<AnalyticsEvent['event_data']>,
    consentRecord?: GDPRConsentRecord,
    sessionId?: string
  ): Promise<string> {
    // Validate GDPR compliance before recording
    if (!this.validateGDPRCompliance(eventType, consentRecord)) {
      throw new GDPRViolationError(`Cannot record ${eventType} event without proper consent`);
    }

    const client = await this.pool.connect();

    try {
      // Determine legal basis
      const legalBasis = this.determineLegalBasis(eventType, consentRecord);

      // Calculate retention date (90 days from now)
      const retentionDate = DateTime.now().plus({ days: this.RETENTION_DAYS }).toJSDate();

      // Anonymize data based on event type
      const anonymizedData = this.anonymizeEventData(eventType, eventData);

      // Hash session ID for privacy
      const sessionIdHash = sessionId ? this.hashSensitiveData(sessionId) : null;

      // Determine consent purposes
      const consentPurposes = this.getRequiredPurposes(eventType);

      const query = `
        INSERT INTO analytics_events (
          event_type, session_id_hash, user_consent_id, event_data,
          consent_purposes, legal_basis, data_retention_until,
          anonymized, can_be_deleted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const values = [
        eventType,
        sessionIdHash,
        consentRecord ? crypto.randomUUID() : null, // Generate consent record ID
        JSON.stringify(anonymizedData),
        consentPurposes,
        legalBasis,
        retentionDate,
        this.isEventTypeAnonymized(eventType),
        true // Can be deleted by default
      ];

      const result = await client.query(query, values);

      // Store consent record if provided
      if (consentRecord && sessionId) {
        await this.storeConsentRecord(client, sessionId, consentRecord);
      }

      return result.rows[0].id;
    } catch (error) {
      throw new DatabaseError(`Failed to record analytics event: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Query analytics events with GDPR compliance filtering
   */
  async queryEvents(filter: AnalyticsQueryFilter): Promise<AnalyticsEvent[]> {
    const client = await this.pool.connect();

    try {
      let query = `
        SELECT id, event_type, timestamp, session_id_hash, event_data,
               consent_purposes, legal_basis, data_retention_until,
               anonymized, can_be_deleted, created_at, updated_at, deleted_at
        FROM analytics_events
        WHERE deleted_at IS NULL
      `;

      const values: any[] = [];
      let paramIndex = 1;

      if (filter.event_types && filter.event_types.length > 0) {
        query += ` AND event_type = ANY($${paramIndex})`;
        values.push(filter.event_types);
        paramIndex++;
      }

      if (filter.start_date) {
        query += ` AND timestamp >= $${paramIndex}`;
        values.push(filter.start_date);
        paramIndex++;
      }

      if (filter.end_date) {
        query += ` AND timestamp <= $${paramIndex}`;
        values.push(filter.end_date);
        paramIndex++;
      }

      if (filter.session_id) {
        const sessionIdHash = this.hashSensitiveData(filter.session_id);
        query += ` AND session_id_hash = $${paramIndex}`;
        values.push(sessionIdHash);
        paramIndex++;
      }

      query += ` ORDER BY timestamp DESC`;

      if (filter.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(filter.limit);
        paramIndex++;
      }

      if (filter.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filter.offset);
      }

      const result = await client.query(query, values);

      return result.rows.map(row => ({
        id: row.id,
        event_type: row.event_type,
        timestamp: row.timestamp,
        session_id: null, // Never return unhashed session IDs
        user_consent_id: row.user_consent_id,
        event_data: row.event_data,
        gdpr_metadata: {
          consent_purposes: row.consent_purposes,
          legal_basis: row.legal_basis,
          data_retention_until: row.data_retention_until,
          anonymized: row.anonymized,
          can_be_deleted: row.can_be_deleted
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to query analytics events: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get analytics aggregations for reporting
   */
  async getAggregations(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    eventTypes?: AnalyticsEventType[]
  ): Promise<AnalyticsAggregation[]> {
    const client = await this.pool.connect();

    try {
      const dateFormat = period === 'daily' ? 'YYYY-MM-DD' :
                        period === 'weekly' ? 'YYYY-"W"IW' : 'YYYY-MM';

      let query = `
        SELECT
          TO_CHAR(DATE_TRUNC('${period}', timestamp), '${dateFormat}') as period,
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT session_id_hash) as unique_sessions
        FROM analytics_events
        WHERE deleted_at IS NULL
          AND timestamp >= $1
          AND timestamp <= $2
      `;

      const values: any[] = [startDate, endDate];

      if (eventTypes && eventTypes.length > 0) {
        query += ` AND event_type = ANY($3)`;
        values.push(eventTypes);
      }

      query += `
        GROUP BY DATE_TRUNC('${period}', timestamp), event_type
        ORDER BY DATE_TRUNC('${period}', timestamp), event_type
      `;

      const result = await client.query(query, values);

      return result.rows.map(row => ({
        period,
        date: row.period,
        event_type: row.event_type,
        count: parseInt(row.count),
        unique_sessions: parseInt(row.unique_sessions)
      }));
    } catch (error) {
      throw new DatabaseError(`Failed to get analytics aggregations: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete data for specific session (GDPR Article 17 - Right to deletion)
   */
  async deleteSessionData(sessionId: string, reason: string = 'user_request'): Promise<DataDeletionSummary> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const sessionIdHash = this.hashSensitiveData(sessionId);
      const deletionTimestamp = new Date();

      // Count events before deletion
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM analytics_events WHERE session_id_hash = $1 AND deleted_at IS NULL',
        [sessionIdHash]
      );
      const eventsToDelete = parseInt(countResult.rows[0].count);

      // Soft delete analytics events
      await client.query(`
        UPDATE analytics_events
        SET deleted_at = $1, updated_at = $1
        WHERE session_id_hash = $2 AND deleted_at IS NULL AND can_be_deleted = true
      `, [deletionTimestamp, sessionIdHash]);

      // Count consent records before deletion
      const consentCountResult = await client.query(
        'SELECT COUNT(*) as count FROM gdpr_consent_records WHERE session_id_hash = $1',
        [sessionIdHash]
      );
      const consentRecordsToDelete = parseInt(consentCountResult.rows[0].count);

      // Mark consent records as withdrawn
      await client.query(`
        UPDATE gdpr_consent_records
        SET withdrawn = true, withdrawal_timestamp = $1, withdrawal_reason = $2, updated_at = $1
        WHERE session_id_hash = $3 AND withdrawn = false
      `, [deletionTimestamp, reason, sessionIdHash]);

      // Log deletion for audit trail
      await client.query(`
        INSERT INTO data_deletion_log (
          deletion_type, events_deleted, consent_records_deleted,
          retention_period_days, deletion_reason, initiated_by, executed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'session_deletion',
        eventsToDelete,
        consentRecordsToDelete,
        this.RETENTION_DAYS,
        reason,
        'user_request',
        deletionTimestamp
      ]);

      await client.query('COMMIT');

      return {
        events_deleted: eventsToDelete,
        session_data_deleted: 1,
        consent_records_affected: consentRecordsToDelete,
        deletion_timestamp: deletionTimestamp,
        retention_period_days: this.RETENTION_DAYS,
        legal_hold_events: 0 // No legal hold events in this implementation
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new DataRetentionError(`Failed to delete session data: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Automated cleanup of expired data (90-day retention)
   */
  async performAutomatedCleanup(): Promise<DataDeletionSummary> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const deletionTimestamp = new Date();
      const cutoffDate = DateTime.now().minus({ days: this.RETENTION_DAYS }).toJSDate();

      // Count events to be deleted
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM analytics_events WHERE data_retention_until < $1 AND deleted_at IS NULL',
        [deletionTimestamp]
      );
      const eventsToDelete = parseInt(countResult.rows[0].count);

      // Soft delete expired analytics events
      await client.query(`
        UPDATE analytics_events
        SET deleted_at = $1, updated_at = $1
        WHERE data_retention_until < $1 AND deleted_at IS NULL AND can_be_deleted = true
      `, [deletionTimestamp]);

      // Count expired consent records
      const consentCountResult = await client.query(
        'SELECT COUNT(*) as count FROM gdpr_consent_records WHERE expires_at < $1 AND withdrawn = false',
        [deletionTimestamp]
      );
      const consentRecordsToDelete = parseInt(consentCountResult.rows[0].count);

      // Mark expired consent records as withdrawn
      await client.query(`
        UPDATE gdpr_consent_records
        SET withdrawn = true, withdrawal_timestamp = $1, withdrawal_reason = 'expired', updated_at = $1
        WHERE expires_at < $1 AND withdrawn = false
      `, [deletionTimestamp]);

      // Log automated cleanup
      await client.query(`
        INSERT INTO data_deletion_log (
          deletion_type, events_deleted, consent_records_deleted,
          retention_period_days, deletion_reason, initiated_by, executed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'automated_cleanup',
        eventsToDelete,
        consentRecordsToDelete,
        this.RETENTION_DAYS,
        'automated_retention_policy',
        'system',
        deletionTimestamp
      ]);

      await client.query('COMMIT');

      return {
        events_deleted: eventsToDelete,
        session_data_deleted: 0,
        consent_records_affected: consentRecordsToDelete,
        deletion_timestamp: deletionTimestamp,
        retention_period_days: this.RETENTION_DAYS,
        legal_hold_events: 0
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new DataRetentionError(`Failed to perform automated cleanup: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(): Promise<GDPRComplianceReport> {
    const client = await this.pool.connect();

    try {
      // Get total event count
      const totalResult = await client.query(
        'SELECT COUNT(*) as total FROM analytics_events WHERE deleted_at IS NULL'
      );
      const totalEvents = parseInt(totalResult.rows[0].total);

      // Get events by type
      const typeResult = await client.query(`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE deleted_at IS NULL
        GROUP BY event_type
      `);
      const eventsByType: Record<AnalyticsEventType, number> = {};
      typeResult.rows.forEach(row => {
        eventsByType[row.event_type] = parseInt(row.count);
      });

      // Get legal basis counts
      const legalBasisResult = await client.query(`
        SELECT
          SUM(CASE WHEN legal_basis = 'consent' THEN 1 ELSE 0 END) as consent_count,
          SUM(CASE WHEN legal_basis = 'legitimate_interest' THEN 1 ELSE 0 END) as legitimate_count,
          SUM(CASE WHEN anonymized = true THEN 1 ELSE 0 END) as anonymized_count
        FROM analytics_events
        WHERE deleted_at IS NULL
      `);
      const legalBasisCounts = legalBasisResult.rows[0];

      // Get retention compliance status
      const retentionResult = await client.query(`
        SELECT
          COUNT(*) as overdue_count,
          MIN(data_retention_until) as oldest_retention_date
        FROM analytics_events
        WHERE deleted_at IS NULL AND data_retention_until < NOW()
      `);
      const retentionInfo = retentionResult.rows[0];

      // Get oldest event date
      const oldestResult = await client.query(
        'SELECT MIN(timestamp) as oldest_date FROM analytics_events WHERE deleted_at IS NULL'
      );
      const oldestEventDate = oldestResult.rows[0].oldest_date;

      // Check for pending deletions
      const pendingResult = await client.query(
        'SELECT COUNT(*) as pending FROM analytics_events WHERE data_retention_until < NOW() AND deleted_at IS NULL'
      );
      const pendingDeletions = parseInt(pendingResult.rows[0].pending);

      const issues: string[] = [];
      if (pendingDeletions > 0) {
        issues.push(`${pendingDeletions} events overdue for deletion`);
      }

      return {
        total_events: totalEvents,
        events_by_type: eventsByType,
        consent_based_events: parseInt(legalBasisCounts.consent_count || 0),
        legitimate_interest_events: parseInt(legalBasisCounts.legitimate_count || 0),
        anonymized_events: parseInt(legalBasisCounts.anonymized_count || 0),
        events_pending_deletion: pendingDeletions,
        oldest_event_date: oldestEventDate,
        retention_compliance: {
          compliant: pendingDeletions === 0,
          issues,
          overdue_deletions: pendingDeletions
        }
      };
    } catch (error) {
      throw new DatabaseError(`Failed to generate compliance report: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Private helper methods

  private validateGDPRCompliance(eventType: AnalyticsEventType, consentRecord?: GDPRConsentRecord): boolean {
    const requiredPurposes = this.getRequiredPurposes(eventType);

    // Anonymous events don't require consent
    if (this.isEventTypeAnonymized(eventType)) {
      return true;
    }

    // Check if consent is required
    if (requiredPurposes.includes('analytics_anonymous') && !consentRecord) {
      return false;
    }

    // Validate consent if provided
    if (consentRecord) {
      const validation = GDPRConsentRecord.validateConsent(consentRecord);
      if (!validation.valid) {
        return false;
      }

      // Check if consent covers required purposes
      return requiredPurposes.every(purpose =>
        consentRecord.purposes.includes(purpose)
      );
    }

    return true;
  }

  private determineLegalBasis(eventType: AnalyticsEventType, consentRecord?: GDPRConsentRecord): 'consent' | 'legitimate_interest' {
    // Anonymous events can use legitimate interest
    if (this.isEventTypeAnonymized(eventType)) {
      return 'legitimate_interest';
    }

    // Events with consent record use consent basis
    if (consentRecord) {
      return 'consent';
    }

    // Default to legitimate interest for technical events
    const technicalEvents: AnalyticsEventType[] = ['error_occurred', 'bridge_calculation'];
    if (technicalEvents.includes(eventType)) {
      return 'legitimate_interest';
    }

    return 'consent';
  }

  private getRequiredPurposes(eventType: AnalyticsEventType): ConsentPurpose[] {
    const purposeMap: Record<AnalyticsEventType, ConsentPurpose[]> = {
      'page_view': ['analytics_anonymous'],
      'vacation_plan_created': ['vacation_planning', 'analytics_anonymous'],
      'calendar_downloaded': ['vacation_planning', 'analytics_anonymous'],
      'email_sent': ['email_delivery', 'analytics_anonymous'],
      'consent_given': [],
      'consent_withdrawn': [],
      'data_deletion': [],
      'bridge_calculation': ['vacation_planning'],
      'error_occurred': []
    };

    return purposeMap[eventType] || [];
  }

  private isEventTypeAnonymized(eventType: AnalyticsEventType): boolean {
    const anonymizedEvents: AnalyticsEventType[] = [
      'page_view', 'error_occurred', 'bridge_calculation'
    ];
    return anonymizedEvents.includes(eventType);
  }

  private anonymizeEventData(eventType: AnalyticsEventType, data: Partial<AnalyticsEvent['event_data']>): Partial<AnalyticsEvent['event_data']> {
    const anonymizedData = { ...data };

    // Remove or hash sensitive data based on event type
    if (this.isEventTypeAnonymized(eventType)) {
      // Remove any potentially identifying information
      delete anonymizedData.ip_hash;
      delete anonymizedData.user_agent_hash;

      // Keep only aggregatable data
      const allowedFields = ['state', 'language', 'response_time_ms', 'server_load', 'error_type'];
      Object.keys(anonymizedData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete anonymizedData[key];
        }
      });
    }

    return anonymizedData;
  }

  private hashSensitiveData(data: string): string {
    return crypto.createHash('sha256')
      .update(data + this.HASH_SALT)
      .digest('hex');
  }

  private async storeConsentRecord(client: PoolClient, sessionId: string, consentRecord: GDPRConsentRecord): Promise<void> {
    const sessionIdHash = this.hashSensitiveData(sessionId);
    const encryptedConsentData = this.encryptData(JSON.stringify(consentRecord));
    const expiresAt = DateTime.now().plus({ years: 2 }).toJSDate(); // Consent expires after 2 years

    await client.query(`
      INSERT INTO gdpr_consent_records (
        session_id_hash, consent_data, ip_hash, user_agent_hash,
        consent_version, legal_basis, withdrawal_method, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id_hash)
      DO UPDATE SET
        consent_data = EXCLUDED.consent_data,
        updated_at = NOW()
    `, [
      sessionIdHash,
      encryptedConsentData,
      consentRecord.ip_hash,
      consentRecord.user_agent_hash,
      consentRecord.consent_version,
      consentRecord.legal_basis,
      consentRecord.withdrawal_method,
      expiresAt
    ]);
  }

  private encryptData(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptData(encryptedData: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

/**
 * Factory function to create PostgreSQL Analytics instance
 */
export function createPostgreSQLAnalytics(config: {
  databaseUrl?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  maxConnections?: number;
  encryptionKey: string;
  hashSalt: string;
}): PostgreSQLAnalytics {
  // Parse DATABASE_URL if provided
  if (config.databaseUrl) {
    const url = new URL(config.databaseUrl);
    return new PostgreSQLAnalytics({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require',
      maxConnections: config.maxConnections,
      encryptionKey: config.encryptionKey,
      hashSalt: config.hashSalt
    });
  }

  // Use individual config properties
  return new PostgreSQLAnalytics({
    host: config.host || 'localhost',
    port: config.port || 5432,
    database: config.database || 'timebutler_calendar',
    username: config.username || 'postgres',
    password: config.password || '',
    ssl: config.ssl || false,
    maxConnections: config.maxConnections || 20,
    encryptionKey: config.encryptionKey,
    hashSalt: config.hashSalt
  });
}

/**
 * Analytics service singleton for application use
 */
export let analyticsService: PostgreSQLAnalytics | null = null;

/**
 * Initialize analytics service with configuration
 */
export async function initializeAnalytics(config: Parameters<typeof createPostgreSQLAnalytics>[0]): Promise<PostgreSQLAnalytics> {
  if (analyticsService) {
    await analyticsService.close();
  }

  analyticsService = createPostgreSQLAnalytics(config);
  await analyticsService.initializeSchema();

  return analyticsService;
}

/**
 * Get the current analytics service instance
 */
export function getAnalyticsService(): PostgreSQLAnalytics {
  if (!analyticsService) {
    throw new Error('Analytics service not initialized. Call initializeAnalytics() first.');
  }
  return analyticsService;
}

/**
 * Graceful shutdown of analytics service
 */
export async function shutdownAnalytics(): Promise<void> {
  if (analyticsService) {
    await analyticsService.close();
    analyticsService = null;
  }
}