import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DarkModeToggle from '../../src/components/ui/DarkModeToggle.js';
import { useDarkModeStore } from '../../src/store/darkModeStore.js';

// Simple test component to verify dark mode integration
const TestDarkModeComponent = () => {
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-gray-900">
      <h1 className="text-gray-900 dark:text-white">
        Dark Mode Integration Test
      </h1>
      <DarkModeToggle />
      <div className="mt-4 rounded bg-gray-100 p-4 dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          This should change colors
        </p>
      </div>
    </div>
  );
};

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
    render(<TestDarkModeComponent />);

    expect(screen.getByText('Dark Mode Integration Test')).toBeInTheDocument();
  });

  it('should toggle dark mode when button is clicked', () => {
    render(<TestDarkModeComponent />);

    // Check that the document class was added
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Find and click the dark mode toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Check that the document class was added
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply dark mode styles to test elements', async () => {
    render(<TestDarkModeComponent />);

    // Get the store state directly rather than relying on DOM timing
    const { isDarkMode: initialMode } = useDarkModeStore.getState();

    // Toggle dark mode
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Wait for the store state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify the store state changed
    const { isDarkMode: newMode } = useDarkModeStore.getState();
    expect(newMode).toBe(!initialMode);
  });

  it('should persist dark mode state across component remounts', () => {
    // First render and toggle to dark mode
    const { unmount } = render(<TestDarkModeComponent />);
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Unmount component
    unmount();

    // Re-render component
    render(<TestDarkModeComponent />);

    // Should remember dark mode state
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update toggle button state based on current mode', () => {
    render(<TestDarkModeComponent />);

    // Get initial state and button
    let toggleButton = screen.getByRole('button');
    const initialAriaLabel = toggleButton.getAttribute('aria-label');

    // Click to toggle
    fireEvent.click(toggleButton);

    // Should now have different aria-label
    toggleButton = screen.getByRole('button');
    const newAriaLabel = toggleButton.getAttribute('aria-label');
    expect(newAriaLabel).not.toBe(initialAriaLabel);
  });
});
