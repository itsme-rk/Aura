// ─── AddProteinScreen ─────────────────────────────────────
//
// Quick protein/food entry screen. Allows manual input
// and selection from recent foods or default library.
//

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNutritionStore } from '../../../store/nutritionStore';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { MealType, MEAL_TYPE_LABELS } from '../../../types';
import { DEFAULT_FOODS, DefaultFood } from '../data/foodLibrary';
import { getTodayDateString } from '../services/nutrition.service';

interface AddProteinScreenProps {
  onComplete: () => void;
  onSearchFood: () => void;
}

export function AddProteinScreen({
  onComplete,
  onSearchFood,
}: AddProteinScreenProps) {
  const { user } = useAuth();
  const logFood = useNutritionStore((s) => s.logFood);
  const recentFoods = useNutritionStore((s) => s.recentFoods);

  // Form state
  const [foodName, setFoodName] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState<MealType>('snack');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;
    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name');
      return;
    }
    if (!protein || parseFloat(protein) < 0) {
      Alert.alert('Missing Info', 'Please enter protein amount');
      return;
    }

    setIsSaving(true);
    try {
      await logFood({
        userId: user.uid,
        foodName: foodName.trim(),
        protein: parseFloat(protein),
        calories: calories ? parseFloat(calories) : undefined,
        quantity: parseFloat(quantity) || 1,
        unit,
        mealType,
        date: getTodayDateString(),
        timestamp: Date.now(),
      });
      onComplete();
    } catch {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, foodName, protein, calories, quantity, unit, mealType, logFood, onComplete]);

  const handleQuickAdd = useCallback(async (food: DefaultFood) => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await logFood({
        userId: user.uid,
        foodName: food.name,
        protein: food.protein,
        calories: food.calories,
        quantity: 1,
        unit: food.servingUnit,
        mealType,
        date: getTodayDateString(),
        timestamp: Date.now(),
      });
      onComplete();
    } catch {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, mealType, logFood, onComplete]);

  const handleRecentAdd = useCallback(async (food: typeof recentFoods[0]) => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await logFood({
        userId: user.uid,
        foodName: food.foodName,
        protein: food.protein,
        calories: food.calories,
        quantity: food.quantity,
        unit: food.unit,
        date: getTodayDateString(),
        timestamp: Date.now(),
        foodLibraryId: food.foodLibraryId,
      });
      onComplete();
    } catch {
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, logFood, onComplete]);

  const fillFromDefault = (food: DefaultFood) => {
    setFoodName(food.name);
    setProtein(food.protein.toString());
    setCalories(food.calories?.toString() ?? '');
    setUnit(food.servingUnit);
    setQuantity('1');
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

  // Get top quick-add foods (high protein, popular)
  const quickFoods = DEFAULT_FOODS.filter((f) => f.protein >= 15).slice(0, 6);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onComplete}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Protein</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Meal Type Selector */}
          <View style={styles.mealTypeRow}>
            {mealTypes.map((mt) => (
              <TouchableOpacity
                key={mt}
                style={[
                  styles.mealTypeChip,
                  mealType === mt && styles.mealTypeChipActive,
                ]}
                onPress={() => setMealType(mt)}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === mt && styles.mealTypeTextActive,
                  ]}
                >
                  {MEAL_TYPE_LABELS[mt].split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Entry Form */}
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Food Name</Text>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g., Chicken Breast"
              placeholderTextColor={COLORS.textPlaceholder}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Protein (g) *</Text>
                <TextInput
                  style={styles.input}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="25"
                  placeholderTextColor={COLORS.textPlaceholder}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textPlaceholder}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={COLORS.textPlaceholder}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="serving"
                  placeholderTextColor={COLORS.textPlaceholder}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : '✓ Log Protein'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Food Library */}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={onSearchFood}
            activeOpacity={0.7}
          >
            <Text style={styles.searchBtnText}>🔍 Search Food Library</Text>
          </TouchableOpacity>

          {/* Recent Foods */}
          {recentFoods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Foods</Text>
              {recentFoods.slice(0, 5).map((food, idx) => (
                <TouchableOpacity
                  key={`recent_${idx}`}
                  style={styles.quickAddCard}
                  onPress={() => handleRecentAdd(food)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickAddInfo}>
                    <Text style={styles.quickAddName}>{food.foodName}</Text>
                    <Text style={styles.quickAddMeta}>
                      {food.quantity > 1 ? `${food.quantity}×` : ''}{food.unit}
                    </Text>
                  </View>
                  <View style={styles.quickAddProtein}>
                    <Text style={styles.quickAddProteinValue}>{food.protein}g</Text>
                    <Text style={styles.quickAddProteinLabel}>protein</Text>
                  </View>
                  <Text style={styles.quickAddAction}>+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Add (High Protein Defaults) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            {quickFoods.map((food, idx) => (
              <TouchableOpacity
                key={`quick_${idx}`}
                style={styles.quickAddCard}
                onPress={() => handleQuickAdd(food)}
                onLongPress={() => fillFromDefault(food)}
                activeOpacity={0.7}
              >
                <View style={styles.quickAddInfo}>
                  <Text style={styles.quickAddName}>{food.name}</Text>
                  <Text style={styles.quickAddMeta}>
                    {food.calories ? `${food.calories} kcal` : ''}
                  </Text>
                </View>
                <View style={styles.quickAddProtein}>
                  <Text style={styles.quickAddProteinValue}>{food.protein}g</Text>
                  <Text style={styles.quickAddProteinLabel}>protein</Text>
                </View>
                <Text style={styles.quickAddAction}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 60,
  },

  // Meal type
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  mealTypeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealTypeChipActive: {
    backgroundColor: COLORS.primary + '22',
    borderColor: COLORS.primary,
  },
  mealTypeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  mealTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Form
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  formLabel: {
    ...TYPOGRAPHY.smallBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputGroup: {
    flex: 1,
  },

  // Save button
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },

  // Search button
  searchBtn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  searchBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },

  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  // Quick Add Cards
  quickAddCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  quickAddInfo: {
    flex: 1,
  },
  quickAddName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  quickAddMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickAddProtein: {
    alignItems: 'flex-end',
    marginRight: SPACING.md,
  },
  quickAddProteinValue: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
  },
  quickAddProteinLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
  },
  quickAddAction: {
    ...TYPOGRAPHY.h3,
    color: COLORS.success,
    width: 28,
    textAlign: 'center',
  },
});
