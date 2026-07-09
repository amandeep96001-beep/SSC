import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/shared/components/layout/GlobalErrorBoundary.jsx';
import '@/styles/index.css';
import App from '@/app/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
