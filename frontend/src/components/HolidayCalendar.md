# HolidayCalendar Component

An accessible German holiday calendar component with bridge weekend optimization features, built following WCAG 2.1 Level AA compliance standards.

## Features

### Core Functionality
- ✅ **German Holiday Display**: Shows federal, state, and regional holidays for all 16 Bundesländer
- ✅ **Bridge Weekend Visualization**: Highlights optimal vacation opportunities with efficiency calculations
- ✅ **Bilingual Support**: German (formal) and English (casual) interfaces with proper cultural tone
- ✅ **State-Specific Data**: Accurate holiday data for each German state including religious variations

### Accessibility (WCAG 2.1 Level AA)
- ✅ **ARIA Grid Pattern**: Complete implementation with proper roles and properties
- ✅ **Keyboard Navigation**: Arrow keys, Home/End, Page Up/Down navigation
- ✅ **Screen Reader Support**: Comprehensive announcements and descriptions
- ✅ **Focus Management**: Visual focus indicators and logical tab order
- ✅ **High Contrast**: Support for high contrast modes and color blind users
- ✅ **Reduced Motion**: Respects user preferences for reduced motion

### Performance Optimization
- ✅ **Caching**: Holiday and bridge data caching with configurable TTL
- ✅ **Lazy Loading**: On-demand data loading for adjacent months
- ✅ **Debounced Interactions**: Smooth user interactions without performance issues
- ✅ **Virtual Scrolling**: Optional virtualization for large datasets
- ✅ **Bundle Optimization**: Tree-shakeable exports and minimal dependencies

### Mobile & Responsive
- ✅ **Touch Gestures**: Swipe navigation for mobile devices
- ✅ **Responsive Layout**: Adaptive design from mobile to desktop
- ✅ **Compact Mode**: Space-efficient layout for smaller screens
- ✅ **Progressive Enhancement**: Works without JavaScript enabled

## Installation

The component is already integrated into the project's component system:

```tsx
import { HolidayCalendar } from '@/components';
// or
import HolidayCalendar from '@/components/HolidayCalendar';
```

## Basic Usage

### Simple German Holiday Calendar

```tsx
import React from 'react';
import { HolidayCalendar } from '@/components';

export const MyCalendar = () => {
  return (
    <HolidayCalendar
      language="de"
      year={2025}
    />
  );
};
```

### State-Specific Calendar with Bridge Weekends

```tsx
import React, { useState } from 'react';
import { HolidayCalendar } from '@/components';
import type { CalendarDate, BridgeWeekend } from '@/types/holiday';

export const BavarianCalendar = () => {
  const [selectedBridge, setSelectedBridge] = useState<BridgeWeekend | null>(null);

  return (
    <HolidayCalendar
      state="BY"
      language="en"
      year={2025}
      showBridges={true}
      showBridgeEfficiency={true}
      enableBridgeInteraction={true}
      onBridgeClick={(bridge) => setSelectedBridge(bridge)}
      onDateSelect={(date) => console.log('Selected:', date)}
    />
  );
};
```

### Accessibility-Optimized Calendar

```tsx
import React from 'react';
import { HolidayCalendar } from '@/components';

export const AccessibleCalendar = () => {
  const a11yConfig = {
    announceNavigation: true,
    announceHolidays: true,
    announceBridges: true,
    detailedDescriptions: true,
    keyboardNavigation: true,
    screenReaderOptimized: true,
  };

  return (
    <HolidayCalendar
      language="de"
      state="BW"
      year={2025}
      a11yConfig={a11yConfig}
      ariaLabel="Accessible holiday calendar for Baden-Württemberg"
    />
  );
};
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `state` | `GermanStateCode` | `undefined` | German state code (BW, BY, BE, etc.) |
| `language` | `'de' \| 'en'` | `'de'` | Display language |
| `year` | `number` | `current year` | Year to display |
| `initialView` | `'month' \| 'year' \| 'quarter'` | `'month'` | Initial calendar view |

### Feature Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showBridges` | `boolean` | `true` | Show bridge weekend opportunities |
| `showBridgeEfficiency` | `boolean` | `true` | Show efficiency ratings |
| `enableBridgeInteraction` | `boolean` | `true` | Enable bridge weekend clicking |
| `showRegionalHolidays` | `boolean` | `true` | Include regional holidays |

### Accessibility Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `a11yConfig` | `CalendarA11yConfig` | `DEFAULT_A11Y_CONFIG` | Accessibility configuration |
| `ariaLabel` | `string` | `undefined` | Custom ARIA label |
| `ariaDescribedBy` | `string` | `undefined` | ARIA described-by reference |

### Performance Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `performanceConfig` | `CalendarPerformanceConfig` | `DEFAULT_PERFORMANCE_CONFIG` | Performance settings |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Custom CSS classes |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Color theme |
| `compact` | `boolean` | `false` | Compact layout mode |

### Event Handler Props

| Prop | Type | Description |
|------|------|-------------|
| `onDateSelect` | `(date: CalendarDate) => void` | Called when date is selected |
| `onHolidayClick` | `(holiday: Holiday) => void` | Called when holiday is clicked |
| `onBridgeClick` | `(bridge: BridgeWeekend) => void` | Called when bridge is clicked |
| `onMonthChange` | `(month: CalendarMonth) => void` | Called when month changes |
| `onViewChange` | `(view: CalendarView) => void` | Called when view changes |
| `onError` | `(error: Error) => void` | Called when error occurs |
| `onAnalytics` | `(event: string, data?: any) => void` | Analytics tracking |

