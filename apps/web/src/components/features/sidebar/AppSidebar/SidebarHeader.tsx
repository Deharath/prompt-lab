import React from 'react';
import type { TabType } from './types.js';

interface SidebarHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

/**
 * SidebarHeader - Header component for the AppSidebar
 *
 * Contains tab navigation for switching between History, Configuration, and Custom tabs.
 * Logo and collapse functionality are now handled by the main Header component.
 */
const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'history' as const,
      label: 'History',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      ariaLabel: 'View evaluation history and compare results',
    },
    {
      id: 'configuration' as const,
      label: 'Config',
      icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4',
      ariaLabel: 'Configure model settings and evaluation parameters',
    },
    {
      id: 'custom' as const,
      label: 'Custom',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      ariaLabel: 'Create and manage custom prompt templates',
    },
  ];

  return (
    <header className="border-border flex-shrink-0 border-b p-4">
      {/* Tab Navigation */}
      <div
        className="bg-muted flex rounded-lg p-1"
        role="tablist"
        aria-label="Sidebar sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`focus-visible:ring-primary flex flex-1 items-center justify-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            aria-label={tab.ariaLabel}
            title={tab.ariaLabel}
          >
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
                d={tab.icon}
              />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default SidebarHeader;
