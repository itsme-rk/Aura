// ─── App Constants ────────────────────────────────────────

export const APP_NAME = 'Aura';
export const APP_VERSION = '1.0.0';

// ─── API Configuration ───────────────────────────────────

/** Base URL for web API routes (Next.js) */
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://aura-web.vercel.app';

// ─── Cache TTLs (milliseconds) ───────────────────────────

export const CACHE_TTL = {
  NEWS_FEED: 15 * 60 * 1000,     // 15 minutes
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutes
  NEWS_ARTICLES: 60 * 60 * 1000, // 1 hour (saved articles)
} as const;

// ─── RSS Feed Sources ─────────────────────────────────────

export const RSS_FEEDS = {
  cybersecurity: [
    { id: 'bleeping', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
    { id: 'krebs', name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
  ],
  ai: [
    { id: 'hackernews', name: 'Hacker News', url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT' },
    { id: 'mitai', name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/feed/' },
  ],
  technology: [
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  ],
} as const;
