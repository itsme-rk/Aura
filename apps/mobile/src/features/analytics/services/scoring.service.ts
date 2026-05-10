// ─── Scoring Service ──────────────────────────────────────
//
// Lightweight behavioral scoring from existing data.
// Score range: 0-100.
//
// Weighting:
//   Workout consistency: 40%
//   Protein consistency: 30%
//   Streak continuity:   20%
//   Weekly engagement:   10%
//

import { emitEvent } from '../../../services/events/emitEvent';
import { createLogger } from '../../../services/logger/logger';

const log = createLogger('Score');

// ─── Types ────────────────────────────────────────────────

export interface ScoreBreakdown {
  workoutScore: number;     // 0-100
  proteinScore: number;     // 0-100
  streakScore: number;      // 0-100
  engagementScore: number;  // 0-100
  totalScore: number;       // 0-100 (weighted)
}

export interface ScoreInput {
  // Weekly data
  workoutsThisWeek: number;
  targetWorkoutsPerWeek: number;   // typically 4-5
  daysProteinMet: number;          // out of 7
  workoutStreak: number;
  proteinStreak: number;
  activityStreak: number;
  // Activity signals
  hasLoggedToday: boolean;
  daysActiveThisWeek: number;      // out of 7
}

export interface ScoreTrend {
  current: number;
  previous: number;
  direction: 'up' | 'down' | 'stable';
  delta: number;
}

// ─── Weights ──────────────────────────────────────────────

const WEIGHTS = {
  workout: 0.40,
  protein: 0.30,
  streak: 0.20,
  engagement: 0.10,
} as const;

// ─── Score Calculators ────────────────────────────────────

function calcWorkoutScore(workoutsThisWeek: number, target: number): number {
  if (target <= 0) return 50;
  const ratio = workoutsThisWeek / target;
  // Cap at 100, floor at 0
  // Hitting target = 85, exceeding = up to 100
  if (ratio >= 1) return Math.min(100, 85 + (ratio - 1) * 30);
  // Below target: scale proportionally but don't punish too hard
  // 0 workouts = 10, half target = ~50
  return Math.max(10, Math.round(ratio * 85));
}

function calcProteinScore(daysProteinMet: number): number {
  // 7/7 = 100, 0/7 = 10
  if (daysProteinMet >= 7) return 100;
  if (daysProteinMet <= 0) return 10;
  return Math.round(10 + (daysProteinMet / 7) * 90);
}

function calcStreakScore(
  workoutStreak: number,
  proteinStreak: number,
  activityStreak: number,
): number {
  // Reward consistency. Streaks > 7 days = excellent.
  const avgStreak = (workoutStreak + proteinStreak + activityStreak) / 3;

  if (avgStreak >= 14) return 100;
  if (avgStreak >= 7) return 75 + ((avgStreak - 7) / 7) * 25;
  if (avgStreak >= 3) return 50 + ((avgStreak - 3) / 4) * 25;
  if (avgStreak >= 1) return 30 + ((avgStreak - 1) / 2) * 20;
  return 15; // No streaks — gentle floor
}

function calcEngagementScore(
  daysActiveThisWeek: number,
  hasLoggedToday: boolean,
): number {
  let score = Math.round((daysActiveThisWeek / 7) * 80);
  if (hasLoggedToday) score += 20;
  return Math.min(100, Math.max(10, score));
}

// ─── Main Score Calculator ────────────────────────────────

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const workoutScore = calcWorkoutScore(input.workoutsThisWeek, input.targetWorkoutsPerWeek);
  const proteinScore = calcProteinScore(input.daysProteinMet);
  const streakScore = calcStreakScore(
    input.workoutStreak,
    input.proteinStreak,
    input.activityStreak,
  );
  const engagementScore = calcEngagementScore(
    input.daysActiveThisWeek,
    input.hasLoggedToday,
  );

  const totalScore = Math.round(
    workoutScore * WEIGHTS.workout +
    proteinScore * WEIGHTS.protein +
    streakScore * WEIGHTS.streak +
    engagementScore * WEIGHTS.engagement,
  );

  const breakdown: ScoreBreakdown = {
    workoutScore,
    proteinScore,
    streakScore,
    engagementScore,
    totalScore: Math.min(100, Math.max(0, totalScore)),
  };

  log.info(`Score calculated: ${breakdown.totalScore}/100`);
  return breakdown;
}

// ─── Trend ────────────────────────────────────────────────

export function calculateTrend(current: number, previous: number): ScoreTrend {
  const delta = current - previous;
  let direction: ScoreTrend['direction'] = 'stable';
  if (delta > 2) direction = 'up';
  else if (delta < -2) direction = 'down';

  return { current, previous, direction, delta };
}

// ─── Score Label ──────────────────────────────────────────

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Fair';
  if (score >= 30) return 'Needs Work';
  return 'Getting Started';
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#4ADE80';  // green
  if (score >= 50) return '#FBBF24';  // yellow
  if (score >= 30) return '#F97316';  // orange
  return '#FF4D6A';                   // red
}
