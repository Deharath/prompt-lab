/**
 * Main Layout Component - Application shell with responsive design
 *
 * This component provides the main layout structure with:
 * - Responsive sidebar
 * - Header with navigation
 * - Main content area
 * - Footer
 * - Loading states
 * - Error boundaries
 */

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useStorage.js';
import type { BaseComponentProps } from '../../types/global.js';
import Header from './Header.js';
import Sidebar from './Sidebar.js';
import Footer from './Footer.js';
import { LoadingSpinner } from '../ui/LoadingState.js';
import ErrorBoundary from '../ErrorBoundary.js';

interface MainLayoutProps extends BaseComponentProps {
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

/**
 * MainLayout - The main application layout component
 *
 * Provides a consistent layout structure across all pages with:
 * - Responsive sidebar that collapses on mobile
 * - Header with navigation and user controls
 * - Main content area with proper scrolling
 * - Footer with links and status
 * - Loading and error states
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  loading = false,
  error = null,
  showSidebar = true,
  sidebarContent,
  className = '',
  ...props
}) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    'sidebar-collapsed',
    false,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Hide sidebar on certain pages or when explicitly disabled
  const hideSidebar =
    !showSidebar || ['/diff', '/dashboard'].includes(location.pathname);

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-200 ${className}`}
      {...props}
    >
      <ErrorBoundary>
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          hideSidebarToggle={hideSidebar}
        />

        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          {!hideSidebar &&
            (sidebarContent || (
              <Sidebar
                collapsed={sidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
              />
            ))}

          {/* Main Content */}
          <main
            className={`flex-1 overflow-hidden transition-all duration-300 ${
              hideSidebar
                ? 'w-full'
                : sidebarCollapsed
                  ? 'lg:ml-16'
                  : 'lg:ml-80'
            }`}
          >
            <div className="h-full overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-destructive text-lg font-semibold mb-2">
                      Something went wrong
                    </div>
                    <div className="text-muted-foreground">{error}</div>
                  </div>
                </div>
              ) : (
                <>{children || <Outlet />}</>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />

        {/* Mobile Sidebar Overlay */}
        {!hideSidebar && mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </ErrorBoundary>
    </div>
  );
};

export default MainLayout;
