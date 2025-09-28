# Tasks: Timebutler Calendar MVP with Specialized Subagent Assignments

**Input**: Design documents from `/Users/jakubszyszka/Downloads/Timebutler_calendar/specs/001-please-now-break/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

## Subagent Roster

### Domain Specialists
- **GH**: `german-holiday-expert` - German holiday data and calculations
- **BC**: `bridge-calculator-expert` - Bridge weekend optimization algorithms
- **GC**: `gdpr-compliance-expert` - GDPR compliance and data protection

### Technical Accelerators
- **BU**: `bilingual-ux-expert` - German/English cultural UX design
- **ET**: `email-template-expert` - Professional email templates and branding
- **PO**: `performance-optimizer` - Performance optimization and scaling

### Quality & Reliability
- **AC**: `accessibility-expert` - WCAG 2.1 Level AA compliance
- **CI**: `calendar-expert` - RFC 5545 iCalendar integration
- **TT**: `tdd-test-expert` - Comprehensive test generation

### Governance & Production
- **CA**: `constitution-auditor` - Constitutional compliance validation
- **GD**: `german-deployment-expert` - German market deployment optimization

## Format: `[ID] [Agent(s)] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **Multiple Agents**: Tasks requiring collaboration between specialists
- File paths use web app structure: `backend/src/`, `frontend/src/`

## Phase 3.1: Setup & Project Structure

- [ ] **T001** [GD] Create web application project structure with backend/ and frontend/ directories optimized for German market deployment
- [ ] **T002** [PO] [P] Initialize backend Node.js/TypeScript project with Express, performance-optimized dependencies in backend/package.json
- [ ] **T003** [BU+AC] [P] Initialize frontend React/TypeScript project with Next.js/Vite, accessibility and i18n dependencies in frontend/package.json
- [ ] **T004** [CA] [P] Configure ESLint, Prettier, TypeScript configs for both backend and frontend with constitutional compliance rules
- [ ] **T005** [GC+GD] Setup environment configuration (.env.example, .env files) with GDPR-compliant variables and German deployment settings
- [ ] **T006** [PO+GD] Configure Docker containers for development (docker-compose.yml with Redis, PostgreSQL) optimized for German infrastructure

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] **T007** [TT+GH] [P] Contract test GET /v1/holidays with German state validation in backend/tests/contract/test_holidays_api.test.ts
- [ ] **T008** [TT+BC] [P] Contract test POST /v1/bridge-weekends with optimization algorithms in backend/tests/contract/test_bridge_weekends_api.test.ts
- [ ] **T009** [TT+GC] [P] Contract test POST /v1/vacation-plan with GDPR compliance in backend/tests/contract/test_vacation_plan_api.test.ts
- [ ] **T010** [TT+ET+GC] [P] Contract test POST /v1/vacation-plan/{id}/email with GDPR consent and template validation in backend/tests/contract/test_email_api.test.ts
- [ ] **T011** [TT+CI] [P] Contract test GET /v1/export/{id} with RFC 5545 validation in backend/tests/contract/test_export_api.test.ts

### Integration Tests (User Stories)
- [ ] **T012** [TT+GH+BU] [P] Integration test Bavarian bridge weekend discovery with cultural UX in backend/tests/integration/test_bavarian_user.test.ts
- [ ] **T013** [TT+BC] [P] Integration test vacation budget planning (25 days) with optimization in backend/tests/integration/test_vacation_budget.test.ts
- [ ] **T014** [TT+GC+ET] [P] Integration test email delivery & GDPR compliance with template validation in backend/tests/integration/test_email_gdpr.test.ts
- [ ] **T015** [TT+BU] [P] Integration test bilingual experience (DE/EN switching) with cultural validation in frontend/tests/integration/test_bilingual.test.ts
- [ ] **T016** [TT+AC] [P] Integration test accessibility & progressive enhancement with WCAG validation in frontend/tests/integration/test_accessibility.test.ts
- [ ] **T017** [TT+CI] [P] Integration test calendar import (Google/Outlook/Apple) with RFC 5545 compliance in backend/tests/integration/test_calendar_import.test.ts

