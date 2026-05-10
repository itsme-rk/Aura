// ─── Streak Store ─────────────────────────────────────────
//
// Behavioral streak state management.
// Integrates with event system for automatic updates.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StreakData,
  fetchStreakData,
  onWorkoutLogged,
  onProteinGoalReached,
  validateStreaks,
  isStreakAlive,
} from '../features/streaks/services/streak.service';

// ─── State Interface ──────────────────────────────────────

interface StreakState {
  // State
  workoutStreak: number;
  proteinStreak: number;
  activityStreak: number;
  lastWorkoutDate?: string;
  lastProteinDate?: string;
  lastActiveDate?: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStreaks: (userId: string) => Promise<void>;
  handleWorkoutLogged: (userId: string) => Promise<void>;
  handleProteinGoalReached: (userId: string) => Promise<void>;
  validateAndRefresh: () => void;
  clearError: () => void;
}

// ─── Selectors ────────────────────────────────────────────

export const selectWorkoutStreak = (s: StreakState) => s.workoutStreak;
export const selectProteinStreak = (s: StreakState) => s.proteinStreak;
export const selectActivityStreak = (s: StreakState) => s.activityStreak;
export const selectStreakLoading = (s: StreakState) => s.isLoading;

// ─── Store ────────────────────────────────────────────────

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════
      // STATE
      // ═══════════════════════════════════════════════════════
      workoutStreak: 0,
      proteinStreak: 0,
      activityStreak: 0,
      lastWorkoutDate: undefined,
      lastProteinDate: undefined,
      lastActiveDate: undefined,
      isLoading: false,
      error: null,

      // ═══════════════════════════════════════════════════════
      // FETCH STREAKS FROM FIRESTORE
      // ═══════════════════════════════════════════════════════
      fetchStreaks: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fetchStreakData(userId);
          set({
            workoutStreak: data.workoutStreak,
            proteinStreak: data.proteinStreak,
            activityStreak: data.activityStreak,
            lastWorkoutDate: data.lastWorkoutDate,
            lastProteinDate: data.lastProteinDate,
            lastActiveDate: data.lastActiveDate,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      // ═══════════════════════════════════════════════════════
      // HANDLE WORKOUT LOGGED
      // ═══════════════════════════════════════════════════════
      handleWorkoutLogged: async (userId) => {
        try {
          const currentData: StreakData = {
            workoutStreak: get().workoutStreak,
            proteinStreak: get().proteinStreak,
            activityStreak: get().activityStreak,
            lastWorkoutDate: get().lastWorkoutDate,
            lastProteinDate: get().lastProteinDate,
            lastActiveDate: get().lastActiveDate,
          };

          const updated = await onWorkoutLogged(userId, currentData);

          set({
            workoutStreak: updated.workoutStreak,
            activityStreak: updated.activityStreak,
            lastWorkoutDate: updated.lastWorkoutDate,
            lastActiveDate: updated.lastActiveDate,
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ═══════════════════════════════════════════════════════
      // HANDLE PROTEIN GOAL REACHED
      // ═══════════════════════════════════════════════════════
      handleProteinGoalReached: async (userId) => {
        try {
          const currentData: StreakData = {
            workoutStreak: get().workoutStreak,
            proteinStreak: get().proteinStreak,
            activityStreak: get().activityStreak,
            lastWorkoutDate: get().lastWorkoutDate,
            lastProteinDate: get().lastProteinDate,
            lastActiveDate: get().lastActiveDate,
          };

          const updated = await onProteinGoalReached(userId, currentData);

          set({
            proteinStreak: updated.proteinStreak,
            activityStreak: updated.activityStreak,
            lastProteinDate: updated.lastProteinDate,
            lastActiveDate: updated.lastActiveDate,
          });
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ═══════════════════════════════════════════════════════
      // VALIDATE (offline recovery / app resume)
      // ═══════════════════════════════════════════════════════
      validateAndRefresh: () => {
        const validated = validateStreaks({
          workoutStreak: get().workoutStreak,
          proteinStreak: get().proteinStreak,
          activityStreak: get().activityStreak,
          lastWorkoutDate: get().lastWorkoutDate,
          lastProteinDate: get().lastProteinDate,
          lastActiveDate: get().lastActiveDate,
        });

        set({
          workoutStreak: validated.workoutStreak,
          proteinStreak: validated.proteinStreak,
          activityStreak: validated.activityStreak,
        });
      },

      // ═══════════════════════════════════════════════════════
      // SHARED
      // ═══════════════════════════════════════════════════════
      clearError: () => set({ error: null }),
    }),
    {
      name: '@aura/streaks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        workoutStreak: state.workoutStreak,
        proteinStreak: state.proteinStreak,
        activityStreak: state.activityStreak,
        lastWorkoutDate: state.lastWorkoutDate,
        lastProteinDate: state.lastProteinDate,
        lastActiveDate: state.lastActiveDate,
      }),
    },
  ),
);
