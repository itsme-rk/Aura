// ─── NutritionTodayScreen ─────────────────────────────────
//
// Main nutrition dashboard — shows protein progress,
// today's food logs, and quick actions.
//

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNutritionStore } from '../../../store/nutritionStore';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { NutritionLog, MEAL_TYPE_LABELS, MealType } from '../../../types';

interface NutritionTodayScreenProps {
  onAddProtein: () => void;
  onSearchFood: () => void;
}

export function NutritionTodayScreen({
  onAddProtein,
  onSearchFood,
}: NutritionTodayScreenProps) {
  const { user } = useAuth();
  const todayLogs = useNutritionStore((s) => s.todayLogs);
  const todayProtein = useNutritionStore((s) => s.todayProtein);
  const todayCalories = useNutritionStore((s) => s.todayCalories);
  const goals = useNutritionStore((s) => s.goals);
  const proteinGoalMet = useNutritionStore((s) => s.proteinGoalMet);
  const recentFoods = useNutritionStore((s) => s.recentFoods);
  const fetchTodayLogs = useNutritionStore((s) => s.fetchTodayLogs);
  const repeatLastMeal = useNutritionStore((s) => s.repeatLastMeal);
  const deleteLog = useNutritionStore((s) => s.deleteLog);

  useEffect(() => {
    if (user?.uid) {
      fetchTodayLogs(user.uid);
    }
  }, [user?.uid]);

  const proteinProgress = Math.min(1, todayProtein / goals.dailyProteinTarget);
  const proteinRemaining = Math.max(0, goals.dailyProteinTarget - todayProtein);

  const handleRepeatLast = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await repeatLastMeal(user.uid);
    } catch {
      Alert.alert('Error', 'Failed to repeat last meal');
    }
  }, [user?.uid, repeatLastMeal]);

  const handleDeleteLog = useCallback((logId: string, foodName: string) => {
    Alert.alert(
      'Delete Entry',
      `Remove "${foodName}" from today's log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLog(logId) },
      ],
    );
  }, [deleteLog]);

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
                <Text style={styles.greeting}>Nutrition</Text>
                <Text style={styles.dateText}>
                  {todayName}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Protein Progress Ring */}
            <View style={styles.progressCard}>
              <View style={styles.progressRing}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      borderColor: proteinGoalMet ? COLORS.success : COLORS.primary,
                      borderTopColor: 'transparent',
                      transform: [{ rotate: `${proteinProgress * 360}deg` }],
                    },
                  ]}
                />
                <View style={styles.progressInner}>
                  <Text style={[styles.progressValue, proteinGoalMet && styles.goalMetText]}>
                    {Math.round(todayProtein)}g
                  </Text>
                  <Text style={styles.progressLabel}>protein</Text>
                </View>
              </View>

              <View style={styles.progressStats}>
                <View style={styles.progressStatRow}>
                  <Text style={styles.progressStatLabel}>Target</Text>
                  <Text style={styles.progressStatValue}>{goals.dailyProteinTarget}g</Text>
                </View>
                <View style={styles.progressStatRow}>
                  <Text style={styles.progressStatLabel}>Remaining</Text>
                  <Text style={[
                    styles.progressStatValue,
                    proteinGoalMet && { color: COLORS.success },
                  ]}>
                    {proteinGoalMet ? '✅ Goal Met!' : `${Math.round(proteinRemaining)}g`}
                  </Text>
                </View>
                <View style={styles.progressStatRow}>
                  <Text style={styles.progressStatLabel}>Calories</Text>
                  <Text style={styles.progressStatValue}>{todayCalories} kcal</Text>
                </View>
                <View style={styles.progressStatRow}>
                  <Text style={styles.progressStatLabel}>Entries</Text>
                  <Text style={styles.progressStatValue}>{todayLogs.length}</Text>
                </View>
              </View>
            </View>

            {/* Protein Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, proteinProgress * 100)}%`,
                      backgroundColor: proteinGoalMet ? COLORS.success : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressBarLabel}>
                {Math.round(proteinProgress * 100)}% of daily target
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onAddProtein}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryBtnIcon}>+</Text>
                <Text style={styles.primaryBtnText}>Add Protein</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSearchFood}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>🔍 Search Food</Text>
              </TouchableOpacity>
            </View>

            {/* Repeat Last */}
            {recentFoods.length > 0 && (
              <TouchableOpacity
                style={styles.repeatBtn}
                onPress={handleRepeatLast}
                activeOpacity={0.7}
              >
                <Text style={styles.repeatText}>
                  ↻ Repeat: {recentFoods[0].foodName} ({recentFoods[0].protein}g protein)
                </Text>
              </TouchableOpacity>
            )}

            {/* Recent Quick-Add */}
            {recentFoods.length > 1 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>Recent Foods</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recentFoods.slice(1, 8)}
                  keyExtractor={(item, idx) => `${item.foodName}_${idx}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.recentChip}
                      onPress={() => {
                        if (!user?.uid) return;
                        const today = new Date().toISOString().split('T')[0];
                        useNutritionStore.getState().logFood({
                          userId: user.uid,
                          foodName: item.foodName,
                          protein: item.protein,
                          calories: item.calories,
                          quantity: item.quantity,
                          unit: item.unit,
                          date: today,
                          timestamp: Date.now(),
                          foodLibraryId: item.foodLibraryId,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recentChipText}>{item.foodName}</Text>
                      <Text style={styles.recentChipMeta}>{item.protein}g</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Today's Log Header */}
            <Text style={styles.sectionTitle}>Today's Log</Text>
          </>
        }
        data={todayLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FoodLogCard
            log={item}
            onDelete={() => handleDeleteLog(item.id, item.foodName)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No food logged today</Text>
            <Text style={styles.emptySubtext}>Tap "Add Protein" to start tracking</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Food Log Card ────────────────────────────────────────

function FoodLogCard({
  log,
  onDelete,
}: {
  log: NutritionLog;
  onDelete: () => void;
}) {
  const time = new Date(log.timestamp);
  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const totalProtein = Math.round(log.protein * log.quantity * 10) / 10;
  const totalCalories = log.calories
    ? Math.round(log.calories * log.quantity)
    : null;

  return (
    <TouchableOpacity
      style={styles.logCard}
      onLongPress={onDelete}
      activeOpacity={0.8}
    >
      <View style={styles.logHeader}>
        <View style={styles.logInfo}>
          <Text style={styles.logName}>{log.foodName}</Text>
          <Text style={styles.logMeta}>
            {log.quantity > 1 ? `${log.quantity} × ` : ''}
            {timeStr}
            {log.mealType ? ` · ${MEAL_TYPE_LABELS[log.mealType]?.split(' ')[0]}` : ''}
          </Text>
        </View>
        <View style={styles.logProtein}>
          <Text style={styles.logProteinValue}>{totalProtein}g</Text>
          <Text style={styles.logProteinLabel}>protein</Text>
        </View>
      </View>
      {totalCalories !== null && (
        <Text style={styles.logCalories}>{totalCalories} kcal</Text>
      )}
    </TouchableOpacity>
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

  // Progress Card
  progressCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  progressFill: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
  },
  progressInner: {
    alignItems: 'center',
  },
  progressValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  progressLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  goalMetText: {
    color: COLORS.success,
  },
  progressStats: {
    flex: 1,
  },
  progressStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  progressStatValue: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.text,
  },

  // Progress Bar
  progressBarContainer: {
    marginBottom: SPACING.lg,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  primaryBtnIcon: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '700',
  },
  primaryBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.text,
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

  // Recent Foods
  recentSection: {
    marginBottom: SPACING.lg,
  },
  recentChip: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  recentChipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  recentChipMeta: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.primary,
    marginTop: 2,
  },

  // Section Title
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  // Log Cards
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
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  logName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.text,
  },
  logMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logProtein: {
    alignItems: 'flex-end',
  },
  logProteinValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  logProteinLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  logCalories: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
