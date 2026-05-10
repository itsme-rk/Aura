// ─── Reminder Service ─────────────────────────────────────
//
// Smart local notification scheduling with:
//   - Context-aware triggers (workout, protein, streaks)
//   - Cooldown logic (max 2/day, min 4h between)
//   - Quiet hours respect
//   - AsyncStorage-based notification history
//
// Uses NO backend notification system — local only.
//

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitEvent } from '../../../services/events/emitEvent';
import { reminderLogger as log } from '../../../services/logger/logger';

// ─── Types ────────────────────────────────────────────────

export type ReminderType =
  | 'missed_workout'
  | 'low_protein'
  | 'streak_at_risk'
  | 'supplement_repurchase';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  dismissed: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  workoutReminderTime: string;    // HH:mm format, e.g. "19:00"
  proteinReminderTime: string;    // HH:mm format, e.g. "20:00"
  quietHoursStart: string;        // HH:mm, e.g. "22:00"
  quietHoursEnd: string;          // HH:mm, e.g. "07:00"
  maxRemindersPerDay: number;
}

export interface ReminderHistory {
  date: string;          // YYYY-MM-DD
  remindersShown: number;
  lastReminderAt: number;
  types: ReminderType[];
}

// ─── Defaults ─────────────────────────────────────────────

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  workoutReminderTime: '19:00',
  proteinReminderTime: '20:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxRemindersPerDay: 2,
};

// ─── Storage Keys ─────────────────────────────────────────

const KEYS = {
  SETTINGS: '@aura/reminder_settings',
  HISTORY: '@aura/reminder_history',
  ACTIVE: '@aura/active_reminders',
} as const;

// ─── Settings ─────────────────────────────────────────────

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── History (Cooldown Tracking) ──────────────────────────

async function loadTodayHistory(): Promise<ReminderHistory> {
  try {
    const today = getDateString();
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!raw) return createEmptyHistory(today);

    const history: ReminderHistory = JSON.parse(raw);
    if (history.date !== today) {
      // New day — reset
      return createEmptyHistory(today);
    }
    return history;
  } catch {
    return createEmptyHistory(getDateString());
  }
}

async function saveTodayHistory(history: ReminderHistory): Promise<void> {
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

function createEmptyHistory(date: string): ReminderHistory {
  return {
    date,
    remindersShown: 0,
    lastReminderAt: 0,
    types: [],
  };
}

// ─── Active Reminders ─────────────────────────────────────

export async function getActiveReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE);
    if (!raw) return [];
    const reminders: Reminder[] = JSON.parse(raw);
    // Only return non-dismissed, from today
    const today = getDateString();
    return reminders.filter(
      (r) => !r.dismissed && getDateFromTimestamp(r.createdAt) === today,
    );
  } catch {
    return [];
  }
}

async function saveActiveReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE, JSON.stringify(reminders));
}

export async function dismissReminder(reminderId: string): Promise<void> {
  const reminders = await getActiveReminders();
  const updated = reminders.map((r) =>
    r.id === reminderId ? { ...r, dismissed: true } : r,
  );
  await saveActiveReminders(updated);
}

export async function clearAllReminders(): Promise<void> {
  await saveActiveReminders([]);
}

// ─── Time Helpers ─────────────────────────────────────────

function getDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateFromTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function parseHHMM(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

function timeToMinutes(time: string): number {
  const { hours, minutes } = parseHHMM(time);
  return hours * 60 + minutes;
}

// ─── Quiet Hours Check ────────────────────────────────────

export function isInQuietHours(settings: ReminderSettings): boolean {
  const now = timeToMinutes(getCurrentHHMM());
  const start = timeToMinutes(settings.quietHoursStart);
  const end = timeToMinutes(settings.quietHoursEnd);

  // Handle overnight quiet hours (e.g., 22:00 → 07:00)
  if (start > end) {
    return now >= start || now < end;
  }
  return now >= start && now < end;
}

// ─── Cooldown Check ───────────────────────────────────────

const MIN_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between reminders

export async function canShowReminder(
  type: ReminderType,
  settings: ReminderSettings,
): Promise<boolean> {
  if (!settings.enabled) return false;

  // Quiet hours
  if (isInQuietHours(settings)) {
    log.info('Reminder blocked: quiet hours');
    return false;
  }

  const history = await loadTodayHistory();

  // Max per day
  if (history.remindersShown >= settings.maxRemindersPerDay) {
    log.info('Reminder blocked: daily limit reached');
    return false;
  }

  // Cooldown between reminders
  if (history.lastReminderAt > 0) {
    const elapsed = Date.now() - history.lastReminderAt;
    if (elapsed < MIN_COOLDOWN_MS) {
      log.info(`Reminder blocked: cooldown (${Math.round(elapsed / 60000)}min elapsed, need ${MIN_COOLDOWN_MS / 60000}min)`);
      return false;
    }
  }

  // Don't repeat same type today
  if (history.types.includes(type)) {
    log.info(`Reminder blocked: type '${type}' already shown today`);
    return false;
  }

  return true;
}

// ─── Reminder Creation ────────────────────────────────────

export async function createReminder(
  type: ReminderType,
  title: string,
  body: string,
  priority: Reminder['priority'] = 'medium',
): Promise<Reminder | null> {
  const settings = await loadReminderSettings();
  const allowed = await canShowReminder(type, settings);

  if (!allowed) return null;

  const reminder: Reminder = {
    id: `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    body,
    priority,
    createdAt: Date.now(),
    dismissed: false,
  };

  // Save reminder
  const active = await getActiveReminders();
  active.push(reminder);
  await saveActiveReminders(active);

  // Update history
  const history = await loadTodayHistory();
  history.remindersShown += 1;
  history.lastReminderAt = Date.now();
  history.types.push(type);
  await saveTodayHistory(history);

  // Emit event
  emitEvent('REMINDER_TRIGGERED', { reminder });
  log.info(`Reminder created: ${type} — "${title}"`);

  return reminder;
}

// ─── Contextual Trigger Functions ─────────────────────────

/**
 * Check if a workout reminder should fire.
 * Call in the evening if no workout logged today.
 */
export async function checkWorkoutReminder(
  hasWorkoutToday: boolean,
  workoutStreak: number,
): Promise<Reminder | null> {
  if (hasWorkoutToday) return null;

  const settings = await loadReminderSettings();
  const currentTime = getCurrentHHMM();
  const reminderTime = settings.workoutReminderTime;

  // Only trigger at or after scheduled time
  if (timeToMinutes(currentTime) < timeToMinutes(reminderTime)) return null;

  const isStreakAtRisk = workoutStreak > 0;

  if (isStreakAtRisk) {
    return createReminder(
      'streak_at_risk',
      '🔥 Streak at risk!',
      `Your ${workoutStreak}-day workout streak will reset. Log a workout to keep it alive!`,
      'high',
    );
  }

  return createReminder(
    'missed_workout',
    '💪 Workout not logged today',
    'A quick session still counts. Stay consistent!',
    'medium',
  );
}

/**
 * Check if a protein reminder should fire.
 * Call in the evening if protein target not met.
 */
export async function checkProteinReminder(
  todayProtein: number,
  proteinTarget: number,
  proteinStreak: number,
): Promise<Reminder | null> {
  if (todayProtein >= proteinTarget) return null;

  const settings = await loadReminderSettings();
  const currentTime = getCurrentHHMM();
  const reminderTime = settings.proteinReminderTime;

  if (timeToMinutes(currentTime) < timeToMinutes(reminderTime)) return null;

  const remaining = Math.round(proteinTarget - todayProtein);
  const isStreakAtRisk = proteinStreak > 0;

  if (isStreakAtRisk) {
    return createReminder(
      'streak_at_risk',
      '🥩 Protein streak at risk!',
      `You need ${remaining}g more protein to keep your ${proteinStreak}-day streak.`,
      'high',
    );
  }

  return createReminder(
    'low_protein',
    '🥩 Protein target not reached',
    `You're ${remaining}g short of your ${proteinTarget}g target.`,
    'medium',
  );
}

/**
 * Run all reminder checks.
 * Call this periodically (e.g., on app foreground or every hour).
 */
export async function evaluateAllReminders(context: {
  hasWorkoutToday: boolean;
  workoutStreak: number;
  todayProtein: number;
  proteinTarget: number;
  proteinStreak: number;
}): Promise<Reminder[]> {
  const triggered: Reminder[] = [];

  const workoutReminder = await checkWorkoutReminder(
    context.hasWorkoutToday,
    context.workoutStreak,
  );
  if (workoutReminder) triggered.push(workoutReminder);

  const proteinReminder = await checkProteinReminder(
    context.todayProtein,
    context.proteinTarget,
    context.proteinStreak,
  );
  if (proteinReminder) triggered.push(proteinReminder);

  return triggered;
}
