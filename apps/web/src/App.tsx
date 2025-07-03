import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './Home.js';
import DiffPage from './pages/DiffPage.js';
import DashboardPage from './pages/DashboardPage.js';
import RunViewerPage from './pages/RunViewerPage.js';
import { useDarkModeStore } from './store/darkModeStore.js';
import { useEffect } from 'react';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { setDarkMode } = useDarkModeStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem('dark-mode-storage');

    if (!stored) {
      // If no stored preference, use system preference
      setDarkMode(mediaQuery.matches);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('dark-mode-storage')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setDarkMode]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground transition-colors duration-200">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/run/:id" element={<RunViewerPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
