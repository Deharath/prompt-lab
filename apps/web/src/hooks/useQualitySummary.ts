/**
 * Task 8 - React Hook for Quality Summary
 * useQualitySummary hook built on current API client
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../api.js';

export interface QualitySummaryParams {
  model?: string;
  since?: string;
  until?: string;
  windowDays?: number;
}

export interface QualitySummaryData {
  model: string;
  period: {
    start: string;
    end: string;
    days: number;
  };
  metrics: {
    totalJobs: number;

    avgReadability: number;
    avgSentiment: number;
    successRate: number;
    p95_latency_ms?: number;
  };
  timestamp: string;
}

interface QualitySummaryState {
  data: QualitySummaryData | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
}

/**
 * React hook for fetching quality summary data
 */
export function useQualitySummary(params: QualitySummaryParams = {}) {
  const [state, setState] = useState<QualitySummaryState>({
    data: null,
    loading: false,
    error: null,
    cached: false,
  });

  const fetchQualitySummary = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await ApiClient.fetchQualitySummary({
        model: params.model,
        since: params.since,
        until: params.until,
        windowDays: params.windowDays,
      });

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          cached: response.cached || false,
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch quality summary',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [params.model, params.since, params.until, params.windowDays]);

  // Auto-fetch when params change
  useEffect(() => {
    fetchQualitySummary();
  }, [fetchQualitySummary]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchQualitySummary();
  }, [fetchQualitySummary]);

  return {
    ...state,
    refresh,
  };
}

/**
 * Hook for multiple model comparisons
 */
export function useMultiModelQualitySummary(
  models: string[],
  params: Omit<QualitySummaryParams, 'model'> = {},
) {
  const [summaries, setSummaries] = useState<
    Record<string, QualitySummaryData>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSummaries = useCallback(async () => {
    if (models.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const promises = models.map(async (model) => {
        const response = await ApiClient.fetchQualitySummary({
          model,
          since: params.since,
          until: params.until,
          windowDays: params.windowDays,
        });
        return { model, data: response.data };
      });

      const results = await Promise.all(promises);
      const summaryMap = results.reduce(
        (acc, { model, data }) => {
          acc[model] = data;
          return acc;
        },
        {} as Record<string, QualitySummaryData>,
      );

      setSummaries(summaryMap);
      setLoading(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch summaries',
      );
      setLoading(false);
    }
  }, [models, params.since, params.until, params.windowDays]);

  useEffect(() => {
    fetchAllSummaries();
  }, [fetchAllSummaries]);

  return {
    summaries,
    loading,
    error,
    refresh: fetchAllSummaries,
  };
}

/**
 * Hook for real-time quality monitoring with automatic refresh
 */
export function useQualityMonitor(
  params: QualitySummaryParams = {},
  refreshInterval = 30000,
) {
  const { data, loading, error, cached, refresh } = useQualitySummary(params);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Auto-refresh when monitoring is enabled
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      if (!loading) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, loading, refresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    cached,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refresh,
  };
}
