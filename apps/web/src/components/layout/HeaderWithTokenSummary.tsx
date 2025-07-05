import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToggle } from '../../hooks/useToggle.js';
import Button from '../ui/Button.js';
import DarkModeToggle from '../ui/DarkModeToggle.js';
import { navigationItems } from '../../constants/app.js';

interface HeaderWithTokenSummaryProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  promptTokens: number;
  estimatedCompletionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Header component specifically for the Home page with token summary
 */
const HeaderWithTokenSummary: React.FC<HeaderWithTokenSummaryProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  promptTokens,
  estimatedCompletionTokens,
  totalTokens,
  estimatedCost,
}) => {
  const location = useLocation();
  const [mobileMenuOpen, toggleMobileMenu] = useToggle(false);

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Title and Mobile Toggle */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors lg:hidden"
            aria-label="Toggle job history sidebar"
            aria-expanded={!sidebarCollapsed}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Title - Only visible on small screens */}
          <div className="flex items-center md:hidden">
            <h1 className="text-lg font-semibold text-foreground">
              Prompt evaluation workspace
            </h1>
          </div>
        </div>

        {/* Fixed Navigation - Always centered relative to viewport */}
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 hidden md:flex z-50">
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

        {/* Spacer for desktop navigation (fixed positioning) */}
        <div className="hidden md:block flex-1" />

        {/* Right Side - Token Info and Controls */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          {/* Always visible Token Summary */}
          <div className="hidden sm:flex items-center gap-6 text-sm bg-muted/30 px-4 py-2 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Prompt Tokens:
              </span>
              <span className="font-mono font-semibold text-foreground">
                {promptTokens > 0 ? promptTokens.toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Est. Output:
              </span>
              <span className="font-mono font-semibold text-foreground">
                {estimatedCompletionTokens > 0
                  ? estimatedCompletionTokens.toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2 border-l border-border pl-6">
              <span className="text-xs font-medium text-muted-foreground">
                Total Tokens:
              </span>
              <span className="font-mono font-bold text-primary">
                {totalTokens > 0 ? totalTokens.toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Estimated Cost:
              </span>
              <span className="font-mono font-bold text-green-600 dark:text-green-400">
                {estimatedCost > 0
                  ? estimatedCost < 0.01
                    ? '<$0.01'
                    : `$${estimatedCost.toFixed(4)}`
                  : '-'}
              </span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="md:hidden h-10 w-10"
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
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={toggleMobileMenu}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

export default HeaderWithTokenSummary;
