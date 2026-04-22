import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught a render error', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-error-shell">
        <div className="app-error-card">
          <div className="app-error-card__title">The app crashed while rendering.</div>
          <div className="app-error-card__body">
            Instead of showing a black screen, PostmanChat is surfacing the runtime error below.
          </div>
          <pre className="app-error-card__stack">{this.state.error.message}</pre>
          <button className="pm-btn pm-btn--primary" onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
