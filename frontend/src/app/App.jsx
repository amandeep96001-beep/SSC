import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/features/dashboard/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

export default App;
