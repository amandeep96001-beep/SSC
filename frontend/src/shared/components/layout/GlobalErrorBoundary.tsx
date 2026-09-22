import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { APP_NAME } from '@/shared/brand';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div
      className="global-error-fallback"
      role="alert"
      style={{
        padding: '2rem 1.25rem',
        textAlign: 'center',
        maxWidth: '28rem',
        margin: '3rem auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ color: '#c62828', marginBottom: '0.5rem' }}>Something went wrong</h2>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        {APP_NAME} hit an unexpected error. Retry or reload the page.
      </p>
      <pre
        style={{
          textAlign: 'left',
          background: '#f4f4f4',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          overflowX: 'auto',
          fontSize: '0.8rem',
          color: '#c62828',
        }}
      >
        {message}
      </pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1.1rem',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Go home
      </button>
    </div>
  );
}

export default function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
