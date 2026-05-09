// ─── Nutrition Store ──────────────────────────────────────
//
// Nutrition logging and daily tracking state management.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionLog, NutritionGoal } from '../types';
import {
  createDocument,
  updateDocument,
  getUserDocuments,
  queryDocuments,
} from '../services/firestore.service';
import { emitEvent } from '../services/events/emitEvent';

// ─── State Interface ──────────────────────────────────────

interface NutritionState {
  // State
  todayLog: NutritionLog | null;
  recentLogs: NutritionLog[];
  goals: NutritionGoal;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayLog: (userId: string) => Promise<void>;
  fetchRecentLogs: (userId: string, days?: number) => Promise<void>;
  saveDailyLog: (log: Omit<NutritionLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDailyLog: (logId: string, data: Partial<NutritionLog>) => Promise<void>;
  setGoals: (goals: NutritionGoal) => void;
  clearError: () => void;
}

// ─── Selectors ────────────────────────────────────────────

export const selectTodayLog = (state: NutritionState) => state.todayLog;
export const selectNutritionGoals = (state: NutritionState) => state.goals;
export const selectNutritionLoading = (state: NutritionState) => state.isLoading;
export const selectCaloriesRemaining = (state: NutritionState) =>
  state.goals.calories - (state.todayLog?.totalCalories ?? 0);

// ─── Default Goals ────────────────────────────────────────

const DEFAULT_GOALS: NutritionGoal = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  waterMl: 3000,
};

// ─── Store ────────────────────────────────────────────────

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      todayLog: null,
      recentLogs: [],
      goals: DEFAULT_GOALS,
      isLoading: false,
      error: null,

      fetchTodayLog: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const logs = await queryDocuments<NutritionLog>('nutritionLogs', {
            filters: [
              { field: 'userId', op: '==', value: userId },
              { field: 'date', op: '==', value: today },
            ],
            limitTo: 1,
          });
          set({ todayLog: logs[0] ?? null, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      fetchRecentLogs: async (userId, days = 7) => {
        set({ isLoading: true, error: null });
        try {
          const logs = await getUserDocuments<NutritionLog>('nutritionLogs', userId, {
            sortBy: 'date',
            limitTo: days,
          });
          set({ recentLogs: logs, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      saveDailyLog: async (log) => {
        set({ isLoading: true, error: null });
        try {
          const id = await createDocument('nutritionLogs', log);
          const newLog: NutritionLog = {
            ...log,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          set({ todayLog: newLog, isLoading: false });
          emitEvent('NUTRITION_LOGGED', { log: newLog });
          return id;
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      updateDailyLog: async (logId, data) => {
        try {
          await updateDocument('nutritionLogs', logId, data);
          set((state) => ({
            todayLog: state.todayLog?.id === logId
              ? { ...state.todayLog, ...data, updatedAt: Date.now() }
              : state.todayLog,
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      setGoals: (goals) => set({ goals }),

      clearError: () => set({ error: null }),
    }),
    {
      name: '@aura/nutrition',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todayLog: state.todayLog,
        goals: state.goals,
      }),
    },
  ),
);
