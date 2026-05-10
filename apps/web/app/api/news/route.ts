// ─── RSS News API Route ───────────────────────────────────
//
// Fetches, parses, and normalizes RSS feeds.
// Aggressive caching with 15-minute TTL.
//
// GET /api/news?category=cybersecurity|ai|technology
// GET /api/news (returns all categories)
//

import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────

interface NormalizedArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string;
  publishedAt: number;
  summary?: string;
}

interface FeedSource {
  id: string;
  name: string;
  url: string;
}

// ─── Feed Sources ─────────────────────────────────────────

const FEEDS: Record<string, FeedSource[]> = {
  cybersecurity: [
    { id: 'bleeping', name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
    { id: 'krebs', name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
  ],
  ai: [
    { id: 'hackernews', name: 'Hacker News', url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT' },
    { id: 'mitai', name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  ],
  technology: [
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  ],
};

// ─── In-Memory Cache ──────────────────────────────────────

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const cache: Record<string, { articles: NormalizedArticle[]; fetchedAt: number }> = {};

function getCached(category: string): NormalizedArticle[] | null {
  const entry = cache[category];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry.articles;
}

function setCache(category: string, articles: NormalizedArticle[]): void {
  cache[category] = { articles, fetchedAt: Date.now() };
}

// ─── XML Parsing (lightweight, no deps) ───────────────────

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataPattern = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : '';
}

function extractLink(itemXml: string): string {
  // RSS 2.0: <link>url</link>
  const linkMatch = itemXml.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (linkMatch) return linkMatch[1].trim();

  // Atom: <link href="url" />
  const atomMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  if (atomMatch) return atomMatch[1].trim();

  return '';
}

function extractDate(itemXml: string): number {
  // Try <pubDate>, <published>, <updated>, <dc:date>
  const dateStr =
    extractTag(itemXml, 'pubDate') ||
    extractTag(itemXml, 'published') ||
    extractTag(itemXml, 'updated') ||
    extractTag(itemXml, 'dc:date');

  if (!dateStr) return Date.now();

  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

function extractSummary(itemXml: string): string {
  const desc =
    extractTag(itemXml, 'description') ||
    extractTag(itemXml, 'summary') ||
    extractTag(itemXml, 'content');

  if (!desc) return '';

  // Strip HTML tags, limit to 200 chars
  const text = desc.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
}

function parseRSSFeed(xml: string, source: FeedSource, category: string): NormalizedArticle[] {
  const articles: NormalizedArticle[] = [];

  // Split by <item> or <entry> (RSS 2.0 vs Atom)
  const itemPattern = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemPattern.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractLink(itemXml);

    if (!title || !link) continue;

    const publishedAt = extractDate(itemXml);
    const summary = extractSummary(itemXml);

    articles.push({
      id: `${source.id}_${Buffer.from(link).toString('base64url').slice(0, 16)}`,
      title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      link,
      source: source.name,
      category,
      publishedAt,
      summary,
    });
  }

  return articles;
}

// ─── Fetch + Parse ────────────────────────────────────────

async function fetchFeed(source: FeedSource, category: string): Promise<NormalizedArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aura-RSS-Reader/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[RSS] Failed to fetch ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseRSSFeed(xml, source, category);
  } catch (err) {
    console.warn(`[RSS] Error fetching ${source.name}:`, err);
    return [];
  }
}

async function fetchCategoryFeeds(category: string): Promise<NormalizedArticle[]> {
  const sources = FEEDS[category];
  if (!sources) return [];

  const results = await Promise.allSettled(
    sources.map((source) => fetchFeed(source, category)),
  );

  const articles: NormalizedArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // Sort by published date (newest first), deduplicate by link
  const seen = new Set<string>();
  const deduped = articles
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .filter((a) => {
      if (seen.has(a.link)) return false;
      seen.add(a.link);
      return true;
    })
    .slice(0, 30); // Max 30 articles per category

  return deduped;
}

// ─── API Handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Validate category
    const validCategories = ['cybersecurity', 'ai', 'technology'];
    const categoriesToFetch = category && validCategories.includes(category)
      ? [category]
      : validCategories;

    const allArticles: NormalizedArticle[] = [];

    for (const cat of categoriesToFetch) {
      // Check cache first
      const cached = getCached(cat);
      if (cached) {
        allArticles.push(...cached);
        continue;
      }

      // Fetch fresh
      const articles = await fetchCategoryFeeds(cat);
      setCache(cat, articles);
      allArticles.push(...articles);
    }

    // Final sort by date
    allArticles.sort((a, b) => b.publishedAt - a.publishedAt);

    return NextResponse.json(
      {
        articles: allArticles,
        count: allArticles.length,
        categories: categoriesToFetch,
        cachedAt: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      },
    );
  } catch (error: any) {
    console.error('[RSS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news feeds', message: error?.message },
      { status: 500 },
    );
  }
}
