// Simple test runner to verify VacationPlan implementation
const { VacationPlan } = require('./dist/src/models/vacation-plan');
const { GDPRConsentRecord } = require('./dist/src/models/gdpr-consent-record');

console.log('Testing VacationPlan implementation...');

try {
  // Mock GDPR consent record
  const mockGDPRConsent = {
    timestamp: new Date(),
    ip_hash: 'hashed-ip-address',
    user_agent_hash: 'hashed-user-agent',
    consent_version: '1.1.0',
    purposes: ['vacation_planning', 'email_delivery', 'analytics_anonymous'],
    legal_basis: 'consent',
    source: 'vacation_form',
    withdrawal_method: 'email_link',
  };

  // Mock bridge weekends
  const mockBridgeWeekends = [
    {
      id: 'bridge-1',
      holiday_id: 'neujahr-2025',
      start_date: '2025-01-01',
      end_date: '2025-01-05',
      vacation_days_needed: 2,
      total_days_off: 5,
      efficiency: 2.5,
      pattern: 'thursday-friday',
    }
  ];

  // Test basic creation
  const plan = new VacationPlan({
    email: 'test@web.de',
    state_code: 'BY',
    vacation_days_budget: 30,
    selected_bridges: mockBridgeWeekends,
    gdpr_consent: mockGDPRConsent,
    language_preference: 'de',
  });

  console.log('✅ VacationPlan created successfully');
  console.log('ID:', plan.id);
  console.log('Session ID:', plan.session_id);
  console.log('State:', plan.state_code);
  console.log('Budget:', plan.vacation_days_budget);
  console.log('Language:', plan.language_preference);
  console.log('Expires at:', plan.expires_at);

  // Test email decryption
  const decryptedEmail = plan.getDecryptedEmail();
  console.log('✅ Email decryption works:', decryptedEmail);

  // Test expiration check
  console.log('✅ Expiration check:', plan.isExpired() ? 'EXPIRED' : 'ACTIVE');

  // Test access report
  const accessReport = plan.generateAccessReport();
  console.log('✅ Access report generated with', Object.keys(accessReport).length, 'sections');

  // Test data export
  const dataExport = plan.exportPersonalData();
  console.log('✅ Data export generated in', dataExport.format, 'format');

  console.log('\n🎉 All basic tests passed! VacationPlan implementation is working.');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}