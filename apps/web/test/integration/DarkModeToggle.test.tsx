import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DarkModeToggle from '../../src/components/ui/DarkModeToggle.js';
import { useDarkModeStore } from '../../src/store/darkModeStore.js';

// Mock the store for testing
vi.mock('../../src/store/darkModeStore.js', () => ({
  useDarkModeStore: vi.fn(),
}));

describe('DarkModeToggle Component', () => {
  const mockToggleDarkMode = vi.fn();
  const mockSetDarkMode = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset document class
    document.documentElement.classList.remove('dark');

    // Default mock implementation
    (useDarkModeStore as any).mockReturnValue({
      isDarkMode: false,
      toggleDarkMode: mockToggleDarkMode,
      setDarkMode: mockSetDarkMode,
    });
  });

  it('renders with light mode icon when in light mode', () => {
    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('renders with dark mode icon when in dark mode', () => {
    (useDarkModeStore as any).mockReturnValue({
      isDarkMode: true,
      toggleDarkMode: mockToggleDarkMode,
      setDarkMode: mockSetDarkMode,
    });

    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('calls toggleDarkMode when clicked', async () => {
    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('renders in compact mode when compact prop is true', () => {
    render(<DarkModeToggle compact />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'w-9'); // Compact size classes
  });

  it('renders in normal mode when compact prop is false or not provided', () => {
    render(<DarkModeToggle compact={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10'); // Normal size classes
  });

  it('has proper accessibility attributes', () => {
    render(<DarkModeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('updates UI when dark mode state changes', async () => {
    // Start in light mode
    const { rerender } = render(<DarkModeToggle />);

    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

    // Simulate state change to dark mode
    (useDarkModeStore as any).mockReturnValue({
      isDarkMode: true,
      toggleDarkMode: mockToggleDarkMode,
      setDarkMode: mockSetDarkMode,
    });

    rerender(<DarkModeToggle />);

    button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});
