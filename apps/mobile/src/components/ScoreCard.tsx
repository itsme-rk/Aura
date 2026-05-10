// ─── ScoreCard ────────────────────────────────────────────
//
// Lightweight score display with breakdown.
//

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useScoreStore } from '../../store/scoreStore';
import { getScoreLabel, getScoreColor } from '../../features/analytics/services/scoring.service';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

export function ScoreCard() {
  const currentScore = useScoreStore((s) => s.currentScore);
  const trend = useScoreStore((s) => s.trend);

  if (!currentScore) return null;

  const color = getScoreColor(currentScore.totalScore);
  const label = getScoreLabel(currentScore.totalScore);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aura Score</Text>
        {trend && (
          <Text style={[styles.trend, { color: trend.direction === 'up' ? COLORS.success : trend.direction === 'down' ? COLORS.error : COLORS.textMuted }]}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.delta)}
          </Text>
        )}
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>{currentScore.totalScore}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        <BreakdownBar label="Workout" value={currentScore.workoutScore} weight="40%" />
        <BreakdownBar label="Protein" value={currentScore.proteinScore} weight="30%" />
        <BreakdownBar label="Streaks" value={currentScore.streakScore} weight="20%" />
        <BreakdownBar label="Activity" value={currentScore.engagementScore} weight="10%" />
      </View>
    </View>
  );
}

function BreakdownBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color = getScoreColor(value);
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

// ─── WeeklySummaryCard ────────────────────────────────────

export function WeeklySummaryCard({ weekly }: {
  weekly: {
    workouts: number;
    avgProtein: number;
    proteinDaysMet: number;
    completedDays: number;
    avgScore: number;
  } | null;
}) {
  if (!weekly) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.weekGrid}>
        <WeekStat emoji="🏋️" value={String(weekly.workouts)} label="Workouts" />
        <WeekStat emoji="🥩" value={`${weekly.avgProtein}g`} label="Avg Protein" />
        <WeekStat emoji="✅" value={`${weekly.proteinDaysMet}/7`} label="Protein Days" />
        <WeekStat emoji="📅" value={`${weekly.completedDays}/7`} label="Active Days" />
      </View>
    </View>
  );
}

function WeekStat({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.weekStatItem}>
      <Text style={styles.weekStatEmoji}>{emoji}</Text>
      <Text style={styles.weekStatValue}>{value}</Text>
      <Text style={styles.weekStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  trend: { ...TYPOGRAPHY.captionBold },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginBottom: SPACING.md },
  score: { fontSize: 48, fontWeight: '700' },
  label: { ...TYPOGRAPHY.bodyBold },
  breakdown: { gap: SPACING.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  barLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted, width: 56 },
  barTrack: {
    flex: 1, height: 6, backgroundColor: COLORS.surface,
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barValue: { ...TYPOGRAPHY.smallBold, color: COLORS.textSecondary, width: 28, textAlign: 'right' },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  weekStatItem: { width: '47%', alignItems: 'center', paddingVertical: SPACING.sm },
  weekStatEmoji: { fontSize: 16, marginBottom: 2 },
  weekStatValue: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  weekStatLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
});
