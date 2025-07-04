/**
 * Type definitions for the AppSidebar component and its subcomponents
 *
 * This file contains all the TypeScript interfaces and types used by the
 * unified AppSidebar component with its three tabs (History, Configuration, Custom).
 */

// Type definition for JobSummary (from API)
export interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  provider: string;
  model: string;
  costUsd?: number | null;
  avgScore?: number | null;
  resultSnippet?: string | null;
}

/**
 * Props for the main AppSidebar component
 *
 * This interface defines all the props needed by the unified sidebar component
 * to handle its three tabs and various functionality.
 */
export interface AppSidebarProps {
  // Sidebar state
  isCollapsed: boolean;
  onToggle: () => void;

  // Job selection and comparison
  onSelectJob: (jobId: string) => void;
  onCompareJobs: (baseId: string, compareId: string) => void;

  // Model configuration props (Configuration tab)
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;

  // Custom prompt template loading (Custom tab)
  onLoadTemplate?: (template: string) => void;

  // Evaluation execution
  onRunEvaluation?: () => void;
  canRunEvaluation?: boolean;
  isRunning?: boolean;

  // Token usage and cost estimation
  promptTokens?: number;
  estimatedCompletionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;

  // Template and input data for token summary display
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
