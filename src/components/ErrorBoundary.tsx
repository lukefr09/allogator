import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <div
            className="max-w-md w-full text-center p-8 rounded-sm"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--rule)'
            }}
          >
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                style={{ color: 'var(--negative)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="section-title-sm mb-2">Something went wrong</h1>
            <p
              className="text-sm mb-6 transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              An unexpected error occurred. Your portfolio data is safe in the URL.
            </p>
            {this.state.error && (
              <p
                className="text-xs mb-4 font-mono p-2 rounded-sm overflow-auto max-h-24"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-tertiary)'
                }}
              >
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-outline"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="btn-outline"
                style={{
                  backgroundColor: 'var(--text)',
                  color: 'var(--bg)',
                  borderColor: 'var(--text)'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
