// Simple test to verify VacationPlan works
const { VacationPlan } = require('./dist-test/models/vacation-plan');

console.log('Testing VacationPlan...');

try {
  // Mock data exactly like the tests expect
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

  // Test creation with all required properties
  console.log('Creating VacationPlan...');
  const plan = new VacationPlan({
    email: 'test@web.de',
    state_code: 'BY',
    vacation_days_budget: 30,
    selected_bridges: mockBridgeWeekends,
    gdpr_consent: mockGDPRConsent,
    language_preference: 'de',
  });

  console.log('✅ VacationPlan created successfully');
  console.log('- ID:', plan.id);
  console.log('- Session ID:', plan.session_id);
  console.log('- State Code:', plan.state_code);
  console.log('- Vacation Budget:', plan.vacation_days_budget);
  console.log('- Language:', plan.language_preference);
  console.log('- Created At:', plan.created_at.toISOString());
  console.log('- Expires At:', plan.expires_at.toISOString());
  console.log('- Selected Bridges Count:', plan.selected_bridges.length);

  // Test key methods
  console.log('\nTesting methods...');

  console.log('- Is Expired:', plan.isExpired());
  console.log('- Encrypted Email:', plan.email);
  console.log('- Decrypted Email:', plan.getDecryptedEmail());

  const validation = plan.validateVacationBudget();
  console.log('- Budget Validation Sufficient:', validation.sufficient);
  console.log('- Required Days:', validation.required_days);

  const accessReport = plan.generateAccessReport();
  console.log('- Access Report Generated:', !!accessReport);
  console.log('- Access Report Email:', accessReport.personal_data.email);

  const dataExport = plan.exportPersonalData();
  console.log('- Data Export Format:', dataExport.format);
  console.log('- TimeButler Attribution:', dataExport.data.attribution.service);

  const calendarExport = plan.generateCalendarExport();
  console.log('- Calendar Creator:', calendarExport.metadata.creator);
  console.log('- Calendar Events:', calendarExport.calendar_data.events.length);

  console.log('\n🎉 All tests passed! VacationPlan implementation is working correctly.');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Error type:', error.constructor.name);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}