// ─── Product Service ──────────────────────────────────────
//
// CRUD for product vault with offline fallback,
// spending calculations, and repurchase tracking.
//

import {
  ProductItem,
  ProductCategory,
  ProductStatus,
  ProductSpendingSummary,
} from '../../../types';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
} from '../../../services/firestore.service';
import { enqueue } from '../../offline/queue';
import { emitEvent } from '../../../services/events/emitEvent';
import { createLogger } from '../../../services/logger/logger';

const log = createLogger('Product');
const COLLECTION = 'products';

// ─── CRUD ─────────────────────────────────────────────────

export async function addProduct(
  product: Omit<ProductItem, 'id' | 'createdAt' | 'updatedAt' | 'repurchaseCount' | 'status'>,
): Promise<string> {
  const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const data: ProductItem = {
    ...product,
    id,
    status: 'active',
    repurchaseCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await createDocument(COLLECTION, data as any, id);
  } catch {
    await enqueue({ type: 'create', collection: COLLECTION, docId: id, data: data as any });
  }

  emitEvent('PRODUCT_ADDED', { productId: id, name: product.name, category: product.category });
  log.info(`Product added: ${product.name}`);
  return id;
}

export async function updateProduct(
  productId: string,
  updates: Partial<ProductItem>,
): Promise<void> {
  const data = { ...updates, updatedAt: Date.now() };

  try {
    await updateDocument(COLLECTION, productId, data as any);
  } catch {
    await enqueue({ type: 'update', collection: COLLECTION, docId: productId, data: data as any });
  }

  emitEvent('PRODUCT_UPDATED', { productId, updates: Object.keys(updates) });
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTION, productId);
  } catch {
    await enqueue({ type: 'delete', collection: COLLECTION, docId: productId });
  }
}

export async function markFinished(productId: string): Promise<void> {
  await updateProduct(productId, { status: 'finished', finishedAt: Date.now() });
  emitEvent('PRODUCT_FINISHED', { productId });
}

export async function repurchaseProduct(product: ProductItem): Promise<string> {
  // Mark old one as finished
  await markFinished(product.id);

  // Create new entry
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const newId = await addProduct({
    userId: product.userId,
    name: product.name,
    category: product.category,
    brand: product.brand,
    store: product.store,
    purchaseDate: dateStr,
    expiryDate: undefined,
    quantity: product.quantity,
    unit: product.unit,
    price: product.price,
    currency: product.currency,
    usageFrequency: product.usageFrequency,
    notes: product.notes,
  });

  emitEvent('PRODUCT_REPURCHASED', { oldId: product.id, newId, name: product.name });
  log.info(`Repurchased: ${product.name}`);
  return newId;
}

// ─── Queries ──────────────────────────────────────────────

export async function fetchProducts(userId: string): Promise<ProductItem[]> {
  try {
    const results = await queryDocuments(COLLECTION, {
      filters: [{ field: 'userId', op: '==', value: userId }],
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });
    return results as unknown as ProductItem[];
  } catch (err: any) {
    log.warn(`Fetch products failed: ${err.message}`);
    return [];
  }
}

export async function fetchActiveProducts(userId: string): Promise<ProductItem[]> {
  try {
    const results = await queryDocuments(COLLECTION, {
      filters: [
        { field: 'userId', op: '==', value: userId },
        { field: 'status', op: '==', value: 'active' },
      ],
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });
    return results as unknown as ProductItem[];
  } catch {
    return [];
  }
}

export async function fetchProductsByCategory(
  userId: string,
  category: ProductCategory,
): Promise<ProductItem[]> {
  try {
    const results = await queryDocuments(COLLECTION, {
      filters: [
        { field: 'userId', op: '==', value: userId },
        { field: 'category', op: '==', value: category },
      ],
      orderByField: 'createdAt',
      orderDirection: 'desc',
    });
    return results as unknown as ProductItem[];
  } catch {
    return [];
  }
}

// ─── Spending ─────────────────────────────────────────────

export function calculateMonthlySpending(products: ProductItem[]): ProductSpendingSummary[] {
  const months: Record<string, ProductSpendingSummary> = {};

  for (const p of products) {
    if (!p.price) continue;
    const month = p.purchaseDate.slice(0, 7); // YYYY-MM

    if (!months[month]) {
      months[month] = { month, totalSpent: 0, itemCount: 0, byCategory: {} };
    }

    months[month].totalSpent += p.price;
    months[month].itemCount += 1;
    months[month].byCategory[p.category] = (months[month].byCategory[p.category] || 0) + p.price;
  }

  return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
}

export function getTotalSpending(products: ProductItem[]): number {
  return products.reduce((sum, p) => sum + (p.price ?? 0), 0);
}

// ─── Expiry Check ─────────────────────────────────────────

export function getExpiringProducts(products: ProductItem[], daysThreshold: number = 14): ProductItem[] {
  const now = Date.now();
  const threshold = daysThreshold * 24 * 60 * 60 * 1000;

  return products.filter((p) => {
    if (!p.expiryDate || p.status !== 'active') return false;
    const expiry = new Date(p.expiryDate).getTime();
    return expiry - now <= threshold && expiry > now;
  });
}
