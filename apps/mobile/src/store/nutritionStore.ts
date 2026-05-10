// ─── Nutrition Store ──────────────────────────────────────
//
// Protein-focused nutrition tracking state management.
// Handles daily logging, food library, recent foods,
// and protein goal tracking.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NutritionLog,
  FoodLibraryItem,
  DailyNutritionSummary,
  NutritionGoal,
  RecentFood,
  MealType,
  DEFAULT_NUTRITION_GOAL,
} from '../types';
import * as svc from '../features/nutrition/services/nutrition.service';

// ─── State Interface ──────────────────────────────────────

interface NutritionState {
  // ─── Today's Data ───────────────────────────────────────
  todayLogs: NutritionLog[];
  todayProtein: number;
  todayCalories: number;
  todaySummary: DailyNutritionSummary | null;

  // ─── Food Library ───────────────────────────────────────
  foodLibrary: FoodLibraryItem[];
  recentFoods: RecentFood[];

  // ─── Goals ──────────────────────────────────────────────
  goals: NutritionGoal;
  proteinGoalMet: boolean;

  // ─── All Logs (recent) ─────────────────────────────────
  recentLogs: NutritionLog[];

  // ─── UI State ───────────────────────────────────────────
  isLoading: boolean;
  error: string | null;

  // ─── Actions ────────────────────────────────────────────
  fetchTodayLogs: (userId: string) => Promise<void>;
  logFood: (entry: Omit<NutritionLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteLog: (logId: string) => Promise<void>;
  repeatLastMeal: (userId: string) => Promise<string | null>;

  // Food Library
  fetchFoodLibrary: (userId: string) => Promise<void>;
  saveFoodToLibrary: (food: Omit<FoodLibraryItem, 'id' | 'createdAt'>) => Promise<string>;

  // Goals
  setGoals: (goals: NutritionGoal) => void;

  // Derived
  refreshAnalytics: () => void;

  // Shared
  clearError: () => void;
}

// ─── Selectors ────────────────────────────────────────────

export const selectTodayLogs = (s: NutritionState) => s.todayLogs;
export const selectTodayProtein = (s: NutritionState) => s.todayProtein;
export const selectTodayCalories = (s: NutritionState) => s.todayCalories;
export const selectTodaySummary = (s: NutritionState) => s.todaySummary;
export const selectFoodLibrary = (s: NutritionState) => s.foodLibrary;
export const selectRecentFoods = (s: NutritionState) => s.recentFoods;
export const selectNutritionGoals = (s: NutritionState) => s.goals;
export const selectProteinGoalMet = (s: NutritionState) => s.proteinGoalMet;
export const selectProteinRemaining = (s: NutritionState) =>
  Math.max(0, s.goals.dailyProteinTarget - s.todayProtein);
export const selectProteinProgress = (s: NutritionState) =>
  Math.min(1, s.todayProtein / s.goals.dailyProteinTarget);
export const selectNutritionLoading = (s: NutritionState) => s.isLoading;

// Kept for backward compatibility with store/index.ts
export const selectTodayLog = (s: NutritionState) => s.todaySummary;
export const selectCaloriesRemaining = (s: NutritionState) =>
  (s.goals.dailyCalorieTarget ?? 2000) - s.todayCalories;

// ─── Store ────────────────────────────────────────────────

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════
      todayLogs: [],
      todayProtein: 0,
      todayCalories: 0,
      todaySummary: null,
      foodLibrary: [],
      recentFoods: [],
      recentLogs: [],
      goals: DEFAULT_NUTRITION_GOAL,
      proteinGoalMet: false,
      isLoading: false,
      error: null,

      // ═══════════════════════════════════════════════════════
      // FETCH TODAY'S LOGS
      // ═══════════════════════════════════════════════════════
      fetchTodayLogs: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const today = svc.getTodayDateString();
          const [todayLogs, recentLogs] = await Promise.all([
            svc.fetchLogsByDate(userId, today),
            svc.fetchRecentLogs(userId, 50),
          ]);

          const todayProtein = svc.calculateDailyProtein(todayLogs);
          const todayCalories = svc.calculateDailyCalories(todayLogs);
          const { goals } = get();
          const proteinGoalMet = todayProtein >= goals.dailyProteinTarget;
          const recentFoods = svc.extractRecentFoods(recentLogs, 15);

