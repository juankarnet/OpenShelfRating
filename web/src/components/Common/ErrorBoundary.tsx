/**
 * Error boundary component to catch React rendering errors.
 */

import React, { Component } from 'react';
import type { ErrorInfo } from 'react';
import { ActionIcon } from './ActionIcon';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <span className="error-boundary-icon" aria-hidden="true">
              ⚠️
            </span>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              className="btn btn-primary icon-only-btn"
              onClick={() => window.location.reload()}
              data-tooltip="Refresh Page"
              aria-label="Refresh Page"
            >
              <ActionIcon name="confirm" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
