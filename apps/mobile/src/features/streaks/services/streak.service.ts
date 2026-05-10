// ─── Streak Service ───────────────────────────────────────
//
// Behavioral streak tracking engine.
// Calculates and persists streaks for:
//   - Workouts (consecutive days with workout logs)
//   - Protein (consecutive days meeting protein target)
//   - Activity (consecutive days with any meaningful action)
//
// All date comparisons use YYYY-MM-DD strings (no timestamps).
// Handles timezone edge cases, offline recovery, and duplicates.
//

import { updateDocument, getDocument } from '../../../services/firestore.service';
import { emitEvent } from '../../../services/events/emitEvent';
import { User } from '../../../types';

// ─── Date Helpers ─────────────────────────────────────────

/** Get today's date as YYYY-MM-DD in local timezone. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get yesterday's date as YYYY-MM-DD in local timezone. */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/** Check if two date strings are the same day. */
export function isSameDay(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}

/** Check if dateA is exactly one day before dateB. */
export function isConsecutiveDay(earlier: string, later: string): boolean {
  const a = new Date(earlier + 'T00:00:00');
  const b = new Date(later + 'T00:00:00');
  const diffMs = b.getTime() - a.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return diffDays === 1;
}

/** Check if a date is today or yesterday (streak still valid). */
export function isStreakAlive(lastDate: string | undefined): boolean {
  if (!lastDate) return false;
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();
  return lastDate === today || lastDate === yesterday;
}

// ─── Streak Calculation ───────────────────────────────────

export interface StreakData {
  workoutStreak: number;
  proteinStreak: number;
  activityStreak: number;
  lastWorkoutDate?: string;
  lastProteinDate?: string;
  lastActiveDate?: string;
}

/**
 * Calculate the updated workout streak.
 *
 * - If already logged today: no change (deduplicate)
 * - If last workout was yesterday: increment
 * - If last workout was before yesterday: reset to 1
 * - If no previous workout: start at 1
 */
export function calculateWorkoutStreak(
  currentStreak: number,
  lastWorkoutDate: string | undefined,
): { streak: number; date: string } {
  const today = getLocalDateString();

  // Already logged today — no change (prevents duplicate increment)
  if (lastWorkoutDate && isSameDay(lastWorkoutDate, today)) {
    return { streak: currentStreak, date: today };
  }

  // Consecutive day — increment
  if (lastWorkoutDate && isConsecutiveDay(lastWorkoutDate, today)) {
    return { streak: currentStreak + 1, date: today };
  }

  // Streak broken or first workout — start at 1
  return { streak: 1, date: today };
}

/**
 * Calculate the updated protein streak.
 *
 * - If already counted today: no change
 * - If last protein goal met was yesterday: increment
 * - Otherwise: reset to 1
 */
export function calculateProteinStreak(
  currentStreak: number,
  lastProteinDate: string | undefined,
): { streak: number; date: string } {
  const today = getLocalDateString();

  if (lastProteinDate && isSameDay(lastProteinDate, today)) {
    return { streak: currentStreak, date: today };
  }

  if (lastProteinDate && isConsecutiveDay(lastProteinDate, today)) {
    return { streak: currentStreak + 1, date: today };
  }

  return { streak: 1, date: today };
}

/**
 * Calculate the updated activity streak.
 * Any meaningful activity (workout or protein goal) counts.
 */
export function calculateActivityStreak(
  currentStreak: number,
  lastActiveDate: string | undefined,
): { streak: number; date: string } {
  const today = getLocalDateString();

  if (lastActiveDate && isSameDay(lastActiveDate, today)) {
    return { streak: currentStreak, date: today };
  }

  if (lastActiveDate && isConsecutiveDay(lastActiveDate, today)) {
    return { streak: currentStreak + 1, date: today };
  }

  return { streak: 1, date: today };
}

// ─── Streak Validation (offline recovery) ─────────────────

/**
 * Validate streaks after coming back online.
 * If the last recorded date is more than 1 day ago, reset.
 */
export function validateStreaks(streakData: StreakData): StreakData {
  const validated = { ...streakData };

  if (!isStreakAlive(validated.lastWorkoutDate)) {
    validated.workoutStreak = 0;
  }

  if (!isStreakAlive(validated.lastProteinDate)) {
    validated.proteinStreak = 0;
  }

  if (!isStreakAlive(validated.lastActiveDate)) {
    validated.activityStreak = 0;
  }

  return validated;
}

// ─── Firestore Persistence ────────────────────────────────

/**
 * Read current streak data from user document.
 */
export async function fetchStreakData(userId: string): Promise<StreakData> {
  const user = await getDocument<User>('users', userId);
  if (!user) {
    return {
      workoutStreak: 0,
      proteinStreak: 0,
      activityStreak: 0,
    };
  }

  return validateStreaks({
    workoutStreak: user.workoutStreak ?? 0,
    proteinStreak: user.proteinStreak ?? 0,
    activityStreak: user.activityStreak ?? 0,
    lastWorkoutDate: user.lastWorkoutDate,
    lastProteinDate: user.lastProteinDate,
    lastActiveDate: user.lastActiveDate,
  });
}

/**
 * Persist streak data to Firestore user document.
 */
export async function saveStreakData(
  userId: string,
  data: Partial<StreakData>,
): Promise<void> {
  try {
    await updateDocument('users', userId, {
      ...data,
      updatedAt: Date.now(),
    });
  } catch {
    // Non-critical — streaks are also cached locally
    console.warn('[Streak] Failed to persist streak data');
  }
}

// ─── Event-Driven Streak Updates ──────────────────────────

/**
 * Handle a workout being logged.
 * Updates workout streak + activity streak.
 */
export async function onWorkoutLogged(
  userId: string,
  currentData: StreakData,
): Promise<StreakData> {
  const workout = calculateWorkoutStreak(
    currentData.workoutStreak,
    currentData.lastWorkoutDate,
  );

  const activity = calculateActivityStreak(
    currentData.activityStreak,
    currentData.lastActiveDate,
  );

  const updated: StreakData = {
    ...currentData,
    workoutStreak: workout.streak,
    lastWorkoutDate: workout.date,
    activityStreak: activity.streak,
    lastActiveDate: activity.date,
  };

  await saveStreakData(userId, {
    workoutStreak: updated.workoutStreak,
    lastWorkoutDate: updated.lastWorkoutDate,
    activityStreak: updated.activityStreak,
    lastActiveDate: updated.lastActiveDate,
  });

  emitEvent('STREAK_UPDATED', updated);
  emitEvent('ACTIVITY_LOGGED', { type: 'workout', date: workout.date });

  return updated;
}

/**
 * Handle protein goal being reached.
 * Updates protein streak + activity streak.
 */
export async function onProteinGoalReached(
  userId: string,
  currentData: StreakData,
): Promise<StreakData> {
  const protein = calculateProteinStreak(
    currentData.proteinStreak,
    currentData.lastProteinDate,
  );

  const activity = calculateActivityStreak(
    currentData.activityStreak,
    currentData.lastActiveDate,
  );

  const updated: StreakData = {
    ...currentData,
    proteinStreak: protein.streak,
    lastProteinDate: protein.date,
    activityStreak: activity.streak,
    lastActiveDate: activity.date,
  };

  await saveStreakData(userId, {
    proteinStreak: updated.proteinStreak,
    lastProteinDate: updated.lastProteinDate,
    activityStreak: updated.activityStreak,
    lastActiveDate: updated.lastActiveDate,
  });

  emitEvent('STREAK_UPDATED', updated);
  emitEvent('ACTIVITY_LOGGED', { type: 'protein', date: protein.date });

  return updated;
}
