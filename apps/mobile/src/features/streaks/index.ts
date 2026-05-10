// ─── Streaks Feature Barrel ───────────────────────────────

export * as streakService from './services/streak.service';
export {
  getLocalDateString,
  getYesterdayDateString,
  isSameDay,
  isConsecutiveDay,
  isStreakAlive,
  calculateWorkoutStreak,
  calculateProteinStreak,
  calculateActivityStreak,
  validateStreaks,
  fetchStreakData,
  saveStreakData,
  onWorkoutLogged,
  onProteinGoalReached,
} from './services/streak.service';
export type { StreakData } from './services/streak.service';