          set({
            todayLogs,
            todayProtein: Math.round(todayProtein * 10) / 10,
            todayCalories: Math.round(todayCalories),
            proteinGoalMet,
            recentLogs,
            recentFoods,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      // ═══════════════════════════════════════════════════════
      // LOG FOOD
      // ═══════════════════════════════════════════════════════
      logFood: async (entry) => {
        set({ isLoading: true, error: null });
        try {
          const id = await svc.logFood(entry);
          const newLog: NutritionLog = {
            ...entry,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const proteinAdded = entry.protein * entry.quantity;
          const caloriesAdded = (entry.calories ?? 0) * entry.quantity;
          const newProtein = get().todayProtein + proteinAdded;
          const newCalories = get().todayCalories + caloriesAdded;
          const { goals } = get();
          const proteinGoalMet = newProtein >= goals.dailyProteinTarget;

          set((s) => ({
            todayLogs: [newLog, ...s.todayLogs],
            todayProtein: Math.round(newProtein * 10) / 10,
            todayCalories: Math.round(newCalories),
            proteinGoalMet,
            recentLogs: [newLog, ...s.recentLogs].slice(0, 50),
            isLoading: false,
          }));

          // Refresh recent foods
          get().refreshAnalytics();

          // If food came from library, increment usage
          if (entry.foodLibraryId) {
            svc.incrementFoodUsage(entry.foodLibraryId);
          }

          return id;
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      // ═══════════════════════════════════════════════════════
      // DELETE LOG
      // ═══════════════════════════════════════════════════════
      deleteLog: async (logId) => {
        try {
          await svc.deleteLog(logId);
          const deletedLog = get().todayLogs.find((l) => l.id === logId);

          set((s) => {
            const todayLogs = s.todayLogs.filter((l) => l.id !== logId);
            const proteinRemoved = deletedLog
              ? deletedLog.protein * deletedLog.quantity
              : 0;
            const caloriesRemoved = deletedLog
              ? (deletedLog.calories ?? 0) * deletedLog.quantity
              : 0;
            const newProtein = Math.max(0, s.todayProtein - proteinRemoved);
            const newCalories = Math.max(0, s.todayCalories - caloriesRemoved);

            return {
              todayLogs,
              todayProtein: Math.round(newProtein * 10) / 10,
              todayCalories: Math.round(newCalories),
              proteinGoalMet: newProtein >= s.goals.dailyProteinTarget,
              recentLogs: s.recentLogs.filter((l) => l.id !== logId),
            };
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ═══════════════════════════════════════════════════════
      // REPEAT LAST MEAL
      // ═══════════════════════════════════════════════════════
      repeatLastMeal: async (userId) => {
        const { recentLogs } = get();
        if (recentLogs.length === 0) return null;

        const lastLog = recentLogs[0];
        const today = svc.getTodayDateString();

        const newEntry: Omit<NutritionLog, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          foodName: lastLog.foodName,
          protein: lastLog.protein,
          calories: lastLog.calories,
          quantity: lastLog.quantity,
          unit: lastLog.unit,
          mealType: lastLog.mealType,
          date: today,
          timestamp: Date.now(),
          foodLibraryId: lastLog.foodLibraryId,
        };

        return get().logFood(newEntry);
      },

      // ═══════════════════════════════════════════════════════
      // FOOD LIBRARY
      // ═══════════════════════════════════════════════════════
      fetchFoodLibrary: async (userId) => {
        try {
          const library = await svc.fetchFoodLibrary(userId);
          set({ foodLibrary: library });
        } catch {
          // Non-critical — use cached data
        }
      },

      saveFoodToLibrary: async (food) => {
        try {
          const id = await svc.saveFoodToLibrary(food);
          const newFood: FoodLibraryItem = { ...food, id, createdAt: Date.now() };
          set((s) => ({
            foodLibrary: [newFood, ...s.foodLibrary],
          }));
          return id;
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      // ═══════════════════════════════════════════════════════
      // GOALS
      // ═══════════════════════════════════════════════════════
      setGoals: (goals) => {
        const proteinGoalMet = get().todayProtein >= goals.dailyProteinTarget;
        set({ goals, proteinGoalMet });
      },

      // ═══════════════════════════════════════════════════════
      // ANALYTICS
      // ═══════════════════════════════════════════════════════
      refreshAnalytics: () => {
        const { recentLogs } = get();
        set({
          recentFoods: svc.extractRecentFoods(recentLogs, 15),
        });
      },

      // ═══════════════════════════════════════════════════════
      // SHARED
      // ═══════════════════════════════════════════════════════
      clearError: () => set({ error: null }),
    }),
    {
      name: '@aura/nutrition',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todayLogs: state.todayLogs.slice(0, 20),
        todayProtein: state.todayProtein,
        todayCalories: state.todayCalories,
        goals: state.goals,
        recentFoods: state.recentFoods.slice(0, 10),
        proteinGoalMet: state.proteinGoalMet,
      }),
    },
  ),
);
