import { useCallback } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { SeoHead } from '@/shared/components/SeoHead';
import { LandingPage } from '@/features/landing';
import { paths } from '@/app/paths';

function isLandingPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === '/' || path === '/landing';
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const enterApp = useCallback(() => {
    navigate(paths.home);
  }, [navigate]);

  const landing = isLandingPath(location.pathname);

  return (
    <>
      <SeoHead path={landing ? '/' : location.pathname} noIndex={!landing} />
      {landing ? <LandingPage onGoToDashboard={enterApp} /> : <Dashboard />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
