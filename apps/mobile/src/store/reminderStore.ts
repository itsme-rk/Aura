// ─── Reminder Store ───────────────────────────────────────
//
// Smart reminder state management.
// Integrates with streak, workout, and nutrition stores
// to evaluate contextual reminders.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Reminder,
  ReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  getActiveReminders,
  dismissReminder as dismissReminderSvc,
  clearAllReminders,
  evaluateAllReminders,
} from '../features/reminders/services/reminder.service';
import { reminderLogger as log } from '../services/logger/logger';

// ─── State Interface ──────────────────────────────────────

interface ReminderState {
  // State
  activeReminders: Reminder[];
  settings: ReminderSettings;
  isLoading: boolean;
  lastEvaluatedAt: number | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<ReminderSettings>) => Promise<void>;
  loadActiveReminders: () => Promise<void>;
  dismissReminder: (reminderId: string) => Promise<void>;
  clearAll: () => Promise<void>;

  /**
   * Evaluate all reminder triggers based on current app state.
   * Should be called on app foreground and periodically.
   */
  evaluate: (context: {
    hasWorkoutToday: boolean;
    workoutStreak: number;
    todayProtein: number;
    proteinTarget: number;
    proteinStreak: number;
  }) => Promise<void>;
}

// ─── Selectors ────────────────────────────────────────────

export const selectActiveReminders = (s: ReminderState) => s.activeReminders;
export const selectReminderSettings = (s: ReminderState) => s.settings;
export const selectHasReminders = (s: ReminderState) => s.activeReminders.length > 0;
export const selectReminderCount = (s: ReminderState) => s.activeReminders.length;

// ─── Evaluation Throttle ──────────────────────────────────

const EVAL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between evaluations

// ─── Store ────────────────────────────────────────────────

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      activeReminders: [],
      settings: DEFAULT_REMINDER_SETTINGS,
      isLoading: false,
      lastEvaluatedAt: null,

      loadSettings: async () => {
        const settings = await loadReminderSettings();
        set({ settings });
      },

      updateSettings: async (partial) => {
        const current = get().settings;
        const updated = { ...current, ...partial };
        await saveReminderSettings(updated);
        set({ settings: updated });
        log.info('Reminder settings updated');
      },

      loadActiveReminders: async () => {
        const reminders = await getActiveReminders();
        set({ activeReminders: reminders });
      },

      dismissReminder: async (reminderId) => {
        await dismissReminderSvc(reminderId);
        set((s) => ({
          activeReminders: s.activeReminders.filter((r) => r.id !== reminderId),
        }));
      },

      clearAll: async () => {
        await clearAllReminders();
        set({ activeReminders: [] });
      },

      evaluate: async (context) => {
        const { lastEvaluatedAt, settings } = get();

        // Don't evaluate if disabled
        if (!settings.enabled) return;

        // Throttle evaluations
        if (lastEvaluatedAt && Date.now() - lastEvaluatedAt < EVAL_COOLDOWN_MS) {
          return;
        }

        set({ isLoading: true, lastEvaluatedAt: Date.now() });

        try {
          const triggered = await evaluateAllReminders(context);

          if (triggered.length > 0) {
            log.info(`${triggered.length} reminder(s) triggered`);
          }

          // Reload active reminders
          const active = await getActiveReminders();
          set({ activeReminders: active, isLoading: false });
        } catch (err: any) {
          log.error('Reminder evaluation failed', err);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: '@aura/reminders',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastEvaluatedAt: state.lastEvaluatedAt,
      }),
    },
  ),
);
