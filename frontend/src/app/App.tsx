import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { SeoHead } from '@/shared/components/SeoHead';

function AppShell() {
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
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/home" element={<AppShell />} />
        <Route path="/drill" element={<AppShell />} />
        <Route path="/study/*" element={<AppShell />} />
        <Route path="/results" element={<AppShell />} />
        <Route path="/mock" element={<AppShell />} />
        <Route path="/mock/:mockId/exam" element={<AppShell />} />
        <Route path="/admin" element={<AppShell />} />
        <Route path="/roadmap" element={<AppShell />} />
        <Route path="/revision" element={<AppShell />} />
        <Route path="/performance" element={<AppShell />} />
        <Route path="/analytics" element={<AppShell />} />
        <Route path="/competition" element={<AppShell />} />
        <Route path="/reminders" element={<AppShell />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
