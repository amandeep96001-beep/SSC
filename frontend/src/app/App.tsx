import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { SeoHead } from '@/shared/components/SeoHead';

function App() {
  return (
    <BrowserRouter>
      <SeoHead />
      <Dashboard />
    </BrowserRouter>
  );
}

export default App;
