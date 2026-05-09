// ─── Product Types ────────────────────────────────────────

export interface ProductItem {
  id: string;
  userId: string;
  barcode: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  imageUrl?: string;
  nutritionPer100g?: ProductNutrition;
  ingredients?: string[];
  healthScore?: number; // 0-100
  tags: string[];
  isFavorite: boolean;
  scannedAt: number;
  createdAt: number;
}

export interface ProductNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export type ProductCategory =
  | 'food'
  | 'beverage'
  | 'supplement'
  | 'personal_care'
  | 'household'
  | 'other';
