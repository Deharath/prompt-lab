/**
 * Footer Component - Application footer
 *
 * This component provides the main footer with:
 * - Application information
 * - Links to documentation
 * - Version information
 * - Status indicators
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { BaseComponentProps } from '../../types/global.js';

interface FooterProps extends BaseComponentProps {}

/**
 * Footer - Main application footer
 *
 * Provides footer information, links, and status at the bottom of the application.
 */
const Footer: React.FC<FooterProps> = ({ className = '', ...props }) => {
  return (
    <footer
      className={`bg-card/50 border-border mt-auto border-t px-4 py-6 lg:px-6 ${className}`}
      {...props}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          {/* Left section - App info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                <svg
                  className="h-3 w-3"
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
              <span className="text-foreground text-sm font-semibold">
                PromptLab
              </span>
            </div>
            <div className="bg-border h-4 w-px" />
            <span className="text-muted-foreground text-xs">v1.0.0</span>
          </div>

          {/* Center section - Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Documentation
            </a>
          </div>

          {/* Right section - Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-muted-foreground text-xs">
                All systems operational
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row - Copyright */}
        <div className="border-border mt-4 border-t pt-4 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} PromptLab. Built with React,
            TypeScript, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
