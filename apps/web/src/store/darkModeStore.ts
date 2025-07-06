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
      isDarkMode: getSystemPreference(), // Initialize with system preference
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
      // Persist state to localStorage and update document class
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (str) {
            const { state } = JSON.parse(str);
            updateDocumentClass(state.isDarkMode);
            return { state };
          }
          // If no stored state, use system preference
          const isSystemDark = getSystemPreference();
          updateDocumentClass(isSystemDark);
          return { state: { isDarkMode: isSystemDark } };
        },
        setItem: (name, newValue) => {
          localStorage.setItem(name, JSON.stringify(newValue));
          updateDocumentClass(newValue.state.isDarkMode);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
