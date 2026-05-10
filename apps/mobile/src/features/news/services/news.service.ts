// ─── News Service ─────────────────────────────────────────
//
// Fetches articles from the Next.js RSS API.
// Manages local cache, saved articles, and read-later.
//

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, NewsCategory, SavedArticle, NewsCacheEntry } from '../../../types';
import { API_BASE_URL, CACHE_TTL } from '../../../constants/app';
import { emitEvent } from '../../../services/events/emitEvent';
import { createLogger } from '../../../services/logger/logger';

const log = createLogger('News');

// ─── Storage Keys ─────────────────────────────────────────

const KEYS = {
  CACHE_PREFIX: '@aura/news_cache_',
  SAVED_ARTICLES: '@aura/saved_articles',
  READ_LATER: '@aura/read_later',
} as const;

// ─── API Fetching ─────────────────────────────────────────

export async function fetchArticles(category?: NewsCategory): Promise<NewsArticle[]> {
  try {
    const url = category
      ? `${API_BASE_URL}/api/news?category=${category}`
      : `${API_BASE_URL}/api/news`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = (data.articles || []).map((a: any) => ({
      ...a,
      isSaved: false,
      isReadLater: false,
      fetchedAt: Date.now(),
    }));

    // Cache locally
    if (category) {
      await cacheArticles(category, articles);
    } else {
      // Cache each category separately
      const grouped = groupByCategory(articles);
      for (const [cat, arts] of Object.entries(grouped)) {
        await cacheArticles(cat as NewsCategory, arts);
      }
    }

    log.info(`Fetched ${articles.length} articles${category ? ` (${category})` : ''}`);
    emitEvent('NEWS_FETCHED', { count: articles.length, category });

    return articles;
  } catch (error: any) {
    log.warn(`Fetch failed: ${error.message} — trying cache`);
    // Fallback to cache
    if (category) {
      return getCachedArticles(category);
    }
    return getAllCachedArticles();
  }
}

function groupByCategory(articles: NewsArticle[]): Record<string, NewsArticle[]> {
  const groups: Record<string, NewsArticle[]> = {};
  for (const article of articles) {
    if (!groups[article.category]) groups[article.category] = [];
    groups[article.category].push(article);
  }
  return groups;
}

// ─── Local Cache ──────────────────────────────────────────

async function cacheArticles(category: NewsCategory, articles: NewsArticle[]): Promise<void> {
  const entry: NewsCacheEntry = {
    articles: articles.slice(0, 30),
    fetchedAt: Date.now(),
    category,
  };
  await AsyncStorage.setItem(KEYS.CACHE_PREFIX + category, JSON.stringify(entry));
}

export async function getCachedArticles(category: NewsCategory): Promise<NewsArticle[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CACHE_PREFIX + category);
    if (!raw) return [];

    const entry: NewsCacheEntry = JSON.parse(raw);
    return entry.articles;
  } catch {
    return [];
  }
}

export async function getAllCachedArticles(): Promise<NewsArticle[]> {
  const categories: NewsCategory[] = ['cybersecurity', 'ai', 'technology'];
  const all: NewsArticle[] = [];

  for (const cat of categories) {
    const cached = await getCachedArticles(cat);
    all.push(...cached);
  }

  return all.sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function isCacheStale(category: NewsCategory): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CACHE_PREFIX + category);
    if (!raw) return true;

    const entry: NewsCacheEntry = JSON.parse(raw);
    return Date.now() - entry.fetchedAt > CACHE_TTL.NEWS_FEED;
  } catch {
    return true;
  }
}

// ─── Saved Articles ───────────────────────────────────────

export async function getSavedArticles(): Promise<NewsArticle[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVED_ARTICLES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveArticle(article: NewsArticle): Promise<void> {
  const saved = await getSavedArticles();
  if (saved.some((a) => a.id === article.id)) return; // Already saved

  saved.unshift({ ...article, isSaved: true });
  await AsyncStorage.setItem(KEYS.SAVED_ARTICLES, JSON.stringify(saved.slice(0, 100)));

  emitEvent('ARTICLE_SAVED' as any, { articleId: article.id, title: article.title });
  log.info(`Article saved: ${article.title}`);
}

export async function unsaveArticle(articleId: string): Promise<void> {
  const saved = await getSavedArticles();
  const updated = saved.filter((a) => a.id !== articleId);
  await AsyncStorage.setItem(KEYS.SAVED_ARTICLES, JSON.stringify(updated));
}

export async function isArticleSaved(articleId: string): Promise<boolean> {
  const saved = await getSavedArticles();
  return saved.some((a) => a.id === articleId);
}

// ─── Read Later ───────────────────────────────────────────

export async function getReadLaterArticles(): Promise<NewsArticle[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.READ_LATER);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function markReadLater(article: NewsArticle): Promise<void> {
  const list = await getReadLaterArticles();
  if (list.some((a) => a.id === article.id)) return;

  list.unshift({ ...article, isReadLater: true });
  await AsyncStorage.setItem(KEYS.READ_LATER, JSON.stringify(list.slice(0, 50)));
}

export async function removeReadLater(articleId: string): Promise<void> {
  const list = await getReadLaterArticles();
  const updated = list.filter((a) => a.id !== articleId);
  await AsyncStorage.setItem(KEYS.READ_LATER, JSON.stringify(updated));
}
