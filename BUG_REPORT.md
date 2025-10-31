# Calendar Planning Functionality - Bug Report

## Date: October 30, 2025
## Environment: Development (localhost:3001)

## Critical Issues Found

### 1. **No Holidays Data - CRITICAL** 🔴
**Location:** `frontend/src/pages/plan.tsx` (lines 1386-1412)

**Problem:**
- The `getStaticProps` function only returns ONE holiday (Neujahr 2025)
- This causes the entire bridge weekend calculation system to fail
- Calendar shows "Lade Feiertage..." (Loading holidays...) but never displays any holidays
- Bridge weekends section remains empty because there are no holidays to calculate bridges from

**Current Code:**
```typescript
const initialHolidays: Holiday[] = [
  {
    id: 'neujahr-2025',
    name_de: 'Neujahr',
    name_en: 'New Year\'s Day',
    date: '2025-01-01',
    type: 'federal',
    states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    is_catholic: false,
    is_protestant: false,
  },
  // Add more holidays as needed for initial render  ← Comment says "add more" but none added!
];
```

**Impact:**
- Calendar functionality completely broken
- No bridge weekend calculations possible
- Users cannot create vacation plans

**Solution Required:**
- Either fetch holidays from the backend API at build time
- Or add a complete dataset of 2025 German holidays
- Backend API exists at: `backend/src/routes/v1/holidays.ts`

---

### 2. **Translation Keys Not Working** 🟡
**Location:** Multiple components including `StateSelector`

**Problem:**
- Translation keys showing as raw text like "capitalLabel: Stuttgart" instead of "Hauptstadt: Stuttgart"
- "label" showing instead of "Bundesland auswählen"
- "searchPlaceholder" showing instead of "Bundesland suchen..."
- "sortBy" showing instead of "Sortieren nach"
- "sortOptions.alphabetical" showing instead of "Alphabetisch"

**Observed in UI:**
```
label *                                    ← Should be "Bundesland auswählen *"
placeholder                                ← Should be "Bitte wählen Sie Ihr Bundesland"

Baden-Württemberg
capitalLabel: Stuttgart                    ← Should be "Hauptstadt: Stuttgart"
populationLabel: 11,100,000                ← Should be "Einwohner: 11.100.000"

sortBy: sortOptions.alphabetical           ← Should be "Sortieren nach: Alphabetisch"
```

**Root Cause:**
- Translation function `t()` not being called on nested translation keys
- Direct string interpolation instead of using translation helper

**Impact:**
- Poor user experience
- Looks unprofessional
- Especially bad for non-German users

---

### 3. **Missing Accessibility Translation Keys** 🟡
**Location:** `frontend/src/i18n/en.json` and various components

**Problem:**
Console warnings showing:
```
Translation key not found: accessibility.labels.skipToContent for language: en
Translation key not found: accessibility.labels.skipToNavigation for language: en
Translation key not found: accessibility.labels.loading for language: en
Translation key not found: accessibility.labels.required for language: en
Translation key not found: accessibility.labels.expand for language: en
Translation key not found: accessibility.labels.collapse for language: en
Translation key not found: accessibility.errors.requiredField for language: en
Translation key not found: accessibility.errors.invalidEmail for language: en
Translation key not found: accessibility.errors.invalidDate for language: en
Translation key not found: accessibility.errors.networkError for language: en
Translation key not found: accessibility.success.dataSaved for language: en
Translation key not found: accessibility.success.emailSent for language: en
Translation key not found: accessibility.success.calendarExported for language: en
Translation key not found: accessibility.instructions.keyboardNavigation for language: en
Translation key not found: accessibility.instructions.formNavigation for language: en
Translation key not found: accessibility.instructions.calendarNavigation for language: en
Translation key not found: accessibility.instructions.listNavigation for language: en
Translation key not found: accessibility.instructions.dialogNavigation for language: en
Translation key not found: accessibility.instructions.tableNavigation for language: en
```

**Analysis:**
- The translation files have duplicate `accessibility` sections
- First section (lines 521-564 in de.json) has basic keys
- Second section (lines 637-730 in de.json) has nested `labels`, `descriptions`, `instructions`, `announcements`, `errors`, `success`
- Components are looking for `accessibility.labels.X` but translation system might not be handling nested keys properly

**Impact:**
- Reduced accessibility for screen reader users
- Professional application should have proper ARIA labels

---

### 4. **Invalid Checkbox States in GDPR Section** 🟡
**Location:** GDPR consent checkboxes in vacation plan form

