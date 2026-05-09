// ─── WorkoutTodayScreen ───────────────────────────────────
//
// Home screen for workouts — shows today's plan, streak,
// quick-start options, and recent history.
//

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useWorkoutStore } from '../../../store';
import { useAuth } from '../../../hooks/useAuth';
import { getTodaysWorkout } from '../services/workout.service';
import { MUSCLE_GROUP_LABELS } from '../data/exerciseLibrary';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { WorkoutLog, WorkoutDay } from '../../../types';

interface WorkoutTodayScreenProps {
  onStartWorkout: (name?: string, planId?: string, dayLabel?: string) => void;
  onViewProgress: () => void;
  onViewExercise: (exerciseId: string) => void;
}

export function WorkoutTodayScreen({
  onStartWorkout,
  onViewProgress,
  onViewExercise,
}: WorkoutTodayScreenProps) {
  const { user } = useAuth();
  const activePlan = useWorkoutStore((s) => s.activePlan);
  const logs = useWorkoutStore((s) => s.logs);
  const streak = useWorkoutStore((s) => s.streak);
  const weeklyCount = useWorkoutStore((s) => s.weeklyCount);
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const fetchPlans = useWorkoutStore((s) => s.fetchPlans);
  const fetchLogs = useWorkoutStore((s) => s.fetchLogs);

  useEffect(() => {
    if (user?.uid) {
      fetchPlans(user.uid);
      fetchLogs(user.uid);
    }
  }, [user?.uid]);

  const todaysWorkout: WorkoutDay | null = activePlan
    ? getTodaysWorkout(activePlan)
    : null;

  const recentLogs = logs.slice(0, 5);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = dayNames[new Date().getDay()];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Workout</Text>
                <Text style={styles.dateText}>
                  {todayName}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity onPress={onViewProgress} style={styles.progressBtn}>
                <Text style={styles.progressBtnText}>Progress</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weeklyCount}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{logs.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Resume active session */}
            {activeSession && (
              <TouchableOpacity
                style={styles.resumeCard}
                onPress={() => onStartWorkout()}
                activeOpacity={0.7}
              >
                <View style={styles.resumeDot} />
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeTitle}>Session in progress</Text>
                  <Text style={styles.resumeSubtitle}>
                    {activeSession.name} · {activeSession.exercises.length} exercises
                  </Text>
                </View>
                <Text style={styles.resumeAction}>Resume →</Text>
              </TouchableOpacity>
            )}

            {/* Today's Plan */}
            {todaysWorkout && !todaysWorkout.isRestDay && (
              <View style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>Today's Plan</Text>
                  <Text style={styles.planLabel}>{todaysWorkout.label}</Text>
                </View>
                {todaysWorkout.exercises.map((ex, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.planExRow}
                    onPress={() => onViewExercise(ex.exerciseId)}
                  >
                    <Text style={styles.planExName}>{ex.name}</Text>
                    <Text style={styles.planExMeta}>
                      {ex.targetSets}×{ex.targetReps}
                      {ex.targetWeightKg ? ` @ ${ex.targetWeightKg}kg` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.startPlanBtn}
                  onPress={() =>
                    onStartWorkout(
                      todaysWorkout.label,
                      activePlan?.id,
                      todaysWorkout.label,
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.startPlanBtnText}>Start This Workout</Text>
                </TouchableOpacity>
              </View>
            )}

            {todaysWorkout?.isRestDay && (
              <View style={styles.restCard}>
                <Text style={styles.restEmoji}>😴</Text>
                <Text style={styles.restTitle}>Rest Day</Text>
                <Text style={styles.restSubtitle}>Recovery is part of the gains</Text>
              </View>
            )}

            {/* Quick Start */}
            {!activeSession && (
              <TouchableOpacity
                style={styles.quickStartBtn}
                onPress={() => onStartWorkout('Quick Workout')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickStartText}>+ Start Empty Workout</Text>
              </TouchableOpacity>
            )}

            {/* Repeat Last */}
            {logs.length > 0 && !activeSession && (
              <TouchableOpacity
                style={styles.repeatBtn}
                onPress={() =>
                  onStartWorkout(
                    logs[0].name,
                    logs[0].planId,
                    logs[0].dayLabel,
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={styles.repeatText}>↻ Repeat Last: {logs[0].name}</Text>
              </TouchableOpacity>
            )}

            {/* Recent History Header */}
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </>
        }
        data={recentLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LogCard log={item} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts yet. Start your first one!</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Log Card (inline) ───────────────────────────────────

function LogCard({ log }: { log: WorkoutLog }) {
  const date = new Date(log.completedAt);
  const totalSets = log.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length, 0);
  const totalVolume = log.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).reduce((v, s) => v + s.weightKg * s.reps, 0),
    0,
  );
  const muscles = Array.from(new Set(log.exercises.map((e) => e.muscleGroup)));

  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logName}>{log.name}</Text>
        <Text style={styles.logDate}>
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <View style={styles.logMeta}>
        <Text style={styles.logStat}>{log.durationMinutes}min</Text>
        <Text style={styles.logDivider}>·</Text>
        <Text style={styles.logStat}>{totalSets} sets</Text>
        <Text style={styles.logDivider}>·</Text>
        <Text style={styles.logStat}>{Math.round(totalVolume).toLocaleString()}kg vol</Text>
      </View>
      <View style={styles.logMuscles}>
        {muscles.slice(0, 4).map((m) => (
          <View key={m} style={[styles.musclePill, { backgroundColor: COLORS.muscle[m] + '22' }]}>
            <Text style={[styles.musclePillText, { color: COLORS.muscle[m] }]}>
              {MUSCLE_GROUP_LABELS[m]}
            </Text>
          </View>
        ))}
      </View>
      {log.mood && (
        <Text style={styles.logMood}>
          {['', '😫', '😕', '😐', '😊', '🔥'][log.mood]} Mood
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

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
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
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

  // Resume
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resumeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  resumeSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resumeAction: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },

  // Plan
  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  planExRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  planExName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
  },
  planExMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  startPlanBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  startPlanBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },

  // Rest
  restCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  restEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  restTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  restSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Quick start
  quickStartBtn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickStartText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },

  // Repeat
  repeatBtn: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  repeatText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.accent,
  },

  // Section title
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  // Log cards
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  logName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  logDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logStat: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  logDivider: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  logMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  musclePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  musclePillText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  logMood: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },

  // Empty
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
