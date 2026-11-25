import { Component } from 'react';
import type { ReactNode } from 'react';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="app-shell">
        <h1>Allogator hit an error</h1>
        <p>Try again or reload the page to reopen the calculator.</p>
        <div className="dialog-actions">
          <button
            className="button secondary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
