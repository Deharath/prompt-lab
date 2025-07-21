import { create } from 'zustand';
import { ApiClient } from '../api.js';
import type { SimpleDashboardStats } from '../types/dashboard.js';

interface DashboardState {
  isLoading: boolean;
  error: string | null;
  data: SimpleDashboardStats | null;
  days: number;
  fetchDashboardStats: (days: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, _get) => ({
  isLoading: false,
  error: null,
  data: null,
  days: 30,
  fetchDashboardStats: async (days: number) => {
    set({ isLoading: true, error: null, days });

    try {
      const data = await ApiClient.fetchDashboardStats(days);
      set({ data, isLoading: false });
    } catch (error) {
      // Dashboard fetch error handled by user notification
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard stats';
      set({ error: errorMessage, isLoading: false, data: null });
    }
  },
}));
