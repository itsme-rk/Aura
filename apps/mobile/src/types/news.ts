// ─── News Types ───────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  category: NewsCategory;
  publishedAt: number;
  fetchedAt: number;
  summary?: string;
  isSaved: boolean;
  isReadLater: boolean;
  readAt?: number;
}

export type NewsCategory = 'cybersecurity' | 'ai' | 'technology';

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  cybersecurity: '🔒 Cybersecurity',
  ai: '🤖 AI',
  technology: '💻 Technology',
};

export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  cybersecurity: '#FF4D6A',
  ai: '#7C5CFC',
  technology: '#4AE0D2',
};

export interface NewsFeed {
  id: string;
  name: string;
  rssUrl: string;
  category: NewsCategory;
}

export interface NewsCacheEntry {
  articles: NewsArticle[];
  fetchedAt: number;
  category: NewsCategory;
}

export interface SavedArticle {
  id: string;
  userId: string;
  article: NewsArticle;
  savedAt: number;
  type: 'saved' | 'read_later';
}
