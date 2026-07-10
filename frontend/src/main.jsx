import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/shared/components/layout/GlobalErrorBoundary.jsx';
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx';
import '@/styles/index.css';
import App from '@/app/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);

