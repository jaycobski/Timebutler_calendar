# Figma Design System Integration Rules - TimeButler Calendar

**Project:** TimeButler Calendar MVP
**Last Updated:** 2025-10-09
**Version:** 1.0.0
**Purpose:** Guide Figma design integration using MCP protocol

---

## 1. Design System Structure

### 1.1 Token Definitions

**Location:** `frontend/tailwind.config.js` and `frontend/src/styles/globals.css`

**Format:** Tailwind CSS configuration with custom tokens

#### Color Tokens

```javascript
// Primary Brand Colors (TimeButler Identity)
colors: {
  timebutler: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary brand blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // German Flag-inspired Accents (subtle usage)
  german: {
    black: '#000000',
    red: '#dd0000',
    gold: '#ffce00',
  },

  // Semantic colors aligned with Tailwind defaults
  gray: colors.slate,
  red: colors.red,
  yellow: colors.amber,
  green: colors.emerald,
  blue: colors.blue,
  // ... see tailwind.config.js for complete palette
}
```

**WCAG Compliance:**
- All color combinations meet **WCAG 2.1 Level AA** (4.5:1 contrast minimum)
- `.contrast-aa` class enforces gray-800 (#1f2937) text on white
- `.contrast-aaa` class enforces gray-900 (#111827) for AAA compliance (7:1)
- High contrast mode supported via `@media (prefers-contrast: high)`

#### Typography Tokens

```javascript
// Font Families
fontFamily: {
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'sans-serif'
  ],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace']
}

// Font Sizes with Line Heights
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem', { lineHeight: '1.5rem' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
}
```

**German Text Optimization:**
- German text tends to be 30% longer than English
- Use `.text-de` class for German content (letter-spacing: -0.01em)
- Use `.text-formal` utility for business content (font-weight: 400, letter-spacing: 0.015em)
- Inter font with `font-feature-settings: 'cv03', 'cv04', 'cv11'` for enhanced readability

#### Spacing Tokens

```javascript
// Optimized 4px base grid system
spacing: {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px (base unit)
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  // ... extended values in tailwind.config.js

  // Custom additions
  18: '4.5rem',     // 72px
  88: '22rem',      // 352px
  98: '24.5rem',    // 392px
}
```

**Usage:**
- Use multiples of 4px for all spacing
- Component padding: typically `p-4` (16px) or `p-6` (24px)
- Section spacing: `py-16` (64px) mobile, `py-24` (96px) desktop

#### Shadow Tokens

```javascript
boxShadow: {
  'timebutler': '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
  'timebutler-lg': '0 10px 15px -3px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
}
```

#### Border Radius Tokens

```javascript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',   // 2px
  'DEFAULT': '0.25rem', // 4px
  'md': '0.375rem',   // 6px
  'lg': '0.5rem',     // 8px
  'xl': '0.75rem',    // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  '4xl': '2rem',      // 32px (custom)
  'full': '9999px',
}
```

**German Design Preferences:**
- Moderate border radius (8-12px) for professional appearance
- Avoid excessive rounding (maintain business credibility)

#### Animation Tokens

```javascript
animation: {
  'fade-in': 'fadeIn 0.2s ease-in-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
}

keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  bounceGentle: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-4px)' },
  },
}
```

**Performance Requirement:**
- All animations must support `prefers-reduced-motion: reduce`
- Animations duration capped at 600ms for performance (<100ms interaction requirement)
- GPU-accelerated transforms only

---

### 1.2 Component Library

**Location:** `frontend/src/components/`

**Component Architecture:** React + TypeScript with Next.js

#### Core Components

```typescript
// Component Naming Convention: PascalCase, descriptive
frontend/src/components/
├── HolidayCalendar.tsx          // Main calendar grid with ARIA grid pattern
├── BridgeWeekendCard.tsx        // Individual bridge opportunity display
├── VacationPlanForm.tsx         // User vacation planning interface
├── StateSelector.tsx            // German state selector dropdown
├── SkipNavigation.tsx           // Accessibility skip links
├── PerformanceReporter.tsx      // Performance monitoring
├── PerformanceDashboard.tsx     // Dev performance metrics
├── __tests__/                   // Component tests (>90% coverage)
│   ├── HolidayCalendar.test.tsx
│   ├── BridgeWeekendCard.test.tsx
│   └── VacationPlanForm.test.tsx
└── examples/                    // Component examples for documentation
    ├── HolidayCalendarExample.tsx
    ├── BridgeWeekendCardExample.tsx
    └── VacationPlanFormExample.tsx
```

#### Component Patterns

**1. Accessibility-First Component Template:**

```typescript
import React, { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { Language } from '../types/state';

interface ComponentProps {
  // Props interface must include:
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  language?: Language;
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

export default function Component({
  className,
  'data-testid': testId = 'component',
  'aria-label': ariaLabel,
  language = 'de',
  onAnalytics
}: ComponentProps) {
  // Component implementation

  return (
    <div
      className={clsx('base-classes', className)}
      data-testid={testId}
      aria-label={ariaLabel}
      role="region" // Appropriate ARIA role
    >
      {/* Component content */}
    </div>
  );
}
```

**2. Bilingual Support Pattern:**

```typescript
import useTranslation from 'next-translate/useTranslation';

const isGerman = language === 'de';

// Inline translations for critical content
const text = isGerman
  ? 'Deutscher Text'
  : 'English text';

// Translation hook for non-critical content
const { t } = useTranslation('component-namespace');
const translatedText = t('translation.key');
```

**3. Performance Optimization Pattern:**

```typescript
import { useState, useCallback, useMemo } from 'react';

// Memoize expensive calculations
const computedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoize event handlers
const handleClick = useCallback(() => {
  onAnalytics?.('click_event', { id });
}, [id, onAnalytics]);
```

**4. Keyboard Navigation Pattern:**

```typescript
const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();
      // Handle navigation
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      onSelect();
      break;
    case 'Escape':
      onClose();
      break;
  }
}, [onSelect, onClose]);
```

#### Type Definitions

**Location:** `frontend/src/types/`

```typescript
frontend/src/types/
├── holiday.ts          // Holiday, BridgeWeekend, Calendar types
├── state.ts            // GermanStateCode, Language types
├── accessibility.ts    // A11y configuration types
├── language.ts         // I18n types
├── performance.d.ts    // Performance monitoring types
└── global.d.ts         // Global TypeScript declarations
```

**Key Type Pattern:**

```typescript
// All component props must extend base accessibility props
interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  language?: Language;
  onAnalytics?: (event: string, data?: Record<string, any>) => void;
}

// All interactive components must include accessibility config
interface CalendarA11yConfig {
  announceNavigation: boolean;
  announceHolidays: boolean;
  announceBridges: boolean;
  detailedDescriptions: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}
```

---

### 1.3 Frameworks & Libraries

**UI Framework:** React 18.2.0 with TypeScript 5.3.3

**Meta Framework:** Next.js 14.1.0 (SSR/SSG)

```json
{
  "dependencies": {
    // Core React
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.1.0",

    // Styling
    "tailwindcss": "^3.4.1",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.19",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "clsx": "^2.1.0",

    // Icons
    "@heroicons/react": "^2.0.18",

    // Utilities
    "date-fns": "^4.1.0",
    "react-hook-form": "^7.63.0",
    "js-cookie": "^3.0.5",

    // Internationalization
    "next-translate": "^2.6.2",
    "next-translate-plugin": "^2.6.2",

    // Performance
    "terser-webpack-plugin": "^5.3.14",
    "webpack-bundle-analyzer": "^4.10.2",

    // TypeScript
    "typescript": "^5.3.3",
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18"
  }
}
```

**Build System:** Next.js with Webpack 5
- JIT compilation for Tailwind CSS
- Tree-shaking enabled
- Code splitting by route
- Bundle size target: <200KB gzipped

**CSS Methodology:**
- Tailwind CSS utility-first approach
- Component-scoped CSS modules for complex components
- Global styles in `globals.css` with `@layer` directives
- No CSS-in-JS (performance overhead)

**State Management:**
- React Hooks (`useState`, `useReducer`)
- Context API for theme/language
- No external state management library (keeps bundle small)

---

### 1.4 Asset Management

**Image Storage:** `frontend/public/images/` (currently not created)

**Asset Optimization Strategy:**

```typescript
// Expected structure
frontend/public/
├── images/
│   ├── timebutler-logo.svg              // Primary logo (SVG for scalability)
│   ├── timebutler-logo-optimized.webp   // WebP for performance
│   ├── timebutler-logo-white.svg        // Dark background variant
│   ├── timebutler-logo-full.svg         // Full logo with text
│   ├── og-image.jpg                     // Open Graph social media
│   └── twitter-card.jpg                 // Twitter card image
├── fonts/
│   └── Inter-Variable.woff2             // Variable font (preloaded)
├── favicon.ico
├── manifest.json                        // PWA manifest
└── robots.txt                           // SEO
```

**Image Usage Pattern:**

```tsx
// Preload critical images
<link rel="preload" href="/images/timebutler-logo-optimized.webp" as="image" />

// Lazy load below-fold images
<img
  src="/images/example.webp"
  alt="Descriptive alt text"
  className="responsive-image"
  loading="lazy"
  width="800"
  height="600"
/>

// Next.js Image component for optimization
import Image from 'next/image';

<Image
  src="/images/example.webp"
  alt="Descriptive alt text"
  width={800}
  height={600}
  priority={false} // true for above-fold
  placeholder="blur"
/>
```

**CDN Strategy:**
- Static assets served from Netlify CDN
- Aggressive caching headers (1 year for immutable assets)
- WebP format preferred over PNG/JPG
- SVG for icons and logos (better for responsive)

**Asset Optimization Requirements:**
- All images must be optimized (<100KB per image)
- SVGs must be minified with SVGO
- WebP format with fallback to JPEG/PNG
- Responsive images with `srcset` for different screen sizes

---

### 1.5 Icon System

**Icon Library:** Heroicons v2.0.18 (Official Tailwind CSS icons)

**Location:** `@heroicons/react/24/outline` and `@heroicons/react/24/solid`

**Icon Import Pattern:**

```typescript
// Always use named imports for tree-shaking
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyEuroIcon,
  StarIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import {
  StarIcon as StarSolidIcon,
  HeartIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

// Usage
<CalendarDaysIcon className="h-5 w-5 text-blue-600" />
```

**Icon Sizing Standards:**

```typescript
// Icon size classes (based on component context)
'h-3 w-3'   // 12px - Tiny (inline badges)
'h-4 w-4'   // 16px - Small (buttons, form labels)
'h-5 w-5'   // 20px - Medium (default, navigation)
'h-6 w-6'   // 24px - Large (section headers)
'h-8 w-8'   // 32px - Extra large (feature highlights)
'h-12 w-12' // 48px - Hero icons
```

**Icon Accessibility Pattern:**

```tsx
// Decorative icon (hidden from screen readers)
<CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />

// Meaningful icon (requires aria-label)
<button aria-label="Close dialog">
  <XMarkIcon className="h-5 w-5" />
</button>

// Icon with visible text
<button>
  <CalendarDaysIcon className="h-5 w-5 mr-2" aria-hidden="true" />
  <span>Open Calendar</span>
</button>
```

**Icon Color Standards:**

```typescript
// Semantic color mapping
'text-blue-600'    // Primary actions, links, brand
'text-green-600'   // Success, positive actions
'text-red-600'     // Errors, warnings, destructive actions
'text-yellow-600'  // Warnings, caution
'text-gray-600'    // Neutral, secondary information
'text-purple-600'  // Special features, premium content
```

**Naming Convention:**
- Use Heroicons official names (PascalCase)
- Suffix with `Icon` (e.g., `CalendarDaysIcon`)
- Use `as` alias for duplicate names (e.g., `StarIcon as StarSolidIcon`)

---

### 1.6 Styling Approach

**Primary Methodology:** Tailwind CSS utility-first

**Component Styling Layers:**

```css
/* globals.css structure */

@tailwind base;      /* Reset + base styles */
@tailwind components; /* Reusable component classes */
@tailwind utilities;  /* Utility classes */

@layer base {
  /* Typography, accessibility, media queries */
}

@layer components {
  /* Reusable component patterns */
  .btn-base { /* ... */ }
  .card { /* ... */ }
  .form-input { /* ... */ }
}

@layer utilities {
  /* Custom utilities */
  .text-balance { /* ... */ }
  .gpu-accelerated { /* ... */ }
}
```

**Styling Patterns:**

**1. Inline Utilities (Preferred):**

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Title
  </h3>
</div>
```

**2. Component Classes (for repeated patterns):**

```tsx
<button className="btn-primary">
  Primary Action
</button>

<div className="card">
  Card content
</div>
```

**3. Dynamic Classes with `clsx`:**

```tsx
import clsx from 'clsx';

<div className={clsx(
  'base-class',
  {
    'active-class': isActive,
    'disabled-class': isDisabled,
  },
  className // Props className last for overrides
)} />
```

**4. Responsive Design:**

```tsx
<div className={clsx(
  // Mobile-first (no prefix)
  'text-sm p-4',
  // Tablet (sm: 640px)
  'sm:text-base sm:p-6',
  // Desktop (lg: 1024px)
  'lg:text-lg lg:p-8'
)} />
```

**Breakpoint System:**

```javascript
screens: {
  'xs': '475px',    // Extra small devices
  'sm': '640px',    // Small devices (tablets)
  'md': '768px',    // Medium devices
  'lg': '1024px',   // Large devices (desktops)
  'xl': '1280px',   // Extra large devices
  '2xl': '1536px',  // 2X large devices
  '3xl': '1920px',  // Ultra-wide (custom)
}
```

**CSS Modules (for complex components only):**

```typescript
// VacationPlanForm.css
.formContainer {
  @apply bg-white rounded-lg shadow-md p-6;
}

// VacationPlanForm.tsx
import styles from './VacationPlanForm.css';

<div className={styles.formContainer}>
  {/* ... */}
</div>
```

**Global Styles (minimal):**

- Reset and accessibility in `@layer base`
- Custom component utilities in `@layer components`
- Performance utilities in `@layer utilities`
- No global element styling outside `@layer base`

---

### 1.7 Project Structure

```
frontend/
├── public/                      # Static assets
│   ├── images/                 # Images, logos, icons
│   ├── fonts/                  # Web fonts (preloaded)
│   └── app.html               # Static export HTML
│
├── src/
│   ├── components/             # React components
│   │   ├── HolidayCalendar.tsx
│   │   ├── BridgeWeekendCard.tsx
│   │   ├── VacationPlanForm.tsx
│   │   ├── StateSelector.tsx
│   │   ├── __tests__/         # Component tests
│   │   └── examples/          # Component examples
│   │
│   ├── pages/                  # Next.js pages (routes)
│   │   ├── _app.tsx           # App wrapper
│   │   ├── _document.tsx      # HTML document wrapper
│   │   ├── index.tsx          # Landing page (/)
│   │   ├── plan.tsx           # Vacation planner (/plan)
│   │   └── confirmation.tsx   # Confirmation page
│   │
│   ├── styles/                 # Global styles
│   │   ├── globals.css        # Global CSS with Tailwind
│   │   ├── VacationPlanForm.css
│   │   └── components/        # Component-specific CSS
│   │
│   ├── types/                  # TypeScript types
│   │   ├── holiday.ts
│   │   ├── state.ts
│   │   ├── accessibility.ts
│   │   ├── language.ts
│   │   └── global.d.ts
│   │
│   ├── lib/                    # Utilities and helpers
│   │   ├── performance-monitor.ts
│   │   └── rum-analytics.ts
│   │
│   └── hooks/                  # Custom React hooks
│       └── (to be implemented)
│
├── tests/                      # Test suites
│   ├── accessibility/          # A11y tests
│   │   └── wcag-compliance.test.tsx
│   ├── e2e/                   # End-to-end tests
│   └── integration/           # Integration tests
│
├── tailwind.config.js          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── playwright.config.ts       # E2E test configuration
├── package.json               # Dependencies
└── netlify.toml               # Netlify deployment config
```

**Feature Organization Pattern:**
- Components are **not** organized by feature (flat structure)
- All components in `src/components/` root
- Types centralized in `src/types/`
- Pages define routes and compose components

---

## 2. Figma Integration Workflow

### 2.1 Design Handoff Process

**1. Design Review Checklist:**

- [ ] All designs use defined color tokens from Tailwind palette
- [ ] Typography matches font scale and line heights
- [ ] Spacing follows 4px grid system
- [ ] Components match existing component library
- [ ] Accessibility annotations present (ARIA labels, roles)
- [ ] Responsive breakpoints defined (mobile, tablet, desktop)
- [ ] Interactive states documented (hover, focus, active, disabled)
- [ ] German and English content variants provided
- [ ] Icon usage matches Heroicons library

**2. Component Mapping:**

| Figma Component | React Component | File Path |
|----------------|----------------|-----------|
| Calendar Grid | HolidayCalendar | `components/HolidayCalendar.tsx` |
| Bridge Card | BridgeWeekendCard | `components/BridgeWeekendCard.tsx` |
| State Selector | StateSelector | `components/StateSelector.tsx` |
| Form Input | (Tailwind + forms plugin) | N/A |
| Button | `.btn-base`, `.btn-primary` | `styles/globals.css` |
| Card Container | `.card` | `styles/globals.css` |

**3. Token Extraction:**

Use Figma MCP tools to extract:
- Color values → Map to Tailwind color tokens
- Typography → Map to font size/weight classes
- Spacing → Convert to Tailwind spacing scale
- Border radius → Use existing radius tokens

### 2.2 Code Generation Guidelines

**From Figma to Code:**

```typescript
// ✅ Good: Use Tailwind utilities matching tokens
<div className="bg-timebutler-500 text-white rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-4">Title</h3>
</div>

// ❌ Bad: Inline styles or arbitrary values
<div style={{ backgroundColor: '#0ea5e9', padding: '24px' }}>
  <h3 style={{ fontSize: '18px' }}>Title</h3>
</div>

// ⚠️ Use arbitrary values only when absolutely necessary
<div className="bg-[#0ea5e9]"> {/* Avoid unless color not in palette */}
```

**Component Generation Pattern:**

1. **Extract structure** from Figma node hierarchy
2. **Map visual properties** to Tailwind classes
3. **Add accessibility** attributes (ARIA, roles, labels)
4. **Implement bilingual** support (German/English)
5. **Add TypeScript** types for props
6. **Include tests** (snapshot, accessibility, interaction)

### 2.3 Asset Export Settings

**Images:**
- Format: WebP (primary), SVG (logos/icons), JPEG (fallback)
- Resolution: 2x for retina displays
- Optimization: Compress with 85% quality
- Naming: kebab-case (e.g., `timebutler-logo.svg`)

**Icons:**
- Export as SVG with viewBox
- Remove fills (use `currentColor`)
- Optimize with SVGO
- Prefer Heroicons over custom icons

**Colors:**
- Export as hex codes
- Map to nearest Tailwind color token
- Document custom colors in Tailwind config

---

## 3. German Market Specifics

### 3.1 Language Support

**Formal German (Business Context):**
```typescript
// Use formal "Sie" address form
const germanText = {
  heading: 'Maximieren Sie Ihre Urlaubstage',
  description: 'Nutzen Sie unseren professionellen Urlaubsplaner.',
  cta: 'Jetzt starten',
};
```

**Casual English (International):**
```typescript
const englishText = {
  heading: 'Maximize Your Vacation Days',
  description: 'Use our professional vacation planner.',
  cta: 'Get Started',
};
```

**Text Length Considerations:**
- German text typically 30% longer than English
- Use `text-balance` for better wrapping
- Test both languages for layout overflow
- Allow flexible container widths

### 3.2 Cultural Design Patterns

**German Professional Standards:**
- Conservative color palette (blues, grays, minimal bright colors)
- Professional typography (Inter font, moderate line heights)
- Clear data hierarchy (Germans appreciate structure)
- Explicit labeling (avoid ambiguous icons without text)
- GDPR compliance messaging prominent

**Trust Indicators Required:**
- DSGVO/GDPR compliance badges
- "Made in Germany" indicator
- Official data sources mentioned
- Clear privacy policy links

### 3.3 Date and Number Formatting

```typescript
// Date formatting (German locale)
new Date().toLocaleDateString('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// Output: "Montag, 9. Oktober 2025"

// Number formatting (German uses comma for decimals)
new Intl.NumberFormat('de-DE', {
  style: 'decimal',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
}).format(4.0);
// Output: "4,0"

// Currency formatting
new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
}).format(2500);
// Output: "2.500,00 €"
```

**Font Features for German:**
```css
font-feature-settings: 'cv03', 'cv04', 'cv11'; /* Inter optimizations */
letter-spacing: -0.01em; /* Tighter for longer German words */
```

---

## 4. Accessibility Requirements (WCAG 2.1 Level AA)

### 4.1 Color Contrast

**Minimum Requirements:**
- Normal text (< 18px): **4.5:1 contrast ratio**
- Large text (≥ 18px): **3:1 contrast ratio**
- UI components: **3:1 contrast ratio**

**Validation:**
```tsx
// Use contrast helper classes
<p className="contrast-aa">Text with 4.5:1 contrast</p>
<h1 className="contrast-aaa text-2xl">Text with 7:1 contrast</h1>
```

**High Contrast Mode:**
```css
@media (prefers-contrast: high) {
  body {
    color: #000;
    background-color: #fff;
  }
  .text-gray-600 {
    color: #333 !important;
  }
}
```

### 4.2 Keyboard Navigation

**Required Patterns:**
- All interactive elements must be keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order (follows visual flow)
- Keyboard shortcuts for common actions

**Focus Management:**
```tsx
// Always show focus rings
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click Me
</button>

// Skip navigation links
<a href="#main-content" className="skip-nav">
  Skip to main content
</a>
```

**Keyboard Event Handling:**
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      onClick();
      break;
    case 'Escape':
      onClose();
      break;
  }
};
```

### 4.3 Screen Reader Support

**ARIA Patterns:**
```tsx
// Calendar grid (ARIA grid pattern)
<table role="grid" aria-label="Calendar for January 2025">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">Monday</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell" tabIndex={0} aria-selected="false">
        1
      </td>
    </tr>
  </tbody>
</table>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  Selection updated: 3 bridge weekends selected
</div>

// Form labels and descriptions
<label htmlFor="state-select" className="block mb-2">
  Select your German state
</label>
<select
  id="state-select"
  aria-describedby="state-help"
  className="form-input"
>
  {/* options */}
</select>
<p id="state-help" className="text-sm text-gray-600">
  Choose the state where you work for accurate holiday data
</p>
```

**Screen Reader Only Text:**
```tsx
<span className="sr-only">
  Additional context for screen readers only
</span>

<div className="sr-only-focusable">
  Visible when focused by keyboard
</div>
```

### 4.4 Reduced Motion

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  html {
    scroll-behavior: auto;
  }
}
```

```tsx
// Conditional animations
const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<div className={clsx(
  'card',
  shouldAnimate && 'animate-fade-in'
)} />
```

---

## 5. Performance Optimization

### 5.1 Bundle Size Targets

**Constitutional Requirements:**
- Total bundle size: **<200KB gzipped**
- Initial page load: **<2 seconds** on 3G
- Interaction response: **<100ms**

**Current Configuration:**
```javascript
// tailwind.config.js optimizations
module.exports = {
  mode: 'jit', // Just-in-time compilation

  // Disable unused core plugins
  corePlugins: {
    container: false,
    backdropOpacity: false,
    // ... see config for full list
  },

  // Safelist only dynamic classes
  safelist: [
    'animate-pulse',
    'animate-spin',
    'focus:ring-2',
    // ... minimal set
  ],
}
```

### 5.2 Code Splitting

**Next.js Automatic Code Splitting:**
- Each page in `pages/` directory = separate bundle
- Dynamic imports for heavy components
- Shared chunks automatically optimized

```tsx
// Dynamic import for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR if client-only
});
```

### 5.3 Image Optimization

**Next.js Image Component:**
```tsx
import Image from 'next/image';

