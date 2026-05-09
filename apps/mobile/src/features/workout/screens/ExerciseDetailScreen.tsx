// ─── ExerciseDetailScreen ─────────────────────────────────
//
// Exercise info — instructions, muscle groups, equipment,
// and history of this exercise from past logs.
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
import { Exercise, WorkoutLog, ExerciseLog, MuscleGroup } from '../../../types';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '../data/exerciseLibrary';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface ExerciseDetailScreenProps {
  exerciseId: string;
  onBack: () => void;
}

export function ExerciseDetailScreen({ exerciseId, onBack }: ExerciseDetailScreenProps) {
  const exercises = useWorkoutStore((s) => s.exercises);
  const logs = useWorkoutStore((s) => s.logs);

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId],
  );

  // Pull history of this exercise from all logs
  const history = useMemo(() => {
    const entries: Array<{
      date: string;
      sets: { reps: number; weight: number }[];
      bestVolume: number;
    }> = [];

    for (const log of logs) {
      const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) continue;

      const completedSets = exLog.sets.filter((s) => s.isCompleted);
      if (completedSets.length === 0) continue;

      const bestVolume = Math.max(...completedSets.map((s) => s.weightKg * s.reps));

      entries.push({
        date: new Date(log.completedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        sets: completedSets.map((s) => ({ reps: s.reps, weight: s.weightKg })),
        bestVolume,
      });
    }

    return entries;
  }, [logs, exerciseId]);

  // Personal records
  const pr = useMemo(() => {
    let maxWeight = 0;
    let maxVolume = 0;
    let maxReps = 0;

    for (const log of logs) {
      const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exLog) continue;

      for (const set of exLog.sets) {
        if (!set.isCompleted) continue;
        if (set.weightKg > maxWeight) maxWeight = set.weightKg;
        if (set.reps > maxReps) maxReps = set.reps;
        const vol = set.weightKg * set.reps;
        if (vol > maxVolume) maxVolume = vol;
      }
    }

    return { maxWeight, maxReps, maxVolume: Math.round(maxVolume) };
  }, [logs, exerciseId]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Exercise not found</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
            </View>

            {/* Title */}
            <Text style={styles.title}>{exercise.name}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: COLORS.muscle[exercise.muscleGroup] + '22' }]}>
                <Text style={[styles.badgeText, { color: COLORS.muscle[exercise.muscleGroup] }]}>
                  {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                </Text>
              </View>
              {exercise.secondaryMuscles?.map((m) => (
                <View key={m} style={[styles.badge, { backgroundColor: COLORS.muscle[m] + '15' }]}>
                  <Text style={[styles.badgeText, { color: COLORS.muscle[m] }]}>
                    {MUSCLE_GROUP_LABELS[m]}
                  </Text>
                </View>
              ))}
              <View style={[styles.badge, { backgroundColor: COLORS.surfaceLight }]}>
                <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>
                  {EQUIPMENT_LABELS[exercise.equipment]}
                </Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.instructions}>{exercise.instructions}</Text>
            </View>

            {/* Personal Records */}
            {(pr.maxWeight > 0 || pr.maxReps > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Records</Text>
                <View style={styles.prRow}>
                  <View style={styles.prCard}>
                    <Text style={styles.prValue}>{pr.maxWeight}</Text>
                    <Text style={styles.prLabel}>Max Weight (kg)</Text>
                  </View>
                  <View style={styles.prCard}>
                    <Text style={styles.prValue}>{pr.maxReps}</Text>
                    <Text style={styles.prLabel}>Max Reps</Text>
                  </View>
                  <View style={styles.prCard}>
                    <Text style={styles.prValue}>{pr.maxVolume}</Text>
                    <Text style={styles.prLabel}>Best Set Vol</Text>
                  </View>
                </View>
              </View>
            )}

            {/* History header */}
            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
              History ({history.length} sessions)
            </Text>
          </>
        }
        data={history}
        keyExtractor={(_, i) => `hist_${i}`}
        renderItem={({ item }) => (
          <View style={styles.histCard}>
            <Text style={styles.histDate}>{item.date}</Text>
            <View style={styles.histSets}>
              {item.sets.map((s, i) => (
                <Text key={i} style={styles.histSet}>
                  {s.weight}kg × {s.reps}
                </Text>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No history for this exercise yet</Text>
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
  header: {
    paddingVertical: SPACING.md,
  },
  backText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.smallBold,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  instructions: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  prRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  prCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  prValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.accent,
  },
  prLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  histCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  histDate: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  histSets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  histSet: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
});