**Problem:**
From accessibility tree:
```
checkbox "E-Mail-Zustellung Ihres Kalenders" invalid="true"
checkbox "calendar_export" invalid="true"
```

**Observed Issues:**
- Two checkboxes marked as invalid even though they're the required ones
- Second checkbox shows raw key "calendar_export" instead of translated text
- "support" checkbox also showing raw key instead of translated text

**Impact:**
- Form validation UX is confusing
- Users might not understand which consents are required

---

### 5. **React Hydration Warning** 🟡
**Location:** Main content section

**Console Error:**
```
Warning: Extra attributes from the server: %s%s tabindex 
    at main
    at div
    at LanguageProvider
    at AccessibilityProvider
    at PlanningPage
```

**Problem:**
- Server-side rendered HTML has `tabindex` attribute that client doesn't expect
- Causes hydration mismatch

**Impact:**
- Minor: Doesn't break functionality but indicates SSR/CSR mismatch
- Could cause React to do unnecessary re-renders

---

### 6. **Missing Resources** ℹ️
**Location:** Various

**Problems:**
- `/site.webmanifest` - 404 (not critical, but good to have for PWA)
- `/fonts/inter.woff2` - 404 (font preload failing)
- `/fonts/Inter-Variable.woff2` - 404 (font missing)

**Impact:**
- Minor: Fonts load from Google Fonts CDN instead
- Performance slightly degraded

---

## User Flow Issues

### Current Broken Flow:
1. ✅ User lands on page
2. ✅ User sees language selector and can switch languages
3. ❌ User sees "label" instead of "Bundesland auswählen"
4. ⚠️ User clicks dropdown and sees raw translation keys in options
5. ✅ User can select a state (e.g., Baden-Württemberg)
6. ❌ **Calendar shows "Lade Feiertage..." forever** (no holidays loaded)
7. ❌ **No bridge weekends appear** (can't calculate without holidays)
8. ❌ **"Kalender per E-Mail senden" button stays disabled** (no data to send)

### Expected Flow:
1. ✅ User lands on page
2. ✅ User sees proper translated labels
3. ✅ User selects state with fully translated options
4. ✅ Holidays load and display in calendar
5. ✅ Bridge weekends calculate and appear in list
6. ✅ User can select bridge weekends
7. ✅ User fills in email and consents
8. ✅ User submits and receives calendar via email

---

## Recommended Fix Priority

### Priority 1 - CRITICAL (Blocks all functionality):
1. **Add complete holidays dataset** to `getStaticProps` in `plan.tsx`
   - OR implement client-side fetch from backend API
   - Need all 2025 German holidays for all 16 states

### Priority 2 - HIGH (Major UX issues):
2. **Fix translation keys** in StateSelector component
3. **Fix GDPR checkbox labels** and validation states

### Priority 3 - MEDIUM (Accessibility):
4. **Add missing accessibility translation keys**
5. **Fix hydration warning** for tabindex

### Priority 4 - LOW (Nice to have):
6. **Add missing font files** or fix preload
7. **Add site.webmanifest** for PWA support

---

## Technical Notes

### Available Backend Resources:
- Backend holiday API: `backend/src/routes/v1/holidays.ts`
- Holiday Service: `backend/src/services/HolidayService.ts`
- Holiday Model: `backend/src/models/Holiday.ts`

### Translation System:
- Files exist: `frontend/src/i18n/de.json`, `frontend/src/i18n/en.json`
- Component-specific translations in subdirectories
- System appears to use `next-translate`
- Issue likely in how translation keys are being accessed

### Next Steps:
1. Implement holiday data loading
2. Fix translation key interpolation
3. Test complete user flow
4. Validate all form states
5. Run accessibility audit

---

## Screenshots & Evidence

### Issue 1: Missing Holidays
- Calendar shows "Lade Feiertage..." indefinitely
- No holidays displayed in October 2025 calendar view
- Bridge weekends section empty

### Issue 2: Translation Keys
- Dropdown label shows "label" instead of German translation
- State options show "capitalLabel: Stuttgart" instead of "Hauptstadt: Stuttgart"
- Sort option shows "sortOptions.alphabetical" instead of "Alphabetisch"

### Issue 3: Console Errors
- 40+ translation key warnings in console
- React hydration warning
- 404 errors for fonts and manifest

---

**Report Generated by:** AI Debugging Session
**Status:** Ready for fixes

