# Data Model: Timebutler Calendar MVP

## Core Entities

### Holiday
Represents a public holiday in Germany.

**Attributes**:
- `id`: Unique identifier (string)
- `date`: Holiday date (ISO 8601 date string)
- `name_de`: German holiday name (string, required)
- `name_en`: English holiday name (string, required)
- `type`: Holiday type (enum: "federal", "state", "regional")
- `states`: Array of affected Bundesländer (string[])
- `regions`: Array of affected regions if regional (string[], optional)
- `religious`: Religious denomination if applicable ("catholic", "protestant", null)

**Validation Rules**:
- Date must be within 2025-2026 range
- At least one state must be specified for state/regional holidays
- Religious field only valid for regional holidays
- Both German and English names required (no empty strings)

**Examples**:
```json
{
  "id": "heilige-drei-koenige-2025",
  "date": "2025-01-06",
  "name_de": "Heilige Drei Könige",
  "name_en": "Epiphany",
  "type": "state",
  "states": ["BY", "BW", "ST"],
  "religious": "catholic"
}
```

### State (Bundesland)
Represents a German federal state.

**Attributes**:
- `code`: Two-letter state code (string, primary key)
- `name_de`: German state name (string)
- `name_en`: English state name (string)
- `population`: Estimated population (number)
- `dominant_religion`: Predominant religion ("catholic", "protestant", "mixed")

**Validation Rules**:
- Code must be valid ISO 3166-2:DE code
- Names cannot be empty
- Population must be positive integer

### Bridge Weekend
Calculated combination of holiday + vacation days.

**Attributes**:
- `id`: Computed identifier (string)
- `holiday_id`: Reference to base holiday (string, foreign key)
- `start_date`: Weekend start date (ISO 8601 date)
- `end_date`: Weekend end date (ISO 8601 date)
- `vacation_days_needed`: Number of vacation days required (number)
- `total_days_off`: Total consecutive days off (number)
- `efficiency`: Days off per vacation day ratio (number, computed)
- `pattern`: Bridge pattern type ("thursday-friday", "monday-tuesday", "sandwich")

**Validation Rules**:
- Start date must be before or equal to end date
- Vacation days needed must be 1-4 (reasonable range)
- Total days off must include weekends
- Efficiency = total_days_off / vacation_days_needed

**State Transitions**:
- Created → Selected → Email Sent → Link Generated

### Vacation Plan
User's collection of selected bridge weekends.

**Attributes**:
- `session_id`: Temporary session identifier (string, primary key)
- `state_code`: Selected Bundesland (string, foreign key)
- `vacation_days_available`: User's total vacation days (number)
- `vacation_days_used`: Cumulative days used in selections (number, computed)
- `language`: Selected language ("de", "en")
- `email`: User email address (string, validated)
- `gdpr_consent`: GDPR consent timestamp (ISO 8601 datetime)
- `selected_bridges`: Array of selected bridge weekend IDs (string[])
- `created_at`: Plan creation timestamp (ISO 8601 datetime)
- `email_sent_at`: Email delivery timestamp (ISO 8601 datetime, nullable)

**Validation Rules**:
- Vacation days available: 0-50 range
- Vacation days used cannot exceed available
- Email must be valid email format
- GDPR consent required before email submission
- Session expires after 24 hours

**Relationships**:
- One-to-many with Bridge Weekends (via selected_bridges)
- Many-to-one with State (via state_code)

### Calendar Export
Generated calendar file with download link.

**Attributes**:
- `export_id`: Unique export identifier (UUID string, primary key)
- `session_id`: Reference to vacation plan (string, foreign key)
- `format`: Export format ("ical", "google", "outlook")
- `language`: Export language ("de", "en")
- `file_url`: Signed URL for download (string)
- `created_at`: Export creation timestamp (ISO 8601 datetime)
- `expires_at`: Link expiration timestamp (ISO 8601 datetime)
- `downloaded_count`: Number of downloads (number, default 0)

**Validation Rules**:
- Export ID must be UUID v4 format
- File URL must be HTTPS
- Expires at must be 30 days from creation
- Format must be supported type

**Lifecycle**:
- Created → Available (30 days) → Expired → Deleted

### Language Preference
User's selected language with formatting rules.

**Attributes**:
- `code`: Language code ("de", "en")
- `display_name`: Language display name (string)
- `date_format`: Preferred date format string
- `formal_addressing`: Use formal addressing (boolean)
- `currency_symbol`: Currency symbol for display (string)
- `rtl`: Right-to-left reading direction (boolean)

**Static Data**:
```json
[
  {
    "code": "de",
    "display_name": "Deutsch",
    "date_format": "dd.MM.yyyy",
    "formal_addressing": true,
    "currency_symbol": "€",
    "rtl": false
  },
  {
    "code": "en",
    "display_name": "English",
    "date_format": "MM/dd/yyyy",
    "formal_addressing": false,
    "currency_symbol": "€",
    "rtl": false
  }
]
```

## Data Relationships

### Primary Relationships
1. **Holiday** → **State**: Many-to-many (holidays can affect multiple states)
2. **State** → **Vacation Plan**: One-to-many (user selects one state)
3. **Holiday** → **Bridge Weekend**: One-to-many (holiday can generate multiple bridge options)
4. **Vacation Plan** → **Bridge Weekend**: Many-to-many (user selects multiple bridges)
5. **Vacation Plan** → **Calendar Export**: One-to-many (multiple export formats)

### Computed Relationships
- **Bridge Weekend efficiency** = total_days_off / vacation_days_needed
- **Vacation Plan remaining days** = vacation_days_available - vacation_days_used
- **Holiday applicability** = user's state_code in holiday.states

## Data Storage Strategy

### Holiday Data (Static/Cached)
- **Storage**: JSON files + Redis cache
- **Update Frequency**: Annual (2025-2026 pre-computed)
- **Cache TTL**: 30 days (holidays don't change mid-year)

### User Sessions (Temporary)
- **Storage**: Redis with TTL
- **Retention**: 90 days per GDPR requirements
- **Cleanup**: Automatic expiration + batch deletion

### Analytics (Persistent)
- **Storage**: PostgreSQL for aggregate analytics
- **Data**: Usage patterns, popular bridge weekends, state distribution
- **PII**: No personally identifiable information stored

### Export Files (Temporary)
- **Storage**: Cloud storage (S3/GCS) with signed URLs
- **Retention**: 30 days per constitutional requirement
- **Cleanup**: Automated deletion after expiration

## Validation & Constraints

### Business Rules
1. Bridge weekends cannot overlap within same vacation plan
2. Total vacation days used cannot exceed available
3. Email can only be sent once per session
4. Export links expire exactly 30 days after creation
5. Holiday data accuracy verified against official sources

### Technical Constraints
1. Session IDs are cryptographically secure (32+ chars)
2. Export IDs use UUID v4 for uniqueness
3. All dates stored in UTC, displayed in local timezone
4. Email addresses validated using RFC 5322 standard
5. GDPR consent includes clear retention policy

---

**Data Model Status**: ✅ Complete
**Entities Defined**: 6 core entities + relationships
**Next Phase**: API Contracts generation