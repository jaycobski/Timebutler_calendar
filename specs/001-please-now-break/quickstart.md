# Quickstart Test Scenarios: Timebutler Calendar MVP

## Overview
This document contains step-by-step test scenarios to validate the Timebutler Calendar MVP functionality. Each scenario corresponds to user stories from the feature specification and ensures constitutional compliance.

## Prerequisites
- Application deployed and accessible via web browser
- Test data: 2025-2026 German holiday data loaded
- Email service (Resend) configured and functional
- All 16 German states (Bundesländer) supported

---

## Scenario 1: Basic Bridge Weekend Discovery (Bavarian User)

### Setup
- Browser: Chrome/Firefox/Safari (latest)
- Language: Auto-detected (German preferred)
- Network: Standard broadband

### Test Steps

1. **Navigate to Application**
   - Open `https://timebutler-calendar.com` (or dev URL)
   - ✅ Page loads within 2 seconds
   - ✅ German interface displayed (if browser language is German)
   - ✅ TimeButler logo and branding visible

2. **State Selection**
   - Locate state dropdown/selector
   - ✅ All 16 German states listed
   - Select "Bayern" (Bavaria)
   - ✅ Interface updates to show Bavarian-specific holidays

3. **View Holiday Calendar**
   - Navigate to 2025 calendar view
   - ✅ Heilige Drei Könige (Jan 6) marked as Bayern state holiday
   - ✅ Federal holidays (e.g., Tag der Deutschen Einheit) visible
   - ✅ Weekday vs weekend holidays visually distinguished

4. **Bridge Weekend Identification**
   - Locate Christi Himmelfahrt (May 29, 2025) - falls on Thursday
   - ✅ System highlights Friday (May 30) as potential bridge day
   - ✅ Shows "4 days off using 1 vacation day" calculation
   - ✅ Bridge weekend spans Thu-Sun (May 29 - Jun 1)

### Expected Results
- ✅ User can identify bridge opportunities without explanation
- ✅ All constitutional principles maintained (simplicity, accuracy)
- ✅ Performance targets met (<2s load, <100ms interactions)

---

## Scenario 2: Vacation Budget Planning (25 Days Available)

### Setup
- Continuing from Scenario 1 (Bavarian user)
- User has 25 vacation days available

### Test Steps

1. **Enter Vacation Budget**
   - Locate vacation days input field
   - Enter "25" in the field
   - ✅ System accepts input (0-50 range validation)
   - ✅ Immediate feedback/confirmation shown

2. **Generate Recommendations**
   - Click "Calculate Bridge Weekends" or equivalent
   - ✅ System processes within 100ms
   - ✅ Ranked list of bridge opportunities displayed
   - ✅ Each recommendation shows:
     - Holiday name and date
     - Vacation days needed
     - Total days off gained
     - ROI ratio (e.g., "Use 2 days, get 9 days off")

3. **Select Multiple Bridges**
   - Select "Christi Himmelfahrt bridge" (1 day → 4 days off)
   - Select "Tag der Deutschen Einheit bridge" (1 day → 4 days off)
   - ✅ Running total shows "2 vacation days used"
   - ✅ Remaining days counter updates to "23 days left"

4. **Budget Validation**
   - Attempt to select bridges exceeding 25 days
   - ✅ System prevents over-budget selection
   - ✅ Warning message displayed
   - ✅ Clear indication of budget constraints

### Expected Results
- ✅ Intuitive vacation planning process
- ✅ Real-time feedback prevents budget errors
- ✅ ROI calculations help optimization decisions

---

## Scenario 3: Email Delivery & Calendar Export (GDPR Compliance)

### Setup
- Continuing from Scenario 2 (bridges selected)
- Valid email address available for testing

### Test Steps

1. **Email Submission Interface**
   - Locate "Send me my calendar" section
   - ✅ Email input field present and labeled
   - ✅ GDPR consent checkbox with clear text
   - ✅ Consent text mentions 90-day retention policy

