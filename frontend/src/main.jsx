import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from '@/shared/components/layout/GlobalErrorBoundary.jsx';
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx';
import { ExamProvider } from '@/shared/context/ExamContext.jsx';
import { installBackTrap } from '@/shared/utils/backTrap';
import '@/styles/index.css';
import App from '@/app/App.jsx';

installBackTrap();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
    ) : (
      tree
    )}
  </StrictMode>,
);
