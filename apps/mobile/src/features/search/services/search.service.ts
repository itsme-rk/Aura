// ─── Search Service ───────────────────────────────────────
//
// Universal local-first search engine for all Aura domains.
// Supports exercises, foods, articles, products.
//

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../../services/logger/logger';
import { emitEvent } from '../../../services/events/emitEvent';

const log = createLogger('Search');

// ─── Types ────────────────────────────────────────────────

export type SearchDomain = 'exercises' | 'foods' | 'articles' | 'products' | 'all';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  domain: SearchDomain;
  data: unknown;
  matchScore: number;
}

export interface SearchHistoryEntry {
  query: string;
  domain: SearchDomain;
  timestamp: number;
  resultCount: number;
}

// ─── Storage ──────────────────────────────────────────────

const KEYS = {
  HISTORY: '@aura/search_history',
  RECENT: '@aura/recent_searches',
} as const;

const MAX_HISTORY = 30;
const MAX_RECENT = 10;

// ─── Search History ───────────────────────────────────────

export async function getSearchHistory(): Promise<SearchHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addToHistory(
  query: string,
  domain: SearchDomain,
  resultCount: number,
): Promise<void> {
  const history = await getSearchHistory();
  const entry: SearchHistoryEntry = {
    query: query.trim(),
    domain,
    timestamp: Date.now(),
    resultCount,
  };

  // Remove duplicate queries
  const filtered = history.filter(
    (h) => h.query.toLowerCase() !== query.toLowerCase() || h.domain !== domain,
  );

  filtered.unshift(entry);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
}

export async function getRecentSearches(): Promise<string[]> {
  const history = await getSearchHistory();
  const unique = new Set<string>();
  const recent: string[] = [];

  for (const entry of history) {
    const q = entry.query.toLowerCase();
    if (!unique.has(q)) {
      unique.add(q);
      recent.push(entry.query);
    }
    if (recent.length >= MAX_RECENT) break;
  }

  return recent;
}

// ─── Scoring ──────────────────────────────────────────────

function calculateScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower === queryLower) return 100;       // Exact match
  if (textLower.startsWith(queryLower)) return 90; // Starts with
  if (textLower.includes(queryLower)) return 70;   // Contains

  // Word-level matching
  const queryWords = queryLower.split(/\s+/);
  const matchedWords = queryWords.filter((w) => textLower.includes(w));
  if (matchedWords.length > 0) {
    return Math.round((matchedWords.length / queryWords.length) * 60);
  }

  return 0;
}

// ─── Local Search Functions ───────────────────────────────

export function searchExercises(
  exercises: Array<{ id: string; name: string; muscleGroup: string; equipment: string }>,
  query: string,
): SearchResult[] {
  return exercises
    .map((ex) => ({
      id: ex.id,
      title: ex.name,
      subtitle: `${ex.muscleGroup} · ${ex.equipment}`,
      domain: 'exercises' as SearchDomain,
      data: ex,
      matchScore: Math.max(
        calculateScore(ex.name, query),
        calculateScore(ex.muscleGroup, query),
        calculateScore(ex.equipment, query),
      ),
    }))
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function searchFoods(
  foods: Array<{ name: string; protein: number; category: string; [k: string]: any }>,
  query: string,
): SearchResult[] {
  return foods
    .map((food, idx) => ({
      id: `food_${idx}`,
      title: food.name,
      subtitle: `${food.protein}g protein · ${food.category}`,
      domain: 'foods' as SearchDomain,
      data: food,
      matchScore: Math.max(
        calculateScore(food.name, query),
        calculateScore(food.category, query),
      ),
    }))
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function searchArticles(
  articles: Array<{ id: string; title: string; source: string; category: string; summary?: string }>,
  query: string,
): SearchResult[] {
  return articles
    .map((article) => ({
      id: article.id,
      title: article.title,
      subtitle: `${article.source} · ${article.category}`,
      domain: 'articles' as SearchDomain,
      data: article,
      matchScore: Math.max(
        calculateScore(article.title, query),
        calculateScore(article.source, query),
        calculateScore(article.summary ?? '', query),
      ),
    }))
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function searchProducts(
  products: Array<{ id: string; name: string; brand?: string; category: string }>,
  query: string,
): SearchResult[] {
  return products
    .map((product) => ({
      id: product.id,
      title: product.name,
      subtitle: `${product.brand ?? ''} · ${product.category}`,
      domain: 'products' as SearchDomain,
      data: product,
      matchScore: Math.max(
        calculateScore(product.name, query),
        calculateScore(product.brand ?? '', query),
        calculateScore(product.category, query),
      ),
    }))
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Universal Search ─────────────────────────────────────

export interface UniversalSearchInput {
  exercises: Array<{ id: string; name: string; muscleGroup: string; equipment: string }>;
  foods: Array<{ name: string; protein: number; category: string; [k: string]: any }>;
  articles: Array<{ id: string; title: string; source: string; category: string; summary?: string }>;
  products: Array<{ id: string; name: string; brand?: string; category: string }>;
}

export function universalSearch(
  query: string,
  data: UniversalSearchInput,
  domain: SearchDomain = 'all',
  limit: number = 20,
): SearchResult[] {
  if (!query.trim()) return [];

  let results: SearchResult[] = [];

  if (domain === 'all' || domain === 'exercises') {
    results.push(...searchExercises(data.exercises, query));
  }
  if (domain === 'all' || domain === 'foods') {
    results.push(...searchFoods(data.foods, query));
  }
  if (domain === 'all' || domain === 'articles') {
    results.push(...searchArticles(data.articles, query));
  }
  if (domain === 'all' || domain === 'products') {
    results.push(...searchProducts(data.products, query));
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
