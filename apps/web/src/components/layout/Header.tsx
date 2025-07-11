/**
 * Header Component - Top navigation bar
 *
 * This component provides the main header with:
 * - Logo and branding
 * - Navigation menu
 * - User controls
 * - Theme toggle
 * - Sidebar toggle
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToggle } from '../../hooks/useToggle.js';
import type { BaseComponentProps } from '../../types/global.js';
import Button from '../ui/Button.js';
import DarkModeToggle from '../ui/DarkModeToggle.js';
import { navigationItems } from '../../constants/app.js';
import { formatTokenCount } from '../../utils/tokenCounter.js';

interface HeaderProps extends BaseComponentProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  hideSidebarToggle?: boolean;
  hideNavigation?: boolean; // Option to hide main navigation
  // Optional token summary props
  promptTokens?: number;
  estimatedCompletionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
}

/**
 * Header - Main application header
 *
 * Provides navigation, branding, and user controls at the top of the application.
 */
const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onToggleMobileSidebar,
  hideSidebarToggle = false,
  hideNavigation = false,
  promptTokens,
  estimatedCompletionTokens,
  totalTokens,
  estimatedCost,
  className = '',
  ...props
}) => {
  const location = useLocation();
  const [mobileMenuOpen, toggleMobileMenu] = useToggle(false);

  return (
    <header
      className={`bg-card border-border sticky top-0 z-50 flex h-16 items-center justify-between border-b px-4 lg:px-6 ${className}`}
      {...props}
    >
      <div className="flex flex-1 items-center space-x-4">
        {/* Sidebar Toggle */}
        {!hideSidebarToggle && (
          <>
            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="hidden lg:flex"
              aria-label={
                sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    sidebarCollapsed
                      ? 'M4 6h16M4 12h16M4 18h16'
                      : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
                  }
                />
              </svg>
            </Button>
          </>
        )}

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-foreground text-lg font-bold">PromptLab</h1>
          </div>
        </Link>
      </div>

      {/* Absolutely Centered Navigation - Always in center of screen */}
      {!hideNavigation && (
        <div className="absolute left-1/2 hidden -translate-x-1/2 transform md:flex">
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Right Side Controls */}
      <div className="flex flex-1 items-center justify-end space-x-2">
        {/* Status Panel - More useful metrics, fully responsive */}
        {promptTokens !== undefined && (
          <div className="bg-muted/30 border-border/50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm sm:gap-4 sm:px-4">
            {/* Cost - Most important metric first */}
            <div className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              <span className="font-mono font-bold text-green-600 dark:text-green-400">
                {(estimatedCost || 0) > 0
                  ? (estimatedCost || 0) < 0.01
                    ? '<$0.01'
                    : `$${(estimatedCost || 0).toFixed(4)}`
                  : '$0.00'}
              </span>
            </div>

            {/* Token efficiency - Combined useful metric */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <svg
                className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-muted-foreground text-xs">Tokens:</span>
              <span className="text-foreground font-mono text-xs font-semibold">
                {(totalTokens || 0) > 0
                  ? formatTokenCount(totalTokens || 0)
                  : '0'}
              </span>
            </div>

            {/* Input length indicator - More useful than raw prompt tokens on mobile */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <svg
                className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-foreground font-mono text-xs font-semibold">
                {promptTokens > 1000
                  ? `${(promptTokens / 1000).toFixed(1)}k`
                  : promptTokens}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="h-10 w-10 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                mobileMenuOpen
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z'
              }
            />
          </svg>
        </Button>

        {/* Dark Mode Toggle */}
        <DarkModeToggle />
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="bg-card border-border absolute top-16 right-0 left-0 border-b shadow-lg md:hidden">
          <nav className="space-y-1 px-4 py-3">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={toggleMobileMenu}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