2. **GDPR Consent Process**
   - Review consent text for completeness
   - ✅ Data processing purpose clearly explained
   - ✅ Retention period (90 days) specified
   - ✅ User rights under GDPR mentioned
   - Check consent checkbox
   - ✅ Submission button enabled only after consent

3. **Email Submission**
   - Enter valid email: `test@example.com`
   - Click "Send Calendar" button
   - ✅ System validates email format
   - ✅ Submission confirmed within 5 seconds
   - ✅ Success message with delivery estimate shown

4. **Email Receipt Verification**
   - Check email inbox within 5 seconds
   - ✅ Email from TimeButler arrives promptly
   - ✅ Subject line clear and relevant
   - ✅ Professional TimeButler branding present
   - ✅ Bridge weekend summary included
   - ✅ Download links for calendar formats present

5. **Calendar Export Download**
   - Click on iCal download link from email
   - ✅ File downloads immediately (no authentication required)
   - ✅ Filename descriptive (e.g., "timebutler-bridge-weekends-2025.ics")
   - ✅ File size reasonable (<50KB for typical selection)

### Expected Results
- ✅ GDPR compliance maintained throughout process
- ✅ Email delivery meets 5-second constitutional requirement
- ✅ Calendar exports work with major calendar applications

---

## Scenario 4: Bilingual Experience (English-speaking Expat)

### Setup
- Browser language set to English
- Fresh session (clear cookies/localStorage)

### Test Steps

1. **Language Detection & Selection**
   - Navigate to application with English browser settings
   - ✅ Interface loads in English automatically
   - ✅ Language toggle button visible (DE/EN)
   - ✅ All UI text in proper English (no placeholder text)

2. **State Selection in English**
   - Open state selector dropdown
   - ✅ States show English names where appropriate:
     - "Bavaria" instead of "Bayern"
     - "Baden-Württemberg" (mixed as appropriate)
     - Other states with English equivalents
   - Select "Bavaria"

3. **Holiday Names Translation**
   - View holiday calendar
   - ✅ Holiday names show English translations:
     - "Epiphany (Heilige Drei Könige)"
     - "Ascension Day (Christi Himmelfahrt)"
     - "Day of German Unity (Tag der Deutschen Einheit)"
   - ✅ Federal vs state distinction clear in English

4. **Language Switching Preservation**
   - Select bridge weekends in English interface
   - Switch language to German using toggle
   - ✅ Interface immediately switches to German
   - ✅ Selected bridge weekends preserved
   - ✅ Vacation days input preserved
   - Switch back to English
   - ✅ All selections maintained

5. **Email in Selected Language**
   - Complete email submission process in English
   - ✅ Email arrives in English with casual tone
   - ✅ Holiday names in English throughout email
   - ✅ TimeButler branding maintains English messaging

### Expected Results
- ✅ Seamless bilingual experience for expats
- ✅ Cultural appropriateness (formal German, casual English)
- ✅ No data loss during language switching

---

## Scenario 5: Accessibility & Progressive Enhancement

### Setup
- Screen reader software (NVDA/VoiceOver/JAWS)
- Browser with JavaScript disabled (for progressive enhancement)
- Mobile device (iOS/Android)

### Test Steps

1. **JavaScript-Free Experience**
   - Disable JavaScript in browser
   - Navigate to application
   - ✅ Core functionality works:
     - State selection available
     - Holiday viewing functional
     - Basic bridge weekend display
     - Email submission form accessible

2. **Screen Reader Navigation**
   - Enable screen reader
   - Navigate through application
   - ✅ All interactive elements properly labeled
   - ✅ Holiday information announced clearly
   - ✅ Form fields have descriptive labels
   - ✅ Bridge weekend benefits explained in text
   - ✅ GDPR consent readable aloud

3. **Keyboard Navigation**
   - Use only keyboard (Tab, Enter, Arrow keys)
   - ✅ All elements reachable via keyboard
   - ✅ Focus indicators clearly visible
   - ✅ Logical tab order maintained
   - ✅ Dropdown menus navigable with arrows

