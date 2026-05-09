// ─── Exercise Picker ──────────────────────────────────────
//
// Dropdown-based exercise selector grouped by muscle group.
// Supports search + recent exercise quick-add.
//

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Exercise, MuscleGroup, RecentExercise } from '../../../types';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  searchExercises,
  getExercisesByMuscle,
} from '../data/exerciseLibrary';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface ExercisePickerProps {
  exercises: Exercise[];
  recentExercises?: RecentExercise[];
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({
  exercises,
  recentExercises = [],
  visible,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all' | 'recent'>('all');

  const muscleGroups = useMemo(() => {
    const groups = Object.keys(getExercisesByMuscle(exercises)) as MuscleGroup[];
    return groups;
  }, [exercises]);

  const filtered = useMemo(() => {
    let list = exercises;

    if (selectedMuscle === 'recent') {
      const recentIds = new Set(recentExercises.map((r) => r.exerciseId));
      list = exercises.filter((e) => recentIds.has(e.id));
    } else if (selectedMuscle !== 'all') {
      list = exercises.filter((e) => e.muscleGroup === selectedMuscle);
    }

    return searchExercises(list, query);
  }, [exercises, query, selectedMuscle, recentExercises]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setQuery('');
    setSelectedMuscle('all');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Exercise</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={COLORS.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            selectionColor={COLORS.primary}
          />
        </View>

        {/* Muscle Group Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'recent', ...muscleGroups] as const}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedMuscle(item as any)}
              style={[
                styles.filterChip,
                selectedMuscle === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMuscle === item && styles.filterChipTextActive,
                ]}
              >
                {item === 'all'
                  ? 'All'
                  : item === 'recent'
                    ? '⏱ Recent'
                    : MUSCLE_GROUP_LABELS[item as MuscleGroup]}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Exercise List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No exercises found</Text>
          }
          renderItem={({ item }) => {
            const recent = recentExercises.find((r) => r.exerciseId === item.id);
            return (
              <TouchableOpacity
                style={styles.exerciseRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <View style={[styles.badge, { backgroundColor: COLORS.muscle[item.muscleGroup] + '22' }]}>
                      <Text style={[styles.badgeText, { color: COLORS.muscle[item.muscleGroup] }]}>
                        {MUSCLE_GROUP_LABELS[item.muscleGroup]}
                      </Text>
                    </View>
                    <Text style={styles.equipmentText}>
                      {EQUIPMENT_LABELS[item.equipment]}
                    </Text>
                  </View>
                </View>
                {recent && (
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentText}>
                      {recent.lastSets}×{recent.lastReps} @ {recent.lastWeight}kg
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  closeBtn: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textMuted,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  filterList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  exerciseMeta: {
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
  equipmentText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  recentInfo: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  recentText: {
    ...TYPOGRAPHY.small,
    color: COLORS.accent,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
});
