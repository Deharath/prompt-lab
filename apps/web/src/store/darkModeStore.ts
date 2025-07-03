import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

// Function to update document class
const updateDocumentClass = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Get system preference
const getSystemPreference = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set) => ({
      isDarkMode: getSystemPreference(), // Default to system preference
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          updateDocumentClass(newMode);
          return { isDarkMode: newMode };
        }),
      setDarkMode: (isDark: boolean) =>
        set(() => {
          updateDocumentClass(isDark);
          return { isDarkMode: isDark };
        }),
    }),
    {
      name: 'dark-mode-storage',
      // Initialize dark mode from localStorage on hydration
      onRehydrateStorage: () => (state) => {
        if (typeof document !== 'undefined' && state) {
          updateDocumentClass(state.isDarkMode);
        }
      },
    },
  ),
);

// Initialize dark mode on app start
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('dark-mode-storage');
  let shouldUseDark = getSystemPreference();

  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state && typeof state.isDarkMode === 'boolean') {
        shouldUseDark = state.isDarkMode;
      }
    } catch (error) {
      console.warn('Failed to parse dark mode storage:', error);
    }
  }

  updateDocumentClass(shouldUseDark);
}
