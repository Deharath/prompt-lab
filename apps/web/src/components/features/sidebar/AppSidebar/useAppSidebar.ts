import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../../../api.js';
import { useJobStore } from '../../../../store/jobStore.js';
import { useKeyboardShortcuts } from '../../../../hooks/useKeyboardShortcuts.js';
import { KEYBOARD_SHORTCUTS } from '../../../../constants/shortcuts.js';
import { createShortcut } from '../../../../utils/keyboardUtils.js';
import { useJobsData } from '../../../../hooks/useJobsData.js';
import type { JobSummary, DeleteConfirmation, TabType } from './types.js';

/**
 * Custom hook for managing AppSidebar state and logic
 *
 * This hook encapsulates all the business logic for the unified sidebar component,
 * including job history management, comparison mode, tab navigation, and delete operations.
 *
 * @param isCollapsed - Whether the sidebar is currently collapsed
 * @param onSelectJob - Callback when a job is selected
 * @param onCompareJobs - Callback when comparing two jobs
 * @returns Object containing all state, handlers, and refs needed by AppSidebar
 */
export const useAppSidebar = (
  isCollapsed: boolean,
  onSelectJob: (jobId: string) => void,
  onCompareJobs: (baseId: string, compareId: string) => void,
  isRunning: boolean = false, // Add isRunning prop
) => {
  // Get job store state and actions
  const {
    start,
    append,
    finish,
    reset,
    comparison,
    setBaseJob,
    setCompareJob,
    clearComparison,
    // Configuration values from store
    temperature,
    topP,
    maxTokens,
    selectedMetrics,
    setTemperature,
    setTopP,
    setMaxTokens,
    setSelectedMetrics,
  } = useJobStore();

  // Remove duplicate useJobExecution call - use isRunning prop instead
  // const { currentJob, isExecuting, isStreaming } = useJobExecution();
  // const running = isExecuting || isStreaming;

  // Local component state
  const [compareMode, setCompareMode] = useState(false);
  const [focusedJobIndex, setFocusedJobIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation | null>(null);

  // Refs for keyboard navigation
  const jobListRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Query for job history
  const { data: history = [], isLoading, error } = useJobsData();

  // Query client for manual refetch
  const queryClient = useQueryClient();

  // Keyboard shortcuts for tab navigation
  const shortcuts = [
    createShortcut(
      KEYBOARD_SHORTCUTS.HISTORY_TAB,
      () => setActiveTab('history'),
      () => !isCollapsed,
    ),
    createShortcut(
      KEYBOARD_SHORTCUTS.CONFIG_TAB,
      () => setActiveTab('configuration'),
      () => !isCollapsed,
    ),
    createShortcut(
      KEYBOARD_SHORTCUTS.CUSTOM_TAB,
      () => setActiveTab('custom'),
      () => !isCollapsed,
    ),
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // Toggle comparison mode
  const toggleCompareMode = useCallback(() => {
    setCompareMode(!compareMode);
    if (compareMode) {
      // Exit comparison mode - clear comparison state
      clearComparison();
    }
  }, [compareMode, clearComparison]);

  // Handle job selection
  const handleSelect = useCallback(
    async (jobId: string) => {
      if (compareMode) {
        // In comparison mode, handle job selection differently
        if (!comparison.baseJobId) {
          // First job selected - set as base
          setBaseJob(jobId);
        } else if (!comparison.compareJobId) {
          // Second job selected - set as compare
          setCompareJob(jobId);
          onCompareJobs(comparison.baseJobId, jobId);
        } else {
          // Both jobs already selected - replace compare job
          setCompareJob(jobId);
          onCompareJobs(comparison.baseJobId, jobId);
        }
      } else {
        // Normal mode - just select the job
        onSelectJob(jobId);
      }
    },
    [
      compareMode,
      comparison,
      setBaseJob,
      setCompareJob,
      onCompareJobs,
      onSelectJob,
    ],
  );

  // Handle delete job
  const handleDelete = useCallback(
    (jobId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const job = history.find((j) => j.id === jobId);
      if (job) {
        setDeleteConfirmation({
          jobId,
          shortId: job.id.slice(0, 8),
        });
      }
    },
    [history],
  );

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (deleteConfirmation?.jobId) {
      try {
        await ApiClient.deleteJob(deleteConfirmation.jobId);
        // Invalidate and refetch the job history
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        setDeleteConfirmation(null);
      } catch (error) {
        console.error('Failed to delete job:', error);
        // You might want to show an error toast here
      }
    }
  }, [deleteConfirmation, queryClient]);

  // Handle keyboard navigation for job list
  useEffect(() => {
    if (isCollapsed || activeTab !== 'history') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!jobListRef.current) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedJobIndex((prev) => {
            const next = prev + 1;
            return next >= history.length ? 0 : next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedJobIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? history.length - 1 : next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < history.length) {
            handleSelect(history[focusedJobIndex].id);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < history.length) {
            const job = history[focusedJobIndex];
            setDeleteConfirmation({
              jobId: job.id,
              shortId: job.id.slice(0, 8),
            });
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusedJobIndex(-1);
          break;
      }
    };

    // Only add event listener if the sidebar is focused
    if (document.activeElement === jobListRef.current) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCollapsed, activeTab, focusedJobIndex, history, handleSelect]);

  // Auto-focus the job list when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && !isCollapsed && jobListRef.current) {
      jobListRef.current.focus();
    }
  }, [activeTab, isCollapsed]);

  return {
    // State
    compareMode,
    focusedJobIndex,
    activeTab,
    deleteConfirmation,
    history,
    isLoading,
    error,

    // Store values
    comparison,
    temperature,
    topP,
    maxTokens,
    selectedMetrics,

    // Setters
    setFocusedJobIndex,
    setActiveTab,
    setDeleteConfirmation,
    setTemperature,
    setTopP,
    setMaxTokens,
    setSelectedMetrics,

    // Handlers
    handleDelete,
    confirmDelete,
    handleSelect,
    toggleCompareMode,

    // Refs
    jobListRef,
    sidebarRef,
  };
};
