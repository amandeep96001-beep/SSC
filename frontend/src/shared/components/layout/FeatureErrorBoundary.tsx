import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { APP_NAME } from '@/shared/brand';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="feature-error-fallback" role="alert">
      <h2 className="feature-error-fallback__title">Something went wrong</h2>
      <p className="feature-error-fallback__msg">
        This section crashed. You can retry without leaving {APP_NAME}.
      </p>
      <pre className="feature-error-fallback__detail">{message}</pre>
      <button type="button" className="feature-error-fallback__btn" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

/** Wrap a workspace so one feature crash does not take down the whole shell. */
export function FeatureErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
