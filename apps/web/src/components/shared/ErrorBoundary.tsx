/**
 * Error Boundary Component - React error boundary
 *
 * This component provides error boundary functionality with:
 * - Error catching and display
 * - Fallback UI
 * - Error reporting
 * - Recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '../ui/Button.js';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}

/**
 * ErrorBoundary - React error boundary component
 *
 * Catches JavaScript errors anywhere in the child component tree and displays
 * a fallback UI instead of crashing the entire application.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-foreground mb-2 text-2xl font-bold">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. This has been logged and our
                team will investigate.
              </p>
            </div>

            {/* Error details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                <h3 className="mb-2 text-sm font-semibold text-red-800">
                  Error Details (Development)
                </h3>
                <pre className="max-h-32 overflow-auto text-xs text-red-700">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleReset} variant="primary" size="md">
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="secondary" size="md">
                Reload Page
              </Button>
            </div>

            {/* Additional help */}
            <div className="border-border mt-6 border-t pt-6">
              <p className="text-muted-foreground text-xs">
                If this problem persists, please{' '}
                <a
                  href="mailto:support@promptlab.dev"
                  className="text-primary hover:underline"
                >
                  contact support
                </a>{' '}
                or{' '}
                <a
                  href="https://github.com/your-repo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  report an issue
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
