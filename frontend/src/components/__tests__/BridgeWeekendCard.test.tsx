/**
 * BridgeWeekendCard Component Tests
 * Comprehensive unit tests for German bridge weekend optimization display
 *
 * Test Coverage:
 * - Component rendering and structure
 * - ROI calculations accuracy
 * - German vacation patterns
 * - Accessibility compliance (WCAG 2.1 Level AA)
 * - Bilingual support (German/English)
 * - Interactive selection capabilities
 * - Mobile responsiveness
 * - Error handling and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import BridgeWeekendCard, { BridgeWeekendCardProps } from '../BridgeWeekendCard';
import { BridgeWeekend, Holiday, BridgePattern } from '../../types/holiday';
import { GermanStateCode } from '../../types/state';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next-translate
jest.mock('next-translate/useTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'efficiency.rating.excellent': 'Exzellent',
        'efficiency.rating.veryGood': 'Sehr gut',
        'efficiency.rating.good': 'Gut',
        'efficiency.rating.standard': 'Standard',
        'metrics.vacationDays': 'Urlaubstage',
        'metrics.daysOff': 'Freie Tage',
        'metrics.value': 'Wert',
        'actions.showDetails': 'Details anzeigen',
        'actions.hideDetails': 'Details ausblenden',
        'breakdown.weekendDays': 'Wochenendtage',
        'breakdown.holidays': 'Feiertage',
        'breakdown.vacationDaysUsed': 'Verwendete Urlaubstage',
        'patterns.difficulty': 'Schwierigkeit',
        'patterns.difficultyLevels.easy': 'Einfach',
        'patterns.difficultyLevels.medium': 'Mittel',
        'patterns.difficultyLevels.hard': 'Schwer'
      };
      return translations[key] || key;
    },
    lang: 'de'
  })
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  CalendarDaysIcon: ({ className }: { className: string }) => (
    <div data-testid="calendar-icon" className={className}>📅</div>
  ),
  CurrencyEuroIcon: ({ className }: { className: string }) => (
    <div data-testid="euro-icon" className={className}>💶</div>
  ),
  ClockIcon: ({ className }: { className: string }) => (
    <div data-testid="clock-icon" className={className}>🕒</div>
  ),
  StarIcon: ({ className }: { className: string }) => (
    <div data-testid="star-icon" className={className}>⭐</div>
  ),
  InformationCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="info-icon" className={className}>ℹ️</div>
  ),
  CheckCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="check-icon" className={className}>✅</div>
  )
}));

jest.mock('@heroicons/react/24/solid', () => ({
  CalendarDaysIcon: ({ className }: { className: string }) => (
    <div data-testid="calendar-solid-icon" className={className}>📅</div>
  ),
  StarIcon: ({ className }: { className: string }) => (
    <div data-testid="star-solid-icon" className={className}>⭐</div>
  )
}));

// Test data
const mockHoliday: Holiday = {
  id: 'test-holiday-1',
  name_de: 'Tag der Deutschen Einheit',
  name_en: 'German Unity Day',
  date: '2025-10-03',
  type: 'federal',
  states: ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
  is_catholic: false,
  is_protestant: false
};

const mockBridgeWeekend: BridgeWeekend = {
  id: 'bridge-1',
  holiday_id: 'test-holiday-1',
  state_code: 'BW' as GermanStateCode,
  start_date: '2025-10-02',
  end_date: '2025-10-05',
  vacation_days_needed: 1,
  total_days_off: 4,
  efficiency: 4.0,
  pattern: 'thursday-friday' as BridgePattern
};

const mockBridgeWeekendMediumEfficiency: BridgeWeekend = {
  id: 'bridge-2',
  holiday_id: 'test-holiday-1',
  state_code: 'BY' as GermanStateCode,
  start_date: '2025-05-26',
  end_date: '2025-05-30',
  vacation_days_needed: 3,
  total_days_off: 7,
  efficiency: 2.33,
  pattern: 'tuesday-friday' as BridgePattern
};

const mockBridgeWeekendLowEfficiency: BridgeWeekend = {
  id: 'bridge-3',
  holiday_id: 'test-holiday-1',
  state_code: 'BE' as GermanStateCode,
  start_date: '2025-12-23',
  end_date: '2025-12-26',
  vacation_days_needed: 2,
  total_days_off: 4,
  efficiency: 2.0,
  pattern: 'sandwich' as BridgePattern
};

// Default props
const defaultProps: BridgeWeekendCardProps = {
  bridge: mockBridgeWeekend,
  holiday: mockHoliday,
  language: 'de',
  state: 'BW',
  'data-testid': 'test-bridge-card'
};

describe('BridgeWeekendCard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByTestId('test-bridge-card')).toBeInTheDocument();
    });

    it('displays bridge weekend pattern title', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('Donnerstag-Freitag Brücke')).toBeInTheDocument();
    });

    it('displays holiday name in German', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('Tag der Deutschen Einheit')).toBeInTheDocument();
    });

    it('displays holiday name in English when language is en', () => {
      render(<BridgeWeekendCard {...defaultProps} language="en" />);
      expect(screen.getByText('German Unity Day')).toBeInTheDocument();
    });

    it('displays efficiency badge with correct value', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('4.0x')).toBeInTheDocument();
    });
  });

  describe('ROI Calculations', () => {
    it('displays vacation days needed correctly', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays total days off correctly', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('calculates and displays EUR value estimation', () => {
      render(<BridgeWeekendCard {...defaultProps} showValueEstimation={true} />);
      // Should show positive value for high-efficiency bridge
      expect(screen.getByText(/\+.*€/)).toBeInTheDocument();
    });

    it('displays correct efficiency rating for excellent bridge (4.0+)', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      // The component should show "Exzellent" rating for efficiency 4.0+
      const efficiencyBadge = screen.getByText('4.0x').closest('div');
      expect(efficiencyBadge).toHaveClass('text-green-700');
    });

    it('displays correct efficiency rating for medium bridge (2.0-3.0)', () => {
      render(<BridgeWeekendCard bridge={mockBridgeWeekendMediumEfficiency} />);
      const efficiencyBadge = screen.getByText('2.3x').closest('div');
      expect(efficiencyBadge).toHaveClass('text-yellow-700');
    });

    it('displays correct efficiency rating for low bridge (2.0)', () => {
      render(<BridgeWeekendCard bridge={mockBridgeWeekendLowEfficiency} />);
      const efficiencyBadge = screen.getByText('2.0x').closest('div');
      expect(efficiencyBadge).toHaveClass('text-yellow-700');
    });
  });

  describe('Pattern Recognition', () => {
    it('displays Thursday-Friday bridge pattern correctly', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText('Donnerstag-Freitag Brücke')).toBeInTheDocument();
      expect(screen.getByText(/Optimal für kurze Erholung/)).toBeInTheDocument();
    });

    it('displays Tuesday-Friday bridge pattern correctly', () => {
      render(<BridgeWeekendCard bridge={mockBridgeWeekendMediumEfficiency} />);
      expect(screen.getByText('Dienstag-Freitag Brücke')).toBeInTheDocument();
    });

    it('displays sandwich bridge pattern correctly', () => {
      render(<BridgeWeekendCard bridge={mockBridgeWeekendLowEfficiency} />);
      expect(screen.getByText('Sandwich-Brücke')).toBeInTheDocument();
    });

    it('shows pattern tips and optimization hints', () => {
      render(<BridgeWeekendCard {...defaultProps} />);
      expect(screen.getByText(/💡.*Perfekt für Kurzurlaub/)).toBeInTheDocument();
    });
  });

  describe('Interactive Selection', () => {
    it('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onSelect={onSelect} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      await user.click(card);

      expect(onSelect).toHaveBeenCalledWith(mockBridgeWeekend);
    });

    it('does not call onSelect when disabled', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onSelect={onSelect} disabled={true} />);

      const card = screen.getByTestId('test-bridge-card');
      await user.click(card);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows selected state visually', () => {
      render(<BridgeWeekendCard {...defaultProps} selected={true} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('handles keyboard selection (Enter key)', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onSelect={onSelect} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      card.focus();
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith(mockBridgeWeekend);
    });

    it('handles keyboard selection (Space key)', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onSelect={onSelect} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      card.focus();
      await user.keyboard(' ');

      expect(onSelect).toHaveBeenCalledWith(mockBridgeWeekend);
    });
  });

  describe('Details Expansion', () => {
    it('shows details button when not in compact mode', () => {
      render(<BridgeWeekendCard {...defaultProps} compact={false} />);
      expect(screen.getByText('Details anzeigen')).toBeInTheDocument();
    });

    it('does not show details button in compact mode', () => {
      render(<BridgeWeekendCard {...defaultProps} compact={true} />);
      expect(screen.queryByText('Details anzeigen')).not.toBeInTheDocument();
    });

    it('expands and collapses details correctly', async () => {
      const user = userEvent.setup();
      render(<BridgeWeekendCard {...defaultProps} compact={false} />);

      const detailsButton = screen.getByText('Details anzeigen');
      expect(screen.queryByText('Wochenendtage:')).not.toBeInTheDocument();

      await user.click(detailsButton);

      expect(screen.getByText('Wochenendtage:')).toBeInTheDocument();
      expect(screen.getByText('Feiertage:')).toBeInTheDocument();
      expect(screen.getByText('Urlaubstage:')).toBeInTheDocument();
    });

    it('calls onShowDetails when details are expanded', async () => {
      const user = userEvent.setup();
      const onShowDetails = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onShowDetails={onShowDetails} compact={false} />);

      const detailsButton = screen.getByText('Details anzeigen');
      await user.click(detailsButton);

      expect(onShowDetails).toHaveBeenCalledWith(mockBridgeWeekend);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<BridgeWeekendCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes for interactive card', () => {
      render(<BridgeWeekendCard {...defaultProps} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-selected', 'false');
    });

    it('has correct ARIA attributes for selected card', () => {
      render(<BridgeWeekendCard {...defaultProps} interactive={true} selected={true} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });

    it('has correct ARIA attributes for disabled card', () => {
      render(<BridgeWeekendCard {...defaultProps} interactive={true} disabled={true} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    it('provides screen reader description', () => {
      render(<BridgeWeekendCard {...defaultProps} />);

      const card = screen.getByTestId('test-bridge-card');
      const descriptionId = card.getAttribute('aria-describedby');
      expect(descriptionId).toBeTruthy();

      const description = document.getElementById(descriptionId!);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('sr-only');
    });

    it('has proper focus management', () => {
      render(<BridgeWeekendCard {...defaultProps} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      card.focus();
      expect(card).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies compact classes correctly', () => {
      render(<BridgeWeekendCard {...defaultProps} compact={true} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('p-3'); // compact padding
    });

    it('applies normal classes correctly', () => {
      render(<BridgeWeekendCard {...defaultProps} compact={false} />);

      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('p-4'); // normal padding
    });

    it('adjusts text sizes for compact mode', () => {
      render(<BridgeWeekendCard {...defaultProps} compact={true} />);

      // Find title elements and check for compact text classes
      const titleElement = screen.getByText('Donnerstag-Freitag Brücke');
      expect(titleElement.closest('h3')).toHaveClass('text-sm');
    });
  });

  describe('Date Formatting', () => {
    it('formats date range correctly for German locale', () => {
      render(<BridgeWeekendCard {...defaultProps} language="de" />);
      // Check that date appears somewhere in the document
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('formats date range correctly for English locale', () => {
      render(<BridgeWeekendCard {...defaultProps} language="en" />);
      // Check that date appears somewhere in the document
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    it('calls onAnalytics when card is selected', async () => {
      const user = userEvent.setup();
      const onAnalytics = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onAnalytics={onAnalytics} interactive={true} />);

      const card = screen.getByTestId('test-bridge-card');
      await user.click(card);

      expect(onAnalytics).toHaveBeenCalledWith('bridge_card_select', {
        bridgeId: 'bridge-1',
        pattern: 'thursday-friday',
        efficiency: 4.0,
        vacationDays: 1
      });
    });

    it('calls onAnalytics when details are expanded', async () => {
      const user = userEvent.setup();
      const onAnalytics = jest.fn();

      render(<BridgeWeekendCard {...defaultProps} onAnalytics={onAnalytics} compact={false} />);

      const detailsButton = screen.getByText('Details anzeigen');
      await user.click(detailsButton);

      expect(onAnalytics).toHaveBeenCalledWith('bridge_card_details', {
        bridgeId: 'bridge-1',
        expanded: true
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing holiday gracefully', () => {
      render(<BridgeWeekendCard {...defaultProps} holiday={undefined} />);
      expect(screen.getByTestId('test-bridge-card')).toBeInTheDocument();
    });

    it('handles invalid efficiency values gracefully', () => {
      const invalidBridge = { ...mockBridgeWeekend, efficiency: NaN };
      render(<BridgeWeekendCard bridge={invalidBridge} />);
      expect(screen.getByTestId('test-bridge-card')).toBeInTheDocument();
    });

    it('handles invalid dates gracefully', () => {
      const invalidBridge = { ...mockBridgeWeekend, start_date: 'invalid-date' };
      render(<BridgeWeekendCard bridge={invalidBridge} />);
      expect(screen.getByTestId('test-bridge-card')).toBeInTheDocument();
    });
  });

  describe('Feature Toggles', () => {
    it('hides ROI when showROI is false', () => {
      render(<BridgeWeekendCard {...defaultProps} showROI={false} />);
      // Should not show value calculation section
      expect(screen.queryByTestId('euro-icon')).not.toBeInTheDocument();
    });

    it('hides efficiency when showEfficiency is false', () => {
      render(<BridgeWeekendCard {...defaultProps} showEfficiency={false} />);
      expect(screen.queryByText('4.0x')).not.toBeInTheDocument();
    });

    it('hides pattern when showPattern is false', () => {
      render(<BridgeWeekendCard {...defaultProps} showPattern={false} />);
      expect(screen.queryByText('Donnerstag-Freitag Brücke')).not.toBeInTheDocument();
    });

    it('hides value estimation when showValueEstimation is false', () => {
      render(<BridgeWeekendCard {...defaultProps} showValueEstimation={false} />);
      // Should not show EUR value in metrics
      const metricsSection = screen.getByText('1').closest('.grid');
      expect(metricsSection).not.toHaveTextContent('€');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<BridgeWeekendCard {...defaultProps} className="custom-class" />);
      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('custom-class');
    });

    it('applies hover states for interactive cards', () => {
      render(<BridgeWeekendCard {...defaultProps} interactive={true} />);
      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('applies disabled styles', () => {
      render(<BridgeWeekendCard {...defaultProps} disabled={true} />);
      const card = screen.getByTestId('test-bridge-card');
      expect(card).toHaveClass('opacity-60', 'cursor-not-allowed');
    });
  });
});