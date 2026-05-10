// ─── Nutrition Service ────────────────────────────────────
//
// Firestore operations for nutrition logging, food library,
// and daily summaries. Offline-first with queue fallback.
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
  NutritionLog,
  FoodLibraryItem,
  DailyNutritionSummary,
  NutritionGoal,
  RecentFood,
  MealType,
  MealBreakdown,
  DEFAULT_NUTRITION_GOAL,
} from '../../../types';

// ─── Collections ──────────────────────────────────────────

const COLLECTIONS = {
  LOGS: 'nutritionLogs',
  FOOD_LIBRARY: 'foodLibrary',
  DAILY_SUMMARY: 'dailyNutritionSummary',
} as const;

// ═══════════════════════════════════════════════════════════
// NUTRITION LOGS
// ═══════════════════════════════════════════════════════════

/** Log a protein/food entry. */
export async function logFood(
  entry: Omit<NutritionLog, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  try {
    const id = await createDocument(COLLECTIONS.LOGS, entry);

    emitEvent('PROTEIN_ADDED', {
      logId: id,
      foodName: entry.foodName,
      protein: entry.protein * entry.quantity,
      calories: entry.calories ? entry.calories * entry.quantity : undefined,
      date: entry.date,
    });

    return id;
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.LOGS,
      data: entry as unknown as Record<string, unknown>,
    });
    return `offline_${Date.now()}`;
  }
}

/** Delete a nutrition log entry. */
export async function deleteLog(logId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTIONS.LOGS, logId);
  } catch {
    await enqueue({ type: 'delete', collection: COLLECTIONS.LOGS, docId: logId });
  }
}

/** Fetch all nutrition logs for a specific date. */
export async function fetchLogsByDate(
  userId: string,
  date: string,
): Promise<NutritionLog[]> {
  return queryDocuments<NutritionLog>(COLLECTIONS.LOGS, {
    filters: [
      { field: 'userId', op: '==', value: userId },
      { field: 'date', op: '==', value: date },
    ],
    sortBy: 'timestamp',
    sortDirection: 'desc',
  });
}

/** Fetch recent nutrition logs. */
export async function fetchRecentLogs(
  userId: string,
  limitTo: number = 50,
): Promise<NutritionLog[]> {
  return getUserDocuments<NutritionLog>(COLLECTIONS.LOGS, userId, {
    sortBy: 'timestamp',
    limitTo,
  });
}

// ═══════════════════════════════════════════════════════════
// FOOD LIBRARY
// ═══════════════════════════════════════════════════════════

/** Save a custom food to the user's library. */
export async function saveFoodToLibrary(
  food: Omit<FoodLibraryItem, 'id' | 'createdAt'>,
): Promise<string> {
  try {
    return await createDocument(COLLECTIONS.FOOD_LIBRARY, food);
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.FOOD_LIBRARY,
      data: food as unknown as Record<string, unknown>,
    });
    return `offline_${Date.now()}`;
  }
}

/** Fetch user's food library. */
export async function fetchFoodLibrary(userId: string): Promise<FoodLibraryItem[]> {
  return getUserDocuments<FoodLibraryItem>(COLLECTIONS.FOOD_LIBRARY, userId, {
    sortBy: 'usageCount',
  });
}

/** Increment usage count for a food library item. */
export async function incrementFoodUsage(foodId: string): Promise<void> {
  try {
    const food = await getDocument<FoodLibraryItem>(COLLECTIONS.FOOD_LIBRARY, foodId);
    if (food) {
      await updateDocument(COLLECTIONS.FOOD_LIBRARY, foodId, {
        usageCount: food.usageCount + 1,
        lastUsedAt: Date.now(),
      });
    }
  } catch {
    // Non-critical — silently fail
  }
}

// ═══════════════════════════════════════════════════════════
// DAILY SUMMARY
// ═══════════════════════════════════════════════════════════

/** Get or create daily summary. */
export async function getDailySummary(
  userId: string,
  date: string,
): Promise<DailyNutritionSummary | null> {
  const id = `${userId}_${date}`;
  return getDocument<DailyNutritionSummary>(COLLECTIONS.DAILY_SUMMARY, id);
}

/** Recalculate and save daily summary from logs. */
export async function recalculateDailySummary(
  userId: string,
  date: string,
  proteinTarget: number,
): Promise<DailyNutritionSummary> {
  const logs = await fetchLogsByDate(userId, date);
  const id = `${userId}_${date}`;

  let totalProtein = 0;
  let totalCalories = 0;
  const mealMap = new Map<MealType, MealBreakdown>();

  for (const log of logs) {
    const protein = log.protein * log.quantity;
    const calories = (log.calories ?? 0) * log.quantity;

    totalProtein += protein;
    totalCalories += calories;

    const mealType = log.mealType ?? 'snack';
    const existing = mealMap.get(mealType);
    if (existing) {
      existing.protein += protein;
      existing.calories += calories;
      existing.entryCount += 1;
    } else {
      mealMap.set(mealType, {
        mealType,
        protein,
        calories,
        entryCount: 1,
      });
    }
  }

  const proteinGoalMet = totalProtein >= proteinTarget;

  const summary: DailyNutritionSummary = {
    id,
    userId,
    date,
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCalories: Math.round(totalCalories),
    entryCount: logs.length,
    proteinGoalMet,
    meals: Array.from(mealMap.values()),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await createDocument(COLLECTIONS.DAILY_SUMMARY, summary, id);
  } catch {
    await enqueue({
      type: 'create',
      collection: COLLECTIONS.DAILY_SUMMARY,
      docId: id,
      data: summary as unknown as Record<string, unknown>,
    });
  }

  // Emit protein goal reached event
  if (proteinGoalMet) {
    emitEvent('PROTEIN_GOAL_REACHED', {
      userId,
      date,
      totalProtein: summary.totalProtein,
      target: proteinTarget,
    });
  }

  return summary;
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS HELPERS
// ═══════════════════════════════════════════════════════════

/** Extract recent unique foods from logs for quick-add. */
export function extractRecentFoods(logs: NutritionLog[], limit: number = 15): RecentFood[] {
  const map = new Map<string, RecentFood>();

  for (const log of logs) {
    const key = log.foodName.toLowerCase();
    if (map.has(key)) continue;

    map.set(key, {
      foodName: log.foodName,
      protein: log.protein,
      calories: log.calories,
      quantity: log.quantity,
      unit: log.unit,
      foodLibraryId: log.foodLibraryId,
      lastUsedAt: log.timestamp,
    });
  }

  return Array.from(map.values())
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit);
}

/** Calculate total protein logged today from logs. */
export function calculateDailyProtein(logs: NutritionLog[]): number {
  return logs.reduce((sum, log) => sum + log.protein * log.quantity, 0);
}

/** Calculate total calories logged today from logs. */
export function calculateDailyCalories(logs: NutritionLog[]): number {
  return logs.reduce((sum, log) => sum + (log.calories ?? 0) * log.quantity, 0);
}

/** Get today's date in YYYY-MM-DD format. */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
