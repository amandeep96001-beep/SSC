import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';

function ErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#d32f2f' }}>Oops, something went wrong.</h2>
      <p style={{ color: '#555' }}>We apologize for the inconvenience.</p>
      <pre style={{ textAlign: 'left', background: '#f4f4f4', padding: '1rem', borderRadius: '8px', overflowX: 'auto', color: '#d32f2f' }}>
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
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
