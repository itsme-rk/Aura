// ─── Food Library ─────────────────────────────────────────
//
// Built-in food database for quick protein logging.
// Focused on high-protein foods commonly tracked by fitness users.
//

import { FoodLibraryItem, FoodCategory } from '../../../types';

// ─── Default Foods ────────────────────────────────────────

export interface DefaultFood {
  name: string;
  protein: number;
  calories?: number;
  servingSize: number;
  servingUnit: string;
  category: FoodCategory;
}

export const DEFAULT_FOODS: DefaultFood[] = [
  // ─── Protein Powders ──────────────────────────
  { name: 'Whey Protein (1 scoop)', protein: 25, calories: 120, servingSize: 1, servingUnit: 'scoop', category: 'protein_powder' },
  { name: 'Casein Protein (1 scoop)', protein: 24, calories: 130, servingSize: 1, servingUnit: 'scoop', category: 'protein_powder' },
  { name: 'Plant Protein (1 scoop)', protein: 20, calories: 110, servingSize: 1, servingUnit: 'scoop', category: 'protein_powder' },

  // ─── Meat & Poultry ───────────────────────────
  { name: 'Chicken Breast (100g)', protein: 31, calories: 165, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Turkey Breast (100g)', protein: 29, calories: 135, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Lean Ground Beef (100g)', protein: 26, calories: 250, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Salmon Fillet (100g)', protein: 25, calories: 208, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Tuna (1 can)', protein: 30, calories: 120, servingSize: 1, servingUnit: 'can', category: 'meat' },
  { name: 'Shrimp (100g)', protein: 24, calories: 99, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Pork Tenderloin (100g)', protein: 26, calories: 143, servingSize: 100, servingUnit: 'g', category: 'meat' },
  { name: 'Lamb (100g)', protein: 25, calories: 294, servingSize: 100, servingUnit: 'g', category: 'meat' },

  // ─── Dairy ────────────────────────────────────
  { name: 'Greek Yogurt (200g)', protein: 20, calories: 130, servingSize: 200, servingUnit: 'g', category: 'dairy' },
  { name: 'Cottage Cheese (200g)', protein: 24, calories: 206, servingSize: 200, servingUnit: 'g', category: 'dairy' },
  { name: 'Skyr (170g)', protein: 17, calories: 110, servingSize: 170, servingUnit: 'g', category: 'dairy' },
  { name: 'Milk (250ml)', protein: 8, calories: 122, servingSize: 250, servingUnit: 'ml', category: 'dairy' },
  { name: 'Paneer (100g)', protein: 18, calories: 265, servingSize: 100, servingUnit: 'g', category: 'dairy' },
  { name: 'Cheese Slice (30g)', protein: 7, calories: 110, servingSize: 30, servingUnit: 'g', category: 'dairy' },

  // ─── Eggs ─────────────────────────────────────
  { name: 'Whole Egg', protein: 6, calories: 72, servingSize: 1, servingUnit: 'egg', category: 'eggs' },
  { name: 'Egg Whites (3)', protein: 11, calories: 51, servingSize: 3, servingUnit: 'whites', category: 'eggs' },
  { name: 'Boiled Egg', protein: 6, calories: 78, servingSize: 1, servingUnit: 'egg', category: 'eggs' },

  // ─── Legumes ──────────────────────────────────
  { name: 'Lentils (1 cup cooked)', protein: 18, calories: 230, servingSize: 1, servingUnit: 'cup', category: 'legumes' },
  { name: 'Chickpeas (1 cup cooked)', protein: 15, calories: 269, servingSize: 1, servingUnit: 'cup', category: 'legumes' },
  { name: 'Black Beans (1 cup cooked)', protein: 15, calories: 227, servingSize: 1, servingUnit: 'cup', category: 'legumes' },
  { name: 'Soy Chunks (50g dry)', protein: 26, calories: 173, servingSize: 50, servingUnit: 'g', category: 'legumes' },
  { name: 'Tofu (100g)', protein: 8, calories: 76, servingSize: 100, servingUnit: 'g', category: 'legumes' },

  // ─── Nuts & Seeds ─────────────────────────────
  { name: 'Almonds (30g)', protein: 6, calories: 174, servingSize: 30, servingUnit: 'g', category: 'nuts' },
  { name: 'Peanut Butter (2 tbsp)', protein: 8, calories: 188, servingSize: 2, servingUnit: 'tbsp', category: 'nuts' },
  { name: 'Pumpkin Seeds (30g)', protein: 7, calories: 163, servingSize: 30, servingUnit: 'g', category: 'nuts' },

  // ─── Grains ───────────────────────────────────
  { name: 'Oats (50g dry)', protein: 7, calories: 190, servingSize: 50, servingUnit: 'g', category: 'grains' },
  { name: 'Quinoa (1 cup cooked)', protein: 8, calories: 222, servingSize: 1, servingUnit: 'cup', category: 'grains' },

  // ─── Supplements ──────────────────────────────
  { name: 'BCAA Drink', protein: 5, calories: 20, servingSize: 1, servingUnit: 'serving', category: 'supplements' },
  { name: 'Creatine (5g)', protein: 0, calories: 0, servingSize: 5, servingUnit: 'g', category: 'supplements' },
  { name: 'Protein Bar', protein: 20, calories: 210, servingSize: 1, servingUnit: 'bar', category: 'supplements' },
];

// ─── Search Helpers ───────────────────────────────────────

/** Search default foods by name (case-insensitive). */
export function searchDefaultFoods(query: string): DefaultFood[] {
  if (!query.trim()) return DEFAULT_FOODS;
  const q = query.toLowerCase();
  return DEFAULT_FOODS.filter((f) => f.name.toLowerCase().includes(q));
}

/** Get default foods by category. */
export function getDefaultFoodsByCategory(category: FoodCategory): DefaultFood[] {
  return DEFAULT_FOODS.filter((f) => f.category === category);
}

/** Get all unique categories from default foods. */
export function getDefaultCategories(): FoodCategory[] {
  return Array.from(new Set(DEFAULT_FOODS.map((f) => f.category)));
}