### Unit Tests (Algorithms & Core Logic)
- [ ] **T018** [TT+GH] [P] Unit tests for German holiday data processing with all 16 states in backend/tests/unit/test_holiday_service.test.ts
- [ ] **T019** [TT+BC] [P] Unit tests for bridge weekend calculations with ROI optimization in backend/tests/unit/test_bridge_calculator.test.ts
- [ ] **T020** [TT+GC] [P] Unit tests for vacation plan validation with GDPR compliance in backend/tests/unit/test_vacation_validator.test.ts
- [ ] **T021** [TT+CI] [P] Unit tests for calendar export generation with RFC 5545 compliance in backend/tests/unit/test_calendar_export.test.ts

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] **T022** [GH+GC] [P] Holiday model with German validation rules and GDPR compliance in backend/src/models/Holiday.ts
- [ ] **T023** [GH+BU] [P] State (Bundesland) model with bilingual names in backend/src/models/State.ts
- [ ] **T024** [BC+GH] [P] BridgeWeekend model with efficiency calculations and German holiday integration in backend/src/models/BridgeWeekend.ts
- [ ] **T025** [GC+BU] [P] VacationPlan model with GDPR compliance and language preferences in backend/src/models/VacationPlan.ts
- [ ] **T026** [CI+GC] [P] CalendarExport model with signed URLs and GDPR retention in backend/src/models/CalendarExport.ts

### Services & Business Logic
- [ ] **T027** [GH] German HolidayService: government API integration with all 16 Bundesländer in backend/src/services/HolidayService.ts
- [ ] **T028** [BC+PO] BridgeCalculatorService: optimization algorithms with <100ms performance in backend/src/services/BridgeCalculatorService.ts
- [ ] **T029** [ET+GC+BU] EmailService: Resend integration with bilingual templates and GDPR compliance in backend/src/services/EmailService.ts
- [ ] **T030** [CI+PO] CalendarService: RFC 5545 iCal generation optimized for performance in backend/src/services/CalendarService.ts

### API Endpoints Implementation
- [ ] **T031** [GH+PO] GET /v1/holidays endpoint with state filtering and caching in backend/src/api/routes/holidays.ts
- [ ] **T032** [BC+PO] POST /v1/bridge-weekends endpoint with vacation budget optimization in backend/src/api/routes/bridge-weekends.ts
- [ ] **T033** [GC+PO] POST /v1/vacation-plan endpoint with session management and GDPR in backend/src/api/routes/vacation-plan.ts
- [ ] **T034** [ET+GC] POST /v1/vacation-plan/{id}/email endpoint with GDPR consent and template delivery in backend/src/api/routes/email.ts
- [ ] **T035** [CI+GC] GET /v1/export/{id} endpoint with signed URL validation and retention in backend/src/api/routes/export.ts

## Phase 3.4: Frontend Implementation

### React Components & UI
- [ ] **T036** [BU+AC] [P] StateSelector component with all 16 German states and accessibility in frontend/src/components/StateSelector.tsx
- [ ] **T037** [BU+AC+PO] [P] HolidayCalendar component with bilingual display and performance optimization in frontend/src/components/HolidayCalendar.tsx
- [ ] **T038** [BC+BU+AC] [P] BridgeWeekendCard component with ROI calculations and accessible design in frontend/src/components/BridgeWeekendCard.tsx
- [ ] **T039** [BC+BU+AC] [P] VacationPlanForm component with budget validation and bilingual UX in frontend/src/components/VacationPlanForm.tsx
- [ ] **T040** [GC+BU+AC] [P] EmailSubmissionForm component with GDPR consent and accessible design in frontend/src/components/EmailSubmissionForm.tsx

### Internationalization & Accessibility
- [ ] **T041** [BU] [P] German translations (formal addressing, cultural context) in frontend/src/i18n/de.json
- [ ] **T042** [BU] [P] English translations (casual tone, expat-friendly) in frontend/src/i18n/en.json
- [ ] **T043** [BU+PO] Language detection and switching logic with performance optimization in frontend/src/hooks/useLanguage.ts
- [ ] **T044** [AC+BU] Accessibility improvements (ARIA labels, keyboard nav) with bilingual support in frontend/src/components/

