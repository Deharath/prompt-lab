import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DarkModeTest from './DarkModeTest.js';

describe('Dark Mode Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset document class
    document.documentElement.classList.remove('dark');

    // Mock matchMedia for system preference detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false, // Default to light mode
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should render with correct initial state', () => {
    render(<DarkModeTest />);

    expect(screen.getByText('Dark Mode Test')).toBeInTheDocument();
    expect(screen.getByText(/Current mode: Light/)).toBeInTheDocument();
    expect(screen.getByText(/HTML class: no dark class/)).toBeInTheDocument();
  });

  it('should toggle dark mode when button is clicked', () => {
    render(<DarkModeTest />);

    const toggleButton = screen.getByText(/Toggle to Dark Mode/);
    fireEvent.click(toggleButton);

    // Check that the text updates
    expect(screen.getByText(/Current mode: Dark/)).toBeInTheDocument();
    expect(screen.getByText(/HTML class: dark/)).toBeInTheDocument();

    // Check that the document class was added
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply dark mode styles to test elements', () => {
    render(<DarkModeTest />);

    // Find test cards
    const cardExample = screen.getByText('Card Example').closest('div');
    const secondaryCard = screen.getByText('Secondary Card').closest('div');

    // Initially should have light mode classes
    expect(cardExample).toHaveClass('bg-white');
    expect(secondaryCard).toHaveClass('bg-gray-50');

    // Toggle to dark mode
    const toggleButton = screen.getByText(/Toggle to Dark Mode/);
    fireEvent.click(toggleButton);

    // Should now have dark mode classes applied via Tailwind's dark: utilities
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should persist dark mode state across component remounts', () => {
    // First render and toggle to dark mode
    const { unmount } = render(<DarkModeTest />);
    const toggleButton = screen.getByText(/Toggle to Dark Mode/);
    fireEvent.click(toggleButton);

    // Unmount component
    unmount();

    // Re-render component
    render(<DarkModeTest />);

    // Should remember dark mode state
    expect(screen.getByText(/Current mode: Dark/)).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update toggle button text based on current mode', () => {
    render(<DarkModeTest />);

    // Initially should show "Toggle to Dark Mode"
    let toggleButton = screen.getByText(/Toggle to Dark Mode/);
    expect(toggleButton).toBeInTheDocument();

    // Click to toggle
    fireEvent.click(toggleButton);

    // Should now show "Toggle to Light Mode"
    toggleButton = screen.getByText(/Toggle to Light Mode/);
    expect(toggleButton).toBeInTheDocument();
  });
});
