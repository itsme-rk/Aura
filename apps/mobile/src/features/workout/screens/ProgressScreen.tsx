// ─── ProgressScreen ───────────────────────────────────────
//
// Workout progress overview — stats, summaries, recent PRs.
// Data only, no charts (charts to be added later).
//

import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useWorkoutStore } from '../../../store';
import { buildWorkoutSummary } from '../services/workout.service';
import { MUSCLE_GROUP_LABELS } from '../data/exerciseLibrary';
import { WorkoutSummary, MuscleGroup } from '../../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface ProgressScreenProps {
  onBack: () => void;
  onViewExercise: (exerciseId: string) => void;
}

export function ProgressScreen({ onBack, onViewExercise }: ProgressScreenProps) {
  const logs = useWorkoutStore((s) => s.logs);
  const streak = useWorkoutStore((s) => s.streak);
  const weeklyCount = useWorkoutStore((s) => s.weeklyCount);
  const recentExercises = useWorkoutStore((s) => s.recentExercises);

  // Build summaries
  const summaries = useMemo(() => logs.map(buildWorkoutSummary), [logs]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalWorkouts = logs.length;
    const totalVolume = summaries.reduce((sum, s) => sum + s.totalVolume, 0);
    const totalDuration = summaries.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalSets = summaries.reduce((sum, s) => sum + s.totalSets, 0);

    // Muscle group frequency
    const muscleFreq = new Map<MuscleGroup, number>();
    for (const s of summaries) {
      for (const m of s.muscleGroups) {
        muscleFreq.set(m, (muscleFreq.get(m) ?? 0) + 1);
      }
    }
    const topMuscles = Array.from(muscleFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Weekly volume (last 4 weeks)
    const weeklyVolumes: { label: string; volume: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7 + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekVol = summaries
        .filter((s) => {
          const d = new Date(s.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, s) => sum + s.totalVolume, 0);

      const label = i === 0
        ? 'This Week'
        : i === 1
          ? 'Last Week'
          : `${i}w ago`;

      weeklyVolumes.unshift({ label, volume: weekVol });
    }

    return {
      totalWorkouts,
      totalVolume,
      totalDuration,
      totalSets,
      topMuscles,
      weeklyVolumes,
    };
  }, [summaries, logs]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Progress</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Overview Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(stats.totalVolume / 1000)}k</Text>
                <Text style={styles.statLabel}>Total Vol (kg)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalDuration}</Text>
                <Text style={styles.statLabel}>Total Min</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalSets}</Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weeklyCount}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>

            {/* Weekly Volume */}
            <Text style={styles.sectionTitle}>Weekly Volume</Text>
            <View style={styles.weeklyRow}>
              {stats.weeklyVolumes.map((w, i) => {
                const max = Math.max(...stats.weeklyVolumes.map((v) => v.volume), 1);
                const height = Math.max((w.volume / max) * 80, 4);
                return (
                  <View key={i} style={styles.weekCol}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: i === stats.weeklyVolumes.length - 1
                              ? COLORS.primary
                              : COLORS.surfaceLight,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.weekLabel}>{w.label}</Text>
                    <Text style={styles.weekValue}>{Math.round(w.volume / 1000)}k</Text>
                  </View>
                );
              })}
            </View>

            {/* Top Muscles */}
            <Text style={styles.sectionTitle}>Muscle Frequency</Text>
            <View style={styles.muscleGrid}>
              {stats.topMuscles.map(([muscle, count]) => (
                <View
                  key={muscle}
                  style={[
                    styles.muscleCard,
                    { borderLeftColor: COLORS.muscle[muscle] },
                  ]}
                >
                  <Text style={[styles.muscleCount, { color: COLORS.muscle[muscle] }]}>
                    {count}
                  </Text>
                  <Text style={styles.muscleName}>
                    {MUSCLE_GROUP_LABELS[muscle]}
                  </Text>
                </View>
              ))}
            </View>

            {/* Recent Exercises */}
            <Text style={styles.sectionTitle}>Recently Used</Text>
          </>
        }
        data={recentExercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recentRow}
            onPress={() => onViewExercise(item.exerciseId)}
            activeOpacity={0.7}
          >
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>{item.name}</Text>
              <View style={[styles.recentBadge, { backgroundColor: COLORS.muscle[item.muscleGroup] + '22' }]}>
                <Text style={[styles.recentBadgeText, { color: COLORS.muscle[item.muscleGroup] }]}>
                  {MUSCLE_GROUP_LABELS[item.muscleGroup]}
                </Text>
              </View>
            </View>
            <Text style={styles.recentStats}>
              {item.lastSets}×{item.lastReps} @ {item.lastWeight}kg
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Start logging to see your progress</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  backText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // Section
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },

  // Weekly volume
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.sm,
    minHeight: 4,
  },
  weekLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  weekValue: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.textSecondary,
  },

  // Muscles
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  muscleCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  muscleCount: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  muscleName: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Recent
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recentName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  recentBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  recentBadgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  recentStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
  },

  // Empty
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
