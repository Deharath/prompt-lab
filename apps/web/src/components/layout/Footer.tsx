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
      className={`mt-auto bg-card/50 border-t border-border py-6 px-4 lg:px-6 ${className}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Left section - App info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-linear-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white shadow-sm">
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
              <span className="text-sm font-semibold text-foreground">
                PromptLab
              </span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>

          {/* Center section - Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </a>
          </div>

          {/* Right section - Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">
                All systems operational
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row - Copyright */}
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PromptLab. Built with React,
            TypeScript, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
