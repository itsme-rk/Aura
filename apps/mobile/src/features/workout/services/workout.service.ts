// ─── Workout Service ──────────────────────────────────────
//
// Firestore operations for exercises, plans, and logs.
// Offline-first: falls back to queue when network unavailable.
//

import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getUserDocuments,
  queryDocuments,
} from '../../../services/firestore.service';
import { enqueue } from '../../offline/queue';
import { emitEvent } from '../../../services/events/emitEvent';
import {
  Exercise,
  WorkoutPlan,
  WorkoutLog,
  WorkoutSummary,
  RecentExercise,
  MuscleGroup,
} from '../../../types';

// ─── Collections ──────────────────────────────────────────

const COLLECTIONS = {
  EXERCISES: 'exercises',
  PLANS: 'workoutPlans',
  LOGS: 'workoutLogs',
} as const;

// ═══════════════════════════════════════════════════════════
// EXERCISE LIBRARY
// ═══════════════════════════════════════════════════════════

/** Save a custom exercise to Firestore. */
export async function saveCustomExercise(exercise: Omit<Exercise, 'id'>): Promise<string> {
  try {
    return await createDocument(COLLECTIONS.EXERCISES, { ...exercise, isCustom: true });
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.EXERCISES,
      data: { ...exercise, isCustom: true } as unknown as Record<string, unknown>,
    });
    return `offline_${Date.now()}`;
  }
}

/** Fetch user's custom exercises. */
export async function fetchCustomExercises(userId: string): Promise<Exercise[]> {
  return getUserDocuments<Exercise>(COLLECTIONS.EXERCISES, userId, {
    sortBy: 'name',
    sortDirection: 'asc',
  });
}

// ═══════════════════════════════════════════════════════════
// WORKOUT PLANS
// ═══════════════════════════════════════════════════════════

/** Create a new workout plan. */
export async function createPlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const id = await createDocument(COLLECTIONS.PLANS, plan);
    emitEvent('WORKOUT_PLAN_UPDATED', { planId: id, action: 'created' });
    return id;
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.PLANS,
      data: plan as unknown as Record<string, unknown>,
    });
    return `offline_${Date.now()}`;
  }
}

/** Fetch all plans for a user. */
export async function fetchPlans(userId: string): Promise<WorkoutPlan[]> {
  return getUserDocuments<WorkoutPlan>(COLLECTIONS.PLANS, userId, {
    sortBy: 'updatedAt',
  });
}

/** Update a plan. */
export async function updatePlan(planId: string, data: Partial<WorkoutPlan>): Promise<void> {
  try {
    await updateDocument(COLLECTIONS.PLANS, planId, data);
    emitEvent('WORKOUT_PLAN_UPDATED', { planId, action: 'updated' });
  } catch {
    await enqueue({
      type: 'update',
      collection: COLLECTIONS.PLANS,
      docId: planId,
      data: data as unknown as Record<string, unknown>,
    });
  }
}

/** Delete a plan. */
export async function deletePlan(planId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTIONS.PLANS, planId);
  } catch {
    await enqueue({ type: 'delete', collection: COLLECTIONS.PLANS, docId: planId });
  }
}

/** Get today's planned workout from active plan. */
export function getTodaysWorkout(plan: WorkoutPlan): import('../../../types').WorkoutDay | null {
  const today = new Date().getDay(); // 0=Sunday
  return plan.days.find((d) => d.dayOfWeek === today) ?? null;
}

// ═══════════════════════════════════════════════════════════
// WORKOUT LOGS
// ═══════════════════════════════════════════════════════════

/** Save a completed workout log. */
export async function saveWorkoutLog(log: Omit<WorkoutLog, 'id' | 'createdAt'>): Promise<string> {
  try {
    const id = await createDocument(COLLECTIONS.LOGS, log);
    emitEvent('WORKOUT_LOGGED', { logId: id, log });
    emitEvent('WORKOUT_COMPLETED', {
      logId: id,
      durationMinutes: log.durationMinutes,
      exerciseCount: log.exercises.length,
      totalSets: log.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    });
    return id;
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.LOGS,
      data: log as unknown as Record<string, unknown>,
    });
    return `offline_${Date.now()}`;
  }
}

/** Fetch workout logs for a user. */
export async function fetchWorkoutLogs(
  userId: string,
  limitTo: number = 50,
): Promise<WorkoutLog[]> {
  return getUserDocuments<WorkoutLog>(COLLECTIONS.LOGS, userId, {
    sortBy: 'completedAt',
    limitTo,
  });
}

/** Get the most recent workout log. */
export async function getLastWorkout(userId: string): Promise<WorkoutLog | null> {
  const logs = await fetchWorkoutLogs(userId, 1);
  return logs[0] ?? null;
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS HELPERS (data prep — no charts)
// ═══════════════════════════════════════════════════════════

/** Build a summary from a workout log — for streaks/analytics/AI. */
export function buildWorkoutSummary(log: WorkoutLog): WorkoutSummary {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  const muscleGroups = new Set<MuscleGroup>();

  for (const ex of log.exercises) {
    muscleGroups.add(ex.muscleGroup);
    for (const set of ex.sets) {
      if (!set.isCompleted) continue;
      totalSets++;
      totalReps += set.reps;
      totalVolume += set.weightKg * set.reps;
    }
  }

  return {
    logId: log.id,
    date: new Date(log.completedAt).toISOString().split('T')[0],
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    muscleGroups: Array.from(muscleGroups),
    durationMinutes: log.durationMinutes,
  };
}

/** Extract recent exercises from logs for quick-add. */
export function extractRecentExercises(logs: WorkoutLog[], limit: number = 10): RecentExercise[] {
  const map = new Map<string, RecentExercise>();

  for (const log of logs) {
    for (const ex of log.exercises) {
      if (map.has(ex.exerciseId)) continue;

      const completedSets = ex.sets.filter((s) => s.isCompleted);
      if (completedSets.length === 0) continue;

      const lastSet = completedSets[completedSets.length - 1];
      map.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        lastWeight: lastSet.weightKg,
        lastReps: lastSet.reps,
        lastSets: completedSets.length,
        lastUsedAt: log.completedAt,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit);
}

/** Calculate current workout streak (consecutive days with logs). */
export function calculateStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;

  const dates = Array.from(
    new Set(
      logs.map((l) => new Date(l.completedAt).toISOString().split('T')[0]),
    ),
  ).sort((a, b) => b.localeCompare(a)); // newest first

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];

    if (dates[i] === expectedStr) {
      streak++;
    } else if (i === 0 && dates[0] === new Date(today.getTime() - 86400000).toISOString().split('T')[0]) {
      // Allow if most recent is yesterday (haven't worked out today yet)
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/** Total workouts this week (Mon–Sun). */
export function workoutsThisWeek(logs: WorkoutLog[]): number {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return logs.filter((l) => l.completedAt >= monday.getTime()).length;
}
