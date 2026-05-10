// ─── Nutrition Types ──────────────────────────────────────
//
// Protein-first nutrition tracking system.
// Designed for quick logging, reusable foods, and daily targets.
//

// ═══════════════════════════════════════════════════════════
// NUTRITION LOG (individual food entry)
// ═══════════════════════════════════════════════════════════

export interface NutritionLog {
  id: string;
  userId: string;
  foodName: string;
  protein: number;         // grams
  calories?: number;       // optional
  quantity: number;        // e.g., 1, 2, 0.5
  unit: string;           // e.g., "serving", "scoop", "g", "piece"
  mealType?: MealType;
  date: string;           // YYYY-MM-DD
  timestamp: number;      // exact time logged
  foodLibraryId?: string; // link to food library item
  createdAt: number;
  updatedAt: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🍎 Snack',
  pre_workout: '💪 Pre-Workout',
  post_workout: '🏋️ Post-Workout',
};

// ═══════════════════════════════════════════════════════════
// FOOD LIBRARY (reusable food items)
// ═══════════════════════════════════════════════════════════

export interface FoodLibraryItem {
  id: string;
  userId: string;
  name: string;
  protein: number;        // per serving
  calories?: number;      // per serving
  servingSize: number;    // e.g. 100
  servingUnit: string;    // e.g. "g", "scoop", "piece"
  category: FoodCategory;
  isDefault: boolean;     // from built-in library
  usageCount: number;     // for "frequent" sorting
  lastUsedAt: number;
  createdAt: number;
}

export type FoodCategory =
  | 'protein_powder'
  | 'meat'
  | 'dairy'
  | 'eggs'
  | 'legumes'
  | 'nuts'
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'supplements'
  | 'prepared_meals'
  | 'other';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein_powder: '🥤 Protein Powder',
  meat: '🥩 Meat',
  dairy: '🧀 Dairy',
  eggs: '🥚 Eggs',
  legumes: '🫘 Legumes',
  nuts: '🥜 Nuts',
  grains: '🌾 Grains',
  vegetables: '🥦 Vegetables',
  fruits: '🍎 Fruits',
  supplements: '💊 Supplements',
  prepared_meals: '🍱 Prepared Meals',
  other: '🍽️ Other',
};

// ═══════════════════════════════════════════════════════════
// DAILY NUTRITION SUMMARY
// ═══════════════════════════════════════════════════════════

export interface DailyNutritionSummary {
  id: string;             // "{userId}_{YYYY-MM-DD}"
  userId: string;
  date: string;           // YYYY-MM-DD
  totalProtein: number;
  totalCalories: number;
  entryCount: number;
  proteinGoalMet: boolean;
  meals: MealBreakdown[];
  createdAt: number;
  updatedAt: number;
}

export interface MealBreakdown {
  mealType: MealType;
  protein: number;
  calories: number;
  entryCount: number;
}

// ═══════════════════════════════════════════════════════════
// NUTRITION GOALS
// ═══════════════════════════════════════════════════════════

export interface NutritionGoal {
  dailyProteinTarget: number;   // grams
  dailyCalorieTarget?: number;  // optional
}

export const DEFAULT_NUTRITION_GOAL: NutritionGoal = {
  dailyProteinTarget: 150,
  dailyCalorieTarget: 2000,
};

// ═══════════════════════════════════════════════════════════
// RECENT FOOD (for quick-add)
// ═══════════════════════════════════════════════════════════

export interface RecentFood {
  foodName: string;
  protein: number;
  calories?: number;
  quantity: number;
  unit: string;
  foodLibraryId?: string;
  lastUsedAt: number;
}