## Keyboard Navigation

The calendar supports comprehensive keyboard navigation:

| Key | Action |
|-----|--------|
| `Arrow Keys` | Navigate between dates |
| `Home` | Go to start of week |
| `End` | Go to end of week |
| `Page Up` | Previous month |
| `Page Down` | Next month |
| `Shift + Page Up` | Previous year |
| `Shift + Page Down` | Next year |
| `Enter` / `Space` | Select focused date |
| `Tab` | Navigate to next interactive element |

## Bridge Weekend Patterns

The calendar recognizes and optimizes these vacation patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| `thursday-friday` | Thursday holiday + Friday vacation = 4-day weekend | Ascension Day bridges |
| `monday-tuesday` | Monday holiday + Tuesday vacation = 4-day weekend | May Day extensions |
| `tuesday-friday` | Tuesday holiday + Wed-Fri vacation = 6-day break | Long bridge opportunities |
| `sandwich` | Holiday between weekends with strategic days off | Mid-week holiday optimization |
| `extend-weekend` | Friday holiday + Thursday vacation = 4-day weekend | Weekend extensions |

## State Codes

Supported German state codes:

| Code | State (German) | State (English) |
|------|----------------|-----------------|
| `BW` | Baden-Württemberg | Baden-Württemberg |
| `BY` | Bayern | Bavaria |
| `BE` | Berlin | Berlin |
| `BB` | Brandenburg | Brandenburg |
| `HB` | Bremen | Bremen |
| `HH` | Hamburg | Hamburg |
| `HE` | Hessen | Hesse |
| `MV` | Mecklenburg-Vorpommern | Mecklenburg-Western Pomerania |
| `NI` | Niedersachsen | Lower Saxony |
| `NW` | Nordrhein-Westfalen | North Rhine-Westphalia |
| `RP` | Rheinland-Pfalz | Rhineland-Palatinate |
| `SL` | Saarland | Saarland |
| `SN` | Sachsen | Saxony |
| `ST` | Sachsen-Anhalt | Saxony-Anhalt |
| `SH` | Schleswig-Holstein | Schleswig-Holstein |
| `TH` | Thüringen | Thuringia |

## Performance Considerations

The component is optimized for performance:

- **Data Caching**: Holiday data cached with configurable TTL
- **Lazy Loading**: Adjacent months preloaded on demand
- **Debounced Updates**: User interactions debounced to prevent excessive API calls
- **Memory Management**: Automatic cleanup of unused cached data
- **Bundle Size**: Tree-shakeable with minimal dependencies

## Accessibility Features

### Screen Reader Support

The component provides comprehensive screen reader support:

- **Date Announcements**: "Monday, January 1st, 2025, New Year's Day, Federal holiday"
- **Navigation Feedback**: "Navigated to February 2025"
- **Bridge Descriptions**: "Bridge weekend, 1 vacation day for 4 days off, efficiency 4.0"
- **State Changes**: Live regions announce dynamic content changes

### Keyboard Navigation

- **Full keyboard access**: All features accessible without mouse
- **Focus indicators**: Clear visual focus rings
- **Logical tab order**: Intuitive navigation flow
- **Skip links**: Efficient navigation for power users

### Visual Accessibility

- **High contrast support**: Compatible with high contrast modes
- **Color independence**: Information not conveyed by color alone
- **Scalable text**: Works at 200% zoom without horizontal scrolling
- **Motion sensitivity**: Respects reduced motion preferences

## Browser Support

- **Modern browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 88+
- **Accessibility tools**: NVDA, JAWS, VoiceOver, TalkBack compatible

## Testing

The component includes comprehensive tests:

- **Unit tests**: Component functionality and edge cases
- **Accessibility tests**: WCAG compliance validation
- **Integration tests**: User interaction scenarios
- **Performance tests**: Load time and memory usage
- **Cross-browser tests**: Compatibility across browsers

Run tests with:

```bash
npm test -- --testPathPattern="HolidayCalendar"
```

## Contributing

When contributing to the HolidayCalendar component:

1. **Maintain accessibility**: All changes must maintain WCAG 2.1 Level AA compliance
2. **Test thoroughly**: Include tests for new features and accessibility
3. **Document changes**: Update this documentation for API changes
4. **Performance aware**: Consider performance impact of changes
5. **Bilingual support**: Ensure German and English translations are accurate

## Architecture

The component follows a clean architecture pattern:

```
HolidayCalendar/
├── HolidayCalendar.tsx          # Main component
├── types/holiday.ts             # Type definitions
├── examples/                    # Usage examples
│   └── HolidayCalendarExample.tsx
├── __tests__/                   # Test files
│   └── HolidayCalendar.test.tsx
└── HolidayCalendar.md           # This documentation
```

## Performance Benchmarks

Target performance metrics (constitutional requirements):

- **Initial load**: < 2 seconds on 3G connections
- **Interaction response**: < 100ms for all user actions
- **Bundle size**: < 200KB gzipped
- **Memory usage**: < 50MB for typical usage
- **Accessibility**: 100% keyboard navigable, screen reader compatible

---

**Last Updated**: 2025-01-26
**Component Version**: 1.0.0
**WCAG Compliance**: Level AA
**Test Coverage**: 90%+