import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true
    };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keep failures contained without adding logging dependencies.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh items-center justify-center bg-app-bg px-4 text-app-text">
          <div className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-5 shadow-sm">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              Close and reopen the app. Your saved settings and history remain on this device.
            </p>
            <button
              type="button"
              className="mt-4 min-h-12 w-full rounded-lg bg-app-accent px-4 text-sm font-bold text-white dark:text-slate-950"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

