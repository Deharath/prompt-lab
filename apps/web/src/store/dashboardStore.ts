import { create } from 'zustand';
import { fetchDashboardStats } from '../api.js';
import type { DashboardStats } from '../types/dashboard.js';

interface DashboardState {
  isLoading: boolean;
  error: string | null;
  data: DashboardStats | null;
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
      const data = await fetchDashboardStats(days);
      set({ data, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard stats';
      set({ error: errorMessage, isLoading: false, data: null });
    }
  },
}));
