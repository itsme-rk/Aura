// ─── Analytics Store ──────────────────────────────────────
//
// Data aggregation state for dashboard and future AI.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyAggregation,
  WeeklyAggregation,
  AnalyticsSnapshot,
  buildDailyAggregation,
  buildWeeklyAggregation,
  saveSnapshot,
  loadSnapshot,
  loadDailyAggregation,
  loadWeeklyAggregation,
  incrementCounter,
} from '../features/analytics/services/analytics.service';

interface AnalyticsState {
  daily: DailyAggregation | null;
  weekly: WeeklyAggregation | null;
  lastSnapshotAt: number | null;
  isLoading: boolean;

  buildDaily: (context: {
    workoutsToday: number;
    totalProtein: number;
    proteinGoalMet: boolean;
    currentScore?: number;
  }) => Promise<void>;

  buildWeekly: (context: {
    weekWorkouts: number;
    weekProteinDays: number[];
    maxStreak: number;
    activeDays: number;
    weekSearches: number;
    weekArticles: number;
    weekProducts: number;
    weekScores: number[];
  }) => Promise<void>;

  loadCached: () => Promise<void>;
  trackEvent: (event: 'searches' | 'articlesRead' | 'remindersTriggered' | 'productsAdded') => Promise<void>;
}

export const selectDailyAnalytics = (s: AnalyticsState) => s.daily;
export const selectWeeklyAnalytics = (s: AnalyticsState) => s.weekly;
export const selectAnalyticsLoading = (s: AnalyticsState) => s.isLoading;

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      daily: null,
      weekly: null,
      lastSnapshotAt: null,
      isLoading: false,

      buildDaily: async (context) => {
        set({ isLoading: true });
        const daily = await buildDailyAggregation(context);
        const weekly = get().weekly;

        const snapshot: AnalyticsSnapshot = {
          daily,
          weekly: weekly ?? {} as WeeklyAggregation,
          generatedAt: Date.now(),
        };
        await saveSnapshot(snapshot);

        set({ daily, lastSnapshotAt: Date.now(), isLoading: false });
      },

      buildWeekly: async (context) => {
        set({ isLoading: true });
        const weekly = await buildWeeklyAggregation(context);
        set({ weekly, isLoading: false });
      },

      loadCached: async () => {
        const daily = await loadDailyAggregation();
        const weekly = await loadWeeklyAggregation();
        const snapshot = await loadSnapshot();
        set({
          daily,
          weekly,
          lastSnapshotAt: snapshot?.generatedAt ?? null,
        });
      },

      trackEvent: async (event) => {
        await incrementCounter(event);
      },
    }),
    {
      name: '@aura/analytics',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        daily: state.daily,
        weekly: state.weekly,
        lastSnapshotAt: state.lastSnapshotAt,
      }),
    },
  ),
);