### Pages & Routing
- [ ] **T045** [BU+AC+PO] Landing page with progressive enhancement and performance optimization in frontend/src/pages/index.tsx
- [ ] **T046** [BC+BU+AC] Calendar planning interface with optimization algorithms and accessibility in frontend/src/pages/plan.tsx
- [ ] **T047** [ET+BU+AC] Email confirmation page with branding and accessibility in frontend/src/pages/confirmation.tsx

## Phase 3.5: Integration & Infrastructure

### External Service Integration
- [ ] **T048** [PO+GH] Redis caching layer for holiday data with performance optimization in backend/src/lib/cache.ts
- [ ] **T049** [GC+PO] PostgreSQL analytics storage with GDPR compliance in backend/src/lib/analytics.ts
- [ ] **T050** [GH+PO] German government API client with fallback handling and performance in backend/src/lib/germanAPIs.ts

### Email Templates & Branding
- [ ] **T051** [ET+BU] [P] German email template (formal, TimeButler branding) in backend/src/templates/email_de.hbs
- [ ] **T052** [ET+BU] [P] English email template (casual, TimeButler branding) in backend/src/templates/email_en.hbs

### Middleware & Security
- [ ] **T053** [GC+GD] CORS and security headers middleware with German compliance in backend/src/middleware/security.ts
- [ ] **T054** [GC+PO] Rate limiting (prevent email abuse) with German IP optimization in backend/src/middleware/rateLimiting.ts
- [ ] **T055** [CA+GC] Request/response logging with constitutional compliance in backend/src/middleware/logging.ts

## Phase 3.6: Polish & Performance

### Performance Optimization
- [ ] **T056** [PO+BU] [P] Frontend bundle optimization (<200KB target) with bilingual support in frontend/webpack.config.js
- [ ] **T057** [PO+CA] [P] Backend response optimization (<100ms target) with constitutional validation in backend/src/api/
- [ ] **T058** [PO+GD] CDN configuration for static assets optimized for German market

### Cross-Browser & Device Testing
- [ ] **T059** [TT+AC] [P] Playwright E2E tests (Chrome, Firefox, Safari) with accessibility validation in frontend/tests/e2e/
- [ ] **T060** [TT+BU] [P] Mobile responsive testing with German cultural UX validation in frontend/tests/mobile/
- [ ] **T061** [TT+AC] [P] Progressive enhancement validation (no-JS testing) with accessibility in frontend/tests/progressive/

### Production Readiness
- [ ] **T062** [CA+GD] Health check endpoints (/health, /metrics) with constitutional monitoring in backend/src/api/routes/health.ts
- [ ] **T063** [PO+CA] [P] Performance monitoring (Lighthouse score >90) with constitutional validation
- [ ] **T064** [ET+GC] [P] Email delivery monitoring (>95% success rate) with GDPR compliance in backend/src/lib/monitoring.ts
- [ ] **T065** [GD+PO] Docker production configuration optimized for German infrastructure in docker-compose.prod.yml

### Final Validation
- [ ] **T066** [CA+TT] Run all quickstart test scenarios with constitutional compliance validation
- [ ] **T067** [PO+GD] Load testing with 25,000 concurrent German users
- [ ] **T068** [GC+CA] GDPR compliance audit and data retention verification
- [ ] **T069** [CA] Constitutional compliance final check (all 7 principles validation)

## Multi-Agent Coordination Examples

### Phase 3.2: Parallel Contract Testing
```bash
# Launch T007-T011 with coordinated agents:
Task: [german-holiday-expert + tdd-test-expert] "Contract test GET /v1/holidays with German state validation"
Task: [bridge-calculator-expert + tdd-test-expert] "Contract test POST /v1/bridge-weekends with optimization algorithms"
Task: [gdpr-compliance-expert + tdd-test-expert] "Contract test POST /v1/vacation-plan with GDPR compliance"
Task: [email-template-expert + gdpr-compliance-expert + tdd-test-expert] "Contract test email endpoint with GDPR and templates"
Task: [calendar-expert + tdd-test-expert] "Contract test export endpoint with RFC 5545 validation"
```

