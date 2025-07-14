import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorType, createError } from '../../utils/errorUtils.js';

interface Props {
  children: ReactNode;
  fallback?: (error: AppError) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

export class JobErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: createError(ErrorType.UNKNOWN_ERROR, error.message, error, false),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Job Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-800">
            Something went wrong with the job system
          </h3>
          <p className="text-sm text-red-600">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 rounded bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
