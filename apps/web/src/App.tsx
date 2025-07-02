import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home.js';
import DiffPage from './pages/DiffPage.js';
import DashboardPage from './pages/DashboardPage.js';
import RunViewerPage from './pages/RunViewerPage.js';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/run/:id" element={<RunViewerPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  </QueryClientProvider>
);

export default App;
