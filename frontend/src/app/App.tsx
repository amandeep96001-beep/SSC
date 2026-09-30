import { useState, useCallback } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { SeoHead } from '@/shared/components/SeoHead';
import { LandingPage } from '@/features/landing';

const SESSION_KEY = 'crackuex_entered_app';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [entered, setEntered] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );

  const enterApp = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setEntered(true);
    if (location.pathname === '/landing') {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  // If user explicitly visits /landing, always show LandingPage
  if (location.pathname === '/landing') {
    return (
      <>
        <SeoHead />
        <LandingPage onGoToDashboard={enterApp} />
      </>
    );
  }

  // If user has not yet entered app and is at root '/', show LandingPage
  if (!entered && location.pathname === '/') {
    return (
      <>
        <SeoHead />
        <LandingPage onGoToDashboard={enterApp} />
      </>
    );
  }

  return (
    <>
      <SeoHead />
      <Dashboard />
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
