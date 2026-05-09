// ─── SessionExerciseCard ──────────────────────────────────
//
// Card for one exercise in an active workout session.
// Contains header + set rows + add set button.
//

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ExerciseLog, SetLog } from '../../../types';
import { SetRow } from './SetRow';
import { MUSCLE_GROUP_LABELS } from '../data/exerciseLibrary';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface SessionExerciseCardProps {
  exercise: ExerciseLog;
  exerciseIndex: number;
  onUpdateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
}

export function SessionExerciseCard({
  exercise,
  exerciseIndex,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
}: SessionExerciseCardProps) {
  const completedSets = exercise.sets.filter((s) => s.isCompleted).length;
  const totalSets = exercise.sets.length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: COLORS.muscle[exercise.muscleGroup] + '22' }]}>
              <Text style={[styles.badgeText, { color: COLORS.muscle[exercise.muscleGroup] }]}>
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
              </Text>
            </View>
            <Text style={styles.setsCount}>
              {completedSets}/{totalSets} sets
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onRemoveExercise(exerciseIndex)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.removeExercise}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, { width: 28 }]}>Set</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colHeader, { width: 28 }]}></Text>
        <Text style={[styles.colHeader, { width: 28 }]}>✓</Text>
        <Text style={[styles.colHeader, { width: 24 }]}></Text>
      </View>

      {/* Sets */}
      {exercise.sets.map((set, setIndex) => (
        <SetRow
          key={setIndex}
          set={set}
          onUpdate={(data) => onUpdateSet(exerciseIndex, setIndex, data)}
          onRemove={() => onRemoveSet(exerciseIndex, setIndex)}
        />
      ))}

      {/* Add Set */}
      <TouchableOpacity
        style={styles.addSetBtn}
        onPress={() => onAddSet(exerciseIndex)}
        activeOpacity={0.7}
      >
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  exerciseName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  setsCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  removeExercise: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    padding: SPACING.xs,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.xs,
  },
  colHeader: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  addSetBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addSetText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
});
