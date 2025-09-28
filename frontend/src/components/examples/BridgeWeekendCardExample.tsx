/**
 * BridgeWeekendCard Examples - Usage Demonstrations
 * Comprehensive examples showing BridgeWeekendCard component usage
 *
 * Examples included:
 * - Basic bridge weekend display
 * - Interactive selection grid
 * - German vacation optimization showcase
 * - Efficiency comparison examples
 * - Mobile-responsive layouts
 * - Accessibility testing scenarios
 */

import React, { useState } from 'react';
import BridgeWeekendCard from '../BridgeWeekendCard';
import { BridgeWeekend, Holiday, BridgePattern } from '../../types/holiday';
import { GermanStateCode } from '../../types/state';

// Example data for demonstrations
const exampleHolidays: Holiday[] = [
  {
    id: 'unity-day-2025',
    name_de: 'Tag der Deutschen Einheit',
    name_en: 'German Unity Day',
    date: '2025-10-03',
    type: 'federal',
    states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    is_catholic: false,
    is_protestant: false
  },
  {
    id: 'christmas-2025',
    name_de: '1. Weihnachtstag',
    name_en: 'Christmas Day',
    date: '2025-12-25',
    type: 'federal',
    states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    is_catholic: false,
    is_protestant: false
  },
  {
    id: 'epiphany-2025',
    name_de: 'Heilige Drei Könige',
    name_en: 'Epiphany',
    date: '2025-01-06',
    type: 'state',
    states: ['BW', 'BY', 'ST'],
    is_catholic: true,
    is_protestant: false
  }
];

const exampleBridges: BridgeWeekend[] = [
  {
    id: 'unity-bridge-2025',
    holiday_id: 'unity-day-2025',
    state_code: 'BW' as GermanStateCode,
    start_date: '2025-10-02',
    end_date: '2025-10-05',
    vacation_days_needed: 1,
    total_days_off: 4,
    efficiency: 4.0,
    pattern: 'thursday-friday' as BridgePattern
  },
  {
    id: 'christmas-mega-bridge-2025',
    holiday_id: 'christmas-2025',
    state_code: 'BY' as GermanStateCode,
    start_date: '2025-12-22',
    end_date: '2026-01-02',
    vacation_days_needed: 5,
    total_days_off: 12,
    efficiency: 2.4,
    pattern: 'extend-weekend' as BridgePattern
  },
  {
    id: 'epiphany-bridge-2025',
    holiday_id: 'epiphany-2025',
    state_code: 'BW' as GermanStateCode,
    start_date: '2025-01-04',
    end_date: '2025-01-06',
    vacation_days_needed: 1,
    total_days_off: 3,
    efficiency: 3.0,
    pattern: 'monday-tuesday' as BridgePattern
  },
  {
    id: 'sandwich-example',
    holiday_id: 'unity-day-2025',
    state_code: 'NW' as GermanStateCode,
    start_date: '2025-10-02',
    end_date: '2025-10-06',
    vacation_days_needed: 2,
    total_days_off: 5,
    efficiency: 2.5,
    pattern: 'sandwich' as BridgePattern
  }
];

/**
 * Basic Example - Single Bridge Weekend Card
 */
export function BasicExample() {
  const [selectedBridge, setSelectedBridge] = useState<string | undefined>();

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Basic Bridge Weekend Card
        </h2>
        <p className="text-gray-600">
          Simple example showing a high-efficiency bridge weekend opportunity
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <BridgeWeekendCard
          bridge={exampleBridges[0]}
          holiday={exampleHolidays[0]}
          language="de"
          state="BW"
          selected={selectedBridge === exampleBridges[0].id}
          onSelect={(bridge) => setSelectedBridge(bridge.id)}
          interactive={true}
          data-testid="basic-example-card"
        />
      </div>

      {selectedBridge && (
        <div className="text-center text-sm text-green-600">
          ✅ Bridge weekend selected: {selectedBridge}
        </div>
      )}
    </div>
  );
}

/**
 * Comparison Example - Multiple Bridge Weekends
 */
