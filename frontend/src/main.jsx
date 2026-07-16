import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/shared/components/layout/GlobalErrorBoundary.jsx';
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx';
import { ExamProvider } from '@/shared/context/ExamContext.jsx';
import { installBackTrap } from '@/shared/utils/backTrap';
import '@/styles/index.css';
import App from '@/app/App.jsx';

// Arm Back before React mounts — first system Back must stay in the app
installBackTrap();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <ExamProvider>
            <App />
          </ExamProvider>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);

