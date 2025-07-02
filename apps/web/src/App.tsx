import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import DiffPage from './pages/DiffPage.js';
import DashboardPage from './pages/DashboardPage.js';

const App = () => (
  <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diff" element={<DiffPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  </div>
);

export default App;
