import React from 'react';
import { useDarkModeStore } from '../store/darkModeStore.js';

/**
 * Simple test component to verify dark mode functionality
 */
const DarkModeTest = () => {
  const { isDarkMode, toggleDarkMode } = useDarkModeStore();

  return (
    <div className="min-h-screen bg-white p-8 transition-colors dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Dark Mode Test
        </h1>

        <div className="space-y-6">
          {/* Current State Display */}
          <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <p className="text-gray-700 dark:text-gray-300">
              Current mode:{' '}
              <span className="font-semibold">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              HTML class:{' '}
              {typeof document !== 'undefined'
                ? document.documentElement.classList.contains('dark')
                  ? 'dark'
                  : 'no dark class'
                : 'server'}
            </p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Toggle to {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>

          {/* Test Elements */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Card Example
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                This card should change colors when toggling dark mode.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Secondary Card
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Another example with different background colors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkModeTest;
