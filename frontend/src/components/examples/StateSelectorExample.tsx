/**
 * StateSelector Usage Example
 * Demonstrates all features and integration patterns for StateSelector component
 *
 * This file shows how to properly integrate StateSelector with:
 * - Form libraries (react-hook-form)
 * - State management
 * - Analytics tracking
 * - Error handling
 * - Accessibility testing
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import StateSelector from '../StateSelector';
import type { GermanStateCode } from '../../types/state';

// Form data interface
interface VacationPlanForm {
  selectedState: GermanStateCode;
  email: string;
  vacationDays: number;
}

/**
 * Example integration with react-hook-form
 */
export function FormIntegrationExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<VacationPlanForm>({
    defaultValues: {
      selectedState: undefined,
      email: '',
      vacationDays: 5
    }
  });

  const selectedState = watch('selectedState');

  const onSubmit = (data: VacationPlanForm) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  const handleAnalytics = (event: string, data?: any) => {
    // Example analytics integration
    console.log('Analytics Event:', event, data);

    // You could integrate with analytics services like:
    // - Google Analytics
    // - Adobe Analytics
    // - Custom analytics API
    // gtag('event', 'state_selector_interaction', {
    //   event_category: 'form',
    //   event_label: event,
    //   custom_parameter_1: data?.stateCode
    // });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Vacation Planning Form
      </h2>

      {/* StateSelector with react-hook-form integration */}
      <Controller
        name="selectedState"
        control={control}
        rules={{
          required: 'Please select your state for accurate holiday calculation'
        }}
        render={({ field: { value, onChange, name }, fieldState: { error } }) => (
          <StateSelector
            value={value}
            onChange={onChange}
            name={name}
            required
            error={error?.message}
            showDetails
            showPopulation
            showReligion
            onAnalytics={handleAnalytics}
            data-testid="vacation-form-state-selector"
          />
        )}
      />

      {/* Additional form fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          {...control.register('email', {
            required: 'Email is required for calendar delivery'
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your.email@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Available Vacation Days
        </label>
        <input
          type="number"
          min="1"
          max="50"
          {...control.register('vacationDays', {
            required: 'Please specify your vacation days',
            min: { value: 1, message: 'At least 1 vacation day required' },
            max: { value: 50, message: 'Maximum 50 vacation days allowed' }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.vacationDays && (
          <p className="mt-1 text-sm text-red-600">{errors.vacationDays.message}</p>
        )}
      </div>

      {/* Display selected state info */}
      {selectedState && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedState}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Holiday calculations will be specific to this state's regulations.
          </p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!selectedState}
      >
        Calculate Bridge Weekends
      </button>
    </form>
  );
}

/**
 * Simple controlled component example
 */
export function SimpleExample() {
  const [selectedState, setSelectedState] = useState<GermanStateCode | undefined>();
  const [error, setError] = useState<string>('');

  const handleStateChange = (stateCode: GermanStateCode | undefined) => {
    setSelectedState(stateCode);
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!selectedState) {
      setError('Please select a state');
      return;
    }

    console.log('Selected state:', selectedState);
    // Handle submission
  };

  return (
    <div className="max-w-sm mx-auto">
      <h3 className="text-md font-medium text-gray-900 mb-4">
        Simple State Selection
      </h3>

      <StateSelector
        value={selectedState}
        onChange={handleStateChange}
        error={error}
        defaultSort="population"
        showDetails={false}
        showPopulation={true}
        showReligion={false}
        data-testid="simple-state-selector"
      />

      <button
        onClick={handleSubmit}
        className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
      >
        Submit
      </button>

      {selectedState && (
        <p className="mt-2 text-sm text-gray-600 text-center">
          You selected: <strong>{selectedState}</strong>
        </p>
      )}
    </div>
  );
}

/**
 * Multiple state selectors in one form
 */