### Phase 3.3: Model Creation with Domain Expertise
```bash
# Launch T022-T026 with specialized knowledge:
Task: [german-holiday-expert + gdpr-compliance-expert] "Holiday model with German validation and GDPR"
Task: [german-holiday-expert + bilingual-ux-expert] "State model with bilingual German state names"
Task: [bridge-calculator-expert + german-holiday-expert] "BridgeWeekend model with efficiency calculations"
Task: [gdpr-compliance-expert + bilingual-ux-expert] "VacationPlan model with GDPR and language preferences"
Task: [calendar-expert + gdpr-compliance-expert] "CalendarExport model with signed URLs and retention"
```

### Phase 3.4: Frontend Components with UX Excellence
```bash
# Launch T036-T040 with cultural and accessibility expertise:
Task: [bilingual-ux-expert + accessibility-expert] "StateSelector with German cultural UX and accessibility"
Task: [bilingual-ux-expert + accessibility-expert + performance-optimizer] "HolidayCalendar with performance and UX"
Task: [bridge-calculator-expert + bilingual-ux-expert + accessibility-expert] "BridgeWeekendCard with ROI and accessibility"
Task: [bridge-calculator-expert + bilingual-ux-expert + accessibility-expert] "VacationPlanForm with validation and UX"
Task: [gdpr-compliance-expert + bilingual-ux-expert + accessibility-expert] "EmailSubmissionForm with GDPR and accessibility"
```

## Agent Specialization Benefits

### Domain Knowledge Transfer
- **German Holiday Expert**: Eliminates 2-3 weeks of German holiday system research
- **Bridge Calculator**: Complex optimization algorithms in hours vs days
- **GDPR Guardian**: Zero compliance rework with upfront legal validation

### Quality Acceleration
- **Bilingual UX**: Authentic German/English cultural experiences
- **Accessibility**: WCAG 2.1 Level AA compliance built-in from start
- **Email Templates**: Professional TimeButler branding without design debt

### Performance & Production
- **Performance Optimizer**: Constitutional requirements met automatically
- **Calendar Expert**: RFC 5545 compliance without format research
- **German Deployment**: Production-ready European infrastructure

### Governance Automation
- **Constitutional Auditor**: Continuous principle compliance validation
- **TDD Test Generator**: >90% coverage without manual test writing

## Dependencies & Critical Path

### Agent Coordination Dependencies
- **GH + BC**: Holiday data must feed bridge calculations
- **GC + ET**: GDPR compliance must be built into email templates
- **BU + AC**: Bilingual design must include accessibility from start
- **PO + CA**: Performance optimization must meet constitutional requirements
- **All Agents + CA**: Constitutional auditor validates all outputs

### Parallel Development Streams
1. **Data Foundation**: GH + GC (Holiday data + compliance)
2. **Algorithm Development**: BC + PO (Optimization + performance)
3. **UX Excellence**: BU + AC + ET (Cultural design + accessibility + branding)
4. **Integration & Production**: CI + GD + CA (Calendar + deployment + governance)

## Expected Development Acceleration

### Traditional vs Agent-Assisted Timeline
- **Traditional Development**: 16-20 weeks + 4-6 weeks rework
- **With Specialized Agents**: 6-8 weeks total with minimal rework
- **Quality Multiplier**: Constitutional compliance, GDPR, and accessibility built-in

### Agent ROI by Phase
- **Phase 3.1-3.2**: 3X faster setup and comprehensive test generation
- **Phase 3.3**: 5X faster implementation with domain expertise
- **Phase 3.4**: 8X faster frontend with cultural UX and accessibility
- **Phase 3.5-3.6**: 4X faster integration with specialized compliance

### Risk Elimination
- **Legal Risk**: GDPR expert prevents compliance violations
- **Market Risk**: German cultural expert ensures authentic experience
- **Technical Risk**: Performance expert meets constitutional requirements
- **Quality Risk**: Accessibility expert ensures inclusive design

---

**Total Tasks**: 69 with specialized agent assignments
**Agent Utilization**: 11 specialists working in coordinated teams
**Expected Timeline**: 6-8 weeks vs 16-20 weeks traditional
**Quality Assurance**: Built-in compliance, performance, and cultural authenticity