/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeaderWithTokenSummary from '../src/components/layout/HeaderWithTokenSummary.js';

// Mock the useToggle hook
const mockUseToggle = vi.fn().mockReturnValue([false, vi.fn(), vi.fn()]);

vi.mock('../../hooks/useToggle.js', () => ({
  useToggle: mockUseToggle,
}));

// Mock DarkModeToggle component
vi.mock('../ui/DarkModeToggle.js', () => ({
  default: () => <div data-testid="dark-mode-toggle">Dark Mode Toggle</div>,
}));

const defaultProps = {
  sidebarCollapsed: false,
  onToggleSidebar: vi.fn(),
  promptTokens: 100,
  estimatedCompletionTokens: 200,
  totalTokens: 300,
  estimatedCost: 0.005,
};

const renderHeader = (props = {}) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HeaderWithTokenSummary {...defaultProps} {...props} />
    </MemoryRouter>,
  );
};

describe('HeaderWithTokenSummary', () => {
  it('should render the mobile sidebar toggle button', () => {
    renderHeader();

    const mobileToggle = screen.getByLabelText('Toggle job history sidebar');
    expect(mobileToggle).toBeInTheDocument();
  });

  it('should call onToggleSidebar when mobile toggle is clicked', () => {
    const onToggleSidebar = vi.fn();
    renderHeader({ onToggleSidebar });

    const mobileToggle = screen.getByLabelText('Toggle job history sidebar');
    fireEvent.click(mobileToggle);

    expect(onToggleSidebar).toHaveBeenCalled();
  });

  it('should display token summary information', () => {
    renderHeader({
      promptTokens: 150,
      estimatedCompletionTokens: 250,
      totalTokens: 400,
      estimatedCost: 0.008,
    });

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('$0.0080')).toBeInTheDocument();
  });

  it('should display dashes when token values are zero', () => {
    renderHeader({
      promptTokens: 0,
      estimatedCompletionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    });

    // Should display dashes for zero values
    const dashElements = screen.getAllByText('-');
    expect(dashElements).toHaveLength(4); // One for each token metric
  });

  it('should display "<$0.01" for very small costs', () => {
    renderHeader({
      promptTokens: 10,
      estimatedCompletionTokens: 20,
      totalTokens: 30,
      estimatedCost: 0.005,
    });

    expect(screen.getByText('<$0.01')).toBeInTheDocument();
  });

  it('should format large token numbers with locale string', () => {
    renderHeader({
      promptTokens: 1234,
      estimatedCompletionTokens: 5678,
      totalTokens: 6912,
      estimatedCost: 0.123,
    });

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('5,678')).toBeInTheDocument();
    expect(screen.getByText('6,912')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    renderHeader();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <HeaderWithTokenSummary {...defaultProps} />
      </MemoryRouter>,
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should render dark mode toggle', () => {
    renderHeader();

    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
  });

  it('should show mobile title on small screens', () => {
    renderHeader();

    expect(screen.getByText('Prompt evaluation workspace')).toBeInTheDocument();
  });

  it('should render mobile navigation menu when open', () => {
    // Mock the toggle to return true (menu open)
    mockUseToggle.mockReturnValueOnce([true, vi.fn(), vi.fn()]);

    renderHeader();

    // Should render mobile navigation
    const mobileNav = screen.getByRole('navigation');
    expect(mobileNav).toBeInTheDocument();
  });

  it('should apply correct ARIA attributes', () => {
    renderHeader({ sidebarCollapsed: true });

    const mobileToggle = screen.getByLabelText('Toggle job history sidebar');
    expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should handle undefined or null token values gracefully', () => {
    renderHeader({
      promptTokens: undefined as any,
      estimatedCompletionTokens: null as any,
      totalTokens: undefined as any,
      estimatedCost: null as any,
    });

    // Should not crash and should display dashes for invalid values
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
  });
});
