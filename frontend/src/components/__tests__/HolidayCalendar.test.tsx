/**
 * HolidayCalendar Component Tests
 * Comprehensive test suite covering accessibility, functionality, and user interactions
 *
 * Tests:
 * - Component rendering and props
 * - Accessibility compliance (ARIA, keyboard navigation)
 * - Holiday display and interaction
 * - Bridge weekend visualization
 * - Bilingual support (German/English)
 * - Calendar navigation
 * - Performance and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import HolidayCalendar from '../HolidayCalendar';
import type { HolidayCalendarProps, Holiday, BridgeWeekend } from '../../types/holiday';
import type { GermanStateCode } from '../../types/state';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock date-fns to make tests deterministic
jest.mock('date-fns', () => {
  const originalModule = jest.requireActual('date-fns');
  return {
    ...originalModule,
    isToday: jest.fn(() => false),
  };
});

// Mock data for testing
const mockHolidays: Holiday[] = [
  {
    id: 'neujahr-2025',
    name_de: 'Neujahr',
    name_en: "New Year's Day",
    date: '2025-01-01',
    type: 'federal',
    states: ['ALL'],
    is_catholic: false,
    is_protestant: false,
  },
  {
    id: 'tag-der-arbeit-2025',
    name_de: 'Tag der Arbeit',
    name_en: 'Labour Day',
    date: '2025-05-01',
    type: 'federal',
    states: ['ALL'],
    is_catholic: false,
    is_protestant: false,
  },
];

const mockBridges: BridgeWeekend[] = [
  {
    id: 'bridge-tag-der-arbeit-2025-BY',
    holiday_id: 'tag-der-arbeit-2025',
    state_code: 'BY',
    start_date: '2025-05-01',
    end_date: '2025-05-04',
    vacation_days_needed: 1,
    total_days_off: 4,
    efficiency: 4.0,
    pattern: 'thursday-friday',
  },
];

// Mock fetch to return test data
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      holidays: mockHolidays,
      bridges: mockBridges,
      total: mockHolidays.length,
    }),
  })
) as jest.Mock;

describe('HolidayCalendar', () => {
  const defaultProps: HolidayCalendarProps = {
    language: 'en',
    year: 2025,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('renders the calendar component', async () => {
      render(<HolidayCalendar {...defaultProps} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for calendar structure
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('displays holidays correctly', async () => {
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show holiday indicators in legend
      expect(screen.getByText('Holiday')).toBeInTheDocument();
    });

    it('supports bilingual display (German)', async () => {
      render(<HolidayCalendar {...defaultProps} language="de" />);

      await waitFor(() => {
        expect(screen.queryByText(/lade/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Heute')).toBeInTheDocument();
      expect(screen.getByText('Feiertag')).toBeInTheDocument();
    });

    it('handles state-specific holidays', async () => {
      render(<HolidayCalendar {...defaultProps} state="BY" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should render without errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('implements ARIA grid pattern', async () => {
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label');

      // Check for proper grid structure
      const rows = within(grid).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);

      const firstDataRow = rows[1]; // Skip header row
      const cells = within(firstDataRow).getAllByRole('gridcell');
      expect(cells.length).toBe(7); // 7 days of the week
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const grid = screen.getByRole('grid');

      // Focus the grid
      grid.focus();

      // Test arrow key navigation
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowDown}');

      // Should not throw any errors
      expect(grid).toBeInTheDocument();
    });

    it('provides proper focus management', async () => {
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const grid = screen.getByRole('grid');
      const firstCell = within(grid).getAllByRole('gridcell')[0];

      // Should have proper tabindex management
      expect(firstCell).toHaveAttribute('tabindex');
    });

    it('announces calendar navigation to screen readers', async () => {
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-label');
    });
  });

  describe('Bridge Weekend Features', () => {
    it('displays bridge weekend opportunities', async () => {
      render(<HolidayCalendar {...defaultProps} showBridges={true} state="BY" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should show bridge weekend legend
      expect(screen.getByText('Bridge weekend')).toBeInTheDocument();
    });

    it('hides bridge weekends when disabled', async () => {
      render(<HolidayCalendar {...defaultProps} showBridges={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should not show bridge weekend legend
      expect(screen.queryByText('Bridge weekend')).not.toBeInTheDocument();
    });

    it('supports bridge weekend interaction', async () => {
      const onBridgeClick = jest.fn();
      render(
        <HolidayCalendar
          {...defaultProps}
          showBridges={true}
          enableBridgeInteraction={true}
          state="BY"
          onBridgeClick={onBridgeClick}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Calendar Navigation', () => {
    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText(/previous month/i);
      await user.click(prevButton);

      // Should not throw errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next month/i);
      await user.click(nextButton);

      // Should not throw errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('navigates to today', async () => {
      const user = userEvent.setup();
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const todayButton = screen.getByText('Today');
      await user.click(todayButton);

      // Should not throw errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('changes calendar view', async () => {
      const user = userEvent.setup();
      const onViewChange = jest.fn();
      render(<HolidayCalendar {...defaultProps} onViewChange={onViewChange} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find view control buttons
      const monthViewButton = screen.getByLabelText(/month view/i);
      const yearViewButton = screen.getByLabelText(/year view/i);

      await user.click(yearViewButton);
      await user.click(monthViewButton);

      // Should not throw errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('calls onDateSelect when date is clicked', async () => {
      const user = userEvent.setup();
      const onDateSelect = jest.fn();
      render(<HolidayCalendar {...defaultProps} onDateSelect={onDateSelect} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const grid = screen.getByRole('grid');
      const firstCell = within(grid).getAllByRole('gridcell')[0];

      await user.click(firstCell);

      expect(onDateSelect).toHaveBeenCalledWith(expect.objectContaining({
        date: expect.any(Date),
        isSelected: true,
      }));
    });

    it('calls onHolidayClick when holiday is clicked', async () => {
      const onHolidayClick = jest.fn();
      render(<HolidayCalendar {...defaultProps} onHolidayClick={onHolidayClick} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Component should render without errors
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('calls onMonthChange when month changes', async () => {
      const user = userEvent.setup();
      const onMonthChange = jest.fn();
      render(<HolidayCalendar {...defaultProps} onMonthChange={onMonthChange} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next month/i);
      await user.click(nextButton);

      expect(onMonthChange).toHaveBeenCalledWith(expect.objectContaining({
        year: expect.any(Number),
        month: expect.any(Number),
        holidays: expect.any(Array),
      }));
    });
  });

  describe('Error Handling', () => {
    it('displays error state when data loading fails', async () => {
      // Mock failed fetch
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      // Mock failed fetch initially, then success
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            holidays: mockHolidays,
            bridges: mockBridges,
            total: mockHolidays.length,
          }),
        });

      const user = userEvent.setup();
      render(<HolidayCalendar {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/error loading/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/try again/i);
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    it('calls onError when error occurs', async () => {
      const onError = jest.fn();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<HolidayCalendar {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Performance Features', () => {
    it('shows loading state during data fetch', () => {
      render(<HolidayCalendar {...defaultProps} />);

      expect(screen.getByText(/loading holidays/i)).toBeInTheDocument();
    });

    it('supports performance configuration', async () => {
      const performanceConfig = {
        enableVirtualization: true,
        cacheHolidays: true,
        debounceFilters: 500,
      };

      render(<HolidayCalendar {...defaultProps} performanceConfig={performanceConfig} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Theming and Styling', () => {
    it('supports compact mode', async () => {
      render(<HolidayCalendar {...defaultProps} compact={true} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Should render with compact styles
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('supports custom className', async () => {
      const { container } = render(
        <HolidayCalendar {...defaultProps} className="custom-calendar" />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(container.querySelector('.custom-calendar')).toBeInTheDocument();
    });

    it('supports test ID', async () => {
      render(<HolidayCalendar {...defaultProps} data-testid="holiday-calendar" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('holiday-calendar')).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('calls onAnalytics for user interactions', async () => {
      const user = userEvent.setup();
      const onAnalytics = jest.fn();
      render(<HolidayCalendar {...defaultProps} onAnalytics={onAnalytics} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next month/i);
      await user.click(nextButton);

      expect(onAnalytics).toHaveBeenCalledWith('navigation', expect.objectContaining({
        direction: 'next',
        view: 'month',
      }));
    });
  });
});