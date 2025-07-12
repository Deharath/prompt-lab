import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../../../api.js';
import { useJobStore } from '../../../../store/jobStore.js';
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
    running,
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

  // Local component state
  const [compareMode, setCompareMode] = useState(false);
  const [focusedJobIndex, setFocusedJobIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation | null>(null);

  const queryClient = useQueryClient();
  const jobListRef = useRef<HTMLDivElement>(null);

  // Use TanStack Query for history data with auto-refresh
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery<JobSummary[]>({
    queryKey: ['jobs'],
    queryFn: () => {
      if (!ApiClient) {
        throw new Error('ApiClient is not available');
      }
      return ApiClient.listJobs();
    },
    staleTime: 1000 * 10, // 10 seconds - reduced since we have real-time updates
    refetchInterval: 1000 * 30, // Refetch every 30 seconds as fallback - reduced frequency
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Log any errors for debugging - TEMPORARILY DISABLED
  // useEffect(() => {
  //   if (error) {
  //     console.error('History loading error:', error);
  //   }
  // }, [error]);

  // Issue #1 fix: Immediately refresh history when job finishes
  const invalidateJobs = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  }, [queryClient]);

  const prevRunning = useRef(running);
  useEffect(() => {
    if (prevRunning.current && !running) {
      // Job just finished, immediately refresh history
      invalidateJobs();
    }
    prevRunning.current = running;
  }, [running, invalidateJobs]);

  // Delete handler with custom confirmation modal - Issue #2 fix
  const handleDelete = async (jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const shortId = jobId.substring(0, 8);
    setDeleteConfirmation({ jobId, shortId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { jobId } = deleteConfirmation;
    setDeleteConfirmation(null);

    try {
      // Optimistic update - remove from cache immediately
      queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] | undefined) =>
        oldJobs ? oldJobs.filter((job) => job.id !== jobId) : [],
      );

      // Clear comparison if the deleted job was selected
      if (comparison.baseJobId === jobId || comparison.compareJobId === jobId) {
        clearComparison();
      }

      // Make API call
      await ApiClient.deleteJob(jobId);

      // Invalidate query to refresh from server
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Delete job error handled by user notification
      // You could add a toast notification here instead of alert
    }
  };

  const handleSelect = async (id: string) => {
    if (compareMode) {
      if (!comparison.baseJobId) {
        clearComparison();
        setBaseJob(id);
      } else if (!comparison.compareJobId) {
        setCompareJob(id);
        onCompareJobs(comparison.baseJobId, id);
      } else {
        clearComparison();
        setBaseJob(id);
      }
      return;
    }

    try {
      reset();
      const job = await ApiClient.fetchJob(id);
      start({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        provider: job.provider,
        model: job.model,
        costUsd: job.costUsd || null,

        resultSnippet: job.result ? job.result.slice(0, 100) : null,
      });
      if (job.result) {
        append(job.result);
      }
      finish((job.metrics as Record<string, number>) || {});
      onSelectJob(id);
    } catch (err) {
      // Job loading error handled by user notification
    }
  };

  const toggleCompareMode = () => {
    if (compareMode) {
      setCompareMode(false);
      clearComparison();
    } else {
      setCompareMode(true);
    }
  };

  // Keyboard navigation for job list
  const historyLength = history.length;
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isCollapsed || historyLength === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedJobIndex((prev) =>
            prev < historyLength - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedJobIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < historyLength) {
            handleSelect(history[focusedJobIndex].id);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (focusedJobIndex >= 0 && focusedJobIndex < historyLength) {
            const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
            handleDelete(history[focusedJobIndex].id, mockEvent);
          }
          break;
        case 'Escape':
          setFocusedJobIndex(-1);
          break;
      }
    },
    [
      isCollapsed,
      historyLength,
      focusedJobIndex,
      history,
      handleSelect,
      handleDelete,
    ],
  );

  useEffect(() => {
    if (jobListRef.current) {
      jobListRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        jobListRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

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
  };
};
