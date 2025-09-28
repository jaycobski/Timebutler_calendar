<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 (Added email delivery and brand awareness principles)
Modified principles:
- III. Export Universality → III. Export & Delivery (expanded to include email)
- Added new section: Brand Integration
Added sections: Brand Integration
Removed sections: None
Templates requiring updates:
- ✅ plan-template.md (constitution gates aligned)
- ✅ spec-template.md (requirements align with UX principles)
- ✅ tasks-template.md (task categories reflect testing and accessibility)
Follow-up TODOs: None
-->

# Timebutler Calendar Constitution

## Core Principles

### I. User-Centric Simplicity
Every feature MUST reduce cognitive load for German workers planning their vacation days.
The interface MUST be intuitive without documentation or login requirements. Users input
their available vacation days and select their state (Bundesland). The system calculates
optimal bridge weekends for 2025-2026. All interactions MUST provide immediate visual
feedback. No user accounts or data persistence required for MVP.

### II. Data Accuracy & Compliance
Holiday data MUST be 100% accurate for all German federal states (Bundesländer) for
2025 and 2026. The system MUST account for regional variations (Catholic vs Protestant
regions). Data sources MUST be official or legally verified. Email delivery MUST be
GDPR compliant with clear consent. No personal data storage beyond email transaction.

### III. Export & Delivery
Users receive bridge weekend summaries via email with calendar export links. Calendar
exports MUST work flawlessly with iCal, Google Calendar, and Microsoft Outlook. Generated
files MUST follow RFC 5545 (iCalendar) standards strictly. Time zones MUST be handled
correctly (CET/CEST transitions). Email templates MUST be mobile-responsive and accessible.
Export links MUST remain valid for at least 30 days.

### IV. Brand Integration
Every interaction MUST subtly promote TimeButler brand awareness. Email templates MUST
include TimeButler branding and value proposition. The tool positions TimeButler as the
expert in German time management. Brand presence MUST be professional, not intrusive.
Include gentle CTAs to explore TimeButler's time tracking solutions. Success metrics
track brand awareness lift, not conversions.

### V. Progressive Enhancement
Core functionality (viewing holidays, calculating bridge days) MUST work without JavaScript.
Enhanced interactions are additive, not required. The app MUST be fully accessible with
keyboard navigation. Screen readers MUST have full access to all information. Mobile
experience MUST be touch-optimized without sacrificing desktop usability.

### VI. Performance & Reliability
Initial page load MUST be under 2 seconds on 3G connections. All interactions MUST
respond within 100ms. Email delivery MUST complete within 5 seconds. The app MUST
handle German-scale traffic spikes before holiday planning seasons (December/January
for next year planning). Infrastructure MUST auto-scale for viral social media moments.

### VII. Testing Discipline
Every holiday calculation MUST have comprehensive test coverage for 2025-2026. Email
templates MUST render correctly across major email clients. Calendar export formats
MUST be validated against real calendar applications. Each German state's holidays
MUST have dedicated test cases. Bridge weekend calculations MUST be verifiable.

## Technical Architecture

### Frontend Requirements
- Single-page application with no login required
- State selection and vacation day input as primary interactions
- Visual calendar display showing bridge weekend opportunities
- One-click email submission with calendar exports
- Build size MUST stay under 200KB gzipped

### Backend Requirements
- Stateless API (no user sessions required)
- Email service integration for delivery
- Temporary storage for export link generation (30-day TTL)
- Rate limiting per IP to prevent email abuse
- Holiday data cached and versioned for 2025-2026

### Email & Branding
- Transactional email service (SendGrid/SES/Postmark)
- HTML and plain text versions of all emails
- TimeButler logo and brand colors in templates
- Footer with link to main TimeButler product
- Unsubscribe not required (transactional only)

### Data Management
- Holiday rules for 2025-2026 pre-calculated and stored
- Bridge weekend algorithms deterministic and testable
- No personal data persistence beyond email transaction
- Export links use temporary signed URLs
- Analytics track usage patterns, not individuals

## Governance

### Amendment Process
- Constitution changes require documented justification
- Brand guidelines MUST remain consistent with TimeButler main product
- Email template changes require A/B testing for engagement
- Technical debt from constitution violations MUST be tracked

### Compliance Verification
- Every PR MUST pass automated constitution checks
- Email delivery MUST maintain >95% success rate
- GDPR compliance review for any data flow changes
- Brand consistency review for all user-facing content

### Quality Gates
- Test coverage MUST remain above 90% for holiday calculations
- Email delivery time MUST stay under 5 seconds
- Lighthouse score MUST stay above 90 for all metrics
- Zero-login requirement MUST be maintained for MVP
- Holiday data accuracy MUST be 100% for 2025-2026

**Version**: 1.1.0 | **Ratified**: 2025-01-24 | **Last Amended**: 2025-01-24