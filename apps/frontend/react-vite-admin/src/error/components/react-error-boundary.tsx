import {ErrorBoundary} from 'react-error-boundary';
import {errorManager} from '../error-manager';
import {ErrorFallback} from './error-fallback';

export type ErrorProps = {
  children: React.ReactNode;
  resetKeys?: unknown[];
  onReset?: (details: any) => void;
};

export function ReactErrorBoundary({children, resetKeys, onReset}: ErrorProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={resetKeys}
      onError={(error, info) => {
        errorManager.report(error, info);
      }}
      onReset={(args) => {
        onReset?.(args);
        console.log('ReactErrorBoundary onReset');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