4. **Mobile Touch Experience**
   - Test on smartphone (iOS/Android)
   - ✅ Interface adapts to mobile screen
   - ✅ Touch targets appropriately sized
   - ✅ Calendar scrolling smooth
   - ✅ Form inputs mobile-optimized
   - ✅ Email submission works on mobile

### Expected Results
- ✅ WCAG 2.1 Level AA compliance demonstrated
- ✅ Progressive enhancement principles validated
- ✅ Inclusive design accessible to all users

---

## Scenario 6: Performance & Scale Testing

### Setup
- Performance monitoring tools (Lighthouse, WebPageTest)
- Network throttling (3G simulation)
- Load testing tools (for concurrent users)

### Test Steps

1. **Page Load Performance**
   - Throttle to 3G network speed
   - Load application homepage
   - ✅ Initial load completes within 2 seconds
   - ✅ Core content visible within 1 second
   - Run Lighthouse audit
   - ✅ Performance score >90
   - ✅ Accessibility score >90

2. **Interaction Response Times**
   - Measure state selection response
   - ✅ Dropdown opens <100ms
   - Measure bridge weekend calculation
   - ✅ Results displayed <100ms
   - Measure email submission
   - ✅ Confirmation received within 5 seconds

3. **Concurrent User Simulation**
   - Simulate 1,000 concurrent users
   - ✅ Application remains responsive
   - ✅ Email delivery success rate >95%
   - Scale to 10,000+ concurrent users (peak season)
   - ✅ Auto-scaling activates
   - ✅ No service degradation

### Expected Results
- ✅ Constitutional performance requirements met
- ✅ System ready for German-scale traffic
- ✅ Email infrastructure handles load

---

## Scenario 7: Calendar Import Verification

### Setup
- Multiple calendar applications (Google, Outlook, Apple Calendar)
- Generated calendar files from various scenarios

### Test Steps

1. **Google Calendar Import**
   - Download iCal file from email
   - Import to Google Calendar
   - ✅ All bridge weekends appear as events
   - ✅ Vacation days marked as "Planned Time Off"
   - ✅ Holidays show official names and regions
   - ✅ Timezone handling correct (CET/CEST)

2. **Microsoft Outlook Import**
   - Import same iCal file to Outlook
   - ✅ Events display correctly
   - ✅ No formatting issues or missing data
   - ✅ Recurring patterns if applicable

3. **Apple Calendar Import**
   - Import to Apple Calendar (macOS/iOS)
   - ✅ Cross-platform compatibility confirmed
   - ✅ Event descriptions include context

4. **RFC 5545 Compliance**
   - Validate iCal file format
   - ✅ Strict RFC 5545 compliance
   - ✅ No parsing errors in any calendar app

### Expected Results
- ✅ Universal calendar compatibility achieved
- ✅ No data loss during import process
- ✅ Professional calendar presentation

---

## Test Completion Checklist

### Functional Requirements Validated
- [ ] All German state holidays accurate for 2025-2026
- [ ] Bridge weekend calculations mathematically correct
- [ ] Email delivery consistently under 5 seconds
- [ ] Calendar exports RFC 5545 compliant
- [ ] GDPR compliance throughout user journey

### Constitutional Principles Verified
- [ ] User-Centric Simplicity: No documentation needed
- [ ] Data Accuracy: Official government data sources
- [ ] Export & Delivery: Flawless email + calendar integration
- [ ] Brand Integration: Professional TimeButler presence
- [ ] Progressive Enhancement: Works without JavaScript
- [ ] Performance: All timing requirements met
- [ ] Testing Discipline: Comprehensive validation complete

### Cross-Browser & Device Testing
- [ ] Chrome (latest) - Desktop & Mobile
- [ ] Firefox (latest) - Desktop & Mobile
- [ ] Safari (latest) - Desktop & Mobile
- [ ] Edge (latest) - Desktop
- [ ] iOS Safari (latest)
- [ ] Android Chrome (latest)

---

**Quickstart Status**: ✅ Complete
**Test Scenarios**: 7 comprehensive scenarios covering all user stories
**Next Phase**: Agent context update and task generation planning