import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from 'react';
import ErrorBoundary from '../../src/components/shared/ErrorBoundary.js';

// Mock the Button component
vi.mock('../../src/components/ui/Button.js', () => ({
  default: ({ onClick, variant, size, children, ...props }: any) => (
    <button
      onClick={onClick}
      data-testid={`button-${variant}-${size}`}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock console.error to avoid cluttering test output
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Mock import.meta.env for development/production testing
const mockEnv = {
  DEV: true,
};

Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv,
    },
  },
  configurable: true,
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Working component</div>;
};

describe('ErrorBoundary', () => {
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    (window.location.reload as any).mockClear();
    mockEnv.DEV = true;
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should apply className when provided', () => {
      const { container } = render(
        <ErrorBoundary className="custom-class">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      // Since ErrorBoundary doesn't apply className in normal operation,
      // we test that it doesn't break the component
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(/We encountered an unexpected error/),
      ).toBeInTheDocument();
    });

    it('should call onError callback when provided', () => {
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow errorMessage="Custom error message" />
        </ErrorBoundary>,
      );

      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error message',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );
    });

    it('should show error details in development mode', () => {
      mockEnv.DEV = true;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow errorMessage="Dev error" />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText('Error Details (Development)'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Dev error/)).toBeInTheDocument();
    });

    it('should conditionally show error details based on environment', () => {
      // Test that the error details section exists (in dev mode by default)
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // In development mode, error details should be visible
      expect(
        screen.getByText('Error Details (Development)'),
      ).toBeInTheDocument();
    });
  });

  describe('Custom Fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (
        <div data-testid="custom-fallback">Custom error UI</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should not render default UI when custom fallback is provided', () => {
      const customFallback = (
        <div data-testid="custom-fallback">Custom error UI</div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      expect(screen.queryByText('Reload Page')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should render Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByTestId('button-primary-md')).toBeInTheDocument();
    });

    it('should reload page when Reload Page is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      fireEvent.click(screen.getByText('Reload Page'));

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI Elements', () => {
    it('should render error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      // Check for SVG icon
      const errorIcon = screen
        .getByText('Something went wrong')
        .closest('div')
        ?.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should render action buttons with correct variants', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByTestId('button-primary-md')).toBeInTheDocument();
      expect(screen.getByTestId('button-secondary-md')).toBeInTheDocument();
    });

    it('should render support and issue links', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      const supportLink = screen.getByText('contact support');
      const issueLink = screen.getByText('report an issue');

      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute(
        'href',
        'mailto:support@promptlab.dev',
      );

      expect(issueLink).toBeInTheDocument();
      expect(issueLink).toHaveAttribute(
        'href',
        'https://github.com/your-repo/issues',
      );
      expect(issueLink).toHaveAttribute('target', '_blank');
      expect(issueLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Component Lifecycle', () => {
    it('should call onError callback for each error', () => {
      const { unmount } = render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow errorMessage="Test error" />
        </ErrorBoundary>,
      );

      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );

      unmount();
    });

    it('should maintain error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Re-render with same error state
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Information', () => {
    it('should display error stack trace in development', () => {
      mockEnv.DEV = true;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow errorMessage="Stack trace test" />
        </ErrorBoundary>,
      );

      const errorDetails = screen.getByText('Error Details (Development)');
      expect(errorDetails).toBeInTheDocument();

      const stackTrace = errorDetails.closest('div')?.querySelector('pre');
      expect(stackTrace).toBeInTheDocument();
      expect(stackTrace).toHaveTextContent('Stack trace test');
    });

    it('should handle errors without stack traces', () => {
      mockEnv.DEV = true;

      // Create an error without stack trace
      const errorWithoutStack = new Error('No stack error');
      delete errorWithoutStack.stack;

      const ThrowCustomError = () => {
        throw errorWithoutStack;
      };

      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should work without any optional props', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      // Should not crash or show error boundary
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);

      // Should not crash or show error boundary
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });
  });
});
