// ─── Nutrition Types ──────────────────────────────────────

export interface NutritionLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterMl: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Meal {
  id: string;
  type: MealType;
  time: number;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface FoodItem {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  isCustom: boolean;
  barcode?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}
