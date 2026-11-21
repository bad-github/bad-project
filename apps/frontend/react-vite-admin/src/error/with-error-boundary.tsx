import React from 'react';
import {ErrorBoundary} from './components/error-boundary';

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: any, reset: () => void) => React.ReactNode
) {
  const Wrapped: React.FC<P> = (props) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return Wrapped;
}