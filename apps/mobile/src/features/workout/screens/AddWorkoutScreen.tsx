// ─── AddWorkoutScreen ─────────────────────────────────────
//
// Active workout session — add exercises, log sets, complete.
// This is the core logging interface.
//

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useWorkoutStore } from '../../../store';
import { useAuth } from '../../../hooks/useAuth';
import { ExercisePicker, SessionExerciseCard } from '../components';
import { Exercise, SetLog, ExerciseLog } from '../../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface AddWorkoutScreenProps {
  initialName?: string;
  initialPlanId?: string;
  initialDayLabel?: string;
  onComplete: () => void;
  onDiscard: () => void;
}

export function AddWorkoutScreen({
  initialName,
  initialPlanId,
  initialDayLabel,
  onComplete,
  onDiscard,
}: AddWorkoutScreenProps) {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [showFinish, setShowFinish] = useState(false);

  // Store
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const exercises = useWorkoutStore((s) => s.exercises);
  const recentExercises = useWorkoutStore((s) => s.recentExercises);
  const logs = useWorkoutStore((s) => s.logs);
  const isLoading = useWorkoutStore((s) => s.isLoading);

  const startSession = useWorkoutStore((s) => s.startSession);
  const addExerciseToSession = useWorkoutStore((s) => s.addExerciseToSession);
  const updateSetInSession = useWorkoutStore((s) => s.updateSetInSession);
  const addSetToSession = useWorkoutStore((s) => s.addSetToSession);
  const removeSetFromSession = useWorkoutStore((s) => s.removeSetFromSession);
  const removeExerciseFromSession = useWorkoutStore((s) => s.removeExerciseFromSession);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const discardSession = useWorkoutStore((s) => s.discardSession);

  // Start session if none active
  useEffect(() => {
    if (!activeSession) {
      startSession(
        initialName ?? 'Workout',
        initialPlanId,
        initialDayLabel,
      );

      // If repeating last workout, pre-fill exercises
      if (initialPlanId && logs.length > 0) {
        const lastLog = logs.find(
          (l) => l.planId === initialPlanId && l.dayLabel === initialDayLabel,
        );
        if (lastLog) {
          lastLog.exercises.forEach((ex) => {
            addExerciseToSession(ex.exerciseId, ex.name, ex.muscleGroup);
          });
        }
      }
    }
  }, []);

  const handleAddExercise = useCallback((exercise: Exercise) => {
    addExerciseToSession(exercise.id, exercise.name, exercise.muscleGroup);
  }, [addExerciseToSession]);

  const handleFinish = useCallback(async () => {
    if (!user?.uid || !activeSession) return;

    try {
      await completeSession(user.uid, mood, notes.trim() || undefined);
      onComplete();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save workout');
    }
  }, [user?.uid, activeSession, mood, notes, completeSession, onComplete]);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Discard Workout?',
      'All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardSession();
            onDiscard();
          },
        },
      ],
    );
  }, [discardSession, onDiscard]);

  if (!activeSession) return null;

  const elapsed = Math.round((Date.now() - activeSession.startedAt) / 60000);
  const completedSetsCount = activeSession.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
    0,
  );

  const moods = [
    { value: 1, emoji: '😫' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '😊' },
    { value: 5, emoji: '🔥' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleDiscard}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.sessionName}>{activeSession.name}</Text>
            <Text style={styles.timer}>{elapsed} min · {completedSetsCount} sets</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFinish(true)}
            style={styles.finishBtn}
          >
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise list */}
        <FlatList
          data={activeSession.exercises}
          keyExtractor={(_, i) => `ex_${i}`}
          renderItem={({ item, index }) => (
            <SessionExerciseCard
              exercise={item}
              exerciseIndex={index}
              onUpdateSet={updateSetInSession}
              onAddSet={addSetToSession}
              onRemoveSet={removeSetFromSession}
              onRemoveExercise={removeExerciseFromSession}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button below to add exercises
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {/* Add exercise button */}
              <TouchableOpacity
                style={styles.addExerciseBtn}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addExerciseText}>+ Add Exercise</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Finish Sheet */}
        {showFinish && (
          <View style={styles.finishSheet}>
            <View style={styles.finishSheetCard}>
              <Text style={styles.finishSheetTitle}>Finish Workout</Text>

              {/* Mood */}
              <Text style={styles.finishLabel}>How did it feel?</Text>
              <View style={styles.moodRow}>
                {moods.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    onPress={() => setMood(m.value)}
                    style={[
                      styles.moodBtn,
                      mood === m.value && styles.moodBtnActive,
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.finishLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="How was your workout?"
                placeholderTextColor={COLORS.textPlaceholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                selectionColor={COLORS.primary}
              />

              {/* Summary */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  {activeSession.exercises.length} exercises · {completedSetsCount} sets · {elapsed} min
                </Text>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleFinish}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>
                  {isLoading ? 'Saving...' : 'Save Workout'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelFinishBtn}
                onPress={() => setShowFinish(false)}
              >
                <Text style={styles.cancelFinishText}>Keep Going</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        exercises={exercises}
        recentExercises={recentExercises}
        visible={showPicker}
        onSelect={handleAddExercise}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  discardText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  topCenter: {
    alignItems: 'center',
  },
  sessionName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  timer: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  finishText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.black,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textMuted,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },

  // Footer
  footer: {
    marginTop: SPACING.md,
  },
  addExerciseBtn: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  addExerciseText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },

  // Finish sheet
  finishSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  finishSheetCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  finishSheetTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  finishLabel: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  moodEmoji: {
    fontSize: 24,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  summaryRow: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  saveBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  cancelFinishBtn: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelFinishText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
  },
});