<Image
  src="/images/logo.webp"
  alt="TimeButler Logo"
  width={200}
  height={80}
  priority={true} // Above-fold images only
  placeholder="blur"
  quality={85}
/>
```

**Manual Optimization:**
```tsx
<img
  src="/images/hero.webp"
  srcSet="/images/hero-800.webp 800w, /images/hero-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero image"
  loading="lazy"
  className="responsive-image"
/>
```

### 5.4 Font Loading

**Preload Critical Fonts:**
```html
<link
  rel="preload"
  href="/fonts/Inter-Variable.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

**Font Display Strategy:**
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  font-weight: 100 900;
}
```

---

## 6. Testing Requirements

### 6.1 Component Tests

**Pattern:**
```tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BridgeWeekendCard from '../BridgeWeekendCard';

expect.extend(toHaveNoViolations);

describe('BridgeWeekendCard', () => {
  it('renders correctly', () => {
    const { container } = render(<BridgeWeekendCard {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BridgeWeekendCard {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<BridgeWeekendCard {...props} />);
    const card = screen.getByTestId('bridge-weekend-card');

    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalled();
  });
});
```

### 6.2 Accessibility Tests

**Location:** `frontend/tests/accessibility/wcag-compliance.test.tsx`

**Requirements:**
- All pages must pass axe-core automated tests
- Manual keyboard navigation tests required
- Screen reader testing (NVDA/JAWS) for complex components
- Color contrast validation

### 6.3 Coverage Requirements

**Constitutional Requirement:** >90% test coverage

**Run tests:**
```bash
npm run test              # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:a11y         # Accessibility tests
npm run test:coverage     # Coverage report
```

---

## 7. Deployment Considerations

### 7.1 Build Process

**Production Build:**
```bash
npm run build  # Next.js production build
```

**Output:**
- Optimized JavaScript bundles
- CSS purged to used classes only
- Static HTML for all pages (SSG)
- Optimized images

### 7.2 Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=https://api.timebutler.de
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID

# Optional
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 7.3 CDN Configuration

**Netlify Configuration:** `frontend/netlify.toml`

**Headers:**
```toml
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 8. Common Patterns and Anti-Patterns

### 8.1 DO: Best Practices

✅ **Use Tailwind utilities consistently**
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" />
```

✅ **Provide bilingual content inline**
```tsx
const text = language === 'de' ? 'Deutscher Text' : 'English text';
```

✅ **Include accessibility attributes**
```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="btn-base"
>
  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
</button>
```

✅ **Memoize expensive calculations**
```tsx
const sortedBridges = useMemo(() =>
  bridges.sort((a, b) => b.efficiency - a.efficiency),
  [bridges]
);
```

✅ **Use semantic HTML**
```tsx
<section aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
  {/* ... */}
</section>
```

### 8.2 DON'T: Anti-Patterns

❌ **Inline styles (defeats Tailwind optimization)**
```tsx
<div style={{ backgroundColor: '#0ea5e9', padding: '24px' }} />
```

❌ **Missing accessibility attributes**
```tsx
<button onClick={onClose}>
  <XMarkIcon className="h-5 w-5" />
</button>
```

❌ **Hardcoded text (prevents translation)**
```tsx
<h1>Maximize Your Vacation Days</h1>
```

❌ **Non-semantic HTML**
```tsx
<div onClick={onClick}>Click me</div> {/* Should be <button> */}
```

❌ **Missing TypeScript types**
```tsx
function Component(props) { // ❌ No types
  return <div>{props.text}</div>;
}
```

---

## 9. Figma MCP Integration Examples

### 9.1 Using mcp__figma-dev-mode-mcp-server Tools

**Get Screenshot:**
```typescript
// Extract nodeId from Figma URL:
// https://figma.com/design/pqrs/ExampleFile?node-id=1-2
// fileKey = "pqrs"
// nodeId = "1:2"

// Call MCP tool
mcp__figma-dev-mode-mcp-server__get_screenshot({
  fileKey: 'pqrs',
  nodeId: '1:2',
  clientLanguages: 'typescript',
  clientFrameworks: 'react,next,tailwindcss'
})
```

**Get Code from Figma:**
```typescript
mcp__figma-dev-mode-mcp-server__get_code({
  fileKey: 'pqrs',
  nodeId: '1:2',
  clientLanguages: 'typescript',
  clientFrameworks: 'react,next,tailwindcss'
})

// Returns:
// - Component code with Tailwind classes
// - Asset download URLs
// - TypeScript types
```

**Get Metadata (Structure Overview):**
```typescript
mcp__figma-dev-mode-mcp-server__get_metadata({
  fileKey: 'pqrs',
  nodeId: '0:1', // Page node ID
  clientLanguages: 'typescript',
  clientFrameworks: 'react,next,tailwindcss'
})

// Returns XML with layer hierarchy, node IDs, positions
```

### 9.2 Code Transformation Workflow

**1. Extract Figma Code → 2. Map to Tokens → 3. Add Accessibility → 4. Add Bilingual Support**

```tsx
// Figma-generated code (hypothetical)
<div style={{ backgroundColor: '#0ea5e9', padding: '24px', borderRadius: '8px' }}>
  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Title</h3>
</div>

// ↓ Transform to Tailwind

<div className="bg-timebutler-500 p-6 rounded-lg">
  <h3 className="text-lg font-semibold">Title</h3>
</div>

// ↓ Add accessibility

<section
  aria-labelledby="section-title"
  className="bg-timebutler-500 p-6 rounded-lg"
>
  <h3 id="section-title" className="text-lg font-semibold">
    Title
  </h3>
</section>

// ↓ Add bilingual support

<section
  aria-labelledby="section-title"
  className="bg-timebutler-500 p-6 rounded-lg"
>
  <h3 id="section-title" className="text-lg font-semibold">
    {language === 'de' ? 'Titel' : 'Title'}
  </h3>
</section>
```

---

## 10. Quick Reference

### 10.1 Color Palette Cheat Sheet

| Color Token | Hex | Usage |
|------------|-----|-------|
| `timebutler-500` | `#0ea5e9` | Primary brand blue |
| `gray-50` | `#f8fafc` | Background light |
| `gray-900` | `#0f172a` | Text primary |
| `green-600` | `#16a34a` | Success |
| `red-600` | `#dc2626` | Error |
| `yellow-600` | `#ca8a04` | Warning |
| `german-red` | `#dd0000` | German flag accent |
| `german-gold` | `#ffce00` | German flag accent |

### 10.2 Spacing Scale

| Class | Value | Pixels |
|-------|-------|--------|
| `p-1` | `0.25rem` | 4px |
| `p-2` | `0.5rem` | 8px |
| `p-3` | `0.75rem` | 12px |
| `p-4` | `1rem` | 16px |
| `p-6` | `1.5rem` | 24px |
| `p-8` | `2rem` | 32px |
| `p-12` | `3rem` | 48px |

### 10.3 Typography Scale

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | `0.75rem` (12px) | `1rem` | Small labels |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | Body small |
| `text-base` | `1rem` (16px) | `1.5rem` | Body text |
| `text-lg` | `1.125rem` (18px) | `1.75rem` | Section headings |
| `text-xl` | `1.25rem` (20px) | `1.75rem` | Card titles |
| `text-2xl` | `1.5rem` (24px) | `2rem` | Page headings |
| `text-3xl` | `1.875rem` (30px) | `2.25rem` | Hero headings |

### 10.4 Breakpoints

| Prefix | Min Width | Device Type |
|--------|-----------|-------------|
| `xs:` | 475px | Small phones |
| `sm:` | 640px | Tablets |
| `md:` | 768px | Small desktops |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large |

---

## 11. Validation Checklist

Before implementing Figma designs:

- [ ] All colors mapped to Tailwind tokens (no arbitrary hex values)
- [ ] Typography uses defined font scale
- [ ] Spacing follows 4px grid system
- [ ] Component matches existing component library or creates new one
- [ ] ARIA attributes added for accessibility
- [ ] Keyboard navigation implemented
- [ ] Screen reader labels provided
- [ ] Focus indicators visible
- [ ] German and English content variants provided
- [ ] Responsive design for all breakpoints
- [ ] Icons from Heroicons library (or justified custom)
- [ ] Image assets optimized (WebP, <100KB)
- [ ] Tests written (snapshot, a11y, interaction)
- [ ] Performance impact assessed (<200KB bundle)
- [ ] Constitutional principles followed

---

**End of Figma Design System Rules**
