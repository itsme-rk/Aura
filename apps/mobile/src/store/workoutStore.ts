// ─── Workout Store ────────────────────────────────────────
//
// State management for the workout module.
// Plans and Logs are separate concerns.
//
// Plans  = scheduled / template workouts
// Logs   = actual completed workout sessions
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Exercise,
  WorkoutPlan,
  WorkoutLog,
  WorkoutSummary,
  RecentExercise,
  ExerciseLog,
  SetLog,
} from '../types';
import * as svc from '../features/workout/services/workout.service';
import {
  DEFAULT_EXERCISES,
} from '../features/workout/data/exerciseLibrary';

// ─── State Interface ──────────────────────────────────────

interface WorkoutState {
  // ─── Exercise Library ───────────────────────────────────
  exercises: Exercise[];
  customExercises: Exercise[];
  loadExercises: (userId: string) => Promise<void>;
  addCustomExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;

  // ─── Plans ──────────────────────────────────────────────
  plans: WorkoutPlan[];
  activePlan: WorkoutPlan | null;
  fetchPlans: (userId: string) => Promise<void>;
  createPlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePlan: (planId: string, data: Partial<WorkoutPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  setActivePlan: (plan: WorkoutPlan | null) => void;

  // ─── Logs ───────────────────────────────────────────────
  logs: WorkoutLog[];
  fetchLogs: (userId: string) => Promise<void>;
  saveLog: (log: Omit<WorkoutLog, 'id' | 'createdAt'>) => Promise<string>;
  getLastWorkout: (userId: string) => Promise<WorkoutLog | null>;

  // ─── Active Session ─────────────────────────────────────
  activeSession: ActiveSession | null;
  startSession: (name: string, planId?: string, dayLabel?: string) => void;
  addExerciseToSession: (exerciseId: string, name: string, muscleGroup: string) => void;
  updateSetInSession: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  addSetToSession: (exerciseIndex: number) => void;
  removeSetFromSession: (exerciseIndex: number, setIndex: number) => void;
  removeExerciseFromSession: (exerciseIndex: number) => void;
  completeSession: (userId: string, mood?: 1 | 2 | 3 | 4 | 5, notes?: string) => Promise<string>;
  discardSession: () => void;

  // ─── Derived / Analytics ────────────────────────────────
  recentExercises: RecentExercise[];
  streak: number;
  weeklyCount: number;
  refreshAnalytics: () => void;

  // ─── Shared ─────────────────────────────────────────────
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// ─── Active Session Type ──────────────────────────────────

interface ActiveSession {
  name: string;
  planId?: string;
  dayLabel?: string;
  startedAt: number;
  exercises: ExerciseLog[];
}

// ─── Selectors ────────────────────────────────────────────

export const selectExercises = (s: WorkoutState) => s.exercises;
export const selectPlans = (s: WorkoutState) => s.plans;
export const selectActivePlan = (s: WorkoutState) => s.activePlan;
export const selectLogs = (s: WorkoutState) => s.logs;
export const selectRecentLogs = (n: number) => (s: WorkoutState) => s.logs.slice(0, n);
export const selectActiveSession = (s: WorkoutState) => s.activeSession;
export const selectRecentExercises = (s: WorkoutState) => s.recentExercises;
export const selectStreak = (s: WorkoutState) => s.streak;
export const selectWeeklyCount = (s: WorkoutState) => s.weeklyCount;
export const selectWorkoutLoading = (s: WorkoutState) => s.isLoading;
export const selectWorkoutError = (s: WorkoutState) => s.error;

// ─── Store ────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════
      // EXERCISE LIBRARY
      // ═══════════════════════════════════════════════════════
      exercises: DEFAULT_EXERCISES,
      customExercises: [],

      loadExercises: async (userId) => {
        try {
          const custom = await svc.fetchCustomExercises(userId);
          set({
            customExercises: custom,
            exercises: [...DEFAULT_EXERCISES, ...custom],
          });
        } catch {
          // Fallback to defaults only — non-critical
        }
      },

      addCustomExercise: async (exercise) => {
        const id = await svc.saveCustomExercise(exercise);
        const full: Exercise = { ...exercise, id };
        set((s) => ({
          customExercises: [...s.customExercises, full],
          exercises: [...s.exercises, full],
        }));
      },

      // ═══════════════════════════════════════════════════════
      // PLANS
      // ═══════════════════════════════════════════════════════
      plans: [],
      activePlan: null,

      fetchPlans: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const plans = await svc.fetchPlans(userId);
          const active = plans.find((p) => p.isActive) ?? null;
          set({ plans, activePlan: active, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      createPlan: async (plan) => {
        set({ isLoading: true, error: null });
        try {
          const id = await svc.createPlan(plan);
          const newPlan: WorkoutPlan = { ...plan, id, createdAt: Date.now(), updatedAt: Date.now() };
          set((s) => ({
            plans: [newPlan, ...s.plans],
            activePlan: plan.isActive ? newPlan : s.activePlan,
            isLoading: false,
          }));
          return id;
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      updatePlan: async (planId, data) => {
        try {
          await svc.updatePlan(planId, data);
          set((s) => ({
            plans: s.plans.map((p) => (p.id === planId ? { ...p, ...data, updatedAt: Date.now() } : p)),
            activePlan: s.activePlan?.id === planId ? { ...s.activePlan, ...data, updatedAt: Date.now() } : s.activePlan,
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      deletePlan: async (planId) => {
        try {
          await svc.deletePlan(planId);
          set((s) => ({
            plans: s.plans.filter((p) => p.id !== planId),
            activePlan: s.activePlan?.id === planId ? null : s.activePlan,
          }));
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      setActivePlan: (plan) => set({ activePlan: plan }),

      // ═══════════════════════════════════════════════════════
      // LOGS
      // ═══════════════════════════════════════════════════════
      logs: [],

      fetchLogs: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const logs = await svc.fetchWorkoutLogs(userId, 50);
          set({ logs, isLoading: false });
          get().refreshAnalytics();
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      saveLog: async (log) => {
        set({ isLoading: true, error: null });
        try {
          const id = await svc.saveWorkoutLog(log);
          const newLog: WorkoutLog = { ...log, id, createdAt: Date.now() };
          set((s) => ({ logs: [newLog, ...s.logs], isLoading: false }));
          get().refreshAnalytics();
          return id;
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      getLastWorkout: async (userId) => {
        return svc.getLastWorkout(userId);
      },

      // ═══════════════════════════════════════════════════════
      // ACTIVE SESSION (in-progress workout)
      // ═══════════════════════════════════════════════════════
      activeSession: null,

      startSession: (name, planId, dayLabel) => {
        set({
          activeSession: {
            name,
            planId,
            dayLabel,
            startedAt: Date.now(),
            exercises: [],
          },
        });
      },

      addExerciseToSession: (exerciseId, name, muscleGroup) => {
        const session = get().activeSession;
        if (!session) return;

        const newExercise: ExerciseLog = {
          exerciseId,
          name,
          muscleGroup: muscleGroup as any,
          order: session.exercises.length,
          sets: [
            { setNumber: 1, reps: 0, weightKg: 0, isWarmup: false, isCompleted: false },
          ],
        };

        set({
          activeSession: {
            ...session,
            exercises: [...session.exercises, newExercise],
          },
        });
      },

      updateSetInSession: (exerciseIndex, setIndex, data) => {
        const session = get().activeSession;
        if (!session) return;

        const exercises = [...session.exercises];
        const sets = [...exercises[exerciseIndex].sets];
        sets[setIndex] = { ...sets[setIndex], ...data };
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };

        set({ activeSession: { ...session, exercises } });
      },

      addSetToSession: (exerciseIndex) => {
        const session = get().activeSession;
        if (!session) return;

        const exercises = [...session.exercises];
        const currentSets = exercises[exerciseIndex].sets;
        const lastSet = currentSets[currentSets.length - 1];

        const newSet: SetLog = {
          setNumber: currentSets.length + 1,
          reps: lastSet?.reps ?? 0,
          weightKg: lastSet?.weightKg ?? 0,
          isWarmup: false,
          isCompleted: false,
        };

        exercises[exerciseIndex] = {
          ...exercises[exerciseIndex],
          sets: [...currentSets, newSet],
        };

        set({ activeSession: { ...session, exercises } });
      },

      removeSetFromSession: (exerciseIndex, setIndex) => {
        const session = get().activeSession;
        if (!session) return;

        const exercises = [...session.exercises];
        const sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
        // Re-number
        sets.forEach((s, i) => { s.setNumber = i + 1; });
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };

        set({ activeSession: { ...session, exercises } });
      },

      removeExerciseFromSession: (exerciseIndex) => {
        const session = get().activeSession;
        if (!session) return;

        const exercises = session.exercises.filter((_, i) => i !== exerciseIndex);
        exercises.forEach((ex, i) => { ex.order = i; });

        set({ activeSession: { ...session, exercises } });
      },

      completeSession: async (userId, mood, notes) => {
        const session = get().activeSession;
        if (!session) throw new Error('No active session');

        const now = Date.now();
        const durationMinutes = Math.round((now - session.startedAt) / 60000);

        const log: Omit<WorkoutLog, 'id' | 'createdAt'> = {
          userId,
          planId: session.planId,
          dayLabel: session.dayLabel,
          name: session.name,
          startedAt: session.startedAt,
          completedAt: now,
          durationMinutes,
          exercises: session.exercises,
          mood,
          notes,
        };

        const id = await get().saveLog(log);
        set({ activeSession: null });
        return id;
      },

      discardSession: () => set({ activeSession: null }),

      // ═══════════════════════════════════════════════════════
      // ANALYTICS
      // ═══════════════════════════════════════════════════════
      recentExercises: [],
      streak: 0,
      weeklyCount: 0,

      refreshAnalytics: () => {
        const { logs } = get();
        set({
          recentExercises: svc.extractRecentExercises(logs, 15),
          streak: svc.calculateStreak(logs),
          weeklyCount: svc.workoutsThisWeek(logs),
        });
      },

      // ═══════════════════════════════════════════════════════
      // SHARED
      // ═══════════════════════════════════════════════════════
      isLoading: false,
      error: null,
      clearError: () => set({ error: null }),
    }),
    {
      name: '@aura/workout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plans: state.plans,
        logs: state.logs.slice(0, 20),
        activePlan: state.activePlan,
        activeSession: state.activeSession,
        recentExercises: state.recentExercises,
        streak: state.streak,
        weeklyCount: state.weeklyCount,
      }),
    },
  ),
);