export function ComparisonExample() {
  const [selectedBridges, setSelectedBridges] = useState<string[]>([]);

  const toggleBridge = (bridgeId: string) => {
    setSelectedBridges(prev =>
      prev.includes(bridgeId)
        ? prev.filter(id => id !== bridgeId)
        : [...prev, bridgeId]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bridge Weekend Comparison
        </h2>
        <p className="text-gray-600">
          Compare different bridge weekend patterns and their efficiency
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exampleBridges.map((bridge, index) => (
          <BridgeWeekendCard
            key={bridge.id}
            bridge={bridge}
            holiday={exampleHolidays[index] || exampleHolidays[0]}
            language="de"
            state={bridge.state_code}
            selected={selectedBridges.includes(bridge.id)}
            onSelect={(bridge) => toggleBridge(bridge.id)}
            interactive={true}
            data-testid={`comparison-card-${index}`}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          {selectedBridges.length} bridge weekend(s) selected
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Example - Mobile-Optimized Layout
 */
export function CompactExample() {
  return (
    <div className="p-4 space-y-4 max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Mobile Layout
        </h2>
        <p className="text-sm text-gray-600">
          Compact cards optimized for mobile devices
        </p>
      </div>

      <div className="space-y-3">
        {exampleBridges.slice(0, 3).map((bridge, index) => (
          <BridgeWeekendCard
            key={bridge.id}
            bridge={bridge}
            holiday={exampleHolidays[index] || exampleHolidays[0]}
            language="de"
            state={bridge.state_code}
            compact={true}
            interactive={true}
            data-testid={`compact-card-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * English Example - Bilingual Support
 */
export function EnglishExample() {
  const [selectedBridge, setSelectedBridge] = useState<string | undefined>();

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          English Language Support
        </h2>
        <p className="text-gray-600">
          Bridge weekend cards with casual English translations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {exampleBridges.slice(0, 2).map((bridge, index) => (
          <BridgeWeekendCard
            key={bridge.id}
            bridge={bridge}
            holiday={exampleHolidays[index]}
            language="en"
            state={bridge.state_code}
            selected={selectedBridge === bridge.id}
            onSelect={(bridge) => setSelectedBridge(bridge.id)}
            interactive={true}
            data-testid={`english-card-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Feature Toggle Example - Different Display Options
 */
export function FeatureToggleExample() {
  const [showROI, setShowROI] = useState(true);
  const [showEfficiency, setShowEfficiency] = useState(true);
  const [showPattern, setShowPattern] = useState(true);
  const [showValueEstimation, setShowValueEstimation] = useState(true);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Feature Toggle Demo
        </h2>
        <p className="text-gray-600">
          Configure which features to display on bridge weekend cards
        </p>
      </div>

      {/* Toggle Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        {[
          { label: 'ROI Metrics', value: showROI, setter: setShowROI },
          { label: 'Efficiency Badge', value: showEfficiency, setter: setShowEfficiency },
          { label: 'Pattern Info', value: showPattern, setter: setShowPattern },
          { label: 'EUR Estimation', value: showValueEstimation, setter: setShowValueEstimation }
        ].map(({ label, value, setter }) => (
          <label key={label} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setter(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Example Card */}
      <div className="max-w-md mx-auto">
        <BridgeWeekendCard
          bridge={exampleBridges[0]}
          holiday={exampleHolidays[0]}
          language="de"
          state="BW"
          showROI={showROI}
          showEfficiency={showEfficiency}
          showPattern={showPattern}
          showValueEstimation={showValueEstimation}
          interactive={true}
          data-testid="feature-toggle-card"
        />
      </div>
    </div>
  );
}

/**
 * Accessibility Example - Screen Reader Optimized
 */
export function AccessibilityExample() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const handleAnalytics = (event: string, data?: Record<string, any>) => {
    const announcement = `${event}: ${JSON.stringify(data)}`;
    setAnnouncements(prev => [announcement, ...prev.slice(0, 4)]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Accessibility Features
        </h2>
        <p className="text-gray-600">
          Screen reader support, keyboard navigation, and ARIA compliance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold mb-3">Interactive Cards</h3>
          <div className="space-y-4">
            {exampleBridges.slice(0, 2).map((bridge, index) => (
              <BridgeWeekendCard
                key={bridge.id}
                bridge={bridge}
                holiday={exampleHolidays[index]}
                language="de"
                state={bridge.state_code}
                interactive={true}
                onAnalytics={handleAnalytics}
                data-testid={`a11y-card-${index}`}
              />
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Try using Tab, Enter, and Space keys to navigate and interact with the cards above.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Activity Log</h3>
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Interact with cards to see accessibility events...
              </p>
            ) : (
              <div className="space-y-2">
                {announcements.map((announcement, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700 bg-white p-2 rounded">
                    {announcement}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Demo - All Examples Combined
 */
export function FullDemoExample() {
  return (
    <div className="space-y-12">
      <BasicExample />
      <hr className="border-gray-200" />
      <ComparisonExample />
      <hr className="border-gray-200" />
      <CompactExample />
      <hr className="border-gray-200" />
      <EnglishExample />
      <hr className="border-gray-200" />
      <FeatureToggleExample />
      <hr className="border-gray-200" />
      <AccessibilityExample />
    </div>
  );
}