export function MultipleSelectorsExample() {
  const [homeState, setHomeState] = useState<GermanStateCode | undefined>();
  const [workState, setWorkState] = useState<GermanStateCode | undefined>();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Multiple State Selection
      </h3>

      <StateSelector
        value={homeState}
        onChange={setHomeState}
        id="home-state"
        name="homeState"
        // Override label via translation or custom prop
        className="mb-4"
        showDetails
        defaultSort="alphabetical"
        data-testid="home-state-selector"
      />

      <StateSelector
        value={workState}
        onChange={setWorkState}
        id="work-state"
        name="workState"
        className="mb-4"
        showDetails
        defaultSort="alphabetical"
        data-testid="work-state-selector"
      />

      {homeState && workState && homeState === workState && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Home and work states are the same - you'll get standard holidays for {homeState}.
        </p>
      )}

      {homeState && workState && homeState !== workState && (
        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          Different states selected - holiday optimization will consider both {homeState} and {workState} regulations.
        </p>
      )}
    </div>
  );
}

/**
 * Accessibility testing helper component
 */
export function AccessibilityTestExample() {
  const [state, setState] = useState<GermanStateCode | undefined>();

  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">
        Accessibility Features Demo
      </h3>

      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Keyboard Navigation Test</h4>
          <p className="text-sm text-gray-600 mb-3">
            Use Tab, Arrow keys, Enter, Space, Escape to test navigation
          </p>
          <StateSelector
            value={state}
            onChange={setState}
            required
            showDetails
            showPopulation
            showReligion
            data-testid="accessibility-test-selector"
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Screen Reader Test</h4>
          <p className="text-sm text-gray-600 mb-3">
            All elements have proper ARIA labels and roles for screen readers
          </p>
          <StateSelector
            value={state}
            onChange={setState}
            error={state ? '' : 'This field demonstrates error announcement'}
            showDetails
            data-testid="screen-reader-test-selector"
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Disabled State Test</h4>
          <StateSelector
            value="BY"
            onChange={() => {}}
            disabled
            showDetails
            data-testid="disabled-test-selector"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Full featured example with all options
 */
export function FullFeaturedExample() {
  const [state, setState] = useState<GermanStateCode | undefined>();
  const [analytics, setAnalytics] = useState<Array<{event: string, data?: any}>>([]);

  const handleAnalytics = (event: string, data?: any) => {
    setAnalytics(prev => [...prev.slice(-9), { event, data }]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Full Featured State Selector
          </h3>

          <StateSelector
            value={state}
            onChange={setState}
            required
            showDetails
            showPopulation
            showReligion
            defaultSort="population"
            onAnalytics={handleAnalytics}
            className="mb-4"
            data-testid="full-featured-selector"
          />
        </div>

        <div>
          <h4 className="font-medium mb-3">Analytics Events</h4>
          <div className="h-48 overflow-y-auto bg-gray-50 p-3 rounded-md text-xs">
            {analytics.map((event, index) => (
              <div key={index} className="mb-1">
                <span className="font-mono text-blue-600">{event.event}</span>
                {event.data && (
                  <span className="text-gray-600 ml-2">
                    {JSON.stringify(event.data)}
                  </span>
                )}
              </div>
            ))}
            {analytics.length === 0 && (
              <p className="text-gray-500 text-center">
                No events yet. Interact with the selector to see analytics.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main example showcase component
 */
export default function StateSelectorExamples() {
  const [activeExample, setActiveExample] = useState('form');

  const examples = [
    { id: 'form', title: 'Form Integration', component: FormIntegrationExample },
    { id: 'simple', title: 'Simple Usage', component: SimpleExample },
    { id: 'multiple', title: 'Multiple Selectors', component: MultipleSelectorsExample },
    { id: 'accessibility', title: 'Accessibility Test', component: AccessibilityTestExample },
    { id: 'full', title: 'Full Featured', component: FullFeaturedExample }
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || FormIntegrationExample;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            StateSelector Component Examples
          </h1>
          <p className="text-gray-600">
            Bilingual German state selector with accessibility and UX features
          </p>
        </header>

        {/* Example navigation */}
        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeExample === example.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              )}
            >
              {example.title}
            </button>
          ))}
        </nav>

        {/* Active example */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ActiveComponent />
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Component Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Accessibility</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• WCAG 2.1 Level AA compliant</li>
                <li>• Full keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
                <li>• ARIA labels and roles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Bilingual UX</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• German formal addressing</li>
                <li>• English casual tone</li>
                <li>• Localized number formats</li>
                <li>• Cultural design patterns</li>
                <li>• Translation ready</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Search and filter</li>
                <li>• Sort by multiple criteria</li>
                <li>• Population data</li>
                <li>• Religious majority info</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}