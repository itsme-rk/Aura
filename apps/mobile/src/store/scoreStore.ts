// ─── Score Store ──────────────────────────────────────────
//
// Behavioral scoring state with daily/weekly tracking.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScoreBreakdown,
  ScoreInput,
  ScoreTrend,
  calculateScore,
  calculateTrend,
  getScoreLabel,
  getScoreColor,
} from '../features/analytics/services/scoring.service';
import { emitEvent } from '../services/events/emitEvent';

interface ScoreState {
  currentScore: ScoreBreakdown | null;
  previousScore: number;
  trend: ScoreTrend | null;
  lastCalculatedAt: number | null;

  calculate: (input: ScoreInput) => void;
  getLabel: () => string;
  getColor: () => string;
}

export const selectCurrentScore = (s: ScoreState) => s.currentScore;
export const selectTotalScore = (s: ScoreState) => s.currentScore?.totalScore ?? 0;
export const selectScoreTrend = (s: ScoreState) => s.trend;
export const selectScoreBreakdown = (s: ScoreState) => s.currentScore;

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      currentScore: null,
      previousScore: 0,
      trend: null,
      lastCalculatedAt: null,

      calculate: (input) => {
        const prev = get().currentScore?.totalScore ?? 0;
        const breakdown = calculateScore(input);
        const trend = calculateTrend(breakdown.totalScore, prev);

        set({
          currentScore: breakdown,
          previousScore: prev,
          trend,
          lastCalculatedAt: Date.now(),
        });

        emitEvent('SCORE_UPDATED', {
          score: breakdown.totalScore,
          trend: trend.direction,
        });
      },

      getLabel: () => {
        const score = get().currentScore?.totalScore ?? 0;
        return getScoreLabel(score);
      },

      getColor: () => {
        const score = get().currentScore?.totalScore ?? 0;
        return getScoreColor(score);
      },
    }),
    {
      name: '@aura/score',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentScore: state.currentScore,
        previousScore: state.previousScore,
        lastCalculatedAt: state.lastCalculatedAt,
      }),
    },
  ),
);
