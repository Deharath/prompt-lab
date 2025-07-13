/**
 * Type definitions for the AppSidebar component and its subcomponents
 *
 * This file contains all the TypeScript interfaces and types used by the
 * unified AppSidebar component with its three tabs (History, Configuration, Custom).
 */

// Type definition for JobSummary (from API)
// Re-export from shared-types
export type { JobSummary } from '@prompt-lab/shared-types';

/**
 * Props for the main AppSidebar component
 *
 * This interface defines all the props needed by the unified sidebar component
 * to handle its three tabs and various functionality.
 */
export interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
  onSelectJob?: (jobId: string) => void;
  onCompareJobs?: (baseId: string, compareId: string) => void;
  provider?: string;
  model?: string;
  onProviderChange?: (provider: string) => void;
  onModelChange?: (model: string) => void;
  onLoadTemplate?: (template: any) => void;
  onRunEvaluation?: () => void;
  onCancelEvaluation?: () => void;
  canRunEvaluation?: boolean;
  isRunning?: boolean;
  promptTokens?: number;
  estimatedCompletionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  template?: string;
  inputData?: string;
}

/**
 * Tab identifier type for the three sidebar tabs
 */
export type TabType = 'history' | 'configuration' | 'custom';

/**
 * Delete confirmation dialog state
 */
export interface DeleteConfirmation {
  jobId: string;
  shortId: string;
}

/**
 * Job comparison state for the comparison feature
 */
export interface ComparisonState {
  baseJobId?: string | undefined;
  compareJobId?: string | undefined;
}
