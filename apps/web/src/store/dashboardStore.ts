import { create } from 'zustand';
import { ApiClient } from '../api.js';
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
    console.log('fetchDashboardStats called with days:', days);
    set({ isLoading: true, error: null, days });

    try {
      console.log('Calling ApiClient.fetchDashboardStats...');
      const data = await ApiClient.fetchDashboardStats(days);
      console.log('Dashboard data received:', data);
      set({ data, isLoading: false });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard stats';
      console.log('Setting error state:', errorMessage);
      set({ error: errorMessage, isLoading: false, data: null });
    }
  },
}));
