// ─── Analytics Service ────────────────────────────────────
//
// Behavioral data aggregation layer.
// Batch calculates daily/weekly summaries from all domains.
// Local-first with AsyncStorage caching.
//

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitEvent } from '../../../services/events/emitEvent';
import { createLogger } from '../../../services/logger/logger';

const log = createLogger('Analytics');

// ─── Types ────────────────────────────────────────────────

export interface DailyAggregation {
  date: string;               // YYYY-MM-DD
  workoutsLogged: number;
  totalProtein: number;
  proteinGoalMet: boolean;
  productsUsed: number;
  articlesRead: number;
  searchesPerformed: number;
  remindersTriggered: number;
  scoreSnapshot?: number;
}

export interface WeeklyAggregation {
  weekStart: string;           // YYYY-MM-DD (Monday)
  weekEnd: string;             // YYYY-MM-DD (Sunday)
  workouts: number;
  avgProtein: number;
  proteinDaysMet: number;
  streak: number;              // max streak during this week
  completedDays: number;       // days with at least 1 activity
  searches: number;
  articlesRead: number;
  productsAdded: number;
  avgScore: number;
}

export interface AnalyticsSnapshot {
  daily: DailyAggregation;
  weekly: WeeklyAggregation;
  generatedAt: number;
}

// ─── Storage ──────────────────────────────────────────────

const KEYS = {
  DAILY_PREFIX: '@aura/analytics_daily_',
  WEEKLY_PREFIX: '@aura/analytics_weekly_',
  SNAPSHOT: '@aura/analytics_snapshot',
  EVENT_COUNTERS: '@aura/analytics_counters',
} as const;

// ─── Date Helpers ─────────────────────────────────────────

function getDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return getDateString(d);
}

function getWeekEnd(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Sunday
  d.setDate(diff);
  return getDateString(d);
}

// ─── Event Counters ───────────────────────────────────────

interface EventCounters {
  date: string;
  searches: number;
  articlesRead: number;
  remindersTriggered: number;
  productsAdded: number;
}

async function getEventCounters(): Promise<EventCounters> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.EVENT_COUNTERS);
    if (!raw) return createEmptyCounters();
    const counters: EventCounters = JSON.parse(raw);
    if (counters.date !== getDateString()) return createEmptyCounters();
    return counters;
  } catch {
    return createEmptyCounters();
  }
}

function createEmptyCounters(): EventCounters {
  return {
    date: getDateString(),
    searches: 0,
    articlesRead: 0,
    remindersTriggered: 0,
    productsAdded: 0,
  };
}

export async function incrementCounter(
  field: keyof Omit<EventCounters, 'date'>,
): Promise<void> {
  const counters = await getEventCounters();
  counters[field] = (counters[field] || 0) + 1;
  await AsyncStorage.setItem(KEYS.EVENT_COUNTERS, JSON.stringify(counters));
}

// ─── Daily Aggregation ────────────────────────────────────

export async function buildDailyAggregation(context: {
  workoutsToday: number;
  totalProtein: number;
  proteinGoalMet: boolean;
  currentScore?: number;
}): Promise<DailyAggregation> {
  const counters = await getEventCounters();
  const today = getDateString();

  const daily: DailyAggregation = {
    date: today,
    workoutsLogged: context.workoutsToday,
    totalProtein: Math.round(context.totalProtein),
    proteinGoalMet: context.proteinGoalMet,
    productsUsed: counters.productsAdded,
    articlesRead: counters.articlesRead,
    searchesPerformed: counters.searches,
    remindersTriggered: counters.remindersTriggered,
    scoreSnapshot: context.currentScore,
  };

  // Cache
  await AsyncStorage.setItem(KEYS.DAILY_PREFIX + today, JSON.stringify(daily));

  return daily;
}

// ─── Weekly Aggregation ───────────────────────────────────

export async function buildWeeklyAggregation(context: {
  weekWorkouts: number;
  weekProteinDays: number[];    // protein amounts per day
  maxStreak: number;
  activeDays: number;
  weekSearches: number;
  weekArticles: number;
  weekProducts: number;
  weekScores: number[];
}): Promise<WeeklyAggregation> {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  const avgProtein = context.weekProteinDays.length > 0
    ? Math.round(context.weekProteinDays.reduce((a, b) => a + b, 0) / context.weekProteinDays.length)
    : 0;

  const proteinTarget = 150; // Default
  const proteinDaysMet = context.weekProteinDays.filter((p) => p >= proteinTarget).length;

  const avgScore = context.weekScores.length > 0
    ? Math.round(context.weekScores.reduce((a, b) => a + b, 0) / context.weekScores.length)
    : 0;

  const weekly: WeeklyAggregation = {
    weekStart,
    weekEnd,
    workouts: context.weekWorkouts,
    avgProtein,
    proteinDaysMet,
    streak: context.maxStreak,
    completedDays: context.activeDays,
    searches: context.weekSearches,
    articlesRead: context.weekArticles,
    productsAdded: context.weekProducts,
    avgScore,
  };

  // Cache
  await AsyncStorage.setItem(KEYS.WEEKLY_PREFIX + weekStart, JSON.stringify(weekly));

  emitEvent('WEEKLY_SUMMARY_GENERATED', { weekStart, weekEnd, avgScore });
  log.info(`Weekly summary: ${weekStart} → ${weekEnd}, score: ${avgScore}`);

  return weekly;
}

// ─── Snapshot (most recent) ───────────────────────────────

export async function saveSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
  await AsyncStorage.setItem(KEYS.SNAPSHOT, JSON.stringify(snapshot));
  emitEvent('ANALYTICS_UPDATED', { timestamp: snapshot.generatedAt });
}

export async function loadSnapshot(): Promise<AnalyticsSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SNAPSHOT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Load Cached Aggregations ─────────────────────────────

export async function loadDailyAggregation(date?: string): Promise<DailyAggregation | null> {
  try {
    const d = date ?? getDateString();
    const raw = await AsyncStorage.getItem(KEYS.DAILY_PREFIX + d);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadWeeklyAggregation(weekStart?: string): Promise<WeeklyAggregation | null> {
  try {
    const ws = weekStart ?? getWeekStart();
    const raw = await AsyncStorage.getItem(KEYS.WEEKLY_PREFIX + ws);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
