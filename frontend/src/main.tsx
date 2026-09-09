import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/shared/components/layout/GlobalErrorBoundary';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { ExamProvider } from '@/shared/context/ExamContext';
import { installBackTrap } from '@/shared/utils/backTrap';
import '@/styles/index.css';
import App from '@/app/App';

installBackTrap();

const tree = (
  <HelmetProvider>
    <GlobalErrorBoundary>
      <ThemeProvider>
        <ExamProvider>
          <App />
        </ExamProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  </HelmetProvider>
);

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  import.meta.env.DEV ? <StrictMode>{tree}</StrictMode> : tree,
);
