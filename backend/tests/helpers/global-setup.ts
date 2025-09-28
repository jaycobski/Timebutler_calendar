/**
 * Global Test Setup for Backend Integration Tests
 * Initializes test environment, databases, and external services
 */

import { execSync } from 'child_process';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

// Global test containers
let postgresContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;
let emailContainer: StartedTestContainer;

async function globalSetup() {
  console.log('🚀 Starting Backend Integration Test Environment');

  // Start test containers if not in CI environment
  if (!process.env.CI) {
    try {
      console.log('🐳 Starting test containers...');

      // Start PostgreSQL container
      postgresContainer = await new GenericContainer('postgres:15-alpine')
        .withEnvironment({
          POSTGRES_DB: 'timebutler_calendar_test',
          POSTGRES_USER: 'test',
          POSTGRES_PASSWORD: 'test'
        })
        .withExposedPorts(5432)
        .withWaitStrategy('log', 'database system is ready to accept connections')
        .start();

      const postgresPort = postgresContainer.getMappedPort(5432);
      process.env.TEST_DATABASE_URL = `postgresql://test:test@localhost:${postgresPort}/timebutler_calendar_test`;

      // Start Redis container
      redisContainer = await new GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .withCommand(['redis-server', '--appendonly', 'yes'])
        .start();

      const redisPort = redisContainer.getMappedPort(6379);
      process.env.TEST_REDIS_URL = `redis://localhost:${redisPort}`;

      // Start MailHog container for email testing
      emailContainer = await new GenericContainer('mailhog/mailhog:latest')
        .withExposedPorts(1025, 8025)
        .start();

      const smtpPort = emailContainer.getMappedPort(1025);
      const webPort = emailContainer.getMappedPort(8025);
      process.env.TEST_SMTP_PORT = smtpPort.toString();
      process.env.TEST_EMAIL_WEB_URL = `http://localhost:${webPort}`;

      console.log('✅ Test containers started successfully');
      console.log(`📊 PostgreSQL: localhost:${postgresPort}`);
      console.log(`🔄 Redis: localhost:${redisPort}`);
      console.log(`📧 MailHog: localhost:${webPort}`);

    } catch (error) {
      console.warn('⚠️ Could not start test containers, using environment defaults:', error.message);
      process.env.TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/timebutler_calendar_test';
      process.env.TEST_REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
    }
  } else {
    console.log('🔧 CI environment detected, using provided services');
  }

  // Setup test database schema
  try {
    console.log('📊 Setting up test database schema...');
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const client = await pool.connect();

    // Create test schema
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS test_timebutler;
      SET search_path TO test_timebutler;
    `);

    // Create holidays table
    await client.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR PRIMARY KEY,
        key VARCHAR NOT NULL,
        name_de VARCHAR NOT NULL,
        name_en VARCHAR NOT NULL,
        date DATE NOT NULL,
        year INTEGER NOT NULL,
        state VARCHAR(3) NOT NULL,
        is_federal BOOLEAN NOT NULL,
        type VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(key, state, year)
      );
    `);

    // Create bridge_weekends table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bridge_weekends (
        id VARCHAR PRIMARY KEY,
        holiday_id VARCHAR NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        vacation_days_needed INTEGER NOT NULL,
        total_days_off INTEGER NOT NULL,
        efficiency DECIMAL NOT NULL,
        pattern VARCHAR NOT NULL,
        quality_score INTEGER NOT NULL,
        popularity_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (holiday_id) REFERENCES holidays(id)
      );
    `);

    // Create vacation_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacation_plans (
        id VARCHAR PRIMARY KEY,
        state VARCHAR(2) NOT NULL,
        vacation_days INTEGER NOT NULL,
        selected_bridges JSONB NOT NULL,
        language VARCHAR(2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        email_sent_at TIMESTAMP,
        export_url VARCHAR,
        gdpr_consent BOOLEAN DEFAULT FALSE,
        privacy_notice_version VARCHAR,
        consent_timestamp TIMESTAMP
      );
    `);

    // Create email_logs table for testing
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR PRIMARY KEY,
        to_email VARCHAR NOT NULL,
        from_email VARCHAR NOT NULL,
        subject VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW(),
        plan_id VARCHAR,
        resend_id VARCHAR,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        FOREIGN KEY (plan_id) REFERENCES vacation_plans(id)
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_holidays_state_year ON holidays(state, year);
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
      CREATE INDEX IF NOT EXISTS idx_bridge_weekends_efficiency ON bridge_weekends(efficiency DESC);
      CREATE INDEX IF NOT EXISTS idx_vacation_plans_created_at ON vacation_plans(created_at);
      CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
    `);

    client.release();
    await pool.end();
    console.log('✅ Test database schema created successfully');

  } catch (error) {
    console.warn('⚠️ Database setup failed (may not be available):', error.message);
  }

  // Setup test Redis cache
  try {
    console.log('🔄 Setting up test Redis cache...');
    const redis = new Redis(process.env.TEST_REDIS_URL);

    // Clear any existing test data
    await redis.flushdb();

    // Set up test cache keys
    await redis.set('test:setup', 'completed');
    await redis.expire('test:setup', 3600); // Expire in 1 hour

    await redis.quit();
    console.log('✅ Test Redis cache setup completed');

  } catch (error) {
    console.warn('⚠️ Redis setup failed (may not be available):', error.message);
  }

  // Load test data
  try {
    console.log('📝 Loading German holiday test data...');

    // This would typically load from official German government sources
    // For testing, we use predefined accurate data
    const testHolidays = [
      // 2025 Federal Holidays
      { id: 'neujahr-2025', key: 'neujahr', name_de: 'Neujahr', name_en: 'New Year\'s Day', date: '2025-01-01', year: 2025, state: 'ALL', is_federal: true, type: 'secular' },
      { id: 'karfreitag-2025', key: 'karfreitag', name_de: 'Karfreitag', name_en: 'Good Friday', date: '2025-04-18', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },
      { id: 'ostermontag-2025', key: 'ostermontag', name_de: 'Ostermontag', name_en: 'Easter Monday', date: '2025-04-21', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },
      { id: 'tag_der_arbeit-2025', key: 'tag_der_arbeit', name_de: 'Tag der Arbeit', name_en: 'Labour Day', date: '2025-05-01', year: 2025, state: 'ALL', is_federal: true, type: 'secular' },
      { id: 'christi_himmelfahrt-2025', key: 'christi_himmelfahrt', name_de: 'Christi Himmelfahrt', name_en: 'Ascension Day', date: '2025-05-29', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },
      { id: 'pfingstmontag-2025', key: 'pfingstmontag', name_de: 'Pfingstmontag', name_en: 'Whit Monday', date: '2025-06-09', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },
      { id: 'tag_der_deutschen_einheit-2025', key: 'tag_der_deutschen_einheit', name_de: 'Tag der Deutschen Einheit', name_en: 'German Unity Day', date: '2025-10-03', year: 2025, state: 'ALL', is_federal: true, type: 'national' },
      { id: 'weihnachtstag-2025', key: 'weihnachtstag', name_de: '1. Weihnachtstag', name_en: 'Christmas Day', date: '2025-12-25', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },
      { id: 'zweiter_weihnachtstag-2025', key: 'zweiter_weihnachtstag', name_de: '2. Weihnachtstag', name_en: 'Boxing Day', date: '2025-12-26', year: 2025, state: 'ALL', is_federal: true, type: 'religious' },

      // State-specific holidays (sample for Bavaria)
      { id: 'heilige_drei_koenige-BY-2025', key: 'heilige_drei_koenige', name_de: 'Heilige Drei Könige', name_en: 'Epiphany', date: '2025-01-06', year: 2025, state: 'BY', is_federal: false, type: 'religious' },
      { id: 'fronleichnam-BY-2025', key: 'fronleichnam', name_de: 'Fronleichnam', name_en: 'Corpus Christi', date: '2025-06-19', year: 2025, state: 'BY', is_federal: false, type: 'religious' },
      { id: 'mariae_himmelfahrt-BY-2025', key: 'mariae_himmelfahrt', name_de: 'Mariä Himmelfahrt', name_en: 'Assumption of Mary', date: '2025-08-15', year: 2025, state: 'BY', is_federal: false, type: 'religious' },
      { id: 'allerheiligen-BY-2025', key: 'allerheiligen', name_de: 'Allerheiligen', name_en: 'All Saints\' Day', date: '2025-11-01', year: 2025, state: 'BY', is_federal: false, type: 'religious' }
    ];

    // Store test data in environment variable for tests to use
    process.env.TEST_HOLIDAY_DATA = JSON.stringify(testHolidays);

    console.log('✅ Test data loaded successfully');

  } catch (error) {
    console.warn('⚠️ Test data loading failed:', error.message);
  }

  // Set global test timeouts
  jest.setTimeout(30000); // 30 seconds for integration tests

  console.log('🎯 Backend integration test environment ready');
  console.log('📊 Database:', process.env.TEST_DATABASE_URL ? '✅' : '❌');
  console.log('🔄 Redis:', process.env.TEST_REDIS_URL ? '✅' : '❌');
  console.log('📧 Email:', process.env.TEST_SMTP_PORT ? '✅' : '❌');
}

export default globalSetup;