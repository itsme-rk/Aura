// ─── Product Store ────────────────────────────────────────
//
// Product vault state management.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProductItem,
  ProductCategory,
  ProductSpendingSummary,
} from '../types';
import * as svc from '../features/products/services/product.service';

interface ProductState {
  products: ProductItem[];
  activeProducts: ProductItem[];
  isLoading: boolean;
  error: string | null;
  filterCategory: ProductCategory | 'all';

  fetchProducts: (userId: string) => Promise<void>;
  addProduct: (product: Omit<ProductItem, 'id' | 'createdAt' | 'updatedAt' | 'repurchaseCount' | 'status'>) => Promise<string>;
  updateProduct: (productId: string, updates: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  markFinished: (productId: string) => Promise<void>;
  repurchase: (product: ProductItem) => Promise<string>;
  setFilterCategory: (category: ProductCategory | 'all') => void;
}

export const selectProducts = (s: ProductState) => s.products;
export const selectActiveProducts = (s: ProductState) => s.activeProducts;
export const selectProductLoading = (s: ProductState) => s.isLoading;
export const selectFilteredProducts = (s: ProductState) =>
  s.filterCategory === 'all'
    ? s.activeProducts
    : s.activeProducts.filter((p) => p.category === s.filterCategory);
export const selectProductSpending = (s: ProductState) =>
  svc.calculateMonthlySpending(s.products);
export const selectExpiringProducts = (s: ProductState) =>
  svc.getExpiringProducts(s.activeProducts);

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      activeProducts: [],
      isLoading: false,
      error: null,
      filterCategory: 'all',

      fetchProducts: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const products = await svc.fetchProducts(userId);
          const activeProducts = products.filter((p) => p.status === 'active');
          set({ products, activeProducts, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      addProduct: async (product) => {
        set({ isLoading: true });
        const id = await svc.addProduct(product);
        // Optimistic update
        const newProduct: ProductItem = {
          ...product,
          id,
          status: 'active',
          repurchaseCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          products: [newProduct, ...s.products],
          activeProducts: [newProduct, ...s.activeProducts],
          isLoading: false,
        }));
        return id;
      },

      updateProduct: async (productId, updates) => {
        await svc.updateProduct(productId, updates);
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, ...updates, updatedAt: Date.now() } : p,
          ),
          activeProducts: s.activeProducts.map((p) =>
            p.id === productId ? { ...p, ...updates, updatedAt: Date.now() } : p,
          ),
        }));
      },

      deleteProduct: async (productId) => {
        await svc.deleteProduct(productId);
        set((s) => ({
          products: s.products.filter((p) => p.id !== productId),
          activeProducts: s.activeProducts.filter((p) => p.id !== productId),
        }));
      },

      markFinished: async (productId) => {
        await svc.markFinished(productId);
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, status: 'finished' as const, finishedAt: Date.now() } : p,
          ),
          activeProducts: s.activeProducts.filter((p) => p.id !== productId),
        }));
      },

      repurchase: async (product) => {
        const newId = await svc.repurchaseProduct(product);
        // Refresh from service for clean state
        if (product.userId) {
          await get().fetchProducts(product.userId);
        }
        return newId;
      },

      setFilterCategory: (category) => set({ filterCategory: category }),
    }),
    {
      name: '@aura/products',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products.slice(0, 50),
        activeProducts: state.activeProducts.slice(0, 30),
      }),
    },
  ),
);
