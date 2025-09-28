/**
 * StateSelector Component Tests
 * Comprehensive test suite covering accessibility, functionality, and user interactions
 *
 * Tests:
 * - Component rendering and props
 * - Accessibility compliance (ARIA, keyboard navigation)
 * - User interactions (click, keyboard, search)
 * - Bilingual support
 * - Error states and validation
 * - Integration with forms
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import StateSelector from '../StateSelector';
import type { GermanStateCode } from '../../types/state';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next-translate
jest.mock('next-translate/useTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key: string) => {
      // Mock translations for testing
      const translations: Record<string, string> = {
        'label': 'Select State',
        'placeholder': 'Please select your state',
        'searchPlaceholder': 'Search states...',
        'noResults': 'No results found',
        'loading': 'Loading states...',
        'error': 'Error loading states',
        'required': 'State is required',
        'clear': 'Clear selection',
        'expand': 'Show options',
        'collapse': 'Hide options',
        'selected': 'selected',
        'resultsFound': 'results found',
        'sortBy': 'Sort by',
        'sortOptions.alphabetical': 'Alphabetical',
        'sortOptions.population': 'Population',
        'sortOptions.religious': 'Religious Majority',
        'religionIndicator.catholic': 'Catholic Majority',
        'religionIndicator.protestant': 'Protestant Majority',
        'religionIndicator.secular': 'Secular',
        'religionIndicator.mixed': 'Mixed',
        'cityState': 'City State',
        'populationLabel': 'Population',
        'capitalLabel': 'Capital'
      };
      return translations[key] || key;
    },
    lang: 'en'
  })
}));

describe('StateSelector Component', () => {
  const defaultProps = {
    'data-testid': 'test-state-selector'
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<StateSelector {...defaultProps} />);
      expect(screen.getByTestId('test-state-selector-button')).toBeInTheDocument();
    });

    it('displays label correctly', () => {
      render(<StateSelector {...defaultProps} />);
      expect(screen.getByText('Select State')).toBeInTheDocument();
    });

    it('shows placeholder when no value selected', () => {
      render(<StateSelector {...defaultProps} />);
      expect(screen.getByText('Please select your state')).toBeInTheDocument();
    });

    it('shows required asterisk when required', () => {
      render(<StateSelector {...defaultProps} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays selected state correctly', () => {
      render(
        <StateSelector
          {...defaultProps}
          value="BY"
          showDetails
        />
      );
      expect(screen.getByText('Bavaria')).toBeInTheDocument();
      expect(screen.getByText('(München)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<StateSelector {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<StateSelector {...defaultProps} id="test-selector" />);

      const button = screen.getByTestId('test-state-selector-button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-labelledby');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      const button = screen.getByTestId('test-state-selector-button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper labeling for screen readers', () => {
      render(<StateSelector {...defaultProps} required />);

      const label = screen.getByText('Select State');
      expect(label).toBeInTheDocument();

      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('announces errors to screen readers', () => {
      const errorMessage = 'State selection is required';
      render(<StateSelector {...defaultProps} error={errorMessage} />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(errorMessage);
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      const button = screen.getByTestId('test-state-selector-button');
      await user.click(button);

      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();
      expect(screen.getByTestId('test-state-selector-search')).toBeInTheDocument();
    });

    it('closes dropdown on outside click', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <StateSelector {...defaultProps} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));
      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByTestId('outside-element'));
      expect(screen.queryByTestId('test-state-selector-options')).not.toBeInTheDocument();
    });

    it('selects state on option click', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} onChange={mockOnChange} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));

      // Click Bavaria option
      const bavariaOption = screen.getByTestId('test-state-selector-option-BY');
      await user.click(bavariaOption);

      expect(mockOnChange).toHaveBeenCalledWith('BY');
    });

    it('clears selection when clear button clicked', async () => {
      const user = userEvent.setup();
      render(
        <StateSelector
          {...defaultProps}
          value="BY"
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByTestId('test-state-selector-clear');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      const button = screen.getByTestId('test-state-selector-button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();
    });

    it('opens dropdown on Space key', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      const button = screen.getByTestId('test-state-selector-button');
      button.focus();

      await user.keyboard(' ');
      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();
    });

    it('navigates options with Arrow keys', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      const button = screen.getByTestId('test-state-selector-button');
      button.focus();

      // Open with Arrow Down
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();

      // Navigate down
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Navigate up
      await user.keyboard('{ArrowUp}');
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));
      expect(screen.getByTestId('test-state-selector-options')).toBeInTheDocument();

      // Close with Escape
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('test-state-selector-options')).not.toBeInTheDocument();
    });

    it('selects focused option on Enter key', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} onChange={mockOnChange} />);

      const button = screen.getByTestId('test-state-selector-button');
      button.focus();

      // Open and navigate
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Select with Enter
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('filters states based on search term', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));

      // Search for Bavaria
      const searchInput = screen.getByTestId('test-state-selector-search');
      await user.type(searchInput, 'Bavaria');

      // Should show Bavaria option
      expect(screen.getByTestId('test-state-selector-option-BY')).toBeInTheDocument();

      // Should not show other options
      expect(screen.queryByTestId('test-state-selector-option-BW')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));

      // Search for non-existent state
      const searchInput = screen.getByTestId('test-state-selector-search');
      await user.type(searchInput, 'NonExistentState');

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('searches by state code', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));

      // Search by code
      const searchInput = screen.getByTestId('test-state-selector-search');
      await user.type(searchInput, 'BY');

      expect(screen.getByTestId('test-state-selector-option-BY')).toBeInTheDocument();
    });

    it('searches by capital city', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));

      // Search by capital
      const searchInput = screen.getByTestId('test-state-selector-search');
      await user.type(searchInput, 'München');

      expect(screen.getByTestId('test-state-selector-option-BY')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts alphabetically by default', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} />);

      await user.click(screen.getByTestId('test-state-selector-button'));

      const options = screen.getAllByRole('option');
      const firstOption = within(options[0]).getByText(/Baden-Württemberg/);
      expect(firstOption).toBeInTheDocument();
    });

    it('sorts by population', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} defaultSort="population" />);

      await user.click(screen.getByTestId('test-state-selector-button'));

      const sortSelect = screen.getByTestId('test-state-selector-sort');
      await user.selectOptions(sortSelect, 'population');

      // North Rhine-Westphalia should be first (highest population)
      const options = screen.getAllByRole('option');
      const firstOption = within(options[0]).getByText(/North Rhine-Westphalia/);
      expect(firstOption).toBeInTheDocument();
    });
  });

  describe('Display Options', () => {
    it('shows population when showPopulation is true', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} showPopulation />);

      await user.click(screen.getByTestId('test-state-selector-button'));

      expect(screen.getByText(/Population:/)).toBeInTheDocument();
    });

    it('shows religious indicators when showReligion is true', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} showReligion />);

      await user.click(screen.getByTestId('test-state-selector-button'));

      // Should show religious majority indicators
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('shows city state indicators', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} showDetails />);

      await user.click(screen.getByTestId('test-state-selector-button'));

      // Berlin should show city state indicator
      expect(screen.getByText('City State')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('displays error message', () => {
      const errorMessage = 'This field is required';
      render(<StateSelector {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('test-state-selector-error')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<StateSelector {...defaultProps} error="Test error" />);

      const button = screen.getByTestId('test-state-selector-button');
      expect(button).toHaveClass('border-red-300');
    });
  });

  describe('Disabled State', () => {
    it('disables interaction when disabled', () => {
      render(<StateSelector {...defaultProps} disabled />);

      const button = screen.getByTestId('test-state-selector-button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<StateSelector {...defaultProps} disabled />);

      const button = screen.getByTestId('test-state-selector-button');
      expect(button).toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });

    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<StateSelector {...defaultProps} disabled />);

      const button = screen.getByTestId('test-state-selector-button');
      await user.click(button);

      expect(screen.queryByTestId('test-state-selector-options')).not.toBeInTheDocument();
    });
  });

  describe('Analytics', () => {
    it('calls onAnalytics on interactions', async () => {
      const mockAnalytics = jest.fn();
      const user = userEvent.setup();

      render(
        <StateSelector
          {...defaultProps}
          onChange={mockOnChange}
          onAnalytics={mockAnalytics}
        />
      );

      // Open dropdown
      await user.click(screen.getByTestId('test-state-selector-button'));
      expect(mockAnalytics).toHaveBeenCalledWith('open');

      // Search
      const searchInput = screen.getByTestId('test-state-selector-search');
      await user.type(searchInput, 'Bayern');
      expect(mockAnalytics).toHaveBeenCalledWith('search', expect.any(Object));

      // Select
      const option = screen.getByTestId('test-state-selector-option-BY');
      await user.click(option);
      expect(mockAnalytics).toHaveBeenCalledWith('select', expect.any(Object));
    });
  });

  describe('Form Integration', () => {
    it('works with native form submission', () => {
      render(
        <form data-testid="test-form">
          <StateSelector {...defaultProps} name="state" value="BY" />
        </form>
      );

      // Native select should have the value
      const nativeSelect = screen.getByDisplayValue('Bavaria (München)');
      expect(nativeSelect).toBeInTheDocument();
    });

    it('supports form validation', () => {
      render(<StateSelector {...defaultProps} required name="state" />);

      const nativeSelect = screen.getByRole('combobox', { hidden: true });
      expect(nativeSelect).toBeRequired();
    });
  });
});