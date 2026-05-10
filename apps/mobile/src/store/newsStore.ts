// ─── News Store ───────────────────────────────────────────
//
// Zustand state for news feed, categories, saved articles.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, NewsCategory } from '../types';
import * as svc from '../features/news/services/news.service';

interface NewsState {
  articles: NewsArticle[];
  savedArticles: NewsArticle[];
  readLaterArticles: NewsArticle[];
  activeCategory: NewsCategory | 'all';
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  fetchArticles: (category?: NewsCategory) => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadSavedArticles: () => Promise<void>;
  loadReadLater: () => Promise<void>;
  saveArticle: (article: NewsArticle) => Promise<void>;
  unsaveArticle: (articleId: string) => Promise<void>;
  markReadLater: (article: NewsArticle) => Promise<void>;
  removeReadLater: (articleId: string) => Promise<void>;
  setCategory: (category: NewsCategory | 'all') => void;
  clearError: () => void;
}

export const selectNewsArticles = (s: NewsState) => s.articles;
export const selectSavedArticles = (s: NewsState) => s.savedArticles;
export const selectReadLaterArticles = (s: NewsState) => s.readLaterArticles;
export const selectNewsCategory = (s: NewsState) => s.activeCategory;
export const selectNewsLoading = (s: NewsState) => s.isLoading;
export const selectFilteredArticles = (s: NewsState) =>
  s.activeCategory === 'all'
    ? s.articles
    : s.articles.filter((a) => a.category === s.activeCategory);

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      articles: [],
      savedArticles: [],
      readLaterArticles: [],
      activeCategory: 'all',
      isLoading: false,
      error: null,
      lastFetchedAt: null,

      fetchArticles: async (category) => {
        set({ isLoading: true, error: null });
        try {
          const articles = await svc.fetchArticles(category);

          // Merge saved status
          const saved = get().savedArticles;
          const readLater = get().readLaterArticles;
          const merged = articles.map((a) => ({
            ...a,
            isSaved: saved.some((s) => s.id === a.id),
            isReadLater: readLater.some((r) => r.id === a.id),
          }));

          set({ articles: merged, isLoading: false, lastFetchedAt: Date.now() });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      refreshFeed: async () => {
        const { activeCategory } = get();
        const cat = activeCategory === 'all' ? undefined : activeCategory;
        await get().fetchArticles(cat);
      },

      loadSavedArticles: async () => {
        const savedArticles = await svc.getSavedArticles();
        set({ savedArticles });
      },

      loadReadLater: async () => {
        const readLaterArticles = await svc.getReadLaterArticles();
        set({ readLaterArticles });
      },

      saveArticle: async (article) => {
        await svc.saveArticle(article);
        const savedArticles = await svc.getSavedArticles();
        set((s) => ({
          savedArticles,
          articles: s.articles.map((a) =>
            a.id === article.id ? { ...a, isSaved: true } : a,
          ),
        }));
      },

      unsaveArticle: async (articleId) => {
        await svc.unsaveArticle(articleId);
        const savedArticles = await svc.getSavedArticles();
        set((s) => ({
          savedArticles,
          articles: s.articles.map((a) =>
            a.id === articleId ? { ...a, isSaved: false } : a,
          ),
        }));
      },

      markReadLater: async (article) => {
        await svc.markReadLater(article);
        const readLaterArticles = await svc.getReadLaterArticles();
        set((s) => ({
          readLaterArticles,
          articles: s.articles.map((a) =>
            a.id === article.id ? { ...a, isReadLater: true } : a,
          ),
        }));
      },

      removeReadLater: async (articleId) => {
        await svc.removeReadLater(articleId);
        const readLaterArticles = await svc.getReadLaterArticles();
        set((s) => ({
          readLaterArticles,
          articles: s.articles.map((a) =>
            a.id === articleId ? { ...a, isReadLater: false } : a,
          ),
        }));
      },

      setCategory: (category) => set({ activeCategory: category }),

      clearError: () => set({ error: null }),
    }),
    {
      name: '@aura/news',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        articles: state.articles.slice(0, 30),
        savedArticles: state.savedArticles.slice(0, 50),
        readLaterArticles: state.readLaterArticles.slice(0, 20),
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);
