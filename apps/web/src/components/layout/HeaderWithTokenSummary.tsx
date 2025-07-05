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
    <header className="border-border bg-card/50 sticky top-0 z-40 flex-shrink-0 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Title and Mobile Toggle */}
        <div className="flex flex-1 items-center space-x-4">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="hover:bg-muted/50 rounded-lg p-2 transition-colors lg:hidden"
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
            <h1 className="text-foreground text-lg font-semibold">
              Prompt evaluation workspace
            </h1>
          </div>
        </div>

        {/* Fixed Navigation - Always centered relative to viewport */}
        <div className="fixed top-4 left-1/2 z-50 hidden -translate-x-1/2 transform md:flex">
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

        {/* Spacer for desktop navigation (fixed positioning) */}
        <div className="hidden flex-1 md:block" />

        {/* Right Side - Token Info and Controls */}
        <div className="flex flex-1 items-center justify-end space-x-3">
          {/* Always visible Token Summary */}
          <div className="bg-muted/30 border-border/50 hidden items-center gap-6 rounded-lg border px-4 py-2 text-sm sm:flex">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Prompt Tokens:
              </span>
              <span className="text-foreground font-mono font-semibold">
                {promptTokens > 0 ? promptTokens.toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Est. Output:
              </span>
              <span className="text-foreground font-mono font-semibold">
                {estimatedCompletionTokens > 0
                  ? estimatedCompletionTokens.toLocaleString()
                  : '-'}
              </span>
            </div>
            <div className="border-border flex items-center gap-2 border-l pl-6">
              <span className="text-muted-foreground text-xs font-medium">
                Total Tokens:
              </span>
              <span className="text-primary font-mono font-bold">
                {totalTokens > 0 ? totalTokens.toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
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
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="border-border bg-card border-t md:hidden">
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

export default HeaderWithTokenSummary;
