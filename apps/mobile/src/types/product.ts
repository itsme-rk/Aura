// ─── Product Types ────────────────────────────────────────

export type ProductCategory =
  | 'supplement'
  | 'whey_protein'
  | 'skincare'
  | 'shampoo'
  | 'grooming'
  | 'vitamins'
  | 'other';

export type UsageFrequency = 'daily' | 'weekly' | 'monthly' | 'as_needed';
export type ProductStatus = 'active' | 'finished' | 'expired';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  supplement: '💊 Supplement',
  whey_protein: '🥤 Whey Protein',
  skincare: '🧴 Skincare',
  shampoo: '🧴 Shampoo',
  grooming: '✂️ Grooming',
  vitamins: '💉 Vitamins',
  other: '📦 Other',
};

export const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, string> = {
  supplement: '#7C5CFC',
  whey_protein: '#4AE0D2',
  skincare: '#F472B6',
  shampoo: '#60A5FA',
  grooming: '#FBBF24',
  vitamins: '#4ADE80',
  other: '#9898B0',
};

export interface ProductItem {
  id: string;
  userId: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  store?: string;
  purchaseDate: string;       // YYYY-MM-DD
  expiryDate?: string;        // YYYY-MM-DD
  quantity: number;
  unit?: string;
  price?: number;
  currency?: string;
  usageFrequency: UsageFrequency;
  status: ProductStatus;
  notes?: string;
  finishedAt?: number;
  repurchaseCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProductSpendingSummary {
  month: string;              // YYYY-MM
  totalSpent: number;
  itemCount: number;
  byCategory: Record<string, number>;
}
