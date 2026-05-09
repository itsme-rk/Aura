// ─── News Types ───────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
  category: NewsCategory;
  publishedAt: number;
  fetchedAt: number;
  isRead: boolean;
  isBookmarked: boolean;
  aiSummary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  relevanceScore?: number; // 0-100
}

export type NewsCategory =
  | 'technology'
  | 'science'
  | 'health'
  | 'business'
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'world';

export interface NewsFeed {
  id: string;
  userId: string;
  name: string;
  rssUrl: string;
  category: NewsCategory;
  isActive: boolean;
  lastFetchedAt: number;
}
