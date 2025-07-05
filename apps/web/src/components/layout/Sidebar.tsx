/**
 * Sidebar Component - Main application sidebar
 *
 * This component provides the main sidebar with:
 * - App sidebar integration
 * - Responsive behavior
 * - Mobile overlay support
 * - Collapse/expand functionality
 */

import React from 'react';
import type { BaseComponentProps } from '../../types/global.js';
import AppSidebar from '../AppSidebar/index.js';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../../store/jobStore.js';

interface SidebarProps extends BaseComponentProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  // Configuration props - passed from parent
  provider?: string;
  model?: string;
  onProviderChange?: (provider: string) => void;
  onModelChange?: (model: string) => void;
  onLoadTemplate?: (template: string) => void;
  onSelectJob?: (jobId: string) => void;
  onRunEvaluation?: () => void;
  canRunEvaluation?: boolean;
  isRunning?: boolean;
  // Token summary data
  promptTokens?: number;
  estimatedCompletionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  template?: string;
  inputData?: string;
}

/**
 * Sidebar - Main application sidebar wrapper
 *
 * Provides a wrapper around the AppSidebar component with:
 * - Responsive positioning
 * - Mobile overlay behavior
 * - Integration with app state
 */
const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onMobileClose,
  provider = 'openai',
  model = 'gpt-4o-mini',
  onProviderChange = () => {},
  onModelChange = () => {},
  onLoadTemplate = () => {},
  onSelectJob,
  onRunEvaluation = () => {},
  canRunEvaluation = false,
  isRunning = false,
  promptTokens = 0,
  estimatedCompletionTokens = 0,
  totalTokens = 0,
  estimatedCost = 0,
  template = '',
  inputData = '',
  className = '',
  ...props
}) => {
  const navigate = useNavigate();
  const { setBaseJob, setCompareJob } = useJobStore();

  const handleJobSelect = (jobId: string) => {
    // Call parent handler if provided
    if (onSelectJob) {
      onSelectJob(jobId);
    }
    // Close mobile sidebar after selection
    if (mobileOpen) {
      onMobileClose();
    }
  };

  const handleCompareJobs = (baseJobId: string, compareJobId: string) => {
    setBaseJob(baseJobId);
    setCompareJob(compareJobId);
    navigate(`/diff?base=${baseJobId}&compare=${compareJobId}`);
    // Close mobile sidebar after navigation
    if (mobileOpen) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden transition-all duration-300 ease-in-out lg:fixed lg:inset-y-16 lg:z-50 lg:flex lg:flex-col ${collapsed ? 'lg:w-16' : 'lg:w-80'} ${className} `}
        {...props}
      >
        <AppSidebar
          isCollapsed={collapsed}
          onToggle={() => {}} // Handled by parent
          onSelectJob={handleJobSelect}
          onCompareJobs={handleCompareJobs}
          provider={provider}
          model={model}
          onProviderChange={onProviderChange}
          onModelChange={onModelChange}
          onLoadTemplate={onLoadTemplate}
          onRunEvaluation={onRunEvaluation}
          canRunEvaluation={canRunEvaluation}
          isRunning={isRunning}
          promptTokens={promptTokens}
          estimatedCompletionTokens={estimatedCompletionTokens}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
          template={template}
          inputData={inputData}
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-16 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} `}
      >
        <AppSidebar
          isCollapsed={false}
          onToggle={onMobileClose}
          onSelectJob={handleJobSelect}
          onCompareJobs={handleCompareJobs}
          provider={provider}
          model={model}
          onProviderChange={onProviderChange}
          onModelChange={onModelChange}
          onLoadTemplate={onLoadTemplate}
          onRunEvaluation={onRunEvaluation}
          canRunEvaluation={canRunEvaluation}
          isRunning={isRunning}
          promptTokens={promptTokens}
          estimatedCompletionTokens={estimatedCompletionTokens}
          totalTokens={totalTokens}
          estimatedCost={estimatedCost}
          template={template}
          inputData={inputData}
        />
      </div>
    </>
  );
};

export default Sidebar;